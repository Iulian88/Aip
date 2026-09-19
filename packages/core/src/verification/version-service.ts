import { VerificationValidationError } from "./errors.js";
import { isConcludedState } from "./identifiers.js";
import { isVerificationMaterialChange } from "./material-change.js";
import { VerificationValidator } from "./validator.js";
import { verificationNfcTrim } from "./identifiers.js";
import type {
  Verification,
  VerificationProvenance,
  VerificationScope,
  VerificationMethod,
} from "./types.js";

function bumpPatch(version: string): string {
  const parts = version.split(".").map((p) => Number(p));
  return `${parts[0] ?? 0}.${parts[1] ?? 0}.${(parts[2] ?? 0) + 1}`;
}

export interface VerificationContentUpdate {
  readonly summary: string;
  readonly description: string;
  readonly scope: VerificationScope;
  readonly protocol_ref: string;
  readonly verification_method: VerificationMethod;
  readonly verification_context: string;
  readonly verification_rationale: string;
  readonly provenance: VerificationProvenance;
  readonly claim_refs?: readonly string[];
  readonly evidence_refs?: readonly string[];
  readonly grade_refs?: readonly string[];
  readonly contradiction_refs?: readonly string[];
  readonly negative_result_refs?: readonly string[];
  readonly artifact_ref?: string;
}

/**
 * SCI-006 §15 — material bump; after conclusion, new version returns to planned.
 */
export class VerificationVersionService {
  private readonly validator = new VerificationValidator();

  applyMaterialUpdate(
    prior: Verification,
    nextContent: VerificationContentUpdate,
  ): Verification {
    const afterConclusion = isConcludedState(prior.record_state);

    const candidate: Verification = Object.freeze({
      ...prior,
      summary: verificationNfcTrim(nextContent.summary),
      description: verificationNfcTrim(nextContent.description),
      scope: Object.freeze({
        domain_context: verificationNfcTrim(nextContent.scope.domain_context),
        bounds: verificationNfcTrim(nextContent.scope.bounds),
        exclusions: verificationNfcTrim(nextContent.scope.exclusions),
      }),
      protocol_ref: verificationNfcTrim(nextContent.protocol_ref),
      verification_method: nextContent.verification_method,
      verification_context: verificationNfcTrim(nextContent.verification_context),
      verification_rationale: verificationNfcTrim(nextContent.verification_rationale),
      provenance: nextContent.provenance,
      ...(nextContent.claim_refs
        ? { claim_refs: Object.freeze([...nextContent.claim_refs]) }
        : {}),
      ...(nextContent.evidence_refs
        ? { evidence_refs: Object.freeze([...nextContent.evidence_refs]) }
        : {}),
      ...(nextContent.grade_refs
        ? { grade_refs: Object.freeze([...nextContent.grade_refs]) }
        : {}),
      ...(nextContent.contradiction_refs
        ? { contradiction_refs: Object.freeze([...nextContent.contradiction_refs]) }
        : {}),
      ...(nextContent.negative_result_refs
        ? { negative_result_refs: Object.freeze([...nextContent.negative_result_refs]) }
        : {}),
      ...(nextContent.artifact_ref !== undefined
        ? { artifact_ref: verificationNfcTrim(nextContent.artifact_ref) }
        : prior.artifact_ref
          ? { artifact_ref: prior.artifact_ref }
          : {}),
      verification_version: bumpPatch(prior.verification_version),
      ...(afterConclusion
        ? {
            record_state: "planned" as const,
            verification_outcome: "pending" as const,
            record_transition_log: Object.freeze([]),
          }
        : {
            record_transition_log: Object.freeze([...(prior.record_transition_log ?? [])]),
          }),
    });

    if (!isVerificationMaterialChange(prior, candidate)) {
      throw new VerificationValidationError(
        "F11",
        "No material change detected; refusing version bump",
      );
    }

    this.validator.validate(candidate);
    return candidate;
  }

  assertNoInPlaceOverwrite(prior: Verification, candidate: Verification): void {
    if (prior.verification_id !== candidate.verification_id) {
      throw new VerificationValidationError(
        "F_ID_STABLE",
        "verification_id must remain stable",
      );
    }
    if (
      isConcludedState(prior.record_state) &&
      prior.verification_version === candidate.verification_version &&
      isVerificationMaterialChange(prior, candidate)
    ) {
      throw new VerificationValidationError(
        "F11",
        "In-place material overwrite of concluded verification_version is non-conformant",
      );
    }
  }
}

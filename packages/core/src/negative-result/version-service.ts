import { NegativeResultValidationError } from "./errors.js";
import { isNegativeResultMaterialChange } from "./material-change.js";
import { NegativeResultValidator } from "./validator.js";
import { negativeResultNfcTrim } from "./identifiers.js";
import type {
  NegativeResult,
  NegativeResultProvenance,
  NegativeResultScope,
} from "./types.js";

function bumpPatch(version: string): string {
  const parts = version.split(".").map((p) => Number(p));
  return `${parts[0] ?? 0}.${parts[1] ?? 0}.${(parts[2] ?? 0) + 1}`;
}

export interface NegativeResultContentUpdate {
  readonly summary: string;
  readonly description: string;
  readonly expected_observation: string;
  readonly observed_absence: string;
  readonly scope: NegativeResultScope;
  readonly protocol_ref: string;
  readonly sensitivity_context: string;
  readonly provenance: NegativeResultProvenance;
  readonly claim_refs?: readonly string[];
  readonly evidence_refs?: readonly string[];
  readonly contradiction_refs?: readonly string[];
  readonly verification_refs?: readonly string[];
}

export class NegativeResultVersionService {
  private readonly validator = new NegativeResultValidator();

  applyMaterialUpdate(
    prior: NegativeResult,
    nextContent: NegativeResultContentUpdate,
  ): NegativeResult {
    const candidate: NegativeResult = Object.freeze({
      ...prior,
      summary: negativeResultNfcTrim(nextContent.summary),
      description: negativeResultNfcTrim(nextContent.description),
      expected_observation: negativeResultNfcTrim(nextContent.expected_observation),
      observed_absence: negativeResultNfcTrim(nextContent.observed_absence),
      scope: Object.freeze({
        domain_context: negativeResultNfcTrim(nextContent.scope.domain_context),
        bounds: negativeResultNfcTrim(nextContent.scope.bounds),
        exclusions: negativeResultNfcTrim(nextContent.scope.exclusions),
      }),
      protocol_ref: negativeResultNfcTrim(nextContent.protocol_ref),
      sensitivity_context: negativeResultNfcTrim(nextContent.sensitivity_context),
      provenance: nextContent.provenance,
      ...(nextContent.claim_refs
        ? { claim_refs: Object.freeze([...nextContent.claim_refs]) }
        : {}),
      ...(nextContent.evidence_refs
        ? { evidence_refs: Object.freeze([...nextContent.evidence_refs]) }
        : {}),
      ...(nextContent.contradiction_refs
        ? { contradiction_refs: Object.freeze([...nextContent.contradiction_refs]) }
        : {}),
      ...(nextContent.verification_refs
        ? { verification_refs: Object.freeze([...nextContent.verification_refs]) }
        : {}),
      negative_result_version: bumpPatch(prior.negative_result_version),
      record_transition_log: Object.freeze([...(prior.record_transition_log ?? [])]),
    });

    if (!isNegativeResultMaterialChange(prior, candidate)) {
      throw new NegativeResultValidationError(
        "F9",
        "No material change detected; refusing version bump",
      );
    }

    this.validator.validate(candidate);
    return candidate;
  }

  assertNoInPlaceOverwrite(prior: NegativeResult, candidate: NegativeResult): void {
    if (prior.negative_result_id !== candidate.negative_result_id) {
      throw new NegativeResultValidationError(
        "F_ID_STABLE",
        "negative_result_id must remain stable",
      );
    }
    if (
      prior.record_state === "registered" &&
      prior.negative_result_version === candidate.negative_result_version &&
      isNegativeResultMaterialChange(prior, candidate)
    ) {
      throw new NegativeResultValidationError(
        "F9",
        "In-place material overwrite of registered negative_result_version is non-conformant",
      );
    }
  }
}

import { ClaimValidationError } from "./errors.js";
import { isMaterialChange } from "./material-change.js";
import { ClaimValidator } from "./validator.js";
import { nfcTrim } from "./identifiers.js";
import type { Claim, ClaimScope } from "./types.js";

function bumpPatch(version: string): string {
  const parts = version.split(".").map((p) => Number(p));
  const major = parts[0] ?? 0;
  const minor = parts[1] ?? 0;
  const patch = parts[2] ?? 0;
  return `${major}.${minor}.${patch + 1}`;
}

/**
 * Claim version service — SCI-001 §12.8 / §14 / §15.
 * CODE-AUDIT P-001: material updates bump version only; preserve history and Standing.
 */
export class ClaimVersionService {
  private readonly validator = new ClaimValidator();

  applyMaterialUpdate(
    prior: Claim,
    nextContent: { proposition: string; scope: ClaimScope },
  ): Claim {
    if (!isMaterialChange(prior, nextContent)) {
      throw new ClaimValidationError(
        "F5",
        "No material change detected; refusing version bump",
      );
    }

    const updated: Claim = Object.freeze({
      claim_id: prior.claim_id,
      ontology_ref: prior.ontology_ref,
      spec_ref: prior.spec_ref,
      claim_version: bumpPatch(prior.claim_version),
      proposition: nfcTrim(nextContent.proposition),
      scope: Object.freeze({
        domain_context: nfcTrim(nextContent.scope.domain_context),
        bounds: nfcTrim(nextContent.scope.bounds),
        exclusions: nfcTrim(nextContent.scope.exclusions),
      }),
      // P-001: no artificial Standing reset
      standing: prior.standing,
      ethics_constraint_marker: "non_clinical" as const,
      created_by: prior.created_by,
      created_at: prior.created_at,
      // P-001: append-only history preserved (no journal wipe)
      standing_transition_log: Object.freeze([...(prior.standing_transition_log ?? [])]),
      // P-001: no relationship wipe
      ...(prior.supported_by ? { supported_by: prior.supported_by } : {}),
      ...(prior.contested_by ? { contested_by: prior.contested_by } : {}),
      ...(prior.qualified_by ? { qualified_by: prior.qualified_by } : {}),
      ...(prior.verified_via ? { verified_via: prior.verified_via } : {}),
      ...(prior.retraction_reason ? { retraction_reason: prior.retraction_reason } : {}),
      ...(prior.superseded_by ? { superseded_by: prior.superseded_by } : {}),
      ...(prior.supersedes ? { supersedes: prior.supersedes } : {}),
      ...(prior.ai_assisted !== undefined ? { ai_assisted: prior.ai_assisted } : {}),
      ...(prior.human_sponsor !== undefined ? { human_sponsor: prior.human_sponsor } : {}),
      ...(prior.is_hypothesis !== undefined && prior.standing === "draft_unverified"
        ? { is_hypothesis: prior.is_hypothesis }
        : {}),
      ...(prior.protocol_ref ? { protocol_ref: prior.protocol_ref } : {}),
      ...(prior.dataset_refs ? { dataset_refs: prior.dataset_refs } : {}),
      ...(prior.citation_refs ? { citation_refs: prior.citation_refs } : {}),
      ...(prior.entity_bindings ? { entity_bindings: prior.entity_bindings } : {}),
      ...(prior.assumes ? { assumes: prior.assumes } : {}),
      ...(prior.qualified_by_uncertainty
        ? { qualified_by_uncertainty: prior.qualified_by_uncertainty }
        : {}),
    });

    this.validator.validate(updated);
    return updated;
  }

  assertNoInPlaceOverwrite(prior: Claim, candidate: Claim): void {
    if (prior.claim_id !== candidate.claim_id) {
      throw new ClaimValidationError("F_ID_STABLE", "claim_id must remain stable");
    }
    if (
      prior.claim_version === candidate.claim_version &&
      isMaterialChange(prior, candidate)
    ) {
      throw new ClaimValidationError(
        "F5",
        "In-place material overwrite of issued claim_version is non-conformant",
      );
    }
  }
}

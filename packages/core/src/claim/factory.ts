import { ClaimValidator } from "./validator.js";
import { nfcTrim } from "./identifiers.js";
import type { Claim, ClaimScope } from "./types.js";

export interface CreateClaimInput {
  readonly claim_id: string;
  readonly proposition: string;
  readonly scope: ClaimScope;
  readonly created_by: string;
  readonly created_at: string;
  readonly ontology_ref?: string;
  readonly spec_ref?: string;
  readonly claim_version?: string;
  readonly ai_assisted?: boolean;
  readonly human_sponsor?: string;
  readonly is_hypothesis?: boolean;
  readonly supported_by?: readonly string[];
  readonly qualified_by?: readonly string[];
  readonly contested_by?: readonly string[];
  readonly verified_via?: readonly string[];
  readonly protocol_ref?: string;
  readonly dataset_refs?: readonly string[];
  readonly citation_refs?: readonly string[];
  readonly entity_bindings?: readonly string[];
  readonly assumes?: readonly string[];
}

/**
 * Creates immutable draft Claims (SCI-001 creation path → draft_unverified).
 */
export class ClaimFactory {
  private readonly validator = new ClaimValidator();

  createDraft(input: CreateClaimInput): Claim {
    const scope = Object.freeze({
      domain_context: nfcTrim(input.scope.domain_context),
      bounds: nfcTrim(input.scope.bounds),
      exclusions: nfcTrim(input.scope.exclusions),
    });

    const claim: Claim = Object.freeze({
      claim_id: input.claim_id,
      ontology_ref: input.ontology_ref ?? "SCI-000@0.1.0",
      spec_ref: input.spec_ref ?? "SCI-001@0.1.4",
      claim_version: input.claim_version ?? "1.0.0",
      proposition: nfcTrim(input.proposition),
      scope,
      standing: "draft_unverified",
      ethics_constraint_marker: "non_clinical",
      created_by: nfcTrim(input.created_by),
      created_at: input.created_at,
      ...(input.ai_assisted !== undefined ? { ai_assisted: input.ai_assisted } : {}),
      ...(input.human_sponsor !== undefined
        ? { human_sponsor: nfcTrim(input.human_sponsor) }
        : {}),
      ...(input.is_hypothesis !== undefined ? { is_hypothesis: input.is_hypothesis } : {}),
      ...(input.supported_by ? { supported_by: Object.freeze([...input.supported_by]) } : {}),
      ...(input.qualified_by ? { qualified_by: Object.freeze([...input.qualified_by]) } : {}),
      ...(input.contested_by ? { contested_by: Object.freeze([...input.contested_by]) } : {}),
      ...(input.verified_via ? { verified_via: Object.freeze([...input.verified_via]) } : {}),
      ...(input.protocol_ref ? { protocol_ref: input.protocol_ref } : {}),
      ...(input.dataset_refs ? { dataset_refs: Object.freeze([...input.dataset_refs]) } : {}),
      ...(input.citation_refs ? { citation_refs: Object.freeze([...input.citation_refs]) } : {}),
      ...(input.entity_bindings
        ? { entity_bindings: Object.freeze([...input.entity_bindings]) }
        : {}),
      ...(input.assumes ? { assumes: Object.freeze([...input.assumes]) } : {}),
      standing_transition_log: Object.freeze([]),
    });

    this.validator.validate(claim);
    return claim;
  }
}

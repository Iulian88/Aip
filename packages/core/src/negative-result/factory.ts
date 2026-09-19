import { NegativeResultValidationError } from "./errors.js";
import { negativeResultNfcTrim } from "./identifiers.js";
import { NegativeResultReferenceValidator } from "./reference-validator.js";
import {
  NegativeResultTransitionService,
  type NegativeResultRecordTransitionInput,
} from "./transition-service.js";
import type { CreateNegativeResultInput, NegativeResult } from "./types.js";

export type { CreateNegativeResultInput } from "./types.js";

/**
 * SCI-005 — (new) → registered only; Human NRTE required at issuance.
 */
export class NegativeResultFactory {
  private readonly refs = new NegativeResultReferenceValidator();
  private readonly transitions = new NegativeResultTransitionService();

  createRegistered(
    input: CreateNegativeResultInput,
    registration: NegativeResultRecordTransitionInput,
  ): NegativeResult {
    if (registration.to !== "registered") {
      throw new NegativeResultValidationError(
        "F_TRANSITION",
        "createRegistered requires to=registered",
      );
    }
    const claim_refs = this.refs.validateClaimRefs(input.claim_refs);
    const evidence_refs = this.refs.validateEvidenceRefs(input.evidence_refs);
    const contradiction_refs = this.refs.validateContradictionRefs(input.contradiction_refs);
    const verification_refs = this.refs.validateVerificationRefs(input.verification_refs);

    const content: CreateNegativeResultInput = {
      ...input,
      summary: negativeResultNfcTrim(input.summary),
      description: negativeResultNfcTrim(input.description),
      expected_observation: negativeResultNfcTrim(input.expected_observation),
      observed_absence: negativeResultNfcTrim(input.observed_absence),
      protocol_ref: negativeResultNfcTrim(input.protocol_ref),
      sensitivity_context: negativeResultNfcTrim(input.sensitivity_context),
      created_by: negativeResultNfcTrim(input.created_by),
      scope: Object.freeze({
        domain_context: negativeResultNfcTrim(input.scope.domain_context),
        bounds: negativeResultNfcTrim(input.scope.bounds),
        exclusions: negativeResultNfcTrim(input.scope.exclusions),
      }),
      provenance: Object.freeze({
        completeness: input.provenance.completeness,
        recorded_at: input.provenance.recorded_at,
        custody_agent: negativeResultNfcTrim(input.provenance.custody_agent),
        method_summary: negativeResultNfcTrim(input.provenance.method_summary),
      }),
      ...(claim_refs ? { claim_refs } : {}),
      ...(evidence_refs ? { evidence_refs } : {}),
      ...(contradiction_refs ? { contradiction_refs } : {}),
      ...(verification_refs ? { verification_refs } : {}),
      ...(input.human_sponsor
        ? { human_sponsor: negativeResultNfcTrim(input.human_sponsor) }
        : {}),
    };

    return this.transitions.register(content, registration);
  }
}

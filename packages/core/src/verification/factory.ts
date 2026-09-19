import { VerificationValidationError } from "./errors.js";
import { verificationNfcTrim } from "./identifiers.js";
import { VerificationReferenceValidator } from "./reference-validator.js";
import { VerificationTransitionService } from "./transition-service.js";
import type { CreateVerificationInput, Verification } from "./types.js";

/**
 * SCI-006 — (new) → planned; outcome pending.
 */
export class VerificationFactory {
  private readonly refs = new VerificationReferenceValidator();
  private readonly transitions = new VerificationTransitionService();

  createPlanned(input: CreateVerificationInput): Verification {
    const claim_refs = this.refs.validateClaimRefs(input.claim_refs);
    const evidence_refs = this.refs.validateEvidenceRefs(input.evidence_refs);
    const grade_refs = this.refs.validateGradeRefs(input.grade_refs);
    const contradiction_refs = this.refs.validateContradictionRefs(input.contradiction_refs);
    const negative_result_refs = this.refs.validateNegativeResultRefs(
      input.negative_result_refs,
    );

    if (
      input.artifact_ref !== undefined &&
      verificationNfcTrim(input.artifact_ref).length < 1
    ) {
      throw new VerificationValidationError("F6", "artifact_ref empty when present");
    }

    const content: CreateVerificationInput = {
      ...input,
      summary: verificationNfcTrim(input.summary),
      description: verificationNfcTrim(input.description),
      protocol_ref: verificationNfcTrim(input.protocol_ref),
      verification_context: verificationNfcTrim(input.verification_context),
      verification_rationale: verificationNfcTrim(input.verification_rationale),
      created_by: verificationNfcTrim(input.created_by),
      scope: Object.freeze({
        domain_context: verificationNfcTrim(input.scope.domain_context),
        bounds: verificationNfcTrim(input.scope.bounds),
        exclusions: verificationNfcTrim(input.scope.exclusions),
      }),
      provenance: Object.freeze({
        completeness: input.provenance.completeness,
        recorded_at: input.provenance.recorded_at,
        custody_agent: verificationNfcTrim(input.provenance.custody_agent),
        method_summary: verificationNfcTrim(input.provenance.method_summary),
      }),
      ...(claim_refs ? { claim_refs } : {}),
      ...(evidence_refs ? { evidence_refs } : {}),
      ...(grade_refs ? { grade_refs } : {}),
      ...(contradiction_refs ? { contradiction_refs } : {}),
      ...(negative_result_refs ? { negative_result_refs } : {}),
      ...(input.artifact_ref
        ? { artifact_ref: verificationNfcTrim(input.artifact_ref) }
        : {}),
      ...(input.human_sponsor
        ? { human_sponsor: verificationNfcTrim(input.human_sponsor) }
        : {}),
    };

    return this.transitions.createPlanned(content);
  }
}

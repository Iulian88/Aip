import {
  VERIFICATION_OBJECT_ID,
  VERIFICATION_ONTOLOGY_REF,
  VERIFICATION_SPEC_REF,
  VERIFICATION_UTC_SECOND,
  VERIFICATION_VERSION,
  VTE_ID,
  isConcludedState,
  isVerificationHumanReviewerAgent,
  leavesPlanned,
  verificationNfcTrim,
} from "./identifiers.js";
import { VerificationValidationError } from "./errors.js";
import { VerificationReferenceValidator } from "./reference-validator.js";
import {
  FORBIDDEN_VERIFICATION_OUTCOMES,
  FORBIDDEN_VERIFICATION_RECORD_STATES,
  PROVENANCE_COMPLETENESS,
  VERIFICATION_METHODS,
  VERIFICATION_OUTCOMES,
  VERIFICATION_RECORD_STATES,
  type Verification,
  type VerificationMethod,
  type VerificationOutcome,
  type VerificationProvenance,
  type VerificationRecordState,
  type VerificationScope,
  type VerificationTransitionEvent,
} from "./types.js";

function isRecordState(value: string): value is VerificationRecordState {
  return (VERIFICATION_RECORD_STATES as readonly string[]).includes(value);
}

function isOutcome(value: string): value is VerificationOutcome {
  return (VERIFICATION_OUTCOMES as readonly string[]).includes(value);
}

function isMethod(value: string): value is VerificationMethod {
  return (VERIFICATION_METHODS as readonly string[]).includes(value);
}

/**
 * Verification validator — SCI-006 machine-testable SHALLs.
 */
export class VerificationValidator {
  private readonly refs = new VerificationReferenceValidator();

  validate(v: Verification): void {
    if (!VERIFICATION_OBJECT_ID.test(v.verification_id)) {
      throw new VerificationValidationError(
        "F1",
        `Bad verification_id: ${v.verification_id}`,
      );
    }
    if (!VERIFICATION_ONTOLOGY_REF.test(v.ontology_ref)) {
      throw new VerificationValidationError("F1", `Bad ontology_ref: ${v.ontology_ref}`);
    }
    if (!VERIFICATION_SPEC_REF.test(v.spec_ref)) {
      throw new VerificationValidationError("F1", `Bad spec_ref: ${v.spec_ref}`);
    }
    if (!VERIFICATION_VERSION.test(v.verification_version)) {
      throw new VerificationValidationError(
        "F1",
        `Bad verification_version: ${v.verification_version}`,
      );
    }
    if (verificationNfcTrim(v.summary).length < 1) {
      throw new VerificationValidationError("F2", "summary empty after NFC+trim");
    }
    if (verificationNfcTrim(v.description).length < 1) {
      throw new VerificationValidationError("F2", "description empty after NFC+trim");
    }

    if ((v.record_state as string) === "truth_confirmed") {
      throw new VerificationValidationError("F13", "truth_confirmed forbidden");
    }
    if (
      (FORBIDDEN_VERIFICATION_RECORD_STATES as readonly string[]).includes(v.record_state)
    ) {
      throw new VerificationValidationError(
        "F4",
        `record_state forbidden: ${v.record_state}`,
      );
    }
    if (!isRecordState(v.record_state)) {
      throw new VerificationValidationError(
        "F4",
        `record_state invalid: ${v.record_state}`,
      );
    }

    if (
      (FORBIDDEN_VERIFICATION_OUTCOMES as readonly string[]).includes(v.verification_outcome)
    ) {
      throw new VerificationValidationError(
        "F4",
        `verification_outcome forbidden (Standing/Workflow): ${v.verification_outcome}`,
      );
    }
    if (!isOutcome(v.verification_outcome)) {
      throw new VerificationValidationError(
        "F4",
        `verification_outcome invalid: ${v.verification_outcome}`,
      );
    }

    this.assertOutcomeStateCoupling(v.record_state, v.verification_outcome);

    if (v.ethics_constraint_marker !== "non_clinical") {
      throw new VerificationValidationError(
        "F12",
        "ethics_constraint_marker must be non_clinical",
      );
    }
    if (verificationNfcTrim(v.created_by).length < 1) {
      throw new VerificationValidationError("F1", "created_by empty");
    }
    if (!VERIFICATION_UTC_SECOND.test(v.created_at)) {
      throw new VerificationValidationError("F1", "created_at must be UTC second");
    }

    if (verificationNfcTrim(v.protocol_ref).length < 1) {
      throw new VerificationValidationError("F2", "protocol_ref empty (ADM-1)");
    }
    this.validateScope(v.scope);

    if (!isMethod(v.verification_method)) {
      throw new VerificationValidationError(
        "F3",
        `verification_method invalid: ${v.verification_method}`,
      );
    }
    if (verificationNfcTrim(v.verification_context).length < 1) {
      throw new VerificationValidationError("F2", "verification_context empty");
    }
    if (verificationNfcTrim(v.verification_rationale).length < 1) {
      throw new VerificationValidationError("F2", "verification_rationale empty");
    }

    this.validateProvenance(v.provenance);
    this.refs.validateClaimRefs(v.claim_refs);
    this.refs.validateEvidenceRefs(v.evidence_refs);
    this.refs.validateGradeRefs(v.grade_refs);
    this.refs.validateContradictionRefs(v.contradiction_refs);
    this.refs.validateNegativeResultRefs(v.negative_result_refs);

    if (v.artifact_ref !== undefined) {
      if (verificationNfcTrim(v.artifact_ref).length < 1) {
        throw new VerificationValidationError("F6", "artifact_ref empty when present");
      }
    }

    this.assertTargetRule(v);

    if (v.ai_assisted === true) {
      if (!v.human_sponsor || verificationNfcTrim(v.human_sponsor).length < 1) {
        throw new VerificationValidationError(
          "F_AI",
          "ai_assisted requires human_sponsor",
        );
      }
    }

    const log = v.record_transition_log ?? [];
    const seen = new Set<string>();
    for (const vte of log) {
      this.validateVte(vte);
      if (seen.has(vte.event_id)) {
        throw new VerificationValidationError(
          "F_TRANSITION",
          `Duplicate VTE event_id ${vte.event_id}`,
        );
      }
      seen.add(vte.event_id);
    }

    if (isConcludedState(v.record_state)) {
      const hasMatching = log.some(
        (e) =>
          e.to_state === v.record_state &&
          isVerificationHumanReviewerAgent(e.authority_agent),
      );
      if (!hasMatching) {
        throw new VerificationValidationError(
          "F8",
          `VRR-1: ${v.record_state} requires Human VTE with matching to_state`,
        );
      }
    }
  }

  private assertOutcomeStateCoupling(
    state: VerificationRecordState,
    outcome: VerificationOutcome,
  ): void {
    const expected: Record<VerificationRecordState, VerificationOutcome> = {
      planned: "pending",
      passed: "passed",
      failed: "failed",
      inconclusive: "inconclusive",
    };
    if (outcome !== expected[state]) {
      throw new VerificationValidationError(
        "F5",
        `Outcome/state mismatch: record_state=${state} requires verification_outcome=${expected[state]}`,
      );
    }
  }

  private assertTargetRule(v: Verification): void {
    const hasClaim = (v.claim_refs?.length ?? 0) >= 1;
    const hasEvidence = (v.evidence_refs?.length ?? 0) >= 1;
    const hasArtifact =
      v.artifact_ref !== undefined && verificationNfcTrim(v.artifact_ref).length >= 1;
    if (!hasClaim && !hasEvidence && !hasArtifact) {
      throw new VerificationValidationError(
        "F6",
        "ADM-T1: require claim_refs (≥1) or evidence_refs (≥1) or non-empty artifact_ref",
      );
    }
  }

  validateScope(scope: VerificationScope): void {
    if (!scope || typeof scope !== "object") {
      throw new VerificationValidationError("F2", "scope missing");
    }
    for (const key of ["domain_context", "bounds", "exclusions"] as const) {
      const raw = scope[key];
      if (typeof raw !== "string" || verificationNfcTrim(raw).length < 1) {
        throw new VerificationValidationError("F2", `scope.${key} empty or missing`);
      }
    }
  }

  private validateProvenance(p: VerificationProvenance): void {
    if (!(PROVENANCE_COMPLETENESS as readonly string[]).includes(p.completeness)) {
      throw new VerificationValidationError(
        "F1",
        `provenance.completeness invalid: ${p.completeness}`,
      );
    }
    if (!VERIFICATION_UTC_SECOND.test(p.recorded_at)) {
      throw new VerificationValidationError(
        "F1",
        "provenance.recorded_at must be UTC second",
      );
    }
    if (verificationNfcTrim(p.custody_agent).length < 1) {
      throw new VerificationValidationError("F1", "provenance.custody_agent empty");
    }
    if (verificationNfcTrim(p.method_summary).length < 1) {
      throw new VerificationValidationError("F1", "provenance.method_summary empty");
    }
  }

  private validateVte(event: VerificationTransitionEvent): void {
    if (!VTE_ID.test(event.event_id)) {
      throw new VerificationValidationError("F_TRANSITION", "Invalid VTE event_id");
    }
    if (!VERIFICATION_UTC_SECOND.test(event.at)) {
      throw new VerificationValidationError("F_TRANSITION", "VTE.at must be UTC second");
    }
    if (event.from_state !== "null" && !isRecordState(event.from_state)) {
      throw new VerificationValidationError("F4", "VTE.from_state invalid");
    }
    if (!isRecordState(event.to_state)) {
      throw new VerificationValidationError("F4", "VTE.to_state invalid");
    }
    if (leavesPlanned(event.to_state)) {
      if (!isVerificationHumanReviewerAgent(event.authority_agent)) {
        throw new VerificationValidationError(
          "F7",
          "Non-human authority on VTE leaving planned",
          { authority_agent: event.authority_agent },
        );
      }
      if (!event.decision_ref || verificationNfcTrim(event.decision_ref).length < 1) {
        throw new VerificationValidationError(
          "F_TRANSITION",
          "VTE leaving planned missing decision_ref",
        );
      }
    }
    if (verificationNfcTrim(event.authority_agent).length < 1) {
      throw new VerificationValidationError("F_TRANSITION", "VTE.authority_agent empty");
    }
    if (verificationNfcTrim(event.reason).length < 1) {
      throw new VerificationValidationError("F_TRANSITION", "VTE.reason empty");
    }
  }
}

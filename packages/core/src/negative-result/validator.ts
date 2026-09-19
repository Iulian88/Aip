import {
  NEGATIVE_RESULT_OBJECT_ID,
  NEGATIVE_RESULT_ONTOLOGY_REF,
  NEGATIVE_RESULT_SPEC_REF,
  NEGATIVE_RESULT_UTC_SECOND,
  NEGATIVE_RESULT_VERSION,
  NRTE_ID,
  isNegativeResultHumanReviewerAgent,
  negativeResultNfcTrim,
} from "./identifiers.js";
import { NegativeResultValidationError } from "./errors.js";
import { NegativeResultReferenceValidator } from "./reference-validator.js";
import {
  FORBIDDEN_NEGATIVE_RESULT_RECORD_STATES,
  NEGATIVE_RESULT_RECORD_STATES,
  PROVENANCE_COMPLETENESS,
  type NegativeResult,
  type NegativeResultProvenance,
  type NegativeResultRecordState,
  type NegativeResultScope,
  type NegativeResultTransitionEvent,
} from "./types.js";

function isRecordState(value: string): value is NegativeResultRecordState {
  return (NEGATIVE_RESULT_RECORD_STATES as readonly string[]).includes(value);
}

function rejectNoneNa(label: string, value: string): void {
  const v = negativeResultNfcTrim(value);
  if (v.length < 1) {
    throw new NegativeResultValidationError("F2", `${label} empty`);
  }
  if (v === "none" || v === "n/a") {
    throw new NegativeResultValidationError(
      "F2",
      `${label} must not equal none/n/a (ADM-2)`,
    );
  }
}

/**
 * Negative Result validator — SCI-005 machine-testable SHALLs.
 */
export class NegativeResultValidator {
  private readonly refs = new NegativeResultReferenceValidator();

  validate(nr: NegativeResult): void {
    if (!NEGATIVE_RESULT_OBJECT_ID.test(nr.negative_result_id)) {
      throw new NegativeResultValidationError(
        "F1",
        `Bad negative_result_id: ${nr.negative_result_id}`,
      );
    }
    if (!NEGATIVE_RESULT_ONTOLOGY_REF.test(nr.ontology_ref)) {
      throw new NegativeResultValidationError("F1", `Bad ontology_ref: ${nr.ontology_ref}`);
    }
    if (!NEGATIVE_RESULT_SPEC_REF.test(nr.spec_ref)) {
      throw new NegativeResultValidationError("F1", `Bad spec_ref: ${nr.spec_ref}`);
    }
    if (!NEGATIVE_RESULT_VERSION.test(nr.negative_result_version)) {
      throw new NegativeResultValidationError(
        "F1",
        `Bad negative_result_version: ${nr.negative_result_version}`,
      );
    }
    if (negativeResultNfcTrim(nr.summary).length < 1) {
      throw new NegativeResultValidationError("F1", "summary empty after NFC+trim");
    }
    if (negativeResultNfcTrim(nr.description).length < 1) {
      throw new NegativeResultValidationError("F1", "description empty after NFC+trim");
    }

    if (
      (FORBIDDEN_NEGATIVE_RESULT_RECORD_STATES as readonly string[]).includes(nr.record_state)
    ) {
      throw new NegativeResultValidationError(
        "F4",
        `record_state forbidden (Standing/Workflow/Evidence/Contradiction/etc.): ${nr.record_state}`,
      );
    }
    if (!isRecordState(nr.record_state)) {
      throw new NegativeResultValidationError(
        "F4",
        `record_state invalid: ${nr.record_state}`,
      );
    }

    if (nr.ethics_constraint_marker !== "non_clinical") {
      throw new NegativeResultValidationError(
        "F11",
        "ethics_constraint_marker must be non_clinical",
      );
    }
    if (negativeResultNfcTrim(nr.created_by).length < 1) {
      throw new NegativeResultValidationError("F1", "created_by empty");
    }
    if (!NEGATIVE_RESULT_UTC_SECOND.test(nr.created_at)) {
      throw new NegativeResultValidationError("F1", "created_at must be UTC second");
    }

    const protocol = negativeResultNfcTrim(nr.protocol_ref);
    if (protocol.length < 1) {
      throw new NegativeResultValidationError("F2", "protocol_ref empty (ADM-1)");
    }

    rejectNoneNa("expected_observation", nr.expected_observation);
    rejectNoneNa("observed_absence", nr.observed_absence);

    this.validateScope(nr.scope);

    const sensitivity = negativeResultNfcTrim(nr.sensitivity_context);
    if (sensitivity.length < 1) {
      throw new NegativeResultValidationError("F2", "sensitivity_context empty");
    }

    this.validateProvenance(nr.provenance);
    this.refs.validateClaimRefs(nr.claim_refs);
    this.refs.validateEvidenceRefs(nr.evidence_refs);
    this.refs.validateContradictionRefs(nr.contradiction_refs);
    this.refs.validateVerificationRefs(nr.verification_refs);

    if (nr.ai_assisted === true) {
      if (!nr.human_sponsor || negativeResultNfcTrim(nr.human_sponsor).length < 1) {
        throw new NegativeResultValidationError(
          "F_AI",
          "ai_assisted requires human_sponsor",
        );
      }
    }

    if (nr.record_state === "withdrawn") {
      const reason = nr.withdrawal_reason
        ? negativeResultNfcTrim(nr.withdrawal_reason)
        : "";
      if (reason.length < 1) {
        throw new NegativeResultValidationError(
          "F7",
          "withdrawn requires non-empty withdrawal_reason",
        );
      }
    }

    const log = nr.record_transition_log ?? [];
    const seen = new Set<string>();
    for (const nrte of log) {
      this.validateNrte(nrte);
      if (seen.has(nrte.event_id)) {
        throw new NegativeResultValidationError(
          "F_TRANSITION",
          `Duplicate NRTE event_id ${nrte.event_id}`,
        );
      }
      seen.add(nrte.event_id);
    }

    // NRR-1: registered requires ≥1 Human NRTE with to_state=registered
    if (nr.record_state === "registered" || nr.record_state === "withdrawn") {
      const hasRegistered = log.some(
        (e) =>
          e.to_state === "registered" &&
          isNegativeResultHumanReviewerAgent(e.authority_agent),
      );
      if (!hasRegistered) {
        throw new NegativeResultValidationError(
          "F6",
          "NRR-1: registered (or withdrawn lineage) requires Human NRTE to_state=registered",
        );
      }
    }

    if (nr.record_state === "withdrawn") {
      const hasWithdraw = log.some((e) => e.to_state === "withdrawn");
      if (!hasWithdraw) {
        throw new NegativeResultValidationError(
          "F_TRANSITION",
          "withdrawn requires matching NRTE to_state=withdrawn",
        );
      }
    }
  }

  validateScope(scope: NegativeResultScope): void {
    if (!scope || typeof scope !== "object") {
      throw new NegativeResultValidationError("F3", "scope missing");
    }
    for (const key of ["domain_context", "bounds", "exclusions"] as const) {
      const raw = scope[key];
      if (typeof raw !== "string" || negativeResultNfcTrim(raw).length < 1) {
        throw new NegativeResultValidationError("F3", `scope.${key} empty or missing`);
      }
    }
  }

  private validateProvenance(p: NegativeResultProvenance): void {
    if (!(PROVENANCE_COMPLETENESS as readonly string[]).includes(p.completeness)) {
      throw new NegativeResultValidationError(
        "F1",
        `provenance.completeness invalid: ${p.completeness}`,
      );
    }
    if (!NEGATIVE_RESULT_UTC_SECOND.test(p.recorded_at)) {
      throw new NegativeResultValidationError(
        "F1",
        "provenance.recorded_at must be UTC second",
      );
    }
    if (negativeResultNfcTrim(p.custody_agent).length < 1) {
      throw new NegativeResultValidationError("F1", "provenance.custody_agent empty");
    }
    if (negativeResultNfcTrim(p.method_summary).length < 1) {
      throw new NegativeResultValidationError("F1", "provenance.method_summary empty");
    }
  }

  private validateNrte(event: NegativeResultTransitionEvent): void {
    if (!NRTE_ID.test(event.event_id)) {
      throw new NegativeResultValidationError("F_TRANSITION", "Invalid NRTE event_id");
    }
    if (!NEGATIVE_RESULT_UTC_SECOND.test(event.at)) {
      throw new NegativeResultValidationError("F_TRANSITION", "NRTE.at must be UTC second");
    }
    if (event.from_state !== "null" && !isRecordState(event.from_state)) {
      throw new NegativeResultValidationError("F4", "NRTE.from_state invalid");
    }
    if (!isRecordState(event.to_state)) {
      throw new NegativeResultValidationError("F4", "NRTE.to_state invalid");
    }
    if (!isNegativeResultHumanReviewerAgent(event.authority_agent)) {
      throw new NegativeResultValidationError(
        "F5",
        "NRTE authority_agent must be Human Reviewer",
        { authority_agent: event.authority_agent },
      );
    }
    if (negativeResultNfcTrim(event.reason).length < 1) {
      throw new NegativeResultValidationError("F_TRANSITION", "NRTE.reason empty");
    }
    if (negativeResultNfcTrim(event.decision_ref).length < 1) {
      throw new NegativeResultValidationError("F_TRANSITION", "NRTE.decision_ref empty");
    }
  }
}

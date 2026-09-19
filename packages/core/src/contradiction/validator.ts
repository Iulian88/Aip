import {
  CONTRADICTION_OBJECT_ID,
  CONTRADICTION_ONTOLOGY_REF,
  CONTRADICTION_SPEC_REF,
  CONTRADICTION_UTC_SECOND,
  CONTRADICTION_VERSION,
  CRTE_ID,
  contradictionNfcTrim,
  isContradictionHumanReviewerAgent,
  isResolvedState,
  leavesOpen,
} from "./identifiers.js";
import { ContradictionValidationError } from "./errors.js";
import { ContradictionReferenceValidator } from "./reference-validator.js";
import {
  CONTRADICTION_RECORD_STATES,
  FORBIDDEN_CONTRADICTION_RECORD_STATES,
  PROVENANCE_COMPLETENESS,
  type Contradiction,
  type ContradictionProvenance,
  type ContradictionRecordState,
  type ContradictionRecordTransitionEvent,
} from "./types.js";

function isRecordState(value: string): value is ContradictionRecordState {
  return (CONTRADICTION_RECORD_STATES as readonly string[]).includes(value);
}

/**
 * Contradiction validator — SCI-004 machine-testable SHALLs.
 */
export class ContradictionValidator {
  private readonly refs = new ContradictionReferenceValidator();

  validate(contradiction: Contradiction): void {
    if (!CONTRADICTION_OBJECT_ID.test(contradiction.contradiction_id)) {
      throw new ContradictionValidationError(
        "F1",
        `Bad contradiction_id: ${contradiction.contradiction_id}`,
      );
    }
    if (!CONTRADICTION_ONTOLOGY_REF.test(contradiction.ontology_ref)) {
      throw new ContradictionValidationError(
        "F1",
        `Bad ontology_ref: ${contradiction.ontology_ref}`,
      );
    }
    if (!CONTRADICTION_SPEC_REF.test(contradiction.spec_ref)) {
      throw new ContradictionValidationError(
        "F1",
        `Bad spec_ref: ${contradiction.spec_ref}`,
      );
    }
    if (!CONTRADICTION_VERSION.test(contradiction.contradiction_version)) {
      throw new ContradictionValidationError(
        "F1",
        `Bad contradiction_version: ${contradiction.contradiction_version}`,
      );
    }
    if (contradictionNfcTrim(contradiction.summary).length < 1) {
      throw new ContradictionValidationError("F1", "summary empty after NFC+trim");
    }
    if (
      (FORBIDDEN_CONTRADICTION_RECORD_STATES as readonly string[]).includes(
        contradiction.record_state,
      )
    ) {
      throw new ContradictionValidationError(
        "F5",
        `record_state forbidden (Standing/Workflow/Evidence/Grade/etc.): ${contradiction.record_state}`,
      );
    }
    if (!isRecordState(contradiction.record_state)) {
      throw new ContradictionValidationError(
        "F5",
        `record_state invalid: ${contradiction.record_state}`,
      );
    }
    if (contradiction.ethics_constraint_marker !== "non_clinical") {
      throw new ContradictionValidationError(
        "F1",
        "ethics_constraint_marker must be non_clinical",
      );
    }
    if (contradictionNfcTrim(contradiction.created_by).length < 1) {
      throw new ContradictionValidationError("F1", "created_by empty");
    }
    if (!CONTRADICTION_UTC_SECOND.test(contradiction.created_at)) {
      throw new ContradictionValidationError("F1", "created_at must be UTC second");
    }

    this.refs.validateInvolvedClaims(contradiction.involved_claims);
    this.refs.validateEvidenceRefs(contradiction.evidence_refs);

    const overlap = contradictionNfcTrim(contradiction.overlap_statement);
    const clash = contradictionNfcTrim(contradiction.incompatibility_statement);
    if (overlap.length < 1) {
      throw new ContradictionValidationError("F9", "overlap_statement empty");
    }
    if (clash.length < 1 || clash === "none" || clash === "n/a") {
      throw new ContradictionValidationError(
        "F9",
        "incompatibility_statement empty or equals none/n/a (ADM-4)",
      );
    }

    this.validateProvenance(contradiction.provenance);

    if (contradiction.ai_assisted === true) {
      if (
        !contradiction.human_sponsor ||
        contradictionNfcTrim(contradiction.human_sponsor).length < 1
      ) {
        throw new ContradictionValidationError(
          "F_AI",
          "ai_assisted requires human_sponsor",
        );
      }
      if (contradiction.record_state !== "open") {
        const log = contradiction.record_transition_log ?? [];
        const ok = log.some(
          (e) =>
            leavesOpen(e.to_state) &&
            isContradictionHumanReviewerAgent(e.authority_agent),
        );
        if (!ok) {
          throw new ContradictionValidationError(
            "F6",
            "ai_assisted non-open Contradiction requires Human CRTE leaving open",
          );
        }
      }
    }

    if (isResolvedState(contradiction.record_state)) {
      const note = contradiction.resolution_note
        ? contradictionNfcTrim(contradiction.resolution_note)
        : "";
      if (note.length < 1) {
        throw new ContradictionValidationError(
          "F7",
          "CRR-1: resolved_* requires non-empty resolution_note",
        );
      }
    }

    const log = contradiction.record_transition_log ?? [];
    const seen = new Set<string>();
    for (const crte of log) {
      this.validateCrte(crte);
      if (seen.has(crte.event_id)) {
        throw new ContradictionValidationError(
          "F_TRANSITION",
          `Duplicate CRTE event_id ${crte.event_id}`,
        );
      }
      seen.add(crte.event_id);
      if (
        leavesOpen(crte.to_state) &&
        !isContradictionHumanReviewerAgent(crte.authority_agent)
      ) {
        throw new ContradictionValidationError(
          "F6",
          "Non-human authority on CRTE leaving open",
        );
      }
    }

    if (contradiction.record_state !== "open") {
      const hasTo = log.some((e) => e.to_state === contradiction.record_state);
      if (!hasTo) {
        throw new ContradictionValidationError(
          "F_TRANSITION",
          `record_state ${contradiction.record_state} requires matching CRTE`,
        );
      }
    }
  }

  private validateProvenance(p: ContradictionProvenance): void {
    if (!(PROVENANCE_COMPLETENESS as readonly string[]).includes(p.completeness)) {
      throw new ContradictionValidationError(
        "F1",
        `provenance.completeness invalid: ${p.completeness}`,
      );
    }
    if (!CONTRADICTION_UTC_SECOND.test(p.recorded_at)) {
      throw new ContradictionValidationError(
        "F1",
        "provenance.recorded_at must be UTC second",
      );
    }
    if (contradictionNfcTrim(p.custody_agent).length < 1) {
      throw new ContradictionValidationError("F1", "provenance.custody_agent empty");
    }
    if (contradictionNfcTrim(p.method_summary).length < 1) {
      throw new ContradictionValidationError("F1", "provenance.method_summary empty");
    }
  }

  private validateCrte(event: ContradictionRecordTransitionEvent): void {
    if (!CRTE_ID.test(event.event_id)) {
      throw new ContradictionValidationError("F_TRANSITION", "Invalid CRTE event_id");
    }
    if (!CONTRADICTION_UTC_SECOND.test(event.at)) {
      throw new ContradictionValidationError("F_TRANSITION", "CRTE.at must be UTC second");
    }
    if (event.from_state !== "null" && !isRecordState(event.from_state)) {
      throw new ContradictionValidationError("F5", "CRTE.from_state invalid");
    }
    if (!isRecordState(event.to_state)) {
      throw new ContradictionValidationError("F5", "CRTE.to_state invalid");
    }
    if (contradictionNfcTrim(event.authority_agent).length < 1) {
      throw new ContradictionValidationError("F_TRANSITION", "CRTE.authority_agent empty");
    }
    if (contradictionNfcTrim(event.reason).length < 1) {
      throw new ContradictionValidationError("F_TRANSITION", "CRTE.reason empty");
    }
    if (leavesOpen(event.to_state)) {
      if (!event.decision_ref || contradictionNfcTrim(event.decision_ref).length < 1) {
        throw new ContradictionValidationError(
          "F_TRANSITION",
          "CRTE leaving open missing decision_ref",
        );
      }
    }
  }
}

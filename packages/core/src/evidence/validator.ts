import {
  EVIDENCE_ID,
  EVIDENCE_VERSION,
  ERTE_ID,
  EVIDENCE_ONTOLOGY_REF,
  EVIDENCE_SPEC_REF,
  EVIDENCE_UTC_SECOND,
  isEvidenceHumanReviewerAgent,
  evidenceNfcTrim,
} from "./identifiers.js";
import { EvidenceValidationError } from "./errors.js";
import { EvidenceSourceValidator } from "./source-validator.js";
import { EvidenceProvenanceValidator } from "./provenance-validator.js";
import { EvidenceItemValidator } from "./item-validator.js";
import { EvidenceCollectionValidator } from "./collection-validator.js";
import { EvidenceReferenceValidator } from "./reference-validator.js";
import {
  EvidenceGradeValidator,
  isEvidenceGradeValidationError,
} from "../grade/index.js";
import {
  EVIDENCE_RECORD_STATES,
  FORBIDDEN_EVIDENCE_RECORD_STATES,
  type Evidence,
  type EvidenceRecordState,
  type EvidenceRecordTransitionEvent,
} from "./types.js";

function isRecordState(value: string): value is EvidenceRecordState {
  return (EVIDENCE_RECORD_STATES as readonly string[]).includes(value);
}

/**
 * Evidence validator — SCI-002 machine-testable SHALLs.
 */
export class EvidenceValidator {
  private readonly source = new EvidenceSourceValidator();
  private readonly provenance = new EvidenceProvenanceValidator();
  private readonly items = new EvidenceItemValidator();
  private readonly collection = new EvidenceCollectionValidator();
  private readonly refs = new EvidenceReferenceValidator();

  validate(evidence: Evidence): void {
    if (!EVIDENCE_ID.test(evidence.evidence_id)) {
      throw new EvidenceValidationError("F1", `Bad evidence_id: ${evidence.evidence_id}`);
    }
    if (!EVIDENCE_ONTOLOGY_REF.test(evidence.ontology_ref)) {
      throw new EvidenceValidationError("F1", `Bad ontology_ref: ${evidence.ontology_ref}`);
    }
    if (!EVIDENCE_SPEC_REF.test(evidence.spec_ref)) {
      throw new EvidenceValidationError("F1", `Bad spec_ref: ${evidence.spec_ref}`);
    }
    if (!EVIDENCE_VERSION.test(evidence.evidence_version)) {
      throw new EvidenceValidationError("F1", `Bad evidence_version: ${evidence.evidence_version}`);
    }
    if (evidenceNfcTrim(evidence.summary).length < 1) {
      throw new EvidenceValidationError("F1", "summary empty after NFC+trim");
    }
    if (
      (FORBIDDEN_EVIDENCE_RECORD_STATES as readonly string[]).includes(evidence.record_state)
    ) {
      throw new EvidenceValidationError(
        "F8",
        `record_state forbidden (Standing/Workflow/etc.): ${evidence.record_state}`,
      );
    }
    if (!isRecordState(evidence.record_state)) {
      throw new EvidenceValidationError("F8", `record_state invalid: ${evidence.record_state}`);
    }
    if (evidence.ethics_constraint_marker !== "non_clinical") {
      throw new EvidenceValidationError("F1", "ethics_constraint_marker must be non_clinical");
    }
    if (evidenceNfcTrim(evidence.created_by).length < 1) {
      throw new EvidenceValidationError("F1", "created_by empty");
    }
    if (!EVIDENCE_UTC_SECOND.test(evidence.created_at)) {
      throw new EvidenceValidationError("F1", "created_at must be UTC second");
    }
    if (typeof evidence.grade_ref !== "string" || evidenceNfcTrim(evidence.grade_ref).length < 1) {
      throw new EvidenceValidationError("F9", "grade_ref empty");
    }

    // SCI-003: grade_ref slot is deferred_sci003 OR §9 encoding (MIG-4)
    try {
      new EvidenceGradeValidator().validateSlot(evidence);
    } catch (err) {
      if (isEvidenceGradeValidationError(err)) {
        throw new EvidenceValidationError(
          err.code === "F9" ? "F9" : "F1",
          err.message,
          { gradeFailure: err.code, ...err.details },
        );
      }
      throw err;
    }

    this.source.validate(evidence.source);
    this.provenance.validate(evidence.provenance);
    this.items.validateAll(evidence.items, evidence.record_state);
    this.collection.validate(evidence.collection, evidence.items);
    this.refs.validateBearsOn(evidence.bears_on);

    if (evidence.ai_assisted === true) {
      if (!evidence.human_sponsor || evidenceNfcTrim(evidence.human_sponsor).length < 1) {
        throw new EvidenceValidationError("F_AI", "ai_assisted requires human_sponsor");
      }
      if (evidence.record_state !== "draft") {
        const log = evidence.record_transition_log ?? [];
        const ok = log.some(
          (e) =>
            (e.to_state === "registered" || e.to_state === "withdrawn") &&
            isEvidenceHumanReviewerAgent(e.authority_agent),
        );
        if (!ok) {
          throw new EvidenceValidationError(
            "F5",
            "ai_assisted non-draft Evidence requires Human ERTE to registered/withdrawn",
          );
        }
      }
    }

    if (evidence.record_state === "registered") {
      this.assertErr1(evidence);
    }

    const log = evidence.record_transition_log ?? [];
    const seen = new Set<string>();
    for (const erte of log) {
      this.validateErte(erte);
      if (seen.has(erte.event_id)) {
        throw new EvidenceValidationError(
          "F_TRANSITION",
          `Duplicate ERTE event_id ${erte.event_id}`,
        );
      }
      seen.add(erte.event_id);
      if (
        (erte.to_state === "registered" || erte.to_state === "withdrawn") &&
        erte.from_state !== "null" &&
        !isEvidenceHumanReviewerAgent(erte.authority_agent)
      ) {
        // draft→withdrawn also requires human per §13.4 style for promotions; §13.3 says when Human required
        // §13.4 focuses on registered; §13.2 AI-only promotion draft→registered
        // For withdrawn from draft, Human is good practice; SCI §13.3 "When Human Reviewer is required (§13.4)"
        // §13.4 only lists registered. draft→withdrawn may not require human in ERR-1.
        // Only enforce non-human reject for to_state=registered
      }
      if (erte.to_state === "registered" && !isEvidenceHumanReviewerAgent(erte.authority_agent)) {
        throw new EvidenceValidationError("F5", "Non-human authority on registration ERTE");
      }
    }

    if (evidence.record_state !== "draft") {
      const hasTo = log.some((e) => e.to_state === evidence.record_state);
      if (!hasTo) {
        throw new EvidenceValidationError(
          "F_TRANSITION",
          `record_state ${evidence.record_state} requires matching ERTE`,
        );
      }
    }
  }

  private assertErr1(evidence: Evidence): void {
    const active = evidence.items.filter((i) => i.item_state === "active");
    if (active.length < 1) {
      throw new EvidenceValidationError("F4", "ERR-1: registered needs ≥1 active Item");
    }
    this.source.validate(evidence.source);
    this.provenance.validate(evidence.provenance);
    const log = evidence.record_transition_log ?? [];
    const ste = log.find(
      (e) =>
        e.to_state === "registered" &&
        isEvidenceHumanReviewerAgent(e.authority_agent) &&
        e.decision_ref !== undefined &&
        evidenceNfcTrim(e.decision_ref).length >= 1,
    );
    if (!ste) {
      throw new EvidenceValidationError(
        "F4",
        "ERR-1: registered requires Human ERTE with decision_ref",
      );
    }
    if (evidenceNfcTrim(evidence.grade_ref).length < 1) {
      throw new EvidenceValidationError("F9", "ERR-1: grade_ref non-empty required");
    }
    if (evidence.ai_assisted === true) {
      // (4) already covered by ste find
    }
  }

  private validateErte(event: EvidenceRecordTransitionEvent): void {
    if (!ERTE_ID.test(event.event_id)) {
      throw new EvidenceValidationError("F_TRANSITION", "Invalid ERTE event_id");
    }
    if (!EVIDENCE_UTC_SECOND.test(event.at)) {
      throw new EvidenceValidationError("F_TRANSITION", "ERTE.at must be UTC second");
    }
    if (event.from_state !== "null" && !isRecordState(event.from_state)) {
      throw new EvidenceValidationError("F8", "ERTE.from_state invalid");
    }
    if (!isRecordState(event.to_state)) {
      throw new EvidenceValidationError("F8", "ERTE.to_state invalid");
    }
    if (evidenceNfcTrim(event.authority_agent).length < 1) {
      throw new EvidenceValidationError("F_TRANSITION", "ERTE.authority_agent empty");
    }
    if (evidenceNfcTrim(event.reason).length < 1) {
      throw new EvidenceValidationError("F_TRANSITION", "ERTE.reason empty");
    }
    if (event.to_state === "registered") {
      if (!event.decision_ref || evidenceNfcTrim(event.decision_ref).length < 1) {
        throw new EvidenceValidationError("F4", "ERTE to registered missing decision_ref");
      }
    }
  }
}

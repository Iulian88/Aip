import { EvidenceEventBuilder } from "./event-builder.js";
import { EvidenceValidationError } from "./errors.js";
import { isEvidenceHumanReviewerAgent, evidenceNfcTrim } from "./identifiers.js";
import { isEvidenceMaterialChange } from "./material-change.js";
import { EvidenceValidator } from "./validator.js";
import type {
  Evidence,
  EvidenceRecordState,
  EvidenceRecordTransitionEvent,
} from "./types.js";

const ALLOWED: Readonly<Record<EvidenceRecordState, readonly EvidenceRecordState[]>> = {
  draft: ["registered", "withdrawn"],
  registered: ["withdrawn"],
  withdrawn: [],
};

export interface EvidenceRecordTransitionInput {
  readonly to: EvidenceRecordState;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref?: string;
  readonly at: string;
  readonly event_id?: string;
  readonly items?: Evidence["items"];
  readonly bears_on?: readonly string[];
}

export class EvidenceTransitionService {
  private readonly validator = new EvidenceValidator();
  private readonly events = new EvidenceEventBuilder();

  isAllowed(from: EvidenceRecordState, to: EvidenceRecordState): boolean {
    return ALLOWED[from].includes(to);
  }

  assertTransitionLegal(evidence: Evidence, to: EvidenceRecordState): void {
    if (!this.isAllowed(evidence.record_state, to)) {
      throw new EvidenceValidationError(
        "F_TRANSITION",
        `Illegal Record State transition ${evidence.record_state} → ${to}`,
      );
    }
  }

  /**
   * SCI-002 §13.4 + §7.7.4 — Human Reviewer for registration;
   * ai_assisted also requires Human for withdrawn (CODE-AUDIT-002 P-002).
   */
  assertHumanReviewerGate(
    evidence: Evidence,
    input: EvidenceRecordTransitionInput,
  ): void {
    const needsHuman = this.requiresHumanReviewer(evidence, input.to);

    if (!needsHuman) {
      return;
    }

    if (!isEvidenceHumanReviewerAgent(input.authority_agent)) {
      throw new EvidenceValidationError(
        "F5",
        input.to === "registered"
          ? "AI SHALL NOT register Evidence; Human Reviewer required"
          : "ai_assisted Evidence requires Human Reviewer for withdrawn",
        { authority_agent: input.authority_agent },
      );
    }

    if (input.to === "registered") {
      const ref = input.decision_ref !== undefined ? evidenceNfcTrim(input.decision_ref) : "";
      if (ref.length < 1) {
        throw new EvidenceValidationError(
          "F4",
          "Registration requires non-empty decision_ref",
        );
      }
    }
  }

  /** §13.4 registration + §7.7.4 ai_assisted → registered|withdrawn */
  requiresHumanReviewer(evidence: Evidence, to: EvidenceRecordState): boolean {
    if (to === "registered") {
      return true;
    }
    return evidence.ai_assisted === true && to === "withdrawn";
  }

  /**
   * CODE-AUDIT-002 P-001 — reject material Item mutation without version bump.
   * item_state-only changes are not material (§14.2 / material-change evaluator).
   */
  assertItemsImmutability(evidence: Evidence, items: Evidence["items"] | undefined): void {
    if (items === undefined) {
      return;
    }
    const candidate: Evidence = Object.freeze({
      ...evidence,
      items,
    });
    if (
      isEvidenceMaterialChange(evidence, candidate) &&
      evidence.evidence_version === candidate.evidence_version
    ) {
      throw new EvidenceValidationError(
        "F6",
        "Material Item change without evidence_version bump is non-conformant",
      );
    }
  }

  transition(evidence: Evidence, input: EvidenceRecordTransitionInput): Evidence {
    this.assertTransitionLegal(evidence, input.to);
    this.assertHumanReviewerGate(evidence, input);
    this.assertItemsImmutability(evidence, input.items);

    const requireHuman = this.requiresHumanReviewer(evidence, input.to);

    const erte = this.events.build({
      from_state: evidence.record_state,
      to_state: input.to,
      authority_agent: input.authority_agent,
      reason: input.reason,
      ...(input.decision_ref !== undefined ? { decision_ref: input.decision_ref } : {}),
      at: input.at,
      ...(input.event_id !== undefined ? { event_id: input.event_id } : {}),
      requireHuman,
    });

    const log: readonly EvidenceRecordTransitionEvent[] = Object.freeze([
      ...(evidence.record_transition_log ?? []),
      erte,
    ]);

    const next: Evidence = Object.freeze({
      evidence_id: evidence.evidence_id,
      ontology_ref: evidence.ontology_ref,
      spec_ref: evidence.spec_ref,
      evidence_version: evidence.evidence_version,
      summary: evidence.summary,
      record_state: input.to,
      source: evidence.source,
      provenance: evidence.provenance,
      grade_ref: evidence.grade_ref,
      ethics_constraint_marker: "non_clinical",
      created_by: evidence.created_by,
      created_at: evidence.created_at,
      items: input.items ?? evidence.items,
      record_transition_log: log,
      ...(evidence.collection ? { collection: evidence.collection } : {}),
      ...(input.bears_on
        ? { bears_on: Object.freeze([...input.bears_on]) }
        : evidence.bears_on
          ? { bears_on: evidence.bears_on }
          : {}),
      ...(evidence.ai_assisted !== undefined ? { ai_assisted: evidence.ai_assisted } : {}),
      ...(evidence.human_sponsor ? { human_sponsor: evidence.human_sponsor } : {}),
      ...(evidence.protocol_ref ? { protocol_ref: evidence.protocol_ref } : {}),
      ...(evidence.dataset_refs ? { dataset_refs: evidence.dataset_refs } : {}),
      ...(evidence.citation_refs ? { citation_refs: evidence.citation_refs } : {}),
      ...(evidence.grade_assignment_log
        ? { grade_assignment_log: evidence.grade_assignment_log }
        : {}),
    });

    this.validator.validate(next);
    return next;
  }
}

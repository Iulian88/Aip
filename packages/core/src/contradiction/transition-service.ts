import { ContradictionEventBuilder } from "./event-builder.js";
import { ContradictionValidationError } from "./errors.js";
import {
  contradictionNfcTrim,
  isContradictionHumanReviewerAgent,
  isResolvedState,
  leavesOpen,
} from "./identifiers.js";
import { ContradictionValidator } from "./validator.js";
import type {
  Contradiction,
  ContradictionRecordState,
  ContradictionRecordTransitionEvent,
} from "./types.js";

const ALLOWED: Readonly<
  Record<ContradictionRecordState, readonly ContradictionRecordState[]>
> = {
  open: [
    "resolved_by_supersession",
    "resolved_by_scope_split",
    "resolved_by_retraction",
    "unresolved_archived",
  ],
  resolved_by_supersession: [],
  resolved_by_scope_split: [],
  resolved_by_retraction: [],
  unresolved_archived: [],
};

export interface ContradictionRecordTransitionInput {
  readonly to: ContradictionRecordState;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref?: string;
  readonly at: string;
  readonly event_id?: string;
  readonly resolution_note?: string;
}

export class ContradictionTransitionService {
  private readonly validator = new ContradictionValidator();
  private readonly events = new ContradictionEventBuilder();

  isAllowed(from: ContradictionRecordState, to: ContradictionRecordState): boolean {
    return ALLOWED[from].includes(to);
  }

  /** S11 — legality only. */
  assertTransitionLegal(
    contradiction: Contradiction,
    to: ContradictionRecordState,
  ): void {
    if (!this.isAllowed(contradiction.record_state, to)) {
      throw new ContradictionValidationError(
        "F_TRANSITION",
        `Illegal Record State transition ${contradiction.record_state} → ${to}`,
      );
    }
  }

  /** S12 — Human Reviewer only (leave open). */
  assertHumanReviewerGate(
    _contradiction: Contradiction,
    input: ContradictionRecordTransitionInput,
  ): void {
    if (!leavesOpen(input.to)) {
      return;
    }
    if (!isContradictionHumanReviewerAgent(input.authority_agent)) {
      throw new ContradictionValidationError(
        "F6",
        "AI SHALL NOT leave open; Human Reviewer required",
        { authority_agent: input.authority_agent },
      );
    }
    const ref = input.decision_ref !== undefined ? contradictionNfcTrim(input.decision_ref) : "";
    if (ref.length < 1) {
      throw new ContradictionValidationError(
        "F_TRANSITION",
        "Leaving open requires non-empty decision_ref",
      );
    }
    if (isResolvedState(input.to)) {
      const note =
        input.resolution_note !== undefined
          ? contradictionNfcTrim(input.resolution_note)
          : "";
      if (note.length < 1) {
        throw new ContradictionValidationError(
          "F7",
          "resolved_* transition requires non-empty resolution_note",
        );
      }
    }
  }

  transition(
    contradiction: Contradiction,
    input: ContradictionRecordTransitionInput,
  ): Contradiction {
    this.assertTransitionLegal(contradiction, input.to);
    this.assertHumanReviewerGate(contradiction, input);

    const crte = this.events.build({
      from_state: contradiction.record_state,
      to_state: input.to,
      authority_agent: input.authority_agent,
      reason: input.reason,
      ...(input.decision_ref !== undefined ? { decision_ref: input.decision_ref } : {}),
      at: input.at,
      ...(input.event_id !== undefined ? { event_id: input.event_id } : {}),
      requireHuman: leavesOpen(input.to),
    });

    const log: readonly ContradictionRecordTransitionEvent[] = Object.freeze([
      ...(contradiction.record_transition_log ?? []),
      crte,
    ]);

    let resolution_note = contradiction.resolution_note;
    if (isResolvedState(input.to) && input.resolution_note !== undefined) {
      const nextNote = contradictionNfcTrim(input.resolution_note);
      const priorNote = resolution_note ? contradictionNfcTrim(resolution_note) : "";
      if (priorNote.length > 0 && priorNote !== nextNote) {
        throw new ContradictionValidationError(
          "F8",
          "Changing existing non-empty resolution_note requires new contradiction_version",
        );
      }
      if (priorNote.length < 1) {
        resolution_note = nextNote;
      }
    }

    const next: Contradiction = Object.freeze({
      contradiction_id: contradiction.contradiction_id,
      ontology_ref: contradiction.ontology_ref,
      spec_ref: contradiction.spec_ref,
      contradiction_version: contradiction.contradiction_version,
      record_state: input.to,
      summary: contradiction.summary,
      involved_claims: contradiction.involved_claims,
      overlap_statement: contradiction.overlap_statement,
      incompatibility_statement: contradiction.incompatibility_statement,
      ethics_constraint_marker: "non_clinical",
      provenance: contradiction.provenance,
      created_by: contradiction.created_by,
      created_at: contradiction.created_at,
      record_transition_log: log,
      ...(contradiction.evidence_refs
        ? { evidence_refs: contradiction.evidence_refs }
        : {}),
      ...(resolution_note ? { resolution_note } : {}),
      ...(contradiction.ai_assisted !== undefined
        ? { ai_assisted: contradiction.ai_assisted }
        : {}),
      ...(contradiction.human_sponsor
        ? { human_sponsor: contradiction.human_sponsor }
        : {}),
    });

    this.validator.validate(next);
    return next;
  }
}

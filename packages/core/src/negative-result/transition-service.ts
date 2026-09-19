import { NegativeResultEventBuilder } from "./event-builder.js";
import { NegativeResultValidationError } from "./errors.js";
import {
  isNegativeResultHumanReviewerAgent,
  negativeResultNfcTrim,
  requiresHumanForTransition,
} from "./identifiers.js";
import { NegativeResultValidator } from "./validator.js";
import type {
  CreateNegativeResultInput,
  NegativeResult,
  NegativeResultRecordState,
  NegativeResultTransitionEvent,
} from "./types.js";

const ALLOWED: Readonly<
  Record<NegativeResultRecordState, readonly NegativeResultRecordState[]>
> = {
  registered: ["withdrawn"],
  withdrawn: [],
};

export interface NegativeResultRecordTransitionInput {
  readonly to: NegativeResultRecordState;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref: string;
  readonly at: string;
  readonly event_id?: string;
  readonly withdrawal_reason?: string;
}

export class NegativeResultTransitionService {
  private readonly validator = new NegativeResultValidator();
  private readonly events = new NegativeResultEventBuilder();

  isAllowed(from: NegativeResultRecordState, to: NegativeResultRecordState): boolean {
    return ALLOWED[from].includes(to);
  }

  /** S11 — legality only (registered → withdrawn). */
  assertTransitionLegal(nr: NegativeResult, to: NegativeResultRecordState): void {
    if (!this.isAllowed(nr.record_state, to)) {
      throw new NegativeResultValidationError(
        "F_TRANSITION",
        `Illegal Record State transition ${nr.record_state} → ${to}`,
      );
    }
  }

  /** S11 — (new) → registered is always the only issuance edge. */
  assertRegistrationLegal(to: NegativeResultRecordState): void {
    if (to !== "registered") {
      throw new NegativeResultValidationError(
        "F_TRANSITION",
        `Illegal issuance target ${to}; only registered allowed from new`,
      );
    }
  }

  /**
   * S12 — Human Reviewer for registration and withdrawal (SCI-005 §7.6 / §9.4).
   */
  assertHumanReviewerGate(input: NegativeResultRecordTransitionInput): void {
    if (!requiresHumanForTransition(input.to)) {
      return;
    }
    if (!isNegativeResultHumanReviewerAgent(input.authority_agent)) {
      throw new NegativeResultValidationError(
        "F5",
        input.to === "registered"
          ? "AI SHALL NOT register Negative Result; Human Reviewer required"
          : "AI SHALL NOT withdraw Negative Result; Human Reviewer required",
        { authority_agent: input.authority_agent },
      );
    }
    const ref = negativeResultNfcTrim(input.decision_ref);
    if (ref.length < 1) {
      throw new NegativeResultValidationError(
        "F_TRANSITION",
        "Registration/withdrawal requires non-empty decision_ref",
      );
    }
    if (input.to === "withdrawn") {
      const reason =
        input.withdrawal_reason !== undefined
          ? negativeResultNfcTrim(input.withdrawal_reason)
          : "";
      if (reason.length < 1) {
        throw new NegativeResultValidationError(
          "F7",
          "withdrawn transition requires non-empty withdrawal_reason",
        );
      }
    }
  }

  /** (new) → registered with initial NRTE. */
  register(
    content: CreateNegativeResultInput,
    input: NegativeResultRecordTransitionInput,
  ): NegativeResult {
    this.assertRegistrationLegal(input.to);
    this.assertHumanReviewerGate(input);

    const nrte = this.events.build({
      from_state: "null",
      to_state: "registered",
      authority_agent: input.authority_agent,
      reason: input.reason,
      decision_ref: input.decision_ref,
      at: input.at,
      ...(input.event_id !== undefined ? { event_id: input.event_id } : {}),
    });

    const nr: NegativeResult = Object.freeze({
      negative_result_id: content.negative_result_id,
      ontology_ref: content.ontology_ref ?? "SCI-000@0.1.0",
      spec_ref: content.spec_ref ?? "SCI-005@0.1.0",
      negative_result_version: content.negative_result_version ?? "1.0.0",
      record_state: "registered",
      summary: negativeResultNfcTrim(content.summary),
      description: negativeResultNfcTrim(content.description),
      expected_observation: negativeResultNfcTrim(content.expected_observation),
      observed_absence: negativeResultNfcTrim(content.observed_absence),
      scope: Object.freeze({
        domain_context: negativeResultNfcTrim(content.scope.domain_context),
        bounds: negativeResultNfcTrim(content.scope.bounds),
        exclusions: negativeResultNfcTrim(content.scope.exclusions),
      }),
      protocol_ref: negativeResultNfcTrim(content.protocol_ref),
      sensitivity_context: negativeResultNfcTrim(content.sensitivity_context),
      ethics_constraint_marker: "non_clinical",
      provenance: Object.freeze({
        completeness: content.provenance.completeness,
        recorded_at: content.provenance.recorded_at,
        custody_agent: negativeResultNfcTrim(content.provenance.custody_agent),
        method_summary: negativeResultNfcTrim(content.provenance.method_summary),
      }),
      created_by: negativeResultNfcTrim(content.created_by),
      created_at: content.created_at,
      record_transition_log: Object.freeze([nrte]),
      ...(content.claim_refs ? { claim_refs: Object.freeze([...content.claim_refs]) } : {}),
      ...(content.evidence_refs
        ? { evidence_refs: Object.freeze([...content.evidence_refs]) }
        : {}),
      ...(content.contradiction_refs
        ? { contradiction_refs: Object.freeze([...content.contradiction_refs]) }
        : {}),
      ...(content.verification_refs
        ? { verification_refs: Object.freeze([...content.verification_refs]) }
        : {}),
      ...(content.ai_assisted !== undefined ? { ai_assisted: content.ai_assisted } : {}),
      ...(content.human_sponsor
        ? { human_sponsor: negativeResultNfcTrim(content.human_sponsor) }
        : {}),
    });

    this.validator.validate(nr);
    return nr;
  }

  transition(nr: NegativeResult, input: NegativeResultRecordTransitionInput): NegativeResult {
    this.assertTransitionLegal(nr, input.to);
    this.assertHumanReviewerGate(input);

    const nrte = this.events.build({
      from_state: nr.record_state,
      to_state: input.to,
      authority_agent: input.authority_agent,
      reason: input.reason,
      decision_ref: input.decision_ref,
      at: input.at,
      ...(input.event_id !== undefined ? { event_id: input.event_id } : {}),
    });

    const log: readonly NegativeResultTransitionEvent[] = Object.freeze([
      ...(nr.record_transition_log ?? []),
      nrte,
    ]);

    const withdrawal_reason =
      input.to === "withdrawn" && input.withdrawal_reason !== undefined
        ? negativeResultNfcTrim(input.withdrawal_reason)
        : nr.withdrawal_reason;

    const next: NegativeResult = Object.freeze({
      negative_result_id: nr.negative_result_id,
      ontology_ref: nr.ontology_ref,
      spec_ref: nr.spec_ref,
      negative_result_version: nr.negative_result_version,
      record_state: input.to,
      summary: nr.summary,
      description: nr.description,
      expected_observation: nr.expected_observation,
      observed_absence: nr.observed_absence,
      scope: nr.scope,
      protocol_ref: nr.protocol_ref,
      sensitivity_context: nr.sensitivity_context,
      ethics_constraint_marker: "non_clinical",
      provenance: nr.provenance,
      created_by: nr.created_by,
      created_at: nr.created_at,
      record_transition_log: log,
      ...(nr.claim_refs ? { claim_refs: nr.claim_refs } : {}),
      ...(nr.evidence_refs ? { evidence_refs: nr.evidence_refs } : {}),
      ...(nr.contradiction_refs ? { contradiction_refs: nr.contradiction_refs } : {}),
      ...(nr.verification_refs ? { verification_refs: nr.verification_refs } : {}),
      ...(nr.ai_assisted !== undefined ? { ai_assisted: nr.ai_assisted } : {}),
      ...(nr.human_sponsor ? { human_sponsor: nr.human_sponsor } : {}),
      ...(withdrawal_reason ? { withdrawal_reason } : {}),
    });

    this.validator.validate(next);
    return next;
  }
}

import { VerificationEventBuilder } from "./event-builder.js";
import { VerificationValidationError } from "./errors.js";
import {
  isVerificationHumanReviewerAgent,
  leavesPlanned,
  verificationNfcTrim,
} from "./identifiers.js";
import { VerificationValidator } from "./validator.js";
import type {
  CreateVerificationInput,
  Verification,
  VerificationOutcome,
  VerificationRecordState,
  VerificationTransitionEvent,
} from "./types.js";

const ALLOWED: Readonly<
  Record<VerificationRecordState, readonly VerificationRecordState[]>
> = {
  planned: ["passed", "failed", "inconclusive"],
  passed: [],
  failed: [],
  inconclusive: [],
};

const OUTCOME_FOR: Readonly<Record<VerificationRecordState, VerificationOutcome>> = {
  planned: "pending",
  passed: "passed",
  failed: "failed",
  inconclusive: "inconclusive",
};

export interface VerificationRecordTransitionInput {
  readonly to: VerificationRecordState;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref?: string;
  readonly at: string;
  readonly event_id?: string;
}

export class VerificationTransitionService {
  private readonly validator = new VerificationValidator();
  private readonly events = new VerificationEventBuilder();

  isAllowed(from: VerificationRecordState, to: VerificationRecordState): boolean {
    return ALLOWED[from].includes(to);
  }

  /** S11 — legality only. */
  assertTransitionLegal(v: Verification, to: VerificationRecordState): void {
    if (!this.isAllowed(v.record_state, to)) {
      throw new VerificationValidationError(
        "F_TRANSITION",
        `Illegal Record State transition ${v.record_state} → ${to}`,
      );
    }
  }

  /**
   * S12 — Human Reviewer when leaving planned (SCI-006 §7.6 / §9.4).
   */
  assertHumanReviewerGate(input: VerificationRecordTransitionInput): void {
    if (!leavesPlanned(input.to)) {
      return;
    }
    if (!isVerificationHumanReviewerAgent(input.authority_agent)) {
      throw new VerificationValidationError(
        "F7",
        "AI SHALL NOT promote Verification out of planned; Human Reviewer required",
        { authority_agent: input.authority_agent },
      );
    }
    const ref = input.decision_ref !== undefined ? verificationNfcTrim(input.decision_ref) : "";
    if (ref.length < 1) {
      throw new VerificationValidationError(
        "F_TRANSITION",
        "Leaving planned requires non-empty decision_ref",
      );
    }
  }

  /** (new) → planned; VTE optional. */
  createPlanned(content: CreateVerificationInput): Verification {
    const v: Verification = Object.freeze({
      verification_id: content.verification_id,
      ontology_ref: content.ontology_ref ?? "SCI-000@0.1.0",
      spec_ref: content.spec_ref ?? "SCI-006@0.1.0",
      verification_version: content.verification_version ?? "1.0.0",
      record_state: "planned",
      verification_outcome: "pending",
      summary: verificationNfcTrim(content.summary),
      description: verificationNfcTrim(content.description),
      scope: Object.freeze({
        domain_context: verificationNfcTrim(content.scope.domain_context),
        bounds: verificationNfcTrim(content.scope.bounds),
        exclusions: verificationNfcTrim(content.scope.exclusions),
      }),
      protocol_ref: verificationNfcTrim(content.protocol_ref),
      verification_method: content.verification_method,
      verification_context: verificationNfcTrim(content.verification_context),
      verification_rationale: verificationNfcTrim(content.verification_rationale),
      ethics_constraint_marker: "non_clinical",
      provenance: Object.freeze({
        completeness: content.provenance.completeness,
        recorded_at: content.provenance.recorded_at,
        custody_agent: verificationNfcTrim(content.provenance.custody_agent),
        method_summary: verificationNfcTrim(content.provenance.method_summary),
      }),
      created_by: verificationNfcTrim(content.created_by),
      created_at: content.created_at,
      record_transition_log: Object.freeze([]),
      ...(content.claim_refs ? { claim_refs: Object.freeze([...content.claim_refs]) } : {}),
      ...(content.evidence_refs
        ? { evidence_refs: Object.freeze([...content.evidence_refs]) }
        : {}),
      ...(content.grade_refs ? { grade_refs: Object.freeze([...content.grade_refs]) } : {}),
      ...(content.contradiction_refs
        ? { contradiction_refs: Object.freeze([...content.contradiction_refs]) }
        : {}),
      ...(content.negative_result_refs
        ? { negative_result_refs: Object.freeze([...content.negative_result_refs]) }
        : {}),
      ...(content.artifact_ref
        ? { artifact_ref: verificationNfcTrim(content.artifact_ref) }
        : {}),
      ...(content.ai_assisted !== undefined ? { ai_assisted: content.ai_assisted } : {}),
      ...(content.human_sponsor
        ? { human_sponsor: verificationNfcTrim(content.human_sponsor) }
        : {}),
    });

    this.validator.validate(v);
    return v;
  }

  transition(v: Verification, input: VerificationRecordTransitionInput): Verification {
    this.assertTransitionLegal(v, input.to);
    this.assertHumanReviewerGate(input);

    const requireHuman = leavesPlanned(input.to);
    const vte = this.events.build({
      from_state: v.record_state,
      to_state: input.to,
      authority_agent: input.authority_agent,
      reason: input.reason,
      ...(input.decision_ref !== undefined ? { decision_ref: input.decision_ref } : {}),
      at: input.at,
      ...(input.event_id !== undefined ? { event_id: input.event_id } : {}),
      requireHuman,
    });

    const log: readonly VerificationTransitionEvent[] = Object.freeze([
      ...(v.record_transition_log ?? []),
      vte,
    ]);

    const next: Verification = Object.freeze({
      verification_id: v.verification_id,
      ontology_ref: v.ontology_ref,
      spec_ref: v.spec_ref,
      verification_version: v.verification_version,
      record_state: input.to,
      verification_outcome: OUTCOME_FOR[input.to],
      summary: v.summary,
      description: v.description,
      scope: v.scope,
      protocol_ref: v.protocol_ref,
      verification_method: v.verification_method,
      verification_context: v.verification_context,
      verification_rationale: v.verification_rationale,
      ethics_constraint_marker: "non_clinical",
      provenance: v.provenance,
      created_by: v.created_by,
      created_at: v.created_at,
      record_transition_log: log,
      ...(v.claim_refs ? { claim_refs: v.claim_refs } : {}),
      ...(v.evidence_refs ? { evidence_refs: v.evidence_refs } : {}),
      ...(v.grade_refs ? { grade_refs: v.grade_refs } : {}),
      ...(v.contradiction_refs ? { contradiction_refs: v.contradiction_refs } : {}),
      ...(v.negative_result_refs ? { negative_result_refs: v.negative_result_refs } : {}),
      ...(v.artifact_ref ? { artifact_ref: v.artifact_ref } : {}),
      ...(v.ai_assisted !== undefined ? { ai_assisted: v.ai_assisted } : {}),
      ...(v.human_sponsor ? { human_sponsor: v.human_sponsor } : {}),
    });

    this.validator.validate(next);
    return next;
  }
}

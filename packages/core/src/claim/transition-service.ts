import { ClaimValidationError } from "./errors.js";
import { isHumanReviewerAgent, requireHumanReviewer } from "./human-reviewer.js";
import { nfcTrim } from "./identifiers.js";
import { ClaimEventBuilder } from "./event-builder.js";
import { ClaimValidator } from "./validator.js";
import type { Claim, ClaimStanding, StandingTransitionEvent } from "./types.js";

const ALLOWED: Readonly<Record<ClaimStanding, readonly ClaimStanding[]>> = {
  draft_unverified: ["supported", "contested", "superseded", "retracted"],
  supported: ["contested", "superseded", "retracted"],
  contested: ["supported", "superseded", "retracted"],
  superseded: [],
  retracted: [],
};

/**
 * SCI-001 §9.2 machine-checkable marker for contested → supported.
 * Contradiction handling must be recorded in the Transition Event reason.
 */
export const CONTRADICTION_HANDLING_MARKER = "contradiction_handling_recorded";

export const CLINICAL_BOUNDARY_ACK = "clinical_boundary_ack";

export interface StandingTransitionInput {
  readonly to: ClaimStanding;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref?: string;
  readonly at: string;
  readonly event_id?: string;
  readonly supported_by?: readonly string[];
  readonly contested_by?: readonly string[];
  readonly retraction_reason?: string;
  readonly superseded_by?: string;
}

export function hasClinicalBoundaryAck(claim: Claim): boolean {
  const log = claim.standing_transition_log ?? [];
  return log.some(
    (e) =>
      isHumanReviewerAgent(e.authority_agent) &&
      e.reason.includes(CLINICAL_BOUNDARY_ACK),
  );
}

/**
 * Claim Standing transition service — SCI-001 §13 + Human Reviewer gates.
 * CODE-AUDIT P-002 / P-003 corrections applied.
 */
export class ClaimTransitionService {
  private readonly validator = new ClaimValidator();
  private readonly events = new ClaimEventBuilder();

  isAllowed(from: ClaimStanding, to: ClaimStanding): boolean {
    return ALLOWED[from].includes(to);
  }

  /** S11: transition legality only. */
  assertTransitionLegal(claim: Claim, to: ClaimStanding): void {
    if (!this.isAllowed(claim.standing, to)) {
      throw new ClaimValidationError(
        "F_TRANSITION",
        `Illegal Standing transition ${claim.standing} → ${to}`,
      );
    }
  }

  /**
   * S12: Human Reviewer gate only (SCI-001 §12.6–§12.7).
   * Does not execute the transition.
   */
  assertHumanReviewerGate(input: StandingTransitionInput): void {
    requireHumanReviewer(input.authority_agent, `transition to ${input.to}`);
    if (input.to === "supported") {
      const ref = input.decision_ref !== undefined ? nfcTrim(input.decision_ref) : "";
      if (ref.length < 1) {
        throw new ClaimValidationError(
          "F9",
          "Human gate: STE to supported requires non-empty decision_ref",
        );
      }
    }
  }

  /**
   * P-002: C-ETH requires clinical_boundary_ack on some Human STE in the log,
   * not necessarily on every new transition reason.
   */
  assertClinicalBoundaryAck(claim: Claim, input: StandingTransitionInput): void {
    if (hasClinicalBoundaryAck(claim)) {
      return;
    }
    if (!input.reason.includes(CLINICAL_BOUNDARY_ACK)) {
      throw new ClaimValidationError(
        "F_C_ETH",
        "C-ETH: no prior clinical_boundary_ack STE; this transition reason must include it",
      );
    }
    if (!isHumanReviewerAgent(input.authority_agent)) {
      throw new ClaimValidationError(
        "F_C_ETH",
        "C-ETH acknowledgement STE requires Human Reviewer authority_agent",
      );
    }
  }

  /**
   * P-003: contested → supported requires contradiction-handling marker in reason (§9.2).
   */
  assertContestedToSupportedJustification(
    claim: Claim,
    input: StandingTransitionInput,
  ): void {
    if (claim.standing === "contested" && input.to === "supported") {
      if (!input.reason.includes(CONTRADICTION_HANDLING_MARKER)) {
        throw new ClaimValidationError(
          "F_TRANSITION",
          `contested→supported requires reason containing ${CONTRADICTION_HANDLING_MARKER}`,
        );
      }
    }
  }

  transition(claim: Claim, input: StandingTransitionInput): Claim {
    this.assertTransitionLegal(claim, input.to);
    this.assertHumanReviewerGate(input);
    this.assertClinicalBoundaryAck(claim, input);
    this.assertContestedToSupportedJustification(claim, input);

    const ste = this.events.build({
      from_standing: claim.standing,
      to_standing: input.to,
      authority_agent: input.authority_agent,
      reason: input.reason,
      ...(input.decision_ref !== undefined ? { decision_ref: input.decision_ref } : {}),
      at: input.at,
      ...(input.event_id !== undefined ? { event_id: input.event_id } : {}),
      requireHuman: true,
    });

    const log: readonly StandingTransitionEvent[] = Object.freeze([
      ...(claim.standing_transition_log ?? []),
      ste,
    ]);

    const supported_by = Object.freeze([
      ...(input.supported_by ?? claim.supported_by ?? []),
    ] as string[]);
    const contested_by = Object.freeze([
      ...(input.contested_by ?? claim.contested_by ?? []),
    ] as string[]);

    const base: Claim = {
      claim_id: claim.claim_id,
      ontology_ref: claim.ontology_ref,
      spec_ref: claim.spec_ref,
      claim_version: claim.claim_version,
      proposition: claim.proposition,
      scope: claim.scope,
      standing: input.to,
      ethics_constraint_marker: "non_clinical",
      created_by: claim.created_by,
      created_at: claim.created_at,
      standing_transition_log: log,
      supported_by,
      contested_by,
      ...(claim.ai_assisted !== undefined ? { ai_assisted: claim.ai_assisted } : {}),
      ...(claim.human_sponsor !== undefined ? { human_sponsor: claim.human_sponsor } : {}),
      ...(claim.qualified_by ? { qualified_by: claim.qualified_by } : {}),
      ...(claim.verified_via ? { verified_via: claim.verified_via } : {}),
      ...(claim.supersedes ? { supersedes: claim.supersedes } : {}),
      ...(claim.protocol_ref ? { protocol_ref: claim.protocol_ref } : {}),
      ...(claim.dataset_refs ? { dataset_refs: claim.dataset_refs } : {}),
      ...(claim.citation_refs ? { citation_refs: claim.citation_refs } : {}),
      ...(claim.entity_bindings ? { entity_bindings: claim.entity_bindings } : {}),
      ...(claim.assumes ? { assumes: claim.assumes } : {}),
      ...(input.to === "retracted"
        ? {
            retraction_reason: nfcTrim(
              input.retraction_reason ?? claim.retraction_reason ?? "",
            ),
          }
        : claim.retraction_reason
          ? { retraction_reason: claim.retraction_reason }
          : {}),
      ...(input.to === "superseded"
        ? {
            superseded_by: nfcTrim(input.superseded_by ?? claim.superseded_by ?? ""),
          }
        : claim.superseded_by
          ? { superseded_by: claim.superseded_by }
          : {}),
    };

    const next = Object.freeze(base);
    this.validator.validate(next);
    return next;
  }
}

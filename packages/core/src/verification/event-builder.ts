import { randomUUID } from "node:crypto";
import {
  VTE_ID,
  isVerificationHumanReviewerAgent,
  leavesPlanned,
  verificationNfcTrim,
} from "./identifiers.js";
import { VerificationValidationError } from "./errors.js";
import type {
  VerificationRecordState,
  VerificationTransitionEvent,
} from "./types.js";

export interface VteBuildInput {
  readonly from_state: VerificationRecordState | "null";
  readonly to_state: VerificationRecordState;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref?: string;
  readonly at: string;
  readonly event_id?: string;
  readonly requireHuman: boolean;
}

export class VerificationEventBuilder {
  build(input: VteBuildInput): VerificationTransitionEvent {
    const reason = verificationNfcTrim(input.reason);
    if (reason.length < 1) {
      throw new VerificationValidationError("F_TRANSITION", "VTE reason must be non-empty");
    }
    if (input.requireHuman && !isVerificationHumanReviewerAgent(input.authority_agent)) {
      throw new VerificationValidationError(
        "F7",
        "Human Reviewer required to leave planned; AI SHALL NOT promote",
        { authority_agent: input.authority_agent },
      );
    }
    let decision_ref: string | undefined;
    if (leavesPlanned(input.to_state)) {
      const ref = input.decision_ref !== undefined ? verificationNfcTrim(input.decision_ref) : "";
      if (ref.length < 1) {
        throw new VerificationValidationError(
          "F_TRANSITION",
          "VTE leaving planned requires non-empty decision_ref",
        );
      }
      decision_ref = ref;
    } else if (input.decision_ref !== undefined) {
      decision_ref = verificationNfcTrim(input.decision_ref);
    }
    const event_id =
      input.event_id ?? `vte:${randomUUID().replace(/-/g, "").slice(0, 24)}`;
    if (!VTE_ID.test(event_id)) {
      throw new VerificationValidationError(
        "F_TRANSITION",
        `Invalid VTE event_id: ${event_id}`,
      );
    }
    return Object.freeze({
      event_id,
      at: input.at,
      from_state: input.from_state,
      to_state: input.to_state,
      authority_agent: input.authority_agent,
      reason,
      ...(decision_ref !== undefined && decision_ref.length > 0 ? { decision_ref } : {}),
    });
  }
}

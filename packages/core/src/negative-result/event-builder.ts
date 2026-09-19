import { randomUUID } from "node:crypto";
import {
  NRTE_ID,
  isNegativeResultHumanReviewerAgent,
  negativeResultNfcTrim,
} from "./identifiers.js";
import { NegativeResultValidationError } from "./errors.js";
import type {
  NegativeResultRecordState,
  NegativeResultTransitionEvent,
} from "./types.js";

export interface NrteBuildInput {
  readonly from_state: NegativeResultRecordState | "null";
  readonly to_state: NegativeResultRecordState;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref: string;
  readonly at: string;
  readonly event_id?: string;
}

export class NegativeResultEventBuilder {
  build(input: NrteBuildInput): NegativeResultTransitionEvent {
    const reason = negativeResultNfcTrim(input.reason);
    if (reason.length < 1) {
      throw new NegativeResultValidationError("F_TRANSITION", "NRTE reason must be non-empty");
    }
    if (!isNegativeResultHumanReviewerAgent(input.authority_agent)) {
      throw new NegativeResultValidationError(
        "F5",
        "Human Reviewer required; AI SHALL NOT register or withdraw",
        { authority_agent: input.authority_agent },
      );
    }
    const decision_ref = negativeResultNfcTrim(input.decision_ref);
    if (decision_ref.length < 1) {
      throw new NegativeResultValidationError(
        "F_TRANSITION",
        "NRTE requires non-empty decision_ref",
      );
    }
    const event_id =
      input.event_id ?? `nrte:${randomUUID().replace(/-/g, "").slice(0, 24)}`;
    if (!NRTE_ID.test(event_id)) {
      throw new NegativeResultValidationError(
        "F_TRANSITION",
        `Invalid NRTE event_id: ${event_id}`,
      );
    }
    return Object.freeze({
      event_id,
      at: input.at,
      from_state: input.from_state,
      to_state: input.to_state,
      authority_agent: input.authority_agent,
      reason,
      decision_ref,
    });
  }
}

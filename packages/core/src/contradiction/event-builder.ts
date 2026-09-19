import { randomUUID } from "node:crypto";
import {
  CRTE_ID,
  contradictionNfcTrim,
  isContradictionHumanReviewerAgent,
  leavesOpen,
} from "./identifiers.js";
import { ContradictionValidationError } from "./errors.js";
import type {
  ContradictionRecordState,
  ContradictionRecordTransitionEvent,
} from "./types.js";

export interface CrteBuildInput {
  readonly from_state: ContradictionRecordState | "null";
  readonly to_state: ContradictionRecordState;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref?: string;
  readonly at: string;
  readonly event_id?: string;
  readonly requireHuman: boolean;
}

export class ContradictionEventBuilder {
  build(input: CrteBuildInput): ContradictionRecordTransitionEvent {
    const reason = contradictionNfcTrim(input.reason);
    if (reason.length < 1) {
      throw new ContradictionValidationError("F_TRANSITION", "CRTE reason must be non-empty");
    }
    if (input.requireHuman && !isContradictionHumanReviewerAgent(input.authority_agent)) {
      throw new ContradictionValidationError(
        "F6",
        "Human Reviewer required to leave open; AI SHALL NOT be sole authority",
        { authority_agent: input.authority_agent },
      );
    }
    let decision_ref: string | undefined;
    if (leavesOpen(input.to_state)) {
      const ref = input.decision_ref !== undefined ? contradictionNfcTrim(input.decision_ref) : "";
      if (ref.length < 1) {
        throw new ContradictionValidationError(
          "F_TRANSITION",
          "CRTE leaving open requires non-empty decision_ref",
        );
      }
      decision_ref = ref;
    } else if (input.decision_ref !== undefined) {
      decision_ref = contradictionNfcTrim(input.decision_ref);
    }
    const event_id =
      input.event_id ?? `crte:${randomUUID().replace(/-/g, "").slice(0, 24)}`;
    if (!CRTE_ID.test(event_id)) {
      throw new ContradictionValidationError(
        "F_TRANSITION",
        `Invalid CRTE event_id: ${event_id}`,
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

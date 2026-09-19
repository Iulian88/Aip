import { randomUUID } from "node:crypto";
import { STE_ID, nfcTrim } from "./identifiers.js";
import { ClaimValidationError } from "./errors.js";
import { requireHumanReviewer } from "./human-reviewer.js";
import type { ClaimStanding, StandingTransitionEvent } from "./types.js";

export interface SteBuildInput {
  readonly from_standing: ClaimStanding | "null";
  readonly to_standing: ClaimStanding;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref?: string;
  readonly at: string;
  readonly event_id?: string;
  readonly requireHuman: boolean;
}

/**
 * Builds SCI-001 §12.7 Standing Transition Events (append-only records).
 */
export class ClaimEventBuilder {
  build(input: SteBuildInput): StandingTransitionEvent {
    const reason = nfcTrim(input.reason);
    if (reason.length < 1) {
      throw new ClaimValidationError("F_TRANSITION", "STE reason must be non-empty");
    }

    if (input.requireHuman) {
      requireHumanReviewer(input.authority_agent, `STE to ${input.to_standing}`);
    }

    let decision_ref: string | undefined;
    if (input.to_standing === "supported") {
      const ref = input.decision_ref !== undefined ? nfcTrim(input.decision_ref) : "";
      if (ref.length < 1) {
        throw new ClaimValidationError(
          "F9",
          "STE to supported requires non-empty decision_ref",
        );
      }
      decision_ref = ref;
    } else if (input.decision_ref !== undefined) {
      decision_ref = nfcTrim(input.decision_ref);
    }

    const event_id = input.event_id ?? `ste:${randomUUID().replace(/-/g, "").slice(0, 24)}`;
    if (!STE_ID.test(event_id)) {
      throw new ClaimValidationError("F_TRANSITION", `Invalid STE event_id: ${event_id}`);
    }

    const event: StandingTransitionEvent = {
      event_id,
      at: input.at,
      from_standing: input.from_standing,
      to_standing: input.to_standing,
      authority_agent: input.authority_agent,
      reason,
      ...(decision_ref !== undefined && decision_ref.length > 0
        ? { decision_ref }
        : {}),
    };
    return Object.freeze(event);
  }
}

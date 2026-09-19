import { randomUUID } from "node:crypto";
import { ERTE_ID, isEvidenceHumanReviewerAgent, evidenceNfcTrim } from "./identifiers.js";
import { EvidenceValidationError } from "./errors.js";
import type { EvidenceRecordState, EvidenceRecordTransitionEvent } from "./types.js";

export interface ErteBuildInput {
  readonly from_state: EvidenceRecordState | "null";
  readonly to_state: EvidenceRecordState;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref?: string;
  readonly at: string;
  readonly event_id?: string;
  readonly requireHuman: boolean;
}

export class EvidenceEventBuilder {
  build(input: ErteBuildInput): EvidenceRecordTransitionEvent {
    const reason = evidenceNfcTrim(input.reason);
    if (reason.length < 1) {
      throw new EvidenceValidationError("F_TRANSITION", "ERTE reason must be non-empty");
    }
    if (input.requireHuman && !isEvidenceHumanReviewerAgent(input.authority_agent)) {
      throw new EvidenceValidationError(
        "F5",
        "Human Reviewer required for gated Evidence Record State transition",
        { authority_agent: input.authority_agent },
      );
    }
    let decision_ref: string | undefined;
    if (input.to_state === "registered") {
      const ref = input.decision_ref !== undefined ? evidenceNfcTrim(input.decision_ref) : "";
      if (ref.length < 1) {
        throw new EvidenceValidationError(
          "F4",
          "ERTE to registered requires non-empty decision_ref",
        );
      }
      decision_ref = ref;
    } else if (input.decision_ref !== undefined) {
      decision_ref = evidenceNfcTrim(input.decision_ref);
    }
    const event_id =
      input.event_id ?? `erte:${randomUUID().replace(/-/g, "").slice(0, 24)}`;
    if (!ERTE_ID.test(event_id)) {
      throw new EvidenceValidationError("F_TRANSITION", `Invalid ERTE event_id: ${event_id}`);
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

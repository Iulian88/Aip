/**
 * REF-TEST-002 — SCI-006 Verification fixtures (valid / invalid / transition).
 */
import { VerificationTransitionService } from "@sciros/core";
import type { ReferenceFixture } from "../types.js";
import { AI_AGENT, AT_NEXT, DECISION, HUMAN, sampleVerification } from "./support.js";

export const verificationFixtures: readonly ReferenceFixture[] = [
  {
    fixture_id: "REF-VERIF-001",
    title: "Verification planned creation is valid",
    scenario: "valid",
    authorities: ["SCI-006", "SCI-000"],
    expectation: { outcome: "success" },
    execute(check) {
      const verification = sampleVerification();
      check.equal("record_state", verification.record_state, "planned");
      check.equal("outcome pending", verification.verification_outcome, "pending");
      check.equal("method", verification.verification_method, "reproduction");
    },
  },
  {
    fixture_id: "REF-VERIF-002",
    title: "AI promotion out of planned is rejected",
    scenario: "invalid",
    authorities: ["SCI-006"],
    expectation: { outcome: "failure", failure_code: "F7" },
    execute() {
      new VerificationTransitionService().transition(sampleVerification(), {
        to: "passed",
        authority_agent: AI_AGENT,
        reason: "ai conclude attempt",
        decision_ref: DECISION,
        at: AT_NEXT,
      });
    },
  },
  {
    fixture_id: "REF-VERIF-003",
    title: "Verification planned → passed with Human Reviewer",
    scenario: "transition",
    authorities: ["SCI-006", "ADR-0006"],
    expectation: { outcome: "success" },
    execute(check) {
      const next = new VerificationTransitionService().transition(sampleVerification(), {
        to: "passed",
        authority_agent: HUMAN,
        reason: "reference verification concluded",
        decision_ref: DECISION,
        at: AT_NEXT,
      });
      check.equal("record_state", next.record_state, "passed");
      check.equal("outcome follows state", next.verification_outcome, "passed");
      check.equal("VTE log", next.record_transition_log?.length, 1);
    },
  },
];

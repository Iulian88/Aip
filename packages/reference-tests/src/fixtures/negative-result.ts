/**
 * REF-TEST-002 — SCI-005 Negative Result fixtures (valid / invalid).
 */
import type { ReferenceFixture } from "../types.js";
import { AI_AGENT, sampleNegativeResult } from "./support.js";

export const negativeResultFixtures: readonly ReferenceFixture[] = [
  {
    fixture_id: "REF-NEGRES-001",
    title: "Negative Result registration with Human Reviewer is valid",
    scenario: "valid",
    authorities: ["SCI-005", "SCI-000"],
    expectation: { outcome: "success" },
    execute(check) {
      const nr = sampleNegativeResult();
      check.equal("record_state", nr.record_state, "registered");
      check.equal("NRTE log", nr.record_transition_log?.length, 1);
      check.equal("ethics marker", nr.ethics_constraint_marker, "non_clinical");
    },
  },
  {
    fixture_id: "REF-NEGRES-002",
    title: "AI registration of Negative Result is rejected",
    scenario: "invalid",
    authorities: ["SCI-005"],
    expectation: { outcome: "failure", failure_code: "F5" },
    execute() {
      sampleNegativeResult("negresult:ref012bad", AI_AGENT);
    },
  },
];

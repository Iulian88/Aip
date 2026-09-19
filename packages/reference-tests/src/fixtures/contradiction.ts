/**
 * REF-TEST-002 — SCI-004 Contradiction fixtures (valid / invalid).
 */
import { ContradictionFactory } from "@sciros/core";
import type { ReferenceFixture } from "../types.js";
import { AT, HUMAN, sampleContradiction } from "./support.js";

export const contradictionFixtures: readonly ReferenceFixture[] = [
  {
    fixture_id: "REF-CONTRA-001",
    title: "Contradiction open creation is valid",
    scenario: "valid",
    authorities: ["SCI-004", "SCI-000"],
    expectation: { outcome: "success" },
    execute(check) {
      const contradiction = sampleContradiction();
      check.equal("record_state", contradiction.record_state, "open");
      check.equal("involved claims", contradiction.involved_claims.length, 2);
      check.equal(
        "ethics marker",
        contradiction.ethics_constraint_marker,
        "non_clinical",
      );
    },
  },
  {
    fixture_id: "REF-CONTRA-002",
    title: "Contradiction with fewer than two Claims is rejected",
    scenario: "invalid",
    authorities: ["SCI-004"],
    expectation: { outcome: "failure", failure_code: "F2" },
    execute() {
      new ContradictionFactory().createOpen({
        contradiction_id: "contradiction:ref012bad",
        summary: "one-sided",
        overlap_statement: "overlap",
        incompatibility_statement: "incompatible",
        involved_claims: ["claim:ref012"],
        created_by: HUMAN,
        created_at: AT,
        provenance: {
          completeness: "complete",
          recorded_at: AT,
          custody_agent: HUMAN,
          method_summary: "manual",
        },
      });
    },
  },
];

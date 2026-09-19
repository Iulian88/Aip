/**
 * REF-TEST-002 — SCI-002 Evidence fixtures (valid / invalid / transition / event).
 */
import { EvidenceTransitionService } from "@sciros/core";
import type { ReferenceFixture } from "../types.js";
import { AI_AGENT, AT_NEXT, DECISION, HUMAN, sampleEvidence } from "./support.js";

export const evidenceFixtures: readonly ReferenceFixture[] = [
  {
    fixture_id: "REF-EVID-001",
    title: "Evidence draft creation is valid",
    scenario: "valid",
    authorities: ["SCI-002", "SCI-000"],
    expectation: { outcome: "success" },
    execute(check) {
      const evidence = sampleEvidence();
      check.equal("record_state", evidence.record_state, "draft");
      check.equal("grade sentinel", evidence.grade_ref, "deferred_sci003");
      check.equal("items", evidence.items.length, 1);
      check.equal("ethics marker", evidence.ethics_constraint_marker, "non_clinical");
    },
  },
  {
    fixture_id: "REF-EVID-002",
    title: "Evidence with empty source_locator is rejected",
    scenario: "invalid",
    authorities: ["SCI-002"],
    expectation: { outcome: "failure", failure_code: "F2" },
    execute() {
      sampleEvidence("evidence:ref012bad", {
        source: {
          source_class: "laboratory",
          source_locator: "  ",
          source_state: "declared",
        },
      });
    },
  },
  {
    fixture_id: "REF-EVID-003",
    title: "Evidence draft → registered with Human Reviewer",
    scenario: "transition",
    authorities: ["SCI-002", "ADR-0006"],
    expectation: { outcome: "success" },
    execute(check) {
      const next = new EvidenceTransitionService().transition(sampleEvidence(), {
        to: "registered",
        authority_agent: HUMAN,
        reason: "registration for reference tests",
        decision_ref: DECISION,
        at: AT_NEXT,
      });
      check.equal("record_state", next.record_state, "registered");
      check.equal("log grows", next.record_transition_log?.length, 1);
      check.equal("version stable on transition", next.evidence_version, "1.0.0");
    },
  },
  {
    fixture_id: "REF-EVID-004",
    title: "AI registration of Evidence is rejected",
    scenario: "transition",
    authorities: ["SCI-002"],
    expectation: { outcome: "failure", failure_code: "F5" },
    execute() {
      new EvidenceTransitionService().transition(sampleEvidence(), {
        to: "registered",
        authority_agent: AI_AGENT,
        reason: "ai attempt",
        decision_ref: DECISION,
        at: AT_NEXT,
      });
    },
  },
  {
    fixture_id: "REF-EVID-005",
    title: "Evidence Record Transition Event grammar",
    scenario: "event",
    authorities: ["SCI-002"],
    expectation: { outcome: "success" },
    execute(check) {
      const next = new EvidenceTransitionService().transition(sampleEvidence(), {
        to: "registered",
        authority_agent: HUMAN,
        reason: "event fixture registration",
        decision_ref: DECISION,
        at: AT_NEXT,
      });
      const erte = next.record_transition_log?.[0];
      check.ok("ERTE present", erte !== undefined);
      check.ok("ERTE id grammar", /^erte:[A-Za-z0-9._~-]{1,128}$/.test(erte?.event_id ?? ""));
      check.equal("from_state", erte?.from_state, "draft");
      check.equal("to_state", erte?.to_state, "registered");
      check.equal("decision_ref", erte?.decision_ref, DECISION);
    },
  },
];

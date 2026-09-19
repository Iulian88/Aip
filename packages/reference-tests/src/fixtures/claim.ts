/**
 * REF-TEST-002 — SCI-001 Claim fixtures (valid / invalid / transition / version / event).
 */
import {
  ClaimFactory,
  ClaimTransitionService,
  ClaimVersionService,
  CLINICAL_BOUNDARY_ACK,
} from "@sciros/core";
import type { ReferenceFixture } from "../types.js";
import { AT, AT_NEXT, DECISION, HUMAN, SCOPE, sampleClaim } from "./support.js";

export const claimFixtures: readonly ReferenceFixture[] = [
  {
    fixture_id: "REF-CLAIM-001",
    title: "Claim draft creation is valid",
    scenario: "valid",
    authorities: ["SCI-001", "SCI-000"],
    expectation: { outcome: "success" },
    execute(check) {
      const claim = sampleClaim();
      check.equal("standing", claim.standing, "draft_unverified");
      check.equal("ethics marker", claim.ethics_constraint_marker, "non_clinical");
      check.equal("version", claim.claim_version, "1.0.0");
      check.equal("empty transition log", claim.standing_transition_log?.length, 0);
    },
  },
  {
    fixture_id: "REF-CLAIM-002",
    title: "Claim with empty proposition is rejected",
    scenario: "invalid",
    authorities: ["SCI-001"],
    expectation: { outcome: "failure", failure_code: "F1" },
    execute() {
      new ClaimFactory().createDraft({
        claim_id: "claim:ref012bad",
        proposition: "   ",
        scope: SCOPE,
        created_by: HUMAN,
        created_at: AT,
      });
    },
  },
  {
    fixture_id: "REF-CLAIM-003",
    title: "Claim draft_unverified → supported with Human Reviewer",
    scenario: "transition",
    authorities: ["SCI-001", "ADR-0006"],
    expectation: { outcome: "success" },
    execute(check) {
      const next = new ClaimTransitionService().transition(sampleClaim(), {
        to: "supported",
        authority_agent: HUMAN,
        reason: `${CLINICAL_BOUNDARY_ACK} supported by reference evidence`,
        decision_ref: DECISION,
        at: AT_NEXT,
      });
      check.equal("standing", next.standing, "supported");
      check.equal("log grows", next.standing_transition_log?.length, 1);
      check.equal("identity stable", next.claim_id, "claim:ref012");
    },
  },
  {
    fixture_id: "REF-CLAIM-004",
    title: "Illegal Standing transition is rejected",
    scenario: "transition",
    authorities: ["SCI-001", "ADR-0006"],
    expectation: { outcome: "failure", failure_code: "F_TRANSITION" },
    execute() {
      new ClaimTransitionService().transition(sampleClaim(), {
        to: "draft_unverified",
        authority_agent: HUMAN,
        reason: `${CLINICAL_BOUNDARY_ACK} illegal loop`,
        decision_ref: DECISION,
        at: AT_NEXT,
      });
    },
  },
  {
    fixture_id: "REF-CLAIM-005",
    title: "Material update bumps claim_version and preserves history",
    scenario: "version",
    authorities: ["SCI-001"],
    expectation: { outcome: "success" },
    execute(check) {
      const prior = sampleClaim();
      const next = new ClaimVersionService().applyMaterialUpdate(prior, {
        proposition: "Reference test proposition (revised)",
        scope: SCOPE,
      });
      check.equal("version bumped", next.claim_version, "1.0.1");
      check.equal("standing preserved", next.standing, prior.standing);
      check.equal("identity stable", next.claim_id, prior.claim_id);
    },
  },
  {
    fixture_id: "REF-CLAIM-006",
    title: "Non-material update refuses version bump",
    scenario: "version",
    authorities: ["SCI-001"],
    expectation: { outcome: "failure", failure_code: "F5" },
    execute() {
      const prior = sampleClaim();
      new ClaimVersionService().applyMaterialUpdate(prior, {
        proposition: prior.proposition,
        scope: prior.scope,
      });
    },
  },
  {
    fixture_id: "REF-CLAIM-007",
    title: "Standing Transition Event grammar and journal append",
    scenario: "event",
    authorities: ["SCI-001"],
    expectation: { outcome: "success" },
    execute(check) {
      const next = new ClaimTransitionService().transition(sampleClaim(), {
        to: "supported",
        authority_agent: HUMAN,
        reason: `${CLINICAL_BOUNDARY_ACK} event fixture`,
        decision_ref: DECISION,
        at: AT_NEXT,
      });
      const ste = next.standing_transition_log?.[0];
      check.ok("STE present", ste !== undefined);
      check.ok("STE id grammar", /^ste:[A-Za-z0-9._~-]{1,128}$/.test(ste?.event_id ?? ""));
      check.equal("from_standing", ste?.from_standing, "draft_unverified");
      check.equal("to_standing", ste?.to_standing, "supported");
      check.equal("decision_ref", ste?.decision_ref, DECISION);
      check.equal("at", ste?.at, AT_NEXT);
    },
  },
];

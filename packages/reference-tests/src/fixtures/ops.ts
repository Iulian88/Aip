/**
 * REF-TEST-002 — REF-OPS fixtures (Sprint 017 / SPEC-017).
 * Executable evidence for Research Operations via ReferenceRunner.
 * Authorities cite OPS-001 (+ Core/ENC/SER as exercised). No PERSIST-001.
 */
import {
  OpsError,
  referenceAppMarker,
  claimFromClaimUnitPayload,
  contradictionFromContradictionUnitPayload,
  negativeResultFromNegativeResultUnitPayload,
  verificationFromVerificationUnitPayload,
} from "@sciros/reference-app";
import {
  ClaimTransitionService,
  CLINICAL_BOUNDARY_ACK,
  EvidenceValidationError,
} from "@sciros/core";
import { CanonicalEncoder } from "@sciros/encoding";
import { PersistenceError, entityFromCanonicalUnit } from "@sciros/persistence";
import { stableStringify } from "@sciros/serialization";
import type { ReferenceFixture } from "../types.js";
import {
  claimInput,
  contradictionInput,
  evidenceInput,
  makeOps,
  negativeResultInput,
  negativeResultRegistration,
  verificationInput,
  verificationLeavePlanned,
  OPS_AT,
  OPS_HUMAN,
} from "./ops-support.js";

export const opsFixtures: readonly ReferenceFixture[] = Object.freeze([
  {
    fixture_id: "REF-OPS-001",
    title: "ResearchSession lifecycle opens with caller-supplied id",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    execute(check) {
      const ops = makeOps("persist-sess:ref-ops-001");
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-001",
        title: "REF-OPS-001",
        purpose: "lifecycle",
      });
      check.equal(
        "session id",
        session.research_session_id,
        "research:session:ref-ops-001",
      );
      check.equal("empty membership", session.members().length, 0);
      check.ok(
        "ids distinct",
        session.research_session_id !== ops.persistenceSessionId,
      );
    },
  },
  {
    fixture_id: "REF-OPS-002",
    title: "Deterministic caller-supplied research_session_id is preserved",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    execute(check) {
      const id = "research:session:ref-ops-002-fixed";
      const a = makeOps("persist-sess:ref-ops-002a").openSession({
        research_session_id: id,
      });
      const b = makeOps("persist-sess:ref-ops-002b").openSession({
        research_session_id: id,
      });
      check.equal("identical ids", a.research_session_id, b.research_session_id);
      check.equal("exact id", a.research_session_id, id);
    },
  },
  {
    fixture_id: "REF-OPS-003",
    title: "Empty research_session_id is rejected (create-once session gate)",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "INVALID_SESSION" },
    execute() {
      makeOps("persist-sess:ref-ops-003").openSession({
        research_session_id: "   ",
      });
    },
  },
  {
    fixture_id: "REF-OPS-004",
    title: "Claim registration via OPS (Core → ENC → Persistence.create)",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-001", "ENC-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-004");
      const claimId = "claim:ref-ops-004";
      const { claim, unit, entity } = await ops.registerClaimUnit(
        claimInput(claimId),
      );
      check.equal("claim id", claim.claim_id, claimId);
      check.equal("standing", claim.standing, "draft_unverified");
      check.equal("unit_kind", unit.envelope.unit_kind, "ClaimUnit");
      check.equal("entity identity", entity.identity, claimId);
      check.equal("entity_kind", entity.entity_kind, "CanonicalUnit");
      const stored = await ops.getClaimUnit(claimId);
      check.equal("retrieved identity", stored.identity, claimId);
    },
  },
  {
    fixture_id: "REF-OPS-005",
    title: "Persistence.create-once rejection propagates ALREADY_EXISTS",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "ALREADY_EXISTS" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-005");
      const claimId = "claim:ref-ops-005";
      await ops.registerClaimUnit(claimInput(claimId));
      await ops.registerClaimUnit(claimInput(claimId));
    },
  },
  {
    fixture_id: "REF-OPS-006",
    title: "Explicit Persistence.appendEvent via OPS",
    scenario: "event",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-006");
      const claimId = "claim:ref-ops-006";
      await ops.registerClaimUnit(claimInput(claimId));
      const stored = await ops.appendResearchEvent(claimId, {
        event_id: "event:ref-ops-006",
        parent_identity: claimId,
        parent_class: "Claim",
        event_type: "ops.claim_unit_registered",
        ordinal: 0,
        at: OPS_AT,
        authority_agent: OPS_HUMAN,
        payload: { source: "REF-OPS-006" },
      });
      check.equal("event_id", stored.event_id, "event:ref-ops-006");
      check.equal("ordinal", stored.ordinal, 0);
      const events = await ops.getEvents(claimId);
      check.equal("event count", events.length, 1);
      check.equal("event type", events[0]?.event_type, "ops.claim_unit_registered");
    },
  },
  {
    fixture_id: "REF-OPS-007",
    title: "Session membership is memory-only OPS state",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-007");
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-007",
      });
      const claimId = "claim:ref-ops-007";
      await ops.registerClaimUnit(claimInput(claimId));
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        identity: claimId,
        unit_kind: "ClaimUnit",
      });
      check.equal("member count", session.members().length, 1);
      check.equal("member identity", session.members()[0]?.identity, claimId);
      const snap = await ops.repository.snapshot();
      check.ok(
        "session not in persistence entities",
        !snap.entities.some((e) => e.identity === session.research_session_id),
      );
    },
  },
  {
    fixture_id: "REF-OPS-008",
    title: "Invalid CanonicalUnit membership without unit_kind is rejected",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "INVALID_MEMBERSHIP" },
    execute() {
      const ops = makeOps("persist-sess:ref-ops-008");
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-008",
      });
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        identity: "claim:ref-ops-008",
      });
    },
  },
  {
    fixture_id: "REF-OPS-009",
    title: "Timeline reconstruction from Persistence journal",
    scenario: "event",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-009");
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-009",
      });
      const claimId = "claim:ref-ops-009";
      await ops.registerClaimUnit(claimInput(claimId));
      await ops.appendResearchEvent(claimId, {
        event_id: "event:ref-ops-009-a",
        parent_identity: claimId,
        parent_class: "Claim",
        event_type: "ops.claim_unit_registered",
        ordinal: 0,
        at: OPS_AT,
        authority_agent: OPS_HUMAN,
        payload: { source: "REF-OPS-009" },
      });
      await ops.appendResearchEvent(claimId, {
        event_id: "event:ref-ops-009-b",
        parent_identity: claimId,
        parent_class: "Claim",
        event_type: "ops.note",
        ordinal: 1,
        at: OPS_AT,
        authority_agent: OPS_HUMAN,
        payload: { source: "REF-OPS-009" },
      });
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        identity: claimId,
        unit_kind: "ClaimUnit",
      });
      const timeline = await ops.timeline(session);
      check.equal("timeline length", timeline.length, 2);
      check.equal("first ordinal", timeline[0]?.ordinal, 0);
      check.equal("second ordinal", timeline[1]?.ordinal, 1);
      check.equal("first event", timeline[0]?.event_id, "event:ref-ops-009-a");
    },
  },
  {
    fixture_id: "REF-OPS-010",
    title: "Persistence snapshot via OPS repository",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-010");
      const claimId = "claim:ref-ops-010";
      await ops.registerClaimUnit(claimInput(claimId));
      const snap = await ops.repository.snapshot();
      check.ok("has entities", snap.entities.length >= 1);
      check.ok(
        "includes claim",
        snap.entities.some((e) => e.identity === claimId),
      );
      const again = await ops.repository.snapshot();
      check.equal(
        "deterministic snapshot",
        stableStringify(snap),
        stableStringify(again),
      );
    },
  },
  {
    fixture_id: "REF-OPS-011",
    title: "ResearchSnapshot wraps PersistenceSnapshot (not persisted)",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-011");
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-011",
      });
      const claimId = "claim:ref-ops-011";
      await ops.registerClaimUnit(claimInput(claimId));
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        identity: claimId,
        unit_kind: "ClaimUnit",
      });
      const view = await ops.snapshotView(session);
      check.equal(
        "research_session_id",
        view.research_session_id,
        session.research_session_id,
      );
      check.equal("member refs", view.member_refs.length, 1);
      check.ok(
        "persistence snapshot present",
        view.persistence_snapshot.entities.length >= 1,
      );
      check.ok(
        "ResearchSession not an entity",
        !view.persistence_snapshot.entities.some(
          (e) => e.identity === session.research_session_id,
        ),
      );
    },
  },
  {
    fixture_id: "REF-OPS-012",
    title: "SER-JSON export of ClaimUnit via OPS",
    scenario: "serialization",
    authorities: ["OPS-001", "SER-JSON-001", "SER-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-012");
      const claimId = "claim:ref-ops-012";
      await ops.registerClaimUnit(claimInput(claimId));
      const json = await ops.exportClaimUnit(claimId);
      check.ok("non-empty json", json.length > 0);
      const parsed = JSON.parse(json) as {
        id?: string;
        sciros_unit?: string;
        sciros_profile?: string;
      };
      check.equal("json identity", parsed.id, claimId);
      check.equal("json unit", parsed.sciros_unit, "ClaimUnit");
      check.ok(
        "json profile",
        typeof parsed.sciros_profile === "string" &&
          parsed.sciros_profile.includes("SER-JSON-001"),
      );
      const again = await ops.exportClaimUnit(claimId);
      check.equal("deterministic export", json, again);
    },
  },
  {
    fixture_id: "REF-OPS-013",
    title: "Deterministic repeated OPS vertical slice",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      async function slice(suffix: string): Promise<string> {
        const ops = makeOps(`persist-sess:ref-ops-013-${suffix}`);
        const session = ops.openSession({
          research_session_id: "research:session:ref-ops-013",
        });
        const claimId = "claim:ref-ops-013";
        await ops.registerClaimUnit(claimInput(claimId));
        await ops.appendResearchEvent(claimId, {
          event_id: "event:ref-ops-013",
          parent_identity: claimId,
          parent_class: "Claim",
          event_type: "ops.claim_unit_registered",
          ordinal: 0,
          at: OPS_AT,
          authority_agent: OPS_HUMAN,
          payload: { source: "REF-OPS-013" },
        });
        ops.registerMember(session, {
          entity_kind: "CanonicalUnit",
          identity: claimId,
          unit_kind: "ClaimUnit",
        });
        const view = await ops.snapshotView(session);
        const json = await ops.exportClaimUnit(claimId);
        return stableStringify({
          session: view.research_session_id,
          members: view.member_refs,
          entities: view.persistence_snapshot.entities.map((e) => e.identity),
          export: json,
        });
      }
      const a = await slice("a");
      const b = await slice("b");
      check.equal("repeated execution identical", a, b);
    },
  },
  {
    fixture_id: "REF-OPS-014",
    title: "Lower-layer PersistenceError propagates unchanged",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-014");
      let caught: unknown;
      try {
        await ops.getClaimUnit("claim:ref-ops-014-missing");
      } catch (err) {
        caught = err;
      }
      check.ok("threw", caught !== undefined);
      check.ok("PersistenceError", caught instanceof PersistenceError);
      check.equal(
        "code preserved",
        (caught as PersistenceError).code,
        "NOT_FOUND",
      );
      check.ok("not OpsError", !(caught instanceof OpsError));
    },
  },
  {
    fixture_id: "REF-OPS-015",
    title: "OPS architecture boundaries (memory-only session; marker)",
    scenario: "authority",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    execute(check) {
      check.equal("package", referenceAppMarker.packageId, "@sciros/reference-app");
      check.equal(
        "session not persisted",
        referenceAppMarker.researchSessionPersisted,
        false,
      );
      check.equal(
        "workspace not persisted",
        referenceAppMarker.researchWorkspacePersisted,
        false,
      );
      check.equal("no second journal", referenceAppMarker.secondEventJournal, false);
      check.equal("no second identity", referenceAppMarker.secondIdentitySystem, false);
      check.equal(
        "does not duplicate processor",
        referenceAppMarker.duplicatesProcessorLogic,
        false,
      );
    },
  },
  {
    fixture_id: "REF-OPS-016",
    title: "ResearchWorkspace opens with caller-supplied id (memory-only)",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    execute(check) {
      const ops = makeOps("persist-sess:ref-ops-016");
      const ws = ops.openWorkspace({
        research_workspace_id: "workspace:ref-ops-016",
        title: "REF-OPS-016",
      });
      check.equal("workspace id", ws.research_workspace_id, "workspace:ref-ops-016");
      check.equal("empty members", ws.members().length, 0);
      check.equal("no bound sessions", ws.boundSessionIds().length, 0);
      check.ok(
        "ids distinct from persistence",
        ws.research_workspace_id !== ops.persistenceSessionId,
      );
    },
  },
  {
    fixture_id: "REF-OPS-017",
    title: "Orphan ResearchSession remains valid without workspace",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    execute(check) {
      const ops = makeOps("persist-sess:ref-ops-017");
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-017",
      });
      check.equal("no workspace bind", session.research_workspace_id, undefined);
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        identity: "claim:ref-ops-017-orphan",
        unit_kind: "ClaimUnit",
      });
      check.equal("session members", session.members().length, 1);
    },
  },
  {
    fixture_id: "REF-OPS-018",
    title: "Bound session membership upserts workspace index",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-018");
      const ws = ops.openWorkspace({
        research_workspace_id: "workspace:ref-ops-018",
      });
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-018",
      });
      ops.bindSession(ws, session);
      check.equal(
        "bound workspace id",
        session.research_workspace_id,
        "workspace:ref-ops-018",
      );
      const claimId = "claim:ref-ops-018";
      await ops.registerClaimUnit(claimInput(claimId));
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        identity: claimId,
        unit_kind: "ClaimUnit",
      });
      check.equal("session members", session.members().length, 1);
      check.equal("workspace members", ws.members().length, 1);
      check.equal("workspace member id", ws.members()[0]?.identity, claimId);
      check.equal("bound sessions", ws.boundSessionIds()[0], session.research_session_id);
    },
  },
  {
    fixture_id: "REF-OPS-019",
    title: "WorkspaceSnapshot is additive and deterministic",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-019");
      const ws = ops.openWorkspace({
        research_workspace_id: "workspace:ref-ops-019",
      });
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-019",
      });
      ops.bindSession(ws, session);
      const claimId = "claim:ref-ops-019";
      await ops.registerClaimUnit(claimInput(claimId));
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        identity: claimId,
        unit_kind: "ClaimUnit",
      });
      const a = await ops.workspaceSnapshotView(ws);
      const b = await ops.workspaceSnapshotView(ws);
      check.equal("workspace id", a.research_workspace_id, "workspace:ref-ops-019");
      check.equal("member count", a.member_refs.length, 1);
      check.equal("bound session", a.bound_session_ids[0], session.research_session_id);
      check.equal(
        "deterministic snapshot",
        stableStringify({
          id: a.research_workspace_id,
          members: a.member_refs,
          sessions: a.bound_session_ids,
        }),
        stableStringify({
          id: b.research_workspace_id,
          members: b.member_refs,
          sessions: b.bound_session_ids,
        }),
      );
      const sessionSnap = await ops.snapshotView(session);
      check.equal(
        "ResearchSnapshot has no workspace field",
        "research_workspace_id" in sessionSnap,
        false,
      );
      check.equal(
        "session snapshot id",
        sessionSnap.research_session_id,
        session.research_session_id,
      );
    },
  },
  {
    fixture_id: "REF-OPS-020",
    title: "Empty research_workspace_id is rejected",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "INVALID_WORKSPACE" },
    execute() {
      makeOps("persist-sess:ref-ops-020").openWorkspace({
        research_workspace_id: "   ",
      });
    },
  },
  {
    fixture_id: "REF-OPS-021",
    title: "Session cannot bind to two different workspaces",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "INVALID_WORKSPACE" },
    execute() {
      const ops = makeOps("persist-sess:ref-ops-021");
      const wsA = ops.openWorkspace({ research_workspace_id: "workspace:ref-ops-021-a" });
      const wsB = ops.openWorkspace({ research_workspace_id: "workspace:ref-ops-021-b" });
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-021",
      });
      ops.bindSession(wsA, session);
      ops.bindSession(wsB, session);
    },
  },
  {
    fixture_id: "REF-OPS-022",
    title: "Evidence draft registration via OPS (Core → ENC → Persistence.create)",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-002", "ENC-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-022");
      const evidenceId = "evidence:ref-ops-022";
      const { evidence, unit, entity } = await ops.registerEvidenceUnit(
        evidenceInput(evidenceId),
      );
      check.equal("evidence id", evidence.evidence_id, evidenceId);
      check.equal("record_state", evidence.record_state, "draft");
      check.equal("unit_kind", unit.envelope.unit_kind, "EvidenceUnit");
      check.equal("entity identity", entity.identity, evidenceId);
      check.equal("entity_kind", entity.entity_kind, "CanonicalUnit");
      const stored = await ops.getEvidenceUnit(evidenceId);
      check.equal("retrieved identity", stored.identity, evidenceId);
    },
  },
  {
    fixture_id: "REF-OPS-023",
    title: "Evidence Persistence.create-once rejection propagates ALREADY_EXISTS",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "ALREADY_EXISTS" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-023");
      const evidenceId = "evidence:ref-ops-023";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
    },
  },
  {
    fixture_id: "REF-OPS-024",
    title: "Invalid Evidence rejected with EvidenceValidationError identity",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-002"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-024");
      try {
        await ops.registerEvidenceUnit(
          evidenceInput("evidence:ref-ops-024", {
            source: {
              source_class: "laboratory",
              source_locator: "   ",
              source_state: "declared",
            },
          }),
        );
        check.ok("should have thrown", false);
      } catch (e) {
        check.ok("EvidenceValidationError", e instanceof EvidenceValidationError);
        check.ok("not OpsError", !(e instanceof OpsError));
        check.ok("not PersistenceError", !(e instanceof PersistenceError));
      }
    },
  },
  {
    fixture_id: "REF-OPS-025",
    title: "Orphan session Evidence membership (M5)",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-025");
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-025",
      });
      check.equal("orphan", session.research_workspace_id, undefined);
      const evidenceId = "evidence:ref-ops-025";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        identity: evidenceId,
        unit_kind: "EvidenceUnit",
      });
      check.equal("session members", session.members().length, 1);
      check.equal("member unit_kind", session.members()[0]?.unit_kind, "EvidenceUnit");
    },
  },
  {
    fixture_id: "REF-OPS-026",
    title: "Bound session Evidence membership upserts workspace (M3)",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-026");
      const ws = ops.openWorkspace({
        research_workspace_id: "workspace:ref-ops-026",
      });
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-026",
      });
      ops.bindSession(ws, session);
      const evidenceId = "evidence:ref-ops-026";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        identity: evidenceId,
        unit_kind: "EvidenceUnit",
      });
      check.equal("workspace members", ws.members().length, 1);
      check.equal("workspace member id", ws.members()[0]?.identity, evidenceId);
    },
  },
  {
    fixture_id: "REF-OPS-027",
    title: "Evidence timeline + ops.evidence_unit_registered event",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-027");
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-027",
      });
      const evidenceId = "evidence:ref-ops-027";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      await ops.appendResearchEvent(evidenceId, {
        event_id: "event:ref-ops-027",
        parent_identity: evidenceId,
        parent_class: "Evidence",
        event_type: "ops.evidence_unit_registered",
        ordinal: 0,
        at: OPS_AT,
        authority_agent: OPS_HUMAN,
        payload: { source: "ref-ops" },
      });
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        identity: evidenceId,
        unit_kind: "EvidenceUnit",
      });
      const timeline = await ops.timeline(session);
      check.equal("timeline length", timeline.length, 1);
      check.equal("event type", timeline[0]?.event_type, "ops.evidence_unit_registered");
    },
  },
  {
    fixture_id: "REF-OPS-028",
    title: "ResearchSnapshot frozen field-set with Evidence member_refs",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-028");
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-028",
      });
      const evidenceId = "evidence:ref-ops-028";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        identity: evidenceId,
        unit_kind: "EvidenceUnit",
      });
      const view = await ops.snapshotView(session);
      check.equal(
        "keys",
        Object.keys(view).sort().join(","),
        "member_refs,persistence_snapshot,research_session_id",
      );
      check.equal("no workspace field", "research_workspace_id" in view, false);
      check.equal("member count", view.member_refs.length, 1);
      check.equal("member identity", view.member_refs[0]?.identity, evidenceId);
    },
  },
  {
    fixture_id: "REF-OPS-029",
    title: "WorkspaceSnapshot includes Evidence membership",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-029");
      const ws = ops.openWorkspace({
        research_workspace_id: "workspace:ref-ops-029",
      });
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-029",
      });
      ops.bindSession(ws, session);
      const evidenceId = "evidence:ref-ops-029";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        identity: evidenceId,
        unit_kind: "EvidenceUnit",
      });
      const snap = await ops.workspaceSnapshotView(ws);
      check.equal("workspace id", snap.research_workspace_id, "workspace:ref-ops-029");
      check.equal("member count", snap.member_refs.length, 1);
      check.equal("bound session", snap.bound_session_ids[0], session.research_session_id);
    },
  },
  {
    fixture_id: "REF-OPS-030",
    title: "Evidence SER export is deterministic on double-run",
    scenario: "valid",
    authorities: ["OPS-001", "SER-JSON-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      async function run() {
        const ops = makeOps("persist-sess:ref-ops-030");
        const evidenceId = "evidence:ref-ops-030";
        await ops.registerEvidenceUnit(evidenceInput(evidenceId));
        return ops.exportEvidenceUnit(evidenceId);
      }
      const a = await run();
      const b = await run();
      check.equal("deterministic export", a, b);
      check.ok("non-empty", a.length > 0);
    },
  },
  {
    fixture_id: "REF-OPS-031",
    title: "Membership does not create bears_on or supported_by edges",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-001", "SCI-002"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-031");
      const claimId = "claim:ref-ops-031";
      const evidenceId = "evidence:ref-ops-031";
      const { claim } = await ops.registerClaimUnit(claimInput(claimId));
      const { evidence } = await ops.registerEvidenceUnit(
        evidenceInput(evidenceId, { bears_on: [claimId] }),
      );
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-031",
      });
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        identity: claimId,
        unit_kind: "ClaimUnit",
      });
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        identity: evidenceId,
        unit_kind: "EvidenceUnit",
      });
      check.equal("bears_on preserved", evidence.bears_on?.[0], claimId);
      check.equal(
        "supported_by not invented",
        claim.supported_by === undefined || claim.supported_by.length === 0,
        true,
      );
      check.equal("session has both members", session.members().length, 2);
    },
  },
  {
    fixture_id: "REF-OPS-032",
    title: "bears_on and supported_by remain independent under OPS (SSR-5)",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-001", "SCI-002"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-032");
      const claimId = "claim:ref-ops-032";
      const evidenceId = "evidence:ref-ops-032";
      const { claim } = await ops.registerClaimUnit(claimInput(claimId));
      const { evidence } = await ops.registerEvidenceUnit(
        evidenceInput(evidenceId, { bears_on: [claimId] }),
      );
      check.equal("evidence bears_on", evidence.bears_on?.[0], claimId);
      check.ok(
        "claim supported_by empty",
        claim.supported_by === undefined || claim.supported_by.length === 0,
      );
      // Explicit: membership alone never writes Claim.supported_by
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-032",
      });
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        identity: evidenceId,
        unit_kind: "EvidenceUnit",
      });
      const claimEntity = await ops.getClaimUnit(claimId);
      const payload = claimEntity.payload as {
        content?: { supported_by?: readonly string[] };
      };
      const storedSupported = payload.content?.supported_by ?? [];
      check.equal("persisted claim has no supported_by sync", storedSupported.length, 0);
    },
  },
  {
    fixture_id: "REF-OPS-033",
    title: "Pre-persist Human registration then create-once",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-002"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-033");
      const evidenceId = "evidence:ref-ops-033";
      const { evidence, unit } = await ops.registerEvidenceUnit(
        evidenceInput(evidenceId),
        {
          transition: {
            to: "registered",
            authority_agent: OPS_HUMAN,
            reason: "human registration before persist",
            decision_ref: "decision:ref-ops-033",
            at: OPS_AT,
            event_id: "erte:ref-ops-033",
          },
        },
      );
      check.equal("registered", evidence.record_state, "registered");
      check.equal("unit_kind", unit.envelope.unit_kind, "EvidenceUnit");
      const stored = await ops.getEvidenceUnit(evidenceId);
      check.equal("stored identity", stored.identity, evidenceId);
    },
  },
  {
    fixture_id: "REF-OPS-034",
    title: "AI registration via OPS pre-persist transition is rejected by Core",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-002"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-034");
      try {
        await ops.registerEvidenceUnit(evidenceInput("evidence:ref-ops-034"), {
          transition: {
            to: "registered",
            authority_agent: "ai:agent-ref-ops-034",
            reason: "ai attempt",
            decision_ref: "decision:ref-ops-034",
            at: OPS_AT,
            event_id: "erte:ref-ops-034",
          },
        });
        check.ok("should have thrown", false);
      } catch (e) {
        check.ok("EvidenceValidationError", e instanceof EvidenceValidationError);
        check.ok("not OpsError", !(e instanceof OpsError));
      }
    },
  },
  {
    fixture_id: "REF-OPS-035",
    title: "Missing Evidence get propagates PersistenceError",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "NOT_FOUND" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-035");
      await ops.getEvidenceUnit("evidence:ref-ops-035-missing");
    },
  },
  {
    fixture_id: "REF-OPS-036",
    title: "Full Evidence OPS double-run determinism (export+snapshot+timeline)",
    scenario: "valid",
    authorities: ["OPS-001", "SER-JSON-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      async function run() {
        const ops = makeOps("persist-sess:ref-ops-036");
        const session = ops.openSession({
          research_session_id: "research:session:ref-ops-036",
        });
        const evidenceId = "evidence:ref-ops-036";
        await ops.registerEvidenceUnit(evidenceInput(evidenceId));
        await ops.appendResearchEvent(evidenceId, {
          event_id: "event:ref-ops-036",
          parent_identity: evidenceId,
          parent_class: "Evidence",
          event_type: "ops.evidence_unit_registered",
          ordinal: 0,
          at: OPS_AT,
          authority_agent: OPS_HUMAN,
          payload: { source: "ref-ops" },
        });
        ops.registerMember(session, {
          entity_kind: "CanonicalUnit",
          identity: evidenceId,
          unit_kind: "EvidenceUnit",
        });
        const snap = await ops.snapshotView(session);
        const timeline = await ops.timeline(session);
        const json = await ops.exportEvidenceUnit(evidenceId);
        return stableStringify({
          identity: evidenceId,
          members: snap.member_refs,
          session: snap.research_session_id,
          timeline: timeline.map((t) => ({
            event_id: t.event_id,
            event_type: t.event_type,
            ordinal: t.ordinal,
          })),
          json,
        });
      }
      const a = await run();
      const b = await run();
      check.equal("deterministic full workflow", a, b);
    },
  },
  {
    fixture_id: "REF-OPS-037",
    title: "Model C initial Claim revision + RevisionHead",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-037");
      const claimId = "claim:ref-ops-037";
      const { entity } = await ops.registerClaimUnit(claimInput(claimId));
      check.equal("revision_id", entity.revision_id, "rev:initial");
      check.ok(
        "four-segment key",
        entity.storage_key.includes(":rev:initial"),
      );
      const head = await ops.getClaimHead(claimId);
      check.equal("head kind", head.entity_kind, "RevisionHead");
      check.equal("head pointer", head.content_version, "rev:initial");
      const current = await ops.getClaimUnit(claimId);
      check.equal("head-resolved", current.revision_id, "rev:initial");
    },
  },
  {
    fixture_id: "REF-OPS-038",
    title: "Claim Standing post-persist creates successor revision + advances head",
    scenario: "transition",
    authorities: ["OPS-001", "SCI-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-038");
      const claimId = "claim:ref-ops-038";
      await ops.registerClaimUnit(claimInput(claimId));
      const result = await ops.transitionClaimStanding({
        identity: claimId,
        revision_id: "rev:standing-supported-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "supported",
          authority_agent: OPS_HUMAN,
          reason: "clinical_boundary_ack REF-OPS-038 supported",
          decision_ref: "decision:ref-ops-038",
          at: OPS_AT,
          event_id: "ste:ref-ops-038",
          supported_by: ["evidence:ref-ops-038"],
        },
      });
      check.equal("standing", result.claim.standing, "supported");
      check.equal("head", result.head_revision_id, "rev:standing-supported-1");
      check.equal(
        "predecessor",
        result.entity.predecessor_revision_id,
        "rev:initial",
      );
      const old = await ops.getClaimUnitRevision(claimId, "rev:initial");
      check.equal(
        "old immutable standing content",
        (old.payload as { envelope: { content: { standing: string } } }).envelope
          .content.standing,
        "draft_unverified",
      );
      const lineage = await ops.getClaimLineage(claimId);
      check.equal("lineage length", lineage.length, 2);
    },
  },
  {
    fixture_id: "REF-OPS-039",
    title: "Stale RevisionHead CAS rejects with CONFLICT",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "CONFLICT" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-039");
      const claimId = "claim:ref-ops-039";
      await ops.registerClaimUnit(claimInput(claimId));
      await ops.transitionClaimStanding({
        identity: claimId,
        revision_id: "rev:standing-supported-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "supported",
          authority_agent: OPS_HUMAN,
          reason: "clinical_boundary_ack REF-OPS-039",
          decision_ref: "decision:ref-ops-039",
          at: OPS_AT,
          event_id: "ste:ref-ops-039-a",
          supported_by: ["evidence:ref-ops-039"],
        },
      });
      await ops.transitionClaimStanding({
        identity: claimId,
        revision_id: "rev:standing-contested-2",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "contested",
          authority_agent: OPS_HUMAN,
          reason: "clinical_boundary_ack REF-OPS-039 stale",
          at: OPS_AT,
          event_id: "ste:ref-ops-039-b",
          contested_by: ["contradiction:ref-ops-039"],
          supported_by: ["evidence:ref-ops-039"],
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-040",
    title: "Duplicate revision_id rejects ALREADY_EXISTS",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "ALREADY_EXISTS" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-040");
      const claimId = "claim:ref-ops-040";
      await ops.registerClaimUnit(claimInput(claimId));
      const result = await ops.transitionClaimStanding({
        identity: claimId,
        revision_id: "rev:standing-supported-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "supported",
          authority_agent: OPS_HUMAN,
          reason: "clinical_boundary_ack REF-OPS-040",
          decision_ref: "decision:ref-ops-040",
          at: OPS_AT,
          event_id: "ste:ref-ops-040",
          supported_by: ["evidence:ref-ops-040"],
        },
      });
      await ops.repository.create(result.entity);
    },
  },
  {
    fixture_id: "REF-OPS-041",
    title: "Illegal Claim Standing transition propagates Core error",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-001"],
    expectation: { outcome: "failure", failure_code: "F_TRANSITION" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-041");
      const claimId = "claim:ref-ops-041";
      await ops.registerClaimUnit(claimInput(claimId));
      await ops.transitionClaimStanding({
        identity: claimId,
        revision_id: "rev:illegal-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "draft_unverified",
          authority_agent: OPS_HUMAN,
          reason: "clinical_boundary_ack illegal",
          decision_ref: "decision:ref-ops-041",
          at: OPS_AT,
          event_id: "ste:ref-ops-041",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-042",
    title: "Model C Evidence initial revision + head (Sprint 019 regression)",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-002"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-042");
      const evidenceId = "evidence:ref-ops-042";
      const { entity } = await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      check.equal("revision_id", entity.revision_id, "rev:initial");
      const head = await ops.repository.getHead(evidenceId, "EvidenceUnit");
      check.equal("head", head.content_version, "rev:initial");
      const got = await ops.getEvidenceUnit(evidenceId);
      check.equal("retrieved", got.identity, evidenceId);
    },
  },
  {
    fixture_id: "REF-OPS-043",
    title: "Deterministic Claim Standing transition + export double-run",
    scenario: "valid",
    authorities: ["OPS-001", "SER-JSON-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      async function run() {
        const ops = makeOps("persist-sess:ref-ops-043");
        const claimId = "claim:ref-ops-043";
        await ops.registerClaimUnit(claimInput(claimId));
        await ops.transitionClaimStanding({
          identity: claimId,
          revision_id: "rev:standing-supported-1",
          expected_head_revision_id: "rev:initial",
          transition: {
            to: "supported",
            authority_agent: OPS_HUMAN,
            reason: "clinical_boundary_ack REF-OPS-043",
            decision_ref: "decision:ref-ops-043",
            at: OPS_AT,
            event_id: "ste:ref-ops-043",
            supported_by: ["evidence:ref-ops-043"],
          },
        });
        const lineage = await ops.getClaimLineage(claimId);
        const json = await ops.exportClaimUnit(claimId);
        const head = await ops.getClaimHead(claimId);
        return stableStringify({
          lineage,
          json,
          head: head.content_version,
        });
      }
      check.equal("deterministic", await run(), await run());
    },
  },
  {
    fixture_id: "REF-OPS-044",
    title: "Snapshot includes revision rows and RevisionHead",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-044");
      const claimId = "claim:ref-ops-044";
      await ops.registerClaimUnit(claimInput(claimId));
      await ops.transitionClaimStanding({
        identity: claimId,
        revision_id: "rev:standing-supported-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "supported",
          authority_agent: OPS_HUMAN,
          reason: "clinical_boundary_ack REF-OPS-044",
          decision_ref: "decision:ref-ops-044",
          at: OPS_AT,
          event_id: "ste:ref-ops-044",
          supported_by: ["evidence:ref-ops-044"],
        },
      });
      const snap = await ops.repository.snapshot();
      const revs = snap.entities.filter(
        (e) => e.entity_kind === "CanonicalUnit" && e.identity === claimId,
      );
      const heads = snap.entities.filter(
        (e) => e.entity_kind === "RevisionHead" && e.identity === claimId,
      );
      check.equal("two revisions", revs.length, 2);
      check.equal("one head", heads.length, 1);
      check.equal("head pointer", heads[0]?.content_version, "rev:standing-supported-1");
    },
  },
  {
    fixture_id: "REF-OPS-045",
    title: "Partial-write: revision create without head advance leaves prior head",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-045");
      const claimId = "claim:ref-ops-045";
      await ops.registerClaimUnit(claimInput(claimId));
      // Simulate step C without D: create successor revision directly
      const prior = await ops.getClaimUnit(claimId);
      const claim = new ClaimTransitionService().transition(
        claimFromClaimUnitPayload(prior.payload),
        {
          to: "supported",
          authority_agent: OPS_HUMAN,
          reason: `${CLINICAL_BOUNDARY_ACK} orphan revision`,
          decision_ref: "decision:ref-ops-045",
          at: OPS_AT,
          event_id: "ste:ref-ops-045",
          supported_by: ["evidence:ref-ops-045"],
        },
      );
      const unit = await new CanonicalEncoder().assemble(claim);
      await ops.repository.create(
        entityFromCanonicalUnit(unit, {
          revision_id: "rev:orphan-supported",
          predecessor_revision_id: "rev:initial",
        }),
      );
      const head = await ops.getClaimHead(claimId);
      check.equal("head unchanged", head.content_version, "rev:initial");
      const orphan = await ops.getClaimUnitRevision(claimId, "rev:orphan-supported");
      check.equal("orphan exists", orphan.revision_id, "rev:orphan-supported");
      const current = await ops.getClaimUnit(claimId);
      check.equal("current still initial", current.revision_id, "rev:initial");
    },
  },
  {
    fixture_id: "REF-OPS-046",
    title: "Missing Claim revision propagates NOT_FOUND",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "NOT_FOUND" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-046");
      await ops.registerClaimUnit(claimInput("claim:ref-ops-046"));
      await ops.getClaimUnitRevision("claim:ref-ops-046", "rev:missing");
    },
  },
  {
    fixture_id: "REF-OPS-047",
    title: "Existing registered Evidence head is available for post-persist transition",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-002"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-047");
      const evidenceId = "evidence:ref-ops-047";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId), {
        transition: {
          to: "registered",
          authority_agent: OPS_HUMAN,
          reason: "register for REF-OPS-047",
          decision_ref: "decision:ref-ops-047",
          at: OPS_AT,
          event_id: "erte:ref-ops-047-reg",
        },
      });
      const entity = await ops.getEvidenceUnit(evidenceId);
      check.equal("revision", entity.revision_id, "rev:initial");
      const head = await ops.getEvidenceHead(evidenceId);
      check.equal("head", head.content_version, "rev:initial");
      check.equal(
        "record_state",
        (entity.payload as { envelope: { content: { record_state: string } } })
          .envelope.content.record_state,
        "registered",
      );
    },
  },
  {
    fixture_id: "REF-OPS-048",
    title: "Evidence draft → registered post-persist creates successor revision",
    scenario: "transition",
    authorities: ["OPS-001", "SCI-002"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-048");
      const evidenceId = "evidence:ref-ops-048";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      const result = await ops.transitionEvidenceRecordState({
        identity: evidenceId,
        revision_id: "rev:record-registered-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "registered",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-048 draft to registered",
          decision_ref: "decision:ref-ops-048",
          at: OPS_AT,
          event_id: "erte:ref-ops-048",
        },
      });
      check.equal("record_state", result.evidence.record_state, "registered");
      check.equal("head", result.head_revision_id, "rev:record-registered-1");
      check.equal(
        "predecessor",
        result.entity.predecessor_revision_id,
        "rev:initial",
      );
    },
  },
  {
    fixture_id: "REF-OPS-049",
    title: "Evidence registered → withdrawn post-persist",
    scenario: "transition",
    authorities: ["OPS-001", "SCI-002"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-049");
      const evidenceId = "evidence:ref-ops-049";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId), {
        transition: {
          to: "registered",
          authority_agent: OPS_HUMAN,
          reason: "pre-register REF-OPS-049",
          decision_ref: "decision:ref-ops-049-a",
          at: OPS_AT,
          event_id: "erte:ref-ops-049-a",
        },
      });
      const result = await ops.transitionEvidenceRecordState({
        identity: evidenceId,
        revision_id: "rev:record-withdrawn-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "withdrawn",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-049 withdraw",
          at: OPS_AT,
          event_id: "erte:ref-ops-049-b",
        },
      });
      check.equal("record_state", result.evidence.record_state, "withdrawn");
      check.equal("head", result.head_revision_id, "rev:record-withdrawn-1");
    },
  },
  {
    fixture_id: "REF-OPS-050",
    title: "Invalid Evidence Record State transition propagates Core F_TRANSITION",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-002"],
    expectation: { outcome: "failure", failure_code: "F_TRANSITION" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-050");
      const evidenceId = "evidence:ref-ops-050";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId), {
        transition: {
          to: "registered",
          authority_agent: OPS_HUMAN,
          reason: "pre-register REF-OPS-050",
          decision_ref: "decision:ref-ops-050",
          at: OPS_AT,
          event_id: "erte:ref-ops-050-a",
        },
      });
      await ops.transitionEvidenceRecordState({
        identity: evidenceId,
        revision_id: "rev:bad",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "draft",
          authority_agent: OPS_HUMAN,
          reason: "illegal demotion",
          at: OPS_AT,
          event_id: "erte:ref-ops-050-b",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-051",
    title: "Stale Evidence RevisionHead CAS rejects with CONFLICT",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "CONFLICT" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-051");
      const evidenceId = "evidence:ref-ops-051";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      await ops.transitionEvidenceRecordState({
        identity: evidenceId,
        revision_id: "rev:record-registered-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "registered",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-051 first",
          decision_ref: "decision:ref-ops-051-a",
          at: OPS_AT,
          event_id: "erte:ref-ops-051-a",
        },
      });
      await ops.transitionEvidenceRecordState({
        identity: evidenceId,
        revision_id: "rev:record-withdrawn-stale",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "withdrawn",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-051 stale",
          at: OPS_AT,
          event_id: "erte:ref-ops-051-b",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-052",
    title: "Duplicate Evidence revision_id propagates ALREADY_EXISTS",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "ALREADY_EXISTS" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-052");
      const evidenceId = "evidence:ref-ops-052";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      const result = await ops.transitionEvidenceRecordState({
        identity: evidenceId,
        revision_id: "rev:dup",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "registered",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-052 first",
          decision_ref: "decision:ref-ops-052-a",
          at: OPS_AT,
          event_id: "erte:ref-ops-052-a",
        },
      });
      await ops.repository.create(result.entity);
    },
  },
  {
    fixture_id: "REF-OPS-053",
    title: "Evidence predecessor lineage + RevisionHead after Record State transition",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-053");
      const evidenceId = "evidence:ref-ops-053";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      await ops.transitionEvidenceRecordState({
        identity: evidenceId,
        revision_id: "rev:record-registered-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "registered",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-053",
          decision_ref: "decision:ref-ops-053",
          at: OPS_AT,
          event_id: "erte:ref-ops-053",
        },
      });
      const lineage = await ops.getEvidenceLineage(evidenceId);
      check.equal("lineage length", lineage.length, 2);
      const initial = lineage[0]!;
      const successor = lineage[1]!;
      check.equal("initial", initial.revision_id, "rev:initial");
      check.equal(
        "predecessor",
        successor.predecessor_revision_id,
        "rev:initial",
      );
      const head = await ops.getEvidenceHead(evidenceId);
      check.equal("head", head.content_version, "rev:record-registered-1");
    },
  },
  {
    fixture_id: "REF-OPS-054",
    title: "Prior Evidence revision remains immutable after Record State transition",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-054");
      const evidenceId = "evidence:ref-ops-054";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      await ops.transitionEvidenceRecordState({
        identity: evidenceId,
        revision_id: "rev:record-registered-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "registered",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-054",
          decision_ref: "decision:ref-ops-054",
          at: OPS_AT,
          event_id: "erte:ref-ops-054",
        },
      });
      const old = await ops.getEvidenceUnitRevision(evidenceId, "rev:initial");
      check.equal(
        "old draft",
        (old.payload as { envelope: { content: { record_state: string } } })
          .envelope.content.record_state,
        "draft",
      );
      try {
        await ops.repository.replace({ ...old, content_version: "9.9.9" });
        check.ok("should reject replace", false);
      } catch (e) {
        check.ok(
          "IMMUTABLE_ENTITY",
          e instanceof PersistenceError && e.code === "IMMUTABLE_ENTITY",
        );
      }
    },
  },
  {
    fixture_id: "REF-OPS-055",
    title: "ResearchSnapshot includes Evidence revisions + RevisionHead after transition",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-055");
      const evidenceId = "evidence:ref-ops-055";
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-055",
      });
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      await ops.transitionEvidenceRecordState({
        identity: evidenceId,
        revision_id: "rev:record-registered-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "registered",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-055",
          decision_ref: "decision:ref-ops-055",
          at: OPS_AT,
          event_id: "erte:ref-ops-055",
        },
      });
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        unit_kind: "EvidenceUnit",
        identity: evidenceId,
      });
      const snap = await ops.snapshotView(session);
      check.equal("session", snap.research_session_id, "research:session:ref-ops-055");
      check.equal("members", snap.member_refs.length, 1);
      check.ok(
        "has RevisionHead",
        snap.persistence_snapshot.entities.some((e) => e.entity_kind === "RevisionHead"),
      );
      check.ok(
        "has two EvidenceUnit revisions",
        snap.persistence_snapshot.entities.filter(
          (e) =>
            e.entity_kind === "CanonicalUnit" &&
            e.identity === evidenceId,
        ).length >= 2,
      );
    },
  },
  {
    fixture_id: "REF-OPS-056",
    title: "WorkspaceSnapshot membership unchanged by Evidence Record State transition",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-056");
      const evidenceId = "evidence:ref-ops-056";
      const ws = ops.openWorkspace({
        research_workspace_id: "workspace:ref-ops-056",
      });
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      ops.registerWorkspaceMember(ws, {
        entity_kind: "CanonicalUnit",
        unit_kind: "EvidenceUnit",
        identity: evidenceId,
      });
      const before = ws.members().length;
      await ops.transitionEvidenceRecordState({
        identity: evidenceId,
        revision_id: "rev:record-registered-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "registered",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-056",
          decision_ref: "decision:ref-ops-056",
          at: OPS_AT,
          event_id: "erte:ref-ops-056",
        },
      });
      check.equal("membership unchanged", ws.members().length, before);
      const snap = await ops.workspaceSnapshotView(ws);
      check.equal("workspace id", snap.research_workspace_id, "workspace:ref-ops-056");
      check.equal("member_refs", snap.member_refs.length, 1);
    },
  },
  {
    fixture_id: "REF-OPS-057",
    title: "Evidence export head reflects new record_state; prior revision differs",
    scenario: "valid",
    authorities: ["OPS-001", "SER-JSON-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-057");
      const evidenceId = "evidence:ref-ops-057";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      await ops.transitionEvidenceRecordState({
        identity: evidenceId,
        revision_id: "rev:record-registered-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "registered",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-057",
          decision_ref: "decision:ref-ops-057",
          at: OPS_AT,
          event_id: "erte:ref-ops-057",
        },
      });
      const headExport = await ops.exportEvidenceUnit(evidenceId);
      const revExport = await ops.exportEvidenceUnitRevision(
        evidenceId,
        "rev:record-registered-1",
      );
      const oldExport = await ops.exportEvidenceUnitRevision(
        evidenceId,
        "rev:initial",
      );
      check.equal("head equals new rev", headExport, revExport);
      check.ok("old differs", headExport !== oldExport);
      check.ok("head registered", headExport.includes('"registered"'));
      check.ok("old draft", oldExport.includes('"draft"'));
    },
  },
  {
    fixture_id: "REF-OPS-058",
    title: "Deterministic Evidence Record State transition double-run export",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      async function run() {
        const ops = makeOps("persist-sess:ref-ops-058");
        const evidenceId = "evidence:ref-ops-058";
        await ops.registerEvidenceUnit(evidenceInput(evidenceId));
        await ops.transitionEvidenceRecordState({
          identity: evidenceId,
          revision_id: "rev:record-registered-1",
          expected_head_revision_id: "rev:initial",
          transition: {
            to: "registered",
            authority_agent: OPS_HUMAN,
            reason: "REF-OPS-058",
            decision_ref: "decision:ref-ops-058",
            at: OPS_AT,
            event_id: "erte:ref-ops-058",
          },
        });
        return ops.exportEvidenceUnit(evidenceId);
      }
      const a = await run();
      const b = await run();
      check.equal("deterministic export", a, b);
    },
  },
  {
    fixture_id: "REF-OPS-059",
    title: "Optional ops.evidence_record_state_revision event after successful CAS",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-059");
      const evidenceId = "evidence:ref-ops-059";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      await ops.transitionEvidenceRecordState({
        identity: evidenceId,
        revision_id: "rev:record-registered-1",
        expected_head_revision_id: "rev:initial",
        append_event: true,
        transition: {
          to: "registered",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-059",
          decision_ref: "decision:ref-ops-059",
          at: OPS_AT,
          event_id: "erte:ref-ops-059",
        },
      });
      const events = await ops.getEvents(evidenceId);
      const hit = events.find(
        (e) => e.event_type === "ops.evidence_record_state_revision",
      );
      check.ok("event present", hit !== undefined);
      check.equal("event_id", hit!.event_id, "ops:erte:ref-ops-059");
      check.equal(
        "to_record_state",
        (hit!.payload as { to_record_state: string }).to_record_state,
        "registered",
      );
    },
  },
  {
    fixture_id: "REF-OPS-060",
    title: "Sprint 019 Evidence create-once + optional pre-persist transition regression",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-002"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-060");
      const evidenceId = "evidence:ref-ops-060";
      const { evidence, entity } = await ops.registerEvidenceUnit(
        evidenceInput(evidenceId),
        {
          transition: {
            to: "registered",
            authority_agent: OPS_HUMAN,
            reason: "pre-persist REF-OPS-060",
            decision_ref: "decision:ref-ops-060",
            at: OPS_AT,
            event_id: "erte:ref-ops-060",
          },
        },
      );
      check.equal("record_state", evidence.record_state, "registered");
      check.equal("revision", entity.revision_id, "rev:initial");
      try {
        await ops.registerEvidenceUnit(evidenceInput(evidenceId));
        check.ok("should reject duplicate create", false);
      } catch (e) {
        check.ok(
          "ALREADY_EXISTS",
          e instanceof PersistenceError && e.code === "ALREADY_EXISTS",
        );
      }
    },
  },
  {
    fixture_id: "REF-OPS-061",
    title: "Sprint 020 Claim Standing Model C regression alongside Evidence Record State",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-061");
      const claimId = "claim:ref-ops-061";
      const evidenceId = "evidence:ref-ops-061";
      await ops.registerClaimUnit(claimInput(claimId));
      const claimR = await ops.transitionClaimStanding({
        identity: claimId,
        revision_id: "rev:standing-supported-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "supported",
          authority_agent: OPS_HUMAN,
          reason: "clinical_boundary_ack REF-OPS-061",
          decision_ref: "decision:ref-ops-061-claim",
          at: OPS_AT,
          event_id: "ste:ref-ops-061",
          supported_by: [evidenceId],
        },
      });
      check.equal("claim standing", claimR.claim.standing, "supported");
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      const evR = await ops.transitionEvidenceRecordState({
        identity: evidenceId,
        revision_id: "rev:record-registered-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "registered",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-061 evidence",
          decision_ref: "decision:ref-ops-061-ev",
          at: OPS_AT,
          event_id: "erte:ref-ops-061",
        },
      });
      check.equal("evidence state", evR.evidence.record_state, "registered");
    },
  },
  {
    fixture_id: "REF-OPS-062",
    title: "Post-persist Grade assignment updates grade_ref and advances Evidence head",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-003", "SCI-002"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-062");
      const evidenceId = "evidence:ref-ops-062";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      const r = await ops.assignEvidenceGrade({
        identity: evidenceId,
        revision_id: "rev:grade-1",
        expected_head_revision_id: "rev:initial",
        assignment: {
          label: "model_output_only",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-062 grade assign",
          decision_ref: "decision:ref-ops-062",
          at: OPS_AT,
          event_id: "gae:ref-ops-062",
        },
      });
      check.equal(
        "grade_ref",
        r.evidence.grade_ref,
        "SCI-003@0.1.0:model_output_only",
      );
      check.equal("evidence_id stable", r.evidence.evidence_id, evidenceId);
      check.equal("head", r.head_revision_id, "rev:grade-1");
      check.equal("unit_kind", r.unit.envelope.unit_kind, "EvidenceUnit");
      check.equal("GAE length", r.evidence.grade_assignment_log?.length, 1);
      check.equal("version bumped", r.evidence.evidence_version, "1.0.1");
      check.equal("record_state preserved", r.evidence.record_state, "draft");
    },
  },
  {
    fixture_id: "REF-OPS-063",
    title: "Grade assignment predecessor_revision_id and lineage",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-063");
      const evidenceId = "evidence:ref-ops-063";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      const r = await ops.assignEvidenceGrade({
        identity: evidenceId,
        revision_id: "rev:grade-1",
        expected_head_revision_id: "rev:initial",
        assignment: {
          label: "model_output_only",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-063",
          decision_ref: "decision:ref-ops-063",
          at: OPS_AT,
          event_id: "gae:ref-ops-063",
        },
      });
      check.equal(
        "predecessor",
        r.entity.predecessor_revision_id,
        "rev:initial",
      );
      const lineage = await ops.getEvidenceLineage(evidenceId);
      check.equal("lineage length", lineage.length, 2);
      const successor = lineage.find((e) => e.revision_id === "rev:grade-1");
      check.equal(
        "lineage predecessor",
        successor?.predecessor_revision_id,
        "rev:initial",
      );
    },
  },
  {
    fixture_id: "REF-OPS-064",
    title: "Deterministic Grade OPS double-run export",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      async function run() {
        const ops = makeOps("persist-sess:ref-ops-064");
        const evidenceId = "evidence:ref-ops-064";
        await ops.registerEvidenceUnit(evidenceInput(evidenceId));
        await ops.assignEvidenceGrade({
          identity: evidenceId,
          revision_id: "rev:grade-1",
          expected_head_revision_id: "rev:initial",
          assignment: {
            label: "model_output_only",
            authority_agent: OPS_HUMAN,
            reason: "REF-OPS-064",
            decision_ref: "decision:ref-ops-064",
            at: OPS_AT,
            event_id: "gae:ref-ops-064",
          },
        });
        return ops.exportEvidenceUnit(evidenceId);
      }
      const a = await run();
      const b = await run();
      check.equal("deterministic export", a, b);
    },
  },
  {
    fixture_id: "REF-OPS-065",
    title: "AI Grade raise rejected with Core F5; head unchanged",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-003"],
    expectation: { outcome: "failure", failure_code: "F5" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-065");
      const evidenceId = "evidence:ref-ops-065";
      await ops.registerEvidenceUnit(
        evidenceInput(evidenceId, {
          source: {
            source_class: "literature_venue",
            source_locator: "doi://10.1000/ref-ops-065",
            source_state: "declared",
          },
        }),
      );
      await ops.assignEvidenceGrade({
        identity: evidenceId,
        revision_id: "rev:grade-raise",
        expected_head_revision_id: "rev:initial",
        assignment: {
          label: "literature_secondary",
          authority_agent: "ai:ref-ops-agent",
          reason: "AI raise attempt",
          decision_ref: "decision:ref-ops-065",
          at: OPS_AT,
          event_id: "gae:ref-ops-065",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-066",
    title: "Missing Evidence Grade assign propagates NOT_FOUND",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "NOT_FOUND" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-066");
      await ops.assignEvidenceGrade({
        identity: "evidence:ref-ops-066-missing",
        revision_id: "rev:grade-1",
        expected_head_revision_id: "rev:initial",
        assignment: {
          label: "model_output_only",
          authority_agent: OPS_HUMAN,
          reason: "missing",
          decision_ref: "decision:ref-ops-066",
          at: OPS_AT,
          event_id: "gae:ref-ops-066",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-067",
    title: "Stale Evidence RevisionHead CAS rejects Grade assign with CONFLICT",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "CONFLICT" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-067");
      const evidenceId = "evidence:ref-ops-067";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      await ops.assignEvidenceGrade({
        identity: evidenceId,
        revision_id: "rev:grade-1",
        expected_head_revision_id: "rev:initial",
        assignment: {
          label: "model_output_only",
          authority_agent: OPS_HUMAN,
          reason: "first",
          decision_ref: "decision:ref-ops-067-a",
          at: OPS_AT,
          event_id: "gae:ref-ops-067-a",
        },
      });
      await ops.assignEvidenceGrade({
        identity: evidenceId,
        revision_id: "rev:grade-stale",
        expected_head_revision_id: "rev:initial",
        assignment: {
          label: "registered_primary_data",
          authority_agent: OPS_HUMAN,
          reason: "stale",
          decision_ref: "decision:ref-ops-067-b",
          at: OPS_AT,
          event_id: "gae:ref-ops-067-b",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-068",
    title: "Duplicate Grade revision_id rejects with ALREADY_EXISTS",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "ALREADY_EXISTS" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-068");
      const evidenceId = "evidence:ref-ops-068";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      const result = await ops.assignEvidenceGrade({
        identity: evidenceId,
        revision_id: "rev:grade-1",
        expected_head_revision_id: "rev:initial",
        assignment: {
          label: "model_output_only",
          authority_agent: OPS_HUMAN,
          reason: "first",
          decision_ref: "decision:ref-ops-068",
          at: OPS_AT,
          event_id: "gae:ref-ops-068",
        },
      });
      await ops.repository.create(result.entity);
    },
  },
  {
    fixture_id: "REF-OPS-069",
    title: "Evidence export head reflects new grade_ref; prior revision differs",
    scenario: "valid",
    authorities: ["OPS-001", "SER-JSON-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-069");
      const evidenceId = "evidence:ref-ops-069";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      await ops.assignEvidenceGrade({
        identity: evidenceId,
        revision_id: "rev:grade-1",
        expected_head_revision_id: "rev:initial",
        assignment: {
          label: "model_output_only",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-069",
          decision_ref: "decision:ref-ops-069",
          at: OPS_AT,
          event_id: "gae:ref-ops-069",
        },
      });
      const headExport = await ops.exportEvidenceUnit(evidenceId);
      const newRev = await ops.exportEvidenceUnitRevision(
        evidenceId,
        "rev:grade-1",
      );
      const oldExport = await ops.exportEvidenceUnitRevision(
        evidenceId,
        "rev:initial",
      );
      check.equal("head equals new rev", headExport, newRev);
      check.ok("old differs", headExport !== oldExport);
      check.ok(
        "head graded",
        headExport.includes("SCI-003@0.1.0:model_output_only"),
      );
      check.ok("old deferred", oldExport.includes("deferred_sci003"));
    },
  },
  {
    fixture_id: "REF-OPS-070",
    title: "Snapshot contains prior+new Evidence revisions and RevisionHead after Grade",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-070");
      const evidenceId = "evidence:ref-ops-070";
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-070",
      });
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        unit_kind: "EvidenceUnit",
        identity: evidenceId,
      });
      await ops.assignEvidenceGrade({
        identity: evidenceId,
        revision_id: "rev:grade-1",
        expected_head_revision_id: "rev:initial",
        assignment: {
          label: "model_output_only",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-070",
          decision_ref: "decision:ref-ops-070",
          at: OPS_AT,
          event_id: "gae:ref-ops-070",
        },
      });
      const snap = await ops.snapshotView(session);
      const keys = snap.persistence_snapshot.entities.map((e) => e.storage_key);
      check.ok(
        "initial rev",
        keys.some((k) => k.includes(":rev:initial")),
      );
      check.ok(
        "grade rev",
        keys.some((k) => k.includes(":rev:grade-1")),
      );
      check.ok(
        "RevisionHead",
        keys.some((k) => k.includes("persist:RevisionHead:EvidenceUnit:")),
      );
      check.ok(
        "no GradeDesignationUnit",
        !keys.some((k) => k.includes("GradeDesignationUnit")),
      );
    },
  },
  {
    fixture_id: "REF-OPS-071",
    title: "Optional ops.evidence_grade_assignment_revision event after successful CAS",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-071");
      const evidenceId = "evidence:ref-ops-071";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      const r = await ops.assignEvidenceGrade({
        identity: evidenceId,
        revision_id: "rev:grade-1",
        expected_head_revision_id: "rev:initial",
        append_event: true,
        assignment: {
          label: "model_output_only",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-071",
          decision_ref: "decision:ref-ops-071",
          at: OPS_AT,
          event_id: "gae:ref-ops-071",
        },
      });
      const events = await ops.getEvents(evidenceId);
      const hit = events.find(
        (e) => e.event_type === "ops.evidence_grade_assignment_revision",
      );
      check.ok("event present", hit !== undefined);
      check.equal("event_id", hit!.event_id, "ops:gae:ref-ops-071");
      check.equal(
        "to_grade_ref",
        (hit!.payload as { to_grade_ref: string }).to_grade_ref,
        r.evidence.grade_ref,
      );
    },
  },
  {
    fixture_id: "REF-OPS-072",
    title: "Grade assign does not create GradeDesignationUnit head",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-072");
      const evidenceId = "evidence:ref-ops-072";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      await ops.assignEvidenceGrade({
        identity: evidenceId,
        revision_id: "rev:grade-1",
        expected_head_revision_id: "rev:initial",
        assignment: {
          label: "model_output_only",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-072",
          decision_ref: "decision:ref-ops-072",
          at: OPS_AT,
          event_id: "gae:ref-ops-072",
        },
      });
      try {
        await ops.repository.getHead(evidenceId, "GradeDesignationUnit");
        check.ok("GradeDesignationUnit head must not exist", false);
      } catch (e) {
        check.ok(
          "NOT_FOUND",
          e instanceof PersistenceError && e.code === "NOT_FOUND",
        );
      }
      const evHead = await ops.getEvidenceHead(evidenceId);
      check.equal("Evidence head", evHead.content_version, "rev:grade-1");
    },
  },
  {
    fixture_id: "REF-OPS-073",
    title: "Prior Evidence revision immutable after Grade assignment",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-073");
      const evidenceId = "evidence:ref-ops-073";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      const before = await ops.exportEvidenceUnitRevision(
        evidenceId,
        "rev:initial",
      );
      await ops.assignEvidenceGrade({
        identity: evidenceId,
        revision_id: "rev:grade-1",
        expected_head_revision_id: "rev:initial",
        assignment: {
          label: "model_output_only",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-073",
          decision_ref: "decision:ref-ops-073",
          at: OPS_AT,
          event_id: "gae:ref-ops-073",
        },
      });
      const after = await ops.exportEvidenceUnitRevision(
        evidenceId,
        "rev:initial",
      );
      check.equal("prior unchanged", before, after);
    },
  },
  {
    fixture_id: "REF-OPS-074",
    title: "Invalid grade_ref encoding rejected with Core F1",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-003"],
    expectation: { outcome: "failure", failure_code: "F1" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-074");
      const evidenceId = "evidence:ref-ops-074";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      await ops.assignEvidenceGrade({
        identity: evidenceId,
        revision_id: "rev:grade-bad",
        expected_head_revision_id: "rev:initial",
        assignment: {
          to_grade_ref: "not-a-valid-grade-ref",
          authority_agent: OPS_HUMAN,
          reason: "bad ref",
          decision_ref: "decision:ref-ops-074",
          at: OPS_AT,
          event_id: "gae:ref-ops-074",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-075",
    title: "Membership unchanged by Grade assignment; workspace snapshot coherent",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-075");
      const evidenceId = "evidence:ref-ops-075";
      const ws = ops.openWorkspace({
        research_workspace_id: "workspace:ref-ops-075",
      });
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      ops.registerWorkspaceMember(ws, {
        entity_kind: "CanonicalUnit",
        unit_kind: "EvidenceUnit",
        identity: evidenceId,
      });
      const before = ws.members().length;
      await ops.assignEvidenceGrade({
        identity: evidenceId,
        revision_id: "rev:grade-1",
        expected_head_revision_id: "rev:initial",
        assignment: {
          label: "model_output_only",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-075",
          decision_ref: "decision:ref-ops-075",
          at: OPS_AT,
          event_id: "gae:ref-ops-075",
        },
      });
      check.equal("membership unchanged", ws.members().length, before);
      const snap = await ops.workspaceSnapshotView(ws);
      check.equal("workspace id", snap.research_workspace_id, "workspace:ref-ops-075");
      check.equal("member_refs", snap.member_refs.length, 1);
    },
  },
  {
    fixture_id: "REF-OPS-076",
    title: "Record State then Grade assignment coexist under Model C",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-002", "SCI-003"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-076");
      const evidenceId = "evidence:ref-ops-076";
      await ops.registerEvidenceUnit(evidenceInput(evidenceId));
      await ops.transitionEvidenceRecordState({
        identity: evidenceId,
        revision_id: "rev:record-registered-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "registered",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-076 register",
          decision_ref: "decision:ref-ops-076-rs",
          at: OPS_AT,
          event_id: "erte:ref-ops-076",
        },
      });
      const r = await ops.assignEvidenceGrade({
        identity: evidenceId,
        revision_id: "rev:grade-1",
        expected_head_revision_id: "rev:record-registered-1",
        assignment: {
          label: "model_output_only",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-076 grade",
          decision_ref: "decision:ref-ops-076-g",
          at: OPS_AT,
          event_id: "gae:ref-ops-076",
        },
      });
      check.equal("record_state", r.evidence.record_state, "registered");
      check.equal(
        "grade_ref",
        r.evidence.grade_ref,
        "SCI-003@0.1.0:model_output_only",
      );
      check.equal("head", r.head_revision_id, "rev:grade-1");
      const lineage = await ops.getEvidenceLineage(evidenceId);
      check.equal("three revisions", lineage.length, 3);
    },
  },
  {
    fixture_id: "REF-OPS-077",
    title: "Contradiction createOpen → ContradictionUnit rev:initial + head",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-004", "ENC-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-077");
      const cid = "contradiction:ref-ops-077";
      const claims = ["claim:ref-ops-077-a", "claim:ref-ops-077-b"] as const;
      const evid = "evidence:ref-ops-077";
      const r = await ops.registerContradictionUnit(
        contradictionInput(cid, claims, { evidence_refs: [evid] }),
      );
      check.equal("record_state", r.contradiction.record_state, "open");
      check.equal("CRTE empty", r.contradiction.record_transition_log?.length ?? 0, 0);
      check.equal("unit_kind", r.unit.envelope.unit_kind, "ContradictionUnit");
      check.equal("intact", r.unit.intact, true);
      check.equal("revision", r.entity.revision_id, "rev:initial");
      check.equal(
        "content_version",
        r.unit.envelope.content_version,
        r.contradiction.contradiction_version,
      );
      const involves = r.unit.envelope.references.filter((x) => x.role === "involves");
      const cites = r.unit.envelope.references.filter(
        (x) => x.role === "cites_evidence",
      );
      check.equal("involves count", involves.length, 2);
      check.equal("involves[0]", involves[0]?.identity, claims[0]);
      check.equal("involves[1]", involves[1]?.identity, claims[1]);
      check.equal("cites_evidence", cites[0]?.identity, evid);
      const head = await ops.getContradictionHead(cid);
      check.equal("head", head.content_version, "rev:initial");
    },
  },
  {
    fixture_id: "REF-OPS-078",
    title: "Contradiction create with <2 involved_claims rejects Core F2; nothing persisted",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-004"],
    expectation: { outcome: "failure", failure_code: "F2" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-078");
      await ops.registerContradictionUnit(
        contradictionInput("contradiction:ref-ops-078", ["claim:ref-ops-078-only"]),
      );
    },
  },
  {
    fixture_id: "REF-OPS-079",
    title: "Bad Claim id in involved_claims rejects Core F3",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-004"],
    expectation: { outcome: "failure", failure_code: "F3" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-079");
      await ops.registerContradictionUnit(
        contradictionInput("contradiction:ref-ops-079", [
          "claim:ref-ops-079-a",
          "not-a-claim-id",
        ]),
      );
    },
  },
  {
    fixture_id: "REF-OPS-080",
    title: "Bad Evidence id in evidence_refs rejects Core F4",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-004"],
    expectation: { outcome: "failure", failure_code: "F4" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-080");
      await ops.registerContradictionUnit(
        contradictionInput(
          "contradiction:ref-ops-080",
          ["claim:ref-ops-080-a", "claim:ref-ops-080-b"],
          { evidence_refs: ["not-an-evidence-id"] },
        ),
      );
    },
  },
  {
    fixture_id: "REF-OPS-081",
    title: "incompatibility_statement none rejects Core F9",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-004"],
    expectation: { outcome: "failure", failure_code: "F9" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-081");
      await ops.registerContradictionUnit(
        contradictionInput(
          "contradiction:ref-ops-081",
          ["claim:ref-ops-081-a", "claim:ref-ops-081-b"],
          { incompatibility_statement: "none" },
        ),
      );
    },
  },
  {
    fixture_id: "REF-OPS-082",
    title: "Duplicate Contradiction create rejects ALREADY_EXISTS",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "ALREADY_EXISTS" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-082");
      const cid = "contradiction:ref-ops-082";
      const claims = ["claim:ref-ops-082-a", "claim:ref-ops-082-b"] as const;
      await ops.registerContradictionUnit(contradictionInput(cid, claims));
      await ops.registerContradictionUnit(contradictionInput(cid, claims));
    },
  },
  {
    fixture_id: "REF-OPS-083",
    title: "registerContradictionUnit non-initial revision_id → OpsError",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "INVALID_COMMAND_STATE" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-083");
      await ops.registerContradictionUnit(
        contradictionInput("contradiction:ref-ops-083", [
          "claim:ref-ops-083-a",
          "claim:ref-ops-083-b",
        ]),
        { revision_id: "rev:not-initial" },
      );
    },
  },
  {
    fixture_id: "REF-OPS-084",
    title: "Post-persist resolve resolved_by_scope_split under Model C",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-004"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-084");
      const cid = "contradiction:ref-ops-084";
      const claims = ["claim:ref-ops-084-a", "claim:ref-ops-084-b"] as const;
      const created = await ops.registerContradictionUnit(
        contradictionInput(cid, claims),
      );
      const r = await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:resolved-scope-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "resolved_by_scope_split",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-084 resolve",
          decision_ref: "decision:ref-ops-084",
          at: OPS_AT,
          event_id: "crte:ref-ops-084",
          resolution_note: "scope split recorded",
        },
      });
      check.equal("state", r.contradiction.record_state, "resolved_by_scope_split");
      check.equal("head", r.head_revision_id, "rev:resolved-scope-1");
      check.equal(
        "predecessor",
        r.entity.predecessor_revision_id,
        "rev:initial",
      );
      check.equal(
        "version unchanged",
        r.contradiction.contradiction_version,
        created.contradiction.contradiction_version,
      );
      check.equal("CRTE length", r.contradiction.record_transition_log?.length, 1);
      check.equal("note", r.contradiction.resolution_note, "scope split recorded");
    },
  },
  {
    fixture_id: "REF-OPS-085",
    title: "Post-persist resolved_by_supersession",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-004"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-085");
      const cid = "contradiction:ref-ops-085";
      await ops.registerContradictionUnit(
        contradictionInput(cid, ["claim:ref-ops-085-a", "claim:ref-ops-085-b"]),
      );
      const r = await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:resolved-supersession-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "resolved_by_supersession",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-085",
          decision_ref: "decision:ref-ops-085",
          at: OPS_AT,
          event_id: "crte:ref-ops-085",
          resolution_note: "supersession recorded",
        },
      });
      check.equal("state", r.contradiction.record_state, "resolved_by_supersession");
    },
  },
  {
    fixture_id: "REF-OPS-086",
    title: "Post-persist resolved_by_retraction",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-004"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-086");
      const cid = "contradiction:ref-ops-086";
      await ops.registerContradictionUnit(
        contradictionInput(cid, ["claim:ref-ops-086-a", "claim:ref-ops-086-b"]),
      );
      const r = await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:resolved-retraction-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "resolved_by_retraction",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-086",
          decision_ref: "decision:ref-ops-086",
          at: OPS_AT,
          event_id: "crte:ref-ops-086",
          resolution_note: "retraction recorded",
        },
      });
      check.equal("state", r.contradiction.record_state, "resolved_by_retraction");
    },
  },
  {
    fixture_id: "REF-OPS-087",
    title: "Post-persist unresolved_archived without resolution_note",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-004"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-087");
      const cid = "contradiction:ref-ops-087";
      await ops.registerContradictionUnit(
        contradictionInput(cid, ["claim:ref-ops-087-a", "claim:ref-ops-087-b"]),
      );
      const r = await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:archived-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "unresolved_archived",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-087 archive",
          decision_ref: "decision:ref-ops-087",
          at: OPS_AT,
          event_id: "crte:ref-ops-087",
        },
      });
      check.equal("state", r.contradiction.record_state, "unresolved_archived");
      check.equal("no note", r.contradiction.resolution_note, undefined);
    },
  },
  {
    fixture_id: "REF-OPS-088",
    title: "AI leaving open rejected with Core F6; head unchanged",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-004"],
    expectation: { outcome: "failure", failure_code: "F6" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-088");
      const cid = "contradiction:ref-ops-088";
      await ops.registerContradictionUnit(
        contradictionInput(cid, ["claim:ref-ops-088-a", "claim:ref-ops-088-b"]),
      );
      await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:ai-resolve",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "resolved_by_scope_split",
          authority_agent: "ai:ref-ops-agent",
          reason: "AI resolve attempt",
          decision_ref: "decision:ref-ops-088",
          at: OPS_AT,
          event_id: "crte:ref-ops-088",
          resolution_note: "should not apply",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-089",
    title: "resolved_* without resolution_note rejects Core F7",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-004"],
    expectation: { outcome: "failure", failure_code: "F7" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-089");
      const cid = "contradiction:ref-ops-089";
      await ops.registerContradictionUnit(
        contradictionInput(cid, ["claim:ref-ops-089-a", "claim:ref-ops-089-b"]),
      );
      await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:no-note",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "resolved_by_scope_split",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-089",
          decision_ref: "decision:ref-ops-089",
          at: OPS_AT,
          event_id: "crte:ref-ops-089",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-090",
    title: "Terminal Contradiction re-transition rejects F_TRANSITION",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-004"],
    expectation: { outcome: "failure", failure_code: "F_TRANSITION" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-090");
      const cid = "contradiction:ref-ops-090";
      await ops.registerContradictionUnit(
        contradictionInput(cid, ["claim:ref-ops-090-a", "claim:ref-ops-090-b"]),
      );
      await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:resolved-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "resolved_by_scope_split",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-090 first",
          decision_ref: "decision:ref-ops-090-a",
          at: OPS_AT,
          event_id: "crte:ref-ops-090-a",
          resolution_note: "done",
        },
      });
      await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:illegal-2",
        expected_head_revision_id: "rev:resolved-1",
        transition: {
          to: "unresolved_archived",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-090 illegal",
          decision_ref: "decision:ref-ops-090-b",
          at: OPS_AT,
          event_id: "crte:ref-ops-090-b",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-091",
    title: "Stale Contradiction RevisionHead CAS rejects CONFLICT",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "CONFLICT" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-091");
      const cid = "contradiction:ref-ops-091";
      await ops.registerContradictionUnit(
        contradictionInput(cid, ["claim:ref-ops-091-a", "claim:ref-ops-091-b"]),
      );
      // Head remains rev:initial; mismatched expected_head forces CAS CONFLICT
      // (terminals cannot be used for a second legal Core transition).
      await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:stale-attempt",
        expected_head_revision_id: "rev:not-current",
        transition: {
          to: "unresolved_archived",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-091 stale expected head",
          decision_ref: "decision:ref-ops-091",
          at: OPS_AT,
          event_id: "crte:ref-ops-091",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-092",
    title: "Duplicate Contradiction revision_id rejects ALREADY_EXISTS",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "ALREADY_EXISTS" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-092");
      const cid = "contradiction:ref-ops-092";
      await ops.registerContradictionUnit(
        contradictionInput(cid, ["claim:ref-ops-092-a", "claim:ref-ops-092-b"]),
      );
      const result = await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:resolved-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "unresolved_archived",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-092",
          decision_ref: "decision:ref-ops-092",
          at: OPS_AT,
          event_id: "crte:ref-ops-092",
        },
      });
      await ops.repository.create(result.entity);
    },
  },
  {
    fixture_id: "REF-OPS-093",
    title: "Claim.contested_by coexistence with persisted Contradiction",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-001", "SCI-004"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-093");
      const claimA = "claim:ref-ops-093-a";
      const claimB = "claim:ref-ops-093-b";
      const cid = "contradiction:ref-ops-093";
      await ops.registerClaimUnit(claimInput(claimA));
      await ops.registerClaimUnit(claimInput(claimB));
      await ops.registerContradictionUnit(
        contradictionInput(cid, [claimA, claimB]),
      );
      const standing = await ops.transitionClaimStanding({
        identity: claimA,
        revision_id: "rev:standing-contested-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "contested",
          authority_agent: OPS_HUMAN,
          reason: `${CLINICAL_BOUNDARY_ACK} REF-OPS-093`,
          at: OPS_AT,
          event_id: "ste:ref-ops-093",
          contested_by: [cid],
        },
      });
      check.equal("standing", standing.claim.standing, "contested");
      check.equal("contested_by", standing.claim.contested_by?.[0], cid);
      const cHead = await ops.getContradictionHead(cid);
      check.equal("contradiction head", cHead.content_version, "rev:initial");
      const claimHead = await ops.getClaimHead(claimA);
      check.equal(
        "claim head independent",
        claimHead.content_version,
        "rev:standing-contested-1",
      );
      const decoded = claimFromClaimUnitPayload(standing.entity.payload);
      check.equal("claim contested_by preserved", decoded.contested_by?.[0], cid);
    },
  },
  {
    fixture_id: "REF-OPS-094",
    title: "Referenced Claims absent still registers (grammar-only)",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-004"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-094");
      const cid = "contradiction:ref-ops-094";
      const r = await ops.registerContradictionUnit(
        contradictionInput(cid, [
          "claim:ref-ops-094-absent-a",
          "claim:ref-ops-094-absent-b",
        ]),
      );
      check.equal("created", r.contradiction.contradiction_id, cid);
      check.equal("state", r.contradiction.record_state, "open");
    },
  },
  {
    fixture_id: "REF-OPS-095",
    title: "Invalid Contradiction transition revision identities",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-095");
      const cid = "contradiction:ref-ops-095";
      await ops.registerContradictionUnit(
        contradictionInput(cid, ["claim:ref-ops-095-a", "claim:ref-ops-095-b"]),
      );
      let initialBlocked = false;
      try {
        await ops.transitionContradictionRecordState({
          identity: cid,
          revision_id: "rev:initial",
          expected_head_revision_id: "rev:initial",
          transition: {
            to: "unresolved_archived",
            authority_agent: OPS_HUMAN,
            reason: "bad",
            decision_ref: "decision:ref-ops-095-a",
            at: OPS_AT,
            event_id: "crte:ref-ops-095-a",
          },
        });
      } catch (e) {
        initialBlocked =
          e instanceof OpsError && e.code === "INVALID_COMMAND_STATE";
      }
      check.ok("rev:initial blocked", initialBlocked);
      let equalBlocked = false;
      try {
        await ops.transitionContradictionRecordState({
          identity: cid,
          revision_id: "rev:same",
          expected_head_revision_id: "rev:same",
          transition: {
            to: "unresolved_archived",
            authority_agent: OPS_HUMAN,
            reason: "bad",
            decision_ref: "decision:ref-ops-095-b",
            at: OPS_AT,
            event_id: "crte:ref-ops-095-b",
          },
        });
      } catch (e) {
        equalBlocked =
          e instanceof OpsError && e.code === "INVALID_COMMAND_STATE";
      }
      check.ok("equal ids blocked", equalBlocked);
      let invalidId = false;
      try {
        await ops.transitionContradictionRecordState({
          identity: cid,
          revision_id: "not-a-rev",
          expected_head_revision_id: "rev:initial",
          transition: {
            to: "unresolved_archived",
            authority_agent: OPS_HUMAN,
            reason: "bad",
            decision_ref: "decision:ref-ops-095-c",
            at: OPS_AT,
            event_id: "crte:ref-ops-095-c",
          },
        });
      } catch (e) {
        invalidId =
          e instanceof PersistenceError && e.code === "INVALID_ID";
      }
      check.ok("INVALID_ID", invalidId);
    },
  },
  {
    fixture_id: "REF-OPS-096",
    title: "Prior Contradiction revision immutable after transition",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-096");
      const cid = "contradiction:ref-ops-096";
      await ops.registerContradictionUnit(
        contradictionInput(cid, ["claim:ref-ops-096-a", "claim:ref-ops-096-b"]),
      );
      const before = await ops.exportContradictionUnitRevision(cid, "rev:initial");
      await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:archived-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "unresolved_archived",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-096",
          decision_ref: "decision:ref-ops-096",
          at: OPS_AT,
          event_id: "crte:ref-ops-096",
        },
      });
      const after = await ops.exportContradictionUnitRevision(cid, "rev:initial");
      check.equal("prior unchanged", before, after);
    },
  },
  {
    fixture_id: "REF-OPS-097",
    title: "Contradiction lineage predecessor chain",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-097");
      const cid = "contradiction:ref-ops-097";
      await ops.registerContradictionUnit(
        contradictionInput(cid, ["claim:ref-ops-097-a", "claim:ref-ops-097-b"]),
      );
      await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:archived-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "unresolved_archived",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-097",
          decision_ref: "decision:ref-ops-097",
          at: OPS_AT,
          event_id: "crte:ref-ops-097",
        },
      });
      const lineage = await ops.getContradictionLineage(cid);
      check.equal("length", lineage.length, 2);
      const successor = lineage.find((e) => e.revision_id === "rev:archived-1");
      check.equal("predecessor", successor?.predecessor_revision_id, "rev:initial");
    },
  },
  {
    fixture_id: "REF-OPS-098",
    title: "Decode round-trip from ContradictionUnit payload",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-004", "ENC-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-098");
      const cid = "contradiction:ref-ops-098";
      const claims = ["claim:ref-ops-098-a", "claim:ref-ops-098-b"] as const;
      const evid = "evidence:ref-ops-098";
      await ops.registerContradictionUnit(
        contradictionInput(cid, claims, { evidence_refs: [evid] }),
      );
      const r = await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:resolved-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "resolved_by_scope_split",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-098",
          decision_ref: "decision:ref-ops-098",
          at: OPS_AT,
          event_id: "crte:ref-ops-098",
          resolution_note: "decoded note",
        },
      });
      const decoded = contradictionFromContradictionUnitPayload(r.entity.payload);
      check.equal("id", decoded.contradiction_id, cid);
      check.equal("involves[0]", decoded.involved_claims[0], claims[0]);
      check.equal("involves[1]", decoded.involved_claims[1], claims[1]);
      check.equal("evidence", decoded.evidence_refs?.[0], evid);
      check.equal("note", decoded.resolution_note, "decoded note");
      check.equal("CRTE", decoded.record_transition_log?.length, 1);
      const reassembled = await new CanonicalEncoder().assemble(decoded);
      check.equal(
        "unit_kind",
        reassembled.envelope.unit_kind,
        "ContradictionUnit",
      );
      check.equal(
        "involves role",
        reassembled.envelope.references.filter((x) => x.role === "involves")
          .length,
        2,
      );
    },
  },
  {
    fixture_id: "REF-OPS-099",
    title: "Contradiction membership caller-explicit; create does not register",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-099");
      const cid = "contradiction:ref-ops-099";
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-099",
      });
      await ops.registerContradictionUnit(
        contradictionInput(cid, ["claim:ref-ops-099-a", "claim:ref-ops-099-b"]),
      );
      check.equal("no auto member", session.members().length, 0);
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        unit_kind: "ContradictionUnit",
        identity: cid,
      });
      check.equal("after register", session.members().length, 1);
      await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:archived-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "unresolved_archived",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-099",
          decision_ref: "decision:ref-ops-099",
          at: OPS_AT,
          event_id: "crte:ref-ops-099",
        },
      });
      check.equal("membership unchanged", session.members().length, 1);
    },
  },
  {
    fixture_id: "REF-OPS-100",
    title: "ResearchSnapshot and WorkspaceSnapshot include Contradiction Model C rows",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-100");
      const cid = "contradiction:ref-ops-100";
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-100",
      });
      const ws = ops.openWorkspace({
        research_workspace_id: "workspace:ref-ops-100",
      });
      await ops.registerContradictionUnit(
        contradictionInput(cid, ["claim:ref-ops-100-a", "claim:ref-ops-100-b"]),
      );
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        unit_kind: "ContradictionUnit",
        identity: cid,
      });
      ops.registerWorkspaceMember(ws, {
        entity_kind: "CanonicalUnit",
        unit_kind: "ContradictionUnit",
        identity: cid,
      });
      await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:archived-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "unresolved_archived",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-100",
          decision_ref: "decision:ref-ops-100",
          at: OPS_AT,
          event_id: "crte:ref-ops-100",
        },
      });
      const snap = await ops.snapshotView(session);
      check.equal(
        "session id shape",
        snap.research_session_id,
        "research:session:ref-ops-100",
      );
      const keys = snap.persistence_snapshot.entities.map((e) => e.storage_key);
      check.ok(
        "initial",
        keys.some((k) => k.includes("ContradictionUnit") && k.includes(":rev:initial")),
      );
      check.ok(
        "successor",
        keys.some((k) => k.includes(":rev:archived-1")),
      );
      check.ok(
        "head",
        keys.some((k) =>
          k.includes("persist:RevisionHead:ContradictionUnit:"),
        ),
      );
      const wsnap = await ops.workspaceSnapshotView(ws);
      check.equal("workspace id", wsnap.research_workspace_id, "workspace:ref-ops-100");
      check.equal("member_refs", wsnap.member_refs.length, 1);
    },
  },
  {
    fixture_id: "REF-OPS-101",
    title: "Optional ops.contradiction_record_state_revision with caller event_id",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-101");
      const cid = "contradiction:ref-ops-101";
      await ops.registerContradictionUnit(
        contradictionInput(cid, ["claim:ref-ops-101-a", "claim:ref-ops-101-b"]),
      );
      await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:archived-1",
        expected_head_revision_id: "rev:initial",
        append_event: true,
        transition: {
          to: "unresolved_archived",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-101",
          decision_ref: "decision:ref-ops-101",
          at: OPS_AT,
          event_id: "crte:ref-ops-101",
        },
      });
      const events = await ops.getEvents(cid);
      const hit = events.find(
        (e) => e.event_type === "ops.contradiction_record_state_revision",
      );
      check.ok("event present", hit !== undefined);
      check.equal("event_id", hit!.event_id, "ops:crte:ref-ops-101");
      check.equal(
        "to_record_state",
        (hit!.payload as { to_record_state: string }).to_record_state,
        "unresolved_archived",
      );
      const none = await (async () => {
        const ops2 = makeOps("persist-sess:ref-ops-101-b");
        await ops2.registerContradictionUnit(
          contradictionInput("contradiction:ref-ops-101-b", [
            "claim:ref-ops-101-b-a",
            "claim:ref-ops-101-b-b",
          ]),
        );
        await ops2.transitionContradictionRecordState({
          identity: "contradiction:ref-ops-101-b",
          revision_id: "rev:archived-1",
          expected_head_revision_id: "rev:initial",
          transition: {
            to: "unresolved_archived",
            authority_agent: OPS_HUMAN,
            reason: "default off",
            decision_ref: "decision:ref-ops-101-b",
            at: OPS_AT,
            event_id: "crte:ref-ops-101-b",
          },
        });
        return ops2.getEvents("contradiction:ref-ops-101-b");
      })();
      check.equal(
        "default no ops event",
        none.filter(
          (e) => e.event_type === "ops.contradiction_record_state_revision",
        ).length,
        0,
      );
    },
  },
  {
    fixture_id: "REF-OPS-102",
    title: "Contradiction OPS does not create Persistence.Relationship entities",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-102");
      const cid = "contradiction:ref-ops-102";
      await ops.registerContradictionUnit(
        contradictionInput(
          cid,
          ["claim:ref-ops-102-a", "claim:ref-ops-102-b"],
          { evidence_refs: ["evidence:ref-ops-102"] },
        ),
      );
      await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:archived-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "unresolved_archived",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-102",
          decision_ref: "decision:ref-ops-102",
          at: OPS_AT,
          event_id: "crte:ref-ops-102",
        },
      });
      const listed = await ops.repository.list({
        filter: { entity_kind: "Relationship" },
      });
      check.equal("no Relationship entities", listed.total, 0);
    },
  },
  {
    fixture_id: "REF-OPS-103",
    title: "Deterministic Contradiction export double-run",
    scenario: "valid",
    authorities: ["OPS-001", "SER-JSON-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      async function run() {
        const ops = makeOps("persist-sess:ref-ops-103");
        const cid = "contradiction:ref-ops-103";
        await ops.registerContradictionUnit(
          contradictionInput(cid, [
            "claim:ref-ops-103-a",
            "claim:ref-ops-103-b",
          ]),
        );
        await ops.transitionContradictionRecordState({
          identity: cid,
          revision_id: "rev:archived-1",
          expected_head_revision_id: "rev:initial",
          transition: {
            to: "unresolved_archived",
            authority_agent: OPS_HUMAN,
            reason: "REF-OPS-103",
            decision_ref: "decision:ref-ops-103",
            at: OPS_AT,
            event_id: "crte:ref-ops-103",
          },
        });
        return ops.exportContradictionUnit(cid);
      }
      const a = await run();
      const b = await run();
      check.equal("deterministic export", a, b);
    },
  },
  {
    fixture_id: "REF-OPS-104",
    title: "Missing Contradiction transition propagates NOT_FOUND",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "NOT_FOUND" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-104");
      await ops.transitionContradictionRecordState({
        identity: "contradiction:ref-ops-104-missing",
        revision_id: "rev:archived-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "unresolved_archived",
          authority_agent: OPS_HUMAN,
          reason: "missing",
          decision_ref: "decision:ref-ops-104",
          at: OPS_AT,
          event_id: "crte:ref-ops-104",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-105",
    title: "Missing decision_ref leaving open rejects F_TRANSITION",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-004"],
    expectation: { outcome: "failure", failure_code: "F_TRANSITION" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-105");
      const cid = "contradiction:ref-ops-105";
      await ops.registerContradictionUnit(
        contradictionInput(cid, ["claim:ref-ops-105-a", "claim:ref-ops-105-b"]),
      );
      await ops.transitionContradictionRecordState({
        identity: cid,
        revision_id: "rev:no-decision",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "unresolved_archived",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-105",
          at: OPS_AT,
          event_id: "crte:ref-ops-105",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-106",
    title: "Negative Result createRegistered → NegativeResultUnit rev:initial + head",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-005", "ENC-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-106");
      const nid = "negresult:ref-ops-106";
      const claim = "claim:ref-ops-106";
      const evid = "evidence:ref-ops-106";
      const r = await ops.registerNegativeResultUnit(
        negativeResultInput(nid, {
          claim_refs: [claim],
          evidence_refs: [evid],
        }),
        negativeResultRegistration("nrte:ref-ops-106"),
      );
      check.equal("record_state", r.negativeResult.record_state, "registered");
      check.equal("NRTE count", r.negativeResult.record_transition_log?.length ?? 0, 1);
      check.equal("unit_kind", r.unit.envelope.unit_kind, "NegativeResultUnit");
      check.equal("intact", r.unit.intact, true);
      check.equal("revision", r.entity.revision_id, "rev:initial");
      check.equal(
        "content_version",
        r.unit.envelope.content_version,
        r.negativeResult.negative_result_version,
      );
      const claims = r.unit.envelope.references.filter(
        (x) => x.role === "qualifies_or_challenges",
      );
      const cites = r.unit.envelope.references.filter(
        (x) => x.role === "cites_evidence",
      );
      check.equal("claim_refs", claims[0]?.identity, claim);
      check.equal("evidence_refs", cites[0]?.identity, evid);
      const head = await ops.getNegativeResultHead(nid);
      check.equal("head", head.content_version, "rev:initial");
    },
  },
  {
    fixture_id: "REF-OPS-107",
    title: "AI registration of Negative Result rejects Core F5; nothing persisted",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-005"],
    expectation: { outcome: "failure", failure_code: "F5" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-107");
      await ops.registerNegativeResultUnit(
        negativeResultInput("negresult:ref-ops-107"),
        negativeResultRegistration("nrte:ref-ops-107", {
          authority_agent: "ai:ref-ops-107",
        }),
      );
    },
  },
  {
    fixture_id: "REF-OPS-108",
    title: "Empty decision_ref on registration rejects F_TRANSITION",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-005"],
    expectation: { outcome: "failure", failure_code: "F_TRANSITION" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-108");
      await ops.registerNegativeResultUnit(
        negativeResultInput("negresult:ref-ops-108"),
        negativeResultRegistration("nrte:ref-ops-108", { decision_ref: "  " }),
      );
    },
  },
  {
    fixture_id: "REF-OPS-109",
    title: "Bad negative_result_id rejects Core F1",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-005"],
    expectation: { outcome: "failure", failure_code: "F1" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-109");
      await ops.registerNegativeResultUnit(
        negativeResultInput("not-a-negresult-id"),
        negativeResultRegistration("nrte:ref-ops-109"),
      );
    },
  },
  {
    fixture_id: "REF-OPS-110",
    title: "Empty protocol_ref rejects Core F2",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-005"],
    expectation: { outcome: "failure", failure_code: "F2" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-110");
      await ops.registerNegativeResultUnit(
        negativeResultInput("negresult:ref-ops-110", { protocol_ref: "  " }),
        negativeResultRegistration("nrte:ref-ops-110"),
      );
    },
  },
  {
    fixture_id: "REF-OPS-111",
    title: "expected_observation none rejects Core F2",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-005"],
    expectation: { outcome: "failure", failure_code: "F2" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-111");
      await ops.registerNegativeResultUnit(
        negativeResultInput("negresult:ref-ops-111", {
          expected_observation: "none",
        }),
        negativeResultRegistration("nrte:ref-ops-111"),
      );
    },
  },
  {
    fixture_id: "REF-OPS-112",
    title: "Bad Claim id in claim_refs rejects Core F8",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-005"],
    expectation: { outcome: "failure", failure_code: "F8" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-112");
      await ops.registerNegativeResultUnit(
        negativeResultInput("negresult:ref-ops-112", {
          claim_refs: ["not-a-claim-id"],
        }),
        negativeResultRegistration("nrte:ref-ops-112"),
      );
    },
  },
  {
    fixture_id: "REF-OPS-113",
    title: "Duplicate Negative Result create rejects ALREADY_EXISTS",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "ALREADY_EXISTS" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-113");
      const nid = "negresult:ref-ops-113";
      await ops.registerNegativeResultUnit(
        negativeResultInput(nid),
        negativeResultRegistration("nrte:ref-ops-113-a"),
      );
      await ops.registerNegativeResultUnit(
        negativeResultInput(nid),
        negativeResultRegistration("nrte:ref-ops-113-b"),
      );
    },
  },
  {
    fixture_id: "REF-OPS-114",
    title: "registerNegativeResultUnit non-initial revision_id → OpsError",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "INVALID_COMMAND_STATE" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-114");
      await ops.registerNegativeResultUnit(
        negativeResultInput("negresult:ref-ops-114"),
        negativeResultRegistration("nrte:ref-ops-114"),
        { revision_id: "rev:not-initial" },
      );
    },
  },
  {
    fixture_id: "REF-OPS-115",
    title: "Post-persist withdraw Human → successor revision + head",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-005", "ENC-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-115");
      const nid = "negresult:ref-ops-115";
      const created = await ops.registerNegativeResultUnit(
        negativeResultInput(nid),
        negativeResultRegistration("nrte:ref-ops-115-reg"),
      );
      const version = created.negativeResult.negative_result_version;
      const r = await ops.transitionNegativeResultRecordState({
        identity: nid,
        revision_id: "rev:withdrawn-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "withdrawn",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-115 withdraw",
          decision_ref: "decision:ref-ops-115",
          at: OPS_AT,
          event_id: "nrte:ref-ops-115-wd",
          withdrawal_reason: "protocol superseded",
        },
      });
      check.equal("record_state", r.negativeResult.record_state, "withdrawn");
      check.equal("withdrawal_reason", r.negativeResult.withdrawal_reason, "protocol superseded");
      check.equal("version unchanged", r.negativeResult.negative_result_version, version);
      check.equal("revision", r.entity.revision_id, "rev:withdrawn-1");
      check.equal(
        "predecessor",
        r.entity.predecessor_revision_id,
        "rev:initial",
      );
      check.equal("head", r.head_revision_id, "rev:withdrawn-1");
      check.equal("NRTE count", r.negativeResult.record_transition_log?.length ?? 0, 2);
    },
  },
  {
    fixture_id: "REF-OPS-116",
    title: "AI withdrawal rejects Core F5; head unchanged",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-005"],
    expectation: { outcome: "failure", failure_code: "F5" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-116");
      const nid = "negresult:ref-ops-116";
      await ops.registerNegativeResultUnit(
        negativeResultInput(nid),
        negativeResultRegistration("nrte:ref-ops-116-reg"),
      );
      await ops.transitionNegativeResultRecordState({
        identity: nid,
        revision_id: "rev:withdrawn-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "withdrawn",
          authority_agent: "ai:ref-ops-116",
          reason: "AI withdraw",
          decision_ref: "decision:ref-ops-116",
          at: OPS_AT,
          event_id: "nrte:ref-ops-116-wd",
          withdrawal_reason: "attempt",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-117",
    title: "Missing withdrawal_reason rejects Core F7",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-005"],
    expectation: { outcome: "failure", failure_code: "F7" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-117");
      const nid = "negresult:ref-ops-117";
      await ops.registerNegativeResultUnit(
        negativeResultInput(nid),
        negativeResultRegistration("nrte:ref-ops-117-reg"),
      );
      await ops.transitionNegativeResultRecordState({
        identity: nid,
        revision_id: "rev:withdrawn-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "withdrawn",
          authority_agent: OPS_HUMAN,
          reason: "withdraw",
          decision_ref: "decision:ref-ops-117",
          at: OPS_AT,
          event_id: "nrte:ref-ops-117-wd",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-118",
    title: "Terminal withdrawn re-transition rejects F_TRANSITION",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-005"],
    expectation: { outcome: "failure", failure_code: "F_TRANSITION" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-118");
      const nid = "negresult:ref-ops-118";
      await ops.registerNegativeResultUnit(
        negativeResultInput(nid),
        negativeResultRegistration("nrte:ref-ops-118-reg"),
      );
      await ops.transitionNegativeResultRecordState({
        identity: nid,
        revision_id: "rev:withdrawn-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "withdrawn",
          authority_agent: OPS_HUMAN,
          reason: "withdraw",
          decision_ref: "decision:ref-ops-118",
          at: OPS_AT,
          event_id: "nrte:ref-ops-118-wd",
          withdrawal_reason: "done",
        },
      });
      await ops.transitionNegativeResultRecordState({
        identity: nid,
        revision_id: "rev:again",
        expected_head_revision_id: "rev:withdrawn-1",
        transition: {
          to: "registered",
          authority_agent: OPS_HUMAN,
          reason: "illegal",
          decision_ref: "decision:ref-ops-118-b",
          at: OPS_AT,
          event_id: "nrte:ref-ops-118-again",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-119",
    title: "Stale head CAS rejects CONFLICT; prior head retained",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "CONFLICT" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-119");
      const nid = "negresult:ref-ops-119";
      await ops.registerNegativeResultUnit(
        negativeResultInput(nid),
        negativeResultRegistration("nrte:ref-ops-119-reg"),
      );
      // Head remains rev:initial; mismatched expected_head forces CAS CONFLICT
      // (terminals cannot be used for a second legal Core transition).
      await ops.transitionNegativeResultRecordState({
        identity: nid,
        revision_id: "rev:stale-attempt",
        expected_head_revision_id: "rev:not-current",
        transition: {
          to: "withdrawn",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-119 stale expected head",
          decision_ref: "decision:ref-ops-119",
          at: OPS_AT,
          event_id: "nrte:ref-ops-119-wd",
          withdrawal_reason: "stale attempt",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-120",
    title: "Duplicate revision_id rejects ALREADY_EXISTS",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "ALREADY_EXISTS" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-120");
      const nid = "negresult:ref-ops-120";
      await ops.registerNegativeResultUnit(
        negativeResultInput(nid),
        negativeResultRegistration("nrte:ref-ops-120-reg"),
      );
      const result = await ops.transitionNegativeResultRecordState({
        identity: nid,
        revision_id: "rev:withdrawn-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "withdrawn",
          authority_agent: OPS_HUMAN,
          reason: "withdraw",
          decision_ref: "decision:ref-ops-120",
          at: OPS_AT,
          event_id: "nrte:ref-ops-120-wd",
          withdrawal_reason: "done",
        },
      });
      await ops.repository.create(result.entity);
    },
  },
  {
    fixture_id: "REF-OPS-121",
    title: "Claim.qualified_by coexistence with persisted Negative Result",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-001", "SCI-005"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-121");
      const nid = "negresult:ref-ops-121";
      const claimId = "claim:ref-ops-121";
      await ops.registerNegativeResultUnit(
        negativeResultInput(nid, { claim_refs: [claimId] }),
        negativeResultRegistration("nrte:ref-ops-121"),
      );
      const claim = await ops.registerClaimUnit({
        ...claimInput(claimId),
        qualified_by: [nid],
      });
      check.equal("qualified_by", claim.claim.qualified_by?.[0], nid);
      const nr = await ops.getNegativeResultUnit(nid);
      const decoded = negativeResultFromNegativeResultUnitPayload(nr.payload);
      check.equal("NR claim_refs", decoded.claim_refs?.[0], claimId);
      check.equal("claim standing", claim.claim.standing, "draft_unverified");
    },
  },
  {
    fixture_id: "REF-OPS-122",
    title: "contradiction_refs coexistence (persisted + absent Contradiction)",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-005"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-122");
      const cid = "contradiction:ref-ops-122";
      await ops.registerContradictionUnit(
        contradictionInput(cid, [
          "claim:ref-ops-122-a",
          "claim:ref-ops-122-b",
        ]),
      );
      const nid = "negresult:ref-ops-122";
      const r = await ops.registerNegativeResultUnit(
        negativeResultInput(nid, {
          contradiction_refs: [cid, "contradiction:ref-ops-122-absent"],
        }),
        negativeResultRegistration("nrte:ref-ops-122"),
      );
      const related = r.unit.envelope.references.filter(
        (x) => x.role === "related_contradiction",
      );
      check.equal("contradiction_refs count", related.length, 2);
      check.equal("persisted contradiction", related[0]?.identity, cid);
    },
  },
  {
    fixture_id: "REF-OPS-123",
    title: "claim_refs absent from Persistence still registers",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-005"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-123");
      const r = await ops.registerNegativeResultUnit(
        negativeResultInput("negresult:ref-ops-123", {
          claim_refs: ["claim:ref-ops-123-absent"],
        }),
        negativeResultRegistration("nrte:ref-ops-123"),
      );
      check.equal("registered", r.negativeResult.record_state, "registered");
    },
  },
  {
    fixture_id: "REF-OPS-124",
    title: "transition revision_id rev:initial → OpsError",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "INVALID_COMMAND_STATE" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-124");
      const nid = "negresult:ref-ops-124";
      await ops.registerNegativeResultUnit(
        negativeResultInput(nid),
        negativeResultRegistration("nrte:ref-ops-124"),
      );
      await ops.transitionNegativeResultRecordState({
        identity: nid,
        revision_id: "rev:initial",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "withdrawn",
          authority_agent: OPS_HUMAN,
          reason: "bad",
          decision_ref: "decision:ref-ops-124",
          at: OPS_AT,
          event_id: "nrte:ref-ops-124-wd",
          withdrawal_reason: "x",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-125",
    title: "Immutability of rev:initial after withdraw",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-125");
      const nid = "negresult:ref-ops-125";
      const created = await ops.registerNegativeResultUnit(
        negativeResultInput(nid),
        negativeResultRegistration("nrte:ref-ops-125"),
      );
      const before = await ops.exportNegativeResultUnitRevision(nid, "rev:initial");
      await ops.transitionNegativeResultRecordState({
        identity: nid,
        revision_id: "rev:withdrawn-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "withdrawn",
          authority_agent: OPS_HUMAN,
          reason: "withdraw",
          decision_ref: "decision:ref-ops-125",
          at: OPS_AT,
          event_id: "nrte:ref-ops-125-wd",
          withdrawal_reason: "done",
        },
      });
      const after = await ops.exportNegativeResultUnitRevision(nid, "rev:initial");
      check.equal("rev:initial unchanged", after, before);
      check.equal(
        "created state still registered in initial",
        created.negativeResult.record_state,
        "registered",
      );
    },
  },
  {
    fixture_id: "REF-OPS-126",
    title: "Lineage lists both revisions with predecessor chain",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-126");
      const nid = "negresult:ref-ops-126";
      await ops.registerNegativeResultUnit(
        negativeResultInput(nid),
        negativeResultRegistration("nrte:ref-ops-126"),
      );
      await ops.transitionNegativeResultRecordState({
        identity: nid,
        revision_id: "rev:withdrawn-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "withdrawn",
          authority_agent: OPS_HUMAN,
          reason: "withdraw",
          decision_ref: "decision:ref-ops-126",
          at: OPS_AT,
          event_id: "nrte:ref-ops-126-wd",
          withdrawal_reason: "done",
        },
      });
      const lineage = await ops.getNegativeResultLineage(nid);
      check.equal("lineage length", lineage.length, 2);
      const initial = lineage.find((e) => e.revision_id === "rev:initial");
      const next = lineage.find((e) => e.revision_id === "rev:withdrawn-1");
      check.ok("has initial", initial !== undefined);
      check.equal("predecessor", next?.predecessor_revision_id, "rev:initial");
    },
  },
  {
    fixture_id: "REF-OPS-127",
    title: "Decode round-trip reconstructs content + refs + NRTE",
    scenario: "valid",
    authorities: ["OPS-001", "ENC-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-127");
      const nid = "negresult:ref-ops-127";
      const claim = "claim:ref-ops-127";
      await ops.registerNegativeResultUnit(
        negativeResultInput(nid, { claim_refs: [claim] }),
        negativeResultRegistration("nrte:ref-ops-127"),
      );
      await ops.transitionNegativeResultRecordState({
        identity: nid,
        revision_id: "rev:withdrawn-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "withdrawn",
          authority_agent: OPS_HUMAN,
          reason: "withdraw",
          decision_ref: "decision:ref-ops-127",
          at: OPS_AT,
          event_id: "nrte:ref-ops-127-wd",
          withdrawal_reason: "done",
        },
      });
      const entity = await ops.getNegativeResultUnit(nid);
      const decoded = negativeResultFromNegativeResultUnitPayload(entity.payload);
      check.equal("state", decoded.record_state, "withdrawn");
      check.equal("claim_refs", decoded.claim_refs?.[0], claim);
      check.equal("NRTE", decoded.record_transition_log?.length, 2);
      const encoder = new CanonicalEncoder();
      const reassembled = await encoder.assemble(decoded);
      check.equal("unit_kind", reassembled.envelope.unit_kind, "NegativeResultUnit");
      check.equal("intact", reassembled.intact, true);
    },
  },
  {
    fixture_id: "REF-OPS-128",
    title: "Explicit membership; create/transition do not auto-register",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-128");
      const nid = "negresult:ref-ops-128";
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-128",
      });
      await ops.registerNegativeResultUnit(
        negativeResultInput(nid),
        negativeResultRegistration("nrte:ref-ops-128"),
      );
      check.equal("no auto members", session.members().length, 0);
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        unit_kind: "NegativeResultUnit",
        identity: nid,
      });
      check.equal("member count", session.members().length, 1);
      check.equal("member identity", session.members()[0]?.identity, nid);
    },
  },
  {
    fixture_id: "REF-OPS-129",
    title: "Snapshots frozen shape; persistence contains NR revisions + head",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-129");
      const nid = "negresult:ref-ops-129";
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-129",
      });
      const ws = ops.openWorkspace({
        research_workspace_id: "workspace:ref-ops-129",
      });
      await ops.registerNegativeResultUnit(
        negativeResultInput(nid),
        negativeResultRegistration("nrte:ref-ops-129"),
      );
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        unit_kind: "NegativeResultUnit",
        identity: nid,
      });
      ops.registerWorkspaceMember(ws, {
        entity_kind: "CanonicalUnit",
        unit_kind: "NegativeResultUnit",
        identity: nid,
      });
      await ops.transitionNegativeResultRecordState({
        identity: nid,
        revision_id: "rev:withdrawn-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "withdrawn",
          authority_agent: OPS_HUMAN,
          reason: "REF-OPS-129",
          decision_ref: "decision:ref-ops-129",
          at: OPS_AT,
          event_id: "nrte:ref-ops-129-wd",
          withdrawal_reason: "done",
        },
      });
      const snap = await ops.snapshotView(session);
      check.equal(
        "session id shape",
        snap.research_session_id,
        "research:session:ref-ops-129",
      );
      const keys = snap.persistence_snapshot.entities.map((e) => e.storage_key);
      check.ok(
        "initial",
        keys.some((k) => k.includes("NegativeResultUnit") && k.includes(":rev:initial")),
      );
      check.ok(
        "successor",
        keys.some((k) => k.includes(":rev:withdrawn-1")),
      );
      check.ok(
        "head",
        keys.some((k) =>
          k.includes("persist:RevisionHead:NegativeResultUnit:"),
        ),
      );
      const wsnap = await ops.workspaceSnapshotView(ws);
      check.equal(
        "workspace id",
        wsnap.research_workspace_id,
        "workspace:ref-ops-129",
      );
    },
  },
  {
    fixture_id: "REF-OPS-130",
    title: "Operational event ops.negative_result_record_state_revision",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-130");
      const nid = "negresult:ref-ops-130";
      await ops.registerNegativeResultUnit(
        negativeResultInput(nid),
        negativeResultRegistration("nrte:ref-ops-130"),
      );
      await ops.transitionNegativeResultRecordState({
        identity: nid,
        revision_id: "rev:withdrawn-1",
        expected_head_revision_id: "rev:initial",
        append_event: true,
        transition: {
          to: "withdrawn",
          authority_agent: OPS_HUMAN,
          reason: "withdraw",
          decision_ref: "decision:ref-ops-130",
          at: OPS_AT,
          event_id: "nrte:ref-ops-130-wd",
          withdrawal_reason: "done",
        },
      });
      const events = await ops.getEvents(nid);
      const opsEvents = events.filter(
        (e) => e.event_type === "ops.negative_result_record_state_revision",
      );
      check.equal("ops event count", opsEvents.length, 1);
      check.equal("ops event_id", opsEvents[0]?.event_id, "ops:nrte:ref-ops-130-wd");
      const defaultOps = makeOps("persist-sess:ref-ops-130-default");
      await defaultOps.registerNegativeResultUnit(
        negativeResultInput("negresult:ref-ops-130-default"),
        negativeResultRegistration("nrte:ref-ops-130-default"),
      );
      await defaultOps.transitionNegativeResultRecordState({
        identity: "negresult:ref-ops-130-default",
        revision_id: "rev:withdrawn-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "withdrawn",
          authority_agent: OPS_HUMAN,
          reason: "withdraw",
          decision_ref: "decision:ref-ops-130-d",
          at: OPS_AT,
          event_id: "nrte:ref-ops-130-d-wd",
          withdrawal_reason: "done",
        },
      });
      const none = (
        await defaultOps.getEvents("negresult:ref-ops-130-default")
      ).filter((e) => e.event_type === "ops.negative_result_record_state_revision");
      check.equal("default no ops event", none.length, 0);
    },
  },
  {
    fixture_id: "REF-OPS-131",
    title: "Negative Result OPS does not create Persistence.Relationship entities",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-131");
      const nid = "negresult:ref-ops-131";
      await ops.registerNegativeResultUnit(
        negativeResultInput(nid, {
          claim_refs: ["claim:ref-ops-131"],
          evidence_refs: ["evidence:ref-ops-131"],
          contradiction_refs: ["contradiction:ref-ops-131"],
        }),
        negativeResultRegistration("nrte:ref-ops-131"),
      );
      await ops.transitionNegativeResultRecordState({
        identity: nid,
        revision_id: "rev:withdrawn-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "withdrawn",
          authority_agent: OPS_HUMAN,
          reason: "withdraw",
          decision_ref: "decision:ref-ops-131",
          at: OPS_AT,
          event_id: "nrte:ref-ops-131-wd",
          withdrawal_reason: "done",
        },
      });
      const listed = await ops.repository.list({
        filter: { entity_kind: "Relationship" },
      });
      check.equal("no Relationship entities", listed.total, 0);
    },
  },
  {
    fixture_id: "REF-OPS-132",
    title: "Deterministic Negative Result export double-run",
    scenario: "valid",
    authorities: ["OPS-001", "SER-JSON-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      async function run() {
        const ops = makeOps("persist-sess:ref-ops-132");
        const nid = "negresult:ref-ops-132";
        await ops.registerNegativeResultUnit(
          negativeResultInput(nid),
          negativeResultRegistration("nrte:ref-ops-132"),
        );
        await ops.transitionNegativeResultRecordState({
          identity: nid,
          revision_id: "rev:withdrawn-1",
          expected_head_revision_id: "rev:initial",
          transition: {
            to: "withdrawn",
            authority_agent: OPS_HUMAN,
            reason: "withdraw",
            decision_ref: "decision:ref-ops-132",
            at: OPS_AT,
            event_id: "nrte:ref-ops-132-wd",
            withdrawal_reason: "done",
          },
        });
        return ops.exportNegativeResultUnit(nid);
      }
      const a = await run();
      const b = await run();
      check.equal("deterministic export", a, b);
    },
  },
  {
    fixture_id: "REF-OPS-133",
    title: "Missing Negative Result transition propagates NOT_FOUND",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "NOT_FOUND" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-133");
      await ops.transitionNegativeResultRecordState({
        identity: "negresult:ref-ops-133-missing",
        revision_id: "rev:withdrawn-1",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "withdrawn",
          authority_agent: OPS_HUMAN,
          reason: "missing",
          decision_ref: "decision:ref-ops-133",
          at: OPS_AT,
          event_id: "nrte:ref-ops-133",
          withdrawal_reason: "x",
        },
      });
    },
  },
  {
    fixture_id: "REF-OPS-134",
    title: "Verification createPlanned → VerificationUnit rev:initial + head",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-006", "ENC-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-134");
      const vid = "verification:ref-ops-134";
      const claim = "claim:ref-ops-134";
      const r = await ops.registerVerificationUnit(
        verificationInput(vid, { claim_refs: [claim] }),
      );
      check.equal("record_state", r.verification.record_state, "planned");
      check.equal("outcome", r.verification.verification_outcome, "pending");
      check.equal("VTE count", r.verification.record_transition_log?.length ?? 0, 0);
      check.equal("unit_kind", r.unit.envelope.unit_kind, "VerificationUnit");
      check.equal("intact", r.unit.intact, true);
      check.equal("revision", r.entity.revision_id, "rev:initial");
      const claims = r.unit.envelope.references.filter(
        (x) => x.role === "verifies_claim",
      );
      check.equal("claim_refs", claims[0]?.identity, claim);
      const head = await ops.getVerificationHead(vid);
      check.equal("head", head.content_version, "rev:initial");
    },
  },
  {
    fixture_id: "REF-OPS-135",
    title: "ADM-T1 failure without claim/evidence/artifact rejects F6",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-006"],
    expectation: { outcome: "failure", failure_code: "F6" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-135");
      const { claim_refs: _omit, ...noTargets } = verificationInput(
        "verification:ref-ops-135",
      );
      await ops.registerVerificationUnit(noTargets);
    },
  },
  {
    fixture_id: "REF-OPS-136",
    title: "Bad verification_id rejects Core F1",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-006"],
    expectation: { outcome: "failure", failure_code: "F1" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-136");
      await ops.registerVerificationUnit(
        verificationInput("not-a-verification-id"),
      );
    },
  },
  {
    fixture_id: "REF-OPS-137",
    title: "Empty protocol_ref rejects Core F2",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-006"],
    expectation: { outcome: "failure", failure_code: "F2" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-137");
      await ops.registerVerificationUnit(
        verificationInput("verification:ref-ops-137", { protocol_ref: "  " }),
      );
    },
  },
  {
    fixture_id: "REF-OPS-138",
    title: "Invalid verification_method rejects Core F3",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-006"],
    expectation: { outcome: "failure", failure_code: "F3" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-138");
      await ops.registerVerificationUnit(
        verificationInput("verification:ref-ops-138", {
          verification_method: "not-a-method" as "reproduction",
        }),
      );
    },
  },
  {
    fixture_id: "REF-OPS-139",
    title: "Duplicate Verification create rejects ALREADY_EXISTS",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "ALREADY_EXISTS" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-139");
      const vid = "verification:ref-ops-139";
      await ops.registerVerificationUnit(verificationInput(vid));
      await ops.registerVerificationUnit(verificationInput(vid));
    },
  },
  {
    fixture_id: "REF-OPS-140",
    title: "registerVerificationUnit non-initial revision_id → OpsError",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "INVALID_COMMAND_STATE" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-140");
      await ops.registerVerificationUnit(
        verificationInput("verification:ref-ops-140"),
        { revision_id: "rev:not-initial" },
      );
    },
  },
  {
    fixture_id: "REF-OPS-141",
    title: "Leave-planned Human → passed + successor revision + head",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-006", "ENC-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-141");
      const vid = "verification:ref-ops-141";
      await ops.registerVerificationUnit(verificationInput(vid));
      const r = await ops.transitionVerificationRecordState({
        identity: vid,
        revision_id: "rev:passed-1",
        expected_head_revision_id: "rev:initial",
        transition: verificationLeavePlanned("passed", "vte:ref-ops-141"),
      });
      check.equal("record_state", r.verification.record_state, "passed");
      check.equal("outcome", r.verification.verification_outcome, "passed");
      check.equal("head", r.head_revision_id, "rev:passed-1");
      check.equal("predecessor", r.entity.predecessor_revision_id, "rev:initial");
      check.equal("VTE count", r.verification.record_transition_log?.length ?? 0, 1);
    },
  },
  {
    fixture_id: "REF-OPS-142",
    title: "Leave-planned Human → failed with outcome coupling",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-006"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-142");
      const vid = "verification:ref-ops-142";
      await ops.registerVerificationUnit(verificationInput(vid));
      const r = await ops.transitionVerificationRecordState({
        identity: vid,
        revision_id: "rev:failed-1",
        expected_head_revision_id: "rev:initial",
        transition: verificationLeavePlanned("failed", "vte:ref-ops-142"),
      });
      check.equal("record_state", r.verification.record_state, "failed");
      check.equal("outcome", r.verification.verification_outcome, "failed");
    },
  },
  {
    fixture_id: "REF-OPS-143",
    title: "Leave-planned Human → inconclusive with outcome coupling",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-006"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-143");
      const vid = "verification:ref-ops-143";
      await ops.registerVerificationUnit(verificationInput(vid));
      const r = await ops.transitionVerificationRecordState({
        identity: vid,
        revision_id: "rev:inconclusive-1",
        expected_head_revision_id: "rev:initial",
        transition: verificationLeavePlanned("inconclusive", "vte:ref-ops-143"),
      });
      check.equal("record_state", r.verification.record_state, "inconclusive");
      check.equal("outcome", r.verification.verification_outcome, "inconclusive");
    },
  },
  {
    fixture_id: "REF-OPS-144",
    title: "AI leave-planned rejects Core F7; head unchanged",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-006"],
    expectation: { outcome: "failure", failure_code: "F7" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-144");
      const vid = "verification:ref-ops-144";
      await ops.registerVerificationUnit(verificationInput(vid));
      await ops.transitionVerificationRecordState({
        identity: vid,
        revision_id: "rev:passed-1",
        expected_head_revision_id: "rev:initial",
        transition: verificationLeavePlanned("passed", "vte:ref-ops-144", {
          authority_agent: "ai:ref-ops-144",
        }),
      });
    },
  },
  {
    fixture_id: "REF-OPS-145",
    title: "Missing decision_ref on leave-planned rejects F_TRANSITION",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-006"],
    expectation: { outcome: "failure", failure_code: "F_TRANSITION" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-145");
      const vid = "verification:ref-ops-145";
      await ops.registerVerificationUnit(verificationInput(vid));
      await ops.transitionVerificationRecordState({
        identity: vid,
        revision_id: "rev:passed-1",
        expected_head_revision_id: "rev:initial",
        transition: verificationLeavePlanned("passed", "vte:ref-ops-145", {
          decision_ref: "  ",
        }),
      });
    },
  },
  {
    fixture_id: "REF-OPS-146",
    title: "Terminal passed re-transition rejects F_TRANSITION",
    scenario: "invalid",
    authorities: ["OPS-001", "SCI-006"],
    expectation: { outcome: "failure", failure_code: "F_TRANSITION" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-146");
      const vid = "verification:ref-ops-146";
      await ops.registerVerificationUnit(verificationInput(vid));
      await ops.transitionVerificationRecordState({
        identity: vid,
        revision_id: "rev:passed-1",
        expected_head_revision_id: "rev:initial",
        transition: verificationLeavePlanned("passed", "vte:ref-ops-146-a"),
      });
      await ops.transitionVerificationRecordState({
        identity: vid,
        revision_id: "rev:passed-2",
        expected_head_revision_id: "rev:passed-1",
        transition: verificationLeavePlanned("failed", "vte:ref-ops-146-b"),
      });
    },
  },
  {
    fixture_id: "REF-OPS-147",
    title: "Stale head CAS while still planned rejects CONFLICT",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "CONFLICT" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-147");
      const vid = "verification:ref-ops-147";
      await ops.registerVerificationUnit(verificationInput(vid));
      await ops.transitionVerificationRecordState({
        identity: vid,
        revision_id: "rev:stale",
        expected_head_revision_id: "rev:not-current",
        transition: verificationLeavePlanned("passed", "vte:ref-ops-147"),
      });
    },
  },
  {
    fixture_id: "REF-OPS-148",
    title: "Duplicate revision_id rejects ALREADY_EXISTS",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "ALREADY_EXISTS" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-148");
      const vid = "verification:ref-ops-148";
      const created = await ops.registerVerificationUnit(verificationInput(vid));
      await ops.repository.create(
        entityFromCanonicalUnit(created.unit, {
          revision_id: "rev:dup",
          predecessor_revision_id: "rev:initial",
        }),
      );
      await ops.transitionVerificationRecordState({
        identity: vid,
        revision_id: "rev:dup",
        expected_head_revision_id: "rev:initial",
        transition: verificationLeavePlanned("passed", "vte:ref-ops-148"),
      });
    },
  },
  {
    fixture_id: "REF-OPS-149",
    title: "transition revision_id rev:initial → OpsError",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "INVALID_COMMAND_STATE" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-149");
      const vid = "verification:ref-ops-149";
      await ops.registerVerificationUnit(verificationInput(vid));
      await ops.transitionVerificationRecordState({
        identity: vid,
        revision_id: "rev:initial",
        expected_head_revision_id: "rev:initial",
        transition: verificationLeavePlanned("passed", "vte:ref-ops-149"),
      });
    },
  },
  {
    fixture_id: "REF-OPS-150",
    title: "Immutability of rev:initial after leave-planned",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-150");
      const vid = "verification:ref-ops-150";
      const created = await ops.registerVerificationUnit(verificationInput(vid));
      await ops.transitionVerificationRecordState({
        identity: vid,
        revision_id: "rev:passed-1",
        expected_head_revision_id: "rev:initial",
        transition: verificationLeavePlanned("passed", "vte:ref-ops-150"),
      });
      const initial = await ops.getVerificationUnitRevision(vid, "rev:initial");
      check.equal("initial_rev", initial.revision_id, "rev:initial");
      const decoded = verificationFromVerificationUnitPayload(initial.payload);
      check.equal("still_planned", decoded.record_state, "planned");
      check.equal(
        "payload_stable",
        stableStringify(initial.payload),
        stableStringify(created.entity.payload),
      );
    },
  },
  {
    fixture_id: "REF-OPS-151",
    title: "Lineage lists both revisions with predecessor chain",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-151");
      const vid = "verification:ref-ops-151";
      await ops.registerVerificationUnit(verificationInput(vid));
      await ops.transitionVerificationRecordState({
        identity: vid,
        revision_id: "rev:passed-1",
        expected_head_revision_id: "rev:initial",
        transition: verificationLeavePlanned("passed", "vte:ref-ops-151"),
      });
      const lineage = await ops.getVerificationLineage(vid);
      check.equal("lineage_len", lineage.length, 2);
      const successor = lineage.find((e) => e.revision_id === "rev:passed-1");
      check.equal("predecessor", successor?.predecessor_revision_id, "rev:initial");
    },
  },
  {
    fixture_id: "REF-OPS-152",
    title: "Decode round-trip reconstructs content + refs + VTE + artifact_ref",
    scenario: "valid",
    authorities: ["OPS-001", "ENC-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-152");
      const vid = "verification:ref-ops-152";
      const claim = "claim:ref-ops-152";
      const artifact = "artifact:ref-ops-152-opaque";
      await ops.registerVerificationUnit(
        verificationInput(vid, {
          claim_refs: [claim],
          artifact_ref: artifact,
        }),
      );
      await ops.transitionVerificationRecordState({
        identity: vid,
        revision_id: "rev:passed-1",
        expected_head_revision_id: "rev:initial",
        transition: verificationLeavePlanned("passed", "vte:ref-ops-152"),
      });
      const entity = await ops.getVerificationUnit(vid);
      const decoded = verificationFromVerificationUnitPayload(entity.payload);
      check.equal("state", decoded.record_state, "passed");
      check.equal("outcome", decoded.verification_outcome, "passed");
      check.equal("claim", decoded.claim_refs?.[0], claim);
      check.equal("artifact_ref", decoded.artifact_ref, artifact);
      check.equal("VTE", decoded.record_transition_log?.length ?? 0, 1);
    },
  },
  {
    fixture_id: "REF-OPS-153",
    title: "Explicit membership; create/transition do not auto-register",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-153");
      const vid = "verification:ref-ops-153";
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-153",
      });
      await ops.registerVerificationUnit(verificationInput(vid));
      check.equal("no auto members", session.members().length, 0);
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        unit_kind: "VerificationUnit",
        identity: vid,
      });
      check.equal("member count", session.members().length, 1);
      check.equal("member identity", session.members()[0]?.identity, vid);
      await ops.transitionVerificationRecordState({
        identity: vid,
        revision_id: "rev:passed-1",
        expected_head_revision_id: "rev:initial",
        transition: verificationLeavePlanned("passed", "vte:ref-ops-153"),
      });
      check.equal("members after transition", session.members().length, 1);
    },
  },
  {
    fixture_id: "REF-OPS-154",
    title: "Snapshots frozen shape; persistence contains Verification revisions + head",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-154");
      const vid = "verification:ref-ops-154";
      const session = ops.openSession({
        research_session_id: "research:session:ref-ops-154",
      });
      const ws = ops.openWorkspace({
        research_workspace_id: "workspace:ref-ops-154",
      });
      await ops.registerVerificationUnit(verificationInput(vid));
      ops.registerMember(session, {
        entity_kind: "CanonicalUnit",
        unit_kind: "VerificationUnit",
        identity: vid,
      });
      ops.registerWorkspaceMember(ws, {
        entity_kind: "CanonicalUnit",
        unit_kind: "VerificationUnit",
        identity: vid,
      });
      await ops.transitionVerificationRecordState({
        identity: vid,
        revision_id: "rev:passed-1",
        expected_head_revision_id: "rev:initial",
        transition: verificationLeavePlanned("passed", "vte:ref-ops-154"),
      });
      const snap = await ops.snapshotView(session);
      check.equal(
        "session id shape",
        snap.research_session_id,
        "research:session:ref-ops-154",
      );
      const keys = snap.persistence_snapshot.entities.map((e) => e.storage_key);
      check.ok(
        "initial",
        keys.some((k) => k.includes("VerificationUnit") && k.includes(":rev:initial")),
      );
      check.ok(
        "successor",
        keys.some((k) => k.includes(":rev:passed-1")),
      );
      check.ok(
        "head",
        keys.some((k) =>
          k.includes("persist:RevisionHead:VerificationUnit:"),
        ),
      );
      const wsnap = await ops.workspaceSnapshotView(ws);
      check.equal(
        "workspace id",
        wsnap.research_workspace_id,
        "workspace:ref-ops-154",
      );
    },
  },
  {
    fixture_id: "REF-OPS-155",
    title: "Operational event ops.verification_record_state_revision",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-155");
      const vid = "verification:ref-ops-155";
      await ops.registerVerificationUnit(verificationInput(vid));
      await ops.transitionVerificationRecordState({
        identity: vid,
        revision_id: "rev:passed-1",
        expected_head_revision_id: "rev:initial",
        append_event: true,
        transition: verificationLeavePlanned("passed", "vte:ref-ops-155"),
      });
      const events = await ops.getEvents(vid);
      const opsEvents = events.filter(
        (e) => e.event_type === "ops.verification_record_state_revision",
      );
      check.equal("ops event count", opsEvents.length, 1);
      check.equal("ops event_id", opsEvents[0]?.event_id, "ops:vte:ref-ops-155");
      const defaultOps = makeOps("persist-sess:ref-ops-155-default");
      await defaultOps.registerVerificationUnit(
        verificationInput("verification:ref-ops-155-default"),
      );
      await defaultOps.transitionVerificationRecordState({
        identity: "verification:ref-ops-155-default",
        revision_id: "rev:passed-1",
        expected_head_revision_id: "rev:initial",
        transition: verificationLeavePlanned("passed", "vte:ref-ops-155-d"),
      });
      const none = (
        await defaultOps.getEvents("verification:ref-ops-155-default")
      ).filter((e) => e.event_type === "ops.verification_record_state_revision");
      check.equal("default no ops event", none.length, 0);
    },
  },
  {
    fixture_id: "REF-OPS-156",
    title: "Verification OPS does not create Persistence.Relationship entities",
    scenario: "valid",
    authorities: ["OPS-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-156");
      const vid = "verification:ref-ops-156";
      await ops.registerVerificationUnit(
        verificationInput(vid, {
          claim_refs: ["claim:ref-ops-156"],
          evidence_refs: ["evidence:ref-ops-156"],
          contradiction_refs: ["contradiction:ref-ops-156"],
          negative_result_refs: ["negresult:ref-ops-156"],
        }),
      );
      await ops.transitionVerificationRecordState({
        identity: vid,
        revision_id: "rev:passed-1",
        expected_head_revision_id: "rev:initial",
        transition: verificationLeavePlanned("passed", "vte:ref-ops-156"),
      });
      const listed = await ops.repository.list({
        filter: { entity_kind: "Relationship" },
      });
      check.equal("no_relationships", listed.total, 0);
    },
  },
  {
    fixture_id: "REF-OPS-157",
    title: "Deterministic Verification export double-run",
    scenario: "valid",
    authorities: ["OPS-001", "SER-JSON-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      async function run() {
        const ops = makeOps("persist-sess:ref-ops-157");
        const vid = "verification:ref-ops-157";
        await ops.registerVerificationUnit(verificationInput(vid));
        await ops.transitionVerificationRecordState({
          identity: vid,
          revision_id: "rev:passed-1",
          expected_head_revision_id: "rev:initial",
          transition: verificationLeavePlanned("passed", "vte:ref-ops-157"),
        });
        return ops.exportVerificationUnit(vid);
      }
      const a = await run();
      const b = await run();
      check.equal("deterministic export", a, b);
    },
  },
  {
    fixture_id: "REF-OPS-158",
    title: "Claim.verified_via coexistence with persisted Verification",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-001", "SCI-006"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-158");
      const vid = "verification:ref-ops-158";
      const claimId = "claim:ref-ops-158";
      await ops.registerVerificationUnit(
        verificationInput(vid, { claim_refs: [claimId] }),
      );
      const claim = await ops.registerClaimUnit({
        ...claimInput(claimId),
        verified_via: [vid],
      });
      check.equal("verified_via", claim.claim.verified_via?.[0], vid);
    },
  },
  {
    fixture_id: "REF-OPS-159",
    title: "NR + Contradiction optional refs coexistence",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-006"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-159");
      const cid = "contradiction:ref-ops-159";
      const nid = "negresult:ref-ops-159";
      const claimA = "claim:ref-ops-159-a";
      const claimB = "claim:ref-ops-159-b";
      await ops.registerContradictionUnit(
        contradictionInput(cid, [claimA, claimB]),
      );
      await ops.registerNegativeResultUnit(
        negativeResultInput(nid, { claim_refs: [claimA] }),
        negativeResultRegistration("nrte:ref-ops-159"),
      );
      const r = await ops.registerVerificationUnit(
        verificationInput("verification:ref-ops-159", {
          claim_refs: [claimA],
          contradiction_refs: [cid],
          negative_result_refs: [nid],
        }),
      );
      const contra = r.unit.envelope.references.filter(
        (x) => x.role === "related_contradiction",
      );
      const nrs = r.unit.envelope.references.filter(
        (x) => x.role === "related_negative_result",
      );
      check.equal("contradiction_ref", contra[0]?.identity, cid);
      check.equal("nr_ref", nrs[0]?.identity, nid);
    },
  },
  {
    fixture_id: "REF-OPS-160",
    title: "claim_refs absent from Persistence still registers",
    scenario: "valid",
    authorities: ["OPS-001", "SCI-006"],
    expectation: { outcome: "success" },
    async execute(check) {
      const ops = makeOps("persist-sess:ref-ops-160");
      const r = await ops.registerVerificationUnit(
        verificationInput("verification:ref-ops-160", {
          claim_refs: ["claim:ref-ops-160-absent"],
        }),
      );
      check.equal("state", r.verification.record_state, "planned");
      check.equal(
        "claim_ref",
        r.verification.claim_refs?.[0],
        "claim:ref-ops-160-absent",
      );
    },
  },
  {
    fixture_id: "REF-OPS-161",
    title: "Missing Verification transition propagates NOT_FOUND",
    scenario: "invalid",
    authorities: ["OPS-001"],
    expectation: { outcome: "failure", failure_code: "NOT_FOUND" },
    async execute() {
      const ops = makeOps("persist-sess:ref-ops-161");
      await ops.transitionVerificationRecordState({
        identity: "verification:ref-ops-161-missing",
        revision_id: "rev:passed-1",
        expected_head_revision_id: "rev:initial",
        transition: verificationLeavePlanned("passed", "vte:ref-ops-161"),
      });
    },
  },
]);


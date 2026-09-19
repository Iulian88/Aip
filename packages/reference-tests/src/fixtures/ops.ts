/**
 * REF-TEST-002 — REF-OPS fixtures (Sprint 017 / SPEC-017).
 * Executable evidence for Research Operations via ReferenceRunner.
 * Authorities cite OPS-001 (+ Core/ENC/SER as exercised). No PERSIST-001.
 */
import { OpsError, referenceAppMarker } from "@sciros/reference-app";
import { PersistenceError } from "@sciros/persistence";
import { stableStringify } from "@sciros/serialization";
import type { ReferenceFixture } from "../types.js";
import { claimInput, makeOps, OPS_AT, OPS_HUMAN } from "./ops-support.js";

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
]);


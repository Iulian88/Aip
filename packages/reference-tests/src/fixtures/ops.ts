/**
 * REF-TEST-002 — REF-OPS fixtures (Sprint 017 / SPEC-017).
 * Executable evidence for Research Operations via ReferenceRunner.
 * Authorities cite OPS-001 (+ Core/ENC/SER as exercised). No PERSIST-001.
 */
import { OpsError, referenceAppMarker, claimFromClaimUnitPayload } from "@sciros/reference-app";
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
  evidenceInput,
  makeOps,
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
]);


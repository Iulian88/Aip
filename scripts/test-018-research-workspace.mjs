/**
 * EXEC-SPRINT-018 — ResearchWorkspace Foundation tests (SPEC-018).
 */
import assert from "node:assert/strict";
import { createMemoryPersistenceSession } from "../packages/persistence/dist/index.js";
import { stableStringify } from "../packages/serialization/dist/index.js";
import {
  OpsError,
  ResearchSession,
  ResearchWorkspace,
  createResearchOperations,
  referenceAppMarker,
} from "../apps/reference-app/dist/index.js";

const AT = "2026-09-19T12:00:00Z";
const HUMAN = "human:ops018-test";
const SCOPE = {
  domain_context: "assay",
  bounds: "cohort T018",
  exclusions: "none",
};

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log("PASS " + name);
  } catch (e) {
    failed += 1;
    console.error("FAIL " + name, e);
  }
}

await test("T018-001 ResearchWorkspace.open caller-supplied id", () => {
  const ws = ResearchWorkspace.open({ research_workspace_id: "workspace:t1" });
  assert.equal(ws.research_workspace_id, "workspace:t1");
});

await test("T018-002 empty workspace id rejected", () => {
  assert.throws(
    () => ResearchWorkspace.open({ research_workspace_id: "  " }),
    (e) => e instanceof OpsError && e.code === "INVALID_WORKSPACE",
  );
});

await test("T018-003 orphan session has no workspace", () => {
  const s = ResearchSession.open({ research_session_id: "research:orphan" });
  assert.equal(s.research_workspace_id, undefined);
});

await test("T018-004 bind session and membership upsert", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist:t4"));
  const ws = ops.openWorkspace({ research_workspace_id: "workspace:t4" });
  const s = ops.openSession({ research_session_id: "research:t4" });
  ops.bindSession(ws, s);
  assert.equal(s.research_workspace_id, "workspace:t4");
  await ops.registerClaimUnit({
    claim_id: "claim:t4",
    proposition: "workspace membership",
    scope: SCOPE,
    created_by: HUMAN,
    created_at: AT,
  });
  ops.registerMember(s, {
    entity_kind: "CanonicalUnit",
    identity: "claim:t4",
    unit_kind: "ClaimUnit",
  });
  assert.equal(s.members().length, 1);
  assert.equal(ws.members().length, 1);
  assert.equal(ws.members()[0].identity, "claim:t4");
});

await test("T018-005 dual bind rejected", () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist:t5"));
  const a = ops.openWorkspace({ research_workspace_id: "workspace:t5a" });
  const b = ops.openWorkspace({ research_workspace_id: "workspace:t5b" });
  const s = ops.openSession({ research_session_id: "research:t5" });
  ops.bindSession(a, s);
  assert.throws(
    () => ops.bindSession(b, s),
    (e) => e instanceof OpsError && e.code === "INVALID_WORKSPACE",
  );
});

await test("T018-006 WorkspaceSnapshot additive + ResearchSnapshot frozen", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist:t6"));
  const ws = ops.openWorkspace({ research_workspace_id: "workspace:t6" });
  const s = ops.openSession({ research_session_id: "research:t6" });
  ops.bindSession(ws, s);
  await ops.registerClaimUnit({
    claim_id: "claim:t6",
    proposition: "snapshot",
    scope: SCOPE,
    created_by: HUMAN,
    created_at: AT,
  });
  ops.registerMember(s, {
    entity_kind: "CanonicalUnit",
    identity: "claim:t6",
    unit_kind: "ClaimUnit",
  });
  const wsSnap = await ops.workspaceSnapshotView(ws);
  const sessSnap = await ops.snapshotView(s);
  assert.equal(wsSnap.research_workspace_id, "workspace:t6");
  assert.ok(Array.isArray(wsSnap.bound_session_ids));
  assert.equal("research_workspace_id" in sessSnap, false);
  assert.equal(sessSnap.research_session_id, "research:t6");
  const again = await ops.workspaceSnapshotView(ws);
  assert.equal(
    stableStringify({
      id: wsSnap.research_workspace_id,
      m: wsSnap.member_refs,
      s: wsSnap.bound_session_ids,
    }),
    stableStringify({
      id: again.research_workspace_id,
      m: again.member_refs,
      s: again.bound_session_ids,
    }),
  );
});

await test("T018-007 explicit workspace membership", () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist:t7"));
  const ws = ops.openWorkspace({ research_workspace_id: "workspace:t7" });
  ops.registerWorkspaceMember(ws, {
    entity_kind: "CanonicalUnit",
    identity: "claim:t7-explicit",
    unit_kind: "ClaimUnit",
  });
  assert.equal(ws.members().length, 1);
});

await test("T018-008 duplicate workspace open rejected", () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist:t8"));
  ops.openWorkspace({ research_workspace_id: "workspace:t8" });
  assert.throws(
    () => ops.openWorkspace({ research_workspace_id: "workspace:t8" }),
    (e) => e instanceof OpsError && e.code === "INVALID_WORKSPACE",
  );
});

await test("T018-009 marker workspace not persisted", () => {
  assert.equal(referenceAppMarker.researchWorkspacePersisted, false);
  assert.equal(referenceAppMarker.researchSessionPersisted, false);
});

await test("T018-010 ids distinct", () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist:t10"));
  const ws = ops.openWorkspace({ research_workspace_id: "workspace:t10" });
  const s = ops.openSession({ research_session_id: "research:t10" });
  assert.notEqual(ws.research_workspace_id, ops.persistenceSessionId);
  assert.notEqual(s.research_session_id, ops.persistenceSessionId);
  assert.notEqual(ws.research_workspace_id, s.research_session_id);
});

console.log(`TEST-018 summary: passed=${passed} failed=${failed}`);
if (failed > 0) process.exit(1);
console.log("TEST_018_PASS");

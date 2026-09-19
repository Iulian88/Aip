/**
 * EXEC-SPRINT-019 — Evidence Operations tests (SPEC-019).
 */
import assert from "node:assert/strict";
import { EvidenceValidationError } from "../packages/core/dist/index.js";
import { PersistenceError, createMemoryPersistenceSession } from "../packages/persistence/dist/index.js";
import {
  OpsError,
  createResearchOperations,
  referenceAppMarker,
} from "../apps/reference-app/dist/index.js";

const AT = "2026-09-19T12:00:00Z";
const HUMAN = "human:ops019-test";

const EVIDENCE_BASE = {
  summary: "Evidence OPS test",
  source: {
    source_class: "laboratory",
    source_locator: "lab://assay/t019",
    source_state: "declared",
  },
  provenance: {
    completeness: "complete",
    obtained_at: AT,
    transform_summary: "none",
    custody_agent: HUMAN,
  },
  created_by: HUMAN,
  created_at: AT,
  items: [{ item_id: "eitem:t019", content_summary: "obs", item_state: "active" }],
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

await test("T019-001 registerEvidenceUnit draft create-once", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist:t019-1"));
  const { evidence, unit, entity } = await ops.registerEvidenceUnit({
    ...EVIDENCE_BASE,
    evidence_id: "evidence:t019-1",
    items: [{ item_id: "eitem:t019-1", content_summary: "obs", item_state: "active" }],
  });
  assert.equal(evidence.record_state, "draft");
  assert.equal(unit.envelope.unit_kind, "EvidenceUnit");
  assert.equal(entity.identity, "evidence:t019-1");
});

await test("T019-002 getEvidenceUnit + exportEvidenceUnit", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist:t019-2"));
  await ops.registerEvidenceUnit({
    ...EVIDENCE_BASE,
    evidence_id: "evidence:t019-2",
    items: [{ item_id: "eitem:t019-2", content_summary: "obs", item_state: "active" }],
  });
  const stored = await ops.getEvidenceUnit("evidence:t019-2");
  assert.equal(stored.identity, "evidence:t019-2");
  const json = await ops.exportEvidenceUnit("evidence:t019-2");
  assert.ok(json.length > 0);
});

await test("T019-003 orphan membership EvidenceUnit", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist:t019-3"));
  const s = ops.openSession({ research_session_id: "research:t019-3" });
  await ops.registerEvidenceUnit({
    ...EVIDENCE_BASE,
    evidence_id: "evidence:t019-3",
    items: [{ item_id: "eitem:t019-3", content_summary: "obs", item_state: "active" }],
  });
  ops.registerMember(s, {
    entity_kind: "CanonicalUnit",
    identity: "evidence:t019-3",
    unit_kind: "EvidenceUnit",
  });
  assert.equal(s.members().length, 1);
  assert.equal(s.research_workspace_id, undefined);
});

await test("T019-004 bound workspace upsert", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist:t019-4"));
  const ws = ops.openWorkspace({ research_workspace_id: "workspace:t019-4" });
  const s = ops.openSession({ research_session_id: "research:t019-4" });
  ops.bindSession(ws, s);
  await ops.registerEvidenceUnit({
    ...EVIDENCE_BASE,
    evidence_id: "evidence:t019-4",
    items: [{ item_id: "eitem:t019-4", content_summary: "obs", item_state: "active" }],
  });
  ops.registerMember(s, {
    entity_kind: "CanonicalUnit",
    identity: "evidence:t019-4",
    unit_kind: "EvidenceUnit",
  });
  assert.equal(ws.members().length, 1);
});

await test("T019-005 ResearchSnapshot frozen keys", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist:t019-5"));
  const s = ops.openSession({ research_session_id: "research:t019-5" });
  await ops.registerEvidenceUnit({
    ...EVIDENCE_BASE,
    evidence_id: "evidence:t019-5",
    items: [{ item_id: "eitem:t019-5", content_summary: "obs", item_state: "active" }],
  });
  ops.registerMember(s, {
    entity_kind: "CanonicalUnit",
    identity: "evidence:t019-5",
    unit_kind: "EvidenceUnit",
  });
  const snap = await ops.snapshotView(s);
  assert.equal(
    Object.keys(snap).sort().join(","),
    "member_refs,persistence_snapshot,research_session_id",
  );
});

await test("T019-006 bears_on independent of supported_by", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist:t019-6"));
  const { claim } = await ops.registerClaimUnit({
    claim_id: "claim:t019-6",
    proposition: "claim",
    scope: { domain_context: "assay", bounds: "b", exclusions: "none" },
    created_by: HUMAN,
    created_at: AT,
  });
  const { evidence } = await ops.registerEvidenceUnit({
    ...EVIDENCE_BASE,
    evidence_id: "evidence:t019-6",
    items: [{ item_id: "eitem:t019-6", content_summary: "obs", item_state: "active" }],
    bears_on: ["claim:t019-6"],
  });
  assert.equal(evidence.bears_on?.[0], "claim:t019-6");
  assert.ok(claim.supported_by === undefined || claim.supported_by.length === 0);
});

await test("T019-007 EvidenceValidationError not wrapped", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist:t019-7"));
  await assert.rejects(
    () =>
      ops.registerEvidenceUnit({
        ...EVIDENCE_BASE,
        evidence_id: "evidence:t019-7",
        source: {
          source_class: "laboratory",
          source_locator: "  ",
          source_state: "declared",
        },
        items: [{ item_id: "eitem:t019-7", content_summary: "obs", item_state: "active" }],
      }),
    (e) => e instanceof EvidenceValidationError && !(e instanceof OpsError),
  );
});

await test("T019-008 PersistenceError on missing get", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist:t019-8"));
  await assert.rejects(
    () => ops.getEvidenceUnit("evidence:missing-t019"),
    (e) => e instanceof PersistenceError && e.code === "NOT_FOUND",
  );
});

await test("T019-009 deterministic double-run export", async () => {
  async function run() {
    const ops = createResearchOperations(createMemoryPersistenceSession("persist:t019-9"));
    await ops.registerEvidenceUnit({
      ...EVIDENCE_BASE,
      evidence_id: "evidence:t019-9",
      items: [{ item_id: "eitem:t019-9", content_summary: "obs", item_state: "active" }],
    });
    return ops.exportEvidenceUnit("evidence:t019-9");
  }
  assert.equal(await run(), await run());
});

await test("T019-010 marker sprint 19", () => {
  assert.equal(referenceAppMarker.sprint, 19);
  assert.equal(referenceAppMarker.secondEventJournal, false);
});

console.log(`TEST-019 summary: passed=${passed} failed=${failed}`);
if (failed > 0) process.exit(1);
console.log("TEST_019_PASS");

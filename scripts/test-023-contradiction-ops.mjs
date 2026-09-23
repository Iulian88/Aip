/**
 * EXEC-023 focused tests — Contradiction OPS under Model C.
 * Run after build: node scripts/test-023-contradiction-ops.mjs
 */
import assert from "node:assert/strict";
import {
  ContradictionValidationError,
} from "../packages/core/dist/index.js";
import {
  INITIAL_REVISION_ID,
  PersistenceError,
  createMemoryPersistenceSession,
  makeCanonicalUnitRevisionStorageKey,
} from "../packages/persistence/dist/index.js";
import {
  contradictionFromContradictionUnitPayload,
  createResearchOperations,
} from "../apps/reference-app/dist/index.js";

const AT = "2026-09-23T12:00:00Z";
const HUMAN = "human:ops023-test";

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

function contradictionInput(id, claims, overrides = {}) {
  return {
    contradiction_id: id,
    summary: "Sprint 023 test contradiction",
    involved_claims: claims,
    overlap_statement: "overlapping scope",
    incompatibility_statement: "mutually exclusive under bounds",
    provenance: {
      completeness: "complete",
      recorded_at: AT,
      custody_agent: HUMAN,
      method_summary: "test",
    },
    created_by: HUMAN,
    created_at: AT,
    ...overrides,
  };
}

await test("T023-001 registerContradictionUnit createOpen path", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t023-001"));
  const id = "contradiction:t023-001";
  const r = await ops.registerContradictionUnit(
    contradictionInput(id, ["claim:t023-001-a", "claim:t023-001-b"], {
      evidence_refs: ["evidence:t023-001"],
    }),
  );
  assert.equal(r.contradiction.record_state, "open");
  assert.equal(r.unit.envelope.unit_kind, "ContradictionUnit");
  assert.equal(r.entity.revision_id, INITIAL_REVISION_ID);
  assert.equal(
    r.unit.envelope.references.filter((x) => x.role === "involves").length,
    2,
  );
  const head = await ops.getContradictionHead(id);
  assert.equal(head.content_version, INITIAL_REVISION_ID);
});

await test("T023-002 transition + lineage + decode", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t023-002"));
  const id = "contradiction:t023-002";
  await ops.registerContradictionUnit(
    contradictionInput(id, ["claim:t023-002-a", "claim:t023-002-b"]),
  );
  const r = await ops.transitionContradictionRecordState({
    identity: id,
    revision_id: "rev:resolved-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    transition: {
      to: "resolved_by_scope_split",
      authority_agent: HUMAN,
      reason: "t023-002",
      decision_ref: "decision:t023-002",
      at: AT,
      event_id: "crte:t023-002",
      resolution_note: "split",
    },
  });
  assert.equal(r.head_revision_id, "rev:resolved-1");
  assert.equal(r.entity.predecessor_revision_id, INITIAL_REVISION_ID);
  const decoded = contradictionFromContradictionUnitPayload(r.entity.payload);
  assert.equal(decoded.record_state, "resolved_by_scope_split");
  const lineage = await ops.getContradictionLineage(id);
  assert.equal(lineage.length, 2);
});

await test("T023-003 Core F6 AI leave-open; head unchanged", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t023-003"));
  const id = "contradiction:t023-003";
  await ops.registerContradictionUnit(
    contradictionInput(id, ["claim:t023-003-a", "claim:t023-003-b"]),
  );
  let threw = false;
  try {
    await ops.transitionContradictionRecordState({
      identity: id,
      revision_id: "rev:ai",
      expected_head_revision_id: INITIAL_REVISION_ID,
      transition: {
        to: "resolved_by_scope_split",
        authority_agent: "ai:t023",
        reason: "ai",
        decision_ref: "decision:t023-003",
        at: AT,
        event_id: "crte:t023-003",
        resolution_note: "no",
      },
    });
  } catch (e) {
    threw = true;
    assert.ok(e instanceof ContradictionValidationError);
    assert.equal(e.code, "F6");
  }
  assert.equal(threw, true);
  const head = await ops.getContradictionHead(id);
  assert.equal(head.content_version, INITIAL_REVISION_ID);
});

await test("T023-004 CAS CONFLICT", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t023-004"));
  const id = "contradiction:t023-004";
  await ops.registerContradictionUnit(
    contradictionInput(id, ["claim:t023-004-a", "claim:t023-004-b"]),
  );
  await assert.rejects(
    () =>
      ops.transitionContradictionRecordState({
        identity: id,
        revision_id: "rev:stale-attempt",
        expected_head_revision_id: "rev:not-current",
        transition: {
          to: "unresolved_archived",
          authority_agent: HUMAN,
          reason: "stale expected head",
          decision_ref: "decision:t023-004",
          at: AT,
          event_id: "crte:t023-004",
        },
      }),
    (e) => e instanceof PersistenceError && e.code === "CONFLICT",
  );
  const head = await ops.getContradictionHead(id);
  assert.equal(head.content_version, INITIAL_REVISION_ID);
});

await test("T023-005 optional event + export + no Relationship", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t023-005"));
  const id = "contradiction:t023-005";
  await ops.registerContradictionUnit(
    contradictionInput(id, ["claim:t023-005-a", "claim:t023-005-b"]),
  );
  await ops.transitionContradictionRecordState({
    identity: id,
    revision_id: "rev:archived-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    append_event: true,
    transition: {
      to: "unresolved_archived",
      authority_agent: HUMAN,
      reason: "event",
      decision_ref: "decision:t023-005",
      at: AT,
      event_id: "crte:t023-005",
    },
  });
  const events = await ops.getEvents(id);
  assert.ok(
    events.some((e) => e.event_type === "ops.contradiction_record_state_revision"),
  );
  const json = await ops.exportContradictionUnit(id);
  assert.ok(json.includes("unresolved_archived"));
  const listed = await ops.repository.list({
    filter: { entity_kind: "Relationship" },
  });
  assert.equal(listed.total, 0);
});

await test("T023-006 partial-write orphan honesty", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t023-006"));
  const id = "contradiction:t023-006";
  await ops.registerContradictionUnit(
    contradictionInput(id, ["claim:t023-006-a", "claim:t023-006-b"]),
  );
  try {
    await ops.transitionContradictionRecordState({
      identity: id,
      revision_id: "rev:orphan",
      expected_head_revision_id: "rev:not-current",
      transition: {
        to: "unresolved_archived",
        authority_agent: HUMAN,
        reason: "orphan",
        decision_ref: "decision:t023-006",
        at: AT,
        event_id: "crte:t023-006",
      },
    });
    assert.fail("expected CONFLICT");
  } catch (e) {
    assert.ok(e instanceof PersistenceError && e.code === "CONFLICT");
  }
  const orphanKey = makeCanonicalUnitRevisionStorageKey(
    "ContradictionUnit",
    id,
    "rev:orphan",
  );
  const orphan = await ops.repository.get(id, "CanonicalUnit", {
    unit_kind: "ContradictionUnit",
    revision_id: "rev:orphan",
  });
  assert.equal(orphan.storage_key, orphanKey);
  const head = await ops.getContradictionHead(id);
  assert.equal(head.content_version, INITIAL_REVISION_ID);
});

await test("T023-007 deterministic double export", async () => {
  const opsA = createResearchOperations(createMemoryPersistenceSession("t023-007a"));
  const opsB = createResearchOperations(createMemoryPersistenceSession("t023-007b"));
  const id = "contradiction:t023-007";
  const input = contradictionInput(id, ["claim:t023-007-a", "claim:t023-007-b"]);
  await opsA.registerContradictionUnit(input);
  await opsB.registerContradictionUnit(input);
  const transition = {
    identity: id,
    revision_id: "rev:archived-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    transition: {
      to: "unresolved_archived",
      authority_agent: HUMAN,
      reason: "det",
      decision_ref: "decision:t023-007",
      at: AT,
      event_id: "crte:t023-007",
    },
  };
  await opsA.transitionContradictionRecordState(transition);
  await opsB.transitionContradictionRecordState(transition);
  assert.equal(
    await opsA.exportContradictionUnit(id),
    await opsB.exportContradictionUnit(id),
  );
});

console.log(`TEST-023 ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

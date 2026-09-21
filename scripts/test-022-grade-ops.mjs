/**
 * EXEC-022 focused tests — Evidence Grade OPS post-persist (Model C / Option A).
 * Run after build: node scripts/test-022-grade-ops.mjs
 */
import assert from "node:assert/strict";
import {
  EvidenceGradeValidationError,
} from "../packages/core/dist/index.js";
import {
  INITIAL_REVISION_ID,
  PersistenceError,
  createMemoryPersistenceSession,
  makeCanonicalUnitRevisionStorageKey,
} from "../packages/persistence/dist/index.js";
import {
  createResearchOperations,
} from "../apps/reference-app/dist/index.js";

const AT = "2026-09-21T12:00:00Z";
const HUMAN = "human:ops022-test";

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

function evidenceInput(id) {
  return {
    evidence_id: id,
    summary: "Sprint 022 test evidence",
    source: {
      source_class: "laboratory",
      source_locator: `lab://t022/${id}`,
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
    items: [
      {
        item_id: `eitem:${id.replace(/^evidence:/, "")}`,
        content_summary: "obs",
        item_state: "active",
      },
    ],
  };
}

function gradeAssignment(overrides = {}) {
  return {
    label: "model_output_only",
    authority_agent: HUMAN,
    reason: "sprint 022 grade",
    decision_ref: "decision:t022",
    at: AT,
    event_id: "gae:t022",
    ...overrides,
  };
}

await test("T022-001 assignEvidenceGrade success path", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t022-001"));
  const id = "evidence:t022-001";
  await ops.registerEvidenceUnit(evidenceInput(id));
  const r = await ops.assignEvidenceGrade({
    identity: id,
    revision_id: "rev:grade-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    assignment: gradeAssignment({ event_id: "gae:t022-001" }),
  });
  assert.equal(r.evidence.grade_ref, "SCI-003@0.1.0:model_output_only");
  assert.equal(r.evidence.evidence_id, id);
  assert.equal(r.evidence.record_state, "draft");
  assert.equal(r.evidence.evidence_version, "1.0.1");
  assert.equal(r.head_revision_id, "rev:grade-1");
  assert.equal(r.unit.envelope.unit_kind, "EvidenceUnit");
  assert.equal(r.entity.predecessor_revision_id, INITIAL_REVISION_ID);
});

await test("T022-002 lineage and head", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t022-002"));
  const id = "evidence:t022-002";
  await ops.registerEvidenceUnit(evidenceInput(id));
  await ops.assignEvidenceGrade({
    identity: id,
    revision_id: "rev:grade-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    assignment: gradeAssignment({ event_id: "gae:t022-002" }),
  });
  const head = await ops.getEvidenceHead(id);
  assert.equal(head.content_version, "rev:grade-1");
  const lineage = await ops.getEvidenceLineage(id);
  assert.equal(lineage.length, 2);
});

await test("T022-003 Core F5 AI raise; head unchanged", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t022-003"));
  const id = "evidence:t022-003";
  await ops.registerEvidenceUnit({
    ...evidenceInput(id),
    source: {
      source_class: "literature_venue",
      source_locator: "doi://10.1000/t022-003",
      source_state: "declared",
    },
  });
  let threw = false;
  try {
    await ops.assignEvidenceGrade({
      identity: id,
      revision_id: "rev:grade-raise",
      expected_head_revision_id: INITIAL_REVISION_ID,
      assignment: gradeAssignment({
        label: "literature_secondary",
        authority_agent: "ai:t022",
        event_id: "gae:t022-003",
      }),
    });
  } catch (e) {
    threw = true;
    assert.ok(e instanceof EvidenceGradeValidationError);
    assert.equal(e.code, "F5");
  }
  assert.equal(threw, true);
  const head = await ops.getEvidenceHead(id);
  assert.equal(head.content_version, INITIAL_REVISION_ID);
});

await test("T022-004 CAS CONFLICT", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t022-004"));
  const id = "evidence:t022-004";
  await ops.registerEvidenceUnit(evidenceInput(id));
  await ops.assignEvidenceGrade({
    identity: id,
    revision_id: "rev:grade-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    assignment: gradeAssignment({ event_id: "gae:t022-004a" }),
  });
  await assert.rejects(
    () =>
      ops.assignEvidenceGrade({
        identity: id,
        revision_id: "rev:grade-stale",
        expected_head_revision_id: INITIAL_REVISION_ID,
        assignment: gradeAssignment({
          label: "registered_primary_data",
          event_id: "gae:t022-004b",
          decision_ref: "decision:t022-b",
        }),
      }),
    (e) => e instanceof PersistenceError && e.code === "CONFLICT",
  );
});

await test("T022-005 optional event + export + no GradeDesignationUnit", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t022-005"));
  const id = "evidence:t022-005";
  await ops.registerEvidenceUnit(evidenceInput(id));
  const r = await ops.assignEvidenceGrade({
    identity: id,
    revision_id: "rev:grade-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    append_event: true,
    assignment: gradeAssignment({ event_id: "gae:t022-005" }),
  });
  const events = await ops.getEvents(id);
  assert.ok(
    events.some((e) => e.event_type === "ops.evidence_grade_assignment_revision"),
  );
  const json = await ops.exportEvidenceUnit(id);
  assert.ok(json.includes("SCI-003@0.1.0:model_output_only"));
  assert.equal(r.evidence.grade_ref, "SCI-003@0.1.0:model_output_only");
  await assert.rejects(
    () => ops.repository.getHead(id, "GradeDesignationUnit"),
    (e) => e instanceof PersistenceError && e.code === "NOT_FOUND",
  );
});

await test("T022-006 partial-write orphan honesty", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t022-006"));
  const id = "evidence:t022-006";
  await ops.registerEvidenceUnit(evidenceInput(id));
  await ops.assignEvidenceGrade({
    identity: id,
    revision_id: "rev:grade-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    assignment: gradeAssignment({ event_id: "gae:t022-006a" }),
  });
  try {
    await ops.assignEvidenceGrade({
      identity: id,
      revision_id: "rev:grade-orphan",
      expected_head_revision_id: INITIAL_REVISION_ID,
      assignment: gradeAssignment({
        label: "registered_primary_data",
        event_id: "gae:t022-006b",
        decision_ref: "decision:t022-orphan",
      }),
    });
    assert.fail("expected CONFLICT");
  } catch (e) {
    assert.ok(e instanceof PersistenceError && e.code === "CONFLICT");
  }
  const orphanKey = makeCanonicalUnitRevisionStorageKey(
    "EvidenceUnit",
    id,
    "rev:grade-orphan",
  );
  const orphan = await ops.repository.get(id, "CanonicalUnit", {
    unit_kind: "EvidenceUnit",
    revision_id: "rev:grade-orphan",
  });
  assert.equal(orphan.storage_key, orphanKey);
  const head = await ops.getEvidenceHead(id);
  assert.equal(head.content_version, "rev:grade-1");
});

await test("T022-007 deterministic double export", async () => {
  const opsA = createResearchOperations(createMemoryPersistenceSession("t022-007a"));
  const opsB = createResearchOperations(createMemoryPersistenceSession("t022-007b"));
  const id = "evidence:t022-007";
  await opsA.registerEvidenceUnit(evidenceInput(id));
  await opsB.registerEvidenceUnit(evidenceInput(id));
  await opsA.assignEvidenceGrade({
    identity: id,
    revision_id: "rev:grade-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    assignment: gradeAssignment({ event_id: "gae:t022-007" }),
  });
  await opsB.assignEvidenceGrade({
    identity: id,
    revision_id: "rev:grade-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    assignment: gradeAssignment({ event_id: "gae:t022-007" }),
  });
  assert.equal(await opsA.exportEvidenceUnit(id), await opsB.exportEvidenceUnit(id));
});

console.log(`TEST-022 ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

/**
 * EXEC-021 focused tests — Evidence Record State post-persist (Model C).
 * Run after build: node scripts/test-021-evidence-record-state.mjs
 */
import assert from "node:assert/strict";
import {
  EvidenceTransitionService,
  EvidenceValidationError,
} from "../packages/core/dist/index.js";
import { CanonicalEncoder } from "../packages/encoding/dist/index.js";
import {
  INITIAL_REVISION_ID,
  PersistenceError,
  createMemoryPersistenceSession,
  entityFromCanonicalUnit,
  makeCanonicalUnitRevisionStorageKey,
  makeRevisionHeadStorageKey,
} from "../packages/persistence/dist/index.js";
import {
  createResearchOperations,
  evidenceFromEvidenceUnitPayload,
} from "../apps/reference-app/dist/index.js";

const AT = "2026-09-21T12:00:00Z";
const HUMAN = "human:ops021-test";

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
    summary: "Sprint 021 test evidence",
    source: {
      source_class: "laboratory",
      source_locator: `lab://t021/${id}`,
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

function registerTransition(overrides = {}) {
  return {
    to: "registered",
    authority_agent: HUMAN,
    reason: "sprint 021 register",
    decision_ref: "decision:t021",
    at: AT,
    event_id: "erte:t021",
    ...overrides,
  };
}

await test("T021-001 decode EvidenceUnit payload", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t021-1"));
  const { entity } = await ops.registerEvidenceUnit(evidenceInput("evidence:t021-1"));
  const ev = evidenceFromEvidenceUnitPayload(entity.payload);
  assert.equal(ev.evidence_id, "evidence:t021-1");
  assert.equal(ev.record_state, "draft");
});

await test("T021-002 draft → registered post-persist", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t021-2"));
  await ops.registerEvidenceUnit(evidenceInput("evidence:t021-2"));
  const r = await ops.transitionEvidenceRecordState({
    identity: "evidence:t021-2",
    revision_id: "rev:record-registered-1",
    expected_head_revision_id: "rev:initial",
    transition: registerTransition({ event_id: "erte:t021-2" }),
  });
  assert.equal(r.evidence.record_state, "registered");
  assert.equal(r.head_revision_id, "rev:record-registered-1");
  assert.equal(r.entity.predecessor_revision_id, "rev:initial");
  assert.equal(
    r.entity.storage_key,
    makeCanonicalUnitRevisionStorageKey(
      "EvidenceUnit",
      "evidence:t021-2",
      "rev:record-registered-1",
    ),
  );
});

await test("T021-003 registered → withdrawn", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t021-3"));
  await ops.registerEvidenceUnit(evidenceInput("evidence:t021-3"), {
    transition: registerTransition({ event_id: "erte:t021-3a" }),
  });
  const r = await ops.transitionEvidenceRecordState({
    identity: "evidence:t021-3",
    revision_id: "rev:record-withdrawn-1",
    expected_head_revision_id: "rev:initial",
    transition: {
      to: "withdrawn",
      authority_agent: HUMAN,
      reason: "withdraw",
      at: AT,
      event_id: "erte:t021-3b",
    },
  });
  assert.equal(r.evidence.record_state, "withdrawn");
});

await test("T021-004 invalid transition F_TRANSITION", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t021-4"));
  await ops.registerEvidenceUnit(evidenceInput("evidence:t021-4"), {
    transition: registerTransition({ event_id: "erte:t021-4a" }),
  });
  await assert.rejects(
    () =>
      ops.transitionEvidenceRecordState({
        identity: "evidence:t021-4",
        revision_id: "rev:bad",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "draft",
          authority_agent: HUMAN,
          reason: "illegal",
          at: AT,
          event_id: "erte:t021-4b",
        },
      }),
    (e) => e instanceof EvidenceValidationError && e.code === "F_TRANSITION",
  );
});

await test("T021-005 stale head CONFLICT", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t021-5"));
  await ops.registerEvidenceUnit(evidenceInput("evidence:t021-5"));
  await ops.transitionEvidenceRecordState({
    identity: "evidence:t021-5",
    revision_id: "rev:record-registered-1",
    expected_head_revision_id: "rev:initial",
    transition: registerTransition({ event_id: "erte:t021-5a" }),
  });
  await assert.rejects(
    () =>
      ops.transitionEvidenceRecordState({
        identity: "evidence:t021-5",
        revision_id: "rev:stale",
        expected_head_revision_id: "rev:initial",
        transition: {
          to: "withdrawn",
          authority_agent: HUMAN,
          reason: "stale",
          at: AT,
          event_id: "erte:t021-5b",
        },
      }),
    (e) => e instanceof PersistenceError && e.code === "CONFLICT",
  );
});

await test("T021-006 duplicate revision ALREADY_EXISTS", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t021-6"));
  await ops.registerEvidenceUnit(evidenceInput("evidence:t021-6"));
  const result = await ops.transitionEvidenceRecordState({
    identity: "evidence:t021-6",
    revision_id: "rev:dup",
    expected_head_revision_id: "rev:initial",
    transition: registerTransition({ event_id: "erte:t021-6a" }),
  });
  await assert.rejects(
    () => ops.repository.create(result.entity),
    (e) => e instanceof PersistenceError && e.code === "ALREADY_EXISTS",
  );
});

await test("T021-007 lineage + RevisionHead", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t021-7"));
  await ops.registerEvidenceUnit(evidenceInput("evidence:t021-7"));
  await ops.transitionEvidenceRecordState({
    identity: "evidence:t021-7",
    revision_id: "rev:record-registered-1",
    expected_head_revision_id: "rev:initial",
    transition: registerTransition({ event_id: "erte:t021-7" }),
  });
  const lineage = await ops.getEvidenceLineage("evidence:t021-7");
  assert.equal(lineage.length, 2);
  const head = await ops.getEvidenceHead("evidence:t021-7");
  assert.equal(
    head.storage_key,
    makeRevisionHeadStorageKey("EvidenceUnit", "evidence:t021-7"),
  );
  assert.equal(head.content_version, "rev:record-registered-1");
});

await test("T021-008 old revision immutability", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t021-8"));
  await ops.registerEvidenceUnit(evidenceInput("evidence:t021-8"));
  await ops.transitionEvidenceRecordState({
    identity: "evidence:t021-8",
    revision_id: "rev:record-registered-1",
    expected_head_revision_id: "rev:initial",
    transition: registerTransition({ event_id: "erte:t021-8" }),
  });
  const old = await ops.getEvidenceUnitRevision("evidence:t021-8", "rev:initial");
  await assert.rejects(
    () => ops.repository.replace({ ...old, content_version: "9.9.9" }),
    (e) => e instanceof PersistenceError && e.code === "IMMUTABLE_ENTITY",
  );
});

await test("T021-009 deterministic double-run export", async () => {
  async function run() {
    const ops = createResearchOperations(createMemoryPersistenceSession("p:t021-9"));
    await ops.registerEvidenceUnit(evidenceInput("evidence:t021-9"));
    await ops.transitionEvidenceRecordState({
      identity: "evidence:t021-9",
      revision_id: "rev:record-registered-1",
      expected_head_revision_id: "rev:initial",
      transition: registerTransition({ event_id: "erte:t021-9" }),
    });
    return ops.exportEvidenceUnit("evidence:t021-9");
  }
  assert.equal(await run(), await run());
});

await test("T021-010 operational event", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t021-10"));
  await ops.registerEvidenceUnit(evidenceInput("evidence:t021-10"));
  await ops.transitionEvidenceRecordState({
    identity: "evidence:t021-10",
    revision_id: "rev:record-registered-1",
    expected_head_revision_id: "rev:initial",
    append_event: true,
    transition: registerTransition({ event_id: "erte:t021-10" }),
  });
  const events = await ops.getEvents("evidence:t021-10");
  assert.ok(
    events.some((e) => e.event_type === "ops.evidence_record_state_revision"),
  );
});

await test("T021-011 snapshot + workspace", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t021-11"));
  const session = ops.openSession({ research_session_id: "research:t021-11" });
  const ws = ops.openWorkspace({ research_workspace_id: "workspace:t021-11" });
  ops.bindSession(ws, session);
  await ops.registerEvidenceUnit(evidenceInput("evidence:t021-11"));
  ops.registerMember(session, {
    entity_kind: "CanonicalUnit",
    unit_kind: "EvidenceUnit",
    identity: "evidence:t021-11",
  });
  await ops.transitionEvidenceRecordState({
    identity: "evidence:t021-11",
    revision_id: "rev:record-registered-1",
    expected_head_revision_id: "rev:initial",
    transition: registerTransition({ event_id: "erte:t021-11" }),
  });
  const snap = await ops.snapshotView(session);
  assert.equal(snap.member_refs.length, 1);
  const wsnap = await ops.workspaceSnapshotView(ws);
  assert.equal(wsnap.member_refs.length, 1);
});

await test("T021-012 export head vs prior revision", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t021-12"));
  await ops.registerEvidenceUnit(evidenceInput("evidence:t021-12"));
  await ops.transitionEvidenceRecordState({
    identity: "evidence:t021-12",
    revision_id: "rev:record-registered-1",
    expected_head_revision_id: "rev:initial",
    transition: registerTransition({ event_id: "erte:t021-12" }),
  });
  const head = await ops.exportEvidenceUnit("evidence:t021-12");
  const old = await ops.exportEvidenceUnitRevision(
    "evidence:t021-12",
    "rev:initial",
  );
  assert.notEqual(head, old);
});

await test("T021-013 partial-write create without head advance", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t021-13"));
  await ops.registerEvidenceUnit(evidenceInput("evidence:t021-13"));
  const prior = await ops.getEvidenceUnit("evidence:t021-13");
  const evidence = new EvidenceTransitionService().transition(
    evidenceFromEvidenceUnitPayload(prior.payload),
    registerTransition({ event_id: "erte:t021-13" }),
  );
  const unit = await new CanonicalEncoder().assemble(evidence);
  await ops.repository.create(
    entityFromCanonicalUnit(unit, {
      revision_id: "rev:orphan",
      predecessor_revision_id: "rev:initial",
    }),
  );
  const head = await ops.getEvidenceHead("evidence:t021-13");
  assert.equal(head.content_version, INITIAL_REVISION_ID);
  const orphan = await ops.getEvidenceUnitRevision("evidence:t021-13", "rev:orphan");
  assert.equal(orphan.revision_id, "rev:orphan");
});

await test("T021-014 Sprint 019 create-once regression", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t021-14"));
  await ops.registerEvidenceUnit(evidenceInput("evidence:t021-14"));
  await assert.rejects(
    () => ops.registerEvidenceUnit(evidenceInput("evidence:t021-14")),
    (e) => e instanceof PersistenceError && e.code === "ALREADY_EXISTS",
  );
});

await test("T021-015 Claim Standing regression", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t021-15"));
  await ops.registerClaimUnit({
    claim_id: "claim:t021-15",
    proposition: "regression",
    scope: {
      domain_context: "assay",
      bounds: "cohort T021",
      exclusions: "none",
    },
    created_by: HUMAN,
    created_at: AT,
  });
  const r = await ops.transitionClaimStanding({
    identity: "claim:t021-15",
    revision_id: "rev:standing-1",
    expected_head_revision_id: "rev:initial",
    transition: {
      to: "supported",
      authority_agent: HUMAN,
      reason: "clinical_boundary_ack t021",
      decision_ref: "decision:t021-15",
      at: AT,
      event_id: "ste:t021-15",
      supported_by: ["evidence:t021-15-support"],
    },
  });
  assert.equal(r.claim.standing, "supported");
});

console.log(`\nTEST-021 ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

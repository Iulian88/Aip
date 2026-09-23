/**
 * EXEC-024 focused tests — Negative Result OPS under Model C.
 * Run after build: node scripts/test-024-negative-result-ops.mjs
 */
import assert from "node:assert/strict";
import { NegativeResultValidationError } from "../packages/core/dist/index.js";
import {
  INITIAL_REVISION_ID,
  PersistenceError,
  createMemoryPersistenceSession,
} from "../packages/persistence/dist/index.js";
import {
  createResearchOperations,
  negativeResultFromNegativeResultUnitPayload,
} from "../apps/reference-app/dist/index.js";

const AT = "2026-09-23T12:00:00Z";
const HUMAN = "human:ops024-test";

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

function nrInput(id, overrides = {}) {
  return {
    negative_result_id: id,
    summary: "Sprint 024 test negative result",
    description: "expected not observed",
    expected_observation: "signal",
    observed_absence: "no signal",
    scope: {
      domain_context: "assay",
      bounds: "cohort",
      exclusions: "none",
    },
    protocol_ref: "protocol:t024",
    sensitivity_context: "nominal",
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

function registration(eventId, overrides = {}) {
  return {
    to: "registered",
    authority_agent: HUMAN,
    reason: "register",
    decision_ref: "decision:t024",
    at: AT,
    event_id: eventId,
    ...overrides,
  };
}

await test("T024-001 registerNegativeResultUnit createRegistered path", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t024-001"));
  const id = "negresult:t024-001";
  const r = await ops.registerNegativeResultUnit(
    nrInput(id, { claim_refs: ["claim:t024-001"] }),
    registration("nrte:t024-001"),
  );
  assert.equal(r.negativeResult.record_state, "registered");
  assert.equal(r.unit.envelope.unit_kind, "NegativeResultUnit");
  assert.equal(r.entity.revision_id, INITIAL_REVISION_ID);
  assert.equal(r.negativeResult.record_transition_log?.length, 1);
  const head = await ops.getNegativeResultHead(id);
  assert.equal(head.content_version, INITIAL_REVISION_ID);
});

await test("T024-002 transition + lineage + decode", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t024-002"));
  const id = "negresult:t024-002";
  await ops.registerNegativeResultUnit(nrInput(id), registration("nrte:t024-002-reg"));
  const r = await ops.transitionNegativeResultRecordState({
    identity: id,
    revision_id: "rev:withdrawn-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    transition: {
      to: "withdrawn",
      authority_agent: HUMAN,
      reason: "withdraw",
      decision_ref: "decision:t024-002",
      at: AT,
      event_id: "nrte:t024-002-wd",
      withdrawal_reason: "superseded",
    },
  });
  assert.equal(r.negativeResult.record_state, "withdrawn");
  assert.equal(r.head_revision_id, "rev:withdrawn-1");
  const lineage = await ops.getNegativeResultLineage(id);
  assert.equal(lineage.length, 2);
  const entity = await ops.getNegativeResultUnit(id);
  const decoded = negativeResultFromNegativeResultUnitPayload(entity.payload);
  assert.equal(decoded.record_state, "withdrawn");
  assert.equal(decoded.withdrawal_reason, "superseded");
});

await test("T024-003 Human gate F5 on AI register", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t024-003"));
  await assert.rejects(
    () =>
      ops.registerNegativeResultUnit(
        nrInput("negresult:t024-003"),
        registration("nrte:t024-003", { authority_agent: "ai:bot" }),
      ),
    (e) => e instanceof NegativeResultValidationError && e.code === "F5",
  );
});

await test("T024-004 stale head CONFLICT", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t024-004"));
  const id = "negresult:t024-004";
  await ops.registerNegativeResultUnit(nrInput(id), registration("nrte:t024-004"));
  await assert.rejects(
    () =>
      ops.transitionNegativeResultRecordState({
        identity: id,
        revision_id: "rev:stale",
        expected_head_revision_id: "rev:not-current",
        transition: {
          to: "withdrawn",
          authority_agent: HUMAN,
          reason: "stale",
          decision_ref: "decision:t024-004",
          at: AT,
          event_id: "nrte:t024-004-wd",
          withdrawal_reason: "x",
        },
      }),
    (e) => e instanceof PersistenceError && e.code === "CONFLICT",
  );
});

await test("T024-005 missing withdrawal_reason F7", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t024-005"));
  const id = "negresult:t024-005";
  await ops.registerNegativeResultUnit(nrInput(id), registration("nrte:t024-005"));
  await assert.rejects(
    () =>
      ops.transitionNegativeResultRecordState({
        identity: id,
        revision_id: "rev:wd",
        expected_head_revision_id: INITIAL_REVISION_ID,
        transition: {
          to: "withdrawn",
          authority_agent: HUMAN,
          reason: "wd",
          decision_ref: "decision:t024-005",
          at: AT,
          event_id: "nrte:t024-005-wd",
        },
      }),
    (e) => e instanceof NegativeResultValidationError && e.code === "F7",
  );
});

await test("T024-006 deterministic export double-run", async () => {
  async function run() {
    const ops = createResearchOperations(createMemoryPersistenceSession("t024-006"));
    const id = "negresult:t024-006";
    await ops.registerNegativeResultUnit(nrInput(id), registration("nrte:t024-006"));
    await ops.transitionNegativeResultRecordState({
      identity: id,
      revision_id: "rev:withdrawn-1",
      expected_head_revision_id: INITIAL_REVISION_ID,
      transition: {
        to: "withdrawn",
        authority_agent: HUMAN,
        reason: "wd",
        decision_ref: "decision:t024-006",
        at: AT,
        event_id: "nrte:t024-006-wd",
        withdrawal_reason: "done",
      },
    });
    return ops.exportNegativeResultUnit(id);
  }
  assert.equal(await run(), await run());
});

await test("T024-007 ops event when append_event true", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t024-007"));
  const id = "negresult:t024-007";
  await ops.registerNegativeResultUnit(nrInput(id), registration("nrte:t024-007"));
  await ops.transitionNegativeResultRecordState({
    identity: id,
    revision_id: "rev:withdrawn-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    append_event: true,
    transition: {
      to: "withdrawn",
      authority_agent: HUMAN,
      reason: "wd",
      decision_ref: "decision:t024-007",
      at: AT,
      event_id: "nrte:t024-007-wd",
      withdrawal_reason: "done",
    },
  });
  const events = await ops.getEvents(id);
  const opsEv = events.filter(
    (e) => e.event_type === "ops.negative_result_record_state_revision",
  );
  assert.equal(opsEv.length, 1);
  assert.equal(opsEv[0].event_id, "ops:nrte:t024-007-wd");
});

console.log(`\nTEST-024: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;

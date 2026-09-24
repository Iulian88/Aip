/**
 * EXEC-025 focused tests — Verification OPS under Model C.
 * Run after build: node scripts/test-025-verification-ops.mjs
 */
import assert from "node:assert/strict";
import { VerificationValidationError } from "../packages/core/dist/index.js";
import {
  INITIAL_REVISION_ID,
  PersistenceError,
  createMemoryPersistenceSession,
} from "../packages/persistence/dist/index.js";
import {
  createResearchOperations,
  verificationFromVerificationUnitPayload,
} from "../apps/reference-app/dist/index.js";

const AT = "2026-09-24T12:00:00Z";
const HUMAN = "human:ops025-test";

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

function vInput(id, overrides = {}) {
  return {
    verification_id: id,
    summary: "Sprint 025 test verification",
    description: "protocol-scoped verification",
    scope: {
      domain_context: "assay",
      bounds: "cohort",
      exclusions: "none",
    },
    protocol_ref: "protocol:t025",
    verification_method: "protocol_conformance",
    verification_context: "test context",
    verification_rationale: "test rationale",
    provenance: {
      completeness: "complete",
      recorded_at: AT,
      custody_agent: HUMAN,
      method_summary: "test",
    },
    created_by: HUMAN,
    created_at: AT,
    claim_refs: ["claim:t025"],
    ...overrides,
  };
}

function leave(to, eventId, overrides = {}) {
  return {
    to,
    authority_agent: HUMAN,
    reason: "leave planned",
    decision_ref: "decision:t025",
    at: AT,
    event_id: eventId,
    ...overrides,
  };
}

await test("T025-001 registerVerificationUnit createPlanned path", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t025-001"));
  const id = "verification:t025-001";
  const r = await ops.registerVerificationUnit(vInput(id));
  assert.equal(r.verification.record_state, "planned");
  assert.equal(r.verification.verification_outcome, "pending");
  assert.equal(r.verification.record_transition_log?.length ?? 0, 0);
  assert.equal(r.unit.envelope.unit_kind, "VerificationUnit");
  assert.equal(r.entity.revision_id, INITIAL_REVISION_ID);
  const head = await ops.getVerificationHead(id);
  assert.equal(head.content_version, INITIAL_REVISION_ID);
});

await test("T025-002 transition + lineage + decode", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t025-002"));
  const id = "verification:t025-002";
  await ops.registerVerificationUnit(vInput(id));
  const r = await ops.transitionVerificationRecordState({
    identity: id,
    revision_id: "rev:passed-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    transition: leave("passed", "vte:t025-002"),
  });
  assert.equal(r.verification.record_state, "passed");
  assert.equal(r.verification.verification_outcome, "passed");
  assert.equal(r.head_revision_id, "rev:passed-1");
  const lineage = await ops.getVerificationLineage(id);
  assert.equal(lineage.length, 2);
  const entity = await ops.getVerificationUnit(id);
  const decoded = verificationFromVerificationUnitPayload(entity.payload);
  assert.equal(decoded.record_state, "passed");
  assert.equal(decoded.verification_outcome, "passed");
});

await test("T025-003 Human gate F7 on AI leave-planned", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t025-003"));
  const id = "verification:t025-003";
  await ops.registerVerificationUnit(vInput(id));
  await assert.rejects(
    () =>
      ops.transitionVerificationRecordState({
        identity: id,
        revision_id: "rev:passed-1",
        expected_head_revision_id: INITIAL_REVISION_ID,
        transition: leave("passed", "vte:t025-003", {
          authority_agent: "ai:bot",
        }),
      }),
    (e) => e instanceof VerificationValidationError && e.code === "F7",
  );
  const head = await ops.getVerificationHead(id);
  assert.equal(head.content_version, INITIAL_REVISION_ID);
});

await test("T025-004 stale head CONFLICT while planned", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t025-004"));
  const id = "verification:t025-004";
  await ops.registerVerificationUnit(vInput(id));
  await assert.rejects(
    () =>
      ops.transitionVerificationRecordState({
        identity: id,
        revision_id: "rev:stale",
        expected_head_revision_id: "rev:not-current",
        transition: leave("passed", "vte:t025-004"),
      }),
    (e) => e instanceof PersistenceError && e.code === "CONFLICT",
  );
});

await test("T025-005 ADM-T1 F6 without targets", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t025-005"));
  const { claim_refs: _omit, ...noTargets } = vInput("verification:t025-005");
  await assert.rejects(
    () => ops.registerVerificationUnit(noTargets),
    (e) => e instanceof VerificationValidationError && e.code === "F6",
  );
});

await test("T025-006 deterministic export double-run", async () => {
  async function run() {
    const ops = createResearchOperations(createMemoryPersistenceSession("t025-006"));
    const id = "verification:t025-006";
    await ops.registerVerificationUnit(vInput(id));
    await ops.transitionVerificationRecordState({
      identity: id,
      revision_id: "rev:passed-1",
      expected_head_revision_id: INITIAL_REVISION_ID,
      transition: leave("passed", "vte:t025-006"),
    });
    return ops.exportVerificationUnit(id);
  }
  assert.equal(await run(), await run());
});

await test("T025-007 ops event when append_event true", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t025-007"));
  const id = "verification:t025-007";
  await ops.registerVerificationUnit(vInput(id));
  await ops.transitionVerificationRecordState({
    identity: id,
    revision_id: "rev:passed-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    append_event: true,
    transition: leave("passed", "vte:t025-007"),
  });
  const events = await ops.getEvents(id);
  const opsEv = events.filter(
    (e) => e.event_type === "ops.verification_record_state_revision",
  );
  assert.equal(opsEv.length, 1);
  assert.equal(opsEv[0].event_id, "ops:vte:t025-007");
});

console.log(`\nTEST-025: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;

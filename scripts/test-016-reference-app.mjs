/**
 * EXEC-SPRINT-016 focused Reference App tests (SPEC-016A acceptance themes).
 * Run after build: node scripts/test-016-reference-app.mjs
 */
import assert from "node:assert/strict";
import { ClaimFactory } from "../packages/core/dist/index.js";
import { CanonicalEncoder } from "../packages/encoding/dist/index.js";
import { JsonEncoder } from "../packages/serialization/dist/index.js";
import {
  PERSISTENCE_ENTITY_KINDS,
  PersistenceError,
  createMemoryPersistenceSession,
} from "../packages/persistence/dist/index.js";
import {
  OpsError,
  ResearchSession,
  createResearchOperations,
  referenceAppMarker,
} from "../apps/reference-app/dist/index.js";

const AT = "2026-09-17T15:00:00Z";
const HUMAN = "human:ops016-test";
const SCOPE = {
  domain_context: "assay",
  bounds: "cohort T016",
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

await test("ResearchSession.open caller-supplied id", () => {
  const s = ResearchSession.open({ research_session_id: "research:t1" });
  assert.equal(s.research_session_id, "research:t1");
});

await test("ResearchSession rejects empty id with OpsError", () => {
  assert.throws(
    () => ResearchSession.open({ research_session_id: "  " }),
    (e) => e instanceof OpsError && e.code === "INVALID_SESSION",
  );
});

await test("research_session_id distinct from PersistenceSession.session_id", () => {
  const p = createMemoryPersistenceSession("persist-sess:t1");
  const ops = createResearchOperations(p);
  const s = ops.openSession({ research_session_id: "research:t1" });
  assert.notEqual(s.research_session_id, ops.persistenceSessionId);
});

await test("membership requires unit_kind for CanonicalUnit", () => {
  const s = ResearchSession.open({ research_session_id: "research:t2" });
  assert.throws(
    () =>
      s.registerMember({
        entity_kind: "CanonicalUnit",
        identity: "claim:x",
      }),
    (e) => e instanceof OpsError && e.code === "INVALID_MEMBERSHIP",
  );
});

await test("Core→ENC→Persistence create-once path", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist-sess:t3"));
  const session = ops.openSession({ research_session_id: "research:t3" });
  const { claim, unit, entity } = await ops.registerClaimUnit({
    claim_id: "claim:t3",
    proposition: "test claim",
    scope: SCOPE,
    created_by: HUMAN,
    created_at: AT,
  });
  assert.equal(claim.claim_id, "claim:t3");
  assert.equal(unit.envelope.identity, "claim:t3");
  assert.equal(entity.entity_kind, "CanonicalUnit");

  await ops.appendResearchEvent("claim:t3", {
    event_id: "event:t3",
    parent_identity: "claim:t3",
    event_type: "ops.claim_unit_registered",
    payload: {},
    ordinal: 0,
  });
  ops.registerMember(session, {
    entity_kind: "CanonicalUnit",
    unit_kind: "ClaimUnit",
    identity: "claim:t3",
  });

  const got = await ops.getClaimUnit("claim:t3");
  assert.equal(got.payload.envelope.unit_kind, "ClaimUnit");
  const events = await ops.getEvents("claim:t3");
  assert.ok(events.some((e) => e.event_id === "event:t3"));
  const tl = await ops.timeline(session);
  assert.ok(tl.some((e) => e.event_id === "event:t3"));
  const view = await ops.snapshotView(session);
  assert.equal(view.research_session_id, "research:t3");
  assert.equal(view.member_refs.length, 1);
  const json = await ops.exportClaimUnit("claim:t3");
  assert.ok(json.includes("claim:t3"));
});

await test("deterministic double-run export", async () => {
  async function once(suffix) {
    const ops = createResearchOperations(
      createMemoryPersistenceSession("persist-sess:det:" + suffix),
    );
    await ops.registerClaimUnit({
      claim_id: "claim:det",
      proposition: "det",
      scope: SCOPE,
      created_by: HUMAN,
      created_at: AT,
    });
    return ops.exportClaimUnit("claim:det");
  }
  const a = await once("a");
  const b = await once("b");
  assert.equal(a, b);
});

await test("PersistenceError propagates unchanged", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist-sess:err"));
  await assert.rejects(
    () => ops.getClaimUnit("claim:missing"),
    (e) => e instanceof PersistenceError && e.code === "NOT_FOUND" && !(e instanceof OpsError),
  );
});

await test("IMMUTABLE_ENTITY on differing replace", async () => {
  const p = createMemoryPersistenceSession("persist-sess:imm");
  const ops = createResearchOperations(p);
  await ops.registerClaimUnit({
    claim_id: "claim:imm",
    proposition: "imm",
    scope: SCOPE,
    created_by: HUMAN,
    created_at: AT,
  });
  const ent = await ops.getClaimUnit("claim:imm");
  await assert.rejects(
    () =>
      p.repository.replace({
        ...ent,
        payload: { ...ent.payload, tampered: true },
      }),
    (e) => e instanceof PersistenceError && e.code === "IMMUTABLE_ENTITY",
  );
});

await test("no ResearchSession Persistence kind", () => {
  assert.equal(PERSISTENCE_ENTITY_KINDS.includes("ResearchSession"), false);
  assert.equal(referenceAppMarker.researchSessionPersisted, false);
});

await test("ClaimFactory / ENC used (not duplicated)", async () => {
  const claims = new ClaimFactory();
  const enc = new CanonicalEncoder();
  const draft = claims.createDraft({
    claim_id: "claim:direct",
    proposition: "direct",
    scope: SCOPE,
    created_by: HUMAN,
    created_at: AT,
  });
  const unit = await enc.assemble(draft);
  assert.equal(unit.envelope.unit_kind, "ClaimUnit");
  const json = new JsonEncoder().encode(unit);
  assert.ok(typeof json === "string");
});

console.log(`\nTEST-016 summary: passed=${passed} failed=${failed}`);
if (failed > 0) process.exitCode = 1;
else console.log("TEST_016_PASS");

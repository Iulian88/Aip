/**
 * EXEC-SPRINT-016 smoke — Research Operations / Reference Application.
 * Verifies SPEC-016A vertical slice. Not a CLI product.
 * Writes SMOKE_016_PASS.
 */
import { writeFileSync } from "node:fs";
import { ClaimFactory } from "../packages/core/dist/index.js";
import { CanonicalEncoder } from "../packages/encoding/dist/index.js";
import { JsonEncoder, stableStringify } from "../packages/serialization/dist/index.js";
import {
  PERSISTENCE_ENTITY_KINDS,
  PersistenceError,
  createMemoryPersistenceSession,
} from "../packages/persistence/dist/index.js";
import {
  OpsError,
  ResearchOperations,
  ResearchSession,
  createResearchOperations,
  referenceAppMarker,
} from "../apps/reference-app/dist/index.js";
import {
  ReferenceRunner,
  referenceFixtures,
} from "../packages/reference-tests/dist/index.js";

const results = [];
function pass(name) {
  results.push("PASS " + name);
  console.log("PASS " + name);
}
function fail(name, err) {
  results.push("FAIL " + name + ": " + (err?.message ?? err));
  console.error("FAIL " + name, err);
  process.exitCode = 1;
}

const AT = "2026-09-17T12:00:00Z";
const HUMAN = "human:ops016-reviewer";
const SCOPE = {
  domain_context: "assay",
  bounds: "cohort OPS016",
  exclusions: "none",
};
const RESEARCH_SESSION_ID = "research:session:016-smoke";
const PERSISTENCE_SESSION_ID = "persist-sess:016-smoke";
const CLAIM_ID = "claim:ops016-smoke";
const EVENT_ID = "event:ops016-smoke-registered";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function runVerticalSlice(ops, researchSessionId) {
  const session = ops.openSession({
    research_session_id: researchSessionId,
    title: "Sprint 016 smoke",
    purpose: "create-once inspect",
  });

  const { claim, unit, entity } = await ops.registerClaimUnit({
    claim_id: CLAIM_ID,
    proposition: "OPS-016 orchestration claim",
    scope: SCOPE,
    created_by: HUMAN,
    created_at: AT,
  });

  assert(claim.claim_id === CLAIM_ID, "claim id");
  assert(claim.standing === "draft_unverified", "standing");
  assert(unit.envelope.unit_kind === "ClaimUnit", "unit_kind");
  assert(unit.envelope.identity === CLAIM_ID, "enc identity");
  assert(entity.identity === CLAIM_ID, "persist identity");
  assert(entity.entity_kind === "CanonicalUnit", "entity_kind");

  const storedEvent = await ops.appendResearchEvent(CLAIM_ID, {
    event_id: EVENT_ID,
    parent_identity: CLAIM_ID,
    parent_class: "Claim",
    event_type: "ops.claim_unit_registered",
    at: AT,
    authority_agent: HUMAN,
    reason: "explicit journal demonstration",
    payload: { source: "smoke-016" },
    ordinal: 0,
  });
  assert(storedEvent.event_id === EVENT_ID, "event id");

  ops.registerMember(session, {
    entity_kind: "CanonicalUnit",
    unit_kind: "ClaimUnit",
    identity: CLAIM_ID,
  });

  const got = await ops.getClaimUnit(CLAIM_ID);
  assert(got.identity === CLAIM_ID, "get identity");
  const payload = got.payload;
  assert(payload.envelope?.unit_kind === "ClaimUnit", "get unit_kind");

  const events = await ops.getEvents(CLAIM_ID);
  assert(events.some((e) => e.event_id === EVENT_ID), "getEvents");

  const timeline = await ops.timeline(session);
  assert(timeline.some((e) => e.event_id === EVENT_ID), "timeline");
  for (let i = 1; i < timeline.length; i++) {
    const a = timeline[i - 1];
    const b = timeline[i];
    const keyA = a.parent_identity + "\0" + a.ordinal + "\0" + a.event_id;
    const keyB = b.parent_identity + "\0" + b.ordinal + "\0" + b.event_id;
    assert(keyA <= keyB, "timeline order");
  }

  const view = await ops.snapshotView(session);
  assert(view.research_session_id === researchSessionId, "snapshot session id");
  assert(view.member_refs.length === 1, "member_refs");
  assert(view.persistence_snapshot.schema_version === "1.0.0", "pers snap");
  assert(
    !PERSISTENCE_ENTITY_KINDS.includes("ResearchSession"),
    "no ResearchSession kind",
  );

  const json1 = await ops.exportClaimUnit(CLAIM_ID);
  const json2 = await ops.exportClaimUnit(CLAIM_ID);
  assert(json1 === json2, "ser deterministic");
  assert(json1.includes(CLAIM_ID), "ser contains claim");

  return { session, view, json1, claim, unit, entity, timeline };
}

// --- package loads ---
try {
  assert(referenceAppMarker.sprint >= 16, "marker sprint");
  assert(referenceAppMarker.researchSessionPersisted === false, "marker memory");
  pass("reference-app package loads");
} catch (e) {
  fail("reference-app package loads", e);
}

// --- session lifecycle + identity separation ---
try {
  const pSession = createMemoryPersistenceSession(PERSISTENCE_SESSION_ID);
  const ops = createResearchOperations(pSession);
  assert(ops.persistenceSessionId === PERSISTENCE_SESSION_ID, "persist sess id");
  const session = ops.openSession({ research_session_id: RESEARCH_SESSION_ID });
  assert(session.research_session_id === RESEARCH_SESSION_ID, "research id");
  assert(
    session.research_session_id !== ops.persistenceSessionId,
    "ids distinct",
  );
  pass("session lifecycle");
  pass("session identity separation");
} catch (e) {
  fail("session lifecycle", e);
  fail("session identity separation", e);
}

// --- OpsError for empty session id ---
try {
  let threw = false;
  try {
    ResearchSession.open({ research_session_id: "" });
  } catch (e) {
    threw = e instanceof OpsError && e.code === "INVALID_SESSION";
  }
  assert(threw, "expected OpsError INVALID_SESSION");
  pass("OpsError OPS-only");
} catch (e) {
  fail("OpsError OPS-only", e);
}

// --- full vertical slice ---
let firstJson;
let firstTimeline;
try {
  const pSession = createMemoryPersistenceSession(PERSISTENCE_SESSION_ID);
  const ops = new ResearchOperations({
    claimFactory: new ClaimFactory(),
    encoder: new CanonicalEncoder(),
    jsonEncoder: new JsonEncoder(),
    persistenceSession: pSession,
  });
  const out = await runVerticalSlice(ops, RESEARCH_SESSION_ID);
  firstJson = out.json1;
  firstTimeline = stableStringify(out.timeline);
  pass("ClaimFactory.createDraft");
  pass("CanonicalEncoder.assemble");
  pass("Persistence.create");
  pass("unit_kind-aware retrieval");
  pass("explicit appendEvent");
  pass("event retrieval");
  pass("timeline");
  pass("Persistence.snapshot");
  pass("ResearchSnapshot view");
  pass("SER export");
  pass("session membership memory-only");
} catch (e) {
  fail("vertical slice", e);
}

// --- deterministic re-run (fresh store, same inputs) ---
try {
  const pSession = createMemoryPersistenceSession(PERSISTENCE_SESSION_ID + ":rerun");
  const ops = createResearchOperations(pSession);
  const out = await runVerticalSlice(ops, RESEARCH_SESSION_ID);
  assert(out.json1 === firstJson, "json match");
  assert(stableStringify(out.timeline) === firstTimeline, "timeline match");
  pass("deterministic re-run");
} catch (e) {
  fail("deterministic re-run", e);
}

// --- ResearchSession not persisted ---
try {
  const pSession = createMemoryPersistenceSession("persist-sess:016-nosess");
  const ops = createResearchOperations(pSession);
  await runVerticalSlice(ops, RESEARCH_SESSION_ID);
  const snap = await pSession.repository.snapshot();
  const kinds = snap.entities.map((e) => e.entity_kind);
  assert(!kinds.includes("ResearchSession"), "no RS kind in store");
  assert(
    !snap.entities.some((e) => e.identity === RESEARCH_SESSION_ID),
    "session id not stored as entity",
  );
  pass("ResearchSession not persisted");
} catch (e) {
  fail("ResearchSession not persisted", e);
}

// --- IMMUTABLE_ENTITY on differing replace ---
try {
  const pSession = createMemoryPersistenceSession("persist-sess:016-imm");
  const ops = createResearchOperations(pSession);
  await ops.registerClaimUnit({
    claim_id: "claim:ops016-imm",
    proposition: "immutability probe",
    scope: SCOPE,
    created_by: HUMAN,
    created_at: AT,
  });
  const ent = await ops.getClaimUnit("claim:ops016-imm");
  const mutated = {
    ...ent,
    payload: { ...ent.payload, tampered: true },
  };
  let code = null;
  try {
    await pSession.repository.replace(mutated);
  } catch (e) {
    if (e instanceof PersistenceError) code = e.code;
  }
  assert(code === "IMMUTABLE_ENTITY", "expected IMMUTABLE_ENTITY");
  pass("immutable replacement rejection");
} catch (e) {
  fail("immutable replacement rejection", e);
}

// --- PersistenceError propagates unchanged ---
try {
  const pSession = createMemoryPersistenceSession("persist-sess:016-err");
  const ops = createResearchOperations(pSession);
  let err = null;
  try {
    await ops.getClaimUnit("claim:does-not-exist");
  } catch (e) {
    err = e;
  }
  assert(err instanceof PersistenceError, "PersistenceError type");
  assert(err.code === "NOT_FOUND", "NOT_FOUND code");
  assert(!(err instanceof OpsError), "not OpsError");
  pass("PersistenceError propagation");
} catch (e) {
  fail("PersistenceError propagation", e);
}

// --- architecture boundaries ---
try {
  assert(!PERSISTENCE_ENTITY_KINDS.includes("ResearchSession"), "kinds");
  assert(referenceAppMarker.secondEventJournal === false, "journal");
  assert(referenceAppMarker.secondIdentitySystem === false, "identity");
  // CONF/CERT not imported/invoked on required path — this smoke does not call them
  pass("architecture boundaries");
} catch (e) {
  fail("architecture boundaries", e);
}

// --- Reference Tests baseline still green ---
try {
  const runner = new ReferenceRunner();
  const report = await runner.run(
    "SciROS Reference Test Suite",
    referenceFixtures,
  );
  assert(report.summary.total === 44, "total 44");
  assert(report.summary.pass === 44, "pass 44");
  assert(report.summary.fail === 0, "fail 0");
  pass("reference tests 44/44");
} catch (e) {
  fail("reference tests 44/44", e);
}

const failed = results.filter((r) => r.startsWith("FAIL"));
if (failed.length === 0) {
  const body =
    "SMOKE_016_PASS\n" +
    "checks=" +
    results.length +
    "\n" +
    results.join("\n") +
    "\n";
  writeFileSync("SMOKE_016_PASS", body, "utf8");
  console.log("SMOKE_016_PASS checks=" + results.length);
} else {
  console.error("SMOKE_016 failed:", failed.length);
  process.exitCode = 1;
}

/**
 * EXEC-020 focused tests — Model C Persistence + Claim Standing post-persist.
 * Run after build: node scripts/test-020-model-c-revision.mjs
 */
import assert from "node:assert/strict";
import {
  CLINICAL_BOUNDARY_ACK,
  ClaimTransitionService,
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
  claimFromClaimUnitPayload,
  createResearchOperations,
} from "../apps/reference-app/dist/index.js";

const AT = "2026-09-19T12:00:00Z";
const HUMAN = "human:ops020-test";
const SCOPE = {
  domain_context: "assay",
  bounds: "cohort T020",
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

function claimInput(id) {
  return {
    claim_id: id,
    proposition: "Sprint 020 test claim",
    scope: SCOPE,
    created_by: HUMAN,
    created_at: AT,
  };
}

function standingInput(overrides = {}) {
  return {
    to: "supported",
    authority_agent: HUMAN,
    reason: `${CLINICAL_BOUNDARY_ACK} sprint 020`,
    decision_ref: "decision:t020",
    at: AT,
    event_id: "ste:t020",
    supported_by: ["evidence:t020-support"],
    ...overrides,
  };
}

await test("T020-001 initial revision rev:initial + four-segment key", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-1"));
  const { entity } = await ops.registerClaimUnit(claimInput("claim:t020-1"));
  assert.equal(entity.revision_id, INITIAL_REVISION_ID);
  assert.equal(
    entity.storage_key,
    makeCanonicalUnitRevisionStorageKey("ClaimUnit", "claim:t020-1", "rev:initial"),
  );
});

await test("T020-002 subsequent revision with predecessor lineage", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-2"));
  await ops.registerClaimUnit(claimInput("claim:t020-2"));
  const r = await ops.transitionClaimStanding({
    identity: "claim:t020-2",
    revision_id: "rev:standing-1",
    expected_head_revision_id: "rev:initial",
    transition: standingInput({ event_id: "ste:t020-2" }),
  });
  assert.equal(r.entity.predecessor_revision_id, "rev:initial");
  assert.equal(r.head_revision_id, "rev:standing-1");
});

await test("T020-003 duplicate revision ALREADY_EXISTS", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-3"));
  await ops.registerClaimUnit(claimInput("claim:t020-3"));
  await assert.rejects(
    () => ops.registerClaimUnit(claimInput("claim:t020-3")),
    (e) => e instanceof PersistenceError && e.code === "ALREADY_EXISTS",
  );
});

await test("T020-004 predecessor lineage walk", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-4"));
  await ops.registerClaimUnit(claimInput("claim:t020-4"));
  await ops.transitionClaimStanding({
    identity: "claim:t020-4",
    revision_id: "rev:standing-1",
    expected_head_revision_id: "rev:initial",
    transition: standingInput({ event_id: "ste:t020-4" }),
  });
  const lineage = await ops.getClaimLineage("claim:t020-4");
  assert.equal(lineage.length, 2);
  assert.equal(lineage[0].revision_id, "rev:initial");
  assert.equal(lineage[1].predecessor_revision_id, "rev:initial");
});

await test("T020-005 RevisionHead creation key", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-5"));
  await ops.registerClaimUnit(claimInput("claim:t020-5"));
  const head = await ops.getClaimHead("claim:t020-5");
  assert.equal(
    head.storage_key,
    makeRevisionHeadStorageKey("ClaimUnit", "claim:t020-5"),
  );
});

await test("T020-006 RevisionHead retrieval", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-6"));
  await ops.registerClaimUnit(claimInput("claim:t020-6"));
  const head = await ops.getClaimHead("claim:t020-6");
  assert.equal(head.content_version, "rev:initial");
});

await test("T020-007 successful head advancement", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-7"));
  await ops.registerClaimUnit(claimInput("claim:t020-7"));
  await ops.transitionClaimStanding({
    identity: "claim:t020-7",
    revision_id: "rev:standing-1",
    expected_head_revision_id: "rev:initial",
    transition: standingInput({ event_id: "ste:t020-7" }),
  });
  const head = await ops.getClaimHead("claim:t020-7");
  assert.equal(head.content_version, "rev:standing-1");
});

await test("T020-008 stale head rejection", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-8"));
  await ops.registerClaimUnit(claimInput("claim:t020-8"));
  await ops.transitionClaimStanding({
    identity: "claim:t020-8",
    revision_id: "rev:standing-1",
    expected_head_revision_id: "rev:initial",
    transition: standingInput({ event_id: "ste:t020-8a" }),
  });
  await assert.rejects(
    () =>
      ops.transitionClaimStanding({
        identity: "claim:t020-8",
        revision_id: "rev:standing-2",
        expected_head_revision_id: "rev:initial",
        transition: standingInput({
          to: "contested",
          event_id: "ste:t020-8b",
          decision_ref: undefined,
          contested_by: ["contradiction:t020-8"],
          supported_by: ["evidence:t020-support"],
        }),
      }),
    (e) => e instanceof PersistenceError && e.code === "CONFLICT",
  );
});

await test("T020-009 head CAS via replace expected_version", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-9"));
  await ops.registerClaimUnit(claimInput("claim:t020-9"));
  await assert.rejects(
    () =>
      ops.repository.advanceHead(
        "claim:t020-9",
        "ClaimUnit",
        "rev:not-current",
        "rev:initial",
      ),
    (e) => e instanceof PersistenceError && e.code === "CONFLICT",
  );
});

await test("T020-010 immutable old revision", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-10"));
  await ops.registerClaimUnit(claimInput("claim:t020-10"));
  await ops.transitionClaimStanding({
    identity: "claim:t020-10",
    revision_id: "rev:standing-1",
    expected_head_revision_id: "rev:initial",
    transition: standingInput({ event_id: "ste:t020-10" }),
  });
  const old = await ops.getClaimUnitRevision("claim:t020-10", "rev:initial");
  await assert.rejects(
    () => ops.repository.replace({ ...old, content_version: "9.9.9" }),
    (e) => e instanceof PersistenceError && e.code === "IMMUTABLE_ENTITY",
  );
});

await test("T020-011 Claim Standing transition", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-11"));
  await ops.registerClaimUnit(claimInput("claim:t020-11"));
  const r = await ops.transitionClaimStanding({
    identity: "claim:t020-11",
    revision_id: "rev:standing-1",
    expected_head_revision_id: "rev:initial",
    transition: standingInput({ event_id: "ste:t020-11" }),
  });
  assert.equal(r.claim.standing, "supported");
});

await test("T020-012 invalid Claim Standing transition", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-12"));
  await ops.registerClaimUnit(claimInput("claim:t020-12"));
  await assert.rejects(
    () =>
      ops.transitionClaimStanding({
        identity: "claim:t020-12",
        revision_id: "rev:bad",
        expected_head_revision_id: "rev:initial",
        transition: standingInput({
          to: "draft_unverified",
          event_id: "ste:t020-12",
        }),
      }),
    (e) => e && e.code === "F_TRANSITION",
  );
});

await test("T020-013 deterministic revision identity (caller-supplied)", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-13"));
  await ops.registerClaimUnit(claimInput("claim:t020-13"));
  const r = await ops.transitionClaimStanding({
    identity: "claim:t020-13",
    revision_id: "rev:caller-fixed",
    expected_head_revision_id: "rev:initial",
    transition: standingInput({ event_id: "ste:t020-13" }),
  });
  assert.equal(r.entity.revision_id, "rev:caller-fixed");
});

await test("T020-014 deterministic serialization double-run", async () => {
  async function run() {
    const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-14"));
    await ops.registerClaimUnit(claimInput("claim:t020-14"));
    await ops.transitionClaimStanding({
      identity: "claim:t020-14",
      revision_id: "rev:standing-1",
      expected_head_revision_id: "rev:initial",
      transition: standingInput({ event_id: "ste:t020-14" }),
    });
    return ops.exportClaimUnit("claim:t020-14");
  }
  assert.equal(await run(), await run());
});

await test("T020-015 deterministic export head vs revision", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-15"));
  await ops.registerClaimUnit(claimInput("claim:t020-15"));
  await ops.transitionClaimStanding({
    identity: "claim:t020-15",
    revision_id: "rev:standing-1",
    expected_head_revision_id: "rev:initial",
    transition: standingInput({ event_id: "ste:t020-15" }),
  });
  const headExport = await ops.exportClaimUnit("claim:t020-15");
  const revExport = await ops.exportClaimUnitRevision(
    "claim:t020-15",
    "rev:standing-1",
  );
  assert.equal(headExport, revExport);
  const oldExport = await ops.exportClaimUnitRevision("claim:t020-15", "rev:initial");
  assert.notEqual(oldExport, headExport);
});

await test("T020-016 snapshot compatibility ResearchSnapshot schema", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-16"));
  const session = ops.openSession({ research_session_id: "research:t020-16" });
  await ops.registerClaimUnit(claimInput("claim:t020-16"));
  ops.registerMember(session, {
    entity_kind: "CanonicalUnit",
    unit_kind: "ClaimUnit",
    identity: "claim:t020-16",
  });
  const snap = await ops.snapshotView(session);
  assert.equal(snap.research_session_id, "research:t020-16");
  assert.ok(snap.persistence_snapshot.entities.some((e) => e.entity_kind === "RevisionHead"));
});

await test("T020-017 missing revision NOT_FOUND", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-17"));
  await ops.registerClaimUnit(claimInput("claim:t020-17"));
  await assert.rejects(
    () => ops.getClaimUnitRevision("claim:t020-17", "rev:nope"),
    (e) => e instanceof PersistenceError && e.code === "NOT_FOUND",
  );
});

await test("T020-018 Evidence initial revision regression", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-18"));
  const { entity } = await ops.registerEvidenceUnit({
    evidence_id: "evidence:t020-18",
    summary: "ev",
    source: {
      source_class: "laboratory",
      source_locator: "lab://t020",
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
    items: [{ item_id: "eitem:t020-18", content_summary: "obs", item_state: "active" }],
  });
  assert.equal(entity.revision_id, "rev:initial");
  const got = await ops.getEvidenceUnit("evidence:t020-18");
  assert.equal(got.identity, "evidence:t020-18");
});

await test("T020-019 Claim registration regression", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-19"));
  const { claim } = await ops.registerClaimUnit(claimInput("claim:t020-19"));
  assert.equal(claim.standing, "draft_unverified");
  const stored = await ops.getClaimUnit("claim:t020-19");
  assert.equal(stored.identity, "claim:t020-19");
});

await test("T020-020 partial-write create without head advance", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-20"));
  await ops.registerClaimUnit(claimInput("claim:t020-20"));
  const prior = await ops.getClaimUnit("claim:t020-20");
  const claim = new ClaimTransitionService().transition(
    claimFromClaimUnitPayload(prior.payload),
    standingInput({ event_id: "ste:t020-20" }),
  );
  const unit = await new CanonicalEncoder().assemble(claim);
  await ops.repository.create(
    entityFromCanonicalUnit(unit, {
      revision_id: "rev:orphan",
      predecessor_revision_id: "rev:initial",
    }),
  );
  const head = await ops.getClaimHead("claim:t020-20");
  assert.equal(head.content_version, "rev:initial");
  const orphan = await ops.getClaimUnitRevision("claim:t020-20", "rev:orphan");
  assert.equal(orphan.revision_id, "rev:orphan");
});

await test("T020-021 dual-read legacy three-segment ≡ rev:initial", async () => {
  const session = createMemoryPersistenceSession("p:t020-21");
  const enc = new CanonicalEncoder();
  const { ClaimFactory } = await import("../packages/core/dist/index.js");
  const claim = new ClaimFactory().createDraft(claimInput("claim:t020-21"));
  const unit = await enc.assemble(claim);
  // Manually store under legacy key shape by creating then the entity uses 4-segment;
  // dual-read: ensure get with rev:initial works after ensureInitialHead path.
  const entity = entityFromCanonicalUnit(unit);
  // Simulate legacy by writing three-segment key into store via create of a clone...
  // Spec: dual-read finds old keys. Seed legacy key directly:
  const legacy = {
    ...entity,
    storage_key: `persist:CanonicalUnit:ClaimUnit:claim:t020-21`,
    revision_id: undefined,
  };
  await session.repository.create(legacy);
  await session.repository.ensureInitialHead("claim:t020-21", "ClaimUnit", "rev:initial");
  const got = await session.repository.get("claim:t020-21", "CanonicalUnit", {
    unit_kind: "ClaimUnit",
    revision_id: "rev:initial",
  });
  assert.equal(got.identity, "claim:t020-21");
  const headed = await session.repository.get("claim:t020-21", "CanonicalUnit", {
    unit_kind: "ClaimUnit",
  });
  assert.equal(headed.identity, "claim:t020-21");
});

await test("T020-022 invalid revision identity rejected", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("p:t020-22"));
  await ops.registerClaimUnit(claimInput("claim:t020-22"));
  await assert.rejects(
    () =>
      ops.transitionClaimStanding({
        identity: "claim:t020-22",
        revision_id: "not-a-rev",
        expected_head_revision_id: "rev:initial",
        transition: standingInput({ event_id: "ste:t020-22" }),
      }),
    (e) => e instanceof PersistenceError && e.code === "INVALID_ID",
  );
});

console.log(`TEST-020 summary: passed=${passed} failed=${failed}`);
if (failed > 0) process.exit(1);
console.log("TEST_020_PASS");

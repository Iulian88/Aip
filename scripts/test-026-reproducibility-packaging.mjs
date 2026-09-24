/**
 * EXEC-026 focused tests — Provenance Projection & Reproducibility Packaging.
 * Run after build: node scripts/test-026-reproducibility-packaging.mjs
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  INITIAL_REVISION_ID,
  PersistenceError,
  createMemoryPersistenceSession,
} from "../packages/persistence/dist/index.js";
import { stableStringify } from "../packages/serialization/dist/index.js";
import {
  OpsError,
  createResearchOperations,
  REPRO_PACK_SCHEMA_ID,
  referenceAppMarker,
  verifyReproducibilityPackage,
} from "../apps/reference-app/dist/index.js";

const AT = "2026-09-24T12:00:00Z";
const HUMAN = "human:ops026-test";

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
    proposition: "Sprint 026 test claim",
    scope: {
      domain_context: "assay",
      bounds: "cohort",
      exclusions: "none",
    },
    created_by: HUMAN,
    created_at: AT,
  };
}

function evidenceInput(id) {
  return {
    evidence_id: id,
    summary: "Sprint 026 test evidence",
    source: {
      source_class: "laboratory",
      source_locator: `lab://assay/${id}`,
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

await test("T026-001 packageResearchRun minimal happy path", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t026-001"));
  const cid = "claim:t026-001";
  const eid = "evidence:t026-001";
  await ops.registerClaimUnit(claimInput(cid));
  await ops.registerEvidenceUnit(evidenceInput(eid));
  const r = await ops.packageResearchRun({
    package_id: "rpkg:t026-001",
    included_identities: [eid, cid],
    revision_policy: "heads_only",
    packaging_profile: "minimal",
  });
  assert.equal(r.package.schema_id, REPRO_PACK_SCHEMA_ID);
  assert.equal(r.package.packaging_profile, "minimal");
  assert.equal(r.package.ops_events, undefined);
  assert.equal(r.package.included_identities.join(","), `${cid},${eid}`);
  assert.match(r.package.content_digest, /^[0-9a-f]{64}$/);
  verifyReproducibilityPackage(r.package);
});

await test("T026-002 deterministic double export identical", async () => {
  async function run() {
    const ops = createResearchOperations(createMemoryPersistenceSession("t026-002"));
    const cid = "claim:t026-002";
    await ops.registerClaimUnit(claimInput(cid));
    const r = await ops.packageResearchRun({
      package_id: "rpkg:t026-002",
      included_identities: [cid],
      revision_policy: "heads_only",
      packaging_profile: "minimal",
    });
    return r.ser;
  }
  assert.equal(await run(), await run());
});

await test("T026-003 revision_id ASC + predecessor preserved", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t026-003"));
  const cid = "claim:t026-003";
  await ops.registerClaimUnit(claimInput(cid));
  await ops.transitionClaimStanding({
    identity: cid,
    revision_id: "rev:standing-supported-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    transition: {
      to: "supported",
      authority_agent: HUMAN,
      reason: "clinical_boundary_ack T026-003",
      decision_ref: "decision:t026-003",
      at: AT,
      event_id: "ste:t026-003",
      supported_by: ["evidence:t026-003"],
    },
  });
  const r = await ops.packageResearchRun({
    package_id: "rpkg:t026-003",
    included_identities: [cid],
    revision_policy: "full_lineage",
    packaging_profile: "minimal",
  });
  const revs = r.package.artifact_entries[0].revisions;
  assert.equal(revs.length, 2);
  assert.equal(revs[0].revision_id, "rev:initial");
  assert.equal(revs[1].revision_id, "rev:standing-supported-1");
  assert.equal(revs[1].predecessor_revision_id, "rev:initial");
});

await test("T026-004 manifest + integrity seal", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t026-004"));
  await ops.registerClaimUnit(claimInput("claim:t026-004"));
  const r = await ops.packageResearchRun({
    package_id: "rpkg:t026-004",
    included_identities: ["claim:t026-004"],
    revision_policy: "heads_only",
    packaging_profile: "minimal",
  });
  const { content_digest, ...rest } = r.package;
  const recomputed = createHash("sha256")
    .update(stableStringify(rest), "utf8")
    .digest("hex");
  assert.equal(content_digest, recomputed);
  assert.equal(r.ser, stableStringify(r.package));
});

await test("T026-005 invalid package_id OpsError", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t026-005"));
  await ops.registerClaimUnit(claimInput("claim:t026-005"));
  await assert.rejects(
    () =>
      ops.packageResearchRun({
        package_id: "not-rpkg",
        included_identities: ["claim:t026-005"],
        revision_policy: "heads_only",
        packaging_profile: "minimal",
      }),
    (e) => e instanceof OpsError && e.code === "INVALID_COMMAND_STATE",
  );
});

await test("T026-006 missing identity PersistenceError NOT_FOUND", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t026-006"));
  await assert.rejects(
    () =>
      ops.packageResearchRun({
        package_id: "rpkg:t026-006",
        included_identities: ["claim:t026-006-missing"],
        revision_policy: "heads_only",
        packaging_profile: "minimal",
      }),
    (e) => e instanceof PersistenceError && e.code === "NOT_FOUND",
  );
});

await test("T026-007 security exclusions in package SER", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t026-007"));
  await ops.registerEvidenceUnit(evidenceInput("evidence:t026-007"));
  const r = await ops.packageResearchRun({
    package_id: "rpkg:t026-007",
    included_identities: ["evidence:t026-007"],
    revision_policy: "heads_only",
    packaging_profile: "minimal",
  });
  for (const bad of ["password", "api_key", "access_token", "private_key"]) {
    assert.equal(r.ser.toLowerCase().includes(bad), false);
  }
  assert.ok(r.package.source_locators.includes("lab://assay/evidence:t026-007"));
});

await test("T026-008 export-only: verify does not restore", async () => {
  const opsA = createResearchOperations(createMemoryPersistenceSession("t026-008-a"));
  await opsA.registerClaimUnit(claimInput("claim:t026-008"));
  const r = await opsA.packageResearchRun({
    package_id: "rpkg:t026-008",
    included_identities: ["claim:t026-008"],
    revision_policy: "heads_only",
    packaging_profile: "minimal",
  });
  verifyReproducibilityPackage(r.ser);
  const opsB = createResearchOperations(createMemoryPersistenceSession("t026-008-b"));
  await assert.rejects(
    () => opsB.getClaimUnit("claim:t026-008"),
    (e) => e instanceof PersistenceError && e.code === "NOT_FOUND",
  );
  assert.equal(typeof opsB.importResearchRun, "undefined");
  assert.equal(referenceAppMarker.sprint, 26);
});

await test("T026-009 with_ops_events + axis separation", async () => {
  const ops = createResearchOperations(createMemoryPersistenceSession("t026-009"));
  const cid = "claim:t026-009";
  await ops.registerClaimUnit(claimInput(cid));
  await ops.transitionClaimStanding({
    identity: cid,
    revision_id: "rev:standing-supported-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    append_event: true,
    transition: {
      to: "supported",
      authority_agent: HUMAN,
      reason: "clinical_boundary_ack T026-009",
      decision_ref: "decision:t026-009",
      at: AT,
      event_id: "ste:t026-009",
      supported_by: ["evidence:t026-009"],
    },
  });
  const r = await ops.packageResearchRun({
    package_id: "rpkg:t026-009",
    included_identities: [cid],
    revision_policy: "heads_only",
    packaging_profile: "with_ops_events",
  });
  assert.equal(r.package.axis_declaration.scientific_provenance, true);
  assert.equal(r.package.axis_declaration.operational_audit_history, true);
  assert.ok((r.package.ops_events?.length ?? 0) >= 1);
});

await test("T026-010 regression marker + no second identity system", async () => {
  assert.equal(referenceAppMarker.secondIdentitySystem, false);
  assert.equal(referenceAppMarker.secondEventJournal, false);
  assert.equal(referenceAppMarker.sprint, 26);
});

console.log(`\nTEST-026: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;

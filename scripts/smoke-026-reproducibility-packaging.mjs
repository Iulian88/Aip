/**
 * EXEC-026 smoke — Provenance Projection & Reproducibility Packaging.
 * Writes SMOKE_026_PASS on success. Does NOT overwrite SMOKE_019…025_PASS.
 */
import { writeFileSync } from "node:fs";
import {
  REF_CORPUS_FULL,
  REF_CORPUS_OPS,
  REF_CORPUS_SCI,
  ReferenceRunner,
} from "../packages/reference-tests/dist/index.js";
import {
  ConformanceEngine,
  PROFILE_OPS,
  PROFILE_SCI,
} from "../packages/conformance/dist/index.js";
import {
  INITIAL_REVISION_ID,
  createMemoryPersistenceSession,
} from "../packages/persistence/dist/index.js";
import {
  createResearchOperations,
  referenceAppMarker,
  verifyReproducibilityPackage,
  REPRO_PACK_SCHEMA_ID,
} from "../apps/reference-app/dist/index.js";

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

const AT = "2026-09-24T12:00:00Z";
const HUMAN = "human:smoke026";

try {
  if (referenceAppMarker.sprint < 26) throw new Error("marker sprint");
  if (referenceAppMarker.secondEventJournal !== false) throw new Error("journal");
  if (referenceAppMarker.secondIdentitySystem !== false) throw new Error("identity");
  pass("marker");
} catch (e) {
  fail("marker", e);
}

try {
  const ops = createResearchOperations(createMemoryPersistenceSession("smoke:026"));
  const cid = "claim:smoke026";
  const eid = "evidence:smoke026";
  await ops.registerClaimUnit({
    claim_id: cid,
    proposition: "smoke claim",
    scope: {
      domain_context: "assay",
      bounds: "smoke",
      exclusions: "none",
    },
    created_by: HUMAN,
    created_at: AT,
  });
  await ops.registerEvidenceUnit({
    evidence_id: eid,
    summary: "smoke evidence",
    source: {
      source_class: "laboratory",
      source_locator: `lab://assay/${eid}`,
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
        item_id: "eitem:smoke026",
        content_summary: "obs",
        item_state: "active",
      },
    ],
  });
  await ops.transitionClaimStanding({
    identity: cid,
    revision_id: "rev:standing-supported-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    append_event: true,
    transition: {
      to: "supported",
      authority_agent: HUMAN,
      reason: "clinical_boundary_ack smoke026",
      decision_ref: "decision:smoke026",
      at: AT,
      event_id: "ste:smoke026",
      supported_by: [eid],
    },
  });

  const packA = await ops.packageResearchRun({
    package_id: "rpkg:smoke026",
    included_identities: [cid, eid],
    revision_policy: "full_lineage",
    packaging_profile: "with_ops_events",
  });
  const packB = await ops.packageResearchRun({
    package_id: "rpkg:smoke026",
    included_identities: [cid, eid],
    revision_policy: "full_lineage",
    packaging_profile: "with_ops_events",
  });
  if (packA.ser !== packB.ser) throw new Error("determinism");
  if (packA.package.schema_id !== REPRO_PACK_SCHEMA_ID) throw new Error("schema");
  verifyReproducibilityPackage(packA.ser);

  const claimEntry = packA.package.artifact_entries.find((e) => e.identity === cid);
  if (!claimEntry || claimEntry.revisions.length !== 2) throw new Error("lineage");
  if (claimEntry.revisions[0].revision_id !== "rev:initial") throw new Error("asc");
  if (claimEntry.revisions[1].predecessor_revision_id !== "rev:initial") {
    throw new Error("predecessor");
  }

  const listed = await ops.repository.list({
    filter: { entity_kind: "Relationship" },
  });
  if (listed.total !== 0) throw new Error("Relationship leak");

  pass("packaging");
  pass("determinism");
  pass("integrity");
  pass("lineage");
  pass("relationship-boundary");
} catch (e) {
  fail("packaging flow", e);
}

try {
  const runner = new ReferenceRunner();
  const sci = await runner.run("SCI", REF_CORPUS_SCI);
  const opsR = await runner.run("OPS", REF_CORPUS_OPS);
  const full = await runner.run("FULL", REF_CORPUS_FULL);
  if (sci.summary.pass !== 44 || sci.summary.total !== 44) {
    throw new Error(`SCI ${sci.summary.pass}/${sci.summary.total}`);
  }
  if (opsR.summary.fail > 0 || opsR.summary.error > 0) {
    throw new Error(`OPS fail=${opsR.summary.fail} err=${opsR.summary.error}`);
  }
  if (opsR.summary.pass !== REF_CORPUS_OPS.length) {
    throw new Error(`OPS pass ${opsR.summary.pass}/${REF_CORPUS_OPS.length}`);
  }
  if (full.summary.pass !== REF_CORPUS_FULL.length) {
    throw new Error(`FULL ${full.summary.pass}/${full.summary.total}`);
  }
  const conf = new ConformanceEngine();
  const sciC = conf.evaluate(sci, PROFILE_SCI);
  const opsC = conf.evaluate(full, PROFILE_OPS);
  if (sciC.summary.overall !== "COMPLIANT") throw new Error("SCI CONF");
  if (opsC.summary.overall !== "COMPLIANT") throw new Error("OPS CONF");
  pass(
    `corpus SCI=${sci.summary.pass} OPS=${opsR.summary.pass} FULL=${full.summary.pass}`,
  );
  pass("conformance");
} catch (e) {
  fail("corpus CONF", e);
}

if (process.exitCode) {
  console.error("SMOKE-026 FAILED");
  process.exit(1);
}

writeFileSync("SMOKE_026_PASS", results.join("\n") + "\n", "utf8");
console.log("SMOKE-026 PASS — wrote SMOKE_026_PASS");

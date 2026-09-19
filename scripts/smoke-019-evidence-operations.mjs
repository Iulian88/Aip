/**
 * EXEC-SPRINT-019 smoke — Evidence Operations.
 * Writes SMOKE_019_PASS only after actual success.
 */
import { writeFileSync } from "node:fs";
import { createMemoryPersistenceSession } from "../packages/persistence/dist/index.js";
import { stableStringify } from "../packages/serialization/dist/index.js";
import {
  createResearchOperations,
  referenceAppMarker,
} from "../apps/reference-app/dist/index.js";
import {
  ReferenceRunner,
  REF_CORPUS_SCI,
  REF_CORPUS_OPS,
  REF_CORPUS_FULL,
} from "../packages/reference-tests/dist/index.js";
import {
  ConformanceEngine,
  PROFILE_OPS,
} from "../packages/conformance/dist/index.js";
import { CertificationEngine } from "../packages/certification/dist/index.js";

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

const AT = "2026-09-19T12:00:00Z";
const HUMAN = "human:ops019-smoke";

try {
  if (referenceAppMarker.sprint < 19) throw new Error("marker sprint");
  if (referenceAppMarker.secondEventJournal !== false) throw new Error("journal");
  pass("marker");
} catch (e) {
  fail("marker", e);
}

try {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist:019-smoke"));
  const ws = ops.openWorkspace({ research_workspace_id: "workspace:019-smoke" });
  const session = ops.openSession({ research_session_id: "research:019-smoke" });
  ops.bindSession(ws, session);
  const claimId = "claim:019-smoke";
  const evidenceId = "evidence:019-smoke";
  const { claim } = await ops.registerClaimUnit({
    claim_id: claimId,
    proposition: "smoke claim",
    scope: { domain_context: "assay", bounds: "b", exclusions: "none" },
    created_by: HUMAN,
    created_at: AT,
  });
  const { evidence } = await ops.registerEvidenceUnit({
    evidence_id: evidenceId,
    summary: "smoke evidence",
    source: {
      source_class: "laboratory",
      source_locator: "lab://smoke/019",
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
    items: [{ item_id: "eitem:019-smoke", content_summary: "obs", item_state: "active" }],
    bears_on: [claimId],
  });
  await ops.appendResearchEvent(evidenceId, {
    event_id: "event:019-smoke",
    parent_identity: evidenceId,
    parent_class: "Evidence",
    event_type: "ops.evidence_unit_registered",
    ordinal: 0,
    at: AT,
    authority_agent: HUMAN,
    payload: { source: "smoke" },
  });
  ops.registerMember(session, {
    entity_kind: "CanonicalUnit",
    identity: evidenceId,
    unit_kind: "EvidenceUnit",
  });
  if (evidence.bears_on?.[0] !== claimId) throw new Error("bears_on");
  if (claim.supported_by && claim.supported_by.length > 0) {
    throw new Error("supported_by auto-sync");
  }
  const snap = await ops.snapshotView(session);
  if ("research_workspace_id" in snap) throw new Error("snapshot mutated");
  if (Object.keys(snap).sort().join(",") !== "member_refs,persistence_snapshot,research_session_id") {
    throw new Error("snapshot keys");
  }
  const a = await ops.exportEvidenceUnit(evidenceId);
  const b = await ops.exportEvidenceUnit(evidenceId);
  if (a !== b) throw new Error("export nondeterministic");
  const wsSnap = await ops.workspaceSnapshotView(ws);
  if (wsSnap.member_refs.length !== 1) throw new Error("workspace members");
  pass("evidence lifecycle membership snapshot export");
} catch (e) {
  fail("evidence lifecycle membership snapshot export", e);
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
    throw new Error(`OPS fail ${opsR.summary.fail} err ${opsR.summary.error}`);
  }
  if (full.summary.pass !== full.summary.total) {
    throw new Error(`FULL ${full.summary.pass}/${full.summary.total}`);
  }
  const conf = new ConformanceEngine();
  const sciC = conf.evaluate(sci);
  const opsC = conf.evaluate(full, PROFILE_OPS);
  if (sciC.summary.overall !== "COMPLIANT") throw new Error("SCI CONF");
  if (opsC.summary.overall !== "COMPLIANT") throw new Error("OPS CONF");
  const cert = new CertificationEngine();
  if (cert.certify("sess:019-sci", sciC).decision !== "CERTIFIED") {
    throw new Error("SCI CERT");
  }
  if (cert.certify("sess:019-ops", opsC).decision !== "CERTIFIED") {
    throw new Error("OPS CERT");
  }
  pass(`corpus SCI=${sci.summary.pass} OPS=${opsR.summary.pass} FULL=${full.summary.pass}`);
} catch (e) {
  fail("corpus CONF CERT", e);
}

try {
  const again = stableStringify({ x: 1 });
  if (again !== '{"x":1}') throw new Error("stable");
  pass("determinism helper");
} catch (e) {
  fail("determinism helper", e);
}

const required = [
  "PASS marker",
  "PASS evidence lifecycle membership snapshot export",
  "PASS corpus SCI=",
  "PASS determinism helper",
];
const missing = required.filter((r) => !results.some((x) => x.startsWith(r)));
if (missing.length || process.exitCode) {
  console.error("SMOKE_019 incomplete", missing, results);
  process.exit(1);
}
writeFileSync(new URL("../SMOKE_019_PASS", import.meta.url), results.join("\n") + "\n");
console.log("Wrote SMOKE_019_PASS");
console.log("SMOKE_019_PASS checks=" + results.length);

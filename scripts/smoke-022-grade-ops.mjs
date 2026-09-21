/**
 * EXEC-022 smoke — Evidence Grade OPS post-persist (Model C / Option A).
 * Writes SMOKE_022_PASS on success. Does NOT overwrite SMOKE_019/020/021_PASS.
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

const AT = "2026-09-21T12:00:00Z";
const HUMAN = "human:smoke022";

try {
  if (referenceAppMarker.sprint < 22) throw new Error("marker sprint");
  if (referenceAppMarker.secondEventJournal !== false) throw new Error("journal");
  pass("marker");
} catch (e) {
  fail("marker", e);
}

try {
  const ops = createResearchOperations(createMemoryPersistenceSession("smoke:022"));
  const evidenceId = "evidence:smoke022";
  await ops.registerEvidenceUnit({
    evidence_id: evidenceId,
    summary: "smoke 022",
    source: {
      source_class: "laboratory",
      source_locator: "lab://smoke022",
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
      { item_id: "eitem:smoke022", content_summary: "obs", item_state: "active" },
    ],
  });
  const r = await ops.assignEvidenceGrade({
    identity: evidenceId,
    revision_id: "rev:smoke-grade",
    expected_head_revision_id: INITIAL_REVISION_ID,
    append_event: true,
    assignment: {
      label: "model_output_only",
      authority_agent: HUMAN,
      reason: "smoke 022 grade",
      decision_ref: "decision:smoke022",
      at: AT,
      event_id: "gae:smoke022",
    },
  });
  if (r.evidence.grade_ref !== "SCI-003@0.1.0:model_output_only") {
    throw new Error("grade_ref");
  }
  if (r.head_revision_id !== "rev:smoke-grade") throw new Error("head");
  if (r.unit.envelope.unit_kind !== "EvidenceUnit") throw new Error("unit_kind");
  const lineage = await ops.getEvidenceLineage(evidenceId);
  if (lineage.length !== 2) throw new Error("lineage");
  const jsonA = await ops.exportEvidenceUnit(evidenceId);
  const jsonB = await ops.exportEvidenceUnit(evidenceId);
  if (jsonA !== jsonB) throw new Error("nondeterministic");
  if (!jsonA.includes("SCI-003@0.1.0:model_output_only")) throw new Error("export");
  const events = await ops.getEvents(evidenceId);
  if (!events.some((e) => e.event_type === "ops.evidence_grade_assignment_revision")) {
    throw new Error("event");
  }
  try {
    await ops.repository.getHead(evidenceId, "GradeDesignationUnit");
    throw new Error("GradeDesignationUnit must not exist");
  } catch (e) {
    if (e?.code !== "NOT_FOUND") throw e;
  }
  pass("grade-ops");
  pass("determinism");
  pass("event");
  pass("option-a-no-grade-designation-unit");
} catch (e) {
  fail("grade-ops flow", e);
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
  console.error("SMOKE_022_FAIL");
  process.exit(1);
}
writeFileSync("SMOKE_022_PASS", results.join("\n") + "\n", "utf8");
console.log("SMOKE_022_PASS");

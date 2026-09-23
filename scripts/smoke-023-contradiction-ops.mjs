/**
 * EXEC-023 smoke — Contradiction OPS under Model C.
 * Writes SMOKE_023_PASS on success. Does NOT overwrite SMOKE_019/020/021/022_PASS.
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

const AT = "2026-09-23T12:00:00Z";
const HUMAN = "human:smoke023";

try {
  if (referenceAppMarker.sprint < 23) throw new Error("marker sprint");
  if (referenceAppMarker.secondEventJournal !== false) throw new Error("journal");
  pass("marker");
} catch (e) {
  fail("marker", e);
}

try {
  const ops = createResearchOperations(createMemoryPersistenceSession("smoke:023"));
  const cid = "contradiction:smoke023";
  await ops.registerContradictionUnit({
    contradiction_id: cid,
    summary: "smoke 023",
    involved_claims: ["claim:smoke023-a", "claim:smoke023-b"],
    overlap_statement: "overlap",
    incompatibility_statement: "incompatible under bounds",
    provenance: {
      completeness: "complete",
      recorded_at: AT,
      custody_agent: HUMAN,
      method_summary: "smoke",
    },
    created_by: HUMAN,
    created_at: AT,
    evidence_refs: ["evidence:smoke023"],
  });
  const r = await ops.transitionContradictionRecordState({
    identity: cid,
    revision_id: "rev:smoke-archived",
    expected_head_revision_id: INITIAL_REVISION_ID,
    append_event: true,
    transition: {
      to: "unresolved_archived",
      authority_agent: HUMAN,
      reason: "smoke 023 archive",
      decision_ref: "decision:smoke023",
      at: AT,
      event_id: "crte:smoke023",
    },
  });
  if (r.contradiction.record_state !== "unresolved_archived") {
    throw new Error("record_state");
  }
  if (r.head_revision_id !== "rev:smoke-archived") throw new Error("head");
  if (r.unit.envelope.unit_kind !== "ContradictionUnit") throw new Error("unit_kind");
  const involves = r.unit.envelope.references.filter((x) => x.role === "involves");
  if (involves.length !== 2) throw new Error("involves");
  const lineage = await ops.getContradictionLineage(cid);
  if (lineage.length !== 2) throw new Error("lineage");
  const jsonA = await ops.exportContradictionUnit(cid);
  const jsonB = await ops.exportContradictionUnit(cid);
  if (jsonA !== jsonB) throw new Error("nondeterministic");
  const events = await ops.getEvents(cid);
  if (!events.some((e) => e.event_type === "ops.contradiction_record_state_revision")) {
    throw new Error("event");
  }
  const listed = await ops.repository.list({
    filter: { entity_kind: "Relationship" },
  });
  if (listed.total !== 0) throw new Error("Relationship leak");
  pass("contradiction-ops");
  pass("determinism");
  pass("event");
  pass("relationship-boundary");
} catch (e) {
  fail("contradiction-ops flow", e);
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
  console.error("SMOKE_023_FAIL");
  process.exit(1);
}
writeFileSync("SMOKE_023_PASS", results.join("\n") + "\n", "utf8");
console.log("SMOKE_023_PASS");

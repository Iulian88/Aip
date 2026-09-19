/**
 * EXEC-SPRINT-013 smoke — CONF-001 Conformance Engine.
 * Consumes ReferenceReport evidence; does not implement CERT / OPS.
 * Writes SMOKE_013_PASS.
 */
import { writeFileSync } from "node:fs";
import {
  ReferenceRunner,
  referenceFixtures,
  reportToJson,
} from "../packages/reference-tests/dist/index.js";
import {
  ConformanceEngine,
  ConformanceSession,
  REQUIRED_AUTHORITIES,
  conformanceReportToJson,
  ingestReferenceReport,
  renderConformanceReport,
} from "../packages/conformance/dist/index.js";

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

// Produce evidence via Reference Runner (CONF consumes; smoke may generate once).
const runner = new ReferenceRunner();
const refReport = await runner.run("SciROS Reference Test Suite", referenceFixtures);

// --- Conformance Engine ---
try {
  const engine = new ConformanceEngine();
  const report = engine.evaluate(refReport);
  if (report.authority !== "CONF-001") throw new Error("authority pin");
  if (report.dimensions.length !== 7) throw new Error("dimension count");
  if (report.summary.overall !== "COMPLIANT") {
    throw new Error(`overall ${report.summary.overall}\n${renderConformanceReport(report)}`);
  }
  pass("Conformance Engine");
} catch (e) {
  fail("Conformance Engine", e);
}

// --- Evidence ingestion ---
try {
  const session = new ConformanceSession();
  const evidence = session.ingest(refReport);
  if (evidence.source !== "ReferenceReport") throw new Error("source");
  if (evidence.engine !== "REF-TEST-001") throw new Error("engine");
  if (evidence.observations.length !== refReport.fixtures.length) {
    throw new Error("observation count");
  }
  const again = ingestReferenceReport(refReport);
  if (again.results.length !== evidence.results.length) throw new Error("reingest");
  // Engine must not mutate reference report
  const before = reportToJson(refReport);
  new ConformanceEngine().evaluate(refReport);
  if (reportToJson(refReport) !== before) throw new Error("mutated evidence");
  pass("Evidence ingestion");
} catch (e) {
  fail("Evidence ingestion", e);
}

const engine = new ConformanceEngine();
const report = engine.evaluate(refReport);

// --- Deterministic report ---
try {
  const a = conformanceReportToJson(report);
  const b = conformanceReportToJson(engine.evaluate(refReport));
  if (a !== b) throw new Error("re-evaluate differs");
  if ("generated_at" in report || "timestamp" in report) {
    throw new Error("wall-clock field present");
  }
  pass("Deterministic report");
} catch (e) {
  fail("Deterministic report", e);
}

// --- Authority verdicts ---
try {
  if (report.authorities.length !== REQUIRED_AUTHORITIES.length) {
    throw new Error("authority row count");
  }
  for (const id of REQUIRED_AUTHORITIES) {
    const row = report.authorities.find((a) => a.authority === id);
    if (!row) throw new Error(`missing ${id}`);
    if (row.verdict !== "COMPLIANT") {
      throw new Error(`${id} verdict ${row.verdict}`);
    }
  }
  pass("Authority verdicts");
} catch (e) {
  fail("Authority verdicts", e);
}

// --- JSON report ---
try {
  const json = engine.evaluateToJson(refReport);
  const parsed = JSON.parse(json);
  if (parsed.authority !== "CONF-001") throw new Error("json authority");
  if (!Array.isArray(parsed.dimensions)) throw new Error("json dimensions");
  if (parsed.summary.overall !== "COMPLIANT") throw new Error("json overall");
  pass("JSON report");
} catch (e) {
  fail("JSON report", e);
}

// --- Human report ---
try {
  const text = engine.evaluateToText(refReport);
  for (const section of ["DIMENSIONS", "AUTHORITY VERDICTS", "OVERALL", "SUMMARY"]) {
    if (!text.includes(section)) throw new Error(`missing ${section}`);
  }
  if (!text.includes("COMPLIANT")) throw new Error("no COMPLIANT");
  pass("Human report");
} catch (e) {
  fail("Human report", e);
}

const required = [
  "PASS Conformance Engine",
  "PASS Evidence ingestion",
  "PASS Deterministic report",
  "PASS Authority verdicts",
  "PASS JSON report",
  "PASS Human report",
];
const missing = required.filter((r) => !results.includes(r));
if (missing.length || process.exitCode) {
  console.error("SMOKE incomplete", missing, results);
  process.exit(1);
}
writeFileSync(new URL("../SMOKE_013_PASS", import.meta.url), results.join("\n") + "\n");
console.log("Wrote SMOKE_013_PASS");

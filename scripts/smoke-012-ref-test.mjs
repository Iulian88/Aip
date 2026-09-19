/**
 * EXEC-SPRINT-012 smoke — Reference Test framework (REF-TEST-001/002/003).
 * Verifies fixture loading, runner, deterministic execution, reports,
 * JSON / Canonical / Processor / round-trip fixtures. Writes SMOKE_012_PASS.
 */
import { writeFileSync } from "node:fs";
import {
  ReferenceRunner,
  referenceFixtures,
  reportToJson,
  renderReport,
  REFERENCE_SCENARIOS,
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

// --- fixture loading ---
try {
  if (referenceFixtures.length < 40) {
    throw new Error(`corpus too small: ${referenceFixtures.length}`);
  }
  const ids = new Set(referenceFixtures.map((f) => f.fixture_id));
  if (ids.size !== referenceFixtures.length) throw new Error("duplicate ids");
  for (const f of referenceFixtures) {
    if (!/^REF-[A-Z]+-[0-9]{3}$/.test(f.fixture_id)) {
      throw new Error(`bad id: ${f.fixture_id}`);
    }
    if (!REFERENCE_SCENARIOS.includes(f.scenario)) {
      throw new Error(`bad scenario: ${f.scenario}`);
    }
  }
  const scenariosCovered = new Set(referenceFixtures.map((f) => f.scenario));
  for (const s of REFERENCE_SCENARIOS) {
    if (!scenariosCovered.has(s)) throw new Error(`scenario uncovered: ${s}`);
  }
  pass("fixture loading");
} catch (e) {
  fail("fixture loading", e);
}

// --- runner ---
const runner = new ReferenceRunner();
let report = null;
try {
  report = await runner.run("SciROS Reference Test Suite", referenceFixtures);
  if (report.summary.total !== referenceFixtures.length) throw new Error("total");
  if (report.summary.fail !== 0 || report.summary.error !== 0) {
    throw new Error(
      `failures: fail=${report.summary.fail} error=${report.summary.error}\n` +
        renderReport(report),
    );
  }
  const sorted = [...report.fixtures.map((r) => r.fixture_id)].sort();
  if (JSON.stringify(sorted) !== JSON.stringify(report.fixtures.map((r) => r.fixture_id))) {
    throw new Error("fixture order not stable-sorted");
  }
  pass("runner");
} catch (e) {
  fail("runner", e);
}

// --- deterministic execution (two full runs, byte-identical reports) ---
try {
  const second = await runner.run("SciROS Reference Test Suite", referenceFixtures);
  if (reportToJson(report) !== reportToJson(second)) {
    throw new Error("re-run report differs");
  }
  pass("deterministic execution");
} catch (e) {
  fail("deterministic execution", e);
}

// --- reports (four sections) ---
try {
  if (!Array.isArray(report.fixtures) || report.fixtures.length < 1) {
    throw new Error("fixture report missing");
  }
  if (!Array.isArray(report.scenarios) || report.scenarios.length !== 9) {
    throw new Error("scenario report missing");
  }
  if (typeof report.summary?.total !== "number") throw new Error("summary missing");
  if (!Array.isArray(report.compliance) || report.compliance.length < 1) {
    throw new Error("compliance summary missing");
  }
  if (!report.compliance.every((c) => c.compliant === true)) {
    throw new Error("non-compliant authority present");
  }
  const text = renderReport(report);
  for (const section of [
    "FIXTURE REPORT",
    "SCENARIO REPORT",
    "COMPLIANCE SUMMARY",
    "SUMMARY",
  ]) {
    if (!text.includes(section)) throw new Error(`render missing ${section}`);
  }
  pass("reports");
} catch (e) {
  fail("reports", e);
}

function requireAllPass(name, prefix) {
  try {
    const matching = report.fixtures.filter((r) => r.fixture_id.startsWith(prefix));
    if (matching.length < 1) throw new Error(`no ${prefix} fixtures`);
    for (const r of matching) {
      if (r.status !== "PASS") throw new Error(`${r.fixture_id}: ${r.status}`);
    }
    pass(name);
  } catch (e) {
    fail(name, e);
  }
}

requireAllPass("JSON fixtures", "REF-SER-");
requireAllPass("Canonical fixtures", "REF-CANON-");
requireAllPass("Processor fixtures", "REF-PROC-");
requireAllPass("round-trip fixtures", "REF-RT-");

const required = [
  "PASS fixture loading",
  "PASS runner",
  "PASS deterministic execution",
  "PASS reports",
  "PASS JSON fixtures",
  "PASS Canonical fixtures",
  "PASS Processor fixtures",
  "PASS round-trip fixtures",
];
const missing = required.filter((r) => !results.includes(r));
if (missing.length || process.exitCode) {
  console.error("SMOKE incomplete", missing, results);
  process.exit(1);
}
writeFileSync(new URL("../SMOKE_012_PASS", import.meta.url), results.join("\n") + "\n");
console.log("Wrote SMOKE_012_PASS");

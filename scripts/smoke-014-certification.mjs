/**
 * EXEC-SPRINT-014 smoke — CERT-001 / CERT-002 Certification Engine.
 * Consumes ConformanceReport only. Writes SMOKE_014_PASS.
 */
import { writeFileSync } from "node:fs";
import {
  ReferenceRunner,
  referenceFixtures,
} from "../packages/reference-tests/dist/index.js";
import {
  ConformanceEngine,
  conformanceReportToJson,
} from "../packages/conformance/dist/index.js";
import {
  CertificationEngine,
  CertificationSession,
  CERTIFICATION_DECISIONS,
  certificationReportToJson,
  ingestConformanceReport,
  renderCertificationReport,
} from "../packages/certification/dist/index.js";

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

const SESSION = "sess:ref-impl-014";

// Produce ConformanceReport evidence (CERT consumes; harness generates once).
const refReport = await new ReferenceRunner().run(
  "SciROS Reference Test Suite",
  referenceFixtures,
);
const confReport = new ConformanceEngine().evaluate(refReport);

// --- Certification Engine ---
try {
  const engine = new CertificationEngine();
  const report = engine.certify(SESSION, confReport);
  if (report.authority !== "CERT-001") throw new Error("CERT-001 pin");
  if (report.session_authority !== "CERT-002") throw new Error("CERT-002 pin");
  if (report.criteria.length !== 5) throw new Error("criteria count");
  if (!CERTIFICATION_DECISIONS.includes(report.decision)) {
    throw new Error(`bad decision ${report.decision}`);
  }
  if (report.decision !== "CERTIFIED" && report.decision !== "CERTIFIED_WITH_OBSERVATIONS") {
    throw new Error(
      `expected CERTIFIED*, got ${report.decision}\n${renderCertificationReport(report)}`,
    );
  }
  pass("Certification Engine");
} catch (e) {
  fail("Certification Engine", e);
}

// --- Evidence ingestion ---
try {
  const session = new CertificationSession();
  session.open(SESSION);
  const evidence = session.ingest(confReport);
  if (evidence.source !== "ConformanceReport") throw new Error("source");
  if (evidence.conformance_authority !== "CONF-001") throw new Error("conf pin");
  const again = ingestConformanceReport(confReport);
  if (again.suite !== evidence.suite) throw new Error("reingest");
  const before = conformanceReportToJson(confReport);
  new CertificationEngine().certify(SESSION, confReport);
  if (conformanceReportToJson(confReport) !== before) throw new Error("mutated");
  pass("Evidence ingestion");
} catch (e) {
  fail("Evidence ingestion", e);
}

const engine = new CertificationEngine();
const report = engine.certify(SESSION, confReport);

// --- Decision generation ---
try {
  if (!report.decision) throw new Error("no decision");
  if (report.summary.decision !== report.decision) throw new Error("summary mismatch");
  if (report.criteria.some((c) => !c.passed) && report.decision === "CERTIFIED") {
    throw new Error("CERTIFIED with failed criteria");
  }
  pass("Decision generation");
} catch (e) {
  fail("Decision generation", e);
}

// --- Certificate generation ---
try {
  const cert = report.certificate;
  if (!cert.certificate_id.startsWith("cert:")) throw new Error("id prefix");
  if (cert.decision !== report.decision) throw new Error("cert decision");
  if (!Array.isArray(cert.scope) || cert.scope.length < 1) throw new Error("scope");
  if (!Array.isArray(cert.authority_coverage)) throw new Error("coverage");
  if (typeof cert.evidence_summary !== "string" || cert.evidence_summary.length < 1) {
    throw new Error("evidence summary");
  }
  if (cert.conformance_suite !== confReport.suite) throw new Error("suite");
  pass("Certificate generation");
} catch (e) {
  fail("Certificate generation", e);
}

// --- JSON report ---
try {
  const json = engine.certifyToJson(SESSION, confReport);
  const parsed = JSON.parse(json);
  if (parsed.authority !== "CERT-001") throw new Error("json authority");
  if (!parsed.certificate?.certificate_id) throw new Error("json certificate");
  if (parsed.decision !== report.decision) throw new Error("json decision");
  pass("JSON report");
} catch (e) {
  fail("JSON report", e);
}

// --- Human report ---
try {
  const text = engine.certifyToText(SESSION, confReport);
  for (const section of ["DECISION", "CRITERIA", "OBSERVATIONS", "CERTIFICATE", "SUMMARY"]) {
    if (!text.includes(section)) throw new Error(`missing ${section}`);
  }
  pass("Human report");
} catch (e) {
  fail("Human report", e);
}

// --- Deterministic output ---
try {
  const a = certificationReportToJson(report);
  const b = certificationReportToJson(engine.certify(SESSION, confReport));
  if (a !== b) throw new Error("re-certify differs");
  if ("generated_at" in report || "timestamp" in report) {
    throw new Error("wall-clock field");
  }
  if ("generated_at" in report.certificate) throw new Error("cert wall-clock");
  pass("Deterministic output");
} catch (e) {
  fail("Deterministic output", e);
}

const required = [
  "PASS Certification Engine",
  "PASS Evidence ingestion",
  "PASS Decision generation",
  "PASS Certificate generation",
  "PASS JSON report",
  "PASS Human report",
  "PASS Deterministic output",
];
const missing = required.filter((r) => !results.includes(r));
if (missing.length || process.exitCode) {
  console.error("SMOKE incomplete", missing, results);
  process.exit(1);
}
writeFileSync(new URL("../SMOKE_014_PASS", import.meta.url), results.join("\n") + "\n");
console.log("Wrote SMOKE_014_PASS");

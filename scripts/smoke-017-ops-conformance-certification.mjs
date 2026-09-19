/**
 * EXEC-SPRINT-017 smoke — OPS → REF → CONF(profile) → CERT chain.
 * Writes SMOKE_017_PASS only after actual success.
 */
import { writeFileSync } from "node:fs";
import {
  ReferenceRunner,
  REF_CORPUS_FULL,
  REF_CORPUS_OPS,
  REF_CORPUS_SCI,
  referenceFixtures,
} from "../packages/reference-tests/dist/index.js";
import {
  ConformanceEngine,
  PROFILE_OPS,
  PROFILE_SCI,
  REQUIRED_AUTHORITIES,
  REQUIRED_AUTHORITIES_OPS,
  conformanceReportToJson,
  renderConformanceReport,
} from "../packages/conformance/dist/index.js";
import {
  CertificationEngine,
  CERTIFICATION_SCOPE,
  certificationReportToJson,
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

const runner = new ReferenceRunner();
const confEngine = new ConformanceEngine();
const certEngine = new CertificationEngine();

// --- Guard: global SCI REQUIRED_AUTHORITIES not contaminated ---
try {
  if (REQUIRED_AUTHORITIES.includes("OPS-001")) {
    throw new Error("REQUIRED_AUTHORITIES contaminated with OPS-001");
  }
  if (REQUIRED_AUTHORITIES.includes("PERSIST-001")) {
    throw new Error("REQUIRED_AUTHORITIES contaminated with PERSIST-001");
  }
  if (!REQUIRED_AUTHORITIES_OPS.includes("OPS-001")) {
    throw new Error("REQUIRED_AUTHORITIES_OPS missing OPS-001");
  }
  if (REQUIRED_AUTHORITIES_OPS.includes("PERSIST-001")) {
    throw new Error("REQUIRED_AUTHORITIES_OPS includes PERSIST-001");
  }
  if (referenceFixtures.length !== 44) {
    throw new Error(`SCI corpus size ${referenceFixtures.length}`);
  }
  if (REF_CORPUS_SCI.length !== 44) throw new Error("REF_CORPUS_SCI");
  if (REF_CORPUS_FULL.length !== 44 + REF_CORPUS_OPS.length) {
    throw new Error("REF_CORPUS_FULL size");
  }
  pass("global REQUIRED_* isolation");
} catch (e) {
  fail("global REQUIRED_* isolation", e);
}

// --- SCI regression chain ---
let sciRef;
let sciConf;
let sciCert;
try {
  sciRef = await runner.run("SciROS Reference Test Suite", REF_CORPUS_SCI);
  if (sciRef.summary.pass !== 44) throw new Error(`SCI ${sciRef.summary.pass}/44`);
  sciConf = confEngine.evaluate(sciRef);
  if (sciConf.profile_id !== PROFILE_SCI) throw new Error(sciConf.profile_id);
  if (sciConf.summary.overall !== "COMPLIANT") {
    throw new Error(renderConformanceReport(sciConf));
  }
  sciCert = certEngine.certify("sess:ref-impl-017-sci", sciConf);
  if (
    sciCert.decision !== "CERTIFIED" &&
    sciCert.decision !== "CERTIFIED_WITH_OBSERVATIONS"
  ) {
    throw new Error(sciCert.decision);
  }
  if (sciCert.certificate.scope.includes("OPS-001")) {
    throw new Error("SCI certificate scope includes OPS-001");
  }
  if (sciCert.certificate.scope.join(",") !== CERTIFICATION_SCOPE.join(",")) {
    throw new Error("SCI CERTIFICATION_SCOPE mutated");
  }
  pass("SCI regression REF→CONF→CERT");
} catch (e) {
  fail("SCI regression REF→CONF→CERT", e);
}

// --- Guard: OPS-only must not certify under OPS profile ---
try {
  const opsOnly = await runner.run("OPS-only (invalid CONF target)", REF_CORPUS_OPS);
  const badConf = confEngine.evaluate(opsOnly, PROFILE_OPS);
  if (badConf.summary.overall === "COMPLIANT") {
    throw new Error("OPS-only corpus COMPLIANT under OPS profile");
  }
  pass("OPS-only corpus not CONF target");
} catch (e) {
  fail("OPS-only corpus not CONF target", e);
}

// --- Legitimate OPS chain: FULL → CONF(OPS) → CERT ---
let fullRef;
let opsConf;
let opsCert;
try {
  fullRef = await runner.run("SciROS Full Reference Corpus", REF_CORPUS_FULL);
  if (fullRef.engine !== "REF-TEST-001") throw new Error("fabricated engine");
  if (fullRef.summary.fail > 0 || fullRef.summary.error > 0) {
    throw new Error(
      `FULL fail=${fullRef.summary.fail} error=${fullRef.summary.error}`,
    );
  }
  const opsResults = fullRef.fixtures.filter((f) =>
    f.fixture_id.startsWith("REF-OPS-"),
  );
  if (opsResults.length !== REF_CORPUS_OPS.length) {
    throw new Error("REF-OPS results missing from ReferenceReport");
  }
  if (!opsResults.every((r) => r.status === "PASS")) {
    throw new Error("REF-OPS non-PASS in FULL report");
  }

  opsConf = confEngine.evaluate(fullRef, PROFILE_OPS);
  if (opsConf.profile_id !== PROFILE_OPS) {
    throw new Error(`profile mismatch ${opsConf.profile_id}`);
  }
  if (opsConf.summary.overall !== "COMPLIANT") {
    throw new Error(renderConformanceReport(opsConf));
  }
  const opsAuth = opsConf.authorities.find((a) => a.authority === "OPS-001");
  if (!opsAuth || opsAuth.verdict !== "COMPLIANT") {
    throw new Error("OPS-001 not COMPLIANT");
  }

  opsCert = certEngine.certify("sess:ref-impl-017-ops", opsConf);
  if (
    opsCert.decision !== "CERTIFIED" &&
    opsCert.decision !== "CERTIFIED_WITH_OBSERVATIONS"
  ) {
    throw new Error(
      `${opsCert.decision}\n${renderCertificationReport(opsCert)}`,
    );
  }
  if (!opsCert.certificate.scope.includes("OPS-001")) {
    throw new Error("OPS certificate missing OPS-001 scope");
  }
  if (!opsCert.certificate.evidence_summary.includes(`profile=${PROFILE_OPS}`)) {
    throw new Error("certificate not bound to OPS profile");
  }
  pass("OPS chain REF-OPS→ReferenceRunner→CONF→CERT");
} catch (e) {
  fail("OPS chain REF-OPS→ReferenceRunner→CONF→CERT", e);
}

// --- Determinism ---
try {
  const a = conformanceReportToJson(confEngine.evaluate(fullRef, PROFILE_OPS));
  const b = conformanceReportToJson(confEngine.evaluate(fullRef, PROFILE_OPS));
  if (a !== b) throw new Error("CONF JSON differs");
  const c1 = certificationReportToJson(
    certEngine.certify("sess:ref-impl-017-ops", opsConf),
  );
  const c2 = certificationReportToJson(
    certEngine.certify("sess:ref-impl-017-ops", opsConf),
  );
  if (c1 !== c2) throw new Error("CERT JSON differs");
  pass("deterministic repeated evaluation");
} catch (e) {
  fail("deterministic repeated evaluation", e);
}

// --- No second engines / fabricated evidence ---
try {
  const confMod = await import("../packages/conformance/dist/index.js");
  const certMod = await import("../packages/certification/dist/index.js");
  if (Object.keys(confMod).some((k) => /OPSConformance/i.test(k))) {
    throw new Error("second Conformance engine export");
  }
  if (Object.keys(certMod).some((k) => /OPSCertification/i.test(k))) {
    throw new Error("second Certification engine export");
  }
  // Explicit profile required for OPS — default remains SCI
  const defaulted = confEngine.evaluate(fullRef);
  if (defaulted.profile_id !== PROFILE_SCI) {
    throw new Error("default profile not SCI");
  }
  pass("single engines + default SCI profile");
} catch (e) {
  fail("single engines + default SCI profile", e);
}

const required = [
  "PASS global REQUIRED_* isolation",
  "PASS SCI regression REF→CONF→CERT",
  "PASS OPS-only corpus not CONF target",
  "PASS OPS chain REF-OPS→ReferenceRunner→CONF→CERT",
  "PASS deterministic repeated evaluation",
  "PASS single engines + default SCI profile",
];
const missing = required.filter((r) => !results.includes(r));
if (missing.length || process.exitCode) {
  console.error("SMOKE_017 incomplete", missing, results);
  process.exit(1);
}

writeFileSync(
  new URL("../SMOKE_017_PASS", import.meta.url),
  results.join("\n") + "\n",
);
console.log("Wrote SMOKE_017_PASS");
console.log("SMOKE_017_PASS checks=" + results.length);

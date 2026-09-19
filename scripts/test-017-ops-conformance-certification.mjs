/**
 * EXEC-SPRINT-017 test — OPS Conformance / Certification integration.
 * Deterministic checks for SPEC-017 profile model + REF-OPS corpus.
 */
import {
  ReferenceRunner,
  REF_CORPUS_FULL,
  REF_CORPUS_OPS,
  REF_CORPUS_SCI,
  referenceFixtures,
  reportToJson,
} from "../packages/reference-tests/dist/index.js";
import {
  ConformanceEngine,
  PROFILE_OPS,
  PROFILE_SCI,
  REQUIRED_AUTHORITIES,
  REQUIRED_AUTHORITIES_OPS,
  REQUIRED_FIXTURE_PREFIXES,
  REQUIRED_FIXTURE_PREFIXES_OPS,
  conformanceReportToJson,
  resolveConformanceProfile,
} from "../packages/conformance/dist/index.js";
import {
  CertificationEngine,
  CERTIFICATION_SCOPE,
  CERTIFICATION_SCOPE_OPS,
  certificationReportToJson,
  certificationScopeForProfile,
} from "../packages/certification/dist/index.js";

const results = [];
function pass(id, name) {
  results.push(`PASS ${id} ${name}`);
  console.log(`PASS ${id} ${name}`);
}
function fail(id, name, err) {
  results.push(`FAIL ${id} ${name}: ${err?.message ?? err}`);
  console.error(`FAIL ${id} ${name}`, err);
  process.exitCode = 1;
}

const SESSION_SCI = "sess:ref-impl-017-sci";
const SESSION_OPS = "sess:ref-impl-017-ops";
const runner = new ReferenceRunner();
const conf = new ConformanceEngine();
const cert = new CertificationEngine();

// T017-001 corpus construction
try {
  if (REF_CORPUS_SCI.length !== 44) throw new Error(`SCI=${REF_CORPUS_SCI.length}`);
  if (referenceFixtures !== REF_CORPUS_SCI && referenceFixtures.length !== 44) {
    throw new Error("referenceFixtures SCI alias broken");
  }
  if (REF_CORPUS_OPS.length < 1) throw new Error("OPS empty");
  if (REF_CORPUS_FULL.length !== REF_CORPUS_SCI.length + REF_CORPUS_OPS.length) {
    throw new Error("FULL length");
  }
  for (let i = 0; i < REF_CORPUS_SCI.length; i++) {
    if (REF_CORPUS_FULL[i] !== REF_CORPUS_SCI[i]) throw new Error(`SCI order @${i}`);
  }
  for (let i = 0; i < REF_CORPUS_OPS.length; i++) {
    if (REF_CORPUS_FULL[REF_CORPUS_SCI.length + i] !== REF_CORPUS_OPS[i]) {
      throw new Error(`OPS order @${i}`);
    }
  }
  const ids = REF_CORPUS_FULL.map((f) => f.fixture_id);
  if (new Set(ids).size !== ids.length) throw new Error("duplicate fixture ids");
  if (!REF_CORPUS_OPS.every((f) => f.fixture_id.startsWith("REF-OPS-"))) {
    throw new Error("OPS prefix");
  }
  pass("T017-001", "corpus SCI/OPS/FULL construction");
} catch (e) {
  fail("T017-001", "corpus SCI/OPS/FULL construction", e);
}

// T017-002 profile registry
try {
  const sci = resolveConformanceProfile();
  if (sci.profile_id !== PROFILE_SCI) throw new Error("default not SCI");
  const ops = resolveConformanceProfile(PROFILE_OPS);
  if (ops.profile_id !== PROFILE_OPS) throw new Error("OPS id");
  if (REQUIRED_AUTHORITIES.includes("OPS-001")) {
    throw new Error("global SCI REQUIRED_AUTHORITIES contaminated");
  }
  if (REQUIRED_AUTHORITIES.includes("PERSIST-001")) {
    throw new Error("PERSIST-001 in SCI");
  }
  if (!REQUIRED_AUTHORITIES_OPS.includes("OPS-001")) throw new Error("OPS auth");
  if (REQUIRED_AUTHORITIES_OPS.includes("PERSIST-001")) {
    throw new Error("PERSIST-001 in OPS");
  }
  if (REQUIRED_FIXTURE_PREFIXES.includes("REF-OPS-")) {
    throw new Error("SCI prefixes contaminated");
  }
  if (!REQUIRED_FIXTURE_PREFIXES_OPS.includes("REF-OPS-")) {
    throw new Error("OPS prefixes missing REF-OPS-");
  }
  if (REQUIRED_AUTHORITIES_OPS.length !== REQUIRED_AUTHORITIES.length + 1) {
    throw new Error("OPS authorities length");
  }
  pass("T017-002", "profile selection + no global contamination");
} catch (e) {
  fail("T017-002", "profile selection + no global contamination", e);
}

// T017-003 SCI reference run
const sciRef = await runner.run("SciROS Reference Test Suite", REF_CORPUS_SCI);
try {
  if (sciRef.summary.total !== 44) throw new Error(`total=${sciRef.summary.total}`);
  if (sciRef.summary.pass !== 44) throw new Error(`pass=${sciRef.summary.pass}`);
  if (sciRef.summary.fail !== 0 || sciRef.summary.error !== 0) {
    throw new Error("SCI failures");
  }
  pass("T017-003", "SCI Reference Tests 44/44");
} catch (e) {
  fail("T017-003", "SCI Reference Tests 44/44", e);
}

// T017-004 OPS fixtures via ReferenceRunner
const opsRef = await runner.run("SciROS OPS Reference Corpus", REF_CORPUS_OPS);
try {
  if (opsRef.engine !== "REF-TEST-001") throw new Error("engine");
  if (opsRef.summary.fail > 0 || opsRef.summary.error > 0) {
    throw new Error(
      `OPS fail=${opsRef.summary.fail} error=${opsRef.summary.error}`,
    );
  }
  if (opsRef.summary.pass !== REF_CORPUS_OPS.length) {
    throw new Error(`OPS pass=${opsRef.summary.pass}`);
  }
  if (!opsRef.compliance.some((c) => c.authority === "OPS-001" && c.compliant)) {
    throw new Error("OPS-001 compliance missing");
  }
  pass("T017-004", "OPS fixtures via ReferenceRunner");
} catch (e) {
  fail("T017-004", "OPS fixtures via ReferenceRunner", e);
}

// T017-005 FULL corpus
const fullRef = await runner.run("SciROS Full Reference Corpus", REF_CORPUS_FULL);
try {
  if (fullRef.summary.total !== REF_CORPUS_FULL.length) {
    throw new Error(`FULL total=${fullRef.summary.total}`);
  }
  if (fullRef.summary.fail > 0 || fullRef.summary.error > 0) {
    throw new Error("FULL failures");
  }
  pass("T017-005", "FULL corpus PASS");
} catch (e) {
  fail("T017-005", "FULL corpus PASS", e);
}

// T017-006 SCI conformance default profile
const sciConf = conf.evaluate(sciRef);
try {
  if (sciConf.profile_id !== PROFILE_SCI) throw new Error(sciConf.profile_id);
  if (sciConf.summary.overall !== "COMPLIANT") {
    throw new Error(sciConf.summary.overall);
  }
  if (sciConf.authorities.some((a) => a.authority === "OPS-001")) {
    throw new Error("SCI report lists OPS-001");
  }
  if (sciConf.authorities.length !== REQUIRED_AUTHORITIES.length) {
    throw new Error("SCI authority rows");
  }
  pass("T017-006", "SCI Conformance default profile");
} catch (e) {
  fail("T017-006", "SCI Conformance default profile", e);
}

// T017-007 OPS conformance explicit profile
const opsConf = conf.evaluate(fullRef, PROFILE_OPS);
try {
  if (opsConf.profile_id !== PROFILE_OPS) throw new Error(opsConf.profile_id);
  if (opsConf.summary.overall !== "COMPLIANT") {
    throw new Error(opsConf.summary.overall);
  }
  const opsAuth = opsConf.authorities.find((a) => a.authority === "OPS-001");
  if (!opsAuth || opsAuth.verdict !== "COMPLIANT") throw new Error("OPS-001 verdict");
  if (opsConf.authorities.length !== REQUIRED_AUTHORITIES_OPS.length) {
    throw new Error("OPS authority rows");
  }
  pass("T017-007", "OPS Conformance explicit profile");
} catch (e) {
  fail("T017-007", "OPS Conformance explicit profile", e);
}

// T017-008 OPS-only corpus must not COMPLIANT under OPS profile
try {
  const bad = conf.evaluate(opsRef, PROFILE_OPS);
  if (bad.summary.overall === "COMPLIANT") {
    throw new Error("OPS-only corpus must not be COMPLIANT under OPS profile");
  }
  pass("T017-008", "OPS-only corpus rejected for OPS profile");
} catch (e) {
  fail("T017-008", "OPS-only corpus rejected for OPS profile", e);
}

// T017-009 SCI certification
const sciCert = cert.certify(SESSION_SCI, sciConf);
try {
  if (sciCert.decision !== "CERTIFIED" && sciCert.decision !== "CERTIFIED_WITH_OBSERVATIONS") {
    throw new Error(sciCert.decision);
  }
  if (sciCert.certificate.scope.join(",") !== CERTIFICATION_SCOPE.join(",")) {
    throw new Error("SCI scope mutated");
  }
  if (sciCert.certificate.scope.includes("OPS-001")) {
    throw new Error("SCI cert includes OPS-001");
  }
  pass("T017-009", "SCI Certification compatible");
} catch (e) {
  fail("T017-009", "SCI Certification compatible", e);
}

// T017-010 OPS certification binding
const opsCert = cert.certify(SESSION_OPS, opsConf);
try {
  if (opsCert.decision !== "CERTIFIED" && opsCert.decision !== "CERTIFIED_WITH_OBSERVATIONS") {
    throw new Error(opsCert.decision);
  }
  if (!opsCert.certificate.scope.includes("OPS-001")) {
    throw new Error("OPS scope missing OPS-001");
  }
  if (
    certificationScopeForProfile(PROFILE_OPS).join(",") !==
    CERTIFICATION_SCOPE_OPS.join(",")
  ) {
    throw new Error("scope helper mismatch");
  }
  if (!opsCert.certificate.evidence_summary.includes(`profile=${PROFILE_OPS}`)) {
    throw new Error("evidence_summary profile");
  }
  pass("T017-010", "OPS Certification profile binding");
} catch (e) {
  fail("T017-010", "OPS Certification profile binding", e);
}

// T017-011 determinism
try {
  const a = conformanceReportToJson(conf.evaluate(fullRef, PROFILE_OPS));
  const b = conformanceReportToJson(conf.evaluate(fullRef, PROFILE_OPS));
  if (a !== b) throw new Error("CONF re-eval differs");
  const c1 = certificationReportToJson(cert.certify(SESSION_OPS, opsConf));
  const c2 = certificationReportToJson(cert.certify(SESSION_OPS, opsConf));
  if (c1 !== c2) throw new Error("CERT re-run differs");
  const r1 = reportToJson(await runner.run("SciROS Full Reference Corpus", REF_CORPUS_FULL));
  const r2 = reportToJson(await runner.run("SciROS Full Reference Corpus", REF_CORPUS_FULL));
  if (r1 !== r2) throw new Error("FULL report differs");
  pass("T017-011", "deterministic repeated execution");
} catch (e) {
  fail("T017-011", "deterministic repeated execution", e);
}

// T017-012 single engine classes
try {
  if (typeof ConformanceEngine !== "function") throw new Error("no ConformanceEngine");
  if (typeof CertificationEngine !== "function") throw new Error("no CertificationEngine");
  // Guard against parallel class names in exports
  const confKeys = Object.keys(await import("../packages/conformance/dist/index.js"));
  const certKeys = Object.keys(await import("../packages/certification/dist/index.js"));
  if (confKeys.some((k) => /OPSConformance/i.test(k))) throw new Error("OPSConformance export");
  if (certKeys.some((k) => /OPSCertification/i.test(k))) {
    throw new Error("OPSCertification export");
  }
  pass("T017-012", "single ConformanceEngine + CertificationEngine");
} catch (e) {
  fail("T017-012", "single ConformanceEngine + CertificationEngine", e);
}

const required = results.filter((r) => r.startsWith("PASS ")).length;
console.log(`TEST-017 summary pass=${required} recorded=${results.length}`);
if (process.exitCode) {
  console.error("TEST-017 FAILED", results.filter((r) => r.startsWith("FAIL")));
  process.exit(1);
}
console.log("TEST_017_PASS");

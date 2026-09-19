/**
 * EXEC-SPRINT-015 smoke — Persistence Foundation.
 * Verifies repository contract, round-trips, immutability, transactions,
 * and that Reference Tests / Conformance / Certification remain functional.
 * Writes SMOKE_015_PASS.
 */
import { writeFileSync } from "node:fs";
import {
  ClaimFactory,
  EvidenceFactory,
  ContradictionFactory,
  NegativeResultFactory,
  VerificationFactory,
  ClaimTransitionService,
  CLINICAL_BOUNDARY_ACK,
} from "../packages/core/dist/index.js";
import { CanonicalEncoder } from "../packages/encoding/dist/index.js";
import { JsonEncoder, JsonDecoder } from "../packages/serialization/dist/index.js";
import {
  ReferenceRunner,
  referenceFixtures,
} from "../packages/reference-tests/dist/index.js";
import { ConformanceEngine } from "../packages/conformance/dist/index.js";
import {
  CertificationEngine,
  certificationReportToJson,
} from "../packages/certification/dist/index.js";
import {
  PersistenceError,
  RepositoryPersistencePort,
  assertEntityIntegrity,
  createMemoryPersistenceSession,
  entityFromArtifact,
  entityFromCanonicalUnit,
  entityFromCoreObject,
  entitiesEqual,
  stableStringify,
} from "../packages/persistence/dist/index.js";

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

const AT = "2026-07-18T12:00:00Z";
const AT_NEXT = "2026-07-18T12:01:00Z";
const HUMAN = "human:persist-reviewer1";
const DECISION = "dec:persist015";
const SCOPE = { domain_context: "assay", bounds: "cohort P", exclusions: "none" };

try {
  const session = createMemoryPersistenceSession("sess:persist-015");
  if (!session.repository) throw new Error("no repository");
  pass("persistence package loads");
  pass("repository creation");
} catch (e) {
  fail("persistence package loads", e);
  fail("repository creation", e);
}

const session = createMemoryPersistenceSession("sess:persist-015");
const repo = session.repository;
const enc = new CanonicalEncoder();
const claims = new ClaimFactory();
const evidence = new EvidenceFactory();

const claim = claims.createDraft({
  claim_id: "claim:persist015",
  proposition: "Persistence foundation claim",
  scope: SCOPE,
  created_by: HUMAN,
  created_at: AT,
  supported_by: ["evidence:persist015"],
});

const ev = evidence.createDraft({
  evidence_id: "evidence:persist015",
  summary: "Persistence evidence",
  source: {
    source_class: "laboratory",
    source_locator: "lab://assay/persist015",
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
  items: [{ item_id: "eitem:persist015", content_summary: "obs", item_state: "active" }],
  bears_on: ["claim:persist015"],
});

const contradiction = new ContradictionFactory().createOpen({
  contradiction_id: "contradiction:persist015",
  summary: "Conflict",
  overlap_statement: "overlap",
  incompatibility_statement: "incompatible",
  involved_claims: ["claim:persist015", "claim:persist015b"],
  created_by: HUMAN,
  created_at: AT,
  provenance: {
    completeness: "complete",
    recorded_at: AT,
    custody_agent: HUMAN,
    method_summary: "manual",
  },
});

const nr = new NegativeResultFactory().createRegistered(
  {
    negative_result_id: "negresult:persist015",
    summary: "Absence",
    description: "not observed",
    expected_observation: "signal",
    observed_absence: "no signal",
    scope: SCOPE,
    protocol_ref: "protocol:p015",
    sensitivity_context: "nominal",
    claim_refs: ["claim:persist015"],
    created_by: HUMAN,
    created_at: AT,
    provenance: {
      completeness: "complete",
      recorded_at: AT,
      custody_agent: HUMAN,
      method_summary: "assay",
    },
  },
  {
    to: "registered",
    authority_agent: HUMAN,
    reason: "clinical_boundary_ack register NR",
    decision_ref: DECISION,
    at: AT_NEXT,
  },
);

const verification = new VerificationFactory().createPlanned({
  verification_id: "verification:persist015",
  summary: "Check",
  description: "planned verify",
  scope: SCOPE,
  protocol_ref: "protocol:p015",
  verification_method: "reproduction",
  verification_context: "lab",
  verification_rationale: "matches",
  claim_refs: ["claim:persist015"],
  evidence_refs: ["evidence:persist015"],
  created_by: HUMAN,
  created_at: AT,
  provenance: {
    completeness: "complete",
    recorded_at: AT,
    custody_agent: HUMAN,
    method_summary: "plan",
  },
});

const claimUnit = await enc.assemble(claim);
const evUnit = await enc.assemble(ev);
const cUnit = await enc.assemble(contradiction);
const nrUnit = await enc.assemble(nr);
const vUnit = await enc.assemble(verification);
const gradeUnit = await enc.assemble({ kind: "grade", evidence: ev });

const supportedClaim = new ClaimTransitionService().transition(claim, {
  to: "supported",
  authority_agent: HUMAN,
  reason: `${CLINICAL_BOUNDARY_ACK} persistence event fixture`,
  decision_ref: DECISION,
  at: AT_NEXT,
});
const supportedUnit = await enc.assemble(supportedClaim);

// --- create / get / exists ---
try {
  const entity = entityFromCanonicalUnit(claimUnit);
  await repo.create(entity);
  const got = await repo.get("claim:persist015", "CanonicalUnit");
  if (!entitiesEqual(entity, got)) throw new Error("round-trip mismatch");
  if (!(await repo.exists("claim:persist015", "CanonicalUnit"))) {
    throw new Error("exists false");
  }
  pass("create");
  pass("get");
  pass("exists");
} catch (e) {
  fail("create/get/exists", e);
}

// --- list + deterministic ordering ---
try {
  await repo.create(entityFromCanonicalUnit(evUnit));
  await repo.create(entityFromCanonicalUnit(cUnit));
  const page = await repo.list({ filter: { entity_kind: "CanonicalUnit" } });
  const ids = page.items.map((i) => i.identity);
  const sorted = [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  if (JSON.stringify(ids) !== JSON.stringify(sorted)) throw new Error("order");
  const page2 = await repo.list({ filter: { entity_kind: "CanonicalUnit" } });
  if (stableStringify(page) !== stableStringify(page2)) throw new Error("list nondeterministic");
  pass("list");
  pass("deterministic ordering");
} catch (e) {
  fail("list/ordering", e);
}

// --- canonical round-trip (all kinds) ---
try {
  for (const unit of [claimUnit, evUnit, cUnit, nrUnit, vUnit, gradeUnit, supportedUnit]) {
    const e = entityFromCanonicalUnit(unit);
    const unitKind = unit.envelope.unit_kind;
    const rt = createMemoryPersistenceSession(
      `sess:rt-${unitKind}-${unit.envelope.identity}-${unit.envelope.content_version}`,
    );
    await rt.repository.create(e);
    const got = await rt.repository.get(e.identity, e.entity_kind, { unit_kind: unitKind });
    assertEntityIntegrity(got);
    if (!entitiesEqual(e, got)) throw new Error(`mismatch ${e.identity}:${unitKind}`);
    if (got.content_version !== unit.envelope.content_version) {
      throw new Error("version");
    }
    if (got.ontology_ref !== unit.envelope.ontology_ref) throw new Error("ontology");
    if (got.spec_ref !== unit.envelope.spec_ref) throw new Error("spec");
    if (got.encoding_authority !== "ENC-001") throw new Error("enc auth");
    if (got.intact !== true) throw new Error("intact");
  }
  // Core object path
  const coreEnt = entityFromCoreObject("Claim", "claim_id", claim);
  const coreSession = createMemoryPersistenceSession("sess:core");
  await coreSession.repository.create(coreEnt);
  const coreGot = await coreSession.repository.get(claim.claim_id, "Claim");
  if (coreGot.identity !== claim.claim_id) throw new Error("core id");
  pass("canonical round-trip");
  pass("version preservation");
  pass("authority preservation");
  pass("integrity preservation");
} catch (e) {
  fail("canonical/version/authority/integrity", e);
}

// --- relationship round-trip (GradeDesignation grades) ---
try {
  const gradeEnt = entityFromCanonicalUnit(gradeUnit);
  const gSession = createMemoryPersistenceSession("sess:grades");
  await gSession.repository.create(gradeEnt);
  const got = await gSession.repository.get(gradeEnt.identity, "CanonicalUnit", {
    unit_kind: "GradeDesignationUnit",
  });
  const grades = got.references.filter((r) => r.relationship_type === "grades");
  if (grades.length !== 1) throw new Error(`grades count ${grades.length}`);
  if (grades[0].target_identity !== "evidence:persist015") throw new Error("grades target");
  if (grades[0].ordinal !== 0) throw new Error("ordinal");
  // claim supported_by
  const claimEnt = entityFromCanonicalUnit(claimUnit);
  const cSession = createMemoryPersistenceSession("sess:rels");
  await cSession.repository.create(claimEnt);
  const cGot = await cSession.repository.get("claim:persist015", "CanonicalUnit", {
    unit_kind: "ClaimUnit",
  });
  const supported = cGot.references.filter((r) => r.relationship_type === "supported_by");
  if (supported.length !== 1 || supported[0].target_identity !== "evidence:persist015") {
    throw new Error("supported_by");
  }
  pass("relationship round-trip");
} catch (e) {
  fail("relationship round-trip", e);
}

// --- event round-trip ---
try {
  const eSession = createMemoryPersistenceSession("sess:events");
  const ent = entityFromCanonicalUnit(supportedUnit);
  await eSession.repository.create(ent);
  const events = await eSession.repository.getEvents("claim:persist015");
  if (events.length < 1) throw new Error("no events");
  if (events[0].event_id !== supportedUnit.envelope.events[0].event_id) {
    throw new Error("event id");
  }
  if (events[0].to_state !== "supported") throw new Error("to_state");
  // append additional event
  await eSession.repository.appendEvent("claim:persist015", {
    event_id: "ste:persist015-extra",
    parent_identity: "claim:persist015",
    parent_class: "Claim",
    event_type: "transition:contested",
    at: "2026-07-18T12:02:00Z",
    from_state: "supported",
    to_state: "contested",
    authority_agent: HUMAN,
    reason: "append journal",
    payload: { note: "extra" },
    ordinal: 99,
  });
  const all = await eSession.repository.getEvents("claim:persist015");
  if (all.length !== 2) throw new Error("append count");
  if (all[0].ordinal > all[1].ordinal) throw new Error("event order");
  pass("event round-trip");
} catch (e) {
  fail("event round-trip", e);
}

// --- immutable rejection ---
try {
  const ent = await repo.get("claim:persist015", "CanonicalUnit");
  const mutated = {
    ...ent,
    payload: { ...ent.payload, tampered: true },
  };
  let threw = false;
  try {
    await repo.replace(mutated, { expected_version: ent.content_version });
  } catch (err) {
    threw = err instanceof PersistenceError && err.code === "IMMUTABLE_ENTITY";
  }
  if (!threw) throw new Error("expected IMMUTABLE_ENTITY");
  const again = await repo.get("claim:persist015", "CanonicalUnit");
  if (!entitiesEqual(ent, again)) throw new Error("state changed");
  // delete rejected
  threw = false;
  try {
    await repo.delete("claim:persist015", "CanonicalUnit");
  } catch (err) {
    threw = err instanceof PersistenceError && err.code === "DELETE_NOT_PERMITTED";
  }
  if (!threw) throw new Error("expected DELETE_NOT_PERMITTED");
  pass("immutable rejection where applicable");
} catch (e) {
  fail("immutable rejection", e);
}

// --- concurrency CONFLICT ---
try {
  const ent = await repo.get("claim:persist015", "CanonicalUnit");
  let threw = false;
  try {
    await repo.replace(ent, { expected_version: "9.9.9" });
  } catch (err) {
    threw = err instanceof PersistenceError && err.code === "CONFLICT";
  }
  if (!threw) throw new Error("expected CONFLICT");
} catch (e) {
  fail("concurrency", e);
}

// --- transactions ---
try {
  const tSession = createMemoryPersistenceSession("sess:tx");
  const base = entityFromCanonicalUnit(claimUnit);
  await tSession.repository.create(base);

  const tx = await tSession.beginTransaction();
  const extra = entityFromCanonicalUnit(evUnit);
  await tx.repository.create(extra);
  await tx.rollback();
  if (await tSession.repository.exists("evidence:persist015", "CanonicalUnit")) {
    throw new Error("rollback leaked");
  }

  const tx2 = await tSession.beginTransaction();
  await tx2.repository.create(extra);
  await tx2.commit();
  if (!(await tSession.repository.exists("evidence:persist015", "CanonicalUnit"))) {
    throw new Error("commit missing");
  }
  pass("transaction commit");
  pass("transaction rollback");
} catch (e) {
  fail("transactions", e);
}

// --- corruption rejection ---
try {
  let threw = false;
  try {
    await repo.get("claim:missing-xyz", "CanonicalUnit");
  } catch (err) {
    threw = err instanceof PersistenceError && err.code === "NOT_FOUND";
  }
  if (!threw) throw new Error("NOT_FOUND");

  threw = false;
  try {
    entityFromCanonicalUnit({
      intact: true,
      envelope: {
        encoding_authority: "ENC-001",
        encoding_version: "9.9.9",
        unit_kind: "ClaimUnit",
        ontology_ref: "SCI-000@0.1.0",
        spec_ref: "SCI-001@0.1.4",
        identity: "claim:badver",
        content_version: "1.0.0",
        references: [],
        events: [],
        content: {},
      },
    });
  } catch (err) {
    threw = err instanceof PersistenceError && err.code === "UNSUPPORTED_VERSION";
  }
  if (!threw) throw new Error("UNSUPPORTED_VERSION");

  threw = false;
  try {
    entityFromCanonicalUnit({
      intact: true,
      envelope: {
        encoding_authority: "OTHER",
        encoding_version: "1.0.0",
        unit_kind: "ClaimUnit",
        ontology_ref: "SCI-000@0.1.0",
        spec_ref: "SCI-001@0.1.4",
        identity: "claim:badauth",
        content_version: "1.0.0",
        references: [],
        events: [],
        content: {},
      },
    });
  } catch (err) {
    threw = err instanceof PersistenceError && err.code === "INVALID_AUTHORITY";
  }
  if (!threw) throw new Error("INVALID_AUTHORITY");

  // tampered integrity
  const good = entityFromCanonicalUnit(claimUnit);
  const tampered = {
    ...good,
    intact: false,
    payload: { ...good.payload, intact: false },
  };
  threw = false;
  try {
    assertEntityIntegrity(tampered);
  } catch (err) {
    threw = err instanceof PersistenceError && err.code === "INTEGRITY_FAILURE";
  }
  if (!threw) throw new Error("INTEGRITY_FAILURE");

  // event to missing parent
  const orphanSession = createMemoryPersistenceSession("sess:orphan");
  threw = false;
  try {
    await orphanSession.repository.appendEvent("claim:ghost", {
      event_id: "ste:ghost",
      parent_identity: "claim:ghost",
      event_type: "x",
      payload: {},
      ordinal: 0,
    });
  } catch (err) {
    threw = err instanceof PersistenceError && err.code === "NOT_FOUND";
  }
  if (!threw) throw new Error("orphan event");

  pass("corruption rejection");
} catch (e) {
  fail("corruption rejection", e);
}

// --- deterministic snapshot ---
try {
  const s1 = await repo.snapshot();
  const s2 = await repo.snapshot();
  if (stableStringify(s1) !== stableStringify(s2)) throw new Error("snapshot nondet");
  const restored = await repo.restore(s1);
  if (stableStringify(restored.entities) !== stableStringify(s1.entities)) {
    throw new Error("restore entities");
  }
  // snapshot → restore → snapshot
  const s3 = await repo.snapshot();
  if (stableStringify(s3.entities) !== stableStringify(s1.entities)) {
    throw new Error("restore loop entities");
  }
  if (stableStringify(s3.event_journal) !== stableStringify(s1.event_journal)) {
    throw new Error("restore loop events");
  }
  pass("deterministic snapshot");
} catch (e) {
  fail("deterministic snapshot", e);
}

// --- repeated identical operation ---
try {
  const a = stableStringify(await repo.list({ filter: {} }));
  const b = stableStringify(await repo.list({ filter: {} }));
  if (a !== b) throw new Error("repeat differs");
  pass("repeated identical operation");
} catch (e) {
  fail("repeated identical operation", e);
}

// --- JSON serialized artifact persistence ---
try {
  const json = new JsonEncoder().encode(claimUnit);
  const doc = entityFromArtifact("SerializedDocument", "claim:persist015:json", "1.0.0", {
    profile: "SER-JSON-001",
    text: json,
  });
  const jSession = createMemoryPersistenceSession("sess:json");
  await jSession.repository.create(doc);
  const got = await jSession.repository.get("claim:persist015:json", "SerializedDocument");
  const decoded = new JsonDecoder().decode(got.payload.text);
  if (decoded.envelope.identity !== "claim:persist015") throw new Error("json decode");
} catch (e) {
  fail("serialized document", e);
}

// --- P-001: RepositoryPersistencePort unit_kind discriminator (CODE-AUDIT-013) ---
try {
  const port = new RepositoryPersistencePort();
  await port.persist(evUnit);
  await port.persist(gradeUnit);

  const evidenceGot = await port.repository.get("evidence:persist015", "CanonicalUnit", {
    unit_kind: "EvidenceUnit",
  });
  const gradeGot = await port.repository.get("evidence:persist015", "CanonicalUnit", {
    unit_kind: "GradeDesignationUnit",
  });

  if ((evidenceGot.payload.envelope.unit_kind) !== "EvidenceUnit") {
    throw new Error("wrong-target EvidenceUnit");
  }
  if ((gradeGot.payload.envelope.unit_kind) !== "GradeDesignationUnit") {
    throw new Error("wrong-target GradeDesignationUnit");
  }
  if (evidenceGot.storage_key === gradeGot.storage_key) {
    throw new Error("storage keys collided");
  }
  if (!evidenceGot.storage_key.includes("EvidenceUnit")) {
    throw new Error("evidence key missing unit_kind");
  }
  if (!gradeGot.storage_key.includes("GradeDesignationUnit")) {
    throw new Error("grade key missing unit_kind");
  }

  // Idempotent re-persist via public port (must not cross-target)
  await port.persist(evUnit);
  await port.persist(gradeUnit);
  const evidenceAgain = await port.repository.get("evidence:persist015", "CanonicalUnit", {
    unit_kind: "EvidenceUnit",
  });
  if ((evidenceAgain.payload.envelope.unit_kind) !== "EvidenceUnit") {
    throw new Error("re-persist wrong target");
  }

  // Ambiguous lookup without unit_kind must not silently pick one
  let threw = false;
  try {
    await port.repository.get("evidence:persist015", "CanonicalUnit");
  } catch (err) {
    threw = err instanceof PersistenceError && err.code === "INVALID_ID";
  }
  if (!threw) throw new Error("expected INVALID_ID on ambiguous lookup");

  pass("EvidenceUnit / GradeDesignationUnit shared identity");
  pass("unit_kind discriminator");
  pass("public PersistencePort lookup");
  pass("no wrong-target lookup");
} catch (e) {
  fail("P-001 PersistencePort unit_kind", e);
}

// --- evidence chain: persist → retrieve → REF → CONF → CERT ---
try {
  const chain = createMemoryPersistenceSession("sess:chain");
  await chain.repository.create(entityFromCanonicalUnit(claimUnit));
  const retrieved = await chain.repository.get("claim:persist015", "CanonicalUnit");
  assertEntityIntegrity(retrieved);

  const refReport = await new ReferenceRunner().run(
    "SciROS Reference Test Suite",
    referenceFixtures,
  );
  if (refReport.summary.fail !== 0 || refReport.summary.error !== 0) {
    throw new Error("ref suite failed");
  }
  if (refReport.summary.total !== 44) throw new Error("not 44");
  pass("existing reference-test suite remains 44/44");

  const conf = new ConformanceEngine().evaluate(refReport);
  if (conf.summary.overall !== "COMPLIANT") throw new Error("conf");
  const confEnt = entityFromArtifact(
    "ConformanceReport",
    "conf:persist015",
    "1.0.0",
    JSON.parse(stableStringify(conf)),
  );
  await chain.repository.create(confEnt);
  const confGot = await chain.repository.get("conf:persist015", "ConformanceReport");
  if (confGot.payload.summary.overall !== "COMPLIANT") throw new Error("conf persist");
  pass("Conformance remains functional");

  const cert = new CertificationEngine().certify("sess:cert-persist015", conf);
  if (cert.decision !== "CERTIFIED" && cert.decision !== "CERTIFIED_WITH_OBSERVATIONS") {
    throw new Error(`cert ${cert.decision}`);
  }
  const certEnt = entityFromArtifact(
    "CertificationReport",
    cert.session_id,
    "1.0.0",
    JSON.parse(certificationReportToJson(cert)),
  );
  await chain.repository.create(certEnt);
  const certGot = await chain.repository.get(cert.session_id, "CertificationReport");
  if (certGot.payload.decision !== cert.decision) throw new Error("cert decision");
  if (certGot.payload.certificate.certificate_id !== cert.certificate.certificate_id) {
    throw new Error("cert id");
  }
  const certOnly = entityFromArtifact(
    "CertificationCertificate",
    cert.certificate.certificate_id,
    "1.0.0",
    JSON.parse(stableStringify(cert.certificate)),
  );
  await chain.repository.create(certOnly);
  const c2 = await chain.repository.get(cert.certificate.certificate_id, "CertificationCertificate");
  if (c2.payload.decision !== cert.certificate.decision) throw new Error("certificate");
  if (JSON.stringify(c2.payload.scope) !== JSON.stringify(cert.certificate.scope)) {
    throw new Error("scope");
  }
  pass("Certification remains functional");
} catch (e) {
  fail("evidence chain / conf / cert", e);
}

const required = [
  "PASS persistence package loads",
  "PASS repository creation",
  "PASS create",
  "PASS get",
  "PASS exists",
  "PASS list",
  "PASS deterministic ordering",
  "PASS canonical round-trip",
  "PASS relationship round-trip",
  "PASS event round-trip",
  "PASS version preservation",
  "PASS authority preservation",
  "PASS integrity preservation",
  "PASS immutable rejection where applicable",
  "PASS transaction commit",
  "PASS transaction rollback",
  "PASS corruption rejection",
  "PASS deterministic snapshot",
  "PASS repeated identical operation",
  "PASS EvidenceUnit / GradeDesignationUnit shared identity",
  "PASS unit_kind discriminator",
  "PASS public PersistencePort lookup",
  "PASS no wrong-target lookup",
  "PASS existing reference-test suite remains 44/44",
  "PASS Conformance remains functional",
  "PASS Certification remains functional",
];
const missing = required.filter((r) => !results.includes(r));
if (missing.length || process.exitCode) {
  console.error("SMOKE incomplete", missing, results);
  process.exit(1);
}
writeFileSync(new URL("../SMOKE_015_PASS", import.meta.url), results.join("\n") + "\n");
console.log("Wrote SMOKE_015_PASS");

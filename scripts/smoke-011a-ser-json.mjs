import { writeFileSync } from "node:fs";
import {
  ClaimFactory,
  EvidenceFactory,
  ContradictionFactory,
  NegativeResultFactory,
  VerificationFactory,
} from "../packages/core/dist/index.js";
import { CanonicalEncoder } from "../packages/encoding/dist/index.js";
import {
  JsonEncoder,
  JsonDecoder,
  isJsonError,
  JSON_ENC_PIN,
  JSON_PROFILE_PIN,
  createSerializationFrameworkPorts,
} from "../packages/serialization/dist/index.js";
import {
  bindSerializationFrameworkHook,
  createStageHandlers,
  AuthorityGate,
  AuthorityEngine,
  PinEngine,
  ValidationEngine,
  VersionEngine,
  TransitionEngine,
  EventEngine,
  InMemoryEventStore,
  unavailableEncodingHook,
  unavailablePersistenceHook,
  SystemClock,
  StaticIdentityProvider,
  noopLogger,
  noopMetrics,
  noopTracer,
  defaultProcessorConfiguration,
  withAuthoritySet,
} from "../packages/processor/dist/index.js";

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

const at = "2026-07-16T12:00:00Z";
const human = "human:curator1";
const claims = new ClaimFactory();
const evidence = new EvidenceFactory();
const contradictions = new ContradictionFactory();
const negatives = new NegativeResultFactory();
const verifications = new VerificationFactory();
const enc = new CanonicalEncoder();
const encoder = new JsonEncoder();
const decoder = new JsonDecoder();

const claim = claims.createDraft({
  claim_id: "claim:serjson011a",
  proposition: "SER-JSON-001A compliance claim",
  scope: { domain_context: "assay", bounds: "cohort C", exclusions: "none" },
  created_by: human,
  created_at: at,
  supported_by: ["evidence:serjson011a"],
});

const ev = evidence.createDraft({
  evidence_id: "evidence:serjson011a",
  summary: "Smoke evidence",
  source: {
    source_class: "laboratory",
    source_locator: "lab://assay/serjson011a",
    source_state: "declared",
  },
  provenance: {
    completeness: "complete",
    obtained_at: at,
    transform_summary: "none",
    custody_agent: human,
  },
  created_by: human,
  created_at: at,
  items: [{ item_id: "eitem:serjson011a", content_summary: "obs", item_state: "active" }],
  bears_on: ["claim:serjson011a"],
});

const contradiction = contradictions.createOpen({
  contradiction_id: "contradiction:serjson011a",
  summary: "Conflict",
  overlap_statement: "overlap",
  incompatibility_statement: "incompatible",
  involved_claims: ["claim:serjson011a", "claim:serjson011b"],
  created_by: human,
  created_at: at,
  provenance: {
    completeness: "complete",
    recorded_at: at,
    custody_agent: human,
    method_summary: "manual",
  },
});

const nr = negatives.createRegistered(
  {
    negative_result_id: "negresult:serjson011a",
    summary: "Absence",
    description: "not observed",
    expected_observation: "signal",
    observed_absence: "no signal",
    scope: { domain_context: "assay", bounds: "cohort C", exclusions: "none" },
    protocol_ref: "protocol:p1",
    sensitivity_context: "nominal",
    claim_refs: ["claim:serjson011a"],
    created_by: human,
    created_at: at,
    provenance: {
      completeness: "complete",
      recorded_at: at,
      custody_agent: human,
      method_summary: "assay",
    },
  },
  {
    to: "registered",
    authority_agent: human,
    reason: "clinical_boundary_ack register NR",
    decision_ref: "dec:nr011a",
    at: "2026-07-16T12:01:00Z",
  },
);

const verification = verifications.createPlanned({
  verification_id: "verification:serjson011a",
  summary: "Check",
  description: "planned verify",
  scope: { domain_context: "assay", bounds: "cohort C", exclusions: "none" },
  protocol_ref: "protocol:p1",
  verification_method: "reproduction",
  verification_context: "lab",
  verification_rationale: "matches",
  claim_refs: ["claim:serjson011a"],
  evidence_refs: ["evidence:serjson011a"],
  created_by: human,
  created_at: at,
  provenance: {
    completeness: "complete",
    recorded_at: at,
    custody_agent: human,
    method_summary: "plan",
  },
});

const claimUnit = await enc.assemble(claim);
const evUnit = await enc.assemble(ev);
const cUnit = await enc.assemble(contradiction);
const nrUnit = await enc.assemble(nr);
const vUnit = await enc.assemble(verification);
const gradeUnit = await enc.assemble({ kind: "grade", evidence: ev });

// --- P-001 ENC pin ---
try {
  const text = encoder.encode(claimUnit);
  const obj = JSON.parse(text);
  if (obj.sciros_enc !== "ENC-001@1.0") throw new Error(`got ${obj.sciros_enc}`);
  if (JSON_ENC_PIN !== "ENC-001@1.0") throw new Error("const");
  const round = decoder.decode(text);
  if (round.envelope.encoding_version !== "1.0.0") throw new Error("norm");
  if (round.envelope.encoding_authority !== "ENC-001") throw new Error("auth");
  // also accept already-normalized profile pin form
  const alt = { ...obj, sciros_enc: "ENC-001@1.0" };
  const r2 = decoder.decode(alt);
  if (r2.envelope.encoding_version !== "1.0.0") throw new Error("norm2");
  pass("ENC pin normalization");
} catch (e) {
  fail("ENC pin normalization", e);
}

// --- P-002 JP-3 ---
try {
  const withNull = {
    ...claimUnit,
    envelope: {
      ...claimUnit.envelope,
      content: { ...claimUnit.envelope.content, retraction_reason: null, ghost: undefined },
    },
  };
  const obj = JSON.parse(encoder.encode(withNull));
  if ("retraction_reason" in obj) throw new Error("null emitted");
  if ("ghost" in obj) throw new Error("undefined emitted");
  if (obj.ethics_constraint_marker !== "non_clinical") throw new Error("sentinel lost");
  pass("JP-3 null omission");
} catch (e) {
  fail("JP-3 null omission", e);
}

// --- P-003 unknown root ---
try {
  const good = JSON.parse(encoder.encode(claimUnit));
  decoder.decode(good);
  let threw = false;
  try {
    decoder.decode({ ...good, unknown_root_field: "x" });
  } catch (err) {
    threw = isJsonError(err) && err.code === "INVALID_JSON_PROFILE";
  }
  if (!threw) throw new Error("expected INVALID_JSON_PROFILE");
  // intact must also be rejected (not a profile root member)
  threw = false;
  try {
    decoder.decode({ ...good, intact: true });
  } catch (err) {
    threw = isJsonError(err) && err.code === "INVALID_JSON_PROFILE";
  }
  if (!threw) throw new Error("intact should be unknown root");
  pass("Unknown root rejection");
} catch (e) {
  fail("Unknown root rejection", e);
}

// --- P-004 GradeDesignation ---
try {
  const a = encoder.encode(gradeUnit);
  const obj = JSON.parse(a);
  if (obj.sciros_unit !== "GradeDesignationUnit") throw new Error("kind");
  if (!Array.isArray(obj.grades) || obj.grades[0] !== "evidence:serjson011a") {
    throw new Error(`grades missing: ${JSON.stringify(obj.grades)}`);
  }
  const mid = decoder.decode(a);
  const grades = mid.envelope.references.filter((r) => r.role === "grades");
  if (grades.length !== 1 || grades[0].identity !== "evidence:serjson011a") {
    throw new Error("grades ref lost");
  }
  const b = encoder.encode(mid);
  if (a !== b) throw new Error("non-det grade");
  pass("GradeDesignation round-trip");
} catch (e) {
  fail("GradeDesignation round-trip", e);
}

// --- P-005 no intact ---
try {
  const obj = JSON.parse(encoder.encode(claimUnit));
  if ("intact" in obj) throw new Error("intact exported");
  const unit = decoder.decode(obj);
  if (unit.intact !== true) throw new Error("intact restore");
  pass("no intact export");
} catch (e) {
  fail("no intact export", e);
}

// --- P-006 pin skew ---
try {
  const good = JSON.parse(encoder.encode(claimUnit));
  let threw = false;
  try {
    decoder.decode({ ...good, ontology_ref: "SCI-999@9.9.9" });
  } catch (err) {
    threw = isJsonError(err) && err.code === "INVALID_JSON_PROFILE";
  }
  if (!threw) throw new Error("bad ontology");
  threw = false;
  try {
    decoder.decode({ ...good, spec_ref: "SCI-002@0.1.0" }); // wrong owner for Claim
  } catch (err) {
    threw = isJsonError(err) && err.code === "INVALID_JSON_PROFILE";
  }
  if (!threw) throw new Error("bad spec");
  decoder.decode(good);
  pass("Invalid ontology pin reject");
  pass("Invalid spec pin reject");
} catch (e) {
  fail("pin skew", e);
}

// --- Regression all unit kinds ---
try {
  for (const [name, unit] of [
    ["Claim", claimUnit],
    ["Evidence", evUnit],
    ["Contradiction", cUnit],
    ["Negative Result", nrUnit],
    ["Verification", vUnit],
    ["GradeDesignation", gradeUnit],
  ]) {
    const a = encoder.encode(unit);
    const mid = decoder.decode(a);
    const b = encoder.encode(mid);
    if (a !== b) throw new Error(`${name} non-det`);
    if (mid.envelope.identity !== unit.envelope.identity) throw new Error(`${name} id`);
    if (JSON.parse(a).sciros_profile !== JSON_PROFILE_PIN) throw new Error(`${name} pin`);
  }
  pass("regression all units");
} catch (e) {
  fail("regression all units", e);
}

// --- S05 / S06 / S17 ---
try {
  const catalog = {
    sealed: true,
    pinManifestId: "smoke-011a",
    frozenAtIso: at,
    pins: [
      { id: "SER-001", version: "1.0.0", status: "FROZEN_APPROVED" },
      { id: "SER-JSON-001", version: "1.0.0", status: "FROZEN_APPROVED" },
      { id: "ENC-001", version: "1.0.0", status: "FROZEN_APPROVED" },
    ],
  };
  const authorityGate = new AuthorityGate();
  const serHook = bindSerializationFrameworkHook();
  const handlers = createStageHandlers({
    authorityEngine: new AuthorityEngine(),
    pinEngine: new PinEngine(),
    authorityGate,
    validationEngine: new ValidationEngine(),
    versionEngine: new VersionEngine(),
    transitionEngine: new TransitionEngine(),
    eventEngine: new EventEngine(new InMemoryEventStore()),
    encodingHook: unavailableEncodingHook,
    serializationHook: serHook,
    persistenceHook: unavailablePersistenceHook,
    bindAuthorityContext: () => {},
  });
  const byId = Object.fromEntries(handlers.map((h) => [h.stageId, h]));
  const baseCtx = {
    executionId: "smoke-011a",
    configuration: { ...defaultProcessorConfiguration, requireSerialization: true },
    clock: new SystemClock(),
    identity: new StaticIdentityProvider(),
    logger: noopLogger,
    metrics: noopMetrics,
    tracer: noopTracer,
    authoritySet: null,
  };
  const ctx = withAuthoritySet(baseCtx, catalog);

  const s05 = await byId.S05.run(ctx, { payload: claimUnit });
  if (s05.status !== "ok") throw new Error("S05 status");
  if (!s05.output?.notes?.includes("binding:ready")) throw new Error("S05 notes");
  pass("S05 binding");

  const json = encoder.encode(claimUnit);
  const s06 = await byId.S06.run(ctx, { payload: json });
  if (s06.status !== "ok") throw new Error("S06 status");
  if (s06.output?.payload?.envelope?.identity !== "claim:serjson011a") {
    throw new Error("S06 decode");
  }
  pass("S06 decode");

  const s17 = await byId.S17.run(ctx, { payload: claimUnit });
  if (s17.status !== "ok") throw new Error("S17 status");
  const projected =
    typeof s17.output?.payload === "string"
      ? JSON.parse(s17.output.payload)
      : s17.output?.payload;
  if (projected.sciros_enc !== "ENC-001@1.0") throw new Error("S17 pin");
  if ("intact" in projected) throw new Error("S17 intact");
  pass("S17 projection");

  const ports = createSerializationFrameworkPorts();
  if (ports.framework.binding.getActive()?.profile_id !== "SER-JSON-001") {
    throw new Error("ports bind");
  }
} catch (e) {
  fail("processor stages", e);
}

const required = [
  "PASS ENC pin normalization",
  "PASS JP-3 null omission",
  "PASS Unknown root rejection",
  "PASS GradeDesignation round-trip",
  "PASS Invalid ontology pin reject",
  "PASS Invalid spec pin reject",
  "PASS S05 binding",
  "PASS S06 decode",
  "PASS S17 projection",
];
const missing = required.filter((r) => !results.includes(r));
if (missing.length || process.exitCode) {
  console.error("SMOKE incomplete", missing, results);
  process.exit(1);
}
writeFileSync(new URL("../SMOKE_011A_PASS", import.meta.url), results.join("\n") + "\n");
console.log("Wrote SMOKE_011A_PASS");

import { writeFileSync } from "node:fs";
import { ClaimFactory, EvidenceFactory } from "../packages/core/dist/index.js";
import { CanonicalEncoder } from "../packages/encoding/dist/index.js";
import {
  SerializationFramework,
  JsonEncoder,
  JsonDecoder,
  isJsonError,
  JSON_PROFILE_ID,
  JSON_PROFILE_PIN,
  stableStringify,
  createSerializationFrameworkPorts,
  JsonBinding,
  JsonNegotiator,
  JsonCapability,
  JsonProfileRegistry,
} from "../packages/serialization/dist/index.js";
import { bindSerializationFrameworkHook } from "../packages/processor/dist/index.js";

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
const enc = new CanonicalEncoder();

const claim = claims.createDraft({
  claim_id: "claim:serjson011a",
  proposition: "SER-JSON-001 round-trip claim",
  scope: { domain_context: "assay", bounds: "cohort C", exclusions: "none" },
  created_by: human,
  created_at: at,
  supported_by: ["evidence:serjson011a"],
});

const ev = evidence.createDraft({
  evidence_id: "evidence:serjson011a",
  summary: "Smoke evidence for SER-JSON-001",
  source: {
    source_class: "laboratory",
    source_locator: "lab://assay/serjson011",
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
  items: [{ item_id: "eitem:serjson011", content_summary: "obs", item_state: "active" }],
  bears_on: ["claim:serjson011a"],
});

const claimUnit = await enc.assemble(claim);
const evUnit = await enc.assemble(ev);

try {
  const fw = new SerializationFramework();
  const reg = new JsonProfileRegistry(fw.registry.profiles);
  const profile = reg.ensureRegistered();
  if (profile.profile_id !== JSON_PROFILE_ID) throw new Error("bad profile id");
  pass("register JSON profile");

  const binding = new JsonBinding(fw.binding);
  binding.bind(profile);
  if (!binding.isBound()) throw new Error("not bound");
  pass("bind JSON profile");

  const cap = JsonCapability.fromProfile(profile);
  if (!cap.export_eligible || cap.technology_family !== "json") throw new Error("cap");
  const neg = new JsonNegotiator(fw.negotiator);
  if (neg.negotiateJson().profile_id !== JSON_PROFILE_ID) throw new Error("negotiate");
} catch (e) {
  fail("register/bind", e);
}

let jsonText;
try {
  const encoder = new JsonEncoder();
  jsonText = encoder.encode(claimUnit);
  const obj = JSON.parse(jsonText);
  if (obj.sciros_profile !== JSON_PROFILE_PIN) throw new Error("pin");
  if (obj.id !== "claim:serjson011a") throw new Error("id");
  if (obj.sciros_unit !== "ClaimUnit") throw new Error("kind");
  if (!Array.isArray(obj.supported_by) || obj.supported_by[0] !== "evidence:serjson011a") {
    throw new Error("supported_by");
  }
  pass("export Canonical Unit");
} catch (e) {
  fail("export Canonical Unit", e);
}

try {
  const decoder = new JsonDecoder();
  const decoded = decoder.decode(jsonText);
  if (decoded.envelope.identity !== claimUnit.envelope.identity) throw new Error("identity");
  pass("decode JSON profile");
} catch (e) {
  fail("decode JSON profile", e);
}

try {
  const encoder = new JsonEncoder();
  const decoder = new JsonDecoder();
  const a = encoder.encode(claimUnit);
  const mid = decoder.decode(a);
  const b = encoder.encode(mid);
  if (a !== b) throw new Error("non-deterministic text");

  if (mid.envelope.identity !== claimUnit.envelope.identity) throw new Error("id");
  if (mid.envelope.ontology_ref !== claimUnit.envelope.ontology_ref) throw new Error("ont");
  if (mid.envelope.spec_ref !== claimUnit.envelope.spec_ref) throw new Error("spec");
  if (mid.envelope.content_version !== claimUnit.envelope.content_version) throw new Error("ver");
  if (mid.envelope.encoding_authority !== claimUnit.envelope.encoding_authority) {
    throw new Error("enc");
  }
  if (mid.intact !== claimUnit.intact) throw new Error("intact");

  const sortRefs = (refs) =>
    stableStringify(
      [...refs]
        .map((r) => ({ target_class: r.target_class, identity: r.identity, role: r.role }))
        .sort((x, y) => `${x.role}:${x.identity}`.localeCompare(`${y.role}:${y.identity}`)),
    );
  if (sortRefs(mid.envelope.references) !== sortRefs(claimUnit.envelope.references)) {
    throw new Error("refs");
  }
  if (mid.envelope.events.length !== claimUnit.envelope.events.length) throw new Error("events");
  if (mid.envelope.extensions.length !== claimUnit.envelope.extensions.length) {
    throw new Error("ext");
  }

  const ea = encoder.encode(evUnit);
  const em = decoder.decode(ea);
  const eb = encoder.encode(em);
  if (ea !== eb) throw new Error("ev non-det");

  pass("round trip");
  pass("import/export deterministic");
  pass("canonical integrity preserved");
  pass("identity preserved");
  pass("pins preserved");
  pass("references preserved");
  pass("events preserved");
  pass("extensions preserved");
  pass("content preserved");
} catch (e) {
  fail("round trip", e);
}

try {
  const decoder = new JsonDecoder();
  const bad = JSON.parse(jsonText);
  bad.sciros_enc = "OTHER-ENC@1.0.0";
  let threw = false;
  try {
    decoder.decode(bad);
  } catch (err) {
    threw = isJsonError(err) && err.code === "AUTHORITY_MISMATCH";
  }
  if (!threw) throw new Error("expected AUTHORITY_MISMATCH");
  pass("authority mismatch rejection");
} catch (e) {
  fail("authority mismatch rejection", e);
}

try {
  const decoder = new JsonDecoder();
  const bad = JSON.parse(jsonText);
  bad.sciros_profile = "SER-JSON-001@9.9.9";
  let threw = false;
  try {
    decoder.decode(bad);
  } catch (err) {
    threw = isJsonError(err) && err.code === "PROFILE_VERSION_MISMATCH";
  }
  if (!threw) throw new Error("expected PROFILE_VERSION_MISMATCH");
  const unknown = { ...JSON.parse(jsonText), sciros_profile: "SER-XML-001@1.0.0" };
  threw = false;
  try {
    decoder.decode(unknown);
  } catch (err) {
    threw = isJsonError(err) && err.code === "UNKNOWN_PROFILE";
  }
  if (!threw) throw new Error("expected UNKNOWN_PROFILE");
  pass("profile mismatch rejection");
} catch (e) {
  fail("profile mismatch rejection", e);
}

try {
  const decoder = new JsonDecoder();
  let threw = false;
  try {
    decoder.decode("{not-json");
  } catch (err) {
    threw = isJsonError(err) && err.code === "MALFORMED_JSON";
  }
  if (!threw) throw new Error("expected MALFORMED_JSON");
  pass("malformed JSON rejection");
} catch (e) {
  fail("malformed JSON rejection", e);
}

try {
  const decoder = new JsonDecoder();
  const bad = JSON.parse(jsonText);
  bad.supported_by = ["evidence:serjson011a", "evidence:serjson011a"];
  let threw = false;
  try {
    decoder.decode(bad);
  } catch (err) {
    threw = isJsonError(err) && err.code === "DUPLICATE_IDENTIFIER";
  }
  if (!threw) throw new Error("expected DUPLICATE_IDENTIFIER");
  pass("duplicate identifier rejection");
} catch (e) {
  fail("duplicate identifier rejection", e);
}

try {
  const decoder = new JsonDecoder();
  const bad = JSON.parse(jsonText);
  bad.supported_by = ["not-an-evidence-id"];
  let threw = false;
  try {
    decoder.decode(bad);
  } catch (err) {
    threw = isJsonError(err) && err.code === "BROKEN_REFERENCE";
  }
  if (!threw) throw new Error("expected BROKEN_REFERENCE");
  pass("broken reference rejection");
} catch (e) {
  fail("broken reference rejection", e);
}

try {
  const ports = createSerializationFrameworkPorts();
  if (ports.framework.binding.getActive()?.profile_id !== JSON_PROFILE_ID) {
    throw new Error("default bind");
  }
  const projected = await ports.project(claimUnit, "");
  const round = await ports.decode(projected);
  if (round.envelope.identity !== claimUnit.envelope.identity) throw new Error("ports rt");
  const hook = bindSerializationFrameworkHook();
  if (!hook.available) throw new Error("hook");
  const p2 = await hook.project(claimUnit, "SER-JSON-001");
  const d2 = await hook.decode(p2);
  if (d2.envelope.identity !== claimUnit.envelope.identity) throw new Error("hook rt");
} catch (e) {
  fail("ports/hook", e);
}

const required = [
  "PASS register JSON profile",
  "PASS bind JSON profile",
  "PASS export Canonical Unit",
  "PASS decode JSON profile",
  "PASS round trip",
  "PASS authority mismatch rejection",
  "PASS profile mismatch rejection",
  "PASS malformed JSON rejection",
  "PASS duplicate identifier rejection",
  "PASS broken reference rejection",
  "PASS canonical integrity preserved",
  "PASS import/export deterministic",
];
const missing = required.filter((r) => !results.includes(r));
if (missing.length || process.exitCode) {
  console.error("SMOKE incomplete", missing);
  process.exit(1);
}
writeFileSync(new URL("../SMOKE_011_PASS", import.meta.url), results.join("\n") + "\n");
console.log("Wrote SMOKE_011_PASS");

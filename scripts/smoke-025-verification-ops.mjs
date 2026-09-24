/**
 * EXEC-025 smoke — Verification OPS under Model C.
 * Writes SMOKE_025_PASS on success. Does NOT overwrite SMOKE_019…024_PASS.
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

const AT = "2026-09-24T12:00:00Z";
const HUMAN = "human:smoke025";

try {
  if (referenceAppMarker.sprint < 25) throw new Error("marker sprint");
  if (referenceAppMarker.secondEventJournal !== false) throw new Error("journal");
  pass("marker");
} catch (e) {
  fail("marker", e);
}

try {
  const ops = createResearchOperations(createMemoryPersistenceSession("smoke:025"));
  const vid = "verification:smoke025";
  const created = await ops.registerVerificationUnit({
    verification_id: vid,
    summary: "smoke verification",
    description: "protocol-scoped smoke verification",
    scope: {
      domain_context: "assay",
      bounds: "smoke",
      exclusions: "none",
    },
    protocol_ref: "protocol:smoke025",
    verification_method: "protocol_conformance",
    verification_context: "smoke context",
    verification_rationale: "smoke rationale",
    provenance: {
      completeness: "complete",
      recorded_at: AT,
      custody_agent: HUMAN,
      method_summary: "smoke",
    },
    created_by: HUMAN,
    created_at: AT,
    claim_refs: ["claim:smoke025"],
  });
  if (created.verification.record_state !== "planned") throw new Error("state");
  if (created.verification.verification_outcome !== "pending") throw new Error("outcome");
  if ((created.verification.record_transition_log?.length ?? 0) !== 0) {
    throw new Error("empty VTE expected");
  }
  if (created.unit.envelope.unit_kind !== "VerificationUnit") throw new Error("kind");
  if (created.entity.revision_id !== INITIAL_REVISION_ID) throw new Error("rev");

  const concluded = await ops.transitionVerificationRecordState({
    identity: vid,
    revision_id: "rev:passed-1",
    expected_head_revision_id: INITIAL_REVISION_ID,
    append_event: true,
    transition: {
      to: "passed",
      authority_agent: HUMAN,
      reason: "smoke leave planned",
      decision_ref: "decision:smoke025",
      at: AT,
      event_id: "vte:smoke025",
    },
  });
  if (concluded.verification.record_state !== "passed") throw new Error("passed");
  if (concluded.verification.verification_outcome !== "passed") {
    throw new Error("outcome coupling");
  }
  if (concluded.head_revision_id !== "rev:passed-1") throw new Error("head");

  const exportA = await ops.exportVerificationUnit(vid);
  const exportB = await ops.exportVerificationUnit(vid);
  if (exportA !== exportB) throw new Error("determinism");

  const events = await ops.getEvents(vid);
  const opsEv = events.filter(
    (e) => e.event_type === "ops.verification_record_state_revision",
  );
  if (opsEv.length !== 1) throw new Error("ops event");

  const listed = await ops.repository.list({
    filter: { entity_kind: "Relationship" },
  });
  if (listed.total !== 0) throw new Error("Relationship leak");

  pass("verification-ops");
  pass("determinism");
  pass("event");
  pass("relationship-boundary");
} catch (e) {
  fail("verification-ops flow", e);
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
  console.error("SMOKE-025 FAILED");
  process.exit(1);
}

writeFileSync("SMOKE_025_PASS", results.join("\n") + "\n", "utf8");
console.log("SMOKE-025 PASS — wrote SMOKE_025_PASS");

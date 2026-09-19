/**
 * EXEC-020 smoke — Model C Persistence + Claim Standing post-persist.
 * Writes SMOKE_020_PASS on success.
 */
import { writeFileSync } from "node:fs";
import { CLINICAL_BOUNDARY_ACK } from "../packages/core/dist/index.js";
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

const AT = "2026-09-19T12:00:00Z";
const HUMAN = "human:smoke020";
const SCOPE = { domain_context: "assay", bounds: "cohort S020", exclusions: "none" };

try {
  if (referenceAppMarker.sprint < 20) throw new Error("marker sprint");
  if (referenceAppMarker.secondEventJournal !== false) throw new Error("journal");
  pass("marker");
} catch (e) {
  fail("marker", e);
}

try {
  const ops = createResearchOperations(createMemoryPersistenceSession("smoke:020"));
  const claimId = "claim:smoke020";
  const { entity } = await ops.registerClaimUnit({
    claim_id: claimId,
    proposition: "smoke 020",
    scope: SCOPE,
    created_by: HUMAN,
    created_at: AT,
  });
  if (entity.revision_id !== INITIAL_REVISION_ID) throw new Error("not initial");
  const head0 = await ops.getClaimHead(claimId);
  if (head0.content_version !== INITIAL_REVISION_ID) throw new Error("head");

  const r = await ops.transitionClaimStanding({
    identity: claimId,
    revision_id: "rev:smoke-supported",
    expected_head_revision_id: INITIAL_REVISION_ID,
    transition: {
      to: "supported",
      authority_agent: HUMAN,
      reason: `${CLINICAL_BOUNDARY_ACK} smoke 020`,
      decision_ref: "decision:smoke020",
      at: AT,
      event_id: "ste:smoke020",
      supported_by: ["evidence:smoke020-support"],
    },
    append_event: true,
  });
  if (r.claim.standing !== "supported") throw new Error("standing");
  if (r.head_revision_id !== "rev:smoke-supported") throw new Error("head adv");
  const lineage = await ops.getClaimLineage(claimId);
  if (lineage.length !== 2) throw new Error("lineage");
  const jsonA = await ops.exportClaimUnit(claimId);
  const jsonB = await ops.exportClaimUnit(claimId);
  if (jsonA !== jsonB) throw new Error("nondeterministic export");

  const { entity: ev } = await ops.registerEvidenceUnit({
    evidence_id: "evidence:smoke020",
    summary: "smoke ev",
    source: {
      source_class: "laboratory",
      source_locator: "lab://smoke020",
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
    items: [
      { item_id: "eitem:smoke020", content_summary: "obs", item_state: "active" },
    ],
  });
  if (ev.revision_id !== INITIAL_REVISION_ID) throw new Error("ev revision");
  pass("model-c-claim-standing");
  pass("evidence-initial");
  pass("determinism");
} catch (e) {
  fail("model-c flow", e);
}

if (process.exitCode) {
  console.error("SMOKE_020_FAIL");
  process.exit(1);
}
writeFileSync("SMOKE_020_PASS", results.join("\n") + "\n", "utf8");
console.log("SMOKE_020_PASS");

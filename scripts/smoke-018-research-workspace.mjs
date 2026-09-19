/**
 * EXEC-SPRINT-018 smoke — ResearchWorkspace Foundation.
 * Writes SMOKE_018_PASS only after actual success.
 */
import { writeFileSync } from "node:fs";
import { createMemoryPersistenceSession } from "../packages/persistence/dist/index.js";
import { stableStringify } from "../packages/serialization/dist/index.js";
import {
  OpsError,
  createResearchOperations,
  referenceAppMarker,
} from "../apps/reference-app/dist/index.js";
import {
  ReferenceRunner,
  REF_CORPUS_SCI,
  referenceFixtures,
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

const AT = "2026-09-19T12:00:00Z";
const HUMAN = "human:ops018-smoke";
const SCOPE = {
  domain_context: "assay",
  bounds: "cohort OPS018",
  exclusions: "none",
};

try {
  if (referenceAppMarker.researchWorkspacePersisted !== false) {
    throw new Error("workspace persisted");
  }
  if (referenceAppMarker.researchSessionPersisted !== false) {
    throw new Error("session persisted");
  }
  pass("marker memory-only");
} catch (e) {
  fail("marker memory-only", e);
}

try {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist:018-smoke"));
  const ws = ops.openWorkspace({
    research_workspace_id: "workspace:018-smoke",
    title: "smoke",
  });
  const orphan = ops.openSession({ research_session_id: "research:018-orphan" });
  if (orphan.research_workspace_id !== undefined) throw new Error("orphan bound");
  const session = ops.openSession({ research_session_id: "research:018-bound" });
  ops.bindSession(ws, session);
  if (session.research_workspace_id !== "workspace:018-smoke") {
    throw new Error("bind failed");
  }
  const { entity } = await ops.registerClaimUnit({
    claim_id: "claim:018-smoke",
    proposition: "workspace foundation smoke",
    scope: SCOPE,
    created_by: HUMAN,
    created_at: AT,
  });
  ops.registerMember(session, {
    entity_kind: "CanonicalUnit",
    identity: entity.identity,
    unit_kind: "ClaimUnit",
  });
  if (ws.members().length !== 1) throw new Error("workspace members");
  const snap = await ops.workspaceSnapshotView(ws);
  const again = await ops.workspaceSnapshotView(ws);
  if (
    stableStringify({
      id: snap.research_workspace_id,
      m: snap.member_refs,
      s: snap.bound_session_ids,
    }) !==
    stableStringify({
      id: again.research_workspace_id,
      m: again.member_refs,
      s: again.bound_session_ids,
    })
  ) {
    throw new Error("snapshot nondeterministic");
  }
  const sessSnap = await ops.snapshotView(session);
  if ("research_workspace_id" in sessSnap) {
    throw new Error("ResearchSnapshot mutated");
  }
  pass("workspace lifecycle bind membership snapshot");
} catch (e) {
  fail("workspace lifecycle bind membership snapshot", e);
}

try {
  const ops = createResearchOperations(createMemoryPersistenceSession("persist:018-err"));
  let threw = false;
  try {
    ops.openWorkspace({ research_workspace_id: "  " });
  } catch (e) {
    threw = e instanceof OpsError && e.code === "INVALID_WORKSPACE";
  }
  if (!threw) throw new Error("expected INVALID_WORKSPACE");
  pass("INVALID_WORKSPACE");
} catch (e) {
  fail("INVALID_WORKSPACE", e);
}

try {
  if (referenceFixtures.length !== 44) throw new Error("SCI corpus size");
  if (REF_CORPUS_SCI.length !== 44) throw new Error("REF_CORPUS_SCI");
  const report = await new ReferenceRunner().run(
    "SciROS Reference Test Suite",
    REF_CORPUS_SCI,
  );
  if (report.summary.pass !== 44) throw new Error(`SCI ${report.summary.pass}/44`);
  pass("SCI regression 44/44");
} catch (e) {
  fail("SCI regression 44/44", e);
}

const required = [
  "PASS marker memory-only",
  "PASS workspace lifecycle bind membership snapshot",
  "PASS INVALID_WORKSPACE",
  "PASS SCI regression 44/44",
];
const missing = required.filter((r) => !results.includes(r));
if (missing.length || process.exitCode) {
  console.error("SMOKE_018 incomplete", missing, results);
  process.exit(1);
}
writeFileSync(new URL("../SMOKE_018_PASS", import.meta.url), results.join("\n") + "\n");
console.log("Wrote SMOKE_018_PASS");
console.log("SMOKE_018_PASS checks=" + results.length);

/**
 * REF-OPS fixture support — deterministic OPS + Persistence harness.
 * Exercises Sprint 016 public APIs only; no fabricated evidence.
 */
import {
  createResearchOperations,
  type ResearchOperations,
} from "@sciros/reference-app";
import { createMemoryPersistenceSession } from "@sciros/persistence";

export const OPS_AT = "2026-09-18T12:00:00Z";
export const OPS_HUMAN = "human:ref-ops-reviewer";
export const OPS_SCOPE = Object.freeze({
  domain_context: "assay",
  bounds: "cohort REF-OPS",
  exclusions: "none",
});

/** Fresh OPS façade bound to an isolated in-memory PersistenceSession. */
export function makeOps(persistenceSessionId: string): ResearchOperations {
  return createResearchOperations(
    createMemoryPersistenceSession(persistenceSessionId),
  );
}

export function claimInput(claimId: string) {
  return {
    claim_id: claimId,
    proposition: "REF-OPS orchestration claim",
    scope: OPS_SCOPE,
    created_by: OPS_HUMAN,
    created_at: OPS_AT,
  };
}

/**
 * REF-OPS fixture support — deterministic OPS + Persistence harness.
 * Exercises OPS public APIs only; no fabricated scientific evidence.
 */
import type { CreateEvidenceInput } from "@sciros/core";
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

/** Deterministic Evidence createDraft input for REF-OPS Evidence fixtures. */
export function evidenceInput(
  evidenceId: string,
  overrides: Partial<CreateEvidenceInput> = {},
): CreateEvidenceInput {
  const itemSuffix = evidenceId.replace(/^evidence:/, "");
  return {
    evidence_id: evidenceId,
    summary: "REF-OPS orchestration evidence",
    source: {
      source_class: "laboratory",
      source_locator: `lab://assay/${evidenceId}`,
      source_state: "declared",
    },
    provenance: {
      completeness: "complete",
      obtained_at: OPS_AT,
      transform_summary: "none",
      custody_agent: OPS_HUMAN,
    },
    created_by: OPS_HUMAN,
    created_at: OPS_AT,
    items: [
      {
        item_id: `eitem:${itemSuffix}`,
        content_summary: "obs",
        item_state: "active",
      },
    ],
    ...overrides,
  };
}

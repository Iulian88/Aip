/**
 * REF-OPS fixture support — deterministic OPS + Persistence harness.
 * Exercises OPS public APIs only; no fabricated scientific evidence.
 */
import type {
  CreateContradictionInput,
  CreateEvidenceInput,
  CreateNegativeResultInput,
  CreateVerificationInput,
  NegativeResultRecordTransitionInput,
  VerificationRecordTransitionInput,
} from "@sciros/core";
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

/** Deterministic Contradiction createOpen input for REF-OPS Contradiction fixtures. */
export function contradictionInput(
  contradictionId: string,
  involvedClaims: readonly string[],
  overrides: Partial<CreateContradictionInput> = {},
): CreateContradictionInput {
  return {
    contradiction_id: contradictionId,
    summary: "REF-OPS orchestration contradiction",
    involved_claims: involvedClaims,
    overlap_statement: "overlapping claim scope in REF-OPS cohort",
    incompatibility_statement: "claims cannot both hold under stated bounds",
    provenance: {
      completeness: "complete",
      recorded_at: OPS_AT,
      custody_agent: OPS_HUMAN,
      method_summary: "REF-OPS contradiction adjudication",
    },
    created_by: OPS_HUMAN,
    created_at: OPS_AT,
    ...overrides,
  };
}

/** Deterministic Negative Result createRegistered content for REF-OPS NR fixtures. */
export function negativeResultInput(
  negativeResultId: string,
  overrides: Partial<CreateNegativeResultInput> = {},
): CreateNegativeResultInput {
  return {
    negative_result_id: negativeResultId,
    summary: "REF-OPS orchestration negative result",
    description: "expected observation not observed under protocol",
    expected_observation: "signal present",
    observed_absence: "signal absent",
    scope: OPS_SCOPE,
    protocol_ref: `protocol:${negativeResultId.replace(/^negresult:/, "")}`,
    sensitivity_context: "nominal",
    provenance: {
      completeness: "complete",
      recorded_at: OPS_AT,
      custody_agent: OPS_HUMAN,
      method_summary: "REF-OPS negative result registration",
    },
    created_by: OPS_HUMAN,
    created_at: OPS_AT,
    ...overrides,
  };
}

/** Human-gated registration input for createRegistered (O-024-02 / O-024-05). */
export function negativeResultRegistration(
  eventId: string,
  overrides: Partial<NegativeResultRecordTransitionInput> = {},
): NegativeResultRecordTransitionInput {
  return {
    to: "registered",
    authority_agent: OPS_HUMAN,
    reason: "REF-OPS negative result registration",
    decision_ref: `decision:${eventId.replace(/^nrte:/, "")}`,
    at: OPS_AT,
    event_id: eventId,
    ...overrides,
  };
}

/** Deterministic Verification createPlanned input for REF-OPS Verification fixtures (O-025-01). */
export function verificationInput(
  verificationId: string,
  overrides: Partial<CreateVerificationInput> = {},
): CreateVerificationInput {
  return {
    verification_id: verificationId,
    summary: "REF-OPS orchestration verification",
    description: "protocol-scoped verification of claim or evidence target",
    scope: OPS_SCOPE,
    protocol_ref: `protocol:${verificationId.replace(/^verification:/, "")}`,
    verification_method: "protocol_conformance",
    verification_context: "REF-OPS cohort assay",
    verification_rationale: "deterministic REF-OPS verification rationale",
    provenance: {
      completeness: "complete",
      recorded_at: OPS_AT,
      custody_agent: OPS_HUMAN,
      method_summary: "REF-OPS verification createPlanned",
    },
    created_by: OPS_HUMAN,
    created_at: OPS_AT,
    claim_refs: [`claim:${verificationId.replace(/^verification:/, "")}`],
    ...overrides,
  };
}

/** Human leave-planned transition input (O-025-02 / O-025-03 — to only; no outcome field). */
export function verificationLeavePlanned(
  to: "passed" | "failed" | "inconclusive",
  eventId: string,
  overrides: Partial<VerificationRecordTransitionInput> = {},
): VerificationRecordTransitionInput {
  return {
    to,
    authority_agent: OPS_HUMAN,
    reason: `REF-OPS leave planned → ${to}`,
    decision_ref: `decision:${eventId.replace(/^vte:/, "")}`,
    at: OPS_AT,
    event_id: eventId,
    ...overrides,
  };
}

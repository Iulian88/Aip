/**
 * REF-TEST-002 fixture support — deterministic sample Knowledge Objects.
 * Fixed timestamps and identifiers only; no randomness.
 */
import {
  ClaimFactory,
  ContradictionFactory,
  EvidenceFactory,
  NegativeResultFactory,
  VerificationFactory,
  type Claim,
  type Contradiction,
  type CreateEvidenceInput,
  type Evidence,
  type NegativeResult,
  type Verification,
} from "@sciros/core";

export const AT = "2026-07-18T12:00:00Z";
export const AT_NEXT = "2026-07-18T12:01:00Z";
export const HUMAN = "human:ref-reviewer1";
export const AI_AGENT = "ai:ref-agent1";
export const DECISION = "dec:ref012";

export const SCOPE = Object.freeze({
  domain_context: "assay",
  bounds: "cohort R",
  exclusions: "none",
});

export function sampleClaim(id = "claim:ref012"): Claim {
  return new ClaimFactory().createDraft({
    claim_id: id,
    proposition: "Reference test proposition",
    scope: SCOPE,
    created_by: HUMAN,
    created_at: AT,
    supported_by: ["evidence:ref012"],
  });
}

export function sampleEvidence(
  id = "evidence:ref012",
  overrides: Partial<CreateEvidenceInput> = {},
): Evidence {
  return new EvidenceFactory().createDraft({
    evidence_id: id,
    summary: "Reference test evidence",
    source: {
      source_class: "laboratory",
      source_locator: "lab://assay/ref012",
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
    items: [{ item_id: "eitem:ref012", content_summary: "obs", item_state: "active" }],
    bears_on: ["claim:ref012"],
    ...overrides,
  });
}

/** literature_venue + declared source — eligible for literature_secondary. */
export function sampleLiteratureEvidence(id = "evidence:ref012lit"): Evidence {
  return sampleEvidence(id, {
    source: {
      source_class: "literature_venue",
      source_locator: "doi://10.1000/ref012",
      source_state: "declared",
    },
  });
}

export function sampleContradiction(id = "contradiction:ref012"): Contradiction {
  return new ContradictionFactory().createOpen({
    contradiction_id: id,
    summary: "Reference conflict",
    overlap_statement: "overlap",
    incompatibility_statement: "incompatible",
    involved_claims: ["claim:ref012", "claim:ref012b"],
    created_by: HUMAN,
    created_at: AT,
    provenance: {
      completeness: "complete",
      recorded_at: AT,
      custody_agent: HUMAN,
      method_summary: "manual",
    },
  });
}

export function sampleNegativeResult(
  id = "negresult:ref012",
  authorityAgent: string = HUMAN,
): NegativeResult {
  return new NegativeResultFactory().createRegistered(
    {
      negative_result_id: id,
      summary: "Reference absence",
      description: "signal not observed",
      expected_observation: "signal",
      observed_absence: "no signal",
      scope: SCOPE,
      protocol_ref: "protocol:ref012",
      sensitivity_context: "nominal",
      claim_refs: ["claim:ref012"],
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
      authority_agent: authorityAgent,
      reason: "clinical_boundary_ack register reference NR",
      decision_ref: DECISION,
      at: AT_NEXT,
    },
  );
}

export function sampleVerification(id = "verification:ref012"): Verification {
  return new VerificationFactory().createPlanned({
    verification_id: id,
    summary: "Reference check",
    description: "planned reference verify",
    scope: SCOPE,
    protocol_ref: "protocol:ref012",
    verification_method: "reproduction",
    verification_context: "lab",
    verification_rationale: "reference rationale",
    claim_refs: ["claim:ref012"],
    evidence_refs: ["evidence:ref012"],
    created_by: HUMAN,
    created_at: AT,
    provenance: {
      completeness: "complete",
      recorded_at: AT,
      custody_agent: HUMAN,
      method_summary: "plan",
    },
  });
}

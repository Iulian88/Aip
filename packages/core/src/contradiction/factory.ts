import { contradictionNfcTrim } from "./identifiers.js";
import { ContradictionValidator } from "./validator.js";
import { ContradictionReferenceValidator } from "./reference-validator.js";
import type { Contradiction, ContradictionProvenance } from "./types.js";

export interface CreateContradictionInput {
  readonly contradiction_id: string;
  readonly summary: string;
  readonly involved_claims: readonly string[];
  readonly overlap_statement: string;
  readonly incompatibility_statement: string;
  readonly provenance: ContradictionProvenance;
  readonly created_by: string;
  readonly created_at: string;
  readonly ontology_ref?: string;
  readonly spec_ref?: string;
  readonly contradiction_version?: string;
  readonly evidence_refs?: readonly string[];
  readonly ai_assisted?: boolean;
  readonly human_sponsor?: string;
}

export class ContradictionFactory {
  private readonly validator = new ContradictionValidator();
  private readonly refs = new ContradictionReferenceValidator();

  createOpen(input: CreateContradictionInput): Contradiction {
    const involved_claims = this.refs.validateInvolvedClaims(input.involved_claims);
    const evidence_refs = this.refs.validateEvidenceRefs(input.evidence_refs);

    const contradiction: Contradiction = Object.freeze({
      contradiction_id: input.contradiction_id,
      ontology_ref: input.ontology_ref ?? "SCI-000@0.1.0",
      spec_ref: input.spec_ref ?? "SCI-004@0.1.0",
      contradiction_version: input.contradiction_version ?? "1.0.0",
      record_state: "open",
      summary: contradictionNfcTrim(input.summary),
      involved_claims,
      overlap_statement: contradictionNfcTrim(input.overlap_statement),
      incompatibility_statement: contradictionNfcTrim(input.incompatibility_statement),
      ethics_constraint_marker: "non_clinical",
      provenance: Object.freeze({
        completeness: input.provenance.completeness,
        recorded_at: input.provenance.recorded_at,
        custody_agent: contradictionNfcTrim(input.provenance.custody_agent),
        method_summary: contradictionNfcTrim(input.provenance.method_summary),
      }),
      created_by: contradictionNfcTrim(input.created_by),
      created_at: input.created_at,
      ...(evidence_refs ? { evidence_refs } : {}),
      ...(input.ai_assisted !== undefined ? { ai_assisted: input.ai_assisted } : {}),
      ...(input.human_sponsor
        ? { human_sponsor: contradictionNfcTrim(input.human_sponsor) }
        : {}),
      record_transition_log: Object.freeze([]),
    });

    this.validator.validate(contradiction);
    return contradiction;
  }
}

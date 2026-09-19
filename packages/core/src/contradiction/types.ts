/**
 * SCI-004 Contradiction types — logical model.
 * Primary authority: SCI-004@0.1.0 · Record State: SCI-000 Contradiction Allowed States.
 */

export const CONTRADICTION_RECORD_STATES = [
  "open",
  "resolved_by_supersession",
  "resolved_by_scope_split",
  "resolved_by_retraction",
  "unresolved_archived",
] as const;

export type ContradictionRecordState = (typeof CONTRADICTION_RECORD_STATES)[number];

export const RESOLVED_STATES = [
  "resolved_by_supersession",
  "resolved_by_scope_split",
  "resolved_by_retraction",
] as const;

export type ResolvedContradictionState = (typeof RESOLVED_STATES)[number];

/** ADR-0006 / SCI-004 §7.2 — MUST NOT appear as Contradiction Record State. */
export const FORBIDDEN_CONTRADICTION_RECORD_STATES = [
  "ignored",
  "draft",
  "registered",
  "withdrawn",
  "draft_unverified",
  "supported",
  "contested",
  "superseded",
  "retracted",
  "candidate",
  "in_review",
  "approved",
  "published",
  "archived",
  "passed",
  "failed",
  "inconclusive",
  "planned",
  "pending",
  "proof",
  "certainty",
  "model_output_only",
  "literature_secondary",
  "curated_database_snapshot",
  "registered_primary_data",
] as const;

export const PROVENANCE_COMPLETENESS = ["complete", "partial", "missing"] as const;
export type ContradictionProvenanceCompleteness =
  (typeof PROVENANCE_COMPLETENESS)[number];

export interface ContradictionProvenance {
  readonly completeness: ContradictionProvenanceCompleteness;
  readonly recorded_at: string;
  readonly custody_agent: string;
  readonly method_summary: string;
}

export interface ContradictionRecordTransitionEvent {
  readonly event_id: string;
  readonly at: string;
  readonly from_state: ContradictionRecordState | "null";
  readonly to_state: ContradictionRecordState;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref?: string;
}

export interface Contradiction {
  readonly contradiction_id: string;
  readonly ontology_ref: string;
  readonly spec_ref: string;
  readonly contradiction_version: string;
  readonly record_state: ContradictionRecordState;
  readonly summary: string;
  readonly involved_claims: readonly string[];
  readonly overlap_statement: string;
  readonly incompatibility_statement: string;
  readonly ethics_constraint_marker: "non_clinical";
  readonly provenance: ContradictionProvenance;
  readonly created_by: string;
  readonly created_at: string;
  readonly evidence_refs?: readonly string[];
  readonly resolution_note?: string;
  readonly ai_assisted?: boolean;
  readonly human_sponsor?: string;
  readonly record_transition_log?: readonly ContradictionRecordTransitionEvent[];
}

export type ContradictionFailureCode =
  | "F1"
  | "F2"
  | "F3"
  | "F4"
  | "F5"
  | "F6"
  | "F7"
  | "F8"
  | "F9"
  | "F10"
  | "F_TRANSITION"
  | "F_AI"
  | "F_UNIQUE"
  | "F_ID_STABLE";

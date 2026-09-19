/**
 * SCI-005 Negative Result types — logical model.
 * Primary authority: SCI-005@0.1.0 · Record State: SCI-000 Negative Result Allowed States.
 */

export const NEGATIVE_RESULT_RECORD_STATES = ["registered", "withdrawn"] as const;
export type NegativeResultRecordState = (typeof NEGATIVE_RESULT_RECORD_STATES)[number];

/** ADR-0006 / SCI-005 §7.2 — MUST NOT appear as Negative Result Record State. */
export const FORBIDDEN_NEGATIVE_RESULT_RECORD_STATES = [
  "draft",
  "open",
  "ignored",
  "unpublished_because_boring",
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
  "resolved_by_supersession",
  "resolved_by_scope_split",
  "resolved_by_retraction",
  "unresolved_archived",
] as const;

export const PROVENANCE_COMPLETENESS = ["complete", "partial", "missing"] as const;
export type NegativeResultProvenanceCompleteness =
  (typeof PROVENANCE_COMPLETENESS)[number];

export interface NegativeResultProvenance {
  readonly completeness: NegativeResultProvenanceCompleteness;
  readonly recorded_at: string;
  readonly custody_agent: string;
  readonly method_summary: string;
}

/** SCI-005 §8 — Negative Result-local Scope. */
export interface NegativeResultScope {
  readonly domain_context: string;
  readonly bounds: string;
  readonly exclusions: string;
}

export interface NegativeResultTransitionEvent {
  readonly event_id: string;
  readonly at: string;
  readonly from_state: NegativeResultRecordState | "null";
  readonly to_state: NegativeResultRecordState;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref: string;
}

export interface NegativeResult {
  readonly negative_result_id: string;
  readonly ontology_ref: string;
  readonly spec_ref: string;
  readonly negative_result_version: string;
  readonly record_state: NegativeResultRecordState;
  readonly summary: string;
  readonly description: string;
  readonly expected_observation: string;
  readonly observed_absence: string;
  readonly scope: NegativeResultScope;
  readonly protocol_ref: string;
  readonly sensitivity_context: string;
  readonly ethics_constraint_marker: "non_clinical";
  readonly provenance: NegativeResultProvenance;
  readonly created_by: string;
  readonly created_at: string;
  readonly claim_refs?: readonly string[];
  readonly evidence_refs?: readonly string[];
  readonly contradiction_refs?: readonly string[];
  readonly verification_refs?: readonly string[];
  readonly ai_assisted?: boolean;
  readonly human_sponsor?: string;
  readonly withdrawal_reason?: string;
  readonly record_transition_log?: readonly NegativeResultTransitionEvent[];
}

export type NegativeResultFailureCode =
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
  | "F11"
  | "F_TRANSITION"
  | "F_AI"
  | "F_UNIQUE"
  | "F_ID_STABLE";

/** Content for (new) → registered issuance — no record_state yet. */
export interface CreateNegativeResultInput {
  readonly negative_result_id: string;
  readonly summary: string;
  readonly description: string;
  readonly expected_observation: string;
  readonly observed_absence: string;
  readonly scope: NegativeResultScope;
  readonly protocol_ref: string;
  readonly sensitivity_context: string;
  readonly provenance: NegativeResultProvenance;
  readonly created_by: string;
  readonly created_at: string;
  readonly ontology_ref?: string;
  readonly spec_ref?: string;
  readonly negative_result_version?: string;
  readonly claim_refs?: readonly string[];
  readonly evidence_refs?: readonly string[];
  readonly contradiction_refs?: readonly string[];
  readonly verification_refs?: readonly string[];
  readonly ai_assisted?: boolean;
  readonly human_sponsor?: string;
}

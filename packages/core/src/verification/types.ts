/**
 * SCI-006 Verification types — logical model.
 * Primary authority: SCI-006@0.1.0 · Record State: SCI-000 Verification Allowed States.
 */

export const VERIFICATION_RECORD_STATES = [
  "planned",
  "passed",
  "failed",
  "inconclusive",
] as const;
export type VerificationRecordState = (typeof VERIFICATION_RECORD_STATES)[number];

export const VERIFICATION_OUTCOMES = [
  "pending",
  "passed",
  "failed",
  "inconclusive",
] as const;
export type VerificationOutcome = (typeof VERIFICATION_OUTCOMES)[number];

export const VERIFICATION_METHODS = [
  "reproduction",
  "protocol_conformance",
  "envelope_check",
  "other",
] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

export const CONCLUDED_VERIFICATION_STATES = [
  "passed",
  "failed",
  "inconclusive",
] as const;
export type ConcludedVerificationState = (typeof CONCLUDED_VERIFICATION_STATES)[number];

/** ADR-0006 / SCI-006 §7.2 — MUST NOT appear as Verification Record State. */
export const FORBIDDEN_VERIFICATION_RECORD_STATES = [
  "truth_confirmed",
  "draft",
  "registered",
  "withdrawn",
  "open",
  "ignored",
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
  "planned_workflow",
  "pending_workflow",
  "resolved_by_supersession",
  "resolved_by_scope_split",
  "resolved_by_retraction",
  "unresolved_archived",
  "proof",
  "certainty",
  "model_output_only",
  "literature_secondary",
  "curated_database_snapshot",
  "registered_primary_data",
] as const;

/** VO-1 / VO-2 — MUST NOT appear as verification_outcome. */
export const FORBIDDEN_VERIFICATION_OUTCOMES = [
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
  "truth_confirmed",
  "registered",
  "withdrawn",
  "draft",
  "open",
] as const;

export const PROVENANCE_COMPLETENESS = ["complete", "partial", "missing"] as const;
export type VerificationProvenanceCompleteness =
  (typeof PROVENANCE_COMPLETENESS)[number];

export interface VerificationProvenance {
  readonly completeness: VerificationProvenanceCompleteness;
  readonly recorded_at: string;
  readonly custody_agent: string;
  readonly method_summary: string;
}

/** SCI-006 §10 — Verification-local Scope. */
export interface VerificationScope {
  readonly domain_context: string;
  readonly bounds: string;
  readonly exclusions: string;
}

export interface VerificationTransitionEvent {
  readonly event_id: string;
  readonly at: string;
  readonly from_state: VerificationRecordState | "null";
  readonly to_state: VerificationRecordState;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref?: string;
}

export interface Verification {
  readonly verification_id: string;
  readonly ontology_ref: string;
  readonly spec_ref: string;
  readonly verification_version: string;
  readonly record_state: VerificationRecordState;
  readonly verification_outcome: VerificationOutcome;
  readonly summary: string;
  readonly description: string;
  readonly scope: VerificationScope;
  readonly protocol_ref: string;
  readonly verification_method: VerificationMethod;
  readonly verification_context: string;
  readonly verification_rationale: string;
  readonly ethics_constraint_marker: "non_clinical";
  readonly provenance: VerificationProvenance;
  readonly created_by: string;
  readonly created_at: string;
  readonly claim_refs?: readonly string[];
  readonly evidence_refs?: readonly string[];
  readonly grade_refs?: readonly string[];
  readonly contradiction_refs?: readonly string[];
  readonly negative_result_refs?: readonly string[];
  readonly artifact_ref?: string;
  readonly ai_assisted?: boolean;
  readonly human_sponsor?: string;
  readonly record_transition_log?: readonly VerificationTransitionEvent[];
}

export type VerificationFailureCode =
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
  | "F12"
  | "F13"
  | "F_TRANSITION"
  | "F_AI"
  | "F_UNIQUE"
  | "F_ID_STABLE";

/** Content for (new) → planned issuance. */
export interface CreateVerificationInput {
  readonly verification_id: string;
  readonly summary: string;
  readonly description: string;
  readonly scope: VerificationScope;
  readonly protocol_ref: string;
  readonly verification_method: VerificationMethod;
  readonly verification_context: string;
  readonly verification_rationale: string;
  readonly provenance: VerificationProvenance;
  readonly created_by: string;
  readonly created_at: string;
  readonly ontology_ref?: string;
  readonly spec_ref?: string;
  readonly verification_version?: string;
  readonly claim_refs?: readonly string[];
  readonly evidence_refs?: readonly string[];
  readonly grade_refs?: readonly string[];
  readonly contradiction_refs?: readonly string[];
  readonly negative_result_refs?: readonly string[];
  readonly artifact_ref?: string;
  readonly ai_assisted?: boolean;
  readonly human_sponsor?: string;
}

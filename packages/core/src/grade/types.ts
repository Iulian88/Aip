/**
 * SCI-003 Evidence Grade types — EG-0.1 scheme.
 * Primary authority: SCI-003@0.1.0 · Storage slot: SCI-002 grade_ref.
 */

export const EG_SCHEME_ID = "EG-0.1" as const;

export const GRADE_LABELS = [
  "model_output_only",
  "literature_secondary",
  "curated_database_snapshot",
  "registered_primary_data",
] as const;

export type GradeLabel = (typeof GRADE_LABELS)[number];

export const GRADE_RANKS: Readonly<Record<GradeLabel, number>> = {
  model_output_only: 1,
  literature_secondary: 2,
  curated_database_snapshot: 3,
  registered_primary_data: 4,
};

/** SCI-003 §8.2 forbidden labels / encodings */
export const FORBIDDEN_GRADE_LABELS = [
  "AI_certified",
  "clinically_proven",
  "deferred_sci003",
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
] as const;

export interface GradeAssignmentEvent {
  readonly event_id: string;
  readonly at: string;
  readonly evidence_id: string;
  readonly from_grade_ref: string | "null";
  readonly to_grade_ref: string;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref: string;
}

export type GradeFailureCode =
  | "F1"
  | "F2"
  | "F3"
  | "F4"
  | "F5"
  | "F6"
  | "F7"
  | "F8"
  | "F9"
  | "F_ASSIGNMENT"
  | "F_MIGRATION";

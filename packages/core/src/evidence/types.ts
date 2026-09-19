/**
 * SCI-002 Evidence types — logical model.
 * Primary authority: SCI-002@0.1.0 · Record State: SCI-000 Evidence Allowed States.
 */

import type { GradeAssignmentEvent } from "../grade/types.js";

export const EVIDENCE_RECORD_STATES = ["draft", "registered", "withdrawn"] as const;
export type EvidenceRecordState = (typeof EVIDENCE_RECORD_STATES)[number];

/** ADR-0006 / SCI-002 §7.2 / §13.0 — MUST NOT appear as Evidence Record State. */
export const FORBIDDEN_EVIDENCE_RECORD_STATES = [
  "proof",
  "certainty",
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
  "implied",
] as const;

export const SOURCE_CLASSES = [
  "database_of_record",
  "instrument",
  "laboratory",
  "registry",
  "literature_venue",
  "curated_deposit",
  "other",
] as const;
export type SourceClass = (typeof SOURCE_CLASSES)[number];

export const SOURCE_STATES = ["declared", "unresolved"] as const;
export type SourceState = (typeof SOURCE_STATES)[number];

export const PROVENANCE_COMPLETENESS = ["complete", "partial", "missing"] as const;
export type ProvenanceCompleteness = (typeof PROVENANCE_COMPLETENESS)[number];

export const ITEM_STATES = ["active", "withdrawn"] as const;
export type ItemState = (typeof ITEM_STATES)[number];

export const COLLECTION_STATES = ["open", "closed", "withdrawn"] as const;
export type CollectionState = (typeof COLLECTION_STATES)[number];

export interface EvidenceSource {
  readonly source_class: SourceClass;
  readonly source_locator: string;
  readonly source_state: SourceState;
}

export interface EvidenceProvenance {
  readonly completeness: ProvenanceCompleteness;
  readonly obtained_at: string;
  readonly transform_summary: string;
  readonly custody_agent: string;
  readonly protocol_ref?: string;
  readonly dataset_ref?: string;
  readonly transform_artifact_ref?: string;
}

export interface EvidenceItem {
  readonly item_id: string;
  readonly content_summary: string;
  readonly item_state: ItemState;
  readonly observation_ref?: string;
  readonly finding_ref?: string;
  readonly units?: string;
  readonly conditions?: string;
}

export interface EvidenceCollection {
  readonly collection_id: string;
  readonly member_item_ids: readonly string[];
  readonly collection_state: CollectionState;
}

export interface EvidenceRecordTransitionEvent {
  readonly event_id: string;
  readonly at: string;
  readonly from_state: EvidenceRecordState | "null";
  readonly to_state: EvidenceRecordState;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref?: string;
}

export interface Evidence {
  readonly evidence_id: string;
  readonly ontology_ref: string;
  readonly spec_ref: string;
  readonly evidence_version: string;
  readonly summary: string;
  readonly record_state: EvidenceRecordState;
  readonly source: EvidenceSource;
  readonly provenance: EvidenceProvenance;
  readonly grade_ref: string;
  readonly ethics_constraint_marker: "non_clinical";
  readonly created_by: string;
  readonly created_at: string;
  readonly items: readonly EvidenceItem[];
  readonly collection?: EvidenceCollection;
  readonly bears_on?: readonly string[];
  readonly protocol_ref?: string;
  readonly dataset_refs?: readonly string[];
  readonly citation_refs?: readonly string[];
  readonly ai_assisted?: boolean;
  readonly human_sponsor?: string;
  readonly record_transition_log?: readonly EvidenceRecordTransitionEvent[];
  /** SCI-003 §12.1 Grade Assignment Event log (Grade-local; optional). */
  readonly grade_assignment_log?: readonly GradeAssignmentEvent[];
}

export type EvidenceFailureCode =
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

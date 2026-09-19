/**
 * SCI-001 Claim types — logical model only.
 * Primary authority: SCI-001@0.1.4 · Standing vocabulary: SCI-000.
 */

export const CLAIM_STANDINGS = [
  "draft_unverified",
  "supported",
  "contested",
  "superseded",
  "retracted",
] as const;

export type ClaimStanding = (typeof CLAIM_STANDINGS)[number];

/** ADR-0006 / SCI-001 §9 — values that MUST NOT appear as Standing. */
export const FORBIDDEN_STANDING_VALUES = [
  "candidate",
  "in_review",
  "approved",
  "published",
  "archived",
  "withdrawn", // Evidence/Record State vocabulary — not Claim Standing
  "registered",
  "draft", // Evidence Record State
  "passed",
  "failed",
  "inconclusive",
  "planned",
  "pending",
] as const;

export interface ClaimScope {
  readonly domain_context: string;
  readonly bounds: string;
  readonly exclusions: string;
}

export interface StandingTransitionEvent {
  readonly event_id: string;
  readonly at: string;
  readonly from_standing: ClaimStanding | "null";
  readonly to_standing: ClaimStanding;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref?: string;
}

/**
 * Immutable Claim aggregate (SCI-001 §7).
 * Optional relationship arrays hold identifiers only — never owned objects.
 */
export interface Claim {
  readonly claim_id: string;
  readonly ontology_ref: string;
  readonly spec_ref: string;
  readonly claim_version: string;
  readonly proposition: string;
  readonly scope: ClaimScope;
  readonly standing: ClaimStanding;
  readonly ethics_constraint_marker: "non_clinical";
  readonly created_by: string;
  readonly created_at: string;
  readonly ai_assisted?: boolean;
  readonly human_sponsor?: string;
  readonly is_hypothesis?: boolean;
  readonly supported_by?: readonly string[];
  readonly qualified_by?: readonly string[];
  readonly contested_by?: readonly string[];
  readonly verified_via?: readonly string[];
  readonly retraction_reason?: string;
  readonly superseded_by?: string;
  readonly supersedes?: string;
  readonly standing_transition_log?: readonly StandingTransitionEvent[];
  readonly protocol_ref?: string;
  readonly dataset_refs?: readonly string[];
  readonly citation_refs?: readonly string[];
  readonly entity_bindings?: readonly string[];
  readonly assumes?: readonly string[];
  readonly qualified_by_uncertainty?: readonly string[];
}

export type ClaimFailureCode =
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
  | "F_C_ETH"
  | "F_AI"
  | "F_HYPOTHESIS"
  | "F_UNIQUE"
  | "F_ID_STABLE";

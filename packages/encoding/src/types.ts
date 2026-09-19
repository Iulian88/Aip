/**
 * ENC-001 Canonical Encoding — abstract units (no concrete serialization syntax).
 * Primary authority: ENC-001 v1.0 · Consumes SCI-001…006 by projection only.
 */

export const CANONICAL_ENCODING_AUTHORITY = "ENC-001" as const;
export const CANONICAL_ENCODING_VERSION = "1.0.0" as const;

export type CanonicalUnitKind =
  | "ClaimUnit"
  | "EvidenceUnit"
  | "ContradictionUnit"
  | "NegativeResultUnit"
  | "VerificationUnit"
  | "GradeDesignationUnit"
  | "EventUnit";

export type CanonicalTargetClass =
  | "Claim"
  | "Evidence"
  | "Contradiction"
  | "NegativeResult"
  | "Verification"
  | "Extension";

/** Typed logical pointer — never an embedded foreign aggregate (CE-3). */
export interface CanonicalReference {
  readonly target_class: CanonicalTargetClass;
  readonly identity: string;
  readonly role?: string;
  readonly version_hint?: string;
}

export interface CanonicalEvent {
  readonly event_id: string;
  readonly parent_identity: string;
  readonly parent_class: CanonicalTargetClass;
  readonly at: string;
  readonly from_state: string;
  readonly to_state: string;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref?: string;
}

export interface CanonicalExtensionEnvelope {
  readonly extension_id: string;
  readonly extension_version: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

/**
 * Canonical envelope — authority wrapper around one encoding unit.
 */
export interface CanonicalEnvelope {
  readonly encoding_authority: typeof CANONICAL_ENCODING_AUTHORITY;
  readonly encoding_version: typeof CANONICAL_ENCODING_VERSION;
  readonly unit_kind: CanonicalUnitKind;
  readonly ontology_ref: string;
  readonly spec_ref: string;
  readonly identity: string;
  readonly content_version: string;
  readonly references: readonly CanonicalReference[];
  readonly events: readonly CanonicalEvent[];
  readonly extensions: readonly CanonicalExtensionEnvelope[];
  /** Frozen content projection of the Core aggregate (no foreign roots). */
  readonly content: Readonly<Record<string, unknown>>;
}

/**
 * Canonical unit — complete self-describing ENC-001 package.
 */
export interface CanonicalUnit {
  readonly envelope: CanonicalEnvelope;
  readonly intact: boolean;
}

export type CanonicalEncodingFailureCode =
  | "MALFORMED_UNIT"
  | "UNKNOWN_AUTHORITY"
  | "UNKNOWN_ONTOLOGY_PIN"
  | "UNKNOWN_SPEC_PIN"
  | "BROKEN_REFERENCE"
  | "DUPLICATE_IDENTIFIER"
  | "FOREIGN_EMBEDDED_OBJECT"
  | "MIXED_OWNERSHIP"
  | "PARTIAL_UNIT"
  | "UNSUPPORTED_INPUT"
  | "INTEGRITY_FAILED";

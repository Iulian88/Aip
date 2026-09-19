/**
 * Persistence foundation — infrastructure types (EXEC-SPRINT-015).
 * Stores already-authoritative SciROS artifacts; does not redefine scientific meaning.
 */

/** Entity kinds Persistence may store as data. */
export const PERSISTENCE_ENTITY_KINDS = [
  "CanonicalUnit",
  "Claim",
  "Evidence",
  "GradeDesignation",
  "Contradiction",
  "NegativeResult",
  "Verification",
  "Relationship",
  "Event",
  "SerializedDocument",
  "ConformanceReport",
  "CertificationReport",
  "CertificationCertificate",
  /** Model C mutable head pointer (not scientific truth). */
  "RevisionHead",
] as const;
export type PersistenceEntityKind = (typeof PERSISTENCE_ENTITY_KINDS)[number];

/** Explicit relationship record (never heuristically reconstructed). */
export interface PersistenceRelationship {
  readonly relationship_id: string;
  readonly relationship_type: string;
  readonly source_identity: string;
  readonly target_identity: string;
  readonly target_class?: string;
  readonly ordinal: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Event journal entry — separate from current state. */
export interface PersistenceEvent {
  readonly event_id: string;
  readonly parent_identity: string;
  readonly parent_class?: string;
  readonly event_type: string;
  readonly at?: string;
  readonly from_state?: string;
  readonly to_state?: string;
  readonly authority_agent?: string;
  readonly reason?: string;
  readonly decision_ref?: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly ordinal: number;
}

/**
 * Persisted entity envelope.
 * `identity` is the scientific/canonical identity (preserved exactly).
 * `storage_key` is storage metadata and MUST NOT replace scientific identity.
 */
export interface PersistenceEntity {
  readonly storage_key: string;
  readonly entity_kind: PersistenceEntityKind;
  /** Scientific / canonical identity (preserved exactly). */
  readonly identity: string;
  readonly content_version: string;
  /**
   * Model C revision identity (Persistence metadata).
   * Distinct from identity and from SemVer content_version.
   */
  readonly revision_id?: string;
  /**
   * Authoritative representation lineage (Model C).
   * Absent on rev:initial; required on later CanonicalUnit revisions.
   */
  readonly predecessor_revision_id?: string;
  readonly ontology_ref?: string;
  readonly spec_ref?: string;
  readonly encoding_authority?: string;
  readonly encoding_version?: string;
  readonly intact?: boolean;
  /** Lossless frozen payload — authoritative representation. */
  readonly payload: Readonly<Record<string, unknown>>;
  readonly references: readonly PersistenceRelationship[];
  readonly events: readonly PersistenceEvent[];
}

/** Deterministic complete-state snapshot (no wall-clock / random fields). */
export interface PersistenceSnapshot {
  readonly snapshot_id: string;
  readonly schema_version: "1.0.0";
  readonly entities: readonly PersistenceEntity[];
  readonly event_journal: readonly PersistenceEvent[];
}

export interface PersistenceFilter {
  readonly identity?: string;
  readonly entity_kind?: PersistenceEntityKind;
  readonly ontology_ref?: string;
  readonly spec_ref?: string;
  readonly content_version?: string;
  readonly encoding_authority?: string;
  readonly relationship_type?: string;
  readonly source_identity?: string;
  readonly target_identity?: string;
  readonly parent_identity?: string;
  readonly event_id?: string;
}

export interface PersistencePage<T> {
  readonly items: readonly T[];
  readonly offset: number;
  readonly limit: number;
  readonly total: number;
}

export interface PersistenceResult<T> {
  readonly ok: true;
  readonly value: T;
}

export interface PersistenceQuery {
  readonly filter: PersistenceFilter;
  readonly offset?: number;
  readonly limit?: number;
}

/** Supported ENC pin for CanonicalUnit persistence. */
export const SUPPORTED_ENCODING_AUTHORITY = "ENC-001" as const;
export const SUPPORTED_ENCODING_VERSION = "1.0.0" as const;
export const PERSISTENCE_SCHEMA_VERSION = "1.0.0" as const;

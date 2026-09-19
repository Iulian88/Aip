/**
 * SER-001 Serialization Profile Framework — abstract types (no concrete syntax).
 */

export const SERIALIZATION_FRAMEWORK_AUTHORITY = "SER-001" as const;
export const SERIALIZATION_FRAMEWORK_VERSION = "1.0.0" as const;

/** Framework-local abstract profile for SER-001 (not SER-JSON / XML / protobuf). */
export const ABSTRACT_PROFILE_ID = "SER-ABS-001" as const;
export const ABSTRACT_PROFILE_VERSION = "1.0.0" as const;

export type SerializationProfileClass = "Canonical-interchange" | "Derived-view";

export type SerializationTechnologyFamily =
  | "abstract"
  | "json"
  | "xml"
  | "rdf"
  | "protobuf"
  | "graph"
  | "sql"
  | "other";

export type SerializationFailureCode =
  | "UNKNOWN_PROFILE"
  | "UNSUPPORTED_PROFILE"
  | "DUPLICATE_PROFILE"
  | "PROFILE_VERSION_MISMATCH"
  | "AUTHORITY_MISMATCH"
  | "INVALID_BINDING"
  | "INVALID_CANONICAL_UNIT"
  | "IMPORT_INELIGIBLE"
  | "EXPORT_INELIGIBLE"
  | "MALFORMED_INSTANCE"
  | "COMPATIBILITY_FAILURE";

/**
 * Declared serialization profile — framework metadata only (SER-001 §3 Identity).
 * No concrete schema or bytes.
 */
export interface SerializationProfileDeclaration {
  readonly profile_id: string;
  readonly profile_version: string;
  readonly profile_authority: string;
  readonly technology_family: SerializationTechnologyFamily;
  readonly enc_pin: string;
  readonly profile_class: SerializationProfileClass;
  readonly supported_unit_kinds: readonly string[];
}

/**
 * Abstract profile instance — structural projection of a Canonical Unit.
 * Not JSON text, not bytes, not XML.
 */
export interface AbstractProfileInstance {
  readonly profile_id: string;
  readonly profile_version: string;
  readonly profile_authority: string;
  readonly encoding_authority: string;
  readonly encoding_version: string;
  readonly unit_kind: string;
  readonly identity: string;
  readonly content_version: string;
  readonly ontology_ref: string;
  readonly spec_ref: string;
  readonly intact: boolean;
  readonly references: readonly Readonly<Record<string, unknown>>[];
  readonly events: readonly Readonly<Record<string, unknown>>[];
  readonly extensions: readonly Readonly<Record<string, unknown>>[];
  readonly content: Readonly<Record<string, unknown>>;
}

export interface SerializationCapabilityDescriptor {
  readonly profile_id: string;
  readonly profile_version: string;
  readonly profile_authority: string;
  readonly technology_family: SerializationTechnologyFamily;
  readonly profile_class: SerializationProfileClass;
  readonly enc_pin: string;
  readonly export_eligible: boolean;
  readonly import_eligible: boolean;
}

export interface NegotiationRequest {
  readonly profile_id?: string;
  readonly profile_version?: string;
  readonly profile_authority?: string;
  readonly technology_family?: SerializationTechnologyFamily;
  readonly require_interchange?: boolean;
}

/**
 * SER-JSON-001 — concrete JSON profile constants.
 */

export const JSON_PROFILE_ID = "SER-JSON-001" as const;
export const JSON_PROFILE_VERSION = "1.0.0" as const;
export const JSON_PROFILE_PIN = `${JSON_PROFILE_ID}@${JSON_PROFILE_VERSION}` as const;
/** SER-JSON-001 §4.1 discriminator — Encoding package still uses 1.0.0 internally. */
export const JSON_ENC_PIN = "ENC-001@1.0" as const;
export const JSON_SER_PIN = "SER-001@1.0.0" as const;

export type JsonFailureCode =
  | "UNKNOWN_PROFILE"
  | "PROFILE_VERSION_MISMATCH"
  | "AUTHORITY_MISMATCH"
  | "INVALID_JSON_PROFILE"
  | "INVALID_CANONICAL_UNIT"
  | "MISSING_REQUIRED_FIELD"
  | "DUPLICATE_IDENTIFIER"
  | "FOREIGN_EMBEDDED_OBJECT"
  | "BROKEN_REFERENCE"
  | "MALFORMED_JSON"
  | "UNSUPPORTED_UNIT";

/** In-memory JSON unit object (RFC 8259 model). */
export type JsonUnitObject = Readonly<Record<string, unknown>>;

/** JSON document — text or parsed object. */
export type JsonDocument = string | JsonUnitObject;

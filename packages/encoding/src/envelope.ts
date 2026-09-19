import type { CanonicalEnvelope, CanonicalUnit } from "./types.js";

/** Re-export envelope type as a named module surface for ENC-001. */
export type { CanonicalEnvelope };

export function isCanonicalEnvelope(value: unknown): value is CanonicalEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "encoding_authority" in value &&
    "unit_kind" in value &&
    "identity" in value &&
    "content" in value
  );
}

export function unitEnvelope(unit: CanonicalUnit): CanonicalEnvelope {
  return unit.envelope;
}

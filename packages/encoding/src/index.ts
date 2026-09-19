/**
 * @sciros/encoding — ENC-001 Canonical Encoding (Sprint 9).
 * Projects SCI-001…006 Core objects into abstract canonical units.
 * No concrete serialization syntax (no JSON/YAML/XML/protobuf).
 */

export type {
  CanonicalEnvelope,
  CanonicalEvent,
  CanonicalExtensionEnvelope,
  CanonicalEncodingFailureCode,
  CanonicalReference,
  CanonicalTargetClass,
  CanonicalUnit,
  CanonicalUnitKind,
} from "./types.js";
export {
  CANONICAL_ENCODING_AUTHORITY,
  CANONICAL_ENCODING_VERSION,
} from "./types.js";

export { CanonicalEncodingError, isCanonicalEncodingError } from "./errors.js";
export { CanonicalEncodingVersion } from "./version.js";
export { CanonicalReferenceResolver } from "./reference-resolver.js";
export { CanonicalValidator } from "./validator.js";
export { CanonicalEncodingBuilder } from "./builder.js";
export {
  CanonicalEncodingRegistry,
  type CanonicalBuildable,
} from "./registry.js";
export { CanonicalEncoder } from "./encoder.js";
export { CanonicalDecoder } from "./decoder.js";
export { isCanonicalEnvelope, unitEnvelope } from "./envelope.js";

import { CanonicalEncoder } from "./encoder.js";

/** Ports suitable for RPR EncodingHook binding. */
export function createCanonicalEncodingPorts(): {
  assemble: (input: unknown) => Promise<unknown>;
  verify: (unit: unknown) => Promise<boolean>;
} {
  const encoder = new CanonicalEncoder();
  return {
    assemble: (input) => encoder.assemble(input),
    verify: (unit) => encoder.verify(unit),
  };
}

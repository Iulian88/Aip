/**
 * SER-JSON-001 — concrete JSON serialization profile.
 */

export type {
  JsonDocument,
  JsonFailureCode,
  JsonUnitObject,
} from "./types.js";
export {
  JSON_ENC_PIN,
  JSON_PROFILE_ID,
  JSON_PROFILE_PIN,
  JSON_PROFILE_VERSION,
  JSON_SER_PIN,
} from "./types.js";

export { JsonError, isJsonError } from "./errors.js";
export { JsonVersion } from "./version.js";
export { JsonProfile } from "./profile.js";
export { JsonProfileRegistry } from "./profile-registry.js";
export { JsonBinding } from "./binding.js";
export { JsonCapability } from "./capability.js";
export { JsonNegotiator } from "./negotiator.js";
export { JsonValidator } from "./validator.js";
export { JsonEncoder, stableStringify } from "./encoder.js";
export { JsonDecoder } from "./decoder.js";

/**
 * @sciros/serialization — SER-001 Serialization Profile Framework + SER-JSON-001.
 * Accepts ENC-001 Canonical Units; projects via registered profiles.
 */

export type {
  AbstractProfileInstance,
  NegotiationRequest,
  SerializationCapabilityDescriptor,
  SerializationFailureCode,
  SerializationProfileClass,
  SerializationProfileDeclaration,
  SerializationTechnologyFamily,
} from "./types.js";
export {
  ABSTRACT_PROFILE_ID,
  ABSTRACT_PROFILE_VERSION,
  SERIALIZATION_FRAMEWORK_AUTHORITY,
  SERIALIZATION_FRAMEWORK_VERSION,
} from "./types.js";

export { SerializationError, isSerializationError } from "./errors.js";
export { SerializationVersion } from "./version.js";
export { SerializationProfile } from "./profile.js";
export { SerializationProfileRegistry } from "./profile-registry.js";
export { SerializationBinding } from "./binding.js";
export { SerializationCapability } from "./capability.js";
export { SerializationNegotiator } from "./negotiator.js";
export { SerializationValidator } from "./validator.js";
export { SerializationRegistry } from "./registry.js";
export { SerializationFramework } from "./framework.js";

export * from "./json/index.js";

import { SerializationFramework } from "./framework.js";
import { ABSTRACT_PROFILE_ID } from "./types.js";
import { JSON_PROFILE_ID } from "./json/types.js";

/** Ports suitable for RPR SerializationHook binding (default SER-JSON-001). */
export function createSerializationFrameworkPorts(
  framework: SerializationFramework = new SerializationFramework(),
): {
  decode: (instance: unknown) => Promise<unknown>;
  project: (canonical: unknown, profileId: string) => Promise<unknown>;
  framework: SerializationFramework;
} {
  framework.bindJsonProfile();
  return {
    framework,
    decode: async (instance) => framework.decode(instance),
    project: async (canonical, profileId) =>
      framework.project(
        canonical,
        profileId && profileId.length > 0 ? profileId : JSON_PROFILE_ID,
      ),
  };
}

/** Ports bound to SER-ABS-001 abstract profile (framework-only). */
export function createSerializationAbstractPorts(
  framework: SerializationFramework = new SerializationFramework(),
): {
  decode: (instance: unknown) => Promise<unknown>;
  project: (canonical: unknown, profileId: string) => Promise<unknown>;
  framework: SerializationFramework;
} {
  framework.bindDefaultAbstract();
  return {
    framework,
    decode: async (instance) => framework.decode(instance),
    project: async (canonical, profileId) =>
      framework.project(
        canonical,
        profileId && profileId.length > 0 ? profileId : ABSTRACT_PROFILE_ID,
      ),
  };
}

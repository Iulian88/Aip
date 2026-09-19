import {
  CANONICAL_ENCODING_AUTHORITY,
  CANONICAL_ENCODING_VERSION,
  type CanonicalUnit,
} from "@sciros/encoding";
import { SerializationError } from "./errors.js";
import type { SerializationProfile } from "./profile.js";
import type { AbstractProfileInstance } from "./types.js";

/**
 * Validates SER-001 profile bindings, compatibility, and abstract instances.
 * Does NOT run Standing / HR / Core transition rules.
 */
export class SerializationValidator {
  assertCanonicalUnit(input: unknown): CanonicalUnit {
    if (!input || typeof input !== "object") {
      throw new SerializationError("INVALID_CANONICAL_UNIT", "Canonical unit missing");
    }
    const u = input as Partial<CanonicalUnit>;
    if (!u.envelope || typeof u.envelope !== "object") {
      throw new SerializationError("INVALID_CANONICAL_UNIT", "Canonical envelope missing");
    }
    if (typeof u.intact !== "boolean") {
      throw new SerializationError("INVALID_CANONICAL_UNIT", "Canonical unit.intact missing");
    }
    const env = u.envelope;
    if (env.encoding_authority !== CANONICAL_ENCODING_AUTHORITY) {
      throw new SerializationError(
        "AUTHORITY_MISMATCH",
        `Expected encoding authority ${CANONICAL_ENCODING_AUTHORITY}`,
        { encoding_authority: env.encoding_authority },
      );
    }
    if (env.encoding_version !== CANONICAL_ENCODING_VERSION) {
      throw new SerializationError(
        "AUTHORITY_MISMATCH",
        `Expected encoding version ${CANONICAL_ENCODING_VERSION}`,
        { encoding_version: env.encoding_version },
      );
    }
    return u as CanonicalUnit;
  }

  assertProfileAuthority(profile: SerializationProfile, expectedAuthority?: string): void {
    if (expectedAuthority !== undefined) {
      if (profile.profile_authority !== expectedAuthority) {
        throw new SerializationError(
          "AUTHORITY_MISMATCH",
          `Profile authority ${profile.profile_authority} ≠ ${expectedAuthority}`,
          {
            profile_id: profile.profile_id,
            profile_authority: profile.profile_authority,
            expected: expectedAuthority,
          },
        );
      }
      return;
    }
    const ok =
      profile.profile_authority === "SER-001" ||
      profile.profile_authority === profile.profile_id;
    if (!ok) {
      throw new SerializationError(
        "AUTHORITY_MISMATCH",
        `Invalid profile authority ${profile.profile_authority} for ${profile.profile_id}`,
        {
          profile_id: profile.profile_id,
          profile_authority: profile.profile_authority,
        },
      );
    }
  }

  assertCompatible(
    profile: SerializationProfile,
    profileId: string,
    profileVersion?: string,
  ): void {
    if (profile.profile_id !== profileId) {
      throw new SerializationError(
        "PROFILE_VERSION_MISMATCH",
        `Bound profile id ${profile.profile_id} ≠ requested ${profileId}`,
      );
    }
    if (profileVersion !== undefined && profile.profile_version !== profileVersion) {
      throw new SerializationError(
        "PROFILE_VERSION_MISMATCH",
        `Bound profile version ${profile.profile_version} ≠ requested ${profileVersion}`,
        { profile_id: profileId, profile_version: profileVersion },
      );
    }
  }

  assertUnitSupported(profile: SerializationProfile, unitKind: string): void {
    if (!profile.supportsUnitKind(unitKind)) {
      throw new SerializationError(
        "UNSUPPORTED_PROFILE",
        `Profile ${profile.profile_id} does not support unit_kind ${unitKind}`,
        { profile_id: profile.profile_id, unit_kind: unitKind },
      );
    }
  }

  assertExportEligible(profile: SerializationProfile): void {
    // Framework: all registered profiles may export abstract instances.
    if (!profile.profile_id) {
      throw new SerializationError("EXPORT_INELIGIBLE", "Profile not export-eligible");
    }
  }

  assertImportEligible(profile: SerializationProfile): void {
    if (!profile.isInterchange()) {
      throw new SerializationError(
        "IMPORT_INELIGIBLE",
        `Derived-view profile ${profile.profile_id} is not import-eligible`,
        { profile_id: profile.profile_id },
      );
    }
  }

  assertProfileInstance(instance: unknown): AbstractProfileInstance {
    if (!instance || typeof instance !== "object") {
      throw new SerializationError("MALFORMED_INSTANCE", "Profile instance missing");
    }
    const i = instance as Partial<AbstractProfileInstance>;
    if (typeof i.profile_id !== "string" || i.profile_id.length < 1) {
      throw new SerializationError("MALFORMED_INSTANCE", "profile_id missing");
    }
    if (typeof i.profile_version !== "string" || i.profile_version.length < 1) {
      throw new SerializationError("MALFORMED_INSTANCE", "profile_version missing");
    }
    if (typeof i.profile_authority !== "string" || i.profile_authority.length < 1) {
      throw new SerializationError("MALFORMED_INSTANCE", "profile_authority missing");
    }
    if (typeof i.identity !== "string" || i.identity.length < 1) {
      throw new SerializationError("MALFORMED_INSTANCE", "identity missing");
    }
    if (!i.content || typeof i.content !== "object") {
      throw new SerializationError("MALFORMED_INSTANCE", "content missing");
    }
    if (typeof i.intact !== "boolean") {
      throw new SerializationError("MALFORMED_INSTANCE", "intact missing");
    }
    return i as AbstractProfileInstance;
  }
}

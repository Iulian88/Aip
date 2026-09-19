import type { SerializationProfile } from "./profile.js";
import type { SerializationCapabilityDescriptor } from "./types.js";

/**
 * Capability view of a registered profile (import/export eligibility).
 */
export class SerializationCapability {
  static fromProfile(profile: SerializationProfile): SerializationCapabilityDescriptor {
    const interchange = profile.isInterchange();
    return Object.freeze({
      profile_id: profile.profile_id,
      profile_version: profile.profile_version,
      profile_authority: profile.profile_authority,
      technology_family: profile.declaration.technology_family,
      profile_class: profile.declaration.profile_class,
      enc_pin: profile.declaration.enc_pin,
      export_eligible: true,
      import_eligible: interchange,
    });
  }
}

import { SerializationError } from "./errors.js";
import { SerializationProfile } from "./profile.js";
import type { SerializationProfileDeclaration } from "./types.js";

/**
 * Registry of declared Serialization Profiles (SER-001).
 */
export class SerializationProfileRegistry {
  private readonly byId = new Map<string, SerializationProfile>();

  register(declaration: SerializationProfileDeclaration): SerializationProfile {
    const key = profileKey(declaration.profile_id, declaration.profile_version);
    if (this.byId.has(key) || this.findById(declaration.profile_id)) {
      throw new SerializationError(
        "DUPLICATE_PROFILE",
        `Duplicate profile registration: ${declaration.profile_id}@${declaration.profile_version}`,
        { profile_id: declaration.profile_id, profile_version: declaration.profile_version },
      );
    }
    const profile = new SerializationProfile(declaration);
    this.byId.set(key, profile);
    return profile;
  }

  lookup(profileId: string, profileVersion?: string): SerializationProfile {
    if (profileVersion) {
      const exact = this.byId.get(profileKey(profileId, profileVersion));
      if (!exact) {
        throw new SerializationError(
          "UNKNOWN_PROFILE",
          `Unknown profile: ${profileId}@${profileVersion}`,
          { profile_id: profileId, profile_version: profileVersion },
        );
      }
      return exact;
    }
    const found = this.findById(profileId);
    if (!found) {
      throw new SerializationError("UNKNOWN_PROFILE", `Unknown profile: ${profileId}`, {
        profile_id: profileId,
      });
    }
    return found;
  }

  has(profileId: string, profileVersion?: string): boolean {
    try {
      this.lookup(profileId, profileVersion);
      return true;
    } catch {
      return false;
    }
  }

  list(): readonly SerializationProfile[] {
    return Object.freeze([...this.byId.values()]);
  }

  private findById(profileId: string): SerializationProfile | undefined {
    for (const p of this.byId.values()) {
      if (p.profile_id === profileId) return p;
    }
    return undefined;
  }
}

function profileKey(id: string, version: string): string {
  return `${id}@${version}`;
}

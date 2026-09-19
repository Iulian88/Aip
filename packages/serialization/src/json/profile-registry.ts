import type { SerializationProfileRegistry } from "../profile-registry.js";
import type { SerializationProfile } from "../profile.js";
import { JsonProfile } from "./profile.js";
import { JSON_PROFILE_ID, JSON_PROFILE_VERSION } from "./types.js";

/** Registry helper for SER-JSON-001. */
export class JsonProfileRegistry {
  constructor(private readonly profiles: SerializationProfileRegistry) {}

  ensureRegistered(): SerializationProfile {
    if (!this.profiles.has(JSON_PROFILE_ID, JSON_PROFILE_VERSION)) {
      return this.profiles.register(JsonProfile.declaration());
    }
    return this.profiles.lookup(JSON_PROFILE_ID, JSON_PROFILE_VERSION);
  }

  lookup(): SerializationProfile {
    return this.profiles.lookup(JSON_PROFILE_ID, JSON_PROFILE_VERSION);
  }
}

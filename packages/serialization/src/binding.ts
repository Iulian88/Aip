import { SerializationError } from "./errors.js";
import type { SerializationProfile } from "./profile.js";

/**
 * Active serialization profile binding for a session/request.
 */
export class SerializationBinding {
  private active: SerializationProfile | null = null;

  bind(profile: SerializationProfile): void {
    if (!profile || !profile.profile_id) {
      throw new SerializationError("INVALID_BINDING", "Cannot bind empty profile");
    }
    this.active = profile;
  }

  unbind(): void {
    this.active = null;
  }

  isBound(): boolean {
    return this.active !== null;
  }

  requireActive(): SerializationProfile {
    if (!this.active) {
      throw new SerializationError("INVALID_BINDING", "No serialization profile bound");
    }
    return this.active;
  }

  getActive(): SerializationProfile | null {
    return this.active;
  }
}

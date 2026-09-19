import type { SerializationBinding } from "../binding.js";
import type { SerializationProfile } from "../profile.js";
import { JsonError } from "./errors.js";
import { JSON_PROFILE_ID, JSON_PROFILE_VERSION } from "./types.js";

/** Binding helper for SER-JSON-001. */
export class JsonBinding {
  constructor(private readonly binding: SerializationBinding) {}

  bind(profile: SerializationProfile): void {
    if (profile.profile_id !== JSON_PROFILE_ID) {
      throw new JsonError(
        "INVALID_JSON_PROFILE",
        `JsonBinding expects ${JSON_PROFILE_ID}`,
      );
    }
    this.binding.bind(profile);
  }

  isBound(): boolean {
    const active = this.binding.getActive();
    return (
      active?.profile_id === JSON_PROFILE_ID &&
      active.profile_version === JSON_PROFILE_VERSION
    );
  }
}

import { SerializationCapability } from "../capability.js";
import type { SerializationCapabilityDescriptor } from "../types.js";
import type { SerializationProfile } from "../profile.js";

/** Capability view for SER-JSON-001. */
export class JsonCapability {
  static fromProfile(profile: SerializationProfile): SerializationCapabilityDescriptor {
    return SerializationCapability.fromProfile(profile);
  }
}

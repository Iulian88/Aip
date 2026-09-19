import type { SerializationNegotiator } from "../negotiator.js";
import type { SerializationProfile } from "../profile.js";
import { JSON_PROFILE_ID } from "./types.js";

/** Negotiation helper preferring SER-JSON-001. */
export class JsonNegotiator {
  constructor(private readonly negotiator: SerializationNegotiator) {}

  negotiateJson(): SerializationProfile {
    return this.negotiator.negotiate({
      profile_id: JSON_PROFILE_ID,
      technology_family: "json",
      require_interchange: true,
    });
  }
}

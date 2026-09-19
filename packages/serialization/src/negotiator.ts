import { SerializationError } from "./errors.js";
import type { SerializationProfile } from "./profile.js";
import type { SerializationProfileRegistry } from "./profile-registry.js";
import type { NegotiationRequest } from "./types.js";

/**
 * Negotiates a registered profile against a request (framework rules only).
 */
export class SerializationNegotiator {
  constructor(private readonly registry: SerializationProfileRegistry) {}

  negotiate(request: NegotiationRequest): SerializationProfile {
    const candidates = this.registry.list().filter((p) => this.matches(p, request));
    if (candidates.length < 1) {
      throw new SerializationError(
        "UNSUPPORTED_PROFILE",
        "No registered profile satisfies negotiation request",
        { request: { ...request } },
      );
    }
    if (request.profile_id && request.profile_version) {
      return this.registry.lookup(request.profile_id, request.profile_version);
    }
    if (request.profile_id) {
      return this.registry.lookup(request.profile_id);
    }
    return candidates[0]!;
  }

  private matches(profile: SerializationProfile, request: NegotiationRequest): boolean {
    if (request.profile_id && profile.profile_id !== request.profile_id) return false;
    if (request.profile_version && profile.profile_version !== request.profile_version) {
      return false;
    }
    if (request.profile_authority && profile.profile_authority !== request.profile_authority) {
      return false;
    }
    if (
      request.technology_family &&
      profile.declaration.technology_family !== request.technology_family
    ) {
      return false;
    }
    if (request.require_interchange && !profile.isInterchange()) return false;
    return true;
  }
}

import {
  ABSTRACT_PROFILE_ID,
  ABSTRACT_PROFILE_VERSION,
  type SerializationProfileDeclaration,
} from "./types.js";
import { SerializationProfileRegistry } from "./profile-registry.js";
import { JsonProfile } from "./json/profile.js";
import { JSON_PROFILE_ID, JSON_PROFILE_VERSION } from "./json/types.js";

const DEFAULT_UNIT_KINDS = Object.freeze([
  "ClaimUnit",
  "EvidenceUnit",
  "ContradictionUnit",
  "NegativeResultUnit",
  "VerificationUnit",
  "GradeDesignationUnit",
  "EventUnit",
]);

/**
 * Top-level serialization registry — owns profile catalog + default profiles.
 */
export class SerializationRegistry {
  readonly profiles = new SerializationProfileRegistry();

  /** Registers the SER-001 abstract framework profile (not a concrete syntax). */
  ensureAbstractProfile(): SerializationProfileDeclaration {
    if (!this.profiles.has(ABSTRACT_PROFILE_ID, ABSTRACT_PROFILE_VERSION)) {
      this.profiles.register({
        profile_id: ABSTRACT_PROFILE_ID,
        profile_version: ABSTRACT_PROFILE_VERSION,
        profile_authority: "SER-001",
        technology_family: "abstract",
        enc_pin: "ENC-001@1.0.0",
        profile_class: "Canonical-interchange",
        supported_unit_kinds: DEFAULT_UNIT_KINDS,
      });
    }
    return this.profiles.lookup(ABSTRACT_PROFILE_ID, ABSTRACT_PROFILE_VERSION).declaration;
  }

  /** Registers SER-JSON-001 concrete JSON profile. */
  ensureJsonProfile(): SerializationProfileDeclaration {
    if (!this.profiles.has(JSON_PROFILE_ID, JSON_PROFILE_VERSION)) {
      this.profiles.register(JsonProfile.declaration());
    }
    return this.profiles.lookup(JSON_PROFILE_ID, JSON_PROFILE_VERSION).declaration;
  }
}

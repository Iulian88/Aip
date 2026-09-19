import type { SerializationProfileDeclaration } from "../types.js";
import {
  JSON_ENC_PIN,
  JSON_PROFILE_ID,
  JSON_PROFILE_VERSION,
} from "./types.js";

const UNIT_KINDS = Object.freeze([
  "ClaimUnit",
  "EvidenceUnit",
  "ContradictionUnit",
  "NegativeResultUnit",
  "VerificationUnit",
  "GradeDesignationUnit",
  "EventUnit",
]);

/** SER-JSON-001 profile declaration for SER-001 registration. */
export class JsonProfile {
  static declaration(): SerializationProfileDeclaration {
    return Object.freeze({
      profile_id: JSON_PROFILE_ID,
      profile_version: JSON_PROFILE_VERSION,
      profile_authority: JSON_PROFILE_ID,
      technology_family: "json" as const,
      enc_pin: JSON_ENC_PIN,
      profile_class: "Canonical-interchange" as const,
      supported_unit_kinds: UNIT_KINDS,
    });
  }
}

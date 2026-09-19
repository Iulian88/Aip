import {
  JSON_ENC_PIN,
  JSON_PROFILE_ID,
  JSON_PROFILE_PIN,
  JSON_PROFILE_VERSION,
  JSON_SER_PIN,
} from "./types.js";

/** SER-JSON-001 version pin — profile-local only (KEEP LOCAL). */
export class JsonVersion {
  static readonly profileId = JSON_PROFILE_ID;
  static readonly version = JSON_PROFILE_VERSION;
  static readonly pin = JSON_PROFILE_PIN;
  static readonly encPin = JSON_ENC_PIN;
  static readonly serPin = JSON_SER_PIN;

  static matches(profilePin: string): boolean {
    return profilePin === JSON_PROFILE_PIN;
  }
}

import {
  SERIALIZATION_FRAMEWORK_AUTHORITY,
  SERIALIZATION_FRAMEWORK_VERSION,
} from "./types.js";

/** SER-001 version pin — serialization-local only (KEEP LOCAL). */
export class SerializationVersion {
  static readonly authority = SERIALIZATION_FRAMEWORK_AUTHORITY;
  static readonly version = SERIALIZATION_FRAMEWORK_VERSION;

  static pin(): string {
    return `${SERIALIZATION_FRAMEWORK_AUTHORITY}@${SERIALIZATION_FRAMEWORK_VERSION}`;
  }

  static matches(authority: string, version: string): boolean {
    return (
      authority === SERIALIZATION_FRAMEWORK_AUTHORITY &&
      version === SERIALIZATION_FRAMEWORK_VERSION
    );
  }
}

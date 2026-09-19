import { CANONICAL_ENCODING_AUTHORITY, CANONICAL_ENCODING_VERSION } from "./types.js";

/** ENC-001 version pin — encoding-local only (KEEP LOCAL). */
export class CanonicalEncodingVersion {
  static readonly authority = CANONICAL_ENCODING_AUTHORITY;
  static readonly version = CANONICAL_ENCODING_VERSION;

  static pin(): string {
    return `${CANONICAL_ENCODING_AUTHORITY}@${CANONICAL_ENCODING_VERSION}`;
  }

  static matches(authority: string, version: string): boolean {
    return (
      authority === CANONICAL_ENCODING_AUTHORITY && version === CANONICAL_ENCODING_VERSION
    );
  }
}

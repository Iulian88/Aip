import type { SerializationProfileDeclaration } from "./types.js";

/**
 * SerializationProfile — declared profile metadata under SER-001.
 */
export class SerializationProfile {
  readonly declaration: SerializationProfileDeclaration;

  constructor(declaration: SerializationProfileDeclaration) {
    this.declaration = Object.freeze({
      ...declaration,
      supported_unit_kinds: Object.freeze([...declaration.supported_unit_kinds]),
    });
  }

  get profile_id(): string {
    return this.declaration.profile_id;
  }

  get profile_version(): string {
    return this.declaration.profile_version;
  }

  get profile_authority(): string {
    return this.declaration.profile_authority;
  }

  supportsUnitKind(kind: string): boolean {
    return this.declaration.supported_unit_kinds.includes(kind);
  }

  isInterchange(): boolean {
    return this.declaration.profile_class === "Canonical-interchange";
  }
}

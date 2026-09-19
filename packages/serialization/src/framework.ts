import type { CanonicalUnit } from "@sciros/encoding";
import { SerializationBinding } from "./binding.js";
import { SerializationCapability } from "./capability.js";
import { SerializationError } from "./errors.js";
import { SerializationNegotiator } from "./negotiator.js";
import type { SerializationProfile } from "./profile.js";
import { SerializationRegistry } from "./registry.js";
import type {
  AbstractProfileInstance,
  NegotiationRequest,
  SerializationCapabilityDescriptor,
  SerializationProfileDeclaration,
} from "./types.js";
import { ABSTRACT_PROFILE_ID, ABSTRACT_PROFILE_VERSION } from "./types.js";
import { JsonDecoder } from "./json/decoder.js";
import { JsonEncoder } from "./json/encoder.js";
import {
  JSON_PROFILE_ID,
  JSON_PROFILE_PIN,
  JSON_PROFILE_VERSION,
} from "./json/types.js";
import { SerializationValidator } from "./validator.js";

function freezeDeep<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return Object.freeze(value.map((v) => freezeDeep(v))) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = freezeDeep(v);
  }
  return Object.freeze(out) as T;
}

/**
 * SER-001 Serialization Framework — profile management + projection.
 * Concrete SER-JSON-001 routes through JsonEncoder / JsonDecoder.
 * Does not mutate Canonical Units or Core objects.
 */
export class SerializationFramework {
  readonly registry = new SerializationRegistry();
  readonly binding = new SerializationBinding();
  readonly negotiator: SerializationNegotiator;
  readonly validator = new SerializationValidator();
  private readonly jsonEncoder = new JsonEncoder();
  private readonly jsonDecoder = new JsonDecoder();

  constructor() {
    this.registry.ensureAbstractProfile();
    this.registry.ensureJsonProfile();
    this.negotiator = new SerializationNegotiator(this.registry.profiles);
  }

  registerProfile(declaration: SerializationProfileDeclaration): SerializationProfile {
    const authorityOk =
      declaration.profile_authority === "SER-001" ||
      declaration.profile_authority === declaration.profile_id;
    if (!authorityOk) {
      throw new SerializationError(
        "AUTHORITY_MISMATCH",
        `Profile authority must be SER-001 or the profile id, got ${declaration.profile_authority}`,
        { profile_authority: declaration.profile_authority },
      );
    }
    return this.registry.profiles.register(declaration);
  }

  lookupProfile(profileId: string, profileVersion?: string): SerializationProfile {
    return this.registry.profiles.lookup(profileId, profileVersion);
  }

  negotiate(request: NegotiationRequest): SerializationProfile {
    return this.negotiator.negotiate(request);
  }

  bind(profileId: string, profileVersion?: string): SerializationProfile {
    const profile = this.registry.profiles.lookup(profileId, profileVersion);
    this.validator.assertProfileAuthority(profile);
    this.binding.bind(profile);
    return profile;
  }

  bindDefaultAbstract(): SerializationProfile {
    return this.bind(ABSTRACT_PROFILE_ID, ABSTRACT_PROFILE_VERSION);
  }

  bindJsonProfile(): SerializationProfile {
    this.registry.ensureJsonProfile();
    return this.bind(JSON_PROFILE_ID, JSON_PROFILE_VERSION);
  }

  capability(profileId: string, profileVersion?: string): SerializationCapabilityDescriptor {
    const profile = this.registry.profiles.lookup(profileId, profileVersion);
    return SerializationCapability.fromProfile(profile);
  }

  assertExportEligible(profileId: string, profileVersion?: string): void {
    const profile = this.registry.profiles.lookup(profileId, profileVersion);
    this.validator.assertExportEligible(profile);
  }

  assertImportEligible(profileId: string, profileVersion?: string): void {
    const profile = this.registry.profiles.lookup(profileId, profileVersion);
    this.validator.assertImportEligible(profile);
  }

  /**
   * Project Canonical Unit → profile instance.
   * SER-JSON-001 → deterministic JSON text; SER-ABS → abstract structural instance.
   */
  project(canonical: unknown, profileId?: string): unknown {
    const profile = profileId
      ? this.registry.profiles.lookup(profileId)
      : (this.binding.getActive() ??
        this.registry.profiles.lookup(JSON_PROFILE_ID, JSON_PROFILE_VERSION));

    this.validator.assertProfileAuthority(profile);
    this.validator.assertExportEligible(profile);
    const unit = this.validator.assertCanonicalUnit(canonical);
    this.validator.assertUnitSupported(profile, unit.envelope.unit_kind);

    if (profile.profile_id === JSON_PROFILE_ID) {
      return this.jsonEncoder.encode(unit, JSON_PROFILE_ID);
    }

    return this.projectAbstract(unit, profile);
  }

  /**
   * Decode profile instance → Canonical Unit.
   * SER-JSON-001 documents (text/object) use JsonDecoder; abstract instances use structural restore.
   */
  decode(instance: unknown): CanonicalUnit {
    if (this.isJsonDocument(instance)) {
      const profile = this.registry.profiles.lookup(JSON_PROFILE_ID, JSON_PROFILE_VERSION);
      this.validator.assertProfileAuthority(profile);
      this.validator.assertImportEligible(profile);
      return this.jsonDecoder.decode(instance);
    }

    const parsed = this.validator.assertProfileInstance(instance);
    const profile = this.registry.profiles.lookup(parsed.profile_id, parsed.profile_version);
    this.validator.assertProfileAuthority(profile);
    this.validator.assertImportEligible(profile);
    if (parsed.profile_authority !== profile.profile_authority) {
      throw new SerializationError(
        "AUTHORITY_MISMATCH",
        "Instance profile_authority does not match registered profile",
      );
    }
    this.validator.assertUnitSupported(profile, parsed.unit_kind);

    const unit = Object.freeze({
      intact: parsed.intact === true,
      envelope: Object.freeze({
        encoding_authority: parsed.encoding_authority,
        encoding_version: parsed.encoding_version,
        unit_kind: parsed.unit_kind,
        ontology_ref: parsed.ontology_ref,
        spec_ref: parsed.spec_ref,
        identity: parsed.identity,
        content_version: parsed.content_version,
        references: freezeDeep(parsed.references),
        events: freezeDeep(parsed.events),
        extensions: freezeDeep(parsed.extensions),
        content: freezeDeep({ ...parsed.content }),
      }),
    }) as unknown as CanonicalUnit;

    this.validator.assertCanonicalUnit(unit);
    return unit;
  }

  private isJsonDocument(instance: unknown): boolean {
    if (typeof instance === "string") {
      const trimmed = instance.trim();
      if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return false;
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return this.isJsonUnitShape(parsed);
      } catch {
        // Let JsonDecoder raise MALFORMED_JSON
        return true;
      }
    }
    return this.isJsonUnitShape(instance);
  }

  private isJsonUnitShape(value: unknown): boolean {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const o = value as Record<string, unknown>;
    if (typeof o.sciros_profile !== "string") return false;
    return (
      o.sciros_profile === JSON_PROFILE_PIN ||
      o.sciros_profile.startsWith(`${JSON_PROFILE_ID}@`) ||
      typeof o.sciros_unit === "string"
    );
  }

  private projectAbstract(
    unit: CanonicalUnit,
    profile: SerializationProfile,
  ): AbstractProfileInstance {
    const env = unit.envelope;
    return Object.freeze({
      profile_id: profile.profile_id,
      profile_version: profile.profile_version,
      profile_authority: profile.profile_authority,
      encoding_authority: env.encoding_authority,
      encoding_version: env.encoding_version,
      unit_kind: env.unit_kind,
      identity: env.identity,
      content_version: env.content_version,
      ontology_ref: env.ontology_ref,
      spec_ref: env.spec_ref,
      intact: unit.intact,
      references: freezeDeep(
        env.references.map((r) => ({ ...r })),
      ) as AbstractProfileInstance["references"],
      events: freezeDeep(
        env.events.map((e) => ({ ...e })),
      ) as AbstractProfileInstance["events"],
      extensions: freezeDeep(
        env.extensions.map((x) => ({ ...x })),
      ) as AbstractProfileInstance["extensions"],
      content: freezeDeep({ ...env.content }),
    });
  }
}

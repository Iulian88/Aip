/**
 * CONF-001 profile registry — deterministic, explicit selection only.
 * SCI profile is frozen; OPS profile is additive (SPEC-017).
 */
import {
  REQUIRED_AUTHORITIES,
  REQUIRED_FIXTURE_PREFIXES,
} from "./types.js";

/** Frozen scientific conformance profile (CONF-001@1.0.0). */
export const PROFILE_SCI = "CONF-001@1.0.0" as const;

/** Additive scientific + Research Operations profile (CONF-001@1.1.0-OPS). */
export const PROFILE_OPS = "CONF-001@1.1.0-OPS" as const;

export const CONFORMANCE_PROFILE_IDS = [PROFILE_SCI, PROFILE_OPS] as const;
export type ConformanceProfileId = (typeof CONFORMANCE_PROFILE_IDS)[number];

export type ConformanceCorpusId =
  | "REF-CORPUS-SCI"
  | "REF-CORPUS-FULL";

export interface ArchitectureFamily {
  readonly prefix: string;
  readonly label: string;
}

/** Profile-local configuration consumed by the same ConformanceEngine. */
export interface ConformanceProfile {
  readonly profile_id: ConformanceProfileId;
  readonly required_authorities: readonly string[];
  readonly required_fixture_prefixes: readonly string[];
  readonly architecture_families: readonly ArchitectureFamily[];
  readonly corpus: ConformanceCorpusId;
}

/** SCI architecture boundary families (frozen). */
export const ARCHITECTURE_FAMILIES_SCI: readonly ArchitectureFamily[] =
  Object.freeze([
    { prefix: "REF-CANON-", label: "encoding evidence" },
    { prefix: "REF-SER-", label: "serialization evidence" },
    { prefix: "REF-PROC-", label: "processor evidence" },
    { prefix: "REF-CLAIM-", label: "scientific core evidence" },
  ]);

/** OPS adds REF-OPS- family recognition under the OPS profile only. */
export const ARCHITECTURE_FAMILIES_OPS: readonly ArchitectureFamily[] =
  Object.freeze([
    ...ARCHITECTURE_FAMILIES_SCI,
    { prefix: "REF-OPS-", label: "operations evidence" },
  ]);

/**
 * Profile-local OPS authority set = SCI ∪ { OPS-001 }.
 * Does NOT mutate global REQUIRED_AUTHORITIES.
 * Does NOT include PERSIST-001.
 */
export const REQUIRED_AUTHORITIES_OPS = Object.freeze([
  ...REQUIRED_AUTHORITIES,
  "OPS-001",
] as const);

/** Profile-local OPS fixture prefixes = SCI ∪ { REF-OPS- }. */
export const REQUIRED_FIXTURE_PREFIXES_OPS = Object.freeze([
  ...REQUIRED_FIXTURE_PREFIXES,
  "REF-OPS-",
] as const);

const SCI_PROFILE: ConformanceProfile = Object.freeze({
  profile_id: PROFILE_SCI,
  required_authorities: REQUIRED_AUTHORITIES,
  required_fixture_prefixes: REQUIRED_FIXTURE_PREFIXES,
  architecture_families: ARCHITECTURE_FAMILIES_SCI,
  corpus: "REF-CORPUS-SCI",
});

const OPS_PROFILE: ConformanceProfile = Object.freeze({
  profile_id: PROFILE_OPS,
  required_authorities: REQUIRED_AUTHORITIES_OPS,
  required_fixture_prefixes: REQUIRED_FIXTURE_PREFIXES_OPS,
  architecture_families: ARCHITECTURE_FAMILIES_OPS,
  corpus: "REF-CORPUS-FULL",
});

const REGISTRY: ReadonlyMap<ConformanceProfileId, ConformanceProfile> =
  new Map([
    [PROFILE_SCI, SCI_PROFILE],
    [PROFILE_OPS, OPS_PROFILE],
  ]);

/**
 * Resolve an explicit profile id. Default is SCI (CONF-001@1.0.0).
 * Never infers from suite name, environment, or fixture prefixes.
 */
export function resolveConformanceProfile(
  profileId?: string | null,
): ConformanceProfile {
  const id = profileId ?? PROFILE_SCI;
  const profile = REGISTRY.get(id as ConformanceProfileId);
  if (!profile) {
    throw new Error(`CONF-001: unknown conformance profile "${id}"`);
  }
  return profile;
}

/** Deterministic registry snapshot (SCI then OPS). */
export function listConformanceProfiles(): readonly ConformanceProfile[] {
  return Object.freeze([SCI_PROFILE, OPS_PROFILE]);
}

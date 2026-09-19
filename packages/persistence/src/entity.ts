/**
 * PersistenceEntity construction — preserves scientific identity exactly.
 * storage_key is storage metadata only.
 */
import { deepClone, deepFreeze, stableStringify } from "./deep.js";
import { PersistenceError } from "./errors.js";
import type {
  PersistenceEntity,
  PersistenceEntityKind,
  PersistenceEvent,
  PersistenceRelationship,
} from "./types.js";
import {
  SUPPORTED_ENCODING_AUTHORITY,
  SUPPORTED_ENCODING_VERSION,
} from "./types.js";
import {
  INITIAL_REVISION_ID,
  assertRevisionId,
  makeCanonicalUnitRevisionStorageKey,
  makeRevisionHeadStorageKey,
} from "./revision.js";

export function makeStorageKey(
  kind: PersistenceEntityKind,
  identity: string,
  discriminator?: string,
): string {
  if (typeof identity !== "string" || identity.trim().length < 1) {
    throw new PersistenceError("INVALID_ID", "identity must be a non-empty string");
  }
  if (discriminator !== undefined && discriminator.length > 0) {
    return `persist:${kind}:${discriminator}:${identity}`;
  }
  return `persist:${kind}:${identity}`;
}

export {
  INITIAL_REVISION_ID,
  REVISION_ID,
  assertRevisionId,
  makeCanonicalUnitRevisionStorageKey,
  makeLegacyCanonicalUnitStorageKey,
  makeRevisionHeadStorageKey,
} from "./revision.js";

export interface CanonicalUnitPersistenceOptions {
  readonly revision_id?: string;
  readonly predecessor_revision_id?: string;
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PersistenceError("INVALID_STATE", `${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  if (typeof v !== "string" || v.length < 1) {
    throw new PersistenceError("INVALID_STATE", `Missing required field: ${key}`);
  }
  return v;
}

function mapReferences(
  identity: string,
  refs: unknown,
): readonly PersistenceRelationship[] {
  if (refs === undefined || refs === null) return Object.freeze([]);
  if (!Array.isArray(refs)) {
    throw new PersistenceError("INVALID_STATE", "references must be an array");
  }
  const out: PersistenceRelationship[] = [];
  let ordinal = 0;
  for (const raw of refs) {
    const r = asRecord(raw, "reference");
    const target = requireString(r, "identity");
    const role = typeof r.role === "string" ? r.role : "reference";
    const target_class =
      typeof r.target_class === "string" ? r.target_class : undefined;
    out.push(
      Object.freeze({
        relationship_id: `${identity}:${role}:${target}:${ordinal}`,
        relationship_type: role,
        source_identity: identity,
        target_identity: target,
        ...(target_class !== undefined ? { target_class } : {}),
        ordinal,
        metadata: Object.freeze(
          deepClone({
            ...(typeof r.version_hint === "string"
              ? { version_hint: r.version_hint }
              : {}),
          }),
        ),
      }),
    );
    ordinal += 1;
  }
  return Object.freeze(out);
}

function mapEvents(identity: string, events: unknown): readonly PersistenceEvent[] {
  if (events === undefined || events === null) return Object.freeze([]);
  if (!Array.isArray(events)) {
    throw new PersistenceError("INVALID_STATE", "events must be an array");
  }
  const out: PersistenceEvent[] = [];
  let ordinal = 0;
  for (const raw of events) {
    const e = asRecord(raw, "event");
    const event_id = requireString(e, "event_id");
    out.push(
      Object.freeze({
        event_id,
        parent_identity:
          typeof e.parent_identity === "string" ? e.parent_identity : identity,
        ...(typeof e.parent_class === "string" ? { parent_class: e.parent_class } : {}),
        event_type:
          typeof e.event_type === "string"
            ? e.event_type
            : typeof e.to_state === "string"
              ? `transition:${e.to_state}`
              : "event",
        ...(typeof e.at === "string" ? { at: e.at } : {}),
        ...(typeof e.from_state === "string" ? { from_state: e.from_state } : {}),
        ...(typeof e.to_state === "string" ? { to_state: e.to_state } : {}),
        ...(typeof e.authority_agent === "string"
          ? { authority_agent: e.authority_agent }
          : {}),
        ...(typeof e.reason === "string" ? { reason: e.reason } : {}),
        ...(typeof e.decision_ref === "string" ? { decision_ref: e.decision_ref } : {}),
        payload: Object.freeze(deepClone(e)),
        ordinal,
      }),
    );
    ordinal += 1;
  }
  return Object.freeze(out);
}

function assertEncodingPins(
  encoding_authority: string | undefined,
  encoding_version: string | undefined,
): void {
  if (encoding_authority === undefined && encoding_version === undefined) return;
  if (encoding_authority !== SUPPORTED_ENCODING_AUTHORITY) {
    throw new PersistenceError(
      "INVALID_AUTHORITY",
      `Unsupported encoding authority: ${String(encoding_authority)}`,
    );
  }
  if (encoding_version !== SUPPORTED_ENCODING_VERSION) {
    throw new PersistenceError(
      "UNSUPPORTED_VERSION",
      `Unsupported encoding version: ${String(encoding_version)}`,
    );
  }
}

/** Build PersistenceEntity from a Canonical Unit object (ENC-001 shape). */
export function entityFromCanonicalUnit(
  unit: unknown,
  options?: CanonicalUnitPersistenceOptions,
): PersistenceEntity {
  const root = asRecord(unit, "CanonicalUnit");
  if (typeof root.intact !== "boolean") {
    throw new PersistenceError("INTEGRITY_FAILURE", "Canonical unit.intact missing");
  }
  const env = asRecord(root.envelope, "envelope");
  const identity = requireString(env, "identity");
  const content_version = requireString(env, "content_version");
  const encoding_authority = requireString(env, "encoding_authority");
  const encoding_version = requireString(env, "encoding_version");
  assertEncodingPins(encoding_authority, encoding_version);

  const ontology_ref = requireString(env, "ontology_ref");
  const spec_ref = requireString(env, "spec_ref");
  const unit_kind = requireString(env, "unit_kind");

  const kindMap: Record<string, PersistenceEntityKind> = {
    ClaimUnit: "CanonicalUnit",
    EvidenceUnit: "CanonicalUnit",
    ContradictionUnit: "CanonicalUnit",
    NegativeResultUnit: "CanonicalUnit",
    VerificationUnit: "CanonicalUnit",
    GradeDesignationUnit: "CanonicalUnit",
    EventUnit: "Event",
  };
  const entity_kind = kindMap[unit_kind];
  if (!entity_kind) {
    throw new PersistenceError("INVALID_STATE", `Unknown unit_kind: ${unit_kind}`);
  }

  const payload = deepFreeze(deepClone(root));
  const references = mapReferences(identity, env.references);
  const events = mapEvents(identity, env.events);

  if (entity_kind === "Event") {
    return Object.freeze({
      storage_key: makeStorageKey("Event", identity),
      entity_kind: "Event" as const,
      identity,
      content_version,
      ontology_ref,
      spec_ref,
      encoding_authority,
      encoding_version,
      intact: root.intact,
      payload,
      references,
      events,
    });
  }

  const revision_id = options?.revision_id ?? INITIAL_REVISION_ID;
  assertRevisionId(revision_id);
  const predecessor = options?.predecessor_revision_id;
  if (predecessor !== undefined) {
    assertRevisionId(predecessor, "predecessor_revision_id");
    if (revision_id === INITIAL_REVISION_ID) {
      throw new PersistenceError(
        "INVALID_STATE",
        "rev:initial must not have predecessor_revision_id",
      );
    }
    if (predecessor === revision_id) {
      throw new PersistenceError(
        "INVALID_STATE",
        "predecessor_revision_id must differ from revision_id",
      );
    }
  } else if (revision_id !== INITIAL_REVISION_ID) {
    throw new PersistenceError(
      "INVALID_STATE",
      "non-initial CanonicalUnit revision requires predecessor_revision_id",
    );
  }

  return Object.freeze({
    storage_key: makeCanonicalUnitRevisionStorageKey(unit_kind, identity, revision_id),
    entity_kind: "CanonicalUnit" as const,
    identity,
    content_version,
    revision_id,
    ...(predecessor !== undefined ? { predecessor_revision_id: predecessor } : {}),
    ontology_ref,
    spec_ref,
    encoding_authority,
    encoding_version,
    intact: root.intact,
    payload,
    references,
    events,
  });
}

/** Model C RevisionHead entity (mutable coordination pointer). */
export function entityFromRevisionHead(
  scientific_identity: string,
  unit_kind: string,
  revision_id: string,
): PersistenceEntity {
  assertRevisionId(revision_id);
  if (typeof unit_kind !== "string" || unit_kind.trim().length < 1) {
    throw new PersistenceError("INVALID_ID", "unit_kind must be non-empty");
  }
  if (typeof scientific_identity !== "string" || scientific_identity.trim().length < 1) {
    throw new PersistenceError("INVALID_ID", "identity must be non-empty");
  }
  return Object.freeze({
    storage_key: makeRevisionHeadStorageKey(unit_kind, scientific_identity),
    entity_kind: "RevisionHead" as const,
    identity: scientific_identity,
    content_version: revision_id,
    payload: deepFreeze(
      deepClone({
        unit_kind,
        scientific_identity,
        revision_id,
      }),
    ),
    references: Object.freeze([]),
    events: Object.freeze([]),
  });
}

/** Build entity for a Core-like object with an explicit kind + identity field. */
export function entityFromCoreObject(
  kind: PersistenceEntityKind,
  identityField: string,
  obj: unknown,
): PersistenceEntity {
  const root = asRecord(obj, kind);
  const identity = requireString(root, identityField);
  const versionKeyCandidates = [
    "claim_version",
    "evidence_version",
    "contradiction_version",
    "negative_result_version",
    "verification_version",
    "content_version",
    "version",
  ];
  let content_version: string | undefined;
  for (const k of versionKeyCandidates) {
    if (typeof root[k] === "string" && (root[k] as string).length > 0) {
      content_version = root[k] as string;
      break;
    }
  }
  if (!content_version) {
    throw new PersistenceError("INVALID_VERSION", "content version missing on entity");
  }

  const ontology_ref =
    typeof root.ontology_ref === "string" ? root.ontology_ref : undefined;
  const spec_ref = typeof root.spec_ref === "string" ? root.spec_ref : undefined;

  return Object.freeze({
    storage_key: makeStorageKey(kind, identity),
    entity_kind: kind,
    identity,
    content_version,
    ...(ontology_ref !== undefined ? { ontology_ref } : {}),
    ...(spec_ref !== undefined ? { spec_ref } : {}),
    payload: deepFreeze(deepClone(root)),
    references: Object.freeze([]),
    events: Object.freeze([]),
  });
}

/** Persist opaque report/certificate artifacts with caller-supplied identity. */
export function entityFromArtifact(
  kind: PersistenceEntityKind,
  identity: string,
  content_version: string,
  payload: unknown,
  extras?: {
    readonly ontology_ref?: string;
    readonly spec_ref?: string;
  },
): PersistenceEntity {
  if (typeof identity !== "string" || identity.length < 1) {
    throw new PersistenceError("INVALID_ID", "identity must be non-empty");
  }
  if (typeof content_version !== "string" || content_version.length < 1) {
    throw new PersistenceError("INVALID_VERSION", "content_version must be non-empty");
  }
  const record = asRecord(payload, kind);
  return Object.freeze({
    storage_key: makeStorageKey(kind, identity),
    entity_kind: kind,
    identity,
    content_version,
    ...(extras?.ontology_ref !== undefined ? { ontology_ref: extras.ontology_ref } : {}),
    ...(extras?.spec_ref !== undefined ? { spec_ref: extras.spec_ref } : {}),
    payload: deepFreeze(deepClone(record)),
    references: Object.freeze([]),
    events: Object.freeze([]),
  });
}

/** Explicit relationship entity. */
export function entityFromRelationship(
  rel: PersistenceRelationship,
): PersistenceEntity {
  return Object.freeze({
    storage_key: makeStorageKey("Relationship", rel.relationship_id),
    entity_kind: "Relationship",
    identity: rel.relationship_id,
    content_version: "1.0.0",
    payload: deepFreeze(deepClone(rel as unknown as Record<string, unknown>)),
    references: Object.freeze([rel]),
    events: Object.freeze([]),
  });
}

export function fingerprintEntity(entity: PersistenceEntity): string {
  return stableStringify({
    identity: entity.identity,
    entity_kind: entity.entity_kind,
    content_version: entity.content_version,
    revision_id: entity.revision_id ?? null,
    predecessor_revision_id: entity.predecessor_revision_id ?? null,
    ontology_ref: entity.ontology_ref ?? null,
    spec_ref: entity.spec_ref ?? null,
    encoding_authority: entity.encoding_authority ?? null,
    encoding_version: entity.encoding_version ?? null,
    intact: entity.intact ?? null,
    payload: entity.payload,
    references: entity.references,
    events: entity.events,
  });
}

/**
 * Kinds treated as immutable once created.
 * RevisionHead is intentionally excluded — mutable Model C coordination pointer.
 */
export const IMMUTABLE_KINDS: ReadonlySet<PersistenceEntityKind> = new Set([
  "CanonicalUnit",
  "Claim",
  "Evidence",
  "GradeDesignation",
  "Contradiction",
  "NegativeResult",
  "Verification",
  "Relationship",
  "Event",
  "SerializedDocument",
  "ConformanceReport",
  "CertificationReport",
  "CertificationCertificate",
]);

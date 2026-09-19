/**
 * Deterministic in-memory store (reference adapter — not production durable storage).
 * Obeys the same repository semantics as a future durable backend.
 * Model C: revision keys, dual-read of legacy three-segment keys, RevisionHead CAS.
 */
import { deepClone, deepFreeze, stableEqual, stableStringify } from "../deep.js";
import { PersistenceError } from "../errors.js";
import {
  fingerprintEntity,
  IMMUTABLE_KINDS,
  makeStorageKey,
  entityFromRevisionHead,
} from "../entity.js";
import {
  INITIAL_REVISION_ID,
  assertRevisionId,
  makeCanonicalUnitRevisionStorageKey,
  makeLegacyCanonicalUnitStorageKey,
  makeRevisionHeadStorageKey,
} from "../revision.js";
import type { ReplaceOptions, IdentityOptions } from "../repository.js";
import type { PersistenceRepository } from "../repository.js";
import type {
  PersistenceEntity,
  PersistenceEntityKind,
  PersistenceEvent,
  PersistenceFilter,
  PersistencePage,
  PersistenceQuery,
  PersistenceSnapshot,
} from "../types.js";
import { PERSISTENCE_SCHEMA_VERSION } from "../types.js";
function compareIdentity(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareEntity(a: PersistenceEntity, b: PersistenceEntity): number {
  const k = compareIdentity(a.entity_kind, b.entity_kind);
  if (k !== 0) return k;
  const i = compareIdentity(a.identity, b.identity);
  if (i !== 0) return i;
  const ra = a.revision_id ?? "";
  const rb = b.revision_id ?? "";
  const r = compareIdentity(ra, rb);
  if (r !== 0) return r;
  return compareIdentity(a.storage_key, b.storage_key);
}

function compareEvent(a: PersistenceEvent, b: PersistenceEvent): number {
  const p = compareIdentity(a.parent_identity, b.parent_identity);
  if (p !== 0) return p;
  if (a.ordinal !== b.ordinal) return a.ordinal - b.ordinal;
  return compareIdentity(a.event_id, b.event_id);
}

function matchesFilter(entity: PersistenceEntity, filter: PersistenceFilter): boolean {
  if (filter.identity !== undefined && entity.identity !== filter.identity) return false;
  if (filter.entity_kind !== undefined && entity.entity_kind !== filter.entity_kind) {
    return false;
  }
  if (filter.ontology_ref !== undefined && entity.ontology_ref !== filter.ontology_ref) {
    return false;
  }
  if (filter.spec_ref !== undefined && entity.spec_ref !== filter.spec_ref) return false;
  if (
    filter.content_version !== undefined &&
    entity.content_version !== filter.content_version
  ) {
    return false;
  }
  if (
    filter.encoding_authority !== undefined &&
    entity.encoding_authority !== filter.encoding_authority
  ) {
    return false;
  }
  if (filter.relationship_type !== undefined) {
    if (
      !entity.references.some((r) => r.relationship_type === filter.relationship_type)
    ) {
      return false;
    }
  }
  if (filter.source_identity !== undefined) {
    if (!entity.references.some((r) => r.source_identity === filter.source_identity)) {
      return false;
    }
  }
  if (filter.target_identity !== undefined) {
    if (!entity.references.some((r) => r.target_identity === filter.target_identity)) {
      return false;
    }
  }
  return true;
}

interface StoreState {
  entities: Map<string, PersistenceEntity>;
  /** Global append-only event journal keyed by parent_identity. */
  events: Map<string, PersistenceEvent[]>;
}

function cloneState(state: StoreState): StoreState {
  const entities = new Map<string, PersistenceEntity>();
  for (const [k, v] of state.entities) {
    entities.set(k, deepFreeze(deepClone(v)));
  }
  const events = new Map<string, PersistenceEvent[]>();
  for (const [k, v] of state.events) {
    events.set(
      k,
      v.map((e) => deepFreeze(deepClone(e))),
    );
  }
  return { entities, events };
}

export class MemoryStore {
  private state: StoreState = { entities: new Map(), events: new Map() };
  private opLog: string[] = [];

  note(op: string): void {
    this.opLog.push(op);
  }

  operations(): readonly string[] {
    return Object.freeze([...this.opLog]);
  }

  getState(): StoreState {
    return this.state;
  }

  replaceState(state: StoreState): void {
    this.state = state;
  }

  snapshotState(): StoreState {
    return cloneState(this.state);
  }
}

function unitKindOf(entity: PersistenceEntity): string | undefined {
  if (entity.entity_kind === "RevisionHead") {
    const uk = (entity.payload as { unit_kind?: unknown }).unit_kind;
    return typeof uk === "string" && uk.length > 0 ? uk : undefined;
  }
  const payload = entity.payload as { envelope?: { unit_kind?: string } };
  return payload.envelope?.unit_kind;
}

function revisionIdOf(entity: PersistenceEntity): string {
  if (typeof entity.revision_id === "string" && entity.revision_id.length > 0) {
    return entity.revision_id;
  }
  // Legacy three-segment CanonicalUnit ≡ rev:initial
  return INITIAL_REVISION_ID;
}

/**
 * Resolve storage_key for get/exists/delete.
 * CanonicalUnit: four-segment revision keys with dual-read of legacy three-segment
 * as rev:initial; omitted revision_id resolves via RevisionHead then rev:initial.
 */
function resolveKey(
  identity: string,
  entity_kind: PersistenceEntityKind | undefined,
  entities: Map<string, PersistenceEntity>,
  unit_kind?: string,
  revision_id?: string,
): string {
  if (typeof identity !== "string" || identity.length < 1) {
    throw new PersistenceError("INVALID_ID", "identity must be non-empty");
  }

  if (entity_kind === "RevisionHead") {
    if (!unit_kind) {
      throw new PersistenceError(
        "INVALID_ID",
        "RevisionHead lookup requires unit_kind",
      );
    }
    const key = makeRevisionHeadStorageKey(unit_kind, identity);
    if (!entities.has(key)) {
      throw new PersistenceError("NOT_FOUND", `RevisionHead not found: ${identity}`);
    }
    return key;
  }

  if (entity_kind === "CanonicalUnit" && unit_kind) {
    if (revision_id !== undefined) {
      assertRevisionId(revision_id);
      const k4 = makeCanonicalUnitRevisionStorageKey(unit_kind, identity, revision_id);
      if (entities.has(k4)) return k4;
      if (revision_id === INITIAL_REVISION_ID) {
        const k3 = makeLegacyCanonicalUnitStorageKey(unit_kind, identity);
        if (entities.has(k3)) return k3;
      }
      throw new PersistenceError(
        "NOT_FOUND",
        `Entity not found: ${identity} revision ${revision_id}`,
      );
    }

    // Head-resolved current representation
    const headKey = makeRevisionHeadStorageKey(unit_kind, identity);
    const head = entities.get(headKey);
    if (head) {
      const pointed =
        typeof head.content_version === "string" && head.content_version.length > 0
          ? head.content_version
          : INITIAL_REVISION_ID;
      return resolveKey(identity, "CanonicalUnit", entities, unit_kind, pointed);
    }

    // No head: sole initial revision (Model C write or legacy)
    const k4 = makeCanonicalUnitRevisionStorageKey(
      unit_kind,
      identity,
      INITIAL_REVISION_ID,
    );
    if (entities.has(k4)) return k4;
    const k3 = makeLegacyCanonicalUnitStorageKey(unit_kind, identity);
    if (entities.has(k3)) return k3;
    throw new PersistenceError("NOT_FOUND", `Entity not found: ${identity}`);
  }

  if (entity_kind && entity_kind !== "CanonicalUnit" && unit_kind) {
    return makeStorageKey(entity_kind, identity, unit_kind);
  }
  if (entity_kind && entity_kind !== "CanonicalUnit") {
    return makeStorageKey(entity_kind, identity);
  }

  const matches: string[] = [];
  for (const [key, ent] of entities) {
    if (ent.identity !== identity) continue;
    if (ent.entity_kind === "RevisionHead") continue;
    if (entity_kind && ent.entity_kind !== entity_kind) continue;
    if (unit_kind) {
      if (unitKindOf(ent) !== unit_kind) continue;
    }
    matches.push(key);
  }
  if (matches.length === 0) {
    throw new PersistenceError("NOT_FOUND", `Entity not found: ${identity}`);
  }
  if (matches.length > 1) {
    // Prefer head-resolved CanonicalUnit when ambiguous across revisions
    if (entity_kind === "CanonicalUnit" || entity_kind === undefined) {
      const byKind = new Map<string, string[]>();
      for (const key of matches) {
        const ent = entities.get(key)!;
        const uk = unitKindOf(ent) ?? "";
        const list = byKind.get(uk) ?? [];
        list.push(key);
        byKind.set(uk, list);
      }
      if (byKind.size === 1) {
        const uk = [...byKind.keys()][0]!;
        if (uk.length > 0) {
          return resolveKey(identity, "CanonicalUnit", entities, uk, revision_id);
        }
      }
    }
    matches.sort(compareIdentity);
    throw new PersistenceError(
      "INVALID_ID",
      `Ambiguous identity without unit_kind: ${identity}`,
      { keys: matches },
    );
  }
  return matches[0]!;
}

export class MemoryPersistenceRepository implements PersistenceRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly buffer: StoreState | null = null,
  ) {}

  private working(): StoreState {
    return this.buffer ?? this.store.getState();
  }

  private persistWorking(state: StoreState): void {
    if (this.buffer) {
      void state;
      return;
    }
    this.store.replaceState(state);
  }

  async create(entity: PersistenceEntity): Promise<PersistenceEntity> {
    const state = this.working();
    if (state.entities.has(entity.storage_key)) {
      throw new PersistenceError(
        "ALREADY_EXISTS",
        `Entity already exists: ${entity.identity}`,
        { storage_key: entity.storage_key },
      );
    }
    const frozen = deepFreeze(deepClone(entity));
    state.entities.set(entity.storage_key, frozen);
    if (frozen.events.length > 0) {
      const journal = [...(state.events.get(frozen.identity) ?? [])];
      for (const ev of frozen.events) {
        if (!journal.some((j) => j.event_id === ev.event_id)) {
          journal.push(deepFreeze(deepClone(ev)));
        }
      }
      journal.sort(compareEvent);
      state.events.set(frozen.identity, journal);
    }
    this.persistWorking(state);
    this.store.note(`create:${entity.storage_key}`);
    return frozen;
  }

  async get(
    identity: string,
    entity_kind?: PersistenceEntityKind,
    options?: IdentityOptions,
  ): Promise<PersistenceEntity> {
    const state = this.working();
    const key = resolveKey(
      identity,
      entity_kind,
      state.entities,
      options?.unit_kind,
      options?.revision_id,
    );
    const ent = state.entities.get(key);
    if (!ent) {
      throw new PersistenceError("NOT_FOUND", `Entity not found: ${identity}`);
    }
    this.store.note(`read:${key}`);
    return deepFreeze(deepClone(ent));
  }

  async exists(
    identity: string,
    entity_kind?: PersistenceEntityKind,
    options?: IdentityOptions,
  ): Promise<boolean> {
    const state = this.working();
    try {
      const key = resolveKey(
        identity,
        entity_kind,
        state.entities,
        options?.unit_kind,
        options?.revision_id,
      );
      return state.entities.has(key);
    } catch (err) {
      if (err instanceof PersistenceError && err.code === "NOT_FOUND") return false;
      throw err;
    }
  }

  async list(query: PersistenceQuery = { filter: {} }): Promise<PersistencePage<PersistenceEntity>> {
    const state = this.working();
    const filter = query.filter ?? {};
    const all = [...state.entities.values()]
      .filter((e) => matchesFilter(e, filter))
      .sort(compareEntity);
    const offset = query.offset ?? 0;
    const limit = query.limit ?? all.length;
    if (offset < 0 || limit < 0) {
      throw new PersistenceError("INVALID_STATE", "offset/limit must be >= 0");
    }
    const items = all.slice(offset, offset + limit).map((e) => deepFreeze(deepClone(e)));
    this.store.note(`list:${all.length}`);
    return Object.freeze({
      items: Object.freeze(items),
      offset,
      limit,
      total: all.length,
    });
  }

  async replace(
    entity: PersistenceEntity,
    options?: ReplaceOptions,
  ): Promise<PersistenceEntity> {
    const state = this.working();
    const existing = state.entities.get(entity.storage_key);
    if (!existing) {
      throw new PersistenceError("NOT_FOUND", `Entity not found: ${entity.identity}`);
    }
    if (
      options?.expected_version !== undefined &&
      options.expected_version !== existing.content_version
    ) {
      throw new PersistenceError(
        "CONFLICT",
        `Stale version: expected ${options.expected_version}, stored ${existing.content_version}`,
        {
          identity: entity.identity,
          expected: options.expected_version,
          stored: existing.content_version,
        },
      );
    }
    if (fingerprintEntity(existing) === fingerprintEntity(entity)) {
      this.store.note(`replace:idempotent:${entity.storage_key}`);
      return deepFreeze(deepClone(existing));
    }
    if (IMMUTABLE_KINDS.has(existing.entity_kind)) {
      throw new PersistenceError(
        "IMMUTABLE_ENTITY",
        `Mutation rejected for immutable entity: ${entity.identity}`,
        { entity_kind: existing.entity_kind },
      );
    }
    const frozen = deepFreeze(deepClone(entity));
    state.entities.set(entity.storage_key, frozen);
    this.persistWorking(state);
    this.store.note(`replace:${entity.storage_key}`);
    return frozen;
  }

  async appendEvent(
    parent_identity: string,
    event: PersistenceEvent,
  ): Promise<PersistenceEvent> {
    if (event.parent_identity !== parent_identity) {
      throw new PersistenceError(
        "INVALID_STATE",
        "event.parent_identity must match parent_identity argument",
      );
    }
    const state = this.working();
    // Parent must exist as some entity
    const parentExists = [...state.entities.values()].some(
      (e) => e.identity === parent_identity,
    );
    if (!parentExists) {
      throw new PersistenceError(
        "NOT_FOUND",
        `Cannot append event; parent missing: ${parent_identity}`,
      );
    }
    const journal = [...(state.events.get(parent_identity) ?? [])];
    if (journal.some((e) => e.event_id === event.event_id)) {
      throw new PersistenceError(
        "ALREADY_EXISTS",
        `Event already exists: ${event.event_id}`,
      );
    }
    const ordinal = journal.length;
    const stored = deepFreeze(
      deepClone({
        ...event,
        ordinal,
      }),
    );
    journal.push(stored);
    journal.sort(compareEvent);
    state.events.set(parent_identity, journal);
    this.persistWorking(state);
    this.store.note(`append-event:${parent_identity}:${event.event_id}`);
    return stored;
  }

  async getEvents(parent_identity: string): Promise<readonly PersistenceEvent[]> {
    const state = this.working();
    const journal = [...(state.events.get(parent_identity) ?? [])].sort(compareEvent);
    this.store.note(`get-events:${parent_identity}`);
    return Object.freeze(journal.map((e) => deepFreeze(deepClone(e))));
  }

  async snapshot(): Promise<PersistenceSnapshot> {
    const state = this.working();
    const entities = [...state.entities.values()].sort(compareEntity).map((e) =>
      deepFreeze(deepClone(e)),
    );
    const event_journal = [...state.events.values()]
      .flat()
      .sort(compareEvent)
      .map((e) => deepFreeze(deepClone(e)));
    const body = {
      schema_version: PERSISTENCE_SCHEMA_VERSION,
      entities,
      event_journal,
    };
    const snapshot_id = `snap:${stableStringify(body).length}:${entities.length}:${event_journal.length}`;
    this.store.note("snapshot");
    return Object.freeze({
      snapshot_id,
      schema_version: PERSISTENCE_SCHEMA_VERSION,
      entities: Object.freeze(entities),
      event_journal: Object.freeze(event_journal),
    });
  }

  async restore(snapshot: PersistenceSnapshot): Promise<PersistenceSnapshot> {
    if (snapshot.schema_version !== PERSISTENCE_SCHEMA_VERSION) {
      throw new PersistenceError(
        "UNSUPPORTED_VERSION",
        `Unsupported snapshot schema: ${snapshot.schema_version}`,
      );
    }
    if (!Array.isArray(snapshot.entities) || !Array.isArray(snapshot.event_journal)) {
      throw new PersistenceError("DESERIALIZATION_FAILED", "Malformed snapshot");
    }
    const entities = new Map<string, PersistenceEntity>();
    for (const e of snapshot.entities) {
      if (!e || typeof e !== "object" || typeof e.storage_key !== "string") {
        throw new PersistenceError("DESERIALIZATION_FAILED", "Malformed snapshot entity");
      }
      entities.set(e.storage_key, deepFreeze(deepClone(e)));
    }
    const events = new Map<string, PersistenceEvent[]>();
    for (const ev of snapshot.event_journal) {
      if (!ev || typeof ev !== "object" || typeof ev.event_id !== "string") {
        throw new PersistenceError("DESERIALIZATION_FAILED", "Malformed snapshot event");
      }
      const list = events.get(ev.parent_identity) ?? [];
      list.push(deepFreeze(deepClone(ev)));
      events.set(ev.parent_identity, list);
    }
    for (const [k, list] of events) {
      list.sort(compareEvent);
      events.set(k, list);
    }
    const next = { entities, events };
    if (this.buffer) {
      this.buffer.entities = entities;
      this.buffer.events = events;
    } else {
      this.store.replaceState(next);
    }
    this.store.note("restore");
    return this.snapshot();
  }

  async delete(
    identity: string,
    entity_kind?: PersistenceEntityKind,
    options?: IdentityOptions,
  ): Promise<never> {
    void identity;
    void entity_kind;
    void options;
    this.store.note("delete:reject");
    throw new PersistenceError(
      "DELETE_NOT_PERMITTED",
      "Destructive delete is not permitted for authoritative SciROS artifacts",
    );
  }

  async queryRelationships(
    filter: PersistenceFilter,
  ): Promise<readonly PersistenceEntity[]> {
    const page = await this.list({ filter });
    return page.items.filter(
      (e) =>
        e.entity_kind === "Relationship" ||
        e.references.length > 0 ||
        filter.relationship_type !== undefined ||
        filter.target_identity !== undefined ||
        filter.source_identity !== undefined,
    );
  }

  async getHead(identity: string, unit_kind: string): Promise<PersistenceEntity> {
    return this.get(identity, "RevisionHead", { unit_kind });
  }

  async ensureInitialHead(
    identity: string,
    unit_kind: string,
    revision_id: string = INITIAL_REVISION_ID,
  ): Promise<PersistenceEntity> {
    assertRevisionId(revision_id);
    const state = this.working();
    const key = makeRevisionHeadStorageKey(unit_kind, identity);
    const existing = state.entities.get(key);
    if (existing) {
      if (existing.content_version === revision_id) {
        this.store.note(`ensure-head:idempotent:${key}`);
        return deepFreeze(deepClone(existing));
      }
      throw new PersistenceError(
        "CONFLICT",
        `RevisionHead already points at ${existing.content_version}, not ${revision_id}`,
        {
          identity,
          unit_kind,
          expected: revision_id,
          stored: existing.content_version,
        },
      );
    }
    // Revision row must exist (four-segment or legacy dual-read for rev:initial)
    const revKey = resolveKey(
      identity,
      "CanonicalUnit",
      state.entities,
      unit_kind,
      revision_id,
    );
    if (!state.entities.has(revKey)) {
      throw new PersistenceError(
        "NOT_FOUND",
        `Cannot ensure head; revision missing: ${identity} ${revision_id}`,
      );
    }
    const head = entityFromRevisionHead(identity, unit_kind, revision_id);
    return this.create(head);
  }

  async advanceHead(
    identity: string,
    unit_kind: string,
    from_revision_id: string,
    to_revision_id: string,
  ): Promise<PersistenceEntity> {
    assertRevisionId(from_revision_id, "from_revision_id");
    assertRevisionId(to_revision_id, "to_revision_id");
    if (from_revision_id === to_revision_id) {
      throw new PersistenceError(
        "INVALID_STATE",
        "advanceHead from_revision_id must differ from to_revision_id",
      );
    }
    // Target revision must exist
    await this.get(identity, "CanonicalUnit", {
      unit_kind,
      revision_id: to_revision_id,
    });
    const current = await this.getHead(identity, unit_kind);
    if (current.content_version !== from_revision_id) {
      throw new PersistenceError(
        "CONFLICT",
        `Stale head: expected ${from_revision_id}, stored ${current.content_version}`,
        {
          identity,
          unit_kind,
          expected: from_revision_id,
          stored: current.content_version,
        },
      );
    }
    const next = entityFromRevisionHead(identity, unit_kind, to_revision_id);
    return this.replace(next, { expected_version: from_revision_id });
  }

  async listRevisions(
    identity: string,
    unit_kind: string,
  ): Promise<readonly PersistenceEntity[]> {
    const state = this.working();
    const rows: PersistenceEntity[] = [];
    for (const ent of state.entities.values()) {
      if (ent.entity_kind !== "CanonicalUnit") continue;
      if (ent.identity !== identity) continue;
      if (unitKindOf(ent) !== unit_kind) continue;
      rows.push(ent);
    }
    rows.sort((a, b) => compareIdentity(revisionIdOf(a), revisionIdOf(b)));
    this.store.note(`list-revisions:${identity}:${unit_kind}:${rows.length}`);
    return Object.freeze(rows.map((e) => deepFreeze(deepClone(e))));
  }
}

export function assertEntityIntegrity(entity: PersistenceEntity): void {
  if (entity.entity_kind === "CanonicalUnit") {
    if (entity.intact !== true) {
      throw new PersistenceError(
        "INTEGRITY_FAILURE",
        `Canonical unit not intact: ${entity.identity}`,
      );
    }
    if (
      entity.encoding_authority !== "ENC-001" ||
      entity.encoding_version !== "1.0.0"
    ) {
      throw new PersistenceError(
        "INTEGRITY_FAILURE",
        "Canonical encoding pins do not match stored integrity expectations",
      );
    }
    // Detect payload tampering vs frozen envelope identity
    const payload = entity.payload as { envelope?: { identity?: string }; intact?: boolean };
    if (!payload.envelope || payload.envelope.identity !== entity.identity) {
      throw new PersistenceError(
        "INTEGRITY_FAILURE",
        "Payload identity does not match entity identity",
      );
    }
    if (payload.intact !== true) {
      throw new PersistenceError("INTEGRITY_FAILURE", "Payload intact flag false");
    }
  }
}

export function entitiesEqual(a: PersistenceEntity, b: PersistenceEntity): boolean {
  return stableEqual(
    {
      identity: a.identity,
      entity_kind: a.entity_kind,
      content_version: a.content_version,
      revision_id: a.revision_id ?? null,
      predecessor_revision_id: a.predecessor_revision_id ?? null,
      ontology_ref: a.ontology_ref,
      spec_ref: a.spec_ref,
      encoding_authority: a.encoding_authority,
      encoding_version: a.encoding_version,
      intact: a.intact,
      payload: a.payload,
      references: a.references,
      events: a.events,
    },
    {
      identity: b.identity,
      entity_kind: b.entity_kind,
      content_version: b.content_version,
      revision_id: b.revision_id ?? null,
      predecessor_revision_id: b.predecessor_revision_id ?? null,
      ontology_ref: b.ontology_ref,
      spec_ref: b.spec_ref,
      encoding_authority: b.encoding_authority,
      encoding_version: b.encoding_version,
      intact: b.intact,
      payload: b.payload,
      references: b.references,
      events: b.events,
    },
  );
}

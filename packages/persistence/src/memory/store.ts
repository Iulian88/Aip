/**
 * Deterministic in-memory store (reference adapter — not production durable storage).
 * Obeys the same repository semantics as a future durable backend.
 */
import { deepClone, deepFreeze, stableEqual, stableStringify } from "../deep.js";
import { PersistenceError } from "../errors.js";
import { fingerprintEntity, IMMUTABLE_KINDS, makeStorageKey } from "../entity.js";
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
  return compareIdentity(a.identity, b.identity);
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

function resolveKey(
  identity: string,
  entity_kind: PersistenceEntityKind | undefined,
  entities: Map<string, PersistenceEntity>,
  unit_kind?: string,
): string {
  if (typeof identity !== "string" || identity.length < 1) {
    throw new PersistenceError("INVALID_ID", "identity must be non-empty");
  }
  if (entity_kind && unit_kind) {
    return makeStorageKey(entity_kind, identity, unit_kind);
  }
  if (entity_kind && entity_kind !== "CanonicalUnit") {
    return makeStorageKey(entity_kind, identity);
  }
  const matches: string[] = [];
  for (const [key, ent] of entities) {
    if (ent.identity !== identity) continue;
    if (entity_kind && ent.entity_kind !== entity_kind) continue;
    if (unit_kind) {
      const payload = ent.payload as { envelope?: { unit_kind?: string } };
      if (payload.envelope?.unit_kind !== unit_kind) continue;
    }
    matches.push(key);
  }
  if (matches.length === 0) {
    throw new PersistenceError("NOT_FOUND", `Entity not found: ${identity}`);
  }
  if (matches.length > 1) {
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
    const key = resolveKey(identity, entity_kind, state.entities, options?.unit_kind);
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
      const key = resolveKey(identity, entity_kind, state.entities, options?.unit_kind);
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

/**
 * PersistenceRepository contract — explicit operations, no saveAnything.
 */
import type {
  PersistenceEntity,
  PersistenceEvent,
  PersistenceFilter,
  PersistencePage,
  PersistenceQuery,
  PersistenceSnapshot,
} from "./types.js";

export interface ReplaceOptions {
  /** Optimistic concurrency: must match stored content_version. */
  readonly expected_version?: string;
}

/** Optional discriminator when scientific identity is shared across unit kinds. */
export interface IdentityOptions {
  readonly unit_kind?: string;
}

export interface PersistenceRepository {
  create(entity: PersistenceEntity): Promise<PersistenceEntity>;
  get(
    identity: string,
    entity_kind?: PersistenceEntity["entity_kind"],
    options?: IdentityOptions,
  ): Promise<PersistenceEntity>;
  exists(
    identity: string,
    entity_kind?: PersistenceEntity["entity_kind"],
    options?: IdentityOptions,
  ): Promise<boolean>;
  list(query?: PersistenceQuery): Promise<PersistencePage<PersistenceEntity>>;
  /**
   * Replace is restricted: immutable entities reject mutation.
   * Idempotent identical replace may succeed; stale version → CONFLICT.
   */
  replace(entity: PersistenceEntity, options?: ReplaceOptions): Promise<PersistenceEntity>;
  appendEvent(parent_identity: string, event: PersistenceEvent): Promise<PersistenceEvent>;
  getEvents(parent_identity: string): Promise<readonly PersistenceEvent[]>;
  snapshot(): Promise<PersistenceSnapshot>;
  restore(snapshot: PersistenceSnapshot): Promise<PersistenceSnapshot>;
  /**
   * Destructive delete is not permitted for authoritative SciROS artifacts.
   * Always rejects with a typed error under the current authority model.
   */
  delete(
    identity: string,
    entity_kind?: PersistenceEntity["entity_kind"],
    options?: IdentityOptions,
  ): Promise<never>;
  queryRelationships(filter: PersistenceFilter): Promise<readonly PersistenceEntity[]>;
}

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

/**
 * Optional discriminators when scientific identity is shared across unit kinds
 * and/or Model C revisions.
 */
export interface IdentityOptions {
  readonly unit_kind?: string;
  /** When set, load that CanonicalUnit revision (dual-read for rev:initial). */
  readonly revision_id?: string;
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
   * RevisionHead is mutable and uses expected_version for CAS.
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

  /** Model C: get RevisionHead for (unit_kind, scientific identity). */
  getHead(identity: string, unit_kind: string): Promise<PersistenceEntity>;
  /**
   * Model C: create head pointing at revision_id if absent.
   * Idempotent when existing head already points at the same revision.
   */
  ensureInitialHead(
    identity: string,
    unit_kind: string,
    revision_id?: string,
  ): Promise<PersistenceEntity>;
  /**
   * Model C: CAS advance head from_revision_id → to_revision_id
   * via replace + expected_version.
   */
  advanceHead(
    identity: string,
    unit_kind: string,
    from_revision_id: string,
    to_revision_id: string,
  ): Promise<PersistenceEntity>;
  /** Model C: list CanonicalUnit revision rows for identity+unit_kind (sorted by revision_id). */
  listRevisions(identity: string, unit_kind: string): Promise<readonly PersistenceEntity[]>;
}

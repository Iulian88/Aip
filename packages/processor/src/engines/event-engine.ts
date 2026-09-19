import type { EventStore } from "@sciros/shared";

/**
 * Append-only event infrastructure — no STE/ERR/… semantics in Sprint 2.
 */
export interface OpaqueEventRecord {
  readonly eventId: string;
  readonly parentIdentity: string;
  readonly recordedAtIso: string;
  readonly body: unknown;
}

export class EventEngine {
  private readonly store: EventStore;

  constructor(store: EventStore) {
    this.store = store;
  }

  async append(
    parentIdentity: string,
    body: unknown,
    recordedAtIso: string,
  ): Promise<OpaqueEventRecord> {
    const eventId = `evt:${parentIdentity}:${recordedAtIso}`;
    const record: OpaqueEventRecord = {
      eventId,
      parentIdentity,
      recordedAtIso,
      body,
    };
    await this.store.append(parentIdentity, record);
    return record;
  }
}

/** In-memory append-only store for skeleton / tests. */
export class InMemoryEventStore implements EventStore {
  private readonly journal: unknown[] = [];

  async append(_parentIdentity: string, event: unknown): Promise<void> {
    this.journal.push(event);
  }

  snapshot(): readonly unknown[] {
    return [...this.journal];
  }
}

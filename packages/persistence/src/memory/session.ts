/**
 * In-memory PersistenceSession factory + repository entry points.
 */
import type { PersistenceSession } from "../session.js";
import type { PersistenceTransaction } from "../transaction.js";
import { MemoryPersistenceRepository, MemoryStore } from "./store.js";
import { MemoryPersistenceTransaction } from "./transaction.js";

export class MemoryPersistenceSession implements PersistenceSession {
  readonly repository: MemoryPersistenceRepository;

  constructor(
    readonly session_id: string,
    private readonly store: MemoryStore = new MemoryStore(),
  ) {
    if (typeof session_id !== "string" || session_id.trim().length < 1) {
      throw new Error("PersistenceSession requires non-empty session_id");
    }
    this.repository = new MemoryPersistenceRepository(this.store);
  }

  /** Expose store for adapter tests / PersistencePort bridge. */
  getStore(): MemoryStore {
    return this.store;
  }

  async beginTransaction(): Promise<PersistenceTransaction> {
    return new MemoryPersistenceTransaction(this.store);
  }
}

/** Create a deterministic reference persistence session. */
export function createMemoryPersistenceSession(
  session_id: string,
): MemoryPersistenceSession {
  return new MemoryPersistenceSession(session_id);
}

export function createMemoryPersistenceRepository(): MemoryPersistenceRepository {
  return new MemoryPersistenceRepository(new MemoryStore());
}

/**
 * PersistenceTransaction — begin / commit / rollback.
 * In-memory adapter provides atomic commit of buffered mutations.
 */
import type { PersistenceRepository } from "./repository.js";

export type TransactionStatus = "open" | "committed" | "rolled_back";

export interface PersistenceTransaction {
  readonly status: TransactionStatus;
  /** Repository scoped to this transaction's write buffer. */
  readonly repository: PersistenceRepository;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

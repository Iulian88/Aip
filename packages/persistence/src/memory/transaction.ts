/**
 * In-memory PersistenceTransaction — copy-on-write buffer; commit or rollback.
 */
import { PersistenceError } from "../errors.js";
import type { PersistenceRepository } from "../repository.js";
import type {
  PersistenceTransaction,
  TransactionStatus,
} from "../transaction.js";
import { MemoryPersistenceRepository, type MemoryStore } from "./store.js";

export class MemoryPersistenceTransaction implements PersistenceTransaction {
  private _status: TransactionStatus = "open";
  readonly repository: PersistenceRepository;
  private readonly buffer;

  constructor(private readonly store: MemoryStore) {
    this.buffer = this.store.snapshotState();
    this.repository = new MemoryPersistenceRepository(this.store, this.buffer);
  }

  get status(): TransactionStatus {
    return this._status;
  }

  async commit(): Promise<void> {
    if (this._status !== "open") {
      throw new PersistenceError(
        "TRANSACTION_FAILED",
        `Cannot commit transaction in status ${this._status}`,
      );
    }
    try {
      this.store.replaceState(this.buffer);
      this._status = "committed";
      this.store.note("transaction:commit");
    } catch (err) {
      this._status = "rolled_back";
      throw new PersistenceError(
        "TRANSACTION_FAILED",
        "Transaction commit failed",
        { cause: err instanceof Error ? err.message : String(err) },
      );
    }
  }

  async rollback(): Promise<void> {
    if (this._status !== "open") {
      throw new PersistenceError(
        "TRANSACTION_FAILED",
        `Cannot rollback transaction in status ${this._status}`,
      );
    }
    this._status = "rolled_back";
    this.store.note("transaction:rollback");
  }
}

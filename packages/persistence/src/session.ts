/**
 * PersistenceSession — binds a repository (+ optional transaction).
 * Infrastructure only; no scientific evaluation.
 */
import type { PersistenceRepository } from "./repository.js";
import type { PersistenceTransaction } from "./transaction.js";

export interface PersistenceSession {
  readonly session_id: string;
  readonly repository: PersistenceRepository;
  beginTransaction(): Promise<PersistenceTransaction>;
}

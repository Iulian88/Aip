/**
 * @sciros/persistence — Persistence Foundation (EXEC-SPRINT-015).
 * Infrastructure storage boundary for already-authoritative SciROS artifacts.
 * Does not evaluate science, conformance, or certification.
 */

export type {
  PersistenceEntity,
  PersistenceEntityKind,
  PersistenceEvent,
  PersistenceFilter,
  PersistencePage,
  PersistenceQuery,
  PersistenceRelationship,
  PersistenceResult,
  PersistenceSnapshot,
} from "./types.js";
export {
  PERSISTENCE_ENTITY_KINDS,
  PERSISTENCE_SCHEMA_VERSION,
  SUPPORTED_ENCODING_AUTHORITY,
  SUPPORTED_ENCODING_VERSION,
} from "./types.js";

export type { PersistenceErrorCode } from "./errors.js";
export { PersistenceError, isPersistenceError, PERSISTENCE_ERROR_CODES } from "./errors.js";

export {
  deepClone,
  deepFreeze,
  stableEqual,
  stableParse,
  stableStringify,
} from "./deep.js";

export {
  IMMUTABLE_KINDS,
  entityFromArtifact,
  entityFromCanonicalUnit,
  entityFromCoreObject,
  entityFromRelationship,
  fingerprintEntity,
  makeStorageKey,
} from "./entity.js";

export type { PersistenceRepository, ReplaceOptions, IdentityOptions } from "./repository.js";
export type { PersistenceSession } from "./session.js";
export type { PersistenceTransaction, TransactionStatus } from "./transaction.js";

export {
  MemoryPersistenceRepository,
  MemoryStore,
  assertEntityIntegrity,
  entitiesEqual,
} from "./memory/store.js";
export { MemoryPersistenceTransaction } from "./memory/transaction.js";
export {
  MemoryPersistenceSession,
  createMemoryPersistenceRepository,
  createMemoryPersistenceSession,
} from "./memory/session.js";
export { RepositoryPersistencePort } from "./memory/port.js";

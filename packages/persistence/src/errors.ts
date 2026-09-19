/**
 * Typed PersistenceError model — deterministic, no secrets in messages.
 */

export const PERSISTENCE_ERROR_CODES = [
  "NOT_FOUND",
  "ALREADY_EXISTS",
  "INVALID_ID",
  "INVALID_VERSION",
  "INVALID_AUTHORITY",
  "INVALID_STATE",
  "CONFLICT",
  "IMMUTABLE_ENTITY",
  "TRANSACTION_FAILED",
  "SERIALIZATION_FAILED",
  "DESERIALIZATION_FAILED",
  "INTEGRITY_FAILURE",
  "UNSUPPORTED_VERSION",
  "STORAGE_FAILURE",
  "DELETE_NOT_PERMITTED",
] as const;

export type PersistenceErrorCode = (typeof PERSISTENCE_ERROR_CODES)[number];

export class PersistenceError extends Error {
  readonly code: PersistenceErrorCode;
  readonly details?: Readonly<Record<string, unknown>>;

  constructor(
    code: PersistenceErrorCode,
    message: string,
    details?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = "PersistenceError";
    this.code = code;
    if (details !== undefined) {
      this.details = Object.freeze({ ...details });
    }
  }
}

export function isPersistenceError(err: unknown): err is PersistenceError {
  return err instanceof PersistenceError;
}

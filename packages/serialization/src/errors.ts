import type { SerializationFailureCode } from "./types.js";

export class SerializationError extends Error {
  readonly code: SerializationFailureCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: SerializationFailureCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "SerializationError";
    this.code = code;
    this.details = details;
  }
}

export function isSerializationError(value: unknown): value is SerializationError {
  return value instanceof SerializationError;
}

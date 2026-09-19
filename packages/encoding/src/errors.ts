import type { CanonicalEncodingFailureCode } from "./types.js";

export class CanonicalEncodingError extends Error {
  readonly code: CanonicalEncodingFailureCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: CanonicalEncodingFailureCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "CanonicalEncodingError";
    this.code = code;
    this.details = details;
  }
}

export function isCanonicalEncodingError(value: unknown): value is CanonicalEncodingError {
  return value instanceof CanonicalEncodingError;
}

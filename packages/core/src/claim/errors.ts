import type { ClaimFailureCode } from "./types.js";

export class ClaimValidationError extends Error {
  readonly code: ClaimFailureCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: ClaimFailureCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "ClaimValidationError";
    this.code = code;
    this.details = details;
  }
}

export function isClaimValidationError(value: unknown): value is ClaimValidationError {
  return value instanceof ClaimValidationError;
}

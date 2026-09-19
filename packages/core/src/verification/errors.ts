import type { VerificationFailureCode } from "./types.js";

export class VerificationValidationError extends Error {
  readonly code: VerificationFailureCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: VerificationFailureCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "VerificationValidationError";
    this.code = code;
    this.details = details;
  }
}

export function isVerificationValidationError(
  value: unknown,
): value is VerificationValidationError {
  return value instanceof VerificationValidationError;
}

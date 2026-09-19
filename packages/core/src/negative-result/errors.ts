import type { NegativeResultFailureCode } from "./types.js";

export class NegativeResultValidationError extends Error {
  readonly code: NegativeResultFailureCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: NegativeResultFailureCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "NegativeResultValidationError";
    this.code = code;
    this.details = details;
  }
}

export function isNegativeResultValidationError(
  value: unknown,
): value is NegativeResultValidationError {
  return value instanceof NegativeResultValidationError;
}

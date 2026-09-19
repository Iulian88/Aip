import type { ContradictionFailureCode } from "./types.js";

export class ContradictionValidationError extends Error {
  readonly code: ContradictionFailureCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: ContradictionFailureCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "ContradictionValidationError";
    this.code = code;
    this.details = details;
  }
}

export function isContradictionValidationError(
  value: unknown,
): value is ContradictionValidationError {
  return value instanceof ContradictionValidationError;
}

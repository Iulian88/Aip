import type { EvidenceFailureCode } from "./types.js";

export class EvidenceValidationError extends Error {
  readonly code: EvidenceFailureCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: EvidenceFailureCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "EvidenceValidationError";
    this.code = code;
    this.details = details;
  }
}

export function isEvidenceValidationError(
  value: unknown,
): value is EvidenceValidationError {
  return value instanceof EvidenceValidationError;
}

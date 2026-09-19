import type { GradeFailureCode } from "./types.js";

export class EvidenceGradeValidationError extends Error {
  readonly code: GradeFailureCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: GradeFailureCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "EvidenceGradeValidationError";
    this.code = code;
    this.details = details;
  }
}

export function isEvidenceGradeValidationError(
  value: unknown,
): value is EvidenceGradeValidationError {
  return value instanceof EvidenceGradeValidationError;
}

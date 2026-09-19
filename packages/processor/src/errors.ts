/**
 * Typed processor errors (RPR / EXEC-003).
 * Sprint 2: infrastructure failure classes only — no SCI validation errors.
 */

export type ProcessorErrorCode =
  | "AuthorityMissing"
  | "AuthorityVersionMismatch"
  | "AuthorityHashMismatch"
  | "AuthorityDuplicate"
  | "AuthorityNotFrozen"
  | "PipelineFailure"
  | "StageFailure"
  | "ValidationUnavailable"
  | "TransitionUnavailable"
  | "EncodingUnavailable"
  | "SerializationUnavailable"
  | "PersistenceUnavailable"
  | "PinMissing"
  | "PinIncompatible";

export class ProcessorError extends Error {
  readonly code: ProcessorErrorCode;
  readonly stageId?: string;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: ProcessorErrorCode,
    message: string,
    options?: {
      stageId?: string;
      details?: Readonly<Record<string, unknown>>;
      cause?: unknown;
    },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "ProcessorError";
    this.code = code;
    this.details = options?.details ?? {};
    if (options?.stageId !== undefined) {
      this.stageId = options.stageId;
    }
  }
}

export function isProcessorError(value: unknown): value is ProcessorError {
  return value instanceof ProcessorError;
}

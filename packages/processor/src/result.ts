import type { ProcessorErrorCode } from "./errors.js";
import type { StageId } from "./stages/types.js";

/** Opaque processing request — no SCI payload semantics in Sprint 2. */
export interface ProcessorRequest {
  readonly kind: string;
  readonly correlationId?: string;
  readonly payload?: unknown;
  readonly requestedPins?: Readonly<Record<string, string>>;
}

export interface StageTrace {
  readonly stageId: StageId;
  readonly ok: boolean;
  readonly durationMs: number;
  readonly skipped?: boolean;
  readonly errorCode?: ProcessorErrorCode;
}

export interface ProcessorResult {
  readonly accepted: boolean;
  readonly executionId: string;
  readonly correlationId: string;
  readonly failureClass?: ProcessorErrorCode;
  readonly failureMessage?: string;
  readonly failedStageId?: StageId;
  readonly stageTrace: readonly StageTrace[];
}

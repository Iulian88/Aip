import type { ProcessorContext } from "../context.js";
import type { ProcessorError } from "../errors.js";

/** RPR-001 stage identifiers S01–S18 (S19–S20 owned by CONF/CERT phases). */
export type StageId =
  | "S01"
  | "S02"
  | "S03"
  | "S04"
  | "S05"
  | "S06"
  | "S07"
  | "S08"
  | "S09"
  | "S10"
  | "S11"
  | "S12"
  | "S13"
  | "S14"
  | "S15"
  | "S16"
  | "S17"
  | "S18";

export const STAGE_ORDER: readonly StageId[] = [
  "S01",
  "S02",
  "S03",
  "S04",
  "S05",
  "S06",
  "S07",
  "S08",
  "S09",
  "S10",
  "S11",
  "S12",
  "S13",
  "S14",
  "S15",
  "S16",
  "S17",
  "S18",
] as const;

export interface StageInput {
  readonly payload: unknown;
  readonly requestedPins?: Readonly<Record<string, string>>;
}

export interface StageOutput {
  readonly payload: unknown;
  readonly notes?: readonly string[];
}

export type StageStatus = "ok" | "skipped" | "failed";

export interface StageResult {
  readonly stageId: StageId;
  readonly status: StageStatus;
  readonly output: StageOutput;
  readonly error?: ProcessorError;
  readonly durationMs: number;
}

export interface StageHandler {
  readonly stageId: StageId;
  readonly name: string;
  run(ctx: ProcessorContext, input: StageInput): Promise<StageResult>;
}

export function okResult(
  stageId: StageId,
  output: StageOutput,
  durationMs: number,
): StageResult {
  return { stageId, status: "ok", output, durationMs };
}

export function skippedResult(
  stageId: StageId,
  output: StageOutput,
  durationMs: number,
): StageResult {
  return { stageId, status: "skipped", output, durationMs };
}

export function failedResult(
  stageId: StageId,
  output: StageOutput,
  error: ProcessorError,
  durationMs: number,
): StageResult {
  return { stageId, status: "failed", output, error, durationMs };
}

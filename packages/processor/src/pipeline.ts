import type { ProcessorContext } from "./context.js";
import { ProcessorError } from "./errors.js";
import type { ProcessorRequest, ProcessorResult, StageTrace } from "./result.js";
import { STAGE_ORDER, type StageHandler, type StageInput } from "./stages/types.js";

type StageIdKey = (typeof STAGE_ORDER)[number];

export interface PipelineContextBox {
  current: ProcessorContext;
}

/**
 * Deterministic RPR pipeline host — single execution path, fixed stage order.
 */
export class ProcessorPipeline {
  private readonly stages: ReadonlyMap<StageIdKey, StageHandler>;

  constructor(handlers: readonly StageHandler[]) {
    const map = new Map<StageIdKey, StageHandler>();
    for (const id of STAGE_ORDER) {
      const handler = handlers.find((h) => h.stageId === id);
      if (!handler) {
        throw new ProcessorError("PipelineFailure", `Missing stage handler: ${id}`);
      }
      map.set(id, handler);
    }
    if (handlers.length !== STAGE_ORDER.length) {
      throw new ProcessorError(
        "PipelineFailure",
        `Expected ${STAGE_ORDER.length} stages, got ${handlers.length}`,
      );
    }
    this.stages = map;
  }

  async run(
    box: PipelineContextBox,
    request: ProcessorRequest,
  ): Promise<ProcessorResult> {
    let input: StageInput = {
      payload: request.payload ?? null,
      ...(request.requestedPins !== undefined
        ? { requestedPins: request.requestedPins }
        : {}),
    };
    const trace: StageTrace[] = [];

    for (const stageId of STAGE_ORDER) {
      const handler = this.stages.get(stageId);
      if (!handler) {
        throw new ProcessorError("PipelineFailure", `Stage missing at runtime: ${stageId}`);
      }

      const result = await handler.run(box.current, input);
      // S01 may have rebound authorities onto box.current
      trace.push({
        stageId: result.stageId,
        ok: result.status !== "failed",
        durationMs: result.durationMs,
        ...(result.status === "skipped" ? { skipped: true } : {}),
        ...(result.error ? { errorCode: result.error.code } : {}),
      });

      if (result.status === "failed") {
        return {
          accepted: false,
          executionId: box.current.executionId,
          correlationId: box.current.correlationId,
          failureClass: result.error?.code ?? "StageFailure",
          failureMessage: result.error?.message ?? "Stage failed",
          failedStageId: result.stageId,
          stageTrace: trace,
        };
      }

      input = {
        payload: result.output.payload,
        ...(request.requestedPins !== undefined
          ? { requestedPins: request.requestedPins }
          : {}),
      };
    }

    return {
      accepted: true,
      executionId: box.current.executionId,
      correlationId: box.current.correlationId,
      stageTrace: trace,
    };
  }
}

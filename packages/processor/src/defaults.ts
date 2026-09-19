import type {
  Clock,
  IdentityProvider,
  Logger,
  Metrics,
  Span,
  Tracer,
} from "@sciros/shared";
import type { ProcessorConfiguration } from "./context.js";

export class SystemClock implements Clock {
  nowIso(): string {
    return new Date().toISOString();
  }
}

export class StaticIdentityProvider implements IdentityProvider {
  constructor(private readonly agentId: string = "system:processor") {}

  async currentAgentId(): Promise<string> {
    return this.agentId;
  }
}

/** No-op logger (interface fulfillment). */
export const noopLogger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

/** No-op metrics. */
export const noopMetrics: Metrics = {
  increment() {},
  timing() {},
};

class NoopSpan implements Span {
  constructor(readonly name: string) {}
  setAttribute(): void {}
  end(): void {}
}

export const noopTracer: Tracer = {
  startSpan(name: string): Span {
    return new NoopSpan(name);
  },
};

/** Feature flags match Sprint 8 behaviour. */
export const defaultProcessorConfiguration: ProcessorConfiguration = {
  requireEncoding: false,
  requireSerialization: false,
  requirePersistence: false,
  featureFlags: {
    claimValidation: true,
    claimStandingTransitions: true,
    evidenceValidation: true,
    evidenceRecordTransitions: true,
    evidenceGrade: true,
    contradictionValidation: true,
    contradictionRecordTransitions: true,
    negativeResultValidation: true,
    negativeResultRecordTransitions: true,
    verificationValidation: true,
    verificationRecordTransitions: true,
    encodingBound: false,
    serializationBound: false,
  },
};

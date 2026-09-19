import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  AuthorityLoader,
  Clock,
  IdentityProvider,
  Logger,
  Metrics,
  Tracer,
} from "@sciros/shared";
import { AuthorityEngine } from "./authority/authority-engine.js";
import { AuthorityGate } from "./authority/authority-gate.js";
import { FileAuthorityLoader } from "./authority/authority-loader.js";
import { PinEngine } from "./authority/pin-engine.js";
import type { ProcessorConfiguration } from "./context.js";
import {
  defaultProcessorConfiguration,
  noopLogger,
  noopMetrics,
  noopTracer,
  StaticIdentityProvider,
  SystemClock,
} from "./defaults.js";
import { EventEngine, InMemoryEventStore } from "./engines/event-engine.js";
import { TransitionEngine } from "./engines/transition-engine.js";
import { ValidationEngine } from "./engines/validation-engine.js";
import { VersionEngine } from "./engines/version-engine.js";
import { ProcessorError } from "./errors.js";
import {
  type EncodingHook,
  unavailableEncodingHook,
} from "./hooks/encoding-hook.js";
import {
  type PersistenceHook,
  unavailablePersistenceHook,
} from "./hooks/persistence-hook.js";
import {
  type SerializationHook,
  unavailableSerializationHook,
} from "./hooks/serialization-hook.js";
import { ProcessorPipeline, type PipelineContextBox } from "./pipeline.js";
import type { ProcessorRequest, ProcessorResult } from "./result.js";
import { createStageHandlers } from "./stages/create-stages.js";

export interface ReferenceProcessorOptions {
  readonly workspaceRoot: string;
  readonly manifestPath?: string;
  readonly authorityLoader?: AuthorityLoader;
  readonly clock?: Clock;
  readonly identity?: IdentityProvider;
  readonly logger?: Logger;
  readonly metrics?: Metrics;
  readonly tracer?: Tracer;
  readonly configuration?: ProcessorConfiguration;
  readonly encodingHook?: EncodingHook;
  readonly serializationHook?: SerializationHook;
  readonly persistenceHook?: PersistenceHook;
}

/**
 * Normative RPR-001 behaviour host — Sprint 2 skeleton.
 * Single pipeline · no shadow accept path · no SCI business rules.
 */
export interface Processor {
  process(request: ProcessorRequest): Promise<ProcessorResult>;
}

export class ReferenceProcessor implements Processor {
  private readonly pipeline: ProcessorPipeline;
  private readonly box: PipelineContextBox;
  private readonly basePorts: {
    clock: Clock;
    identity: IdentityProvider;
    logger: Logger;
    metrics: Metrics;
    tracer: Tracer;
    configuration: ProcessorConfiguration;
  };

  constructor(options: ReferenceProcessorOptions) {
    const clock = options.clock ?? new SystemClock();
    const loader =
      options.authorityLoader ??
      new FileAuthorityLoader({
        workspaceRoot: options.workspaceRoot,
        manifestPath:
          options.manifestPath ??
          path.join(options.workspaceRoot, "authorities", "pins.json"),
        clock,
      });

    const authorityEngine = new AuthorityEngine(loader, new PinEngine());
    const pinEngine = new PinEngine();
    const authorityGate = new AuthorityGate();

    this.basePorts = {
      clock,
      identity: options.identity ?? new StaticIdentityProvider(),
      logger: options.logger ?? noopLogger,
      metrics: options.metrics ?? noopMetrics,
      tracer: options.tracer ?? noopTracer,
      configuration: options.configuration ?? defaultProcessorConfiguration,
    };

    this.box = {
      current: {
        executionId: "uninitialized",
        correlationId: "uninitialized",
        authoritySet: null,
        clock: this.basePorts.clock,
        identity: this.basePorts.identity,
        logger: this.basePorts.logger,
        metrics: this.basePorts.metrics,
        tracer: this.basePorts.tracer,
        configuration: this.basePorts.configuration,
      },
    };

    const handlers = createStageHandlers({
      authorityEngine,
      pinEngine,
      authorityGate,
      validationEngine: new ValidationEngine(),
      versionEngine: new VersionEngine(),
      transitionEngine: new TransitionEngine(),
      eventEngine: new EventEngine(new InMemoryEventStore()),
      encodingHook: options.encodingHook ?? unavailableEncodingHook(),
      serializationHook: options.serializationHook ?? unavailableSerializationHook(),
      persistenceHook: options.persistenceHook ?? unavailablePersistenceHook(),
      bindAuthorityContext: (ctx) => {
        this.box.current = ctx;
      },
    });

    this.pipeline = new ProcessorPipeline(handlers);
  }

  async process(request: ProcessorRequest): Promise<ProcessorResult> {
    const executionId = randomUUID();
    const correlationId = request.correlationId ?? randomUUID();
    this.box.current = {
      executionId,
      correlationId,
      authoritySet: null,
      clock: this.basePorts.clock,
      identity: this.basePorts.identity,
      logger: this.basePorts.logger,
      metrics: this.basePorts.metrics,
      tracer: this.basePorts.tracer,
      configuration: this.basePorts.configuration,
    };

    try {
      return await this.pipeline.run(this.box, request);
    } catch (err) {
      if (err instanceof ProcessorError) {
        return {
          accepted: false,
          executionId,
          correlationId,
          failureClass: err.code,
          failureMessage: err.message,
          stageTrace: [],
        };
      }
      throw err;
    }
  }
}

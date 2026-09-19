import type {
  AuthorityCatalog,
  Clock,
  IdentityProvider,
  Logger,
  Metrics,
  Tracer,
} from "@sciros/shared";

/**
 * Immutable processor execution context (RPR session).
 * No mutable globals.
 */
export interface ProcessorConfiguration {
  readonly requireEncoding: boolean;
  readonly requireSerialization: boolean;
  readonly requirePersistence: boolean;
  readonly featureFlags: Readonly<Record<string, boolean>>;
}

export interface ProcessorContext {
  readonly executionId: string;
  readonly correlationId: string;
  readonly authoritySet: AuthorityCatalog | null;
  readonly clock: Clock;
  readonly identity: IdentityProvider;
  readonly logger: Logger;
  readonly metrics: Metrics;
  readonly tracer: Tracer;
  readonly configuration: ProcessorConfiguration;
}

export function withAuthoritySet(
  ctx: ProcessorContext,
  authoritySet: AuthorityCatalog,
): ProcessorContext {
  return {
    executionId: ctx.executionId,
    correlationId: ctx.correlationId,
    authoritySet,
    clock: ctx.clock,
    identity: ctx.identity,
    logger: ctx.logger,
    metrics: ctx.metrics,
    tracer: ctx.tracer,
    configuration: ctx.configuration,
  };
}

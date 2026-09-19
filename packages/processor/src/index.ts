/**
 * @sciros/processor — Reference Processor (RPR-001).
 * Sprint 11: S05 Serialization Binding · S06 Decode · S17 Profile Projection (SER-JSON-001).
 */

import { createCanonicalEncodingPorts } from "@sciros/encoding";
import { createSerializationFrameworkPorts } from "@sciros/serialization";

export type { ProcessorErrorCode } from "./errors.js";
export { ProcessorError, isProcessorError } from "./errors.js";

export type { ProcessorConfiguration, ProcessorContext } from "./context.js";
export { withAuthoritySet } from "./context.js";

export type { ProcessorRequest, ProcessorResult, StageTrace } from "./result.js";

export type { Processor, ReferenceProcessorOptions } from "./processor.js";
export { ReferenceProcessor } from "./processor.js";

export { ProcessorPipeline } from "./pipeline.js";
export type { PipelineContextBox } from "./pipeline.js";

export {
  STAGE_ORDER,
  createStageHandlers,
} from "./stages/index.js";
export type { StageDependencies } from "./stages/create-stages.js";
export type {
  StageHandler,
  StageId,
  StageInput,
  StageOutput,
  StageResult,
  StageStatus,
} from "./stages/types.js";

export { FileAuthorityLoader } from "./authority/authority-loader.js";
export type {
  FileAuthorityLoaderOptions,
  PinManifestEntry,
  PinManifestFile,
} from "./authority/authority-loader.js";
export { AuthorityEngine, assertAuthorityAvailable } from "./authority/authority-engine.js";
export { AuthorityGate } from "./authority/authority-gate.js";
export { PinEngine } from "./authority/pin-engine.js";

export { ValidationEngine } from "./engines/validation-engine.js";
export { VersionEngine } from "./engines/version-engine.js";
export type { VersionPlan } from "./engines/version-engine.js";
export { TransitionEngine } from "./engines/transition-engine.js";
export type { TransitionRequest, TransitionResult } from "./engines/transition-engine.js";
export { EventEngine, InMemoryEventStore } from "./engines/event-engine.js";
export type { OpaqueEventRecord } from "./engines/event-engine.js";

export {
  createEncodingHook,
  unavailableEncodingHook,
} from "./hooks/encoding-hook.js";
export type { EncodingHook } from "./hooks/encoding-hook.js";

import {
  createEncodingHook,
  type EncodingHook,
} from "./hooks/encoding-hook.js";

/** Bind ENC-001 CanonicalEncoder ports into the RPR EncodingHook. */
export function bindCanonicalEncodingHook(): EncodingHook {
  return createEncodingHook(createCanonicalEncodingPorts());
}

export {
  createSerializationHook,
  unavailableSerializationHook,
} from "./hooks/serialization-hook.js";
export type { SerializationHook } from "./hooks/serialization-hook.js";

import {
  createSerializationHook,
  type SerializationHook,
} from "./hooks/serialization-hook.js";

/** Bind SER-001 + SER-JSON-001 ports into the RPR SerializationHook. */
export function bindSerializationFrameworkHook(): SerializationHook {
  const ports = createSerializationFrameworkPorts();
  return createSerializationHook({
    decode: ports.decode,
    project: ports.project,
  });
}
export {
  createPersistenceHook,
  unavailablePersistenceHook,
  InMemoryPersistencePort,
} from "./hooks/persistence-hook.js";
export type { PersistenceHook } from "./hooks/persistence-hook.js";

export {
  SystemClock,
  StaticIdentityProvider,
  noopLogger,
  noopMetrics,
  noopTracer,
  defaultProcessorConfiguration,
} from "./defaults.js";

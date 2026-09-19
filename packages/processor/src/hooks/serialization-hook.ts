import { ProcessorError } from "../errors.js";

/** Serialization hook — projection port only; no JSON logic in Sprint 2. */
export interface SerializationHook {
  readonly available: boolean;
  decode(instance: unknown): Promise<unknown>;
  project(canonical: unknown, profileId: string): Promise<unknown>;
}

export function unavailableSerializationHook(): SerializationHook {
  return {
    available: false,
    async decode(): Promise<unknown> {
      throw new ProcessorError(
        "SerializationUnavailable",
        "Serialization hook not bound (use bindSerializationFrameworkHook)",
      );
    },
    async project(): Promise<unknown> {
      throw new ProcessorError(
        "SerializationUnavailable",
        "Serialization hook not bound (use bindSerializationFrameworkHook)",
      );
    },
  };
}

export function createSerializationHook(ports: {
  decode: (instance: unknown) => Promise<unknown>;
  project: (canonical: unknown, profileId: string) => Promise<unknown>;
}): SerializationHook {
  return {
    available: true,
    decode: ports.decode,
    project: ports.project,
  };
}

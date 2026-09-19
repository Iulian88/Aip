import { ProcessorError } from "../errors.js";

/** Encoding hook — wraps ENC port without owning ENC semantics. */
export interface EncodingHook {
  readonly available: boolean;
  assemble(input: unknown): Promise<unknown>;
  verify(unit: unknown): Promise<boolean>;
}

export function unavailableEncodingHook(): EncodingHook {
  return {
    available: false,
    async assemble(): Promise<unknown> {
      throw new ProcessorError(
        "EncodingUnavailable",
        "Encoding hook not bound (use bindCanonicalEncodingHook)",
      );
    },
    async verify(): Promise<boolean> {
      throw new ProcessorError(
        "EncodingUnavailable",
        "Encoding hook not bound (use bindCanonicalEncodingHook)",
      );
    },
  };
}

export function createEncodingHook(ports: {
  assemble: (input: unknown) => Promise<unknown>;
  verify: (unit: unknown) => Promise<boolean>;
}): EncodingHook {
  return {
    available: true,
    assemble: ports.assemble,
    verify: ports.verify,
  };
}

import { CanonicalEncodingError } from "./errors.js";
import { CanonicalValidator } from "./validator.js";
import type { CanonicalUnit } from "./types.js";

/**
 * Recovers a frozen content projection from a canonical unit.
 * Does not mutate Core stores; returns content snapshot only.
 */
export class CanonicalDecoder {
  private readonly validator = new CanonicalValidator();

  async decode(unit: unknown): Promise<Readonly<Record<string, unknown>>> {
    this.validator.validate(unit);
    const u = unit as CanonicalUnit;
    if (!u.intact) {
      throw new CanonicalEncodingError(
        "INTEGRITY_FAILED",
        "Cannot decode non-intact canonical unit",
      );
    }
    return u.envelope.content;
  }

  async decodeEnvelope(unit: unknown): Promise<CanonicalUnit["envelope"]> {
    this.validator.validate(unit);
    return (unit as CanonicalUnit).envelope;
  }
}

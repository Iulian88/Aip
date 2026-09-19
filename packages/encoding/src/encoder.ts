import { CanonicalEncodingRegistry } from "./registry.js";
import { CanonicalValidator } from "./validator.js";
import type { CanonicalUnit } from "./types.js";

/**
 * Assembles and verifies ENC-001 canonical units from Core objects.
 */
export class CanonicalEncoder {
  private readonly registry = new CanonicalEncodingRegistry();
  private readonly validator = new CanonicalValidator();

  async assemble(input: unknown): Promise<CanonicalUnit> {
    const unit = this.registry.build(input);
    this.validator.validate(unit);
    return unit;
  }

  async verify(unit: unknown): Promise<boolean> {
    this.validator.validate(unit);
    return this.validator.verifyIntegrity(unit as CanonicalUnit);
  }
}

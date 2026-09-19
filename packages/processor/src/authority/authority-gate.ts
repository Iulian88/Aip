import type { AuthorityCatalog } from "@sciros/shared";
import { ProcessorError } from "../errors.js";
import { PinEngine } from "./pin-engine.js";

/**
 * Generic authority gate (pin / availability / compatibility).
 * Sprint 2: NOT Human Reviewer / SCI promotion logic.
 */
export class AuthorityGate {
  private readonly pins = new PinEngine();

  verifyFrozen(catalog: AuthorityCatalog | null): AuthorityCatalog {
    return this.pins.requirePinned(catalog);
  }

  verifyPin(catalog: AuthorityCatalog, authorityId: string): void {
    this.pins.findPin(catalog, authorityId);
  }

  verifyCompatibility(
    catalog: AuthorityCatalog,
    required: readonly string[],
  ): void {
    for (const id of required) {
      this.pins.findPin(catalog, id);
    }
  }

  rejectIfMissing(catalog: AuthorityCatalog | null, authorityId: string): void {
    if (!catalog) {
      throw new ProcessorError("AuthorityNotFrozen", "Authority set not frozen");
    }
    this.pins.findPin(catalog, authorityId);
  }
}

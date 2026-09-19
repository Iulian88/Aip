import type { AuthorityCatalog, AuthorityPin } from "@sciros/shared";
import { ProcessorError } from "../errors.js";

/**
 * Pin verification engine — metadata only, no scientific content validation.
 */
export class PinEngine {
  requirePinned(catalog: AuthorityCatalog | null): AuthorityCatalog {
    if (!catalog || catalog.sealed !== true) {
      throw new ProcessorError("AuthorityNotFrozen", "Authority set is not frozen");
    }
    return catalog;
  }

  findPin(catalog: AuthorityCatalog, authorityId: string): AuthorityPin {
    const pin = catalog.pins.find((p) => p.id === authorityId);
    if (!pin) {
      throw new ProcessorError("PinMissing", `Required pin missing: ${authorityId}`, {
        details: { authorityId },
      });
    }
    return pin;
  }

  verifyRequestedVersions(
    catalog: AuthorityCatalog,
    requested: Readonly<Record<string, string>> | undefined,
  ): void {
    if (!requested) {
      return;
    }
    for (const [id, version] of Object.entries(requested)) {
      const pin = this.findPin(catalog, id);
      if (pin.version !== version) {
        throw new ProcessorError(
          "AuthorityVersionMismatch",
          `Version mismatch for ${id}: expected ${version}, pinned ${pin.version}`,
          {
            details: { authorityId: id, expected: version, actual: pin.version },
          },
        );
      }
    }
  }

  verifyOntologyAndSpecPins(catalog: AuthorityCatalog): void {
    this.findPin(catalog, "SCI-000");
    this.findPin(catalog, "SCI-001");
  }

  detectDuplicates(pins: readonly AuthorityPin[]): void {
    const seen = new Set<string>();
    for (const pin of pins) {
      if (seen.has(pin.id)) {
        throw new ProcessorError("AuthorityDuplicate", `Duplicate authority: ${pin.id}`, {
          details: { authorityId: pin.id },
        });
      }
      seen.add(pin.id);
    }
  }
}

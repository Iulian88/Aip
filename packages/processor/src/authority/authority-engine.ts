import type { AuthorityCatalog, AuthorityLoader, AuthorityPin } from "@sciros/shared";
import { ProcessorError } from "../errors.js";
import { PinEngine } from "./pin-engine.js";

/**
 * Authority engine — load, cache, pin, freeze.
 * Does not parse or execute SCI rules.
 */
export class AuthorityEngine {
  private readonly loader: AuthorityLoader;
  private readonly pins: PinEngine;
  private catalog: AuthorityCatalog | null = null;

  constructor(loader: AuthorityLoader, pinEngine: PinEngine = new PinEngine()) {
    this.loader = loader;
    this.pins = pinEngine;
  }

  async loadAndFreeze(
    requestedPins?: Readonly<Record<string, string>>,
  ): Promise<AuthorityCatalog> {
    if (this.catalog) {
      this.pins.verifyRequestedVersions(this.catalog, requestedPins);
      return this.catalog;
    }
    const loaded = await this.loader.loadAuthorities();
    this.pins.detectDuplicates(loaded);
    const frozen = await this.loader.pinAndFreeze(loaded);
    this.pins.verifyOntologyAndSpecPins(frozen);
    this.pins.verifyRequestedVersions(frozen, requestedPins);
    this.catalog = frozen;
    return frozen;
  }

  getCatalog(): AuthorityCatalog | null {
    return this.catalog;
  }

  requireCatalog(): AuthorityCatalog {
    return this.pins.requirePinned(this.catalog);
  }

  listPins(): readonly AuthorityPin[] {
    const catalog = this.requireCatalog();
    return catalog.pins;
  }

  assertCompatible(requiredAuthorityId: string): void {
    const catalog = this.requireCatalog();
    this.pins.findPin(catalog, requiredAuthorityId);
  }
}

export function assertAuthorityAvailable(
  catalog: AuthorityCatalog | null,
  authorityId: string,
): void {
  if (!catalog) {
    throw new ProcessorError("AuthorityNotFrozen", "No frozen authority set");
  }
  const found = catalog.pins.some((p) => p.id === authorityId);
  if (!found) {
    throw new ProcessorError("AuthorityMissing", `Authority not available: ${authorityId}`, {
      details: { authorityId },
    });
  }
}

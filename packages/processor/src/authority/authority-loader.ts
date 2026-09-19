import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { AuthorityCatalog, AuthorityLoader, AuthorityPin, Clock } from "@sciros/shared";
import { ProcessorError } from "../errors.js";

export interface PinManifestFile {
  readonly manifestVersion: string;
  readonly pins: Readonly<Record<string, PinManifestEntry>>;
}

export interface PinManifestEntry {
  readonly version?: string;
  readonly pathHint?: string;
  readonly status?: string;
  readonly filing?: string;
  readonly contentHash?: string;
}

export interface FileAuthorityLoaderOptions {
  readonly manifestPath: string;
  readonly workspaceRoot: string;
  readonly clock: Clock;
}

/**
 * Loads pin metadata from authorities/pins.json.
 * Verifies availability, optional content hashes, duplicates — does NOT parse SCI logic.
 */
export class FileAuthorityLoader implements AuthorityLoader {
  private readonly manifestPath: string;
  private readonly workspaceRoot: string;
  private readonly clock: Clock;
  private cache: AuthorityPin[] | null = null;
  private frozen: AuthorityCatalog | null = null;

  constructor(options: FileAuthorityLoaderOptions) {
    this.manifestPath = options.manifestPath;
    this.workspaceRoot = options.workspaceRoot;
    this.clock = options.clock;
  }

  async loadAuthorities(): Promise<AuthorityPin[]> {
    if (this.cache) {
      return this.cache;
    }
    const raw = await readFile(this.manifestPath, "utf8");
    const manifest = JSON.parse(raw) as PinManifestFile;
    if (!manifest.pins || typeof manifest.pins !== "object") {
      throw new ProcessorError("AuthorityMissing", "Pin manifest missing pins object");
    }
    const pins: AuthorityPin[] = [];
    for (const [id, entry] of Object.entries(manifest.pins)) {
      const pin: AuthorityPin = {
        id,
        version: entry.version ?? entry.status ?? "unknown",
        ...(entry.pathHint !== undefined ? { pathHint: entry.pathHint } : {}),
        ...(entry.status !== undefined ? { status: entry.status } : {}),
        ...(entry.filing !== undefined ? { filing: entry.filing } : {}),
        ...(entry.contentHash !== undefined ? { contentHash: entry.contentHash } : {}),
      };
      pins.push(pin);
    }
    this.cache = pins;
    return pins;
  }

  async pinAndFreeze(pins: readonly AuthorityPin[]): Promise<AuthorityCatalog> {
    if (this.frozen) {
      return this.frozen;
    }
    const seen = new Set<string>();
    for (const pin of pins) {
      if (seen.has(pin.id)) {
        throw new ProcessorError("AuthorityDuplicate", `Duplicate authority id: ${pin.id}`, {
          details: { authorityId: pin.id },
        });
      }
      seen.add(pin.id);

      if (pin.pathHint) {
        const abs = path.resolve(this.workspaceRoot, pin.pathHint);
        let content: Buffer;
        try {
          content = await readFile(abs);
        } catch {
          throw new ProcessorError(
            "AuthorityMissing",
            `Authority file unavailable for ${pin.id}: ${pin.pathHint}`,
            { details: { authorityId: pin.id, pathHint: pin.pathHint } },
          );
        }
        if (pin.contentHash) {
          const actual = createHash("sha256").update(content).digest("hex");
          if (actual !== pin.contentHash) {
            throw new ProcessorError(
              "AuthorityHashMismatch",
              `Hash mismatch for ${pin.id}`,
              {
                details: {
                  authorityId: pin.id,
                  expected: pin.contentHash,
                  actual,
                },
              },
            );
          }
        }
      }
    }

    const catalog: AuthorityCatalog = {
      sealed: true,
      pinManifestId: `pins:${this.manifestPath}`,
      pins: pins.map((p) => ({ ...p })),
      frozenAtIso: this.clock.nowIso(),
    };
    this.frozen = catalog;
    this.cache = [...catalog.pins];
    return catalog;
  }

  getFrozen(): AuthorityCatalog | null {
    return this.frozen;
  }
}

/**
 * Model C revision addressing (SPEC-020 / IMPLEMENTATION-DECISION-020).
 * storage_key metadata only — does not replace scientific identity.
 */
import { PersistenceError } from "./errors.js";
import type { PersistenceEntityKind } from "./types.js";

/** Reserved initial revision token (RQ-020-002). */
export const INITIAL_REVISION_ID = "rev:initial" as const;

/** Caller-supplied revision ids: rev:… */
export const REVISION_ID = /^rev:[A-Za-z0-9._~-]{1,128}$/;

export function assertRevisionId(revision_id: string, label = "revision_id"): void {
  if (typeof revision_id !== "string" || !REVISION_ID.test(revision_id)) {
    throw new PersistenceError(
      "INVALID_ID",
      `${label} must match rev:[A-Za-z0-9._~-]{1,128}`,
      { revision_id },
    );
  }
}

/**
 * CanonicalUnit revision row key:
 * persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}
 */
export function makeCanonicalUnitRevisionStorageKey(
  unit_kind: string,
  scientific_identity: string,
  revision_id: string,
): string {
  if (typeof unit_kind !== "string" || unit_kind.trim().length < 1) {
    throw new PersistenceError("INVALID_ID", "unit_kind must be a non-empty string");
  }
  if (typeof scientific_identity !== "string" || scientific_identity.trim().length < 1) {
    throw new PersistenceError("INVALID_ID", "identity must be a non-empty string");
  }
  assertRevisionId(revision_id);
  return `persist:CanonicalUnit:${unit_kind}:${scientific_identity}:${revision_id}`;
}

/** Legacy Sprint 015–019 CanonicalUnit key (≡ rev:initial under dual-read). */
export function makeLegacyCanonicalUnitStorageKey(
  unit_kind: string,
  scientific_identity: string,
): string {
  if (typeof unit_kind !== "string" || unit_kind.trim().length < 1) {
    throw new PersistenceError("INVALID_ID", "unit_kind must be a non-empty string");
  }
  if (typeof scientific_identity !== "string" || scientific_identity.trim().length < 1) {
    throw new PersistenceError("INVALID_ID", "identity must be a non-empty string");
  }
  return `persist:CanonicalUnit:${unit_kind}:${scientific_identity}`;
}

/** RevisionHead key: persist:RevisionHead:{unit_kind}:{identity} */
export function makeRevisionHeadStorageKey(
  unit_kind: string,
  scientific_identity: string,
): string {
  if (typeof unit_kind !== "string" || unit_kind.trim().length < 1) {
    throw new PersistenceError("INVALID_ID", "unit_kind must be a non-empty string");
  }
  if (typeof scientific_identity !== "string" || scientific_identity.trim().length < 1) {
    throw new PersistenceError("INVALID_ID", "identity must be a non-empty string");
  }
  return `persist:RevisionHead:${unit_kind}:${scientific_identity}`;
}

export function isCanonicalUnitKind(kind: PersistenceEntityKind): boolean {
  return kind === "CanonicalUnit";
}

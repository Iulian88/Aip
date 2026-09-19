/**
 * Deterministic deep freeze / clone / stable stringify for persistence.
 * No wall-clock or random material.
 */

import { PersistenceError } from "./errors.js";

export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Object.isFrozen(value)) return value;
  if (Array.isArray(value)) {
    for (const el of value) deepFreeze(el);
    return Object.freeze(value);
  }
  const obj = value as Record<string, unknown>;
  for (const k of Object.keys(obj)) {
    deepFreeze(obj[k]);
  }
  return Object.freeze(obj) as T;
}

export function deepClone<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => deepClone(v)) as T;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = deepClone(v);
  }
  return out as T;
}

function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj).sort()) {
    out[k] = sortKeys(obj[k]);
  }
  return out;
}

/** Deterministic JSON text (sorted keys). */
export function stableStringify(value: unknown): string {
  try {
    return JSON.stringify(sortKeys(value));
  } catch (err) {
    throw new PersistenceError(
      "SERIALIZATION_FAILED",
      "Failed to produce deterministic persistence representation",
      { cause: err instanceof Error ? err.message : String(err) },
    );
  }
}

export function stableParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new PersistenceError(
      "DESERIALIZATION_FAILED",
      "Failed to parse persisted representation",
      { cause: err instanceof Error ? err.message : String(err) },
    );
  }
}

/** Structural equality via deterministic JSON. */
export function stableEqual(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}

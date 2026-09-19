/**
 * Bridge to shared PersistencePort — hand-off only, no schema-as-law.
 * Stores Canonical Units via the MemoryPersistenceRepository (Model C initial revision).
 */
import type { PersistencePort } from "@sciros/shared";
import { entityFromCanonicalUnit } from "../entity.js";
import { PersistenceError, isPersistenceError } from "../errors.js";
import { INITIAL_REVISION_ID } from "../revision.js";
import type { PersistenceEntity } from "../types.js";
import {
  MemoryPersistenceRepository,
  MemoryStore,
  assertEntityIntegrity,
} from "./store.js";

/**
 * Derive the same unit_kind discriminator used when constructing the entity
 * (envelope.unit_kind → storage_key). Required for CanonicalUnit lookups.
 */
function unitKindFromEntity(entity: PersistenceEntity): string | undefined {
  const envelope = (entity.payload as { envelope?: { unit_kind?: unknown } }).envelope;
  if (envelope && typeof envelope.unit_kind === "string" && envelope.unit_kind.length > 0) {
    return envelope.unit_kind;
  }
  return undefined;
}

/**
 * PersistencePort adapter for RPR S16 hand-off.
 * Does not execute processor stages; stores resulting Canonical Unit state.
 * Model C: creates rev:initial + ensureInitialHead.
 */
export class RepositoryPersistencePort implements PersistencePort {
  private readonly store = new MemoryStore();
  readonly repository = new MemoryPersistenceRepository(this.store);

  async persist(unit: unknown): Promise<void> {
    try {
      const entity = entityFromCanonicalUnit(unit, {
        revision_id: INITIAL_REVISION_ID,
      });
      assertEntityIntegrity(entity);
      const unit_kind = unitKindFromEntity(entity);
      const lookup =
        entity.entity_kind === "CanonicalUnit" && unit_kind !== undefined
          ? { unit_kind, revision_id: INITIAL_REVISION_ID }
          : undefined;

      if (await this.repository.exists(entity.identity, entity.entity_kind, lookup)) {
        // Idempotent hand-off: identical create is OK; mutation is rejected upstream.
        const existing = await this.repository.get(
          entity.identity,
          entity.entity_kind,
          lookup,
        );
        await this.repository.replace(entity, {
          expected_version: existing.content_version,
        });
        if (entity.entity_kind === "CanonicalUnit" && unit_kind !== undefined) {
          await this.repository.ensureInitialHead(
            entity.identity,
            unit_kind,
            INITIAL_REVISION_ID,
          );
        }
        return;
      }
      await this.repository.create(entity);
      if (entity.entity_kind === "CanonicalUnit" && unit_kind !== undefined) {
        await this.repository.ensureInitialHead(
          entity.identity,
          unit_kind,
          INITIAL_REVISION_ID,
        );
      }
    } catch (err) {
      if (isPersistenceError(err)) throw err;
      throw new PersistenceError(
        "STORAGE_FAILURE",
        "PersistencePort hand-off failed",
        { cause: err instanceof Error ? err.message : String(err) },
      );
    }
  }
}

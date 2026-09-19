import type { PersistencePort } from "@sciros/shared";
import { ProcessorError } from "../errors.js";

/** Persistence hook — hand-off only; no schema in Sprint 2. */
export interface PersistenceHook {
  readonly available: boolean;
  persist(unit: unknown): Promise<void>;
}

export function unavailablePersistenceHook(): PersistenceHook {
  return {
    available: false,
    async persist(): Promise<void> {
      throw new ProcessorError(
        "PersistenceUnavailable",
        "Persistence hook not bound",
      );
    },
  };
}

export function createPersistenceHook(port: PersistencePort): PersistenceHook {
  return {
    available: true,
    persist: (unit) => port.persist(unit),
  };
}

export class InMemoryPersistencePort implements PersistencePort {
  private readonly units: unknown[] = [];

  async persist(unit: unknown): Promise<void> {
    this.units.push(unit);
  }

  snapshot(): readonly unknown[] {
    return [...this.units];
  }
}

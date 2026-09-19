import { ContradictionValidationError } from "./errors.js";
import { ContradictionValidator } from "./validator.js";
import type { Contradiction } from "./types.js";

export interface ContradictionRepository {
  has(contradictionId: string): Promise<boolean>;
  get(contradictionId: string): Promise<Contradiction | null>;
  put(contradiction: Contradiction): Promise<void>;
}

export class InMemoryContradictionRepository implements ContradictionRepository {
  private readonly store = new Map<string, Contradiction>();
  private readonly validator = new ContradictionValidator();

  async has(contradictionId: string): Promise<boolean> {
    return this.store.has(contradictionId);
  }

  async get(contradictionId: string): Promise<Contradiction | null> {
    return this.store.get(contradictionId) ?? null;
  }

  async put(contradiction: Contradiction): Promise<void> {
    this.validator.validate(contradiction);
    this.store.set(contradiction.contradiction_id, contradiction);
  }

  async insertNew(contradiction: Contradiction): Promise<void> {
    if (this.store.has(contradiction.contradiction_id)) {
      throw new ContradictionValidationError(
        "F_UNIQUE",
        `contradiction_id already exists: ${contradiction.contradiction_id}`,
      );
    }
    await this.put(contradiction);
  }

  snapshot(): readonly Contradiction[] {
    return [...this.store.values()];
  }
}

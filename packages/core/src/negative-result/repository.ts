import { NegativeResultValidationError } from "./errors.js";
import { NegativeResultValidator } from "./validator.js";
import type { NegativeResult } from "./types.js";

export interface NegativeResultRepository {
  has(negativeResultId: string): Promise<boolean>;
  get(negativeResultId: string): Promise<NegativeResult | null>;
  put(negativeResult: NegativeResult): Promise<void>;
}

export class InMemoryNegativeResultRepository implements NegativeResultRepository {
  private readonly store = new Map<string, NegativeResult>();
  private readonly validator = new NegativeResultValidator();

  async has(negativeResultId: string): Promise<boolean> {
    return this.store.has(negativeResultId);
  }

  async get(negativeResultId: string): Promise<NegativeResult | null> {
    return this.store.get(negativeResultId) ?? null;
  }

  async put(negativeResult: NegativeResult): Promise<void> {
    this.validator.validate(negativeResult);
    this.store.set(negativeResult.negative_result_id, negativeResult);
  }

  async insertNew(negativeResult: NegativeResult): Promise<void> {
    if (this.store.has(negativeResult.negative_result_id)) {
      throw new NegativeResultValidationError(
        "F_UNIQUE",
        `negative_result_id already exists: ${negativeResult.negative_result_id}`,
      );
    }
    await this.put(negativeResult);
  }

  snapshot(): readonly NegativeResult[] {
    return [...this.store.values()];
  }
}

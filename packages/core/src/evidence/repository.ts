import { EvidenceValidationError } from "./errors.js";
import { EvidenceValidator } from "./validator.js";
import type { Evidence } from "./types.js";

export interface EvidenceRepository {
  has(evidenceId: string): Promise<boolean>;
  get(evidenceId: string): Promise<Evidence | null>;
  put(evidence: Evidence): Promise<void>;
}

export class InMemoryEvidenceRepository implements EvidenceRepository {
  private readonly store = new Map<string, Evidence>();
  private readonly validator = new EvidenceValidator();

  async has(evidenceId: string): Promise<boolean> {
    return this.store.has(evidenceId);
  }

  async get(evidenceId: string): Promise<Evidence | null> {
    return this.store.get(evidenceId) ?? null;
  }

  async put(evidence: Evidence): Promise<void> {
    this.validator.validate(evidence);
    this.store.set(evidence.evidence_id, evidence);
  }

  async insertNew(evidence: Evidence): Promise<void> {
    if (this.store.has(evidence.evidence_id)) {
      throw new EvidenceValidationError(
        "F_UNIQUE",
        `evidence_id already exists: ${evidence.evidence_id}`,
      );
    }
    await this.put(evidence);
  }

  snapshot(): readonly Evidence[] {
    return [...this.store.values()];
  }
}

import { ClaimValidationError } from "./errors.js";
import { ClaimValidator } from "./validator.js";
import type { Claim } from "./types.js";

/**
 * Claim repository port — uniqueness within one implementing system (SCI-001 §7.3).
 * Sprint 3: in-memory implementation only (no persistence schema).
 */
export interface ClaimRepository {
  has(claimId: string): Promise<boolean>;
  get(claimId: string): Promise<Claim | null>;
  put(claim: Claim): Promise<void>;
}

export class InMemoryClaimRepository implements ClaimRepository {
  private readonly store = new Map<string, Claim>();
  private readonly validator = new ClaimValidator();

  async has(claimId: string): Promise<boolean> {
    return this.store.has(claimId);
  }

  async get(claimId: string): Promise<Claim | null> {
    return this.store.get(claimId) ?? null;
  }

  async put(claim: Claim): Promise<void> {
    this.validator.validate(claim);
    const existing = this.store.get(claim.claim_id);
    if (existing && existing.claim_version === claim.claim_version) {
      // same version identity — allow Standing-only updates (same version)
      // uniqueness is on claim_id within store; versions share id
    }
    this.store.set(claim.claim_id, claim);
  }

  async insertNew(claim: Claim): Promise<void> {
    if (this.store.has(claim.claim_id)) {
      throw new ClaimValidationError(
        "F_UNIQUE",
        `claim_id already exists in store: ${claim.claim_id}`,
      );
    }
    await this.put(claim);
  }

  snapshot(): readonly Claim[] {
    return [...this.store.values()];
  }
}

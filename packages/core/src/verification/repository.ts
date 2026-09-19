import { VerificationValidationError } from "./errors.js";
import { VerificationValidator } from "./validator.js";
import type { Verification } from "./types.js";

export interface VerificationRepository {
  has(verificationId: string): Promise<boolean>;
  get(verificationId: string): Promise<Verification | null>;
  put(verification: Verification): Promise<void>;
}

export class InMemoryVerificationRepository implements VerificationRepository {
  private readonly store = new Map<string, Verification>();
  private readonly validator = new VerificationValidator();

  async has(verificationId: string): Promise<boolean> {
    return this.store.has(verificationId);
  }

  async get(verificationId: string): Promise<Verification | null> {
    return this.store.get(verificationId) ?? null;
  }

  async put(verification: Verification): Promise<void> {
    this.validator.validate(verification);
    this.store.set(verification.verification_id, verification);
  }

  async insertNew(verification: Verification): Promise<void> {
    if (this.store.has(verification.verification_id)) {
      throw new VerificationValidationError(
        "F_UNIQUE",
        `verification_id already exists: ${verification.verification_id}`,
      );
    }
    await this.put(verification);
  }

  snapshot(): readonly Verification[] {
    return [...this.store.values()];
  }
}

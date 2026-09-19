import {
  ClaimValidator,
  ContradictionValidator,
  EvidenceValidator,
  NegativeResultValidator,
  VerificationValidator,
  isClaimValidationError,
  isContradictionValidationError,
  isEvidenceValidationError,
  isNegativeResultValidationError,
  isVerificationValidationError,
  type Claim,
  type Contradiction,
  type CreateNegativeResultInput,
  type Evidence,
  type NegativeResult,
  type Verification,
} from "@sciros/core";
import { ProcessorError } from "../errors.js";

/**
 * Validation engine — Claim + Evidence + Contradiction + Negative Result + Verification (Sprint 8).
 */
export class ValidationEngine {
  private readonly claimValidator = new ClaimValidator();
  private readonly evidenceValidator = new EvidenceValidator();
  private readonly contradictionValidator = new ContradictionValidator();
  private readonly negativeResultValidator = new NegativeResultValidator();
  private readonly verificationValidator = new VerificationValidator();

  isAvailable(): boolean {
    return true;
  }

  async validate(unit: unknown): Promise<void> {
    if (isClaimLike(unit)) {
      try {
        this.claimValidator.validate(unit);
      } catch (err) {
        if (isClaimValidationError(err)) {
          throw new ProcessorError("StageFailure", err.message, {
            details: { claimFailure: err.code, ...err.details },
          });
        }
        throw err;
      }
      return;
    }
    if (isEvidenceLike(unit)) {
      try {
        this.evidenceValidator.validate(unit);
      } catch (err) {
        if (isEvidenceValidationError(err)) {
          throw new ProcessorError("StageFailure", err.message, {
            details: { evidenceFailure: err.code, ...err.details },
          });
        }
        throw err;
      }
      return;
    }
    if (isContradictionLike(unit)) {
      try {
        this.contradictionValidator.validate(unit);
      } catch (err) {
        if (isContradictionValidationError(err)) {
          throw new ProcessorError("StageFailure", err.message, {
            details: { contradictionFailure: err.code, ...err.details },
          });
        }
        throw err;
      }
      return;
    }
    if (isNegativeResultLike(unit)) {
      try {
        this.negativeResultValidator.validate(unit);
      } catch (err) {
        if (isNegativeResultValidationError(err)) {
          throw new ProcessorError("StageFailure", err.message, {
            details: { negativeResultFailure: err.code, ...err.details },
          });
        }
        throw err;
      }
      return;
    }
    if (isVerificationLike(unit)) {
      try {
        this.verificationValidator.validate(unit);
      } catch (err) {
        if (isVerificationValidationError(err)) {
          throw new ProcessorError("StageFailure", err.message, {
            details: { verificationFailure: err.code, ...err.details },
          });
        }
        throw err;
      }
      return;
    }
    throw new ProcessorError(
      "ValidationUnavailable",
      "Sprint 8 validates Claim, Evidence, Contradiction, Negative Result, or Verification units only",
    );
  }
}

export function isClaimLike(unit: unknown): unit is Claim {
  return (
    typeof unit === "object" &&
    unit !== null &&
    "claim_id" in unit &&
    "standing" in unit &&
    "proposition" in unit &&
    "scope" in unit
  );
}

export function isEvidenceLike(unit: unknown): unit is Evidence {
  return (
    typeof unit === "object" &&
    unit !== null &&
    "evidence_id" in unit &&
    "record_state" in unit &&
    "source" in unit &&
    "provenance" in unit &&
    !("standing" in unit)
  );
}

export function isContradictionLike(unit: unknown): unit is Contradiction {
  return (
    typeof unit === "object" &&
    unit !== null &&
    "contradiction_id" in unit &&
    "involved_claims" in unit &&
    "overlap_statement" in unit &&
    "incompatibility_statement" in unit &&
    !("standing" in unit) &&
    !("evidence_id" in unit)
  );
}

export function isNegativeResultLike(unit: unknown): unit is NegativeResult {
  return (
    typeof unit === "object" &&
    unit !== null &&
    "negative_result_id" in unit &&
    "expected_observation" in unit &&
    "observed_absence" in unit &&
    "protocol_ref" in unit &&
    "scope" in unit &&
    "record_state" in unit &&
    !("standing" in unit) &&
    !("evidence_id" in unit) &&
    !("contradiction_id" in unit)
  );
}

export function isVerificationLike(unit: unknown): unit is Verification {
  return (
    typeof unit === "object" &&
    unit !== null &&
    "verification_id" in unit &&
    "verification_outcome" in unit &&
    "verification_method" in unit &&
    "verification_rationale" in unit &&
    "record_state" in unit &&
    !("standing" in unit) &&
    !("evidence_id" in unit) &&
    !("contradiction_id" in unit) &&
    !("negative_result_id" in unit)
  );
}

/** Pre-registration content (no record_state). */
export function isNegativeResultContentLike(
  unit: unknown,
): unit is CreateNegativeResultInput {
  return (
    typeof unit === "object" &&
    unit !== null &&
    "negative_result_id" in unit &&
    "expected_observation" in unit &&
    "observed_absence" in unit &&
    "protocol_ref" in unit &&
    "scope" in unit &&
    !("record_state" in unit)
  );
}

import {
  ClaimVersionService,
  ContradictionVersionService,
  EvidenceVersionService,
  NegativeResultVersionService,
  VerificationVersionService,
  isClaimValidationError,
  isContradictionMaterialChange,
  isContradictionValidationError,
  isEvidenceMaterialChange,
  isEvidenceValidationError,
  isMaterialChange,
  isNegativeResultMaterialChange,
  isNegativeResultValidationError,
  isVerificationMaterialChange,
  isVerificationValidationError,
  type Claim,
  type Contradiction,
  type ContradictionContentUpdate,
  type Evidence,
  type EvidenceContentUpdate,
  type NegativeResult,
  type NegativeResultContentUpdate,
  type Verification,
  type VerificationContentUpdate,
} from "@sciros/core";
import { ProcessorError } from "../errors.js";
import {
  isClaimLike,
  isContradictionLike,
  isEvidenceLike,
  isNegativeResultLike,
  isVerificationLike,
} from "./validation-engine.js";

export interface VersionPlan {
  readonly action: "none" | "bump" | "unavailable";
  readonly reason: string;
  readonly claim?: Claim;
  readonly evidence?: Evidence;
  readonly contradiction?: Contradiction;
  readonly negativeResult?: NegativeResult;
  readonly verification?: Verification;
}

/**
 * Version engine — SCI-001 / SCI-002 / SCI-004 / SCI-005 / SCI-006 material-change (S10).
 */
export class VersionEngine {
  private readonly claims = new ClaimVersionService();
  private readonly evidence = new EvidenceVersionService();
  private readonly contradictions = new ContradictionVersionService();
  private readonly negativeResults = new NegativeResultVersionService();
  private readonly verifications = new VerificationVersionService();

  plan(prior: unknown, proposed: unknown): VersionPlan {
    if (prior === null || prior === undefined) {
      return { action: "none", reason: "no_prior_version" };
    }

    if (isClaimLike(prior) && isClaimLike(proposed)) {
      if (!isMaterialChange(prior, proposed)) {
        return { action: "none", reason: "no_material_change" };
      }
      return { action: "bump", reason: "claim_material_change" };
    }

    if (isEvidenceLike(prior) && isEvidenceLike(proposed)) {
      if (!isEvidenceMaterialChange(prior, proposed)) {
        return { action: "none", reason: "no_material_change" };
      }
      return { action: "bump", reason: "evidence_material_change" };
    }

    if (isContradictionLike(prior) && isContradictionLike(proposed)) {
      if (!isContradictionMaterialChange(prior, proposed)) {
        return { action: "none", reason: "no_material_change" };
      }
      return { action: "bump", reason: "contradiction_material_change" };
    }

    if (isNegativeResultLike(prior) && isNegativeResultLike(proposed)) {
      if (!isNegativeResultMaterialChange(prior, proposed)) {
        return { action: "none", reason: "no_material_change" };
      }
      return { action: "bump", reason: "negative_result_material_change" };
    }

    if (isVerificationLike(prior) && isVerificationLike(proposed)) {
      if (!isVerificationMaterialChange(prior, proposed)) {
        return { action: "none", reason: "no_material_change" };
      }
      return { action: "bump", reason: "verification_material_change" };
    }

    return {
      action: "unavailable",
      reason:
        "prior/proposed not a matched Claim, Evidence, Contradiction, Negative Result, or Verification pair",
    };
  }

  applyEvidenceMaterialUpdate(
    prior: Evidence,
    nextContent: EvidenceContentUpdate,
  ): Evidence {
    try {
      return this.evidence.applyMaterialUpdate(prior, nextContent);
    } catch (err) {
      if (isEvidenceValidationError(err)) {
        throw new ProcessorError("StageFailure", err.message, {
          details: { evidenceFailure: err.code, ...err.details },
        });
      }
      throw err;
    }
  }

  applyClaimMaterialUpdate(prior: Claim, proposed: Claim): Claim {
    try {
      return this.claims.applyMaterialUpdate(prior, {
        proposition: proposed.proposition,
        scope: proposed.scope,
      });
    } catch (err) {
      if (isClaimValidationError(err)) {
        throw new ProcessorError("StageFailure", err.message, {
          details: { claimFailure: err.code, ...err.details },
        });
      }
      throw err;
    }
  }

  applyContradictionMaterialUpdate(
    prior: Contradiction,
    nextContent: ContradictionContentUpdate,
  ): Contradiction {
    try {
      return this.contradictions.applyMaterialUpdate(prior, nextContent);
    } catch (err) {
      if (isContradictionValidationError(err)) {
        throw new ProcessorError("StageFailure", err.message, {
          details: { contradictionFailure: err.code, ...err.details },
        });
      }
      throw err;
    }
  }

  applyNegativeResultMaterialUpdate(
    prior: NegativeResult,
    nextContent: NegativeResultContentUpdate,
  ): NegativeResult {
    try {
      return this.negativeResults.applyMaterialUpdate(prior, nextContent);
    } catch (err) {
      if (isNegativeResultValidationError(err)) {
        throw new ProcessorError("StageFailure", err.message, {
          details: { negativeResultFailure: err.code, ...err.details },
        });
      }
      throw err;
    }
  }

  applyVerificationMaterialUpdate(
    prior: Verification,
    nextContent: VerificationContentUpdate,
  ): Verification {
    try {
      return this.verifications.applyMaterialUpdate(prior, nextContent);
    } catch (err) {
      if (isVerificationValidationError(err)) {
        throw new ProcessorError("StageFailure", err.message, {
          details: { verificationFailure: err.code, ...err.details },
        });
      }
      throw err;
    }
  }
}

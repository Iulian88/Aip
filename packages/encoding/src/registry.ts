import type {
  Claim,
  Contradiction,
  Evidence,
  NegativeResult,
  Verification,
} from "@sciros/core";
import { CanonicalEncodingBuilder } from "./builder.js";
import { CanonicalEncodingError } from "./errors.js";
import type { CanonicalUnit, CanonicalUnitKind } from "./types.js";

export type CanonicalBuildable =
  | Claim
  | Evidence
  | Contradiction
  | NegativeResult
  | Verification
  | { readonly kind: "grade"; readonly evidence: Evidence };

/**
 * Registry of ENC-001 unit builders by Core kind.
 */
export class CanonicalEncodingRegistry {
  private readonly builder = new CanonicalEncodingBuilder();

  detectKind(input: unknown): CanonicalUnitKind | null {
    if (!input || typeof input !== "object") return null;
    const o = input as Record<string, unknown>;
    if (o.kind === "grade" && o.evidence) return "GradeDesignationUnit";
    if ("claim_id" in o && "standing" in o) return "ClaimUnit";
    if ("evidence_id" in o && "source" in o) return "EvidenceUnit";
    if ("contradiction_id" in o && "involved_claims" in o) return "ContradictionUnit";
    if ("negative_result_id" in o && "expected_observation" in o) {
      return "NegativeResultUnit";
    }
    if ("verification_id" in o && "verification_outcome" in o) return "VerificationUnit";
    return null;
  }

  build(input: unknown): CanonicalUnit {
    const kind = this.detectKind(input);
    if (!kind) {
      throw new CanonicalEncodingError(
        "UNSUPPORTED_INPUT",
        "Input is not a Core Knowledge Object encodable by ENC-001",
      );
    }
    switch (kind) {
      case "ClaimUnit":
        return this.builder.buildClaim(input as Claim);
      case "EvidenceUnit":
        return this.builder.buildEvidence(input as Evidence);
      case "ContradictionUnit":
        return this.builder.buildContradiction(input as Contradiction);
      case "NegativeResultUnit":
        return this.builder.buildNegativeResult(input as NegativeResult);
      case "VerificationUnit":
        return this.builder.buildVerification(input as Verification);
      case "GradeDesignationUnit": {
        const g = input as { kind: "grade"; evidence: Evidence };
        return this.builder.buildGradeDesignation(g.evidence);
      }
      default:
        throw new CanonicalEncodingError("UNSUPPORTED_INPUT", `Unsupported kind ${kind}`);
    }
  }
}

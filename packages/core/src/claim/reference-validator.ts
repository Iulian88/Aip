import {
  CLAIM_ID,
  CONTRADICTION_ID,
  EVIDENCE_ID,
  NEGATIVE_RESULT_ID,
  VERIFICATION_ID,
} from "./identifiers.js";
import { ClaimValidationError } from "./errors.js";

/**
 * Validates relationship identifier grammars only — no dereference (Sprint 3).
 */
export class ClaimReferenceValidator {
  validateSupportedBy(ids: readonly string[] | undefined): void {
    if (!ids) return;
    for (const id of ids) {
      if (!EVIDENCE_ID.test(id)) {
        throw new ClaimValidationError(
          "F10",
          `supported_by entry fails SCI-002 Evidence Identifier: ${id}`,
          { id },
        );
      }
    }
  }

  validateContestedBy(ids: readonly string[] | undefined): void {
    if (!ids) return;
    for (const id of ids) {
      if (!CONTRADICTION_ID.test(id)) {
        throw new ClaimValidationError(
          "F11",
          `contested_by entry fails SCI-004 Contradiction Identifier: ${id}`,
          { id },
        );
      }
    }
  }

  validateQualifiedBy(ids: readonly string[] | undefined): void {
    if (!ids) return;
    for (const id of ids) {
      if (!NEGATIVE_RESULT_ID.test(id)) {
        throw new ClaimValidationError(
          "F12",
          `qualified_by entry fails SCI-005 Negative Result Identifier: ${id}`,
          { id },
        );
      }
    }
  }

  validateVerifiedVia(ids: readonly string[] | undefined): void {
    if (!ids) return;
    for (const id of ids) {
      if (!VERIFICATION_ID.test(id)) {
        throw new ClaimValidationError(
          "F13",
          `verified_via entry fails SCI-006 Verification Identifier: ${id}`,
          { id },
        );
      }
    }
  }

  validateClaimIdRef(id: string, field: string): void {
    if (!CLAIM_ID.test(id)) {
      throw new ClaimValidationError("F6", `${field} must be a Claim id: ${id}`, { id, field });
    }
  }
}

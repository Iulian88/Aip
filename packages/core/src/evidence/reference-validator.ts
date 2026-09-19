import { BEARS_ON_CLAIM_ID } from "./identifiers.js";
import { EvidenceValidationError } from "./errors.js";

/** Validates bears_on Claim id grammars only — no dereference / no symmetry. */
export class EvidenceReferenceValidator {
  validateBearsOn(ids: readonly string[] | undefined): void {
    if (!ids) return;
    for (const id of ids) {
      if (!BEARS_ON_CLAIM_ID.test(id)) {
        throw new EvidenceValidationError(
          "F7",
          `bears_on entry fails SCI-001 Claim Identifier: ${id}`,
          { id },
        );
      }
    }
  }
}

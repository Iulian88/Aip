import {
  V_CLAIM_ID,
  V_CONTRADICTION_ID,
  V_EVIDENCE_ID,
  V_NEGATIVE_RESULT_ID,
  isAllowedGradeRefEntry,
  verificationNfcTrim,
} from "./identifiers.js";
import { VerificationValidationError } from "./errors.js";

/** Grammar-only refs — no dereference / no mutation. */
export class VerificationReferenceValidator {
  validateClaimRefs(ids: readonly string[] | undefined): readonly string[] | undefined {
    if (ids === undefined) return undefined;
    if (!Array.isArray(ids)) {
      throw new VerificationValidationError("F9", "claim_refs must be an array");
    }
    const out: string[] = [];
    for (const raw of ids) {
      if (typeof raw !== "string") {
        throw new VerificationValidationError("F9", "Claim id must be string");
      }
      const id = verificationNfcTrim(raw);
      if (!V_CLAIM_ID.test(id)) {
        throw new VerificationValidationError(
          "F9",
          `claim_refs entry fails SCI-001 Claim Identifier: ${id}`,
          { id },
        );
      }
      out.push(id);
    }
    return Object.freeze(out);
  }

  validateEvidenceRefs(ids: readonly string[] | undefined): readonly string[] | undefined {
    if (ids === undefined) return undefined;
    if (!Array.isArray(ids)) {
      throw new VerificationValidationError("F9", "evidence_refs must be an array");
    }
    const out: string[] = [];
    for (const raw of ids) {
      if (typeof raw !== "string" || !V_EVIDENCE_ID.test(raw)) {
        throw new VerificationValidationError(
          "F9",
          `evidence_refs entry fails SCI-002 Evidence Identifier: ${String(raw)}`,
          { id: raw },
        );
      }
      out.push(raw);
    }
    return Object.freeze(out);
  }

  validateContradictionRefs(
    ids: readonly string[] | undefined,
  ): readonly string[] | undefined {
    if (ids === undefined) return undefined;
    if (!Array.isArray(ids)) {
      throw new VerificationValidationError("F9", "contradiction_refs must be an array");
    }
    const out: string[] = [];
    for (const raw of ids) {
      if (typeof raw !== "string" || !V_CONTRADICTION_ID.test(raw)) {
        throw new VerificationValidationError(
          "F9",
          `contradiction_refs entry fails SCI-004 Contradiction Identifier: ${String(raw)}`,
          { id: raw },
        );
      }
      out.push(raw);
    }
    return Object.freeze(out);
  }

  validateNegativeResultRefs(
    ids: readonly string[] | undefined,
  ): readonly string[] | undefined {
    if (ids === undefined) return undefined;
    if (!Array.isArray(ids)) {
      throw new VerificationValidationError("F9", "negative_result_refs must be an array");
    }
    const out: string[] = [];
    for (const raw of ids) {
      if (typeof raw !== "string" || !V_NEGATIVE_RESULT_ID.test(raw)) {
        throw new VerificationValidationError(
          "F9",
          `negative_result_refs entry fails SCI-005 Negative Result Identifier: ${String(raw)}`,
          { id: raw },
        );
      }
      out.push(raw);
    }
    return Object.freeze(out);
  }

  validateGradeRefs(ids: readonly string[] | undefined): readonly string[] | undefined {
    if (ids === undefined) return undefined;
    if (!Array.isArray(ids)) {
      throw new VerificationValidationError("F9", "grade_refs must be an array");
    }
    const out: string[] = [];
    for (const raw of ids) {
      if (typeof raw !== "string" || !isAllowedGradeRefEntry(raw)) {
        throw new VerificationValidationError(
          "F9",
          `grade_refs entry invalid: ${String(raw)}`,
          { id: raw },
        );
      }
      out.push(verificationNfcTrim(raw));
    }
    return Object.freeze(out);
  }
}

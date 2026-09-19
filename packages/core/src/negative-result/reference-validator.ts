import {
  NR_CLAIM_ID,
  NR_CONTRADICTION_ID,
  NR_EVIDENCE_ID,
  negativeResultNfcTrim,
} from "./identifiers.js";
import { NegativeResultValidationError } from "./errors.js";

/** Claim / Evidence / Contradiction id grammars + opaque verification refs — no dereference. */
export class NegativeResultReferenceValidator {
  validateClaimRefs(ids: readonly string[] | undefined): readonly string[] | undefined {
    if (ids === undefined) return undefined;
    if (!Array.isArray(ids)) {
      throw new NegativeResultValidationError("F8", "claim_refs must be an array");
    }
    const out: string[] = [];
    for (const raw of ids) {
      if (typeof raw !== "string") {
        throw new NegativeResultValidationError("F8", "Claim id must be string");
      }
      const id = negativeResultNfcTrim(raw);
      if (!NR_CLAIM_ID.test(id)) {
        throw new NegativeResultValidationError(
          "F8",
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
      throw new NegativeResultValidationError("F8", "evidence_refs must be an array");
    }
    const out: string[] = [];
    for (const raw of ids) {
      if (typeof raw !== "string" || !NR_EVIDENCE_ID.test(raw)) {
        throw new NegativeResultValidationError(
          "F8",
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
      throw new NegativeResultValidationError("F8", "contradiction_refs must be an array");
    }
    const out: string[] = [];
    for (const raw of ids) {
      if (typeof raw !== "string" || !NR_CONTRADICTION_ID.test(raw)) {
        throw new NegativeResultValidationError(
          "F8",
          `contradiction_refs entry fails SCI-004 Contradiction Identifier: ${String(raw)}`,
          { id: raw },
        );
      }
      out.push(raw);
    }
    return Object.freeze(out);
  }

  /** SCI-005 §11.4 — non-empty strings only until SCI-006. */
  validateVerificationRefs(
    ids: readonly string[] | undefined,
  ): readonly string[] | undefined {
    if (ids === undefined) return undefined;
    if (!Array.isArray(ids)) {
      throw new NegativeResultValidationError("F8", "verification_refs must be an array");
    }
    const out: string[] = [];
    for (const raw of ids) {
      if (typeof raw !== "string") {
        throw new NegativeResultValidationError("F8", "verification_refs entry must be string");
      }
      const id = negativeResultNfcTrim(raw);
      if (id.length < 1) {
        throw new NegativeResultValidationError(
          "F8",
          "verification_refs entry empty after NFC+trim",
        );
      }
      out.push(id);
    }
    return Object.freeze(out);
  }
}

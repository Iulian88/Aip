import { CITED_EVIDENCE_ID, INVOLVED_CLAIM_ID, contradictionNfcTrim } from "./identifiers.js";
import { ContradictionValidationError } from "./errors.js";

/** Claim / Evidence id grammars only — no dereference / no symmetry. */
export class ContradictionReferenceValidator {
  validateInvolvedClaims(ids: readonly string[] | undefined): readonly string[] {
    if (!Array.isArray(ids) || ids.length < 2) {
      throw new ContradictionValidationError(
        "F2",
        "involved_claims requires ≥ 2 Claim ids",
      );
    }
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of ids) {
      if (typeof raw !== "string") {
        throw new ContradictionValidationError("F3", "Claim id must be string");
      }
      const id = contradictionNfcTrim(raw);
      if (!INVOLVED_CLAIM_ID.test(id)) {
        throw new ContradictionValidationError(
          "F3",
          `involved_claims entry fails SCI-001 Claim Identifier: ${id}`,
          { id },
        );
      }
      if (seen.has(id)) {
        throw new ContradictionValidationError(
          "F2",
          `Duplicate Claim id in involved_claims: ${id}`,
          { id },
        );
      }
      seen.add(id);
      out.push(id);
    }
    return Object.freeze(out);
  }

  validateEvidenceRefs(ids: readonly string[] | undefined): readonly string[] | undefined {
    if (ids === undefined) return undefined;
    if (!Array.isArray(ids)) {
      throw new ContradictionValidationError("F4", "evidence_refs must be an array");
    }
    const out: string[] = [];
    for (const raw of ids) {
      if (typeof raw !== "string" || !CITED_EVIDENCE_ID.test(raw)) {
        throw new ContradictionValidationError(
          "F4",
          `evidence_refs entry fails SCI-002 Evidence Identifier: ${String(raw)}`,
          { id: raw },
        );
      }
      out.push(raw);
    }
    return Object.freeze(out);
  }
}

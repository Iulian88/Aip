import type { Evidence } from "../evidence/types.js";
import { EvidenceGradeValidationError } from "./errors.js";
import type { GradeLabel } from "./types.js";

/**
 * SCI-003 §11 eligibility against SCI-002 Source / Provenance fields.
 */
export class EvidenceGradeEligibilityEvaluator {
  assertEligible(evidence: Evidence, label: GradeLabel): void {
    const C = evidence.provenance.completeness;
    const S = evidence.source.source_class;
    const SS = evidence.source.source_state;

    // EL-P1
    if (C === "missing" && label !== "model_output_only") {
      throw new EvidenceGradeValidationError(
        "F3",
        "EL-P1: missing provenance ceiling requires model_output_only",
        { completeness: C, label },
      );
    }
    // EL-P2
    if (C === "partial" && label === "registered_primary_data") {
      throw new EvidenceGradeValidationError(
        "F3",
        "EL-P2: partial provenance forbids registered_primary_data",
        { completeness: C, label },
      );
    }

    // EL-S2
    if (SS === "unresolved" && label !== "model_output_only") {
      throw new EvidenceGradeValidationError(
        "F4",
        "EL-S2: unresolved source_state requires model_output_only",
        { source_state: SS, label },
      );
    }

    // EL-S1 source-class table
    switch (label) {
      case "model_output_only":
        return;
      case "literature_secondary":
        if (S !== "literature_venue" || SS !== "declared") {
          throw new EvidenceGradeValidationError(
            "F4",
            "literature_secondary requires literature_venue + declared",
            { source_class: S, source_state: SS },
          );
        }
        return;
      case "curated_database_snapshot":
        if (
          (S !== "database_of_record" && S !== "curated_deposit") ||
          SS !== "declared"
        ) {
          throw new EvidenceGradeValidationError(
            "F4",
            "curated_database_snapshot requires database_of_record|curated_deposit + declared",
            { source_class: S, source_state: SS },
          );
        }
        return;
      case "registered_primary_data": {
        const allowed = new Set([
          "instrument",
          "laboratory",
          "registry",
          "curated_deposit",
          "database_of_record",
        ]);
        if (!allowed.has(S) || SS !== "declared" || C !== "complete") {
          throw new EvidenceGradeValidationError(
            "F4",
            "registered_primary_data requires primary source classes + declared + complete",
            { source_class: S, source_state: SS, completeness: C },
          );
        }
        return;
      }
      default: {
        const _exhaustive: never = label;
        throw new EvidenceGradeValidationError("F2", `Unknown label: ${_exhaustive}`);
      }
    }
  }

  isEligible(evidence: Evidence, label: GradeLabel): boolean {
    try {
      this.assertEligible(evidence, label);
      return true;
    } catch {
      return false;
    }
  }
}

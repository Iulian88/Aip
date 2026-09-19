import {
  GRADE_REF,
  NUMERIC_CONFIDENCE,
  gradeNfcTrim,
  isConformantGradeRef,
  isDeferredGradeRef,
  parseGradeRef,
} from "./identifiers.js";
import { EvidenceGradeValidationError } from "./errors.js";
import { FORBIDDEN_GRADE_LABELS } from "./types.js";

/**
 * Validates grade_ref encoding grammar (SCI-003 §9) — no eligibility.
 */
export class EvidenceGradeReferenceValidator {
  assertEncoding(gradeRef: string): void {
    const raw = gradeNfcTrim(gradeRef);
    if (NUMERIC_CONFIDENCE.test(raw)) {
      throw new EvidenceGradeValidationError(
        "F8",
        `Numeric confidence is not a Grade: ${raw}`,
      );
    }
    if ((FORBIDDEN_GRADE_LABELS as readonly string[]).includes(raw)) {
      throw new EvidenceGradeValidationError("F2", `Forbidden grade_ref: ${raw}`);
    }
    // Bare label without pin
    if (
      raw === "model_output_only" ||
      raw === "literature_secondary" ||
      raw === "curated_database_snapshot" ||
      raw === "registered_primary_data"
    ) {
      throw new EvidenceGradeValidationError(
        "F1",
        `grade_ref missing SCI-003 scheme pin: ${raw}`,
      );
    }
    if (!GRADE_REF.test(raw)) {
      throw new EvidenceGradeValidationError(
        "F1",
        `grade_ref fails SCI-003 §9 encoding: ${raw}`,
      );
    }
    const parsed = parseGradeRef(raw);
    if (!parsed) {
      throw new EvidenceGradeValidationError("F1", `Unparseable grade_ref: ${raw}`);
    }
  }

  /**
   * SCI-002 slot may hold deferred_sci003 (MIG-4) or §9 conformant Grade.
   */
  assertSlotAllowed(gradeRef: string): void {
    const raw = gradeNfcTrim(gradeRef);
    if (isDeferredGradeRef(raw)) {
      return;
    }
    if (isConformantGradeRef(raw)) {
      this.assertEncoding(raw);
      return;
    }
    if (NUMERIC_CONFIDENCE.test(raw)) {
      throw new EvidenceGradeValidationError(
        "F8",
        `Numeric confidence is not a Grade: ${raw}`,
      );
    }
    if ((FORBIDDEN_GRADE_LABELS as readonly string[]).includes(raw)) {
      throw new EvidenceGradeValidationError("F2", `Forbidden grade_ref: ${raw}`);
    }
    throw new EvidenceGradeValidationError(
      "F1",
      `grade_ref must be deferred_sci003 or SCI-003 §9 encoding: ${raw}`,
    );
  }
}

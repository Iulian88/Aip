import { gradeNfcTrim, isConformantGradeRef, isDeferredGradeRef } from "./identifiers.js";

/**
 * SCI-003 AR-6 / SCI-002 §14 — grade_ref change is material.
 */
export function isGradeMaterialChange(
  priorGradeRef: string,
  nextGradeRef: string,
): boolean {
  return gradeNfcTrim(priorGradeRef) !== gradeNfcTrim(nextGradeRef);
}

export class EvidenceGradeMaterialChangeEvaluator {
  isMaterialChange(priorGradeRef: string, nextGradeRef: string): boolean {
    return isGradeMaterialChange(priorGradeRef, nextGradeRef);
  }

  /**
   * True when leaving interim deferred for a conformant Grade (MIG).
   */
  isMigrationChange(priorGradeRef: string, nextGradeRef: string): boolean {
    return (
      isDeferredGradeRef(priorGradeRef) && isConformantGradeRef(nextGradeRef)
    );
  }
}

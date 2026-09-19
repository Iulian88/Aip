import { GRADE_LABELS, GRADE_RANKS, type GradeLabel } from "./types.js";

/** SCI-003 §9 grade_ref encoding */
export const GRADE_REF = /^SCI-003@0\.1\.[0-9]+:(model_output_only|literature_secondary|curated_database_snapshot|registered_primary_data)$/;

export const GRADE_SCHEME_PIN = /^SCI-003@0\.1\.[0-9]+$/;

export const GAE_ID = /^gae:[A-Za-z0-9._~-]{1,128}$/;

/** SCI-003 §12.2 Human Reviewer (Grade-local) */
export const GRADE_HUMAN_REVIEWER = /^human:[A-Za-z0-9._~-]{1,128}$/;

export const GRADE_UTC_SECOND = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

export const DEFERRED_SCI003 = "deferred_sci003";

export const NUMERIC_CONFIDENCE = /^-?[0-9]+(\.[0-9]+)?$/;

export function gradeNfcTrim(value: string): string {
  return value.normalize("NFC").trim();
}

export function isGradeHumanReviewerAgent(authorityAgent: string): boolean {
  return GRADE_HUMAN_REVIEWER.test(authorityAgent);
}

export function isDeferredGradeRef(gradeRef: string): boolean {
  return gradeNfcTrim(gradeRef) === DEFERRED_SCI003;
}

export function isConformantGradeRef(gradeRef: string): boolean {
  return GRADE_REF.test(gradeNfcTrim(gradeRef));
}

export function parseGradeRef(gradeRef: string): {
  pin: string;
  label: GradeLabel;
} | null {
  const raw = gradeNfcTrim(gradeRef);
  const m = /^SCI-003@(0\.1\.[0-9]+):(model_output_only|literature_secondary|curated_database_snapshot|registered_primary_data)$/.exec(
    raw,
  );
  if (!m || m[1] === undefined || m[2] === undefined) return null;
  return {
    pin: `SCI-003@${m[1]}`,
    label: m[2] as GradeLabel,
  };
}

export function encodeGradeRef(
  label: GradeLabel,
  pinVersion = "0.1.0",
): string {
  return `SCI-003@${pinVersion}:${label}`;
}

/** Rank 0 for deferred / null / unknown interim. */
export function rankOfGradeRef(gradeRef: string | "null" | null | undefined): number {
  if (gradeRef === null || gradeRef === undefined || gradeRef === "null") {
    return 0;
  }
  if (isDeferredGradeRef(gradeRef)) {
    return 0;
  }
  const parsed = parseGradeRef(gradeRef);
  if (!parsed) return 0;
  return GRADE_RANKS[parsed.label];
}

export function isGradeLabel(value: string): value is GradeLabel {
  return (GRADE_LABELS as readonly string[]).includes(value);
}

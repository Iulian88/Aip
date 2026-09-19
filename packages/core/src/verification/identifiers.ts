import { CLAIM_ID, EVIDENCE_ID } from "../claim/identifiers.js";
import { CONTRADICTION_OBJECT_ID } from "../contradiction/identifiers.js";
import { NEGATIVE_RESULT_OBJECT_ID } from "../negative-result/identifiers.js";
import { GRADE_REF, isDeferredGradeRef, isConformantGradeRef } from "../grade/identifiers.js";

/** SCI-006 §7.3 */
export const VERIFICATION_OBJECT_ID =
  /^verification:[A-Za-z0-9._~-]{1,128}$/;

export const VERIFICATION_ONTOLOGY_REF = /^SCI-000@0\.1\.[0-9]+$/;
export const VERIFICATION_SPEC_REF = /^SCI-006@0\.1\.[0-9]+$/;
export const VERIFICATION_VERSION = /^[0-9]+\.[0-9]+\.[0-9]+$/;
export const VERIFICATION_UTC_SECOND = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
export const VTE_ID = /^vte:[A-Za-z0-9._~-]{1,128}$/;
/** SCI-006 §9.4 Human Reviewer */
export const VERIFICATION_HUMAN_REVIEWER = /^human:[A-Za-z0-9._~-]{1,128}$/;

export { CLAIM_ID as V_CLAIM_ID };
export { EVIDENCE_ID as V_EVIDENCE_ID };
export { CONTRADICTION_OBJECT_ID as V_CONTRADICTION_ID };
export { NEGATIVE_RESULT_OBJECT_ID as V_NEGATIVE_RESULT_ID };
export { GRADE_REF as V_GRADE_REF };

export function verificationNfcTrim(value: string): string {
  return value.normalize("NFC").trim();
}

export function isVerificationHumanReviewerAgent(authorityAgent: string): boolean {
  return VERIFICATION_HUMAN_REVIEWER.test(authorityAgent);
}

export function leavesPlanned(to: string): boolean {
  return to === "passed" || to === "failed" || to === "inconclusive";
}

export function isConcludedState(state: string): boolean {
  return leavesPlanned(state);
}

/** SCI-006 §11.3 — non-empty; EG-0.1 encodings must match SCI-003 §9. */
export function isAllowedGradeRefEntry(raw: string): boolean {
  const v = verificationNfcTrim(raw);
  if (v.length < 1) return false;
  if (isDeferredGradeRef(v) || isConformantGradeRef(v)) return true;
  if (v.startsWith("SCI-003@")) return GRADE_REF.test(v);
  return true;
}

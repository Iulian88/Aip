import { CLAIM_ID, EVIDENCE_ID } from "../claim/identifiers.js";
import { CONTRADICTION_OBJECT_ID } from "../contradiction/identifiers.js";

/** SCI-005 §7.3 */
export const NEGATIVE_RESULT_OBJECT_ID =
  /^negresult:[A-Za-z0-9._~-]{1,128}$/;

export const NEGATIVE_RESULT_ONTOLOGY_REF = /^SCI-000@0\.1\.[0-9]+$/;
export const NEGATIVE_RESULT_SPEC_REF = /^SCI-005@0\.1\.[0-9]+$/;
export const NEGATIVE_RESULT_VERSION = /^[0-9]+\.[0-9]+\.[0-9]+$/;
export const NEGATIVE_RESULT_UTC_SECOND = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
export const NRTE_ID = /^nrte:[A-Za-z0-9._~-]{1,128}$/;
/** SCI-005 §9.4 Human Reviewer */
export const NEGATIVE_RESULT_HUMAN_REVIEWER = /^human:[A-Za-z0-9._~-]{1,128}$/;

/** SCI-001 Claim id — for claim_refs. */
export { CLAIM_ID as NR_CLAIM_ID };
/** SCI-002 Evidence id — for evidence_refs. */
export { EVIDENCE_ID as NR_EVIDENCE_ID };
/** SCI-004 Contradiction id — for contradiction_refs. */
export { CONTRADICTION_OBJECT_ID as NR_CONTRADICTION_ID };

export function negativeResultNfcTrim(value: string): string {
  return value.normalize("NFC").trim();
}

export function isNegativeResultHumanReviewerAgent(authorityAgent: string): boolean {
  return NEGATIVE_RESULT_HUMAN_REVIEWER.test(authorityAgent);
}

export function requiresHumanForTransition(to: string): boolean {
  return to === "registered" || to === "withdrawn";
}

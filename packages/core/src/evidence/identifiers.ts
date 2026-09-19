import { CLAIM_ID, EVIDENCE_ID as CLAIM_SIDE_EVIDENCE_ID } from "../claim/identifiers.js";

/** SCI-002 §7.3 Evidence Identifier grammar (same pattern as Claim-side import). */
export const EVIDENCE_ID = CLAIM_SIDE_EVIDENCE_ID;
/** Alias for package consumers that need to avoid name clash with Claim exports. */
export const EVIDENCE_OBJECT_ID = CLAIM_SIDE_EVIDENCE_ID;

export const EVIDENCE_ONTOLOGY_REF = /^SCI-000@0\.1\.[0-9]+$/;
export const EVIDENCE_SPEC_REF = /^SCI-002@0\.1\.[0-9]+$/;
export const EVIDENCE_VERSION = /^[0-9]+\.[0-9]+\.[0-9]+$/;
export const EVIDENCE_UTC_SECOND = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
export const ERTE_ID = /^erte:[A-Za-z0-9._~-]{1,128}$/;
/** SCI-002 §13.3 Human Reviewer */
export const EVIDENCE_HUMAN_REVIEWER = /^human:[A-Za-z0-9._~-]{1,128}$/;
export const ITEM_ID = /^eitem:[A-Za-z0-9._~-]{1,128}$/;
export const COLLECTION_ID = /^ecol:[A-Za-z0-9._~-]{1,128}$/;

/** SCI-001 Claim id — for bears_on targets. */
export { CLAIM_ID as BEARS_ON_CLAIM_ID };

export const DEFERRED_GRADE_REF = "deferred_sci003";

export function evidenceNfcTrim(value: string): string {
  return value.normalize("NFC").trim();
}

export function isEvidenceHumanReviewerAgent(authorityAgent: string): boolean {
  return EVIDENCE_HUMAN_REVIEWER.test(authorityAgent);
}

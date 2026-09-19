/**
 * Identifier grammars.
 * Claim: SCI-001 §7.3.
 * Evidence/Contradiction/NR/Verification: imported by reference from owner specs (patterns only).
 */

export const CLAIM_ID = /^claim:[A-Za-z0-9._~-]{1,128}$/;
export const ONTOLOGY_REF = /^SCI-000@0\.1\.[0-9]+$/;
export const SPEC_REF = /^SCI-001@0\.1\.[0-9]+$/;
export const CLAIM_VERSION = /^[0-9]+\.[0-9]+\.[0-9]+$/;
export const UTC_SECOND = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
export const STE_ID = /^ste:[A-Za-z0-9._~-]{1,128}$/;
/** SCI-001 §12.7 Human Reviewer pattern */
export const HUMAN_REVIEWER = /^human:[A-Za-z0-9._~-]{1,128}$/;

/** SCI-002@0.1.0 §7.3 — imported by reference, not redefined. */
export const EVIDENCE_ID = /^evidence:[A-Za-z0-9._~-]{1,128}$/;
/** SCI-004@0.1.0 §7.3 */
export const CONTRADICTION_ID = /^contradiction:[A-Za-z0-9._~-]{1,128}$/;
/** SCI-005@0.1.0 §7.3 */
export const NEGATIVE_RESULT_ID = /^negresult:[A-Za-z0-9._~-]{1,128}$/;
/** SCI-006@0.1.0 §7.3 */
export const VERIFICATION_ID = /^verification:[A-Za-z0-9._~-]{1,128}$/;

export function nfcTrim(value: string): string {
  return value.normalize("NFC").trim();
}

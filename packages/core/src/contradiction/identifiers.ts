import { CLAIM_ID, EVIDENCE_ID } from "../claim/identifiers.js";

/** SCI-004 §7.3 — same pattern as Claim-side CONTRADICTION_ID import. */
export const CONTRADICTION_OBJECT_ID =
  /^contradiction:[A-Za-z0-9._~-]{1,128}$/;

export const CONTRADICTION_ONTOLOGY_REF = /^SCI-000@0\.1\.[0-9]+$/;
export const CONTRADICTION_SPEC_REF = /^SCI-004@0\.1\.[0-9]+$/;
export const CONTRADICTION_VERSION = /^[0-9]+\.[0-9]+\.[0-9]+$/;
export const CONTRADICTION_UTC_SECOND = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
export const CRTE_ID = /^crte:[A-Za-z0-9._~-]{1,128}$/;
/** SCI-004 §9.4 Human Reviewer */
export const CONTRADICTION_HUMAN_REVIEWER = /^human:[A-Za-z0-9._~-]{1,128}$/;

/** SCI-001 Claim id — for involved_claims. */
export { CLAIM_ID as INVOLVED_CLAIM_ID };
/** SCI-002 Evidence id — for evidence_refs. */
export { EVIDENCE_ID as CITED_EVIDENCE_ID };

export function contradictionNfcTrim(value: string): string {
  return value.normalize("NFC").trim();
}

export function isContradictionHumanReviewerAgent(authorityAgent: string): boolean {
  return CONTRADICTION_HUMAN_REVIEWER.test(authorityAgent);
}

export function isResolvedState(state: string): boolean {
  return (
    state === "resolved_by_supersession" ||
    state === "resolved_by_scope_split" ||
    state === "resolved_by_retraction"
  );
}

export function leavesOpen(to: string): boolean {
  return isResolvedState(to) || to === "unresolved_archived";
}

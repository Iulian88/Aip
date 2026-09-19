import { verificationNfcTrim } from "./identifiers.js";
import type { Verification, VerificationScope } from "./types.js";

function idsEqual(a: readonly string[] | undefined, b: readonly string[] | undefined): boolean {
  const aa = [...(a ?? [])].map(verificationNfcTrim).sort();
  const bb = [...(b ?? [])].map(verificationNfcTrim).sort();
  if (aa.length !== bb.length) return false;
  return aa.every((v, i) => v === bb[i]);
}

function scopeEqual(a: VerificationScope, b: VerificationScope): boolean {
  return (
    verificationNfcTrim(a.domain_context) === verificationNfcTrim(b.domain_context) &&
    verificationNfcTrim(a.bounds) === verificationNfcTrim(b.bounds) &&
    verificationNfcTrim(a.exclusions) === verificationNfcTrim(b.exclusions)
  );
}

/** SCI-006 §15 — deterministic material change. */
export function isVerificationMaterialChange(
  prior: Verification,
  next: Verification,
): boolean {
  if (verificationNfcTrim(prior.summary) !== verificationNfcTrim(next.summary)) return true;
  if (verificationNfcTrim(prior.description) !== verificationNfcTrim(next.description)) {
    return true;
  }
  if (!scopeEqual(prior.scope, next.scope)) return true;
  if (verificationNfcTrim(prior.protocol_ref) !== verificationNfcTrim(next.protocol_ref)) {
    return true;
  }
  if (prior.verification_method !== next.verification_method) return true;
  if (
    verificationNfcTrim(prior.verification_context) !==
    verificationNfcTrim(next.verification_context)
  ) {
    return true;
  }
  if (
    verificationNfcTrim(prior.verification_rationale) !==
    verificationNfcTrim(next.verification_rationale)
  ) {
    return true;
  }

  const pp = prior.provenance;
  const np = next.provenance;
  if (
    pp.completeness !== np.completeness ||
    pp.recorded_at !== np.recorded_at ||
    verificationNfcTrim(pp.custody_agent) !== verificationNfcTrim(np.custody_agent) ||
    verificationNfcTrim(pp.method_summary) !== verificationNfcTrim(np.method_summary)
  ) {
    return true;
  }

  if (!idsEqual(prior.claim_refs, next.claim_refs)) return true;
  if (!idsEqual(prior.evidence_refs, next.evidence_refs)) return true;
  if (!idsEqual(prior.grade_refs, next.grade_refs)) return true;
  if (!idsEqual(prior.contradiction_refs, next.contradiction_refs)) return true;
  if (!idsEqual(prior.negative_result_refs, next.negative_result_refs)) return true;

  const pa = prior.artifact_ref ? verificationNfcTrim(prior.artifact_ref) : "";
  const na = next.artifact_ref ? verificationNfcTrim(next.artifact_ref) : "";
  if (pa !== na) return true;

  return false;
}

export class VerificationMaterialChangeEvaluator {
  isMaterialChange(prior: Verification, next: Verification): boolean {
    return isVerificationMaterialChange(prior, next);
  }
}

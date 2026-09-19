import { negativeResultNfcTrim } from "./identifiers.js";
import type { NegativeResult, NegativeResultScope } from "./types.js";

function idsEqual(a: readonly string[] | undefined, b: readonly string[] | undefined): boolean {
  const aa = [...(a ?? [])].map(negativeResultNfcTrim).sort();
  const bb = [...(b ?? [])].map(negativeResultNfcTrim).sort();
  if (aa.length !== bb.length) return false;
  return aa.every((v, i) => v === bb[i]);
}

function scopeEqual(a: NegativeResultScope, b: NegativeResultScope): boolean {
  return (
    negativeResultNfcTrim(a.domain_context) === negativeResultNfcTrim(b.domain_context) &&
    negativeResultNfcTrim(a.bounds) === negativeResultNfcTrim(b.bounds) &&
    negativeResultNfcTrim(a.exclusions) === negativeResultNfcTrim(b.exclusions)
  );
}

/** SCI-005 §14 — deterministic material change. */
export function isNegativeResultMaterialChange(
  prior: NegativeResult,
  next: NegativeResult,
): boolean {
  if (negativeResultNfcTrim(prior.summary) !== negativeResultNfcTrim(next.summary)) {
    return true;
  }
  if (negativeResultNfcTrim(prior.description) !== negativeResultNfcTrim(next.description)) {
    return true;
  }
  if (
    negativeResultNfcTrim(prior.expected_observation) !==
    negativeResultNfcTrim(next.expected_observation)
  ) {
    return true;
  }
  if (
    negativeResultNfcTrim(prior.observed_absence) !==
    negativeResultNfcTrim(next.observed_absence)
  ) {
    return true;
  }
  if (!scopeEqual(prior.scope, next.scope)) return true;
  if (negativeResultNfcTrim(prior.protocol_ref) !== negativeResultNfcTrim(next.protocol_ref)) {
    return true;
  }
  if (
    negativeResultNfcTrim(prior.sensitivity_context) !==
    negativeResultNfcTrim(next.sensitivity_context)
  ) {
    return true;
  }

  const pp = prior.provenance;
  const np = next.provenance;
  if (
    pp.completeness !== np.completeness ||
    pp.recorded_at !== np.recorded_at ||
    negativeResultNfcTrim(pp.custody_agent) !== negativeResultNfcTrim(np.custody_agent) ||
    negativeResultNfcTrim(pp.method_summary) !== negativeResultNfcTrim(np.method_summary)
  ) {
    return true;
  }

  if (!idsEqual(prior.claim_refs, next.claim_refs)) return true;
  if (!idsEqual(prior.evidence_refs, next.evidence_refs)) return true;
  if (!idsEqual(prior.contradiction_refs, next.contradiction_refs)) return true;
  if (!idsEqual(prior.verification_refs, next.verification_refs)) return true;

  return false;
}

export class NegativeResultMaterialChangeEvaluator {
  isMaterialChange(prior: NegativeResult, next: NegativeResult): boolean {
    return isNegativeResultMaterialChange(prior, next);
  }
}

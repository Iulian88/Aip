import { contradictionNfcTrim } from "./identifiers.js";
import type { Contradiction } from "./types.js";

function idsEqual(a: readonly string[] | undefined, b: readonly string[] | undefined): boolean {
  const aa = [...(a ?? [])].map(contradictionNfcTrim).sort();
  const bb = [...(b ?? [])].map(contradictionNfcTrim).sort();
  if (aa.length !== bb.length) return false;
  return aa.every((v, i) => v === bb[i]);
}

/** SCI-004 §13 — deterministic material change. */
export function isContradictionMaterialChange(
  prior: Contradiction,
  next: Contradiction,
): boolean {
  if (contradictionNfcTrim(prior.summary) !== contradictionNfcTrim(next.summary)) {
    return true;
  }
  if (
    contradictionNfcTrim(prior.overlap_statement) !==
    contradictionNfcTrim(next.overlap_statement)
  ) {
    return true;
  }
  if (
    contradictionNfcTrim(prior.incompatibility_statement) !==
    contradictionNfcTrim(next.incompatibility_statement)
  ) {
    return true;
  }
  if (!idsEqual(prior.involved_claims, next.involved_claims)) return true;
  if (!idsEqual(prior.evidence_refs, next.evidence_refs)) return true;

  const pp = prior.provenance;
  const np = next.provenance;
  if (
    pp.completeness !== np.completeness ||
    pp.recorded_at !== np.recorded_at ||
    contradictionNfcTrim(pp.custody_agent) !== contradictionNfcTrim(np.custody_agent) ||
    contradictionNfcTrim(pp.method_summary) !== contradictionNfcTrim(np.method_summary)
  ) {
    return true;
  }

  const priorNote = prior.resolution_note
    ? contradictionNfcTrim(prior.resolution_note)
    : "";
  const nextNote = next.resolution_note
    ? contradictionNfcTrim(next.resolution_note)
    : "";
  if (priorNote.length > 0 && priorNote !== nextNote) {
    return true;
  }

  return false;
}

export class ContradictionMaterialChangeEvaluator {
  isMaterialChange(prior: Contradiction, next: Contradiction): boolean {
    return isContradictionMaterialChange(prior, next);
  }
}

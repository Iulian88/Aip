import { nfcTrim } from "./identifiers.js";
import type { Claim, ClaimScope } from "./types.js";

export function scopesEqual(a: ClaimScope, b: ClaimScope): boolean {
  return (
    nfcTrim(a.domain_context) === nfcTrim(b.domain_context) &&
    nfcTrim(a.bounds) === nfcTrim(b.bounds) &&
    nfcTrim(a.exclusions) === nfcTrim(b.exclusions)
  );
}

/** SCI-001 §12.8 — deterministic material change. */
export function isMaterialChange(
  prior: Pick<Claim, "proposition" | "scope">,
  next: Pick<Claim, "proposition" | "scope">,
): boolean {
  return (
    nfcTrim(prior.proposition) !== nfcTrim(next.proposition) ||
    !scopesEqual(prior.scope, next.scope)
  );
}

export class ClaimMaterialChangeEvaluator {
  isMaterialChange(
    prior: Pick<Claim, "proposition" | "scope">,
    next: Pick<Claim, "proposition" | "scope">,
  ): boolean {
    return isMaterialChange(prior, next);
  }
}

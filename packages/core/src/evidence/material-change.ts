import { evidenceNfcTrim } from "./identifiers.js";
import { EvidenceProvenanceValidator } from "./provenance-validator.js";
import { EvidenceSourceValidator } from "./source-validator.js";
import type { Evidence } from "./types.js";

export function isEvidenceMaterialChange(
  prior: Evidence,
  next: Evidence,
): boolean {
  const source = new EvidenceSourceValidator();
  const provenance = new EvidenceProvenanceValidator();
  if (evidenceNfcTrim(prior.summary) !== evidenceNfcTrim(next.summary)) return true;
  if (!source.equal(prior.source, next.source)) return true;
  if (!provenance.equal(prior.provenance, next.provenance)) return true;
  if (evidenceNfcTrim(prior.grade_ref) !== evidenceNfcTrim(next.grade_ref)) return true;

  const priorItemIds = prior.items.map((i) => i.item_id).sort().join(",");
  const nextItemIds = next.items.map((i) => i.item_id).sort().join(",");
  if (priorItemIds !== nextItemIds) return true;
  for (const p of prior.items) {
    const n = next.items.find((i) => i.item_id === p.item_id);
    if (!n || evidenceNfcTrim(p.content_summary) !== evidenceNfcTrim(n.content_summary)) return true;
  }

  const priorMembers = (prior.collection?.member_item_ids ?? []).slice().sort().join(",");
  const nextMembers = (next.collection?.member_item_ids ?? []).slice().sort().join(",");
  if (priorMembers !== nextMembers) return true;

  return false;
}

export class EvidenceMaterialChangeEvaluator {
  isMaterialChange(prior: Evidence, next: Evidence): boolean {
    return isEvidenceMaterialChange(prior, next);
  }
}

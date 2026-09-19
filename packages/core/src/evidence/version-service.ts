import { EvidenceValidationError } from "./errors.js";
import { isEvidenceMaterialChange } from "./material-change.js";
import { EvidenceValidator } from "./validator.js";
import { evidenceNfcTrim } from "./identifiers.js";
import type { Evidence, EvidenceCollection, EvidenceItem, EvidenceProvenance, EvidenceSource } from "./types.js";

function bumpPatch(version: string): string {
  const parts = version.split(".").map((p) => Number(p));
  return `${parts[0] ?? 0}.${parts[1] ?? 0}.${(parts[2] ?? 0) + 1}`;
}

export interface EvidenceContentUpdate {
  readonly summary: string;
  readonly source: EvidenceSource;
  readonly provenance: EvidenceProvenance;
  readonly items: readonly EvidenceItem[];
  readonly grade_ref: string;
  readonly collection?: EvidenceCollection;
}

/**
 * SCI-002 §14 — preserve history/state; bump version only (P-001 pattern).
 */
export class EvidenceVersionService {
  private readonly validator = new EvidenceValidator();

  applyMaterialUpdate(prior: Evidence, nextContent: EvidenceContentUpdate): Evidence {
    const candidate: Evidence = Object.freeze({
      ...prior,
      summary: evidenceNfcTrim(nextContent.summary),
      source: nextContent.source,
      provenance: nextContent.provenance,
      items: nextContent.items,
      grade_ref: evidenceNfcTrim(nextContent.grade_ref),
      ...(nextContent.collection ? { collection: nextContent.collection } : {}),
      evidence_version: bumpPatch(prior.evidence_version),
      record_transition_log: Object.freeze([...(prior.record_transition_log ?? [])]),
    });

    if (!isEvidenceMaterialChange(prior, candidate)) {
      throw new EvidenceValidationError(
        "F6",
        "No material change detected; refusing version bump",
      );
    }

    // After registered, material change on immutable tuple requires new version —
    // Standing/record_state preserved (no wipe).
    this.validator.validate(candidate);
    if (prior.record_state === "registered") {
      // new version of registered content: SCI allows new version; content may stay registered
      // with prior ERTE history — OK
    }
    return candidate;
  }

  assertNoInPlaceOverwrite(prior: Evidence, candidate: Evidence): void {
    if (prior.evidence_id !== candidate.evidence_id) {
      throw new EvidenceValidationError("F_ID_STABLE", "evidence_id must remain stable");
    }
    if (
      prior.record_state === "registered" &&
      prior.evidence_version === candidate.evidence_version &&
      isEvidenceMaterialChange(prior, candidate)
    ) {
      throw new EvidenceValidationError(
        "F6",
        "In-place material overwrite of registered evidence_version is non-conformant",
      );
    }
  }
}

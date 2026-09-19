import { ContradictionValidationError } from "./errors.js";
import { isContradictionMaterialChange } from "./material-change.js";
import { ContradictionValidator } from "./validator.js";
import { contradictionNfcTrim } from "./identifiers.js";
import type { Contradiction, ContradictionProvenance } from "./types.js";

function bumpPatch(version: string): string {
  const parts = version.split(".").map((p) => Number(p));
  return `${parts[0] ?? 0}.${parts[1] ?? 0}.${(parts[2] ?? 0) + 1}`;
}

export interface ContradictionContentUpdate {
  readonly summary: string;
  readonly involved_claims: readonly string[];
  readonly overlap_statement: string;
  readonly incompatibility_statement: string;
  readonly provenance: ContradictionProvenance;
  readonly evidence_refs?: readonly string[];
  readonly resolution_note?: string;
}

export class ContradictionVersionService {
  private readonly validator = new ContradictionValidator();

  applyMaterialUpdate(
    prior: Contradiction,
    nextContent: ContradictionContentUpdate,
  ): Contradiction {
    const candidate: Contradiction = Object.freeze({
      ...prior,
      summary: contradictionNfcTrim(nextContent.summary),
      involved_claims: Object.freeze([...nextContent.involved_claims]),
      overlap_statement: contradictionNfcTrim(nextContent.overlap_statement),
      incompatibility_statement: contradictionNfcTrim(
        nextContent.incompatibility_statement,
      ),
      provenance: nextContent.provenance,
      ...(nextContent.evidence_refs
        ? { evidence_refs: Object.freeze([...nextContent.evidence_refs]) }
        : {}),
      ...(nextContent.resolution_note !== undefined
        ? { resolution_note: contradictionNfcTrim(nextContent.resolution_note) }
        : prior.resolution_note
          ? { resolution_note: prior.resolution_note }
          : {}),
      contradiction_version: bumpPatch(prior.contradiction_version),
      record_transition_log: Object.freeze([...(prior.record_transition_log ?? [])]),
    });

    if (!isContradictionMaterialChange(prior, candidate)) {
      throw new ContradictionValidationError(
        "F8",
        "No material change detected; refusing version bump",
      );
    }

    this.validator.validate(candidate);
    return candidate;
  }

  assertNoInPlaceOverwrite(prior: Contradiction, candidate: Contradiction): void {
    if (prior.contradiction_id !== candidate.contradiction_id) {
      throw new ContradictionValidationError(
        "F_ID_STABLE",
        "contradiction_id must remain stable",
      );
    }
    if (
      prior.contradiction_version === candidate.contradiction_version &&
      isContradictionMaterialChange(prior, candidate)
    ) {
      throw new ContradictionValidationError(
        "F8",
        "In-place material overwrite of contradiction_version is non-conformant",
      );
    }
  }
}

import { evidenceNfcTrim, EVIDENCE_UTC_SECOND } from "./identifiers.js";
import { EvidenceValidationError } from "./errors.js";
import {
  PROVENANCE_COMPLETENESS,
  type EvidenceProvenance,
  type ProvenanceCompleteness,
} from "./types.js";

export class EvidenceProvenanceValidator {
  validate(provenance: unknown): EvidenceProvenance {
    if (!provenance || typeof provenance !== "object") {
      throw new EvidenceValidationError("F3", "provenance missing or not an object");
    }
    const p = provenance as Record<string, unknown>;
    if (typeof p.completeness !== "string") {
      throw new EvidenceValidationError("F3", "provenance.completeness missing");
    }
    if (p.completeness === "implied") {
      throw new EvidenceValidationError("F3", "provenance completeness implied is forbidden");
    }
    if (!(PROVENANCE_COMPLETENESS as readonly string[]).includes(p.completeness)) {
      throw new EvidenceValidationError(
        "F3",
        `provenance.completeness invalid: ${p.completeness}`,
      );
    }
    if (typeof p.obtained_at !== "string" || !EVIDENCE_UTC_SECOND.test(p.obtained_at)) {
      throw new EvidenceValidationError("F3", "provenance.obtained_at must be UTC second");
    }
    if (typeof p.transform_summary !== "string") {
      throw new EvidenceValidationError("F3", "provenance.transform_summary missing");
    }
    const transform = evidenceNfcTrim(p.transform_summary);
    if (transform.length < 1) {
      throw new EvidenceValidationError("F3", "provenance.transform_summary empty");
    }
    if (typeof p.custody_agent !== "string" || evidenceNfcTrim(p.custody_agent).length < 1) {
      throw new EvidenceValidationError("F3", "provenance.custody_agent empty");
    }
    return Object.freeze({
      completeness: p.completeness as ProvenanceCompleteness,
      obtained_at: p.obtained_at,
      transform_summary: transform,
      custody_agent: evidenceNfcTrim(p.custody_agent),
      ...(typeof p.protocol_ref === "string" && evidenceNfcTrim(p.protocol_ref).length > 0
        ? { protocol_ref: evidenceNfcTrim(p.protocol_ref) }
        : {}),
      ...(typeof p.dataset_ref === "string" && evidenceNfcTrim(p.dataset_ref).length > 0
        ? { dataset_ref: evidenceNfcTrim(p.dataset_ref) }
        : {}),
      ...(typeof p.transform_artifact_ref === "string" &&
      evidenceNfcTrim(p.transform_artifact_ref).length > 0
        ? { transform_artifact_ref: evidenceNfcTrim(p.transform_artifact_ref) }
        : {}),
    });
  }

  equal(a: EvidenceProvenance, b: EvidenceProvenance): boolean {
    return (
      a.completeness === b.completeness &&
      a.obtained_at === b.obtained_at &&
      evidenceNfcTrim(a.transform_summary) === evidenceNfcTrim(b.transform_summary) &&
      evidenceNfcTrim(a.custody_agent) === evidenceNfcTrim(b.custody_agent)
    );
  }
}

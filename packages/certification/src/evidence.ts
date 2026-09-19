/**
 * CERT-001 — CertificationEvidence.
 * Wraps a frozen ConformanceReport; never re-runs fixtures or CONF evaluation.
 */
import type {
  ConformanceReport,
  ConformanceSummary,
  ConformanceVerdict,
} from "@sciros/conformance";

/**
 * Immutable bag of Conformance evidence ingested by CERT-001/002.
 * Engine evaluates this object only — no fixture / Core / processor access.
 */
export interface CertificationEvidence {
  readonly source: "ConformanceReport";
  readonly conformance_authority: string;
  readonly suite: string;
  readonly evidence_source: string;
  readonly report: ConformanceReport;
  readonly summary: ConformanceSummary;
  readonly overall: ConformanceVerdict;
}

/**
 * Ingest a ConformanceReport into CertificationEvidence.
 * Pure projection — does not execute tests or re-evaluate CONF dimensions.
 */
export function ingestConformanceReport(
  report: ConformanceReport,
): CertificationEvidence {
  return Object.freeze({
    source: "ConformanceReport",
    conformance_authority: report.authority,
    suite: report.suite,
    evidence_source: report.evidence_source,
    report,
    summary: report.summary,
    overall: report.summary.overall,
  });
}

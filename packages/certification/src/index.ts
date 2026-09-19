/**
 * @sciros/certification — CERT-001 / CERT-002 Certification Engine.
 * Consumes Conformance Reports only; does not execute fixtures or inspect Core.
 * Sole component authorized to issue formal certification decisions.
 */

export type {
  CertificationCertificate,
  CertificationCriterionId,
  CertificationCriterionResult,
  CertificationDecision,
  CertificationObservation,
  CertificationReport,
  CertificationSummary,
} from "./types.js";
export {
  CERTIFICATION_AUTHORITY,
  CERTIFICATION_CRITERIA,
  CERTIFICATION_DECISIONS,
  CERTIFICATION_SCOPE,
  CERTIFICATION_SCOPE_OPS,
  CERTIFICATION_SESSION_AUTHORITY,
} from "./types.js";
export type { CertificationEvidence } from "./evidence.js";
export { ingestConformanceReport } from "./evidence.js";

export { CertificationSession } from "./session.js";
export { CertificationEngine } from "./engine.js";

export {
  buildCertificate,
  buildCertificateId,
  certificationReportToJson,
  certificationScopeForProfile,
  renderCertificationReport,
} from "./report.js";
export {
  collectObservations,
  evaluateAllCriteria,
  evaluateAuthorityCoverage,
  evaluateDeterminismCriterion,
  evaluateDimensionCoverage,
  evaluateEvidenceCompleteness,
  evaluateReportIntegrity,
} from "./criteria.js";

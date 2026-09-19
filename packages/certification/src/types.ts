/**
 * CERT-001 / CERT-002 — Certification Engine model.
 * Consumes Conformance Reports only; does not execute fixtures or inspect Core.
 */

export const CERTIFICATION_AUTHORITY = "CERT-001" as const;
export const CERTIFICATION_SESSION_AUTHORITY = "CERT-002" as const;

/** Closed decision set (CERT-001). */
export const CERTIFICATION_DECISIONS = [
  "CERTIFIED",
  "CERTIFIED_WITH_OBSERVATIONS",
  "NOT_CERTIFIED",
  "INSUFFICIENT_EVIDENCE",
] as const;
export type CertificationDecision = (typeof CERTIFICATION_DECISIONS)[number];

/** Certification criteria evaluated from ConformanceReport evidence. */
export const CERTIFICATION_CRITERIA = [
  "authority_coverage",
  "dimension_coverage",
  "evidence_completeness",
  "determinism",
  "report_integrity",
] as const;
export type CertificationCriterionId = (typeof CERTIFICATION_CRITERIA)[number];

/**
 * Scope of a SciROS Reference Implementation certification (SCI profile).
 * Frozen baseline — do not expand globally for OPS.
 * OPS certificates use certificationScopeForProfile(PROFILE_OPS).
 */
export const CERTIFICATION_SCOPE = Object.freeze([
  "SCI-000",
  "SCI-001",
  "SCI-002",
  "SCI-003",
  "SCI-004",
  "SCI-005",
  "SCI-006",
  "ENC-001",
  "SER-001",
  "SER-JSON-001",
  "RPR-001",
  "ADR-0006",
  "CONF-001",
] as const);

/**
 * OPS certificate scope = SCI CERTIFICATION_SCOPE ∪ { OPS-001 }.
 * Does not mutate CERTIFICATION_SCOPE. Does not include PERSIST-001.
 */
export const CERTIFICATION_SCOPE_OPS = Object.freeze([
  ...CERTIFICATION_SCOPE,
  "OPS-001",
] as const);
/** One observation derived from Conformance evidence. */
export interface CertificationObservation {
  readonly criterion_id: CertificationCriterionId | "overall";
  readonly severity: "info" | "observation" | "blocking";
  readonly detail: string;
}

/** One criterion evaluation row. */
export interface CertificationCriterionResult {
  readonly criterion_id: CertificationCriterionId;
  readonly passed: boolean;
  readonly notes: readonly string[];
}

/** Formal certificate artifact (CERT-001). */
export interface CertificationCertificate {
  readonly certificate_id: string;
  readonly decision: CertificationDecision;
  readonly authority: typeof CERTIFICATION_AUTHORITY;
  readonly session_authority: typeof CERTIFICATION_SESSION_AUTHORITY;
  readonly scope: readonly string[];
  readonly authority_coverage: readonly string[];
  readonly authorities_compliant: number;
  readonly authorities_required: number;
  readonly evidence_summary: string;
  readonly conformance_suite: string;
  readonly conformance_overall: string;
  readonly dimensions_compliant: number;
  readonly dimensions_evaluated: number;
}

/** Aggregate summary (no wall-clock). */
export interface CertificationSummary {
  readonly decision: CertificationDecision;
  readonly criteria_evaluated: number;
  readonly criteria_passed: number;
  readonly criteria_failed: number;
  readonly observations: number;
  readonly blocking_observations: number;
  readonly authorities_in_scope: number;
  readonly authorities_covered: number;
}

/** Full certification report — formal decision packaging (CERT-001). */
export interface CertificationReport {
  readonly authority: typeof CERTIFICATION_AUTHORITY;
  readonly session_authority: typeof CERTIFICATION_SESSION_AUTHORITY;
  readonly session_id: string;
  readonly decision: CertificationDecision;
  readonly summary: CertificationSummary;
  readonly criteria: readonly CertificationCriterionResult[];
  readonly observations: readonly CertificationObservation[];
  readonly certificate: CertificationCertificate;
}

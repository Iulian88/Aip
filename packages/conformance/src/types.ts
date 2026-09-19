/**
 * CONF-001 — Conformance Engine model.
 * Evaluates executable Reference Test evidence; does not execute fixtures.
 */

export const CONFORMANCE_AUTHORITY = "CONF-001" as const;

/** Closed verdict set (CONF-001). */
export const CONFORMANCE_VERDICTS = [
  "COMPLIANT",
  "PARTIALLY_COMPLIANT",
  "NON_COMPLIANT",
  "NOT_EVALUATED",
] as const;
export type ConformanceVerdict = (typeof CONFORMANCE_VERDICTS)[number];

/** Closed dimension set (CONF-001). */
export const CONFORMANCE_DIMENSIONS = [
  "authority_compliance",
  "fixture_completeness",
  "scenario_completeness",
  "determinism",
  "round_trip_integrity",
  "stage_ownership",
  "architecture_boundaries",
] as const;
export type ConformanceDimensionId = (typeof CONFORMANCE_DIMENSIONS)[number];

/**
 * Authorities CONF-001 SHALL verify from Reference Test evidence.
 * EXEC-003 may appear in REF-TEST reports but is not a CONF required pin.
 */
export const REQUIRED_AUTHORITIES = Object.freeze([
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
] as const);

/** Fixture-family prefixes required for completeness (REF-TEST-002 corpus). */
export const REQUIRED_FIXTURE_PREFIXES = Object.freeze([
  "REF-CLAIM-",
  "REF-EVID-",
  "REF-GRADE-",
  "REF-CONTRA-",
  "REF-NEGRES-",
  "REF-VERIF-",
  "REF-CANON-",
  "REF-SER-",
  "REF-RT-",
  "REF-PROC-",
  "REF-AUTH-",
] as const);

/** One observation derived from a ReferenceResult / assertion. */
export interface ConformanceObservation {
  readonly fixture_id: string;
  readonly scenario: string;
  readonly authorities: readonly string[];
  readonly status: string;
  readonly matched_expected: boolean;
  readonly assertion_count: number;
  readonly failing_assertions: readonly string[];
}

/** One evaluated dimension. */
export interface ConformanceDimension {
  readonly dimension_id: ConformanceDimensionId;
  readonly verdict: ConformanceVerdict;
  readonly notes: readonly string[];
  readonly evidence_refs: readonly string[];
}

/** Per-authority verdict row. */
export interface ConformanceAuthorityVerdict {
  readonly authority: string;
  readonly verdict: ConformanceVerdict;
  readonly pass: number;
  readonly total: number;
  readonly fail: number;
  readonly error: number;
}

/** Aggregate summary (no wall-clock). */
export interface ConformanceSummary {
  readonly overall: ConformanceVerdict;
  readonly dimensions_evaluated: number;
  readonly dimensions_compliant: number;
  readonly dimensions_partial: number;
  readonly dimensions_non_compliant: number;
  readonly dimensions_not_evaluated: number;
  readonly authorities_required: number;
  readonly authorities_compliant: number;
  readonly fixtures_observed: number;
  readonly fixtures_pass: number;
  readonly fixtures_fail: number;
  readonly fixtures_error: number;
}

/** Full CONFORMANCE report — sole CERT input surface. */
export interface ConformanceReport {
  readonly authority: typeof CONFORMANCE_AUTHORITY;
  /** Explicit profile selected before evaluation (SPEC-017). */
  readonly profile_id: string;
  readonly suite: string;
  readonly evidence_source: string;
  readonly dimensions: readonly ConformanceDimension[];
  readonly authorities: readonly ConformanceAuthorityVerdict[];
  readonly summary: ConformanceSummary;
  readonly observations: readonly ConformanceObservation[];
}

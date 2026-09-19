/**
 * CERT-001 — certification criteria evaluators.
 * Pure functions over CertificationEvidence / ConformanceReport fields only.
 * Authority coverage binds to ConformanceReport.profile_id (SPEC-017).
 */
import {
  CONFORMANCE_AUTHORITY,
  CONFORMANCE_DIMENSIONS,
  resolveConformanceProfile,
} from "@sciros/conformance";
import type { CertificationEvidence } from "./evidence.js";
import type {
  CertificationCriterionResult,
  CertificationObservation,
} from "./types.js";

function criterion(
  id: CertificationCriterionResult["criterion_id"],
  passed: boolean,
  notes: string[],
): CertificationCriterionResult {
  return Object.freeze({
    criterion_id: id,
    passed,
    notes: Object.freeze(notes),
  });
}

/** Authority coverage — every profile-required authority present and COMPLIANT. */
export function evaluateAuthorityCoverage(
  evidence: CertificationEvidence,
): CertificationCriterionResult {
  const notes: string[] = [];
  const byId = new Map(evidence.report.authorities.map((a) => [a.authority, a]));
  let fail = 0;
  const profile = resolveConformanceProfile(evidence.report.profile_id);
  const required = profile.required_authorities;

  for (const authority of required) {
    const row = byId.get(authority);
    if (!row) {
      fail += 1;
      notes.push(`missing authority row: ${authority}`);
      continue;
    }
    if (row.verdict !== "COMPLIANT") {
      fail += 1;
      notes.push(`${authority} verdict=${row.verdict}`);
    }
  }

  if (
    evidence.summary.authorities_compliant < evidence.summary.authorities_required
  ) {
    notes.push(
      `summary authorities_compliant ${evidence.summary.authorities_compliant} < required ${evidence.summary.authorities_required}`,
    );
    fail += 1;
  }

  if (evidence.report.profile_id !== profile.profile_id) {
    fail += 1;
    notes.push(
      `profile_id mismatch: report=${evidence.report.profile_id} resolved=${profile.profile_id}`,
    );
  }

  return criterion("authority_coverage", fail === 0, notes);
}

/** Dimension coverage — all seven CONF dimensions present and COMPLIANT. */
export function evaluateDimensionCoverage(
  evidence: CertificationEvidence,
): CertificationCriterionResult {
  const notes: string[] = [];
  const byId = new Map(evidence.report.dimensions.map((d) => [d.dimension_id, d]));
  let fail = 0;

  for (const dim of CONFORMANCE_DIMENSIONS) {
    const row = byId.get(dim);
    if (!row) {
      fail += 1;
      notes.push(`missing dimension: ${dim}`);
      continue;
    }
    if (row.verdict === "NON_COMPLIANT") {
      fail += 1;
      notes.push(`${dim} NON_COMPLIANT`);
    } else if (row.verdict === "NOT_EVALUATED") {
      fail += 1;
      notes.push(`${dim} NOT_EVALUATED`);
    } else if (row.verdict === "PARTIALLY_COMPLIANT") {
      notes.push(`${dim} PARTIALLY_COMPLIANT`);
    }
  }

  if (evidence.report.dimensions.length !== CONFORMANCE_DIMENSIONS.length) {
    fail += 1;
    notes.push(
      `dimension count ${evidence.report.dimensions.length} ≠ ${CONFORMANCE_DIMENSIONS.length}`,
    );
  }

  return criterion("dimension_coverage", fail === 0, notes);
}

/** Evidence completeness — observations, fixtures, and summary consistency. */
export function evaluateEvidenceCompleteness(
  evidence: CertificationEvidence,
): CertificationCriterionResult {
  const notes: string[] = [];
  let fail = 0;
  const s = evidence.summary;

  if (s.fixtures_observed < 1) {
    fail += 1;
    notes.push("no fixtures observed in ConformanceSummary");
  }
  if (evidence.report.observations.length < 1) {
    fail += 1;
    notes.push("no ConformanceObservations");
  }
  if (s.fixtures_observed !== evidence.report.observations.length) {
    fail += 1;
    notes.push("fixtures_observed ≠ observation count");
  }
  if (s.fixtures_fail > 0 || s.fixtures_error > 0) {
    fail += 1;
    notes.push(
      `fixture failures present (fail=${s.fixtures_fail} error=${s.fixtures_error})`,
    );
  }
  if (s.overall === "NOT_EVALUATED") {
    fail += 1;
    notes.push("conformance overall NOT_EVALUATED");
  }

  return criterion("evidence_completeness", fail === 0, notes);
}

/**
 * Determinism — CONF determinism dimension COMPLIANT; overall not ERROR-laden.
 */
export function evaluateDeterminismCriterion(
  evidence: CertificationEvidence,
): CertificationCriterionResult {
  const notes: string[] = [];
  let fail = 0;
  const det = evidence.report.dimensions.find((d) => d.dimension_id === "determinism");

  if (!det) {
    fail += 1;
    notes.push("determinism dimension missing");
  } else if (det.verdict !== "COMPLIANT") {
    fail += 1;
    notes.push(`determinism verdict=${det.verdict}`);
  }

  if (evidence.summary.fixtures_error > 0) {
    fail += 1;
    notes.push(`fixtures_error=${evidence.summary.fixtures_error}`);
  }

  return criterion("determinism", fail === 0, notes);
}

/** Report integrity — CONF-001 pin, evidence source present, summary coherent. */
export function evaluateReportIntegrity(
  evidence: CertificationEvidence,
): CertificationCriterionResult {
  const notes: string[] = [];
  let fail = 0;

  if (evidence.conformance_authority !== CONFORMANCE_AUTHORITY) {
    fail += 1;
    notes.push(
      `expected authority ${CONFORMANCE_AUTHORITY}, got ${evidence.conformance_authority}`,
    );
  }
  if (evidence.source !== "ConformanceReport") {
    fail += 1;
    notes.push(`unexpected source ${evidence.source}`);
  }
  if (!evidence.evidence_source || evidence.evidence_source.length < 1) {
    fail += 1;
    notes.push("evidence_source empty");
  }
  if (!evidence.suite || evidence.suite.length < 1) {
    fail += 1;
    notes.push("suite empty");
  }
  if (evidence.overall !== evidence.summary.overall) {
    fail += 1;
    notes.push("overall mismatch between evidence and summary");
  }
  if (evidence.summary.dimensions_non_compliant > 0) {
    fail += 1;
    notes.push(
      `dimensions_non_compliant=${evidence.summary.dimensions_non_compliant}`,
    );
  }
  if (
    typeof evidence.report.profile_id !== "string" ||
    evidence.report.profile_id.length < 1
  ) {
    fail += 1;
    notes.push("profile_id missing on ConformanceReport");
  }

  return criterion("report_integrity", fail === 0, notes);
}

export function evaluateAllCriteria(
  evidence: CertificationEvidence,
): readonly CertificationCriterionResult[] {
  return Object.freeze([
    evaluateAuthorityCoverage(evidence),
    evaluateDimensionCoverage(evidence),
    evaluateEvidenceCompleteness(evidence),
    evaluateDeterminismCriterion(evidence),
    evaluateReportIntegrity(evidence),
  ]);
}

/** Collect non-blocking notes from PARTIAL dimensions and criterion notes. */
export function collectObservations(
  evidence: CertificationEvidence,
  criteria: readonly CertificationCriterionResult[],
): readonly CertificationObservation[] {
  const out: CertificationObservation[] = [];

  for (const c of criteria) {
    for (const note of c.notes) {
      out.push(
        Object.freeze({
          criterion_id: c.criterion_id,
          severity: c.passed ? ("observation" as const) : ("blocking" as const),
          detail: note,
        }),
      );
    }
  }

  for (const d of evidence.report.dimensions) {
    if (d.verdict === "PARTIALLY_COMPLIANT") {
      out.push(
        Object.freeze({
          criterion_id: "overall" as const,
          severity: "observation" as const,
          detail: `dimension ${d.dimension_id} PARTIALLY_COMPLIANT`,
        }),
      );
    }
    for (const n of d.notes) {
      if (d.verdict === "COMPLIANT") continue;
      out.push(
        Object.freeze({
          criterion_id: "overall" as const,
          severity:
            d.verdict === "NON_COMPLIANT" || d.verdict === "NOT_EVALUATED"
              ? ("blocking" as const)
              : ("observation" as const),
          detail: `${d.dimension_id}: ${n}`,
        }),
      );
    }
  }

  if (
    evidence.overall === "COMPLIANT" &&
    out.filter((o) => o.severity === "blocking").length === 0
  ) {
    out.push(
      Object.freeze({
        criterion_id: "overall" as const,
        severity: "info" as const,
        detail: "Conformance overall COMPLIANT",
      }),
    );
  }

  return Object.freeze(out);
}

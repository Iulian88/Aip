/**
 * CONF-001 — ConformanceEvidence.
 * Wraps a frozen ReferenceReport; never re-runs fixtures.
 */
import type {
  ReferenceAssertion,
  ReferenceComplianceEntry,
  ReferenceReport,
  ReferenceResult,
} from "@sciros/reference-tests";
import type { ConformanceObservation } from "./types.js";

/**
 * Immutable bag of Reference Test evidence ingested by CONF-001.
 * Engine evaluates this object only — no fixture execution.
 */
export interface ConformanceEvidence {
  readonly source: "ReferenceReport";
  readonly suite: string;
  readonly engine: string;
  readonly report: ReferenceReport;
  readonly results: readonly ReferenceResult[];
  readonly assertions: readonly ReferenceAssertion[];
  readonly compliance: readonly ReferenceComplianceEntry[];
  readonly observations: readonly ConformanceObservation[];
}

function observationFromResult(r: ReferenceResult): ConformanceObservation {
  const failing = r.assertions
    .filter((a) => a.status === "FAIL" || a.status === "ERROR")
    .map((a) => a.label);
  return Object.freeze({
    fixture_id: r.fixture_id,
    scenario: r.scenario,
    authorities: Object.freeze([...r.authorities]),
    status: r.status,
    matched_expected: r.status === "PASS" || r.status === "WARNING" || r.status === "SKIPPED",
    assertion_count: r.assertions.length,
    failing_assertions: Object.freeze(failing),
  });
}

/**
 * Ingest a ReferenceReport into ConformanceEvidence.
 * Pure projection — does not execute tests.
 */
export function ingestReferenceReport(report: ReferenceReport): ConformanceEvidence {
  const results = Object.freeze([...report.fixtures]);
  const assertions = Object.freeze(results.flatMap((r) => [...r.assertions]));
  const observations = Object.freeze(results.map(observationFromResult));
  return Object.freeze({
    source: "ReferenceReport",
    suite: report.suite,
    engine: report.engine,
    report,
    results,
    assertions,
    compliance: Object.freeze([...report.compliance]),
    observations,
  });
}

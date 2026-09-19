/**
 * CERT-001 / CERT-002 — CertificationEngine.
 * Consumes ConformanceReport evidence; does not execute Reference fixtures.
 */
import type { ConformanceReport } from "@sciros/conformance";
import {
  collectObservations,
  evaluateAllCriteria,
} from "./criteria.js";
import type { CertificationEvidence } from "./evidence.js";
import {
  buildCertificate,
  certificationReportToJson,
  certificationScopeForProfile,
  renderCertificationReport,
} from "./report.js";
import { CertificationSession } from "./session.js";
import {
  CERTIFICATION_AUTHORITY,
  CERTIFICATION_SESSION_AUTHORITY,
  type CertificationDecision,
  type CertificationReport,
  type CertificationSummary,
} from "./types.js";

function decide(
  evidence: CertificationEvidence,
  criteria: readonly { passed: boolean; notes: readonly string[] }[],
  observations: readonly { severity: string }[],
): CertificationDecision {
  // Insufficient structural evidence
  if (
    evidence.conformance_authority !== "CONF-001" ||
    evidence.source !== "ConformanceReport" ||
    evidence.report.dimensions.length === 0 ||
    evidence.report.authorities.length === 0
  ) {
    return "INSUFFICIENT_EVIDENCE";
  }

  if (evidence.overall === "NOT_EVALUATED") {
    return "INSUFFICIENT_EVIDENCE";
  }

  const allPassed = criteria.every((c) => c.passed);
  const anyFailed = criteria.some((c) => !c.passed);
  const blocking = observations.filter((o) => o.severity === "blocking").length;
  const soft = observations.filter((o) => o.severity === "observation").length;

  if (evidence.overall === "NON_COMPLIANT" || (anyFailed && blocking > 0)) {
    return "NOT_CERTIFIED";
  }

  if (!allPassed) {
    return "NOT_CERTIFIED";
  }

  if (evidence.overall === "PARTIALLY_COMPLIANT" || soft > 0) {
    return "CERTIFIED_WITH_OBSERVATIONS";
  }

  if (evidence.overall === "COMPLIANT" && allPassed) {
    return "CERTIFIED";
  }

  return "NOT_CERTIFIED";
}

function buildSummary(
  decision: CertificationDecision,
  criteria: readonly { passed: boolean }[],
  observations: readonly { severity: string }[],
  evidence: CertificationEvidence,
): CertificationSummary {
  const passed = criteria.filter((c) => c.passed).length;
  return Object.freeze({
    decision,
    criteria_evaluated: criteria.length,
    criteria_passed: passed,
    criteria_failed: criteria.length - passed,
    observations: observations.length,
    blocking_observations: observations.filter((o) => o.severity === "blocking")
      .length,
    authorities_in_scope: certificationScopeForProfile(evidence.report.profile_id)
      .length,
    authorities_covered: evidence.summary.authorities_compliant,
  });
}
/**
 * Applies CERT-001 decision law to Conformance evidence.
 * CERT-002 session lifecycle hosted via CertificationSession.
 * SHALL NOT execute fixtures, inspect Core, or re-run CONF evaluation.
 */
export class CertificationEngine {
  /**
   * Certify a ConformanceReport under a deterministic session_id.
   */
  certify(sessionId: string, report: ConformanceReport): CertificationReport {
    const session = new CertificationSession();
    session.open(sessionId);
    const evidence = session.ingest(report);
    return this.certifyEvidence(session.requireSessionId(), evidence);
  }

  /** Certify a session that already holds ingested evidence. */
  certifySession(session: CertificationSession): CertificationReport {
    return this.certifyEvidence(session.requireSessionId(), session.requireEvidence());
  }

  certifyEvidence(
    sessionId: string,
    evidence: CertificationEvidence,
  ): CertificationReport {
    const criteria = evaluateAllCriteria(evidence);
    const observations = collectObservations(evidence, criteria);
    const decision = decide(evidence, criteria, observations);
    const summary = buildSummary(decision, criteria, observations, evidence);
    const certificate = buildCertificate(sessionId, evidence, decision);

    return Object.freeze({
      authority: CERTIFICATION_AUTHORITY,
      session_authority: CERTIFICATION_SESSION_AUTHORITY,
      session_id: sessionId,
      decision,
      summary,
      criteria,
      observations,
      certificate,
    });
  }

  certifyToJson(sessionId: string, report: ConformanceReport): string {
    return certificationReportToJson(this.certify(sessionId, report));
  }

  certifyToText(sessionId: string, report: ConformanceReport): string {
    return renderCertificationReport(this.certify(sessionId, report));
  }
}

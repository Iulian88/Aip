/**
 * CONF-001 — ConformanceEngine.
 * Consumes ReferenceReport evidence; does not execute Reference fixtures.
 * Profile selection is explicit; default is CONF-001@1.0.0 (SCI).
 */
import type { ReferenceReport } from "@sciros/reference-tests";
import {
  buildAuthorityVerdicts,
  evaluateAllDimensions,
} from "./dimensions.js";
import type { ConformanceEvidence } from "./evidence.js";
import {
  resolveConformanceProfile,
  type ConformanceProfile,
} from "./profiles.js";
import {
  conformanceReportToJson,
  renderConformanceReport,
} from "./report.js";
import { ConformanceSession } from "./session.js";
import {
  CONFORMANCE_AUTHORITY,
  type ConformanceReport,
  type ConformanceSummary,
  type ConformanceVerdict,
} from "./types.js";

function overallVerdict(
  dimensions: readonly { verdict: ConformanceVerdict }[],
): ConformanceVerdict {
  const counts = {
    COMPLIANT: 0,
    PARTIALLY_COMPLIANT: 0,
    NON_COMPLIANT: 0,
    NOT_EVALUATED: 0,
  };
  for (const d of dimensions) {
    counts[d.verdict] += 1;
  }
  if (counts.NON_COMPLIANT > 0) return "NON_COMPLIANT";
  if (counts.NOT_EVALUATED === dimensions.length) return "NOT_EVALUATED";
  if (counts.PARTIALLY_COMPLIANT > 0 || counts.NOT_EVALUATED > 0) {
    return "PARTIALLY_COMPLIANT";
  }
  return "COMPLIANT";
}

function buildSummary(
  evidence: ConformanceEvidence,
  dimensions: readonly { verdict: ConformanceVerdict }[],
  authorities: readonly { verdict: ConformanceVerdict }[],
  profile: ConformanceProfile,
): ConformanceSummary {
  const tally = { compliant: 0, partial: 0, non: 0, none: 0 };
  for (const d of dimensions) {
    if (d.verdict === "COMPLIANT") tally.compliant += 1;
    else if (d.verdict === "PARTIALLY_COMPLIANT") tally.partial += 1;
    else if (d.verdict === "NON_COMPLIANT") tally.non += 1;
    else tally.none += 1;
  }
  const authCompliant = authorities.filter((a) => a.verdict === "COMPLIANT").length;
  const s = evidence.report.summary;
  return Object.freeze({
    overall: overallVerdict(dimensions),
    dimensions_evaluated: dimensions.length,
    dimensions_compliant: tally.compliant,
    dimensions_partial: tally.partial,
    dimensions_non_compliant: tally.non,
    dimensions_not_evaluated: tally.none,
    authorities_required: profile.required_authorities.length,
    authorities_compliant: authCompliant,
    fixtures_observed: s.total,
    fixtures_pass: s.pass,
    fixtures_fail: s.fail,
    fixtures_error: s.error,
  });
}

/**
 * Applies CONF-001 pass law to already-generated Reference Test evidence.
 * SHALL NOT execute fixtures, edit expectations, or use performance criteria.
 */
export class ConformanceEngine {
  /**
   * Evaluate a ReferenceReport into a ConformanceReport.
   * `profileId` defaults to CONF-001@1.0.0 when omitted.
   * Never inferred from suite name or environment.
   */
  evaluate(report: ReferenceReport, profileId?: string): ConformanceReport {
    const session = new ConformanceSession();
    const evidence = session.ingest(report);
    return this.evaluateEvidence(evidence, profileId);
  }

  /** Evaluate a session that already holds ingested evidence. */
  evaluateSession(
    session: ConformanceSession,
    profileId?: string,
  ): ConformanceReport {
    return this.evaluateEvidence(session.requireEvidence(), profileId);
  }

  evaluateEvidence(
    evidence: ConformanceEvidence,
    profileId?: string,
  ): ConformanceReport {
    const profile = resolveConformanceProfile(profileId);
    const dimensions = evaluateAllDimensions(evidence, profile);
    const authorities = buildAuthorityVerdicts(evidence, profile);
    const summary = buildSummary(evidence, dimensions, authorities, profile);

    return Object.freeze({
      authority: CONFORMANCE_AUTHORITY,
      profile_id: profile.profile_id,
      suite: evidence.suite,
      evidence_source: `${evidence.engine}:${evidence.source}`,
      dimensions,
      authorities,
      summary,
      observations: evidence.observations,
    });
  }

  /** Convenience: evaluate + deterministic JSON. */
  evaluateToJson(report: ReferenceReport, profileId?: string): string {
    return conformanceReportToJson(this.evaluate(report, profileId));
  }

  /** Convenience: evaluate + human-readable text. */
  evaluateToText(report: ReferenceReport, profileId?: string): string {
    return renderConformanceReport(this.evaluate(report, profileId));
  }
}

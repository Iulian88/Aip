/**
 * CERT-001 — certificate + report renderers (deterministic, no wall-clock).
 * Certificate scope binds to ConformanceReport.profile_id (SPEC-017).
 */
import { PROFILE_OPS, PROFILE_SCI } from "@sciros/conformance";
import type { CertificationEvidence } from "./evidence.js";
import {
  CERTIFICATION_AUTHORITY,
  CERTIFICATION_SCOPE,
  CERTIFICATION_SCOPE_OPS,
  CERTIFICATION_SESSION_AUTHORITY,
  type CertificationCertificate,
  type CertificationDecision,
  type CertificationReport,
} from "./types.js";

/** Profile-bound certification scope — SCI default; OPS additive. */
export function certificationScopeForProfile(
  profileId: string,
): readonly string[] {
  if (profileId === PROFILE_OPS) return CERTIFICATION_SCOPE_OPS;
  if (profileId === PROFILE_SCI || profileId === undefined || profileId === "") {
    return CERTIFICATION_SCOPE;
  }
  // Unknown profile_id: do not invent scope; fall back to SCI (conservative).
  return CERTIFICATION_SCOPE;
}
function slug(value: string): string {
  return value
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

/**
 * Deterministic certificate identifier from session + suite + decision.
 * No randomness, no wall-clock.
 */
export function buildCertificateId(
  sessionId: string,
  suite: string,
  decision: CertificationDecision,
): string {
  return `cert:${slug(sessionId)}:${slug(suite)}:${decision.toLowerCase()}`;
}

export function buildCertificate(
  sessionId: string,
  evidence: CertificationEvidence,
  decision: CertificationDecision,
): CertificationCertificate {
  const covered = evidence.report.authorities
    .filter((a) => a.verdict === "COMPLIANT")
    .map((a) => a.authority)
    .sort();
  const scope = certificationScopeForProfile(evidence.report.profile_id);

  return Object.freeze({
    certificate_id: buildCertificateId(sessionId, evidence.suite, decision),
    decision,
    authority: CERTIFICATION_AUTHORITY,
    session_authority: CERTIFICATION_SESSION_AUTHORITY,
    scope,
    authority_coverage: Object.freeze(covered),
    authorities_compliant: evidence.summary.authorities_compliant,
    authorities_required: evidence.summary.authorities_required,
    evidence_summary: [
      `suite=${evidence.suite}`,
      `profile=${evidence.report.profile_id}`,
      `conformance=${evidence.overall}`,
      `fixtures=${evidence.summary.fixtures_observed}`,
      `pass=${evidence.summary.fixtures_pass}`,
      `dimensions=${evidence.summary.dimensions_compliant}/${evidence.summary.dimensions_evaluated}`,
      `source=${evidence.evidence_source}`,
    ].join("; "),
    conformance_suite: evidence.suite,
    conformance_overall: evidence.overall,
    dimensions_compliant: evidence.summary.dimensions_compliant,
    dimensions_evaluated: evidence.summary.dimensions_evaluated,
  });
}
function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj).sort()) {
    out[k] = sortKeys(obj[k]);
  }
  return out;
}

/** Deterministic JSON text (sorted keys, no timestamps). */
export function certificationReportToJson(report: CertificationReport): string {
  return JSON.stringify(sortKeys(report), null, 2);
}

/** Deterministic human-readable Certification Report. */
export function renderCertificationReport(report: CertificationReport): string {
  const lines: string[] = [];
  lines.push(
    `SciROS Certification — ${report.session_id} (${report.authority}/${report.session_authority})`,
  );
  lines.push(`DECISION ${report.decision}`);
  lines.push("");
  lines.push("CRITERIA");
  for (const c of report.criteria) {
    lines.push(
      `  ${(c.passed ? "PASS" : "FAIL").padEnd(6)} ${c.criterion_id}`,
    );
    for (const n of c.notes) {
      lines.push(`          - ${n}`);
    }
  }
  lines.push("");
  lines.push("OBSERVATIONS");
  if (report.observations.length === 0) {
    lines.push("  (none)");
  } else {
    for (const o of report.observations) {
      lines.push(`  ${o.severity.padEnd(12)} [${o.criterion_id}] ${o.detail}`);
    }
  }
  lines.push("");
  lines.push("CERTIFICATE");
  const cert = report.certificate;
  lines.push(`  id: ${cert.certificate_id}`);
  lines.push(`  decision: ${cert.decision}`);
  lines.push(`  scope: ${cert.scope.join(", ")}`);
  lines.push(
    `  authority_coverage: ${cert.authority_coverage.join(", ") || "(none)"}`,
  );
  lines.push(`  evidence: ${cert.evidence_summary}`);
  lines.push("");
  const s = report.summary;
  lines.push(
    `SUMMARY decision=${s.decision} criteria_passed=${s.criteria_passed}/${s.criteria_evaluated} observations=${s.observations} blocking=${s.blocking_observations}`,
  );
  return lines.join("\n");
}

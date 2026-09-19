/**
 * CONF-001 — Conformance report renderers (deterministic, no wall-clock).
 */
import type { ConformanceReport, ConformanceVerdict } from "./types.js";

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
export function conformanceReportToJson(report: ConformanceReport): string {
  return JSON.stringify(sortKeys(report), null, 2);
}

/** Deterministic human-readable Conformance Report. */
export function renderConformanceReport(report: ConformanceReport): string {
  const lines: string[] = [];
  lines.push(`SciROS Conformance — ${report.suite} (${report.authority})`);
  lines.push(`Profile: ${report.profile_id}`);
  lines.push(`Evidence source: ${report.evidence_source}`);
  lines.push("");
  lines.push("DIMENSIONS");
  for (const d of report.dimensions) {
    lines.push(`  ${d.verdict.padEnd(22)} ${d.dimension_id}`);
    for (const n of d.notes) {
      lines.push(`          - ${n}`);
    }
  }
  lines.push("");
  lines.push("AUTHORITY VERDICTS");
  for (const a of report.authorities) {
    lines.push(
      `  ${a.verdict.padEnd(22)} ${a.authority} (${a.pass}/${a.total} pass)`,
    );
  }
  lines.push("");
  const s = report.summary;
  lines.push(`OVERALL ${s.overall}`);
  lines.push(
    `SUMMARY dimensions=${s.dimensions_evaluated} compliant=${s.dimensions_compliant} partial=${s.dimensions_partial} non_compliant=${s.dimensions_non_compliant} not_evaluated=${s.dimensions_not_evaluated}`,
  );
  lines.push(
    `AUTHORITIES required=${s.authorities_required} compliant=${s.authorities_compliant}`,
  );
  lines.push(
    `FIXTURES observed=${s.fixtures_observed} pass=${s.fixtures_pass} fail=${s.fixtures_fail} error=${s.fixtures_error}`,
  );
  return lines.join("\n");
}

export function isFullyCompliant(verdict: ConformanceVerdict): boolean {
  return verdict === "COMPLIANT";
}

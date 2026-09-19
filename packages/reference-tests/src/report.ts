import {
  REFERENCE_SCENARIOS,
  REFERENCE_TEST_ENGINE_AUTHORITY,
  type ReferenceResult,
  type ReferenceScenario,
  type ReferenceStatus,
} from "./types.js";

/** Status tallies shared by every report section. */
export interface ReferenceTally {
  readonly total: number;
  readonly pass: number;
  readonly fail: number;
  readonly error: number;
  readonly warning: number;
  readonly skipped: number;
}

export interface ReferenceScenarioSummary extends ReferenceTally {
  readonly scenario: ReferenceScenario;
}

export interface ReferenceComplianceEntry extends ReferenceTally {
  readonly authority: string;
  /** true when no FAIL / ERROR fixture evidences this authority. */
  readonly compliant: boolean;
}

/** Deterministic run report (no wall-clock material). */
export interface ReferenceReport {
  readonly engine: typeof REFERENCE_TEST_ENGINE_AUTHORITY;
  readonly suite: string;
  /** Fixture report — one entry per fixture, stable fixture_id order. */
  readonly fixtures: readonly ReferenceResult[];
  /** Scenario report — fixed REF-TEST-002 scenario order. */
  readonly scenarios: readonly ReferenceScenarioSummary[];
  /** Summary report. */
  readonly summary: ReferenceTally;
  /** Compliance summary — per frozen authority, sorted by id. */
  readonly compliance: readonly ReferenceComplianceEntry[];
}

function tally(statuses: readonly ReferenceStatus[]): ReferenceTally {
  const t = { total: statuses.length, pass: 0, fail: 0, error: 0, warning: 0, skipped: 0 };
  for (const s of statuses) {
    if (s === "PASS") t.pass += 1;
    else if (s === "FAIL") t.fail += 1;
    else if (s === "ERROR") t.error += 1;
    else if (s === "WARNING") t.warning += 1;
    else t.skipped += 1;
  }
  return Object.freeze(t);
}

/** Builds the four REF-TEST-003 report sections from fixture results. */
export function buildReferenceReport(
  suite: string,
  results: readonly ReferenceResult[],
): ReferenceReport {
  const fixtures = Object.freeze(
    [...results].sort((a, b) => (a.fixture_id < b.fixture_id ? -1 : 1)),
  );

  const scenarios = Object.freeze(
    REFERENCE_SCENARIOS.map((scenario) => {
      const statuses = fixtures
        .filter((r) => r.scenario === scenario)
        .map((r) => r.status);
      return Object.freeze({ scenario, ...tally(statuses) });
    }),
  );

  const byAuthority = new Map<string, ReferenceStatus[]>();
  for (const r of fixtures) {
    for (const authority of r.authorities) {
      const list = byAuthority.get(authority) ?? [];
      list.push(r.status);
      byAuthority.set(authority, list);
    }
  }
  const compliance = Object.freeze(
    [...byAuthority.keys()].sort().map((authority) => {
      const t = tally(byAuthority.get(authority) ?? []);
      return Object.freeze({
        authority,
        ...t,
        compliant: t.fail === 0 && t.error === 0,
      });
    }),
  );

  return Object.freeze({
    engine: REFERENCE_TEST_ENGINE_AUTHORITY,
    suite,
    fixtures,
    scenarios,
    summary: tally(fixtures.map((r) => r.status)),
    compliance,
  });
}

/** Deterministic JSON text (sorted keys, no timestamps). */
export function reportToJson(report: ReferenceReport): string {
  const sortKeys = (value: unknown): unknown => {
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(sortKeys);
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj).sort()) {
      out[k] = sortKeys(obj[k]);
    }
    return out;
  };
  return JSON.stringify(sortKeys(report), null, 2);
}

/** Deterministic human-readable rendering of all four report sections. */
export function renderReport(report: ReferenceReport): string {
  const lines: string[] = [];
  lines.push(`SciROS Reference Tests — ${report.suite} (${report.engine})`);
  lines.push("");
  lines.push("FIXTURE REPORT");
  for (const r of report.fixtures) {
    lines.push(`  ${r.status.padEnd(7)} ${r.fixture_id} ${r.title} [${r.scenario}]`);
    for (const a of r.assertions) {
      if (a.status !== "PASS") {
        lines.push(`          - ${a.status} ${a.label}${a.detail ? `: ${a.detail}` : ""}`);
      }
    }
  }
  lines.push("");
  lines.push("SCENARIO REPORT");
  for (const s of report.scenarios) {
    lines.push(
      `  ${s.scenario.padEnd(14)} total=${s.total} pass=${s.pass} fail=${s.fail} error=${s.error} warning=${s.warning} skipped=${s.skipped}`,
    );
  }
  lines.push("");
  lines.push("COMPLIANCE SUMMARY");
  for (const c of report.compliance) {
    lines.push(
      `  ${(c.compliant ? "COMPLIANT" : "NON-COMPLIANT").padEnd(14)} ${c.authority} (${c.pass}/${c.total} pass)`,
    );
  }
  lines.push("");
  const s = report.summary;
  lines.push(
    `SUMMARY total=${s.total} pass=${s.pass} fail=${s.fail} error=${s.error} warning=${s.warning} skipped=${s.skipped}`,
  );
  return lines.join("\n");
}

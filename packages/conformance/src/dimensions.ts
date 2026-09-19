/**
 * CONF-001 — dimension evaluators.
 * Pure functions over ConformanceEvidence / ReferenceReport fields only.
 * Profile-local REQUIRED_* come from the selected ConformanceProfile.
 */
import { REFERENCE_SCENARIOS } from "@sciros/reference-tests";
import type { ConformanceEvidence } from "./evidence.js";
import type { ConformanceProfile } from "./profiles.js";
import {
  type ConformanceAuthorityVerdict,
  type ConformanceDimension,
  type ConformanceVerdict,
} from "./types.js";

function verdictFromCounts(
  pass: number,
  fail: number,
  total: number,
): ConformanceVerdict {
  if (total === 0) return "NOT_EVALUATED";
  if (fail === 0 && pass === total) return "COMPLIANT";
  if (pass === 0) return "NON_COMPLIANT";
  return "PARTIALLY_COMPLIANT";
}

function fixturesWithPrefix(evidence: ConformanceEvidence, prefix: string) {
  return evidence.results.filter((r) => r.fixture_id.startsWith(prefix));
}

function allPass(results: readonly { status: string }[]): boolean {
  return results.length > 0 && results.every((r) => r.status === "PASS");
}

/** Authority compliance — required authorities present and compliant. */
export function evaluateAuthorityCompliance(
  evidence: ConformanceEvidence,
  profile: ConformanceProfile,
): ConformanceDimension {
  const byId = new Map(evidence.compliance.map((c) => [c.authority, c]));
  const notes: string[] = [];
  const refs: string[] = [];
  let pass = 0;
  let fail = 0;
  const required = profile.required_authorities;

  for (const authority of required) {
    const entry = byId.get(authority);
    if (!entry) {
      fail += 1;
      notes.push(`missing evidence for ${authority}`);
      continue;
    }
    refs.push(authority);
    if (entry.compliant && entry.fail === 0 && entry.error === 0) {
      pass += 1;
    } else {
      fail += 1;
      notes.push(
        `${authority} non-compliant (fail=${entry.fail} error=${entry.error})`,
      );
    }
  }

  return Object.freeze({
    dimension_id: "authority_compliance",
    verdict: verdictFromCounts(pass, fail, required.length),
    notes: Object.freeze(notes),
    evidence_refs: Object.freeze(refs),
  });
}

/** Per-authority verdict rows for the report. */
export function buildAuthorityVerdicts(
  evidence: ConformanceEvidence,
  profile: ConformanceProfile,
): readonly ConformanceAuthorityVerdict[] {
  const byId = new Map(evidence.compliance.map((c) => [c.authority, c]));
  return Object.freeze(
    profile.required_authorities.map((authority) => {
      const entry = byId.get(authority);
      if (!entry) {
        return Object.freeze({
          authority,
          verdict: "NOT_EVALUATED" as const,
          pass: 0,
          total: 0,
          fail: 0,
          error: 0,
        });
      }
      const verdict: ConformanceVerdict =
        entry.compliant && entry.fail === 0 && entry.error === 0
          ? "COMPLIANT"
          : entry.pass > 0
            ? "PARTIALLY_COMPLIANT"
            : "NON_COMPLIANT";
      return Object.freeze({
        authority,
        verdict,
        pass: entry.pass,
        total: entry.total,
        fail: entry.fail,
        error: entry.error,
      });
    }),
  );
}

/** Fixture completeness — every required family has ≥1 fixture. */
export function evaluateFixtureCompleteness(
  evidence: ConformanceEvidence,
  profile: ConformanceProfile,
): ConformanceDimension {
  const notes: string[] = [];
  const refs: string[] = [];
  let pass = 0;
  let fail = 0;
  const prefixes = profile.required_fixture_prefixes;

  for (const prefix of prefixes) {
    const matches = fixturesWithPrefix(evidence, prefix);
    if (matches.length === 0) {
      fail += 1;
      notes.push(`missing fixture family ${prefix}*`);
    } else {
      pass += 1;
      refs.push(`${prefix}* (${matches.length})`);
    }
  }

  return Object.freeze({
    dimension_id: "fixture_completeness",
    verdict: verdictFromCounts(pass, fail, prefixes.length),
    notes: Object.freeze(notes),
    evidence_refs: Object.freeze(refs),
  });
}

/** Scenario completeness — all REF-TEST-002 scenarios have fixtures. */
export function evaluateScenarioCompleteness(
  evidence: ConformanceEvidence,
): ConformanceDimension {
  const notes: string[] = [];
  const refs: string[] = [];
  let missing = 0;
  let withFailures = 0;

  for (const scenario of REFERENCE_SCENARIOS) {
    const row = evidence.report.scenarios.find((s) => s.scenario === scenario);
    if (!row || row.total === 0) {
      missing += 1;
      notes.push(`scenario ${scenario} has no fixtures`);
    } else {
      refs.push(`${scenario} (${row.total})`);
      if (row.fail > 0 || row.error > 0) {
        withFailures += 1;
        notes.push(
          `scenario ${scenario} has failures (fail=${row.fail} error=${row.error})`,
        );
      }
    }
  }

  let verdict: ConformanceVerdict;
  if (missing === REFERENCE_SCENARIOS.length) {
    verdict = "NON_COMPLIANT";
  } else if (missing > 0) {
    verdict = "PARTIALLY_COMPLIANT";
  } else if (withFailures > 0) {
    verdict = "PARTIALLY_COMPLIANT";
  } else {
    verdict = "COMPLIANT";
  }

  return Object.freeze({
    dimension_id: "scenario_completeness",
    verdict,
    notes: Object.freeze(notes),
    evidence_refs: Object.freeze(refs),
  });
}

/**
 * Determinism — stable fixture_id order, unique ids, no ERROR fixtures.
 */
export function evaluateDeterminism(
  evidence: ConformanceEvidence,
): ConformanceDimension {
  const notes: string[] = [];
  const refs: string[] = [];
  const ids = evidence.results.map((r) => r.fixture_id);
  const sorted = [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const ordered = ids.every((id, i) => id === sorted[i]);

  if (ordered) {
    refs.push("fixture_id order stable");
  } else {
    notes.push("fixture_id order is not ascending");
  }

  const unique = new Set(ids).size === ids.length;
  if (unique) {
    refs.push("fixture_id unique");
  } else {
    notes.push("duplicate fixture_id detected in evidence");
  }

  const errors = evidence.results.filter((r) => r.status === "ERROR");
  if (errors.length === 0) {
    refs.push("no ERROR fixtures");
  } else {
    notes.push(`${errors.length} ERROR fixture(s) in evidence`);
  }

  const checks = 3;
  const failed =
    (ordered ? 0 : 1) + (unique ? 0 : 1) + (errors.length === 0 ? 0 : 1);
  const passed = checks - failed;

  return Object.freeze({
    dimension_id: "determinism",
    verdict: verdictFromCounts(passed, failed, checks),
    notes: Object.freeze(notes),
    evidence_refs: Object.freeze(refs),
  });
}

/** Round-trip integrity — all REF-RT-* fixtures PASS. */
export function evaluateRoundTripIntegrity(
  evidence: ConformanceEvidence,
): ConformanceDimension {
  const rts = fixturesWithPrefix(evidence, "REF-RT-");
  const notes: string[] = [];
  const refs = rts.map((r) => r.fixture_id);

  if (rts.length === 0) {
    return Object.freeze({
      dimension_id: "round_trip_integrity",
      verdict: "NOT_EVALUATED",
      notes: Object.freeze(["no REF-RT-* fixtures in evidence"]),
      evidence_refs: Object.freeze([]),
    });
  }

  let pass = 0;
  let fail = 0;
  for (const r of rts) {
    if (r.status === "PASS") pass += 1;
    else {
      fail += 1;
      notes.push(`${r.fixture_id} status=${r.status}`);
    }
  }

  return Object.freeze({
    dimension_id: "round_trip_integrity",
    verdict: verdictFromCounts(pass, fail, rts.length),
    notes: Object.freeze(notes),
    evidence_refs: Object.freeze(refs),
  });
}

/**
 * Stage ownership — REF-PROC-001/002/003 evidence for S05/S06/S17.
 * Evaluates evidence only; does not execute stages.
 * OPS is not a scientific processing stage.
 */
export function evaluateStageOwnership(
  evidence: ConformanceEvidence,
): ConformanceDimension {
  const procs = fixturesWithPrefix(evidence, "REF-PROC-");
  const notes: string[] = [];
  const refs: string[] = [];

  if (procs.length === 0) {
    return Object.freeze({
      dimension_id: "stage_ownership",
      verdict: "NOT_EVALUATED",
      notes: Object.freeze(["no REF-PROC-* fixtures in evidence"]),
      evidence_refs: Object.freeze([]),
    });
  }

  const required = ["REF-PROC-001", "REF-PROC-002", "REF-PROC-003"];
  let pass = 0;
  let fail = 0;
  for (const id of required) {
    const r = procs.find((p) => p.fixture_id === id);
    if (!r) {
      fail += 1;
      notes.push(`missing ${id}`);
    } else if (r.status === "PASS") {
      pass += 1;
      refs.push(id);
    } else {
      fail += 1;
      notes.push(`${id} status=${r.status}`);
    }
  }

  return Object.freeze({
    dimension_id: "stage_ownership",
    verdict: verdictFromCounts(pass, fail, required.length),
    notes: Object.freeze(notes),
    evidence_refs: Object.freeze(refs),
  });
}

/**
 * Architecture boundaries — profile-local families present and PASS;
 * evidence source is REF-TEST-001. No package inspection.
 */
export function evaluateArchitectureBoundaries(
  evidence: ConformanceEvidence,
  profile: ConformanceProfile,
): ConformanceDimension {
  const notes: string[] = [];
  const refs: string[] = [];
  const families = profile.architecture_families;

  let pass = 0;
  let fail = 0;

  for (const fam of families) {
    const matches = fixturesWithPrefix(evidence, fam.prefix);
    if (matches.length === 0) {
      fail += 1;
      notes.push(`missing ${fam.label} (${fam.prefix}*)`);
      continue;
    }
    refs.push(`${fam.prefix}*`);
    if (allPass(matches)) {
      pass += 1;
    } else {
      fail += 1;
      notes.push(`${fam.label} has non-PASS fixtures`);
    }
  }

  if (evidence.source === "ReferenceReport" && evidence.engine === "REF-TEST-001") {
    pass += 1;
    refs.push("evidence source REF-TEST-001");
  } else {
    fail += 1;
    notes.push(`unexpected evidence source ${evidence.source}/${evidence.engine}`);
  }

  const total = families.length + 1;
  return Object.freeze({
    dimension_id: "architecture_boundaries",
    verdict: verdictFromCounts(pass, fail, total),
    notes: Object.freeze(notes),
    evidence_refs: Object.freeze(refs),
  });
}

export function evaluateAllDimensions(
  evidence: ConformanceEvidence,
  profile: ConformanceProfile,
): readonly ConformanceDimension[] {
  return Object.freeze([
    evaluateAuthorityCompliance(evidence, profile),
    evaluateFixtureCompleteness(evidence, profile),
    evaluateScenarioCompleteness(evidence),
    evaluateDeterminism(evidence),
    evaluateRoundTripIntegrity(evidence),
    evaluateStageOwnership(evidence),
    evaluateArchitectureBoundaries(evidence, profile),
  ]);
}

import {
  REFERENCE_FIXTURE_ID,
  type ReferenceAssertion,
  type ReferenceCheck,
  type ReferenceFixture,
  type ReferenceResult,
  type ReferenceStatus,
} from "./types.js";

function render(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function errorCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return render(err);
}

class AssertionCollector implements ReferenceCheck {
  readonly assertions: ReferenceAssertion[] = [];

  ok(label: string, condition: boolean, detail?: string): void {
    this.assertions.push({
      label,
      status: condition ? "PASS" : "FAIL",
      ...(condition ? {} : { detail: detail ?? "condition false" }),
    });
  }

  equal(label: string, actual: unknown, expected: unknown): void {
    const pass = actual === expected;
    this.assertions.push({
      label,
      status: pass ? "PASS" : "FAIL",
      ...(pass
        ? {}
        : { detail: `expected ${render(expected)}, got ${render(actual)}` }),
    });
  }

  throws(label: string, fn: () => unknown, code?: string): void {
    try {
      fn();
    } catch (err) {
      if (code === undefined || errorCode(err) === code) {
        this.assertions.push({ label, status: "PASS" });
      } else {
        this.assertions.push({
          label,
          status: "FAIL",
          detail: `expected code ${code}, got ${errorCode(err) ?? errorMessage(err)}`,
        });
      }
      return;
    }
    this.assertions.push({
      label,
      status: "FAIL",
      detail: code ? `expected throw with code ${code}` : "expected throw",
    });
  }

  warn(label: string, detail?: string): void {
    this.assertions.push({
      label,
      status: "WARNING",
      ...(detail !== undefined ? { detail } : {}),
    });
  }
}

function aggregate(assertions: readonly ReferenceAssertion[]): ReferenceStatus {
  let status: ReferenceStatus = "PASS";
  for (const a of assertions) {
    if (a.status === "ERROR") return "ERROR";
    if (a.status === "FAIL") status = "FAIL";
    if (a.status === "WARNING" && status === "PASS") status = "WARNING";
  }
  return status;
}

/**
 * REF-TEST-001 Reference Test Engine.
 * Executes one fixture against its declared expectation; never rethrows.
 */
export class ReferenceTestEngine {
  async run(fixture: ReferenceFixture): Promise<ReferenceResult> {
    const base = {
      fixture_id: fixture.fixture_id,
      title: fixture.title,
      scenario: fixture.scenario,
      authorities: Object.freeze([...fixture.authorities]),
    };

    if (!REFERENCE_FIXTURE_ID.test(fixture.fixture_id)) {
      return Object.freeze({
        ...base,
        status: "ERROR",
        assertions: Object.freeze([
          {
            label: "fixture_id grammar",
            status: "ERROR" as const,
            detail: `fixture_id fails REF-<AREA>-<NNN>: ${fixture.fixture_id}`,
          },
        ]),
      });
    }

    if (fixture.skip !== undefined && fixture.skip.length > 0) {
      return Object.freeze({
        ...base,
        status: "SKIPPED",
        assertions: Object.freeze([
          { label: "skipped", status: "SKIPPED" as const, detail: fixture.skip },
        ]),
      });
    }

    const check = new AssertionCollector();
    try {
      await fixture.execute(check);
      if (fixture.expectation.outcome === "failure") {
        check.assertions.push({
          label: "expected failure",
          status: "FAIL",
          detail:
            fixture.expectation.failure_code !== undefined
              ? `expected rejection ${fixture.expectation.failure_code}, fixture completed`
              : "expected rejection, fixture completed",
        });
      }
    } catch (err) {
      if (fixture.expectation.outcome === "failure") {
        const expected = fixture.expectation.failure_code;
        const actual = errorCode(err);
        if (expected === undefined || actual === expected) {
          check.assertions.push({
            label: `rejected${expected ? ` with ${expected}` : ""}`,
            status: "PASS",
          });
        } else {
          check.assertions.push({
            label: "expected failure",
            status: "FAIL",
            detail: `expected code ${expected}, got ${actual ?? errorMessage(err)}`,
          });
        }
      } else {
        check.assertions.push({
          label: "unexpected error",
          status: "ERROR",
          detail: errorMessage(err),
        });
      }
    }

    return Object.freeze({
      ...base,
      status: aggregate(check.assertions),
      assertions: Object.freeze([...check.assertions]),
    });
  }
}

/**
 * REF-TEST-001 — Reference Test framework model.
 * Testing only: consumes existing Core / ENC / SER / RPR APIs.
 */

export const REFERENCE_TEST_ENGINE_AUTHORITY = "REF-TEST-001" as const;
export const REFERENCE_FIXTURE_AUTHORITY = "REF-TEST-002" as const;
export const REFERENCE_RUNNER_AUTHORITY = "REF-TEST-003" as const;

/** Assertion / result statuses (REF-TEST-001 §assertions). */
export const REFERENCE_STATUSES = [
  "PASS",
  "FAIL",
  "ERROR",
  "WARNING",
  "SKIPPED",
] as const;
export type ReferenceStatus = (typeof REFERENCE_STATUSES)[number];

/** Scenario classes (REF-TEST-002 §scenarios). */
export const REFERENCE_SCENARIOS = [
  "valid",
  "invalid",
  "transition",
  "version",
  "event",
  "relationship",
  "authority",
  "serialization",
  "processor",
] as const;
export type ReferenceScenario = (typeof REFERENCE_SCENARIOS)[number];

/** One executed assertion inside a fixture. */
export interface ReferenceAssertion {
  readonly label: string;
  readonly status: ReferenceStatus;
  readonly detail?: string;
}

/**
 * Declared expected outcome of a fixture execution.
 * outcome=failure means execute() SHALL throw; failure_code (when set)
 * must match the thrown error's `code` member.
 */
export interface ReferenceExpectation {
  readonly outcome: "success" | "failure";
  readonly failure_code?: string;
}

/** Assertion collector handed to fixture bodies. */
export interface ReferenceCheck {
  /** PASS when condition true, FAIL otherwise. */
  ok(label: string, condition: boolean, detail?: string): void;
  /** Strict-equality assertion with rendered detail on mismatch. */
  equal(label: string, actual: unknown, expected: unknown): void;
  /** Asserts fn throws; optional error-code match via `code` member. */
  throws(label: string, fn: () => unknown, code?: string): void;
  /** Records a non-blocking WARNING observation. */
  warn(label: string, detail?: string): void;
}

/** Executable reference fixture (REF-TEST-002). */
export interface ReferenceFixture {
  readonly fixture_id: string;
  readonly title: string;
  readonly scenario: ReferenceScenario;
  /** Frozen authorities this fixture evidences (e.g. SCI-001, SER-JSON-001). */
  readonly authorities: readonly string[];
  readonly expectation: ReferenceExpectation;
  /** Non-empty string marks the fixture SKIPPED with this reason. */
  readonly skip?: string;
  execute(check: ReferenceCheck): Promise<void> | void;
}

/** Result of a single fixture execution. */
export interface ReferenceResult {
  readonly fixture_id: string;
  readonly title: string;
  readonly scenario: ReferenceScenario;
  readonly authorities: readonly string[];
  readonly status: ReferenceStatus;
  readonly assertions: readonly ReferenceAssertion[];
}

/** Fixture-id grammar: REF-<AREA>-<NNN>. */
export const REFERENCE_FIXTURE_ID = /^REF-[A-Z]+-[0-9]{3}$/;

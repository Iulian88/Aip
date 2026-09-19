/**
 * @sciros/reference-tests — REF-TEST-001 / REF-TEST-002 / REF-TEST-003.
 * Executable Reference Test framework: the single source of executable
 * compliance evidence for CONF / CERT phases. Testing only — consumes
 * existing Core / ENC / SER / RPR APIs.
 */

export type {
  ReferenceAssertion,
  ReferenceCheck,
  ReferenceExpectation,
  ReferenceFixture,
  ReferenceResult,
  ReferenceScenario,
  ReferenceStatus,
} from "./types.js";
export {
  REFERENCE_FIXTURE_AUTHORITY,
  REFERENCE_FIXTURE_ID,
  REFERENCE_RUNNER_AUTHORITY,
  REFERENCE_SCENARIOS,
  REFERENCE_STATUSES,
  REFERENCE_TEST_ENGINE_AUTHORITY,
} from "./types.js";

export { ReferenceTestEngine } from "./engine.js";
export { ReferenceRunner } from "./runner.js";

export type {
  ReferenceComplianceEntry,
  ReferenceReport,
  ReferenceScenarioSummary,
  ReferenceTally,
} from "./report.js";
export { buildReferenceReport, renderReport, reportToJson } from "./report.js";

export * from "./fixtures/index.js";

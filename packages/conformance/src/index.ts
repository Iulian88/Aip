/**
 * @sciros/conformance — CONF-001 Conformance Engine.
 * Consumes Reference Test evidence; does not execute fixtures.
 * Certification SHALL consume only Conformance Reports.
 */

export type {
  ConformanceAuthorityVerdict,
  ConformanceDimension,
  ConformanceDimensionId,
  ConformanceObservation,
  ConformanceReport,
  ConformanceSummary,
  ConformanceVerdict,
} from "./types.js";
export {
  CONFORMANCE_AUTHORITY,
  CONFORMANCE_DIMENSIONS,
  CONFORMANCE_VERDICTS,
  REQUIRED_AUTHORITIES,
  REQUIRED_FIXTURE_PREFIXES,
} from "./types.js";

export type {
  ArchitectureFamily,
  ConformanceCorpusId,
  ConformanceProfile,
  ConformanceProfileId,
} from "./profiles.js";
export {
  ARCHITECTURE_FAMILIES_OPS,
  ARCHITECTURE_FAMILIES_SCI,
  CONFORMANCE_PROFILE_IDS,
  PROFILE_OPS,
  PROFILE_SCI,
  REQUIRED_AUTHORITIES_OPS,
  REQUIRED_FIXTURE_PREFIXES_OPS,
  listConformanceProfiles,
  resolveConformanceProfile,
} from "./profiles.js";

export type { ConformanceEvidence } from "./evidence.js";
export { ingestReferenceReport } from "./evidence.js";

export { ConformanceSession } from "./session.js";
export { ConformanceEngine } from "./engine.js";

export {
  conformanceReportToJson,
  isFullyCompliant,
  renderConformanceReport,
} from "./report.js";

export {
  buildAuthorityVerdicts,
  evaluateAllDimensions,
  evaluateArchitectureBoundaries,
  evaluateAuthorityCompliance,
  evaluateDeterminism,
  evaluateFixtureCompleteness,
  evaluateRoundTripIntegrity,
  evaluateScenarioCompleteness,
  evaluateStageOwnership,
} from "./dimensions.js";

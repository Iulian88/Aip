export type {
  Contradiction,
  ContradictionFailureCode,
  ContradictionProvenance,
  ContradictionRecordState,
  ContradictionRecordTransitionEvent,
  ContradictionProvenanceCompleteness,
  ResolvedContradictionState,
} from "./types.js";
export {
  CONTRADICTION_RECORD_STATES,
  FORBIDDEN_CONTRADICTION_RECORD_STATES,
  RESOLVED_STATES,
  PROVENANCE_COMPLETENESS as CONTRADICTION_PROVENANCE_COMPLETENESS,
} from "./types.js";

export {
  CONTRADICTION_OBJECT_ID,
  CONTRADICTION_ONTOLOGY_REF,
  CONTRADICTION_SPEC_REF,
  CONTRADICTION_VERSION,
  CONTRADICTION_UTC_SECOND,
  CRTE_ID,
  CONTRADICTION_HUMAN_REVIEWER,
  INVOLVED_CLAIM_ID,
  CITED_EVIDENCE_ID,
  contradictionNfcTrim,
  isContradictionHumanReviewerAgent,
  isResolvedState,
  leavesOpen,
} from "./identifiers.js";

export {
  ContradictionValidationError,
  isContradictionValidationError,
} from "./errors.js";
export { ContradictionValidator } from "./validator.js";
export { ContradictionFactory, type CreateContradictionInput } from "./factory.js";
export type { ContradictionRepository } from "./repository.js";
export { InMemoryContradictionRepository } from "./repository.js";
export {
  ContradictionTransitionService,
  type ContradictionRecordTransitionInput,
} from "./transition-service.js";
export {
  ContradictionVersionService,
  type ContradictionContentUpdate,
} from "./version-service.js";
export { ContradictionEventBuilder, type CrteBuildInput } from "./event-builder.js";
export { ContradictionReferenceValidator } from "./reference-validator.js";
export {
  ContradictionMaterialChangeEvaluator,
  isContradictionMaterialChange,
} from "./material-change.js";

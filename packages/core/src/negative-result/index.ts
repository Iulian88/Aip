export type {
  CreateNegativeResultInput,
  NegativeResult,
  NegativeResultFailureCode,
  NegativeResultProvenance,
  NegativeResultProvenanceCompleteness,
  NegativeResultRecordState,
  NegativeResultScope,
  NegativeResultTransitionEvent,
} from "./types.js";
export {
  NEGATIVE_RESULT_RECORD_STATES,
  FORBIDDEN_NEGATIVE_RESULT_RECORD_STATES,
  PROVENANCE_COMPLETENESS as NEGATIVE_RESULT_PROVENANCE_COMPLETENESS,
} from "./types.js";

export {
  NEGATIVE_RESULT_OBJECT_ID,
  NEGATIVE_RESULT_ONTOLOGY_REF,
  NEGATIVE_RESULT_SPEC_REF,
  NEGATIVE_RESULT_VERSION,
  NEGATIVE_RESULT_UTC_SECOND,
  NRTE_ID,
  NEGATIVE_RESULT_HUMAN_REVIEWER,
  NR_CLAIM_ID,
  NR_EVIDENCE_ID,
  NR_CONTRADICTION_ID,
  negativeResultNfcTrim,
  isNegativeResultHumanReviewerAgent,
  requiresHumanForTransition,
} from "./identifiers.js";

export {
  NegativeResultValidationError,
  isNegativeResultValidationError,
} from "./errors.js";
export { NegativeResultValidator } from "./validator.js";
export { NegativeResultFactory } from "./factory.js";
export type { NegativeResultRepository } from "./repository.js";
export { InMemoryNegativeResultRepository } from "./repository.js";
export {
  NegativeResultTransitionService,
  type NegativeResultRecordTransitionInput,
} from "./transition-service.js";
export {
  NegativeResultVersionService,
  type NegativeResultContentUpdate,
} from "./version-service.js";
export { NegativeResultEventBuilder, type NrteBuildInput } from "./event-builder.js";
export { NegativeResultReferenceValidator } from "./reference-validator.js";
export {
  NegativeResultMaterialChangeEvaluator,
  isNegativeResultMaterialChange,
} from "./material-change.js";

export type {
  CreateVerificationInput,
  ConcludedVerificationState,
  Verification,
  VerificationFailureCode,
  VerificationMethod,
  VerificationOutcome,
  VerificationProvenance,
  VerificationProvenanceCompleteness,
  VerificationRecordState,
  VerificationScope,
  VerificationTransitionEvent,
} from "./types.js";
export {
  VERIFICATION_RECORD_STATES,
  VERIFICATION_OUTCOMES,
  VERIFICATION_METHODS,
  CONCLUDED_VERIFICATION_STATES,
  FORBIDDEN_VERIFICATION_RECORD_STATES,
  FORBIDDEN_VERIFICATION_OUTCOMES,
  PROVENANCE_COMPLETENESS as VERIFICATION_PROVENANCE_COMPLETENESS,
} from "./types.js";

export {
  VERIFICATION_OBJECT_ID,
  VERIFICATION_ONTOLOGY_REF,
  VERIFICATION_SPEC_REF,
  VERIFICATION_VERSION,
  VERIFICATION_UTC_SECOND,
  VTE_ID,
  VERIFICATION_HUMAN_REVIEWER,
  V_CLAIM_ID,
  V_EVIDENCE_ID,
  V_CONTRADICTION_ID,
  V_NEGATIVE_RESULT_ID,
  V_GRADE_REF,
  verificationNfcTrim,
  isVerificationHumanReviewerAgent,
  leavesPlanned,
  isConcludedState,
  isAllowedGradeRefEntry,
} from "./identifiers.js";

export {
  VerificationValidationError,
  isVerificationValidationError,
} from "./errors.js";
export { VerificationValidator } from "./validator.js";
export { VerificationFactory } from "./factory.js";
export type { VerificationRepository } from "./repository.js";
export { InMemoryVerificationRepository } from "./repository.js";
export {
  VerificationTransitionService,
  type VerificationRecordTransitionInput,
} from "./transition-service.js";
export {
  VerificationVersionService,
  type VerificationContentUpdate,
} from "./version-service.js";
export { VerificationEventBuilder, type VteBuildInput } from "./event-builder.js";
export { VerificationReferenceValidator } from "./reference-validator.js";
export {
  VerificationMaterialChangeEvaluator,
  isVerificationMaterialChange,
} from "./material-change.js";

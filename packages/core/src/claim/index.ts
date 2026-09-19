export type {
  Claim,
  ClaimFailureCode,
  ClaimScope,
  ClaimStanding,
  StandingTransitionEvent,
} from "./types.js";
export { CLAIM_STANDINGS, FORBIDDEN_STANDING_VALUES } from "./types.js";

export {
  CLAIM_ID,
  CLAIM_VERSION,
  CONTRADICTION_ID,
  EVIDENCE_ID,
  HUMAN_REVIEWER,
  NEGATIVE_RESULT_ID,
  ONTOLOGY_REF,
  SPEC_REF,
  STE_ID,
  UTC_SECOND,
  VERIFICATION_ID,
  nfcTrim,
} from "./identifiers.js";

export { ClaimValidationError, isClaimValidationError } from "./errors.js";
export { ClaimValidator } from "./validator.js";
export { ClaimFactory, type CreateClaimInput } from "./factory.js";
export type { ClaimRepository } from "./repository.js";
export { InMemoryClaimRepository } from "./repository.js";
export {
  ClaimTransitionService,
  CONTRADICTION_HANDLING_MARKER,
  CLINICAL_BOUNDARY_ACK,
  hasClinicalBoundaryAck,
  type StandingTransitionInput,
} from "./transition-service.js";
export { ClaimVersionService } from "./version-service.js";
export { ClaimEventBuilder, type SteBuildInput } from "./event-builder.js";
export { ClaimReferenceValidator } from "./reference-validator.js";
export {
  ClaimMaterialChangeEvaluator,
  isMaterialChange,
  scopesEqual,
} from "./material-change.js";
export { isHumanReviewerAgent, requireHumanReviewer } from "./human-reviewer.js";

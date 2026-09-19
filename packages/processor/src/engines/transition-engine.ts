import {
  ClaimTransitionService,
  ContradictionTransitionService,
  EvidenceGradeService,
  EvidenceTransitionService,
  NegativeResultTransitionService,
  VerificationTransitionService,
  isClaimValidationError,
  isContradictionValidationError,
  isEvidenceGradeValidationError,
  isEvidenceValidationError,
  isNegativeResultValidationError,
  isVerificationValidationError,
  type Claim,
  type ClaimStanding,
  type Contradiction,
  type ContradictionRecordState,
  type ContradictionRecordTransitionInput,
  type CreateNegativeResultInput,
  type Evidence,
  type EvidenceRecordState,
  type EvidenceRecordTransitionInput,
  type GradeAssignmentInput,
  type NegativeResult,
  type NegativeResultRecordState,
  type NegativeResultRecordTransitionInput,
  type StandingTransitionInput,
  type Verification,
  type VerificationRecordState,
  type VerificationRecordTransitionInput,
} from "@sciros/core";
import { ProcessorError } from "../errors.js";
import {
  isClaimLike,
  isContradictionLike,
  isEvidenceLike,
  isNegativeResultContentLike,
  isNegativeResultLike,
  isVerificationLike,
} from "./validation-engine.js";

export interface TransitionRequest {
  readonly kind: string;
  readonly subjectIdentity?: string;
  readonly payload?: unknown;
  readonly standingTransition?: StandingTransitionInput;
  readonly recordTransition?: EvidenceRecordTransitionInput;
  readonly gradeAssignment?: GradeAssignmentInput;
  readonly contradictionTransition?: ContradictionRecordTransitionInput;
  readonly negativeResultTransition?: NegativeResultRecordTransitionInput;
  readonly verificationTransition?: VerificationRecordTransitionInput;
}

export interface TransitionResult {
  readonly applied: boolean;
  readonly claim?: Claim;
  readonly evidence?: Evidence;
  readonly contradiction?: Contradiction;
  readonly negativeResult?: NegativeResult;
  readonly verification?: Verification;
  readonly reason: string;
}

/**
 * Transition engine — Claim + Evidence + Grade + Contradiction + Negative Result + Verification.
 * Verification does not mutate Standing, Evidence, Grade, Contradiction, or Negative Result.
 */
export class TransitionEngine {
  private readonly claims = new ClaimTransitionService();
  private readonly evidence = new EvidenceTransitionService();
  private readonly grades = new EvidenceGradeService();
  private readonly contradictions = new ContradictionTransitionService();
  private readonly negativeResults = new NegativeResultTransitionService();
  private readonly verifications = new VerificationTransitionService();

  isAvailable(): boolean {
    return true;
  }

  assertLegality(claim: Claim, to: ClaimStanding): void {
    try {
      this.claims.assertTransitionLegal(claim, to);
    } catch (err) {
      this.rethrow(err);
    }
  }

  assertEvidenceLegality(evidence: Evidence, to: EvidenceRecordState): void {
    try {
      this.evidence.assertTransitionLegal(evidence, to);
    } catch (err) {
      this.rethrow(err);
    }
  }

  assertContradictionLegality(
    contradiction: Contradiction,
    to: ContradictionRecordState,
  ): void {
    try {
      this.contradictions.assertTransitionLegal(contradiction, to);
    } catch (err) {
      this.rethrow(err);
    }
  }

  assertNegativeResultLegality(
    subject: NegativeResult | CreateNegativeResultInput | unknown,
    to: NegativeResultRecordState,
  ): void {
    try {
      if (to === "registered") {
        this.negativeResults.assertRegistrationLegal(to);
        return;
      }
      if (!isNegativeResultLike(subject)) {
        throw new ProcessorError(
          "StageFailure",
          "Negative Result withdrawal requires registered Negative Result",
        );
      }
      this.negativeResults.assertTransitionLegal(subject, to);
    } catch (err) {
      this.rethrow(err);
    }
  }

  assertGradeAssignmentLegal(
    evidence: Evidence,
    input: GradeAssignmentInput,
  ): void {
    try {
      this.grades.assertAssignmentLegal(evidence, input);
    } catch (err) {
      this.rethrow(err);
    }
  }

  assertHumanGate(claim: Claim, input: StandingTransitionInput): void {
    try {
      this.claims.assertHumanReviewerGate(input);
      this.claims.assertClinicalBoundaryAck(claim, input);
      this.claims.assertContestedToSupportedJustification(claim, input);
    } catch (err) {
      this.rethrow(err);
    }
  }

  assertEvidenceHumanGate(
    evidence: Evidence,
    input: EvidenceRecordTransitionInput,
  ): void {
    try {
      this.evidence.assertHumanReviewerGate(evidence, input);
    } catch (err) {
      this.rethrow(err);
    }
  }

  assertGradeHumanGate(evidence: Evidence, input: GradeAssignmentInput): void {
    try {
      this.grades.assertHumanGate(evidence, input);
    } catch (err) {
      this.rethrow(err);
    }
  }

  assertContradictionHumanGate(
    contradiction: Contradiction,
    input: ContradictionRecordTransitionInput,
  ): void {
    try {
      this.contradictions.assertHumanReviewerGate(contradiction, input);
    } catch (err) {
      this.rethrow(err);
    }
  }

  assertNegativeResultHumanGate(input: NegativeResultRecordTransitionInput): void {
    try {
      this.negativeResults.assertHumanReviewerGate(input);
    } catch (err) {
      this.rethrow(err);
    }
  }

  assertVerificationLegality(v: Verification, to: VerificationRecordState): void {
    try {
      this.verifications.assertTransitionLegal(v, to);
    } catch (err) {
      this.rethrow(err);
    }
  }

  assertVerificationHumanGate(input: VerificationRecordTransitionInput): void {
    try {
      this.verifications.assertHumanReviewerGate(input);
    } catch (err) {
      this.rethrow(err);
    }
  }

  async execute(request: TransitionRequest): Promise<TransitionResult> {
    if (request.kind === "claim.standing_transition") {
      if (!isClaimLike(request.payload) || !request.standingTransition) {
        throw new ProcessorError(
          "TransitionUnavailable",
          "claim.standing_transition requires Claim payload and standingTransition",
        );
      }
      try {
        const claim = this.claims.transition(request.payload, request.standingTransition);
        return { applied: true, claim, reason: "standing_transition_applied" };
      } catch (err) {
        return this.rethrow(err);
      }
    }

    if (request.kind === "evidence.record_transition") {
      if (!isEvidenceLike(request.payload) || !request.recordTransition) {
        throw new ProcessorError(
          "TransitionUnavailable",
          "evidence.record_transition requires Evidence payload and recordTransition",
        );
      }
      try {
        const evidence = this.evidence.transition(
          request.payload,
          request.recordTransition,
        );
        return { applied: true, evidence, reason: "record_transition_applied" };
      } catch (err) {
        return this.rethrow(err);
      }
    }

    if (request.kind === "evidence.grade_assignment") {
      if (!isEvidenceLike(request.payload) || !request.gradeAssignment) {
        throw new ProcessorError(
          "TransitionUnavailable",
          "evidence.grade_assignment requires Evidence payload and gradeAssignment",
        );
      }
      try {
        const evidence = this.grades.assign(request.payload, request.gradeAssignment);
        return { applied: true, evidence, reason: "grade_assignment_applied" };
      } catch (err) {
        return this.rethrow(err);
      }
    }

    if (request.kind === "contradiction.record_transition") {
      if (!isContradictionLike(request.payload) || !request.contradictionTransition) {
        throw new ProcessorError(
          "TransitionUnavailable",
          "contradiction.record_transition requires Contradiction payload and contradictionTransition",
        );
      }
      try {
        const contradiction = this.contradictions.transition(
          request.payload,
          request.contradictionTransition,
        );
        return {
          applied: true,
          contradiction,
          reason: "contradiction_record_transition_applied",
        };
      } catch (err) {
        return this.rethrow(err);
      }
    }

    if (request.kind === "negative_result.record_transition") {
      if (!request.negativeResultTransition) {
        throw new ProcessorError(
          "TransitionUnavailable",
          "negative_result.record_transition requires negativeResultTransition",
        );
      }
      try {
        const t = request.negativeResultTransition;
        if (t.to === "registered") {
          if (!isNegativeResultContentLike(request.payload) && !isNegativeResultLike(request.payload)) {
            throw new ProcessorError(
              "TransitionUnavailable",
              "registration requires Negative Result content payload",
            );
          }
          // If already a full NR (re-issue attempt), reject via content path only
          if (isNegativeResultLike(request.payload)) {
            throw new ProcessorError(
              "TransitionUnavailable",
              "registration requires content without record_state; use withdraw for existing NR",
            );
          }
          const negativeResult = this.negativeResults.register(request.payload, t);
          return {
            applied: true,
            negativeResult,
            reason: "negative_result_registered",
          };
        }
        if (!isNegativeResultLike(request.payload)) {
          throw new ProcessorError(
            "TransitionUnavailable",
            "withdrawal requires registered Negative Result payload",
          );
        }
        const negativeResult = this.negativeResults.transition(request.payload, t);
        return {
          applied: true,
          negativeResult,
          reason: "negative_result_record_transition_applied",
        };
      } catch (err) {
        return this.rethrow(err);
      }
    }

    if (request.kind === "verification.record_transition") {
      if (!isVerificationLike(request.payload) || !request.verificationTransition) {
        throw new ProcessorError(
          "TransitionUnavailable",
          "verification.record_transition requires Verification payload and verificationTransition",
        );
      }
      try {
        const verification = this.verifications.transition(
          request.payload,
          request.verificationTransition,
        );
        return {
          applied: true,
          verification,
          reason: "verification_record_transition_applied",
        };
      } catch (err) {
        return this.rethrow(err);
      }
    }

    throw new ProcessorError(
      "TransitionUnavailable",
      `Unsupported transition kind: ${request.kind}`,
    );
  }

  private rethrow(err: unknown): never {
    if (isClaimValidationError(err)) {
      throw new ProcessorError("StageFailure", err.message, {
        details: { claimFailure: err.code, ...err.details },
      });
    }
    if (isEvidenceValidationError(err)) {
      throw new ProcessorError("StageFailure", err.message, {
        details: { evidenceFailure: err.code, ...err.details },
      });
    }
    if (isEvidenceGradeValidationError(err)) {
      throw new ProcessorError("StageFailure", err.message, {
        details: { gradeFailure: err.code, ...err.details },
      });
    }
    if (isContradictionValidationError(err)) {
      throw new ProcessorError("StageFailure", err.message, {
        details: { contradictionFailure: err.code, ...err.details },
      });
    }
    if (isNegativeResultValidationError(err)) {
      throw new ProcessorError("StageFailure", err.message, {
        details: { negativeResultFailure: err.code, ...err.details },
      });
    }
    if (isVerificationValidationError(err)) {
      throw new ProcessorError("StageFailure", err.message, {
        details: { verificationFailure: err.code, ...err.details },
      });
    }
    throw err;
  }
}

import { randomUUID } from "node:crypto";
import type { Evidence } from "../evidence/types.js";
import { EvidenceGradeValidationError } from "./errors.js";
import {
  GAE_ID,
  GRADE_UTC_SECOND,
  gradeNfcTrim,
  isConformantGradeRef,
  isDeferredGradeRef,
  isGradeHumanReviewerAgent,
  parseGradeRef,
  rankOfGradeRef,
} from "./identifiers.js";
import { EvidenceGradeEligibilityEvaluator } from "./eligibility.js";
import { EvidenceGradeReferenceValidator } from "./reference-validator.js";
import type { GradeAssignmentEvent } from "./types.js";

export interface GradeAssignmentBuildInput {
  readonly evidence: Evidence;
  readonly from_grade_ref: string | "null";
  readonly to_grade_ref: string;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref: string;
  readonly at: string;
  readonly event_id?: string;
}

/**
 * Validates SCI-003 Grade assignment against Evidence (encoding, eligibility, AR-*).
 */
export class EvidenceGradeValidator {
  private readonly refs = new EvidenceGradeReferenceValidator();
  private readonly eligibility = new EvidenceGradeEligibilityEvaluator();

  /** Slot on Evidence: deferred OR §9 (MIG-4). */
  validateSlot(evidence: Evidence): void {
    this.refs.assertSlotAllowed(evidence.grade_ref);
    if (isDeferredGradeRef(evidence.grade_ref)) {
      return;
    }
    this.validateConformantAssignment(evidence);
  }

  /** Full SCI-003 conformance for Graded Evidence. */
  validateConformantAssignment(evidence: Evidence): void {
    this.refs.assertEncoding(evidence.grade_ref);
    const parsed = parseGradeRef(evidence.grade_ref);
    if (!parsed) {
      throw new EvidenceGradeValidationError("F1", "Unparseable grade_ref");
    }
    this.eligibility.assertEligible(evidence, parsed.label);

    if (evidence.record_state === "registered") {
      this.assertAr5(evidence);
    }

    this.validateGaeLog(evidence);
  }

  assertAssignmentAuthority(
    evidence: Evidence,
    fromGradeRef: string | "null",
    toGradeRef: string,
    authorityAgent: string,
  ): void {
    this.refs.assertEncoding(toGradeRef);
    const toRank = rankOfGradeRef(toGradeRef);
    const fromRank = rankOfGradeRef(fromGradeRef);

    // AR-4 exception to AR-2: Rank 0 → model_output_only (1) MAY be non-human while draft
    const ar4DraftFloor =
      fromRank === 0 &&
      toRank === 1 &&
      evidence.record_state === "draft";

    // AR-2 / AR-3 — raise requires Human (unless AR-4)
    if (toRank > fromRank && !ar4DraftFloor) {
      if (!isGradeHumanReviewerAgent(authorityAgent)) {
        throw new EvidenceGradeValidationError(
          "F5",
          "AI SHALL NOT raise Grade; Human Reviewer required",
          { authority_agent: authorityAgent, fromRank, toRank },
        );
      }
    }

    // §13 — lower rank on registered requires Human
    if (
      evidence.record_state === "registered" &&
      toRank < fromRank &&
      !isGradeHumanReviewerAgent(authorityAgent)
    ) {
      throw new EvidenceGradeValidationError(
        "F5",
        "Lowering Grade on registered Evidence requires Human Reviewer",
        { authority_agent: authorityAgent },
      );
    }

    // Registered: Grade assignment requires Human (AR-5 / §13)
    if (
      evidence.record_state === "registered" &&
      !isGradeHumanReviewerAgent(authorityAgent)
    ) {
      throw new EvidenceGradeValidationError(
        "F5",
        "Registered Evidence Grade assignment requires Human Reviewer",
      );
    }
  }

  assertEligibleForRef(evidence: Evidence, gradeRef: string): void {
    this.refs.assertEncoding(gradeRef);
    const parsed = parseGradeRef(gradeRef);
    if (!parsed) {
      throw new EvidenceGradeValidationError("F1", "Unparseable to_grade_ref");
    }
    this.eligibility.assertEligible(evidence, parsed.label);
  }

  buildAndValidateGae(input: GradeAssignmentBuildInput): GradeAssignmentEvent {
    const reason = gradeNfcTrim(input.reason);
    const decision_ref = gradeNfcTrim(input.decision_ref);
    if (reason.length < 1) {
      throw new EvidenceGradeValidationError("F_ASSIGNMENT", "GAE reason empty");
    }
    if (decision_ref.length < 1) {
      throw new EvidenceGradeValidationError("F_ASSIGNMENT", "GAE decision_ref empty");
    }
    if (!GRADE_UTC_SECOND.test(input.at)) {
      throw new EvidenceGradeValidationError("F_ASSIGNMENT", "GAE.at must be UTC second");
    }
    this.assertEligibleForRef(input.evidence, input.to_grade_ref);
    this.assertAssignmentAuthority(
      input.evidence,
      input.from_grade_ref,
      input.to_grade_ref,
      input.authority_agent,
    );

    const event_id =
      input.event_id ?? `gae:${randomUUID().replace(/-/g, "").slice(0, 24)}`;
    if (!GAE_ID.test(event_id)) {
      throw new EvidenceGradeValidationError("F_ASSIGNMENT", `Invalid GAE event_id: ${event_id}`);
    }

    const from =
      input.from_grade_ref === "null"
        ? "null"
        : gradeNfcTrim(input.from_grade_ref);

    return Object.freeze({
      event_id,
      at: input.at,
      evidence_id: input.evidence.evidence_id,
      from_grade_ref: from,
      to_grade_ref: gradeNfcTrim(input.to_grade_ref),
      authority_agent: input.authority_agent,
      reason,
      decision_ref,
    });
  }

  private assertAr5(evidence: Evidence): void {
    if (!isConformantGradeRef(evidence.grade_ref)) {
      throw new EvidenceGradeValidationError("F9", "Registered Graded Evidence missing §9 grade_ref");
    }
    const log = evidence.grade_assignment_log ?? [];
    const ok = log.some(
      (e) =>
        e.to_grade_ref === evidence.grade_ref &&
        isGradeHumanReviewerAgent(e.authority_agent),
    );
    if (!ok) {
      throw new EvidenceGradeValidationError(
        "F6",
        "AR-5: registered Evidence requires Human GAE matching current grade_ref",
      );
    }
  }

  private validateGaeLog(evidence: Evidence): void {
    const log = evidence.grade_assignment_log ?? [];
    const seen = new Set<string>();
    for (const gae of log) {
      if (!GAE_ID.test(gae.event_id)) {
        throw new EvidenceGradeValidationError("F_ASSIGNMENT", "Invalid GAE event_id in log");
      }
      if (seen.has(gae.event_id)) {
        throw new EvidenceGradeValidationError(
          "F_ASSIGNMENT",
          `Duplicate GAE event_id ${gae.event_id}`,
        );
      }
      seen.add(gae.event_id);
      if (gae.evidence_id !== evidence.evidence_id) {
        throw new EvidenceGradeValidationError(
          "F_ASSIGNMENT",
          "GAE evidence_id mismatch",
        );
      }
      if (
        gae.from_grade_ref !== "null" &&
        !isDeferredGradeRef(gae.from_grade_ref) &&
        !isConformantGradeRef(gae.from_grade_ref)
      ) {
        // from may be deferred_sci003 string
        if (gae.from_grade_ref !== "deferred_sci003") {
          throw new EvidenceGradeValidationError(
            "F_ASSIGNMENT",
            `Invalid from_grade_ref: ${gae.from_grade_ref}`,
          );
        }
      }
      if (!isConformantGradeRef(gae.to_grade_ref)) {
        throw new EvidenceGradeValidationError(
          "F1",
          `GAE to_grade_ref non-conformant: ${gae.to_grade_ref}`,
        );
      }
    }
  }
}

import type { Evidence } from "../evidence/types.js";
import { EvidenceGradeValidationError } from "./errors.js";
import {
  encodeGradeRef,
  isDeferredGradeRef,
  isGradeHumanReviewerAgent,
  isGradeLabel,
  rankOfGradeRef,
} from "./identifiers.js";
import { EvidenceGradeService, type GradeAssignmentInput } from "./service.js";
import type { GradeLabel } from "./types.js";

export interface MigrateGradeInput {
  readonly label: GradeLabel;
  readonly pin_version?: string;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref: string;
  readonly at: string;
  readonly event_id?: string;
  /** MIG-3: from_grade_ref MAY be deferred_sci003 or null */
  readonly from_as_null?: boolean;
}

/**
 * SCI-003 §15 migration from deferred_sci003.
 */
export class EvidenceGradeMigrationSupport {
  private readonly grades = new EvidenceGradeService();

  /**
   * MIG-2/3/5 — replace deferred with §9 grade_ref via Grade Assignment Event.
   */
  migrateFromDeferred(evidence: Evidence, input: MigrateGradeInput): Evidence {
    if (!isDeferredGradeRef(evidence.grade_ref)) {
      throw new EvidenceGradeValidationError(
        "F_MIGRATION",
        `MIG: grade_ref is not deferred_sci003: ${evidence.grade_ref}`,
      );
    }
    if (!isGradeLabel(input.label)) {
      throw new EvidenceGradeValidationError("F2", `Unknown migration label: ${input.label}`);
    }

    const to_grade_ref = encodeGradeRef(input.label, input.pin_version ?? "0.1.0");
    const toRank = rankOfGradeRef(to_grade_ref);

    // MIG-5: no silent raise without Human when target Rank > 1, or AR-5 (registered)
    if (toRank > 1 || evidence.record_state === "registered") {
      if (!isGradeHumanReviewerAgent(input.authority_agent)) {
        throw new EvidenceGradeValidationError(
          "F5",
          "MIG-5: Human Reviewer required for migration to Rank > 1 or registered Evidence",
        );
      }
    }

    const assignment: GradeAssignmentInput = {
      to_grade_ref,
      authority_agent: input.authority_agent,
      reason: input.reason,
      decision_ref: input.decision_ref,
      at: input.at,
      from_grade_ref: input.from_as_null ? "null" : "deferred_sci003",
      ...(input.event_id !== undefined ? { event_id: input.event_id } : {}),
    };

    return this.grades.assign(evidence, assignment);
  }

  isInterimUngraded(evidence: Evidence): boolean {
    return isDeferredGradeRef(evidence.grade_ref);
  }
}

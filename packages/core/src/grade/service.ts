import type { Evidence } from "../evidence/types.js";
import { EvidenceGradeValidationError } from "./errors.js";
import {
  encodeGradeRef,
  gradeNfcTrim,
  isGradeLabel,
} from "./identifiers.js";
import { isGradeMaterialChange } from "./material-change.js";
import { EvidenceGradeValidator } from "./validator.js";
import type { GradeAssignmentEvent, GradeLabel } from "./types.js";

function bumpPatch(version: string): string {
  const parts = version.split(".").map((p) => Number(p));
  return `${parts[0] ?? 0}.${parts[1] ?? 0}.${(parts[2] ?? 0) + 1}`;
}

export interface GradeAssignmentInput {
  readonly to_grade_ref?: string;
  readonly label?: GradeLabel;
  readonly pin_version?: string;
  readonly authority_agent: string;
  readonly reason: string;
  readonly decision_ref: string;
  readonly at: string;
  readonly event_id?: string;
  readonly from_grade_ref?: string | "null";
}

/**
 * SCI-003 Grade assignment — updates Evidence.grade_ref only.
 * Does NOT mutate Claim Standing or Evidence Record State.
 */
export class EvidenceGradeService {
  private readonly grade = new EvidenceGradeValidator();

  assign(evidence: Evidence, input: GradeAssignmentInput): Evidence {
    const to_grade_ref = this.resolveToRef(input);
    const from_grade_ref = input.from_grade_ref ?? evidence.grade_ref;

    if (!isGradeMaterialChange(evidence.grade_ref, to_grade_ref)) {
      throw new EvidenceGradeValidationError(
        "F_ASSIGNMENT",
        "No grade_ref change; refusing assignment",
      );
    }

    const gae = this.grade.buildAndValidateGae({
      evidence,
      from_grade_ref: from_grade_ref === "null" ? "null" : from_grade_ref,
      to_grade_ref,
      authority_agent: input.authority_agent,
      reason: input.reason,
      decision_ref: input.decision_ref,
      at: input.at,
      ...(input.event_id !== undefined ? { event_id: input.event_id } : {}),
    });

    const log: readonly GradeAssignmentEvent[] = Object.freeze([
      ...(evidence.grade_assignment_log ?? []),
      gae,
    ]);

    const next: Evidence = Object.freeze({
      evidence_id: evidence.evidence_id,
      ontology_ref: evidence.ontology_ref,
      spec_ref: evidence.spec_ref,
      evidence_version: bumpPatch(evidence.evidence_version),
      summary: evidence.summary,
      record_state: evidence.record_state,
      source: evidence.source,
      provenance: evidence.provenance,
      grade_ref: to_grade_ref,
      ethics_constraint_marker: "non_clinical" as const,
      created_by: evidence.created_by,
      created_at: evidence.created_at,
      items: evidence.items,
      record_transition_log: Object.freeze([
        ...(evidence.record_transition_log ?? []),
      ]),
      grade_assignment_log: log,
      ...(evidence.collection ? { collection: evidence.collection } : {}),
      ...(evidence.bears_on ? { bears_on: evidence.bears_on } : {}),
      ...(evidence.ai_assisted !== undefined ? { ai_assisted: evidence.ai_assisted } : {}),
      ...(evidence.human_sponsor ? { human_sponsor: evidence.human_sponsor } : {}),
      ...(evidence.protocol_ref ? { protocol_ref: evidence.protocol_ref } : {}),
      ...(evidence.dataset_refs ? { dataset_refs: evidence.dataset_refs } : {}),
      ...(evidence.citation_refs ? { citation_refs: evidence.citation_refs } : {}),
    });

    this.grade.validateSlot(next);
    return next;
  }

  /**
   * S11 legality only (CODE-AUDIT-003 P-001).
   * Encoding, eligibility, provenance ceiling, label — no Human/AI/authority_agent/decision_ref.
   */
  assertAssignmentLegal(evidence: Evidence, input: GradeAssignmentInput): void {
    const to_grade_ref = this.resolveToRef(input);
    if (!isGradeMaterialChange(evidence.grade_ref, to_grade_ref)) {
      throw new EvidenceGradeValidationError(
        "F_ASSIGNMENT",
        "No grade_ref change; refusing assignment",
      );
    }
    this.grade.assertEligibleForRef(evidence, to_grade_ref);
  }

  /**
   * S12 authority only — Human Reviewer / AI raise / decision_ref (CODE-AUDIT-003 P-001).
   */
  assertHumanGate(evidence: Evidence, input: GradeAssignmentInput): void {
    const to_grade_ref = this.resolveToRef(input);
    const from = input.from_grade_ref ?? evidence.grade_ref;
    this.grade.assertAssignmentAuthority(
      evidence,
      from === "null" ? "null" : from,
      to_grade_ref,
      input.authority_agent,
    );
    const decision = gradeNfcTrim(input.decision_ref);
    if (decision.length < 1) {
      throw new EvidenceGradeValidationError("F_ASSIGNMENT", "decision_ref required");
    }
  }

  private resolveToRef(input: GradeAssignmentInput): string {
    if (input.to_grade_ref !== undefined) {
      return gradeNfcTrim(input.to_grade_ref);
    }
    if (input.label !== undefined && isGradeLabel(input.label)) {
      return encodeGradeRef(input.label, input.pin_version ?? "0.1.0");
    }
    throw new EvidenceGradeValidationError(
      "F1",
      "Grade assignment requires to_grade_ref or label",
    );
  }
}

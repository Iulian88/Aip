/**
 * REF-TEST-002 — SCI-003 Grade Designation fixtures (valid / invalid / relationship).
 */
import { EvidenceGradeService } from "@sciros/core";
import { CanonicalEncoder } from "@sciros/encoding";
import type { ReferenceFixture } from "../types.js";
import {
  AI_AGENT,
  AT_NEXT,
  DECISION,
  HUMAN,
  sampleEvidence,
  sampleLiteratureEvidence,
} from "./support.js";

export const gradeFixtures: readonly ReferenceFixture[] = [
  {
    fixture_id: "REF-GRADE-001",
    title: "Human grade assignment updates grade_ref and bumps version",
    scenario: "valid",
    authorities: ["SCI-003", "SCI-002"],
    expectation: { outcome: "success" },
    execute(check) {
      const next = new EvidenceGradeService().assign(sampleEvidence(), {
        label: "model_output_only",
        authority_agent: HUMAN,
        reason: "reference grade assignment",
        decision_ref: DECISION,
        at: AT_NEXT,
      });
      check.equal("grade_ref", next.grade_ref, "SCI-003@0.1.0:model_output_only");
      check.equal("version bumped", next.evidence_version, "1.0.1");
      check.equal("GAE log grows", next.grade_assignment_log?.length, 1);
    },
  },
  {
    fixture_id: "REF-GRADE-002",
    title: "AI grade raise beyond model_output_only is rejected",
    scenario: "invalid",
    authorities: ["SCI-003"],
    expectation: { outcome: "failure", failure_code: "F5" },
    execute() {
      new EvidenceGradeService().assign(sampleLiteratureEvidence(), {
        label: "literature_secondary",
        authority_agent: AI_AGENT,
        reason: "ai raise attempt",
        decision_ref: DECISION,
        at: AT_NEXT,
      });
    },
  },
  {
    fixture_id: "REF-GRADE-003",
    title: "GradeDesignationUnit carries grades relationship to Evidence",
    scenario: "relationship",
    authorities: ["SCI-003", "ENC-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const evidence = sampleEvidence();
      const unit = await new CanonicalEncoder().assemble({
        kind: "grade",
        evidence,
      });
      check.equal("unit_kind", unit.envelope.unit_kind, "GradeDesignationUnit");
      const grades = unit.envelope.references.filter((r) => r.role === "grades");
      check.equal("one grades reference", grades.length, 1);
      check.equal("grades target", grades[0]?.identity, evidence.evidence_id);
      check.equal("grades class", grades[0]?.target_class, "Evidence");
    },
  },
];

import { encodeGradeRef } from "./identifiers.js";
import { GRADE_RANKS, type GradeLabel } from "./types.js";

/**
 * SCI-003 EG-0.1 Evidence Grade value object (semantics only).
 * Storage remains Evidence.grade_ref (SCI-002).
 */
export class EvidenceGrade {
  readonly label: GradeLabel;
  readonly pinVersion: string;

  constructor(label: GradeLabel, pinVersion = "0.1.0") {
    this.label = label;
    this.pinVersion = pinVersion;
  }

  get rank(): number {
    return GRADE_RANKS[this.label];
  }

  get grade_ref(): string {
    return encodeGradeRef(this.label, this.pinVersion);
  }

  equals(other: EvidenceGrade): boolean {
    return this.grade_ref === other.grade_ref;
  }

  isStrongerThan(other: EvidenceGrade): boolean {
    return this.rank > other.rank;
  }
}

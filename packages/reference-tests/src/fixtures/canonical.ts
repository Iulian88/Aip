/**
 * REF-TEST-002 — ENC-001 Canonical Unit fixtures (valid / invalid).
 */
import { CanonicalEncoder, type CanonicalUnitKind } from "@sciros/encoding";
import type { ReferenceFixture } from "../types.js";
import {
  sampleClaim,
  sampleContradiction,
  sampleEvidence,
  sampleNegativeResult,
  sampleVerification,
} from "./support.js";

function canonicalFixture(
  fixtureId: string,
  title: string,
  unitKind: CanonicalUnitKind,
  identity: string,
  input: () => unknown,
): ReferenceFixture {
  return {
    fixture_id: fixtureId,
    title,
    scenario: "valid",
    authorities: ["ENC-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const encoder = new CanonicalEncoder();
      const unit = await encoder.assemble(input());
      check.equal("unit_kind", unit.envelope.unit_kind, unitKind);
      check.equal("identity", unit.envelope.identity, identity);
      check.equal("intact", unit.intact, true);
      check.equal("encoding authority", unit.envelope.encoding_authority, "ENC-001");
      check.equal("integrity verified", await encoder.verify(unit), true);
    },
  };
}

export const canonicalFixtures: readonly ReferenceFixture[] = [
  canonicalFixture(
    "REF-CANON-001",
    "Claim assembles into ClaimUnit",
    "ClaimUnit",
    "claim:ref012",
    () => sampleClaim(),
  ),
  canonicalFixture(
    "REF-CANON-002",
    "Evidence assembles into EvidenceUnit",
    "EvidenceUnit",
    "evidence:ref012",
    () => sampleEvidence(),
  ),
  canonicalFixture(
    "REF-CANON-003",
    "Contradiction assembles into ContradictionUnit",
    "ContradictionUnit",
    "contradiction:ref012",
    () => sampleContradiction(),
  ),
  canonicalFixture(
    "REF-CANON-004",
    "Negative Result assembles into NegativeResultUnit",
    "NegativeResultUnit",
    "negresult:ref012",
    () => sampleNegativeResult(),
  ),
  canonicalFixture(
    "REF-CANON-005",
    "Verification assembles into VerificationUnit",
    "VerificationUnit",
    "verification:ref012",
    () => sampleVerification(),
  ),
  canonicalFixture(
    "REF-CANON-006",
    "Grade designation assembles into GradeDesignationUnit",
    "GradeDesignationUnit",
    "evidence:ref012",
    () => ({ kind: "grade", evidence: sampleEvidence() }),
  ),
  {
    fixture_id: "REF-CANON-007",
    title: "Unknown input is rejected by Canonical Encoding",
    scenario: "invalid",
    authorities: ["ENC-001"],
    expectation: { outcome: "failure" },
    async execute() {
      await new CanonicalEncoder().assemble({ not: "a knowledge object" });
    },
  },
];

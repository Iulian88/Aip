/**
 * REF-TEST-002 — SER-001 / SER-JSON-001 fixtures
 * (serialization / invalid / authority / round-trip / relationship / event).
 */
import {
  CanonicalEncoder,
  type CanonicalUnit,
} from "@sciros/encoding";
import {
  JSON_ENC_PIN,
  JSON_PROFILE_PIN,
  JsonDecoder,
  JsonEncoder,
  createSerializationFrameworkPorts,
} from "@sciros/serialization";
import { ClaimTransitionService, CLINICAL_BOUNDARY_ACK } from "@sciros/core";
import type { ReferenceFixture } from "../types.js";
import {
  AT_NEXT,
  DECISION,
  HUMAN,
  sampleClaim,
  sampleContradiction,
  sampleEvidence,
  sampleNegativeResult,
  sampleVerification,
} from "./support.js";

async function claimUnit(): Promise<CanonicalUnit> {
  return new CanonicalEncoder().assemble(sampleClaim());
}

export const serializationFixtures: readonly ReferenceFixture[] = [
  {
    fixture_id: "REF-SER-001",
    title: "Serialization framework binds SER-JSON-001",
    scenario: "serialization",
    authorities: ["SER-001", "SER-JSON-001"],
    expectation: { outcome: "success" },
    execute(check) {
      const ports = createSerializationFrameworkPorts();
      const active = ports.framework.binding.getActive();
      check.equal("active profile", active?.profile_id, "SER-JSON-001");
      check.equal("profile pin", JSON_PROFILE_PIN, "SER-JSON-001@1.0.0");
    },
  },
  {
    fixture_id: "REF-SER-002",
    title: "JSON export carries profile discriminators without intact",
    scenario: "serialization",
    authorities: ["SER-JSON-001", "ENC-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const obj = JSON.parse(new JsonEncoder().encode(await claimUnit())) as Record<
        string,
        unknown
      >;
      check.equal("sciros_unit", obj.sciros_unit, "ClaimUnit");
      check.equal("sciros_profile", obj.sciros_profile, JSON_PROFILE_PIN);
      check.equal("sciros_enc", obj.sciros_enc, JSON_ENC_PIN);
      check.equal("id", obj.id, "claim:ref012");
      check.ok("no intact root member", !("intact" in obj));
      check.equal("sentinel preserved", obj.ethics_constraint_marker, "non_clinical");
    },
  },
  {
    fixture_id: "REF-SER-003",
    title: "JP-3: null and undefined content members are omitted",
    scenario: "serialization",
    authorities: ["SER-JSON-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const unit = await claimUnit();
      const withAbsent = {
        ...unit,
        envelope: {
          ...unit.envelope,
          content: {
            ...unit.envelope.content,
            retraction_reason: null,
            ghost_member: undefined,
          },
        },
      };
      const obj = JSON.parse(new JsonEncoder().encode(withAbsent)) as Record<
        string,
        unknown
      >;
      check.ok("null omitted", !("retraction_reason" in obj));
      check.ok("undefined omitted", !("ghost_member" in obj));
      check.equal("sentinel preserved", obj.ethics_constraint_marker, "non_clinical");
    },
  },
  {
    fixture_id: "REF-SER-004",
    title: "Unknown JSON root member is rejected",
    scenario: "invalid",
    authorities: ["SER-JSON-001"],
    expectation: { outcome: "failure", failure_code: "INVALID_JSON_PROFILE" },
    async execute() {
      const good = JSON.parse(new JsonEncoder().encode(await claimUnit())) as Record<
        string,
        unknown
      >;
      new JsonDecoder().decode({ ...good, unknown_root_member: "x" });
    },
  },
  {
    fixture_id: "REF-SER-005",
    title: "Ontology / spec pin skew is rejected on import",
    scenario: "invalid",
    authorities: ["SER-JSON-001", "ENC-001"],
    expectation: { outcome: "failure", failure_code: "INVALID_JSON_PROFILE" },
    async execute() {
      const good = JSON.parse(new JsonEncoder().encode(await claimUnit())) as Record<
        string,
        unknown
      >;
      new JsonDecoder().decode({ ...good, ontology_ref: "SCI-999@9.9.9" });
    },
  },
  {
    fixture_id: "REF-SER-006",
    title: "Malformed JSON text is rejected",
    scenario: "invalid",
    authorities: ["SER-JSON-001"],
    expectation: { outcome: "failure", failure_code: "MALFORMED_JSON" },
    execute() {
      new JsonDecoder().decode("{ not json ");
    },
  },
  {
    fixture_id: "REF-SER-007",
    title: "Foreign encoding authority pin is rejected",
    scenario: "authority",
    authorities: ["SER-JSON-001", "ENC-001"],
    expectation: { outcome: "failure", failure_code: "AUTHORITY_MISMATCH" },
    async execute() {
      const good = JSON.parse(new JsonEncoder().encode(await claimUnit())) as Record<
        string,
        unknown
      >;
      new JsonDecoder().decode({ ...good, sciros_enc: "OTHER-ENC@1.0" });
    },
  },
  {
    fixture_id: "REF-RT-001",
    title: "All six unit kinds round-trip deterministically",
    scenario: "serialization",
    authorities: ["SER-JSON-001", "ENC-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const enc = new CanonicalEncoder();
      const encoder = new JsonEncoder();
      const decoder = new JsonDecoder();
      const units: readonly [string, CanonicalUnit][] = [
        ["Claim", await enc.assemble(sampleClaim())],
        ["Evidence", await enc.assemble(sampleEvidence())],
        ["Contradiction", await enc.assemble(sampleContradiction())],
        ["NegativeResult", await enc.assemble(sampleNegativeResult())],
        ["Verification", await enc.assemble(sampleVerification())],
        [
          "GradeDesignation",
          await enc.assemble({ kind: "grade", evidence: sampleEvidence() }),
        ],
      ];
      for (const [name, unit] of units) {
        const first = encoder.encode(unit);
        const decoded = decoder.decode(first);
        const second = encoder.encode(decoded);
        check.equal(`${name} deterministic re-encode`, second, first);
        check.equal(
          `${name} identity preserved`,
          decoded.envelope.identity,
          unit.envelope.identity,
        );
        check.equal(`${name} intact restored`, decoded.intact, true);
      }
    },
  },
  {
    fixture_id: "REF-RT-002",
    title: "Relationships survive JSON round-trip",
    scenario: "relationship",
    authorities: ["SER-JSON-001", "ENC-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const enc = new CanonicalEncoder();
      const encoder = new JsonEncoder();
      const decoder = new JsonDecoder();

      const claim = decoder.decode(encoder.encode(await enc.assemble(sampleClaim())));
      const supported = claim.envelope.references.filter(
        (r) => r.role === "supported_by",
      );
      check.equal("claim supported_by count", supported.length, 1);
      check.equal("claim supported_by target", supported[0]?.identity, "evidence:ref012");

      const grade = decoder.decode(
        encoder.encode(await enc.assemble({ kind: "grade", evidence: sampleEvidence() })),
      );
      const grades = grade.envelope.references.filter((r) => r.role === "grades");
      check.equal("grades count", grades.length, 1);
      check.equal("grades target", grades[0]?.identity, "evidence:ref012");
    },
  },
  {
    fixture_id: "REF-RT-003",
    title: "Transition events survive JSON round-trip",
    scenario: "event",
    authorities: ["SER-JSON-001", "ENC-001", "SCI-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const supportedClaim = new ClaimTransitionService().transition(sampleClaim(), {
        to: "supported",
        authority_agent: HUMAN,
        reason: `${CLINICAL_BOUNDARY_ACK} round-trip event fixture`,
        decision_ref: DECISION,
        at: AT_NEXT,
      });
      const unit = await new CanonicalEncoder().assemble(supportedClaim);
      const decoded = new JsonDecoder().decode(new JsonEncoder().encode(unit));
      check.equal("event count", decoded.envelope.events.length, 1);
      const event = decoded.envelope.events[0];
      check.equal("event parent", event?.parent_identity, "claim:ref012");
      check.equal("event to_state", event?.to_state, "supported");
      check.equal("event at", event?.at, AT_NEXT);
    },
  },
];

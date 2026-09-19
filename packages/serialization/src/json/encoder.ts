import type { CanonicalEvent } from "@sciros/encoding";
import { JsonError } from "./errors.js";
import {
  JSON_ENC_PIN,
  JSON_PROFILE_ID,
  JSON_PROFILE_PIN,
  type JsonDocument,
  type JsonUnitObject,
} from "./types.js";
import { JsonValidator } from "./validator.js";

const ROLE_TO_CLASS: Readonly<Record<string, string>> = {
  supported_by: "Evidence",
  contested_by: "Contradiction",
  qualified_by: "NegativeResult",
  verified_via: "Verification",
  supersedes: "Claim",
  superseded_by: "Claim",
  bears_on: "Claim",
  involves: "Claim",
  cites_evidence: "Evidence",
  qualifies_or_challenges: "Claim",
  related_contradiction: "Contradiction",
  related_verification: "Verification",
  related_negative_result: "NegativeResult",
  verifies_claim: "Claim",
  verifies_evidence: "Evidence",
  grade_ref: "Extension",
  grades: "Evidence",
};

const ROLE_TO_JSON_MEMBER: Readonly<Record<string, string>> = {
  supported_by: "supported_by",
  contested_by: "contested_by",
  qualified_by: "qualified_by",
  verified_via: "verified_via",
  supersedes: "supersedes",
  superseded_by: "superseded_by",
  bears_on: "bears_on",
  involves: "involved_claims",
  cites_evidence: "evidence_refs",
  qualifies_or_challenges: "claim_refs",
  related_contradiction: "contradiction_refs",
  related_verification: "verification_refs",
  related_negative_result: "negative_result_refs",
  verifies_claim: "claim_refs",
  verifies_evidence: "evidence_refs",
  grade_ref: "grade_refs",
  grades: "grades",
};

/**
 * Encodes Canonical Units into SER-JSON-001 JSON documents.
 */
export class JsonEncoder {
  private readonly validator = new JsonValidator();

  encode(canonical: unknown, _profileId: string = JSON_PROFILE_ID): string {
    const obj = this.encodeObject(canonical);
    return stableStringify(obj);
  }

  encodeDocument(canonical: unknown): JsonDocument {
    return this.encodeObject(canonical);
  }

  encodeObject(canonical: unknown): JsonUnitObject {
    const unit = this.validator.assertCanonicalUnit(canonical);
    const env = unit.envelope;
    const content = { ...env.content } as Record<string, unknown>;

    this.validator.assertIdentityConsistency(env.unit_kind, env.identity, content);
    this.validator.rejectForeignEmbeds(content, env.unit_kind);

    // P-005: do not export `intact` (not a SER-JSON-001 §4.3 root member).
    const out: Record<string, unknown> = {
      sciros_unit: env.unit_kind,
      sciros_profile: JSON_PROFILE_PIN,
      sciros_enc: JSON_ENC_PIN,
      id: env.identity,
      version: env.content_version,
      ontology_ref: env.ontology_ref,
      spec_ref: env.spec_ref,
    };

    // Lift content fields (JP-3: omit undefined and null).
    const idKey = contentIdKey(env.unit_kind);
    for (const [k, v] of Object.entries(content)) {
      if (k === idKey) continue;
      if (v === undefined || v === null) continue;
      out[k] = omitAbsentDeep(v);
    }

    // Relationship slots from typed references
    const slots = new Map<string, string[]>();
    const scalarSlots = new Map<string, string>();
    for (const ref of env.references) {
      const role = ref.role ?? "";
      const member = ROLE_TO_JSON_MEMBER[role];
      if (!member) continue;
      const targetClass = ROLE_TO_CLASS[role] ?? ref.target_class;
      this.validator.assertReferenceGrammar(targetClass, ref.identity);
      if (role === "supersedes" || role === "superseded_by") {
        scalarSlots.set(member, ref.identity);
      } else {
        const list = slots.get(member) ?? [];
        list.push(ref.identity);
        slots.set(member, list);
      }
    }
    for (const [member, ids] of slots) {
      this.validator.assertNoDuplicateIds(ids, member);
      out[member] = Object.freeze([...ids]);
    }
    for (const [member, id] of scalarSlots) {
      out[member] = id;
    }

    if (env.events.length > 0) {
      out.events = Object.freeze(env.events.map((e) => this.encodeEvent(e)));
    }

    if (env.extensions.length > 0) {
      const extensions: Record<string, unknown> = {};
      for (const ext of env.extensions) {
        extensions[ext.extension_id] = omitAbsentDeep({
          extension_version: ext.extension_version,
          payload: ext.payload,
        });
      }
      out.extensions = Object.freeze(extensions);
    }

    return Object.freeze(out);
  }

  private encodeEvent(e: CanonicalEvent): JsonUnitObject {
    if (!e.event_id) {
      throw new JsonError("MISSING_REQUIRED_FIELD", "event_id missing");
    }
    const out: Record<string, unknown> = {
      sciros_unit: "EventUnit",
      event_kind: eventKindFor(e.parent_class),
      event_id: e.event_id,
      parent_class: e.parent_class,
      parent_id: e.parent_identity,
      at: e.at,
      from_state: e.from_state,
      to_state: e.to_state,
      authority_agent: e.authority_agent,
      reason: e.reason,
    };
    if (e.decision_ref !== undefined && e.decision_ref !== null) {
      out.decision_ref = e.decision_ref;
    }
    return Object.freeze(out);
  }
}

function contentIdKey(unitKind: string): string | undefined {
  const map: Record<string, string> = {
    ClaimUnit: "claim_id",
    EvidenceUnit: "evidence_id",
    ContradictionUnit: "contradiction_id",
    NegativeResultUnit: "negative_result_id",
    VerificationUnit: "verification_id",
    GradeDesignationUnit: "evidence_id",
  };
  return map[unitKind];
}

function eventKindFor(parentClass: string): string {
  switch (parentClass) {
    case "Claim":
      return "StandingTransition";
    case "Evidence":
      return "EvidenceRecordTransition";
    case "Contradiction":
      return "ContradictionRecordTransition";
    case "NegativeResult":
      return "NegativeResultTransition";
    case "Verification":
      return "VerificationTransition";
    default:
      return "StandingTransition";
  }
}

/** JP-3: deep-clone omitting undefined and null members (preserve Core sentinel strings). */
function omitAbsentDeep(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((v) => omitAbsentDeep(v));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined || v === null) continue;
      out[k] = omitAbsentDeep(v);
    }
    return out;
  }
  return value;
}

/** Deterministic JSON text (sorted object keys). */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj).sort()) {
    out[k] = sortKeys(obj[k]);
  }
  return out;
}

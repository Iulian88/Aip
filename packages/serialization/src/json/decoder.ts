import type { CanonicalEvent, CanonicalReference, CanonicalUnit } from "@sciros/encoding";
import { JsonError } from "./errors.js";
import type { JsonDocument, JsonUnitObject } from "./types.js";
import { JsonValidator } from "./validator.js";

const JSON_MEMBER_TO_REF: Readonly<
  Record<string, { role: string; target_class: CanonicalReference["target_class"] }>
> = {
  supported_by: { role: "supported_by", target_class: "Evidence" },
  contested_by: { role: "contested_by", target_class: "Contradiction" },
  qualified_by: { role: "qualified_by", target_class: "NegativeResult" },
  verified_via: { role: "verified_via", target_class: "Verification" },
  supersedes: { role: "supersedes", target_class: "Claim" },
  superseded_by: { role: "superseded_by", target_class: "Claim" },
  bears_on: { role: "bears_on", target_class: "Claim" },
  involved_claims: { role: "involves", target_class: "Claim" },
  evidence_refs: { role: "cites_evidence", target_class: "Evidence" },
  claim_refs: { role: "verifies_claim", target_class: "Claim" },
  contradiction_refs: { role: "related_contradiction", target_class: "Contradiction" },
  verification_refs: { role: "related_verification", target_class: "Verification" },
  negative_result_refs: { role: "related_negative_result", target_class: "NegativeResult" },
  grade_refs: { role: "grade_ref", target_class: "Extension" },
  grades: { role: "grades", target_class: "Evidence" },
};


/** Profile/relationship members — not folded into Canonical content. */
const META_KEYS = new Set([
  "sciros_unit",
  "sciros_profile",
  "sciros_enc",
  "id",
  "version",
  "ontology_ref",
  "spec_ref",
  "events",
  "extensions",
  "supported_by",
  "contested_by",
  "qualified_by",
  "verified_via",
  "supersedes",
  "superseded_by",
  "bears_on",
  "involved_claims",
  "evidence_refs",
  "claim_refs",
  "contradiction_refs",
  "verification_refs",
  "negative_result_refs",
  "grade_refs",
  "grades",
]);

const CONTENT_ID: Readonly<Record<string, string>> = {
  ClaimUnit: "claim_id",
  EvidenceUnit: "evidence_id",
  ContradictionUnit: "contradiction_id",
  NegativeResultUnit: "negative_result_id",
  VerificationUnit: "verification_id",
  GradeDesignationUnit: "evidence_id",
};

/**
 * Decodes SER-JSON-001 JSON documents into Canonical Units.
 */
export class JsonDecoder {
  private readonly validator = new JsonValidator();

  decode(document: JsonDocument | unknown): CanonicalUnit {
    const obj = this.validator.parseDocument(document);
    return this.decodeObject(obj);
  }

  decodeObject(obj: JsonUnitObject): CanonicalUnit {
    const unitKind = String(obj.sciros_unit);
    if (unitKind === "EventUnit" || unitKind === "BatchEnvelope") {
      throw new JsonError("UNSUPPORTED_UNIT", `Standalone ${unitKind} decode not supported here`);
    }

    const id = String(obj.id);
    const version = String(obj.version);
    const ontology_ref = String(obj.ontology_ref);
    const spec_ref = String(obj.spec_ref);

    // P-006: pin-range checks via ENC resolver before returning unit.
    this.validator.assertCorePins(unitKind, ontology_ref, spec_ref);

    const references: CanonicalReference[] = [];
    for (const [member, meta] of Object.entries(JSON_MEMBER_TO_REF)) {
      const raw = obj[member];
      if (raw === undefined || raw === null) continue;
      if (member === "supersedes" || member === "superseded_by") {
        if (typeof raw !== "string") {
          throw new JsonError("INVALID_JSON_PROFILE", `${member} must be string`);
        }
        this.validator.assertReferenceGrammar(meta.target_class, raw);
        references.push(
          Object.freeze({
            target_class: meta.target_class,
            identity: raw,
            role: meta.role,
          }),
        );
        continue;
      }
      if (!Array.isArray(raw)) {
        throw new JsonError("INVALID_JSON_PROFILE", `${member} must be array`);
      }
      const ids = raw.map((x) => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object" && "id" in (x as object)) {
          return String((x as { id: string }).id);
        }
        throw new JsonError("BROKEN_REFERENCE", `Invalid ref element in ${member}`);
      });
      this.validator.assertNoDuplicateIds(ids, member);
      const role =
        member === "claim_refs"
          ? unitKind === "NegativeResultUnit"
            ? "qualifies_or_challenges"
            : "verifies_claim"
          : member === "evidence_refs"
            ? unitKind === "VerificationUnit"
              ? "verifies_evidence"
              : "cites_evidence"
            : meta.role;
      const target =
        member === "claim_refs"
          ? "Claim"
          : member === "evidence_refs"
            ? "Evidence"
            : meta.target_class;
      for (const identity of ids) {
        this.validator.assertReferenceGrammar(target, identity);
        references.push(
          Object.freeze({
            target_class: target as CanonicalReference["target_class"],
            identity,
            role,
          }),
        );
      }
    }

    const events: CanonicalEvent[] = [];
    const eventIds = new Set<string>();
    if (obj.events !== undefined && obj.events !== null) {
      if (!Array.isArray(obj.events)) {
        throw new JsonError("INVALID_JSON_PROFILE", "events must be array");
      }
      for (const raw of obj.events) {
        const ev = this.decodeEvent(raw, id);
        if (eventIds.has(ev.event_id)) {
          throw new JsonError("DUPLICATE_IDENTIFIER", `Duplicate event_id: ${ev.event_id}`);
        }
        eventIds.add(ev.event_id);
        events.push(ev);
      }
    }

    const content: Record<string, unknown> = {};
    const idKey = CONTENT_ID[unitKind];
    if (idKey) content[idKey] = id;
    if (unitKind === "ClaimUnit") content.claim_version = version;
    if (unitKind === "EvidenceUnit") content.evidence_version = version;
    if (unitKind === "ContradictionUnit") content.contradiction_version = version;
    if (unitKind === "NegativeResultUnit") content.negative_result_version = version;
    if (unitKind === "VerificationUnit") content.verification_version = version;

    for (const [k, v] of Object.entries(obj)) {
      if (META_KEYS.has(k)) continue;
      if (v === undefined || v === null) continue;
      content[k] = deepClone(v);
    }

    this.validator.assertIdentityConsistency(unitKind, id, content);
    this.validator.rejectForeignEmbeds(content, unitKind);

    const extensions = decodeExtensions(obj.extensions);

    const [encAuth, encVer] = parseEncPin(String(obj.sciros_enc));

    // P-005: restore intact=true for Canonical Unit; integrity remains ENC ownership.
    const unit = Object.freeze({
      intact: true,
      envelope: Object.freeze({
        encoding_authority: encAuth,
        encoding_version: encVer,
        unit_kind: unitKind,
        ontology_ref,
        spec_ref,
        identity: id,
        content_version: version,
        references: Object.freeze(references),
        events: Object.freeze(events),
        extensions: Object.freeze(extensions),
        content: freezeDeep(content),
      }),
    }) as unknown as CanonicalUnit;

    this.validator.assertCanonicalUnit(unit);
    return unit;
  }

  private decodeEvent(raw: unknown, parentId: string): CanonicalEvent {
    if (!raw || typeof raw !== "object") {
      throw new JsonError("INVALID_JSON_PROFILE", "event must be object");
    }
    const e = raw as Record<string, unknown>;
    if (e.sciros_unit !== "EventUnit") {
      throw new JsonError("INVALID_JSON_PROFILE", "event sciros_unit must be EventUnit");
    }
    for (const key of [
      "event_id",
      "parent_class",
      "parent_id",
      "at",
      "from_state",
      "to_state",
      "authority_agent",
      "reason",
    ]) {
      if (typeof e[key] !== "string" || (e[key] as string).length < 1) {
        throw new JsonError("MISSING_REQUIRED_FIELD", `event.${key} missing`);
      }
    }
    if (String(e.parent_id) !== parentId) {
      throw new JsonError(
        "INVALID_JSON_PROFILE",
        `event parent_id ${String(e.parent_id)} ≠ unit id ${parentId}`,
      );
    }
    return Object.freeze({
      event_id: String(e.event_id),
      parent_identity: String(e.parent_id),
      parent_class: String(e.parent_class) as CanonicalEvent["parent_class"],
      at: String(e.at),
      from_state: String(e.from_state),
      to_state: String(e.to_state),
      authority_agent: String(e.authority_agent),
      reason: String(e.reason),
      ...(typeof e.decision_ref === "string" ? { decision_ref: e.decision_ref } : {}),
    });
  }
}

function parseEncPin(pin: string): [string, string] {
  const m = /^(ENC-001)@(.+)$/.exec(pin);
  if (!m) {
    throw new JsonError("AUTHORITY_MISMATCH", `Invalid sciros_enc: ${pin}`);
  }
  // P-001: profile pin is ENC-001@1.0; Encoding package uses 1.0.0.
  const ver = m[2] === "1.0" ? "1.0.0" : m[2]!;
  return [m[1]!, ver];
}

function decodeExtensions(raw: unknown): CanonicalUnit["envelope"]["extensions"] {
  if (raw === undefined || raw === null) return Object.freeze([]);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new JsonError("INVALID_JSON_PROFILE", "extensions must be object");
  }
  const out = [];
  for (const [extension_id, val] of Object.entries(raw as Record<string, unknown>)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const v = val as Record<string, unknown>;
      out.push(
        Object.freeze({
          extension_id,
          extension_version: String(v.extension_version ?? "1.0.0"),
          payload: freezeDeep((v.payload as Record<string, unknown>) ?? v),
        }),
      );
    } else {
      out.push(
        Object.freeze({
          extension_id,
          extension_version: "1.0.0",
          payload: freezeDeep({ value: val }),
        }),
      );
    }
  }
  return Object.freeze(out);
}

function deepClone<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => deepClone(v)) as T;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = deepClone(v);
  }
  return out as T;
}

function freezeDeep<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map((v) => freezeDeep(v))) as T;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = freezeDeep(v);
  }
  return Object.freeze(out) as T;
}

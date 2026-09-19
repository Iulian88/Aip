import type { CanonicalUnit } from "@sciros/encoding";
import {
  CanonicalEncodingError,
  CanonicalReferenceResolver,
} from "@sciros/encoding";
import { JsonError } from "./errors.js";
import {
  JSON_PROFILE_ID,
  JSON_PROFILE_PIN,
  JSON_PROFILE_VERSION,
  type JsonUnitObject,
} from "./types.js";
import { JsonVersion } from "./version.js";

const CONTENT_ID: Readonly<Record<string, string>> = {
  ClaimUnit: "claim_id",
  EvidenceUnit: "evidence_id",
  ContradictionUnit: "contradiction_id",
  NegativeResultUnit: "negative_result_id",
  VerificationUnit: "verification_id",
  GradeDesignationUnit: "evidence_id",
};

const SPEC_OWNER: Readonly<Record<string, string>> = {
  ClaimUnit: "Claim",
  EvidenceUnit: "Evidence",
  ContradictionUnit: "Contradiction",
  NegativeResultUnit: "NegativeResult",
  VerificationUnit: "Verification",
  GradeDesignationUnit: "Grade",
};

/** Discriminators + §4.3 common root members. */
const COMMON_ROOT = Object.freeze([
  "sciros_unit",
  "sciros_profile",
  "sciros_enc",
  "id",
  "version",
  "ontology_ref",
  "spec_ref",
  "ethics_constraint_marker",
  "created_by",
  "created_at",
  "ai_assisted",
  "human_sponsor",
  "events",
  "extensions",
  "protocol_ref",
  "dataset_refs",
  "citation_refs",
]);

/** §6 relationship members (+ P-004 grades). */
const RELATIONSHIP_ROOT = Object.freeze([
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

/** §9 content / ENC-lifted material members per unit (no invented fields). */
const UNIT_CONTENT_ROOT: Readonly<Record<string, readonly string[]>> = {
  ClaimUnit: [
    "claim_version",
    "proposition",
    "standing",
    "scope",
    "is_hypothesis",
    "retraction_reason",
    "entity_bindings",
    "assumes",
  ],
  EvidenceUnit: [
    "evidence_version",
    "summary",
    "record_state",
    "source",
    "provenance",
    "items",
    "collection",
    "grade_ref",
    "grade_events",
  ],
  ContradictionUnit: [
    "contradiction_version",
    "summary",
    "record_state",
    "overlap_statement",
    "incompatibility_statement",
    "provenance",
    "resolution_note",
  ],
  NegativeResultUnit: [
    "negative_result_version",
    "summary",
    "description",
    "record_state",
    "expected_observation",
    "observed_absence",
    "scope",
    "sensitivity_context",
    "provenance",
    "withdrawal_reason",
  ],
  VerificationUnit: [
    "verification_version",
    "summary",
    "description",
    "record_state",
    "verification_outcome",
    "scope",
    "verification_method",
    "verification_context",
    "verification_rationale",
    "provenance",
    "artifact_ref",
  ],
  GradeDesignationUnit: ["evidence_version", "grade_ref"],
};

/**
 * Validates SER-JSON-001 documents and canonical inputs for JSON projection.
 */
export class JsonValidator {
  private readonly refs = new CanonicalReferenceResolver();

  assertCanonicalUnit(input: unknown): CanonicalUnit {
    if (!input || typeof input !== "object") {
      throw new JsonError("INVALID_CANONICAL_UNIT", "Canonical unit missing");
    }
    const u = input as Partial<CanonicalUnit>;
    if (!u.envelope || typeof u.envelope !== "object") {
      throw new JsonError("INVALID_CANONICAL_UNIT", "Canonical envelope missing");
    }
    if (typeof u.intact !== "boolean") {
      throw new JsonError("INVALID_CANONICAL_UNIT", "intact missing");
    }
    return u as CanonicalUnit;
  }

  parseDocument(document: unknown): JsonUnitObject {
    if (typeof document === "string") {
      let parsed: unknown;
      try {
        parsed = JSON.parse(document);
      } catch {
        throw new JsonError("MALFORMED_JSON", "Document is not valid JSON text");
      }
      return this.assertUnitObject(parsed);
    }
    return this.assertUnitObject(document);
  }

  assertUnitObject(value: unknown): JsonUnitObject {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new JsonError("INVALID_JSON_PROFILE", "JSON unit must be an object");
    }
    const o = value as Record<string, unknown>;
    this.requireString(o, "sciros_unit");
    this.requireString(o, "sciros_profile");
    this.requireString(o, "sciros_enc");
    this.requireString(o, "id");
    this.requireString(o, "version");
    this.requireString(o, "ontology_ref");
    this.requireString(o, "spec_ref");

    if (!JsonVersion.matches(String(o.sciros_profile))) {
      if (String(o.sciros_profile).startsWith(JSON_PROFILE_ID)) {
        throw new JsonError(
          "PROFILE_VERSION_MISMATCH",
          `Expected ${JSON_PROFILE_PIN}, got ${String(o.sciros_profile)}`,
        );
      }
      throw new JsonError(
        "UNKNOWN_PROFILE",
        `Unknown sciros_profile: ${String(o.sciros_profile)}`,
      );
    }
    if (!String(o.sciros_enc).startsWith("ENC-001@")) {
      throw new JsonError(
        "AUTHORITY_MISMATCH",
        `Expected ENC-001 pin, got ${String(o.sciros_enc)}`,
      );
    }

    this.assertKnownRootMembers(o, String(o.sciros_unit));
    return Object.freeze({ ...o });
  }

  /** JP-9 / §13: reject unknown root members. */
  assertKnownRootMembers(o: Record<string, unknown>, unitKind: string): void {
    const allowed = new Set<string>([
      ...COMMON_ROOT,
      ...RELATIONSHIP_ROOT,
      ...(UNIT_CONTENT_ROOT[unitKind] ?? []),
    ]);
    for (const key of Object.keys(o)) {
      if (!allowed.has(key)) {
        throw new JsonError(
          "INVALID_JSON_PROFILE",
          `Unknown root member: ${key}`,
          { key, unitKind },
        );
      }
    }
  }

  /** §13: reuse ENC CanonicalReferenceResolver pin checks. */
  assertCorePins(unitKind: string, ontologyRef: string, specRef: string): void {
    try {
      this.refs.assertOntologyPin(ontologyRef);
      const owner = SPEC_OWNER[unitKind];
      if (owner) {
        this.refs.assertSpecPin(owner, specRef);
      }
    } catch (err) {
      if (err instanceof CanonicalEncodingError) {
        throw new JsonError(
          "INVALID_JSON_PROFILE",
          err.message,
          { code: err.code, ...(err.details ?? {}) },
        );
      }
      throw err;
    }
  }

  assertIdentityConsistency(unitKind: string, id: string, content: Record<string, unknown>): void {
    const key = CONTENT_ID[unitKind];
    if (!key) return;
    const contentId = content[key];
    if (typeof contentId === "string" && contentId !== id) {
      throw new JsonError(
        "INVALID_JSON_PROFILE",
        `id ${id} ≠ content.${key} ${contentId}`,
      );
    }
  }

  rejectForeignEmbeds(content: Record<string, unknown>, rootKind: string): void {
    const foreignKeys = [
      "claim_id",
      "evidence_id",
      "contradiction_id",
      "negative_result_id",
      "verification_id",
    ] as const;
    const rootKey = CONTENT_ID[rootKind];

    const walk = (value: unknown, depth: number): void => {
      if (value === null || value === undefined) return;
      if (Array.isArray(value)) {
        for (const el of value) walk(el, depth + 1);
        return;
      }
      if (typeof value === "object") {
        const obj = value as Record<string, unknown>;
        if (depth > 0) {
          for (const key of foreignKeys) {
            if (key === rootKey) continue;
            if (key in obj && typeof obj[key] === "string") {
              const looksRoot =
                ("standing" in obj && key === "claim_id") ||
                ("source" in obj && key === "evidence_id") ||
                ("involved_claims" in obj && key === "contradiction_id") ||
                ("expected_observation" in obj && key === "negative_result_id") ||
                ("verification_outcome" in obj && key === "verification_id");
              if (looksRoot) {
                throw new JsonError(
                  "FOREIGN_EMBEDDED_OBJECT",
                  `Foreign aggregate embedded via ${key}`,
                );
              }
            }
          }
        }
        for (const v of Object.values(obj)) walk(v, depth + 1);
      }
    };
    walk(content, 0);
  }

  assertNoDuplicateIds(refs: readonly string[], label: string): void {
    const seen = new Set<string>();
    for (const id of refs) {
      if (seen.has(id)) {
        throw new JsonError("DUPLICATE_IDENTIFIER", `Duplicate ${label}: ${id}`);
      }
      seen.add(id);
    }
  }

  assertReferenceGrammar(targetClass: string, identity: string): void {
    try {
      this.refs.validateReference({
        target_class: targetClass as
          | "Claim"
          | "Evidence"
          | "Contradiction"
          | "NegativeResult"
          | "Verification"
          | "Extension",
        identity,
      });
    } catch (err) {
      if (err instanceof CanonicalEncodingError && err.code === "BROKEN_REFERENCE") {
        throw new JsonError(
          "BROKEN_REFERENCE",
          `Reference fails ${targetClass} grammar: ${identity}`,
          { targetClass, identity },
        );
      }
      throw err;
    }
  }

  private requireString(o: Record<string, unknown>, key: string): void {
    if (typeof o[key] !== "string" || (o[key] as string).length < 1) {
      throw new JsonError("MISSING_REQUIRED_FIELD", `Missing required field: ${key}`);
    }
  }

  profileId(): string {
    return JSON_PROFILE_ID;
  }

  profileVersion(): string {
    return JSON_PROFILE_VERSION;
  }
}

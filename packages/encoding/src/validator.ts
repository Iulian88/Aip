import { CanonicalEncodingError } from "./errors.js";
import { CanonicalReferenceResolver } from "./reference-resolver.js";
import { CanonicalEncodingVersion } from "./version.js";
import type {
  CanonicalEnvelope,
  CanonicalEvent,
  CanonicalReference,
  CanonicalUnit,
  CanonicalUnitKind,
} from "./types.js";

const ROOT_KINDS: readonly CanonicalUnitKind[] = [
  "ClaimUnit",
  "EvidenceUnit",
  "ContradictionUnit",
  "NegativeResultUnit",
  "VerificationUnit",
  "GradeDesignationUnit",
  "EventUnit",
];

const CONTENT_ID_KEY: Readonly<Partial<Record<CanonicalUnitKind, string>>> = {
  ClaimUnit: "claim_id",
  EvidenceUnit: "evidence_id",
  ContradictionUnit: "contradiction_id",
  NegativeResultUnit: "negative_result_id",
  VerificationUnit: "verification_id",
  GradeDesignationUnit: "evidence_id",
};

/**
 * Validates ENC-001 canonical units — projection integrity only.
 * Does NOT run Standing/transition/Human Reviewer rules.
 */
export class CanonicalValidator {
  private readonly refs = new CanonicalReferenceResolver();

  validate(unit: unknown): void {
    if (!unit || typeof unit !== "object") {
      throw new CanonicalEncodingError("MALFORMED_UNIT", "Canonical unit missing");
    }
    const u = unit as Partial<CanonicalUnit>;
    if (!u.envelope || typeof u.envelope !== "object") {
      throw new CanonicalEncodingError("MALFORMED_UNIT", "Canonical envelope missing");
    }
    if (typeof u.intact !== "boolean") {
      throw new CanonicalEncodingError("PARTIAL_UNIT", "Canonical unit.intact missing");
    }
    this.validateEnvelope(u.envelope);
  }

  validateEnvelope(envelope: CanonicalEnvelope): void {
    if (
      !CanonicalEncodingVersion.matches(
        envelope.encoding_authority,
        envelope.encoding_version,
      )
    ) {
      throw new CanonicalEncodingError(
        "UNKNOWN_AUTHORITY",
        `Unknown encoding authority/version: ${envelope.encoding_authority}@${envelope.encoding_version}`,
      );
    }
    if (!(ROOT_KINDS as readonly string[]).includes(envelope.unit_kind)) {
      throw new CanonicalEncodingError(
        "MALFORMED_UNIT",
        `Unknown unit_kind: ${envelope.unit_kind}`,
      );
    }
    if (typeof envelope.identity !== "string" || envelope.identity.length < 1) {
      throw new CanonicalEncodingError("PARTIAL_UNIT", "identity missing");
    }
    if (typeof envelope.content_version !== "string" || envelope.content_version.length < 1) {
      throw new CanonicalEncodingError("PARTIAL_UNIT", "content_version missing");
    }
    if (!envelope.content || typeof envelope.content !== "object") {
      throw new CanonicalEncodingError("PARTIAL_UNIT", "content missing");
    }

    this.refs.assertOntologyPin(envelope.ontology_ref);
    this.assertSpecForKind(envelope.unit_kind, envelope.spec_ref);

    this.assertIdentityConsistency(envelope);
    this.rejectForeignEmbedding(envelope.content);
    this.validateReferences(envelope.references);
    this.validateEvents(envelope.events, envelope.identity);
    this.assertNoDuplicateIds(envelope);
    this.assertUnitShapeRules(envelope);
  }

  verifyIntegrity(unit: CanonicalUnit): boolean {
    this.validate(unit);
    return unit.intact === true;
  }

  private assertSpecForKind(kind: CanonicalUnitKind, specRef: string): void {
    const map: Record<CanonicalUnitKind, string> = {
      ClaimUnit: "Claim",
      EvidenceUnit: "Evidence",
      ContradictionUnit: "Contradiction",
      NegativeResultUnit: "NegativeResult",
      VerificationUnit: "Verification",
      GradeDesignationUnit: "Grade",
      EventUnit: "Claim",
    };
    const owner = map[kind];
    if (kind === "EventUnit") {
      if (!/^SCI-00[1-6]@0\.1\.[0-9]+$/.test(specRef)) {
        throw new CanonicalEncodingError(
          "UNKNOWN_SPEC_PIN",
          `Invalid EventUnit spec_ref: ${specRef}`,
        );
      }
      return;
    }
    this.refs.assertSpecPin(owner, specRef);
  }

  private assertIdentityConsistency(envelope: CanonicalEnvelope): void {
    const key = CONTENT_ID_KEY[envelope.unit_kind];
    if (!key) return;
    const contentId = envelope.content[key];
    if (typeof contentId !== "string" || contentId.length < 1) {
      throw new CanonicalEncodingError(
        "PARTIAL_UNIT",
        `content.${key} missing for ${envelope.unit_kind}`,
      );
    }
    if (contentId !== envelope.identity) {
      throw new CanonicalEncodingError(
        "MIXED_OWNERSHIP",
        `Envelope identity ${envelope.identity} ≠ content.${key} ${contentId}`,
      );
    }
  }

  private assertUnitShapeRules(envelope: CanonicalEnvelope): void {
    if (envelope.unit_kind === "ContradictionUnit") {
      const claimRefs = envelope.references.filter((r) => r.target_class === "Claim");
      if (claimRefs.length < 2) {
        throw new CanonicalEncodingError(
          "PARTIAL_UNIT",
          "ContradictionUnit requires at least two Claim references",
        );
      }
    }
    if (envelope.unit_kind === "VerificationUnit") {
      const hasClaim = envelope.references.some((r) => r.target_class === "Claim");
      const hasEvidence = envelope.references.some((r) => r.target_class === "Evidence");
      const artifact = envelope.content.artifact_ref;
      const hasArtifact = typeof artifact === "string" && artifact.trim().length > 0;
      if (!hasClaim && !hasEvidence && !hasArtifact) {
        throw new CanonicalEncodingError(
          "PARTIAL_UNIT",
          "VerificationUnit requires Claim, Evidence, or artifact target",
        );
      }
    }
  }

  private validateReferences(refs: readonly CanonicalReference[]): void {
    if (!Array.isArray(refs)) {
      throw new CanonicalEncodingError("MALFORMED_UNIT", "references must be an array");
    }
    for (const ref of refs) {
      this.refs.validateReference(ref);
    }
  }

  private validateEvents(events: readonly CanonicalEvent[], parentId: string): void {
    if (!Array.isArray(events)) {
      throw new CanonicalEncodingError("MALFORMED_UNIT", "events must be an array");
    }
    const seen = new Set<string>();
    for (const e of events) {
      if (!e.event_id || e.event_id.length < 1) {
        throw new CanonicalEncodingError("PARTIAL_UNIT", "event_id missing");
      }
      if (seen.has(e.event_id)) {
        throw new CanonicalEncodingError(
          "DUPLICATE_IDENTIFIER",
          `Duplicate event_id: ${e.event_id}`,
        );
      }
      seen.add(e.event_id);
      if (e.parent_identity !== parentId) {
        throw new CanonicalEncodingError(
          "MIXED_OWNERSHIP",
          `Event parent_identity ${e.parent_identity} ≠ unit identity ${parentId}`,
        );
      }
      if (typeof e.at !== "string" || e.at.trim().length < 1) {
        throw new CanonicalEncodingError("PARTIAL_UNIT", "event.at missing");
      }
      if (typeof e.authority_agent !== "string" || e.authority_agent.trim().length < 1) {
        throw new CanonicalEncodingError("PARTIAL_UNIT", "event.authority_agent missing");
      }
      if (typeof e.reason !== "string" || e.reason.trim().length < 1) {
        throw new CanonicalEncodingError("PARTIAL_UNIT", "event.reason missing");
      }
      if (typeof e.from_state !== "string" || e.from_state.length < 1) {
        throw new CanonicalEncodingError("PARTIAL_UNIT", "event.from_state missing");
      }
      if (typeof e.to_state !== "string" || e.to_state.length < 1) {
        throw new CanonicalEncodingError("PARTIAL_UNIT", "event.to_state missing");
      }
    }
  }

  private assertNoDuplicateIds(envelope: CanonicalEnvelope): void {
    const refIds = envelope.references.map((r) => `${r.role ?? ""}:${r.identity}`);
    const seen = new Set<string>();
    for (const id of refIds) {
      if (seen.has(id)) {
        throw new CanonicalEncodingError(
          "DUPLICATE_IDENTIFIER",
          `Duplicate reference slot identity: ${id}`,
        );
      }
      seen.add(id);
    }
  }

  /**
   * CE-3 / Forbidden §13.5 — reject nested foreign root objects inside content.
   */
  private rejectForeignEmbedding(content: Readonly<Record<string, unknown>>): void {
    const foreignKeys = [
      "claim_id",
      "evidence_id",
      "contradiction_id",
      "negative_result_id",
      "verification_id",
    ] as const;

    const walk = (value: unknown, path: string, depth: number): void => {
      if (value === null || value === undefined) return;
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          walk(value[i], `${path}[${i}]`, depth + 1);
        }
        return;
      }
      if (typeof value === "object") {
        const obj = value as Record<string, unknown>;
        if (depth > 0) {
          for (const key of foreignKeys) {
            if (key in obj && typeof obj[key] === "string") {
              throw new CanonicalEncodingError(
                "FOREIGN_EMBEDDED_OBJECT",
                `Foreign aggregate embedded at ${path}.${key}`,
                { path, key },
              );
            }
          }
          if ("envelope" in obj && "intact" in obj) {
            throw new CanonicalEncodingError(
              "FOREIGN_EMBEDDED_OBJECT",
              `Nested canonical unit at ${path}`,
              { path },
            );
          }
        }
        for (const [k, v] of Object.entries(obj)) {
          walk(v, path ? `${path}.${k}` : k, depth + 1);
        }
      }
    };

    walk(content, "content", 0);
  }
}

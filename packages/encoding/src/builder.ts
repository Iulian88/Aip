import type {
  Claim,
  Contradiction,
  Evidence,
  NegativeResult,
  Verification,
} from "@sciros/core";
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

function freezeDeep<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return Object.freeze(value.map((v) => freezeDeep(v))) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = freezeDeep(v);
  }
  return Object.freeze(out) as T;
}

function assertNoForeignEmbed(input: unknown, path: string): void {
  if (input === null || input === undefined) return;
  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i++) {
      const el = input[i];
      if (el && typeof el === "object" && !Array.isArray(el)) {
        const o = el as Record<string, unknown>;
        if (
          "evidence_id" in o ||
          "claim_id" in o ||
          "contradiction_id" in o ||
          "negative_result_id" in o ||
          "verification_id" in o
        ) {
          // string ids in arrays are fine; object with those keys is embed
          if (
            ("evidence_id" in o && typeof o.evidence_id === "string" && "source" in o) ||
            ("claim_id" in o && "standing" in o) ||
            ("contradiction_id" in o && "involved_claims" in o) ||
            ("negative_result_id" in o && "expected_observation" in o) ||
            ("verification_id" in o && "verification_outcome" in o)
          ) {
            throw new CanonicalEncodingError(
              "FOREIGN_EMBEDDED_OBJECT",
              `Foreign aggregate embedded at ${path}[${i}]`,
            );
          }
        }
      }
      assertNoForeignEmbed(el, `${path}[${i}]`);
    }
    return;
  }
  if (typeof input === "object") {
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      assertNoForeignEmbed(v, `${path}.${k}`);
    }
  }
}

function mapEvents(
  parentId: string,
  parentClass: CanonicalReference["target_class"],
  log: readonly {
    readonly event_id: string;
    readonly at: string;
    readonly from_state: string;
    readonly to_state: string;
    readonly authority_agent: string;
    readonly reason: string;
    readonly decision_ref?: string;
  }[],
): readonly CanonicalEvent[] {
  return Object.freeze(
    log.map((e) =>
      Object.freeze({
        event_id: e.event_id,
        parent_identity: parentId,
        parent_class: parentClass,
        at: e.at,
        from_state: String(e.from_state),
        to_state: String(e.to_state),
        authority_agent: e.authority_agent,
        reason: e.reason,
        ...(e.decision_ref !== undefined ? { decision_ref: e.decision_ref } : {}),
      }),
    ),
  );
}

function ref(
  target_class: CanonicalReference["target_class"],
  identity: string,
  role: string,
): CanonicalReference {
  return Object.freeze({ target_class, identity, role });
}

/**
 * Builds ENC-001 units from Core objects — projection only, no mutation.
 */
export class CanonicalEncodingBuilder {
  private readonly refs = new CanonicalReferenceResolver();

  buildClaim(claim: Claim): CanonicalUnit {
    assertNoForeignEmbed(claim, "claim");
    this.refs.assertOntologyPin(claim.ontology_ref);
    this.refs.assertSpecPin("Claim", claim.spec_ref);

    const references: CanonicalReference[] = [];
    for (const id of claim.supported_by ?? []) {
      this.refs.assertIdentity("Evidence", id);
      references.push(ref("Evidence", id, "supported_by"));
    }
    for (const id of claim.contested_by ?? []) {
      this.refs.assertIdentity("Contradiction", id);
      references.push(ref("Contradiction", id, "contested_by"));
    }
    for (const id of claim.qualified_by ?? []) {
      this.refs.assertIdentity("NegativeResult", id);
      references.push(ref("NegativeResult", id, "qualified_by"));
    }
    for (const id of claim.verified_via ?? []) {
      this.refs.assertIdentity("Verification", id);
      references.push(ref("Verification", id, "verified_via"));
    }
    if (claim.supersedes) {
      this.refs.assertIdentity("Claim", claim.supersedes);
      references.push(ref("Claim", claim.supersedes, "supersedes"));
    }
    if (claim.superseded_by) {
      this.refs.assertIdentity("Claim", claim.superseded_by);
      references.push(ref("Claim", claim.superseded_by, "superseded_by"));
    }

    const events = Object.freeze(
      (claim.standing_transition_log ?? []).map((e) =>
        Object.freeze({
          event_id: e.event_id,
          parent_identity: claim.claim_id,
          parent_class: "Claim" as const,
          at: e.at,
          from_state: String(e.from_standing),
          to_state: String(e.to_standing),
          authority_agent: e.authority_agent,
          reason: e.reason,
          ...(e.decision_ref !== undefined ? { decision_ref: e.decision_ref } : {}),
        }),
      ),
    );

    return this.finish(
      "ClaimUnit",
      claim.ontology_ref,
      claim.spec_ref,
      claim.claim_id,
      claim.claim_version,
      freezeDeep({
        claim_id: claim.claim_id,
        claim_version: claim.claim_version,
        standing: claim.standing,
        proposition: claim.proposition,
        scope: claim.scope,
        ethics_constraint_marker: claim.ethics_constraint_marker,
        created_by: claim.created_by,
        created_at: claim.created_at,
        ...(claim.ai_assisted !== undefined ? { ai_assisted: claim.ai_assisted } : {}),
        ...(claim.human_sponsor ? { human_sponsor: claim.human_sponsor } : {}),
        ...(claim.protocol_ref ? { protocol_ref: claim.protocol_ref } : {}),
        ...(claim.dataset_refs ? { dataset_refs: claim.dataset_refs } : {}),
        ...(claim.citation_refs ? { citation_refs: claim.citation_refs } : {}),
      }),
      references,
      events,
    );
  }

  buildEvidence(evidence: Evidence): CanonicalUnit {
    assertNoForeignEmbed(evidence, "evidence");
    this.refs.assertOntologyPin(evidence.ontology_ref);
    this.refs.assertSpecPin("Evidence", evidence.spec_ref);

    const references: CanonicalReference[] = [];
    for (const id of evidence.bears_on ?? []) {
      this.refs.assertIdentity("Claim", id);
      references.push(ref("Claim", id, "bears_on"));
    }

    const itemIds = new Set<string>();
    for (const item of evidence.items) {
      if (itemIds.has(item.item_id)) {
        throw new CanonicalEncodingError(
          "DUPLICATE_IDENTIFIER",
          `Duplicate item_id: ${item.item_id}`,
        );
      }
      itemIds.add(item.item_id);
    }

    const erte = mapEvents(
      evidence.evidence_id,
      "Evidence",
      (evidence.record_transition_log ?? []) as readonly {
        readonly event_id: string;
        readonly at: string;
        readonly from_state: string;
        readonly to_state: string;
        readonly authority_agent: string;
        readonly reason: string;
        readonly decision_ref?: string;
      }[],
    );
    const gae = (evidence.grade_assignment_log ?? []).map((e) =>
      Object.freeze({
        event_id: e.event_id,
        parent_identity: evidence.evidence_id,
        parent_class: "Evidence" as const,
        at: e.at,
        from_state: String(e.from_grade_ref),
        to_state: String(e.to_grade_ref),
        authority_agent: e.authority_agent,
        reason: e.reason,
        ...(e.decision_ref !== undefined ? { decision_ref: e.decision_ref } : {}),
      }),
    );

    return this.finish(
      "EvidenceUnit",
      evidence.ontology_ref,
      evidence.spec_ref,
      evidence.evidence_id,
      evidence.evidence_version,
      freezeDeep({
        evidence_id: evidence.evidence_id,
        evidence_version: evidence.evidence_version,
        record_state: evidence.record_state,
        summary: evidence.summary,
        source: evidence.source,
        provenance: evidence.provenance,
        grade_ref: evidence.grade_ref,
        items: evidence.items,
        ethics_constraint_marker: evidence.ethics_constraint_marker,
        created_by: evidence.created_by,
        created_at: evidence.created_at,
        ...(evidence.collection ? { collection: evidence.collection } : {}),
        ...(evidence.ai_assisted !== undefined ? { ai_assisted: evidence.ai_assisted } : {}),
        ...(evidence.human_sponsor ? { human_sponsor: evidence.human_sponsor } : {}),
        ...(evidence.protocol_ref ? { protocol_ref: evidence.protocol_ref } : {}),
        ...(evidence.dataset_refs ? { dataset_refs: evidence.dataset_refs } : {}),
        ...(evidence.citation_refs ? { citation_refs: evidence.citation_refs } : {}),
      }),
      references,
      Object.freeze([...erte, ...gae]),
    );
  }

  buildGradeDesignation(evidence: Evidence): CanonicalUnit {
    this.refs.assertOntologyPin(evidence.ontology_ref);
    return this.finish(
      "GradeDesignationUnit",
      evidence.ontology_ref,
      "SCI-003@0.1.0",
      evidence.evidence_id,
      evidence.evidence_version,
      freezeDeep({
        evidence_id: evidence.evidence_id,
        grade_ref: evidence.grade_ref,
      }),
      [ref("Evidence", evidence.evidence_id, "grades")],
      Object.freeze([]),
    );
  }

  buildContradiction(c: Contradiction): CanonicalUnit {
    assertNoForeignEmbed(c, "contradiction");
    this.refs.assertOntologyPin(c.ontology_ref);
    this.refs.assertSpecPin("Contradiction", c.spec_ref);

    const references: CanonicalReference[] = [];
    for (const id of c.involved_claims) {
      this.refs.assertIdentity("Claim", id);
      references.push(ref("Claim", id, "involves"));
    }
    for (const id of c.evidence_refs ?? []) {
      this.refs.assertIdentity("Evidence", id);
      references.push(ref("Evidence", id, "cites_evidence"));
    }

    const events = mapEvents(
      c.contradiction_id,
      "Contradiction",
      (c.record_transition_log ?? []) as readonly {
        readonly event_id: string;
        readonly at: string;
        readonly from_state: string;
        readonly to_state: string;
        readonly authority_agent: string;
        readonly reason: string;
        readonly decision_ref?: string;
      }[],
    );

    return this.finish(
      "ContradictionUnit",
      c.ontology_ref,
      c.spec_ref,
      c.contradiction_id,
      c.contradiction_version,
      freezeDeep({
        contradiction_id: c.contradiction_id,
        contradiction_version: c.contradiction_version,
        record_state: c.record_state,
        summary: c.summary,
        overlap_statement: c.overlap_statement,
        incompatibility_statement: c.incompatibility_statement,
        provenance: c.provenance,
        ethics_constraint_marker: c.ethics_constraint_marker,
        created_by: c.created_by,
        created_at: c.created_at,
        ...(c.resolution_note ? { resolution_note: c.resolution_note } : {}),
      }),
      references,
      events,
    );
  }

  buildNegativeResult(nr: NegativeResult): CanonicalUnit {
    assertNoForeignEmbed(nr, "negative_result");
    this.refs.assertOntologyPin(nr.ontology_ref);
    this.refs.assertSpecPin("NegativeResult", nr.spec_ref);

    const references: CanonicalReference[] = [];
    for (const id of nr.claim_refs ?? []) {
      this.refs.assertIdentity("Claim", id);
      references.push(ref("Claim", id, "qualifies_or_challenges"));
    }
    for (const id of nr.evidence_refs ?? []) {
      this.refs.assertIdentity("Evidence", id);
      references.push(ref("Evidence", id, "cites_evidence"));
    }
    for (const id of nr.contradiction_refs ?? []) {
      this.refs.assertIdentity("Contradiction", id);
      references.push(ref("Contradiction", id, "related_contradiction"));
    }
    for (const id of nr.verification_refs ?? []) {
      this.refs.assertIdentity("Verification", id);
      references.push(ref("Verification", id, "related_verification"));
    }

    const events = mapEvents(
      nr.negative_result_id,
      "NegativeResult",
      (nr.record_transition_log ?? []) as readonly {
        readonly event_id: string;
        readonly at: string;
        readonly from_state: string;
        readonly to_state: string;
        readonly authority_agent: string;
        readonly reason: string;
        readonly decision_ref?: string;
      }[],
    );

    return this.finish(
      "NegativeResultUnit",
      nr.ontology_ref,
      nr.spec_ref,
      nr.negative_result_id,
      nr.negative_result_version,
      freezeDeep({
        negative_result_id: nr.negative_result_id,
        negative_result_version: nr.negative_result_version,
        record_state: nr.record_state,
        summary: nr.summary,
        description: nr.description,
        expected_observation: nr.expected_observation,
        observed_absence: nr.observed_absence,
        scope: nr.scope,
        protocol_ref: nr.protocol_ref,
        sensitivity_context: nr.sensitivity_context,
        provenance: nr.provenance,
        ethics_constraint_marker: nr.ethics_constraint_marker,
        created_by: nr.created_by,
        created_at: nr.created_at,
        ...(nr.withdrawal_reason ? { withdrawal_reason: nr.withdrawal_reason } : {}),
      }),
      references,
      events,
    );
  }

  buildVerification(v: Verification): CanonicalUnit {
    assertNoForeignEmbed(v, "verification");
    this.refs.assertOntologyPin(v.ontology_ref);
    this.refs.assertSpecPin("Verification", v.spec_ref);

    const references: CanonicalReference[] = [];
    for (const id of v.claim_refs ?? []) {
      this.refs.assertIdentity("Claim", id);
      references.push(ref("Claim", id, "verifies_claim"));
    }
    for (const id of v.evidence_refs ?? []) {
      this.refs.assertIdentity("Evidence", id);
      references.push(ref("Evidence", id, "verifies_evidence"));
    }
    for (const id of v.negative_result_refs ?? []) {
      this.refs.assertIdentity("NegativeResult", id);
      references.push(ref("NegativeResult", id, "related_negative_result"));
    }
    for (const id of v.contradiction_refs ?? []) {
      this.refs.assertIdentity("Contradiction", id);
      references.push(ref("Contradiction", id, "related_contradiction"));
    }
    for (const id of v.grade_refs ?? []) {
      // SCI-003 grade_ref tokens — opaque Extension-class refs (not Core KO roots).
      references.push(ref("Extension", id, "grade_ref"));
    }

    const events = mapEvents(
      v.verification_id,
      "Verification",
      (v.record_transition_log ?? []) as readonly {
        readonly event_id: string;
        readonly at: string;
        readonly from_state: string;
        readonly to_state: string;
        readonly authority_agent: string;
        readonly reason: string;
        readonly decision_ref?: string;
      }[],
    );

    return this.finish(
      "VerificationUnit",
      v.ontology_ref,
      v.spec_ref,
      v.verification_id,
      v.verification_version,
      freezeDeep({
        verification_id: v.verification_id,
        verification_version: v.verification_version,
        record_state: v.record_state,
        verification_outcome: v.verification_outcome,
        summary: v.summary,
        description: v.description,
        scope: v.scope,
        protocol_ref: v.protocol_ref,
        verification_method: v.verification_method,
        verification_context: v.verification_context,
        verification_rationale: v.verification_rationale,
        provenance: v.provenance,
        ethics_constraint_marker: v.ethics_constraint_marker,
        created_by: v.created_by,
        created_at: v.created_at,
        ...(v.artifact_ref ? { artifact_ref: v.artifact_ref } : {}),
      }),
      references,
      events,
    );
  }

  private finish(
    unit_kind: CanonicalUnitKind,
    ontology_ref: string,
    spec_ref: string,
    identity: string,
    content_version: string,
    content: Readonly<Record<string, unknown>>,
    references: readonly CanonicalReference[],
    events: readonly CanonicalEvent[],
  ): CanonicalUnit {
    const envelope: CanonicalEnvelope = Object.freeze({
      encoding_authority: CanonicalEncodingVersion.authority,
      encoding_version: CanonicalEncodingVersion.version,
      unit_kind,
      ontology_ref,
      spec_ref,
      identity,
      content_version,
      references: Object.freeze([...references]),
      events: Object.freeze([...events]),
      extensions: Object.freeze([]),
      content,
    });
    return Object.freeze({ envelope, intact: true });
  }
}

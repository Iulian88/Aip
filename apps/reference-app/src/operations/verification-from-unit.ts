/**
 * Reconstruct Core Verification from a persisted VerificationUnit CanonicalUnit payload.
 * ENC content + envelope events/references → Verification (OPS-local; not a second Core API).
 * ai_assisted / human_sponsor are not in ENC content (OQ-025-001) — omit on reconstruct.
 * artifact_ref is content-only (O-025-04) — reconstruct from content, not envelope refs.
 */
import type {
  Verification,
  VerificationMethod,
  VerificationOutcome,
  VerificationProvenance,
  VerificationProvenanceCompleteness,
  VerificationRecordState,
  VerificationScope,
  VerificationTransitionEvent,
} from "@sciros/core";
import {
  VERIFICATION_METHODS,
  VERIFICATION_OUTCOMES,
  VERIFICATION_RECORD_STATES,
} from "@sciros/core";
import type { CanonicalUnit } from "@sciros/encoding";
import { OpsError } from "../errors/ops-error.js";

function isRecordState(v: unknown): v is VerificationRecordState {
  return (
    typeof v === "string" &&
    (VERIFICATION_RECORD_STATES as readonly string[]).includes(v)
  );
}

function isOutcome(v: unknown): v is VerificationOutcome {
  return (
    typeof v === "string" &&
    (VERIFICATION_OUTCOMES as readonly string[]).includes(v)
  );
}

function isMethod(v: unknown): v is VerificationMethod {
  return (
    typeof v === "string" &&
    (VERIFICATION_METHODS as readonly string[]).includes(v)
  );
}

function refsByRole(unit: CanonicalUnit, role: string): readonly string[] {
  return Object.freeze(
    unit.envelope.references
      .filter((r) => r.role === role)
      .map((r) => r.identity),
  );
}

function vteFromEvents(
  unit: CanonicalUnit,
): readonly VerificationTransitionEvent[] {
  const out: VerificationTransitionEvent[] = [];
  for (const e of unit.envelope.events) {
    const to = e.to_state;
    if (!isRecordState(to)) continue;
    const from = e.from_state;
    const from_state: VerificationRecordState | "null" =
      from === "null" || from === undefined
        ? "null"
        : isRecordState(from)
          ? from
          : "null";
    out.push(
      Object.freeze({
        event_id: e.event_id,
        at: e.at ?? "",
        from_state,
        to_state: to,
        authority_agent: e.authority_agent ?? "",
        reason: e.reason ?? "",
        ...(e.decision_ref !== undefined && e.decision_ref !== ""
          ? { decision_ref: e.decision_ref }
          : {}),
      }),
    );
  }
  return Object.freeze(out);
}

function asProvenance(raw: unknown): VerificationProvenance {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "VerificationUnit content.provenance missing",
    );
  }
  const p = raw as Record<string, unknown>;
  return Object.freeze({
    completeness: String(p.completeness ?? "") as VerificationProvenanceCompleteness,
    recorded_at: String(p.recorded_at ?? ""),
    custody_agent: String(p.custody_agent ?? ""),
    method_summary: String(p.method_summary ?? ""),
  });
}

function asScope(raw: unknown): VerificationScope {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "VerificationUnit content.scope missing",
    );
  }
  const s = raw as Record<string, unknown>;
  return Object.freeze({
    domain_context: String(s.domain_context ?? ""),
    bounds: String(s.bounds ?? ""),
    exclusions: String(s.exclusions ?? ""),
  });
}

/**
 * Decode Verification from intact VerificationUnit payload stored on PersistenceEntity.
 */
export function verificationFromVerificationUnitPayload(
  payload: unknown,
): Verification {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "VerificationUnit payload must be an object",
    );
  }
  const unit = payload as CanonicalUnit;
  if (!unit.envelope || unit.envelope.unit_kind !== "VerificationUnit") {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "Payload is not a VerificationUnit CanonicalUnit",
    );
  }
  if (unit.intact !== true) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "Cannot decode non-intact VerificationUnit",
    );
  }
  const content = unit.envelope.content as Record<string, unknown>;
  const record_state = content.record_state;
  if (!isRecordState(record_state)) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "VerificationUnit content.record_state invalid",
    );
  }
  const verification_outcome = content.verification_outcome;
  if (!isOutcome(verification_outcome)) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "VerificationUnit content.verification_outcome invalid",
    );
  }
  const verification_method = content.verification_method;
  if (!isMethod(verification_method)) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "VerificationUnit content.verification_method invalid",
    );
  }

  const claim_refs = refsByRole(unit, "verifies_claim");
  const evidence_refs = refsByRole(unit, "verifies_evidence");
  const contradiction_refs = refsByRole(unit, "related_contradiction");
  const negative_result_refs = refsByRole(unit, "related_negative_result");
  const grade_refs = refsByRole(unit, "grade_ref");
  const record_transition_log = vteFromEvents(unit);

  const verification: Verification = Object.freeze({
    verification_id: String(
      content.verification_id ?? unit.envelope.identity,
    ),
    ontology_ref: unit.envelope.ontology_ref,
    spec_ref: unit.envelope.spec_ref,
    verification_version: String(
      content.verification_version ?? unit.envelope.content_version,
    ),
    record_state,
    verification_outcome,
    summary: String(content.summary ?? ""),
    description: String(content.description ?? ""),
    scope: asScope(content.scope),
    protocol_ref: String(content.protocol_ref ?? ""),
    verification_method,
    verification_context: String(content.verification_context ?? ""),
    verification_rationale: String(content.verification_rationale ?? ""),
    ethics_constraint_marker: "non_clinical",
    provenance: asProvenance(content.provenance),
    created_by: String(content.created_by ?? ""),
    created_at: String(content.created_at ?? ""),
    ...(claim_refs.length > 0 ? { claim_refs } : {}),
    ...(evidence_refs.length > 0 ? { evidence_refs } : {}),
    ...(grade_refs.length > 0 ? { grade_refs } : {}),
    ...(contradiction_refs.length > 0 ? { contradiction_refs } : {}),
    ...(negative_result_refs.length > 0 ? { negative_result_refs } : {}),
    ...(typeof content.artifact_ref === "string" && content.artifact_ref.length > 0
      ? { artifact_ref: content.artifact_ref }
      : {}),
    ...(record_transition_log.length > 0
      ? { record_transition_log }
      : {}),
  });
  return verification;
}

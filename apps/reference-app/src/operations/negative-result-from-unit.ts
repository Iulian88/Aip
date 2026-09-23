/**
 * Reconstruct Core Negative Result from a persisted NegativeResultUnit CanonicalUnit payload.
 * ENC content + envelope events/references → NegativeResult (OPS-local; not a second Core API).
 * ai_assisted / human_sponsor are not in ENC content (OQ-024-001) — omit on reconstruct.
 */
import type {
  NegativeResult,
  NegativeResultProvenance,
  NegativeResultProvenanceCompleteness,
  NegativeResultRecordState,
  NegativeResultScope,
  NegativeResultTransitionEvent,
} from "@sciros/core";
import { NEGATIVE_RESULT_RECORD_STATES } from "@sciros/core";
import type { CanonicalUnit } from "@sciros/encoding";
import { OpsError } from "../errors/ops-error.js";

function isRecordState(v: unknown): v is NegativeResultRecordState {
  return (
    typeof v === "string" &&
    (NEGATIVE_RESULT_RECORD_STATES as readonly string[]).includes(v)
  );
}

function refsByRole(unit: CanonicalUnit, role: string): readonly string[] {
  return Object.freeze(
    unit.envelope.references
      .filter((r) => r.role === role)
      .map((r) => r.identity),
  );
}

function nrteFromEvents(
  unit: CanonicalUnit,
): readonly NegativeResultTransitionEvent[] {
  const out: NegativeResultTransitionEvent[] = [];
  for (const e of unit.envelope.events) {
    const to = e.to_state;
    if (!isRecordState(to)) continue;
    const from = e.from_state;
    const from_state: NegativeResultRecordState | "null" =
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
        decision_ref: e.decision_ref ?? "",
      }),
    );
  }
  return Object.freeze(out);
}

function asProvenance(raw: unknown): NegativeResultProvenance {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "NegativeResultUnit content.provenance missing",
    );
  }
  const p = raw as Record<string, unknown>;
  return Object.freeze({
    completeness: String(p.completeness ?? "") as NegativeResultProvenanceCompleteness,
    recorded_at: String(p.recorded_at ?? ""),
    custody_agent: String(p.custody_agent ?? ""),
    method_summary: String(p.method_summary ?? ""),
  });
}

function asScope(raw: unknown): NegativeResultScope {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "NegativeResultUnit content.scope missing",
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
 * Decode Negative Result from intact NegativeResultUnit payload stored on PersistenceEntity.
 */
export function negativeResultFromNegativeResultUnitPayload(
  payload: unknown,
): NegativeResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "NegativeResultUnit payload must be an object",
    );
  }
  const unit = payload as CanonicalUnit;
  if (!unit.envelope || unit.envelope.unit_kind !== "NegativeResultUnit") {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "Payload is not a NegativeResultUnit CanonicalUnit",
    );
  }
  if (unit.intact !== true) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "Cannot decode non-intact NegativeResultUnit",
    );
  }
  const content = unit.envelope.content as Record<string, unknown>;
  const record_state = content.record_state;
  if (!isRecordState(record_state)) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "NegativeResultUnit content.record_state invalid",
    );
  }

  const claim_refs = refsByRole(unit, "qualifies_or_challenges");
  const evidence_refs = refsByRole(unit, "cites_evidence");
  const contradiction_refs = refsByRole(unit, "related_contradiction");
  const verification_refs = refsByRole(unit, "related_verification");
  const record_transition_log = nrteFromEvents(unit);

  const negativeResult: NegativeResult = Object.freeze({
    negative_result_id: String(
      content.negative_result_id ?? unit.envelope.identity,
    ),
    ontology_ref: unit.envelope.ontology_ref,
    spec_ref: unit.envelope.spec_ref,
    negative_result_version: String(
      content.negative_result_version ?? unit.envelope.content_version,
    ),
    record_state,
    summary: String(content.summary ?? ""),
    description: String(content.description ?? ""),
    expected_observation: String(content.expected_observation ?? ""),
    observed_absence: String(content.observed_absence ?? ""),
    scope: asScope(content.scope),
    protocol_ref: String(content.protocol_ref ?? ""),
    sensitivity_context: String(content.sensitivity_context ?? ""),
    ethics_constraint_marker: "non_clinical",
    provenance: asProvenance(content.provenance),
    created_by: String(content.created_by ?? ""),
    created_at: String(content.created_at ?? ""),
    ...(claim_refs.length > 0 ? { claim_refs } : {}),
    ...(evidence_refs.length > 0 ? { evidence_refs } : {}),
    ...(contradiction_refs.length > 0 ? { contradiction_refs } : {}),
    ...(verification_refs.length > 0 ? { verification_refs } : {}),
    ...(typeof content.withdrawal_reason === "string"
      ? { withdrawal_reason: content.withdrawal_reason }
      : {}),
    ...(record_transition_log.length > 0
      ? { record_transition_log }
      : {}),
  });
  return negativeResult;
}

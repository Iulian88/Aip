/**
 * Reconstruct Core Contradiction from a persisted ContradictionUnit CanonicalUnit payload.
 * ENC content + envelope events/references → Contradiction (OPS-local; not a second Core API).
 * ai_assisted / human_sponsor are not in ENC content (OQ-023-002) — omit on reconstruct.
 */
import type {
  Contradiction,
  ContradictionProvenance,
  ContradictionProvenanceCompleteness,
  ContradictionRecordState,
  ContradictionRecordTransitionEvent,
} from "@sciros/core";
import { CONTRADICTION_RECORD_STATES } from "@sciros/core";
import type { CanonicalUnit } from "@sciros/encoding";
import { OpsError } from "../errors/ops-error.js";

function isRecordState(v: unknown): v is ContradictionRecordState {
  return (
    typeof v === "string" &&
    (CONTRADICTION_RECORD_STATES as readonly string[]).includes(v)
  );
}

function refsByRole(unit: CanonicalUnit, role: string): readonly string[] {
  return Object.freeze(
    unit.envelope.references
      .filter((r) => r.role === role)
      .map((r) => r.identity),
  );
}

function crteFromEvents(
  unit: CanonicalUnit,
): readonly ContradictionRecordTransitionEvent[] {
  const out: ContradictionRecordTransitionEvent[] = [];
  for (const e of unit.envelope.events) {
    const to = e.to_state;
    if (!isRecordState(to)) continue;
    const from = e.from_state;
    const from_state: ContradictionRecordState | "null" =
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
        ...(e.decision_ref !== undefined ? { decision_ref: e.decision_ref } : {}),
      }),
    );
  }
  return Object.freeze(out);
}

function asProvenance(raw: unknown): ContradictionProvenance {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "ContradictionUnit content.provenance missing",
    );
  }
  const p = raw as Record<string, unknown>;
  return Object.freeze({
    completeness: String(p.completeness ?? "") as ContradictionProvenanceCompleteness,
    recorded_at: String(p.recorded_at ?? ""),
    custody_agent: String(p.custody_agent ?? ""),
    method_summary: String(p.method_summary ?? ""),
  });
}

/**
 * Decode Contradiction from intact ContradictionUnit payload stored on PersistenceEntity.
 */
export function contradictionFromContradictionUnitPayload(
  payload: unknown,
): Contradiction {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "ContradictionUnit payload must be an object",
    );
  }
  const unit = payload as CanonicalUnit;
  if (!unit.envelope || unit.envelope.unit_kind !== "ContradictionUnit") {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "Payload is not a ContradictionUnit CanonicalUnit",
    );
  }
  if (unit.intact !== true) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "Cannot decode non-intact ContradictionUnit",
    );
  }
  const content = unit.envelope.content as Record<string, unknown>;
  const record_state = content.record_state;
  if (!isRecordState(record_state)) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "ContradictionUnit content.record_state invalid",
    );
  }

  const involved_claims = refsByRole(unit, "involves");
  if (involved_claims.length < 2) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "ContradictionUnit involves references must have at least 2 entries",
    );
  }
  const evidence_refs = refsByRole(unit, "cites_evidence");
  const record_transition_log = crteFromEvents(unit);

  const contradiction: Contradiction = Object.freeze({
    contradiction_id: String(
      content.contradiction_id ?? unit.envelope.identity,
    ),
    ontology_ref: unit.envelope.ontology_ref,
    spec_ref: unit.envelope.spec_ref,
    contradiction_version: String(
      content.contradiction_version ?? unit.envelope.content_version,
    ),
    record_state,
    summary: String(content.summary ?? ""),
    involved_claims,
    overlap_statement: String(content.overlap_statement ?? ""),
    incompatibility_statement: String(content.incompatibility_statement ?? ""),
    ethics_constraint_marker: "non_clinical",
    provenance: asProvenance(content.provenance),
    created_by: String(content.created_by ?? ""),
    created_at: String(content.created_at ?? ""),
    ...(evidence_refs.length > 0 ? { evidence_refs } : {}),
    ...(typeof content.resolution_note === "string"
      ? { resolution_note: content.resolution_note }
      : {}),
    ...(record_transition_log.length > 0
      ? { record_transition_log }
      : {}),
  });
  return contradiction;
}

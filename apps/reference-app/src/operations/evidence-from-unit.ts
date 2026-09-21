/**
 * Reconstruct Core Evidence from a persisted EvidenceUnit CanonicalUnit payload.
 * ENC content + envelope events/references → Evidence (OPS-local; not a second Core API).
 */
import type {
  Evidence,
  EvidenceCollection,
  EvidenceItem,
  EvidenceProvenance,
  EvidenceRecordState,
  EvidenceRecordTransitionEvent,
  EvidenceSource,
  GradeAssignmentEvent,
  ItemState,
  ProvenanceCompleteness,
  SourceClass,
  SourceState,
  CollectionState,
} from "@sciros/core";
import { EVIDENCE_RECORD_STATES } from "@sciros/core";
import type { CanonicalUnit } from "@sciros/encoding";
import { OpsError } from "../errors/ops-error.js";

function isRecordState(v: unknown): v is EvidenceRecordState {
  return (
    typeof v === "string" &&
    (EVIDENCE_RECORD_STATES as readonly string[]).includes(v)
  );
}

function refsByRole(unit: CanonicalUnit, role: string): readonly string[] {
  return Object.freeze(
    unit.envelope.references
      .filter((r) => r.role === role)
      .map((r) => r.identity),
  );
}

function erteFromEvents(unit: CanonicalUnit): readonly EvidenceRecordTransitionEvent[] {
  const out: EvidenceRecordTransitionEvent[] = [];
  for (const e of unit.envelope.events) {
    const to = e.to_state;
    if (!isRecordState(to)) continue;
    const from = e.from_state;
    const from_state: EvidenceRecordState | "null" =
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

/**
 * Reconstruct GAE from envelope events whose to_state is not a Record State
 * (ENC maps from_grade_ref/to_grade_ref into from_state/to_state).
 */
function gaeFromEvents(
  unit: CanonicalUnit,
  evidence_id: string,
): readonly GradeAssignmentEvent[] | undefined {
  const out: GradeAssignmentEvent[] = [];
  for (const e of unit.envelope.events) {
    if (isRecordState(e.to_state)) continue;
    if (typeof e.to_state !== "string" || e.to_state.length < 1) continue;
    const fromRaw = e.from_state;
    const from_grade_ref: string | "null" =
      fromRaw === "null" || fromRaw === undefined ? "null" : String(fromRaw);
    out.push(
      Object.freeze({
        event_id: e.event_id,
        at: e.at ?? "",
        evidence_id,
        from_grade_ref,
        to_grade_ref: e.to_state,
        authority_agent: e.authority_agent ?? "",
        reason: e.reason ?? "",
        decision_ref: e.decision_ref ?? "",
      }),
    );
  }
  return out.length > 0 ? Object.freeze(out) : undefined;
}

function asSource(raw: unknown): EvidenceSource {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new OpsError("INVALID_COMMAND_STATE", "EvidenceUnit content.source missing");
  }
  const s = raw as Record<string, unknown>;
  return Object.freeze({
    source_class: String(s.source_class ?? "") as SourceClass,
    source_locator: String(s.source_locator ?? ""),
    source_state: String(s.source_state ?? "") as SourceState,
  });
}

function asProvenance(raw: unknown): EvidenceProvenance {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "EvidenceUnit content.provenance missing",
    );
  }
  const p = raw as Record<string, unknown>;
  return Object.freeze({
    completeness: String(p.completeness ?? "") as ProvenanceCompleteness,
    obtained_at: String(p.obtained_at ?? ""),
    transform_summary: String(p.transform_summary ?? ""),
    custody_agent: String(p.custody_agent ?? ""),
    ...(typeof p.protocol_ref === "string" ? { protocol_ref: p.protocol_ref } : {}),
    ...(typeof p.dataset_ref === "string" ? { dataset_ref: p.dataset_ref } : {}),
    ...(typeof p.transform_artifact_ref === "string"
      ? { transform_artifact_ref: p.transform_artifact_ref }
      : {}),
  });
}

function asItems(raw: unknown): readonly EvidenceItem[] {
  if (!Array.isArray(raw)) {
    throw new OpsError("INVALID_COMMAND_STATE", "EvidenceUnit content.items missing");
  }
  return Object.freeze(
    raw.map((item) => {
      const i = item as Record<string, unknown>;
      return Object.freeze({
        item_id: String(i.item_id ?? ""),
        content_summary: String(i.content_summary ?? ""),
        item_state: String(i.item_state ?? "") as ItemState,
        ...(typeof i.observation_ref === "string"
          ? { observation_ref: i.observation_ref }
          : {}),
        ...(typeof i.finding_ref === "string" ? { finding_ref: i.finding_ref } : {}),
        ...(typeof i.units === "string" ? { units: i.units } : {}),
        ...(typeof i.conditions === "string" ? { conditions: i.conditions } : {}),
      });
    }),
  );
}

function asCollection(raw: unknown): EvidenceCollection | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const c = raw as Record<string, unknown>;
  const members = Array.isArray(c.member_item_ids)
    ? Object.freeze([...c.member_item_ids].map(String))
    : Object.freeze([] as string[]);
  return Object.freeze({
    collection_id: String(c.collection_id ?? ""),
    member_item_ids: members,
    collection_state: String(c.collection_state ?? "") as CollectionState,
  });
}

/**
 * Decode Evidence from intact EvidenceUnit payload stored on PersistenceEntity.
 */
export function evidenceFromEvidenceUnitPayload(payload: unknown): Evidence {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "EvidenceUnit payload must be an object",
    );
  }
  const unit = payload as CanonicalUnit;
  if (!unit.envelope || unit.envelope.unit_kind !== "EvidenceUnit") {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "Payload is not an EvidenceUnit CanonicalUnit",
    );
  }
  if (unit.intact !== true) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "Cannot decode non-intact EvidenceUnit",
    );
  }
  const content = unit.envelope.content as Record<string, unknown>;
  const record_state = content.record_state;
  if (!isRecordState(record_state)) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "EvidenceUnit content.record_state invalid",
    );
  }

  const evidence_id = String(content.evidence_id ?? unit.envelope.identity);
  const bears_on = refsByRole(unit, "bears_on");
  const record_transition_log = erteFromEvents(unit);
  const grade_assignment_log = gaeFromEvents(unit, evidence_id);
  const collection = asCollection(content.collection);

  const evidence: Evidence = Object.freeze({
    evidence_id,
    ontology_ref: unit.envelope.ontology_ref,
    spec_ref: unit.envelope.spec_ref,
    evidence_version: String(
      content.evidence_version ?? unit.envelope.content_version,
    ),
    summary: String(content.summary ?? ""),
    record_state,
    source: asSource(content.source),
    provenance: asProvenance(content.provenance),
    grade_ref: String(content.grade_ref ?? ""),
    ethics_constraint_marker: "non_clinical",
    created_by: String(content.created_by ?? ""),
    created_at: String(content.created_at ?? ""),
    items: asItems(content.items),
    ...(collection !== undefined ? { collection } : {}),
    ...(bears_on.length > 0 ? { bears_on } : {}),
    ...(typeof content.ai_assisted === "boolean"
      ? { ai_assisted: content.ai_assisted }
      : {}),
    ...(typeof content.human_sponsor === "string"
      ? { human_sponsor: content.human_sponsor }
      : {}),
    ...(typeof content.protocol_ref === "string"
      ? { protocol_ref: content.protocol_ref }
      : {}),
    ...(Array.isArray(content.dataset_refs)
      ? { dataset_refs: Object.freeze([...content.dataset_refs] as string[]) }
      : {}),
    ...(Array.isArray(content.citation_refs)
      ? { citation_refs: Object.freeze([...content.citation_refs] as string[]) }
      : {}),
    ...(record_transition_log.length > 0
      ? { record_transition_log }
      : {}),
    ...(grade_assignment_log !== undefined
      ? { grade_assignment_log }
      : {}),
  });
  return evidence;
}

/**
 * Reconstruct Core Claim from a persisted ClaimUnit CanonicalUnit payload.
 * ENC content + envelope events/references → Claim (OPS-local; not a second Core API).
 */
import type {
  Claim,
  ClaimScope,
  ClaimStanding,
  StandingTransitionEvent,
} from "@sciros/core";
import { CLAIM_STANDINGS } from "@sciros/core";
import type { CanonicalUnit } from "@sciros/encoding";
import { OpsError } from "../errors/ops-error.js";

function isStanding(v: unknown): v is ClaimStanding {
  return typeof v === "string" && (CLAIM_STANDINGS as readonly string[]).includes(v);
}

function refsByRole(
  unit: CanonicalUnit,
  role: string,
): readonly string[] {
  return Object.freeze(
    unit.envelope.references
      .filter((r) => r.role === role)
      .map((r) => r.identity),
  );
}

function firstRef(unit: CanonicalUnit, role: string): string | undefined {
  const ids = refsByRole(unit, role);
  return ids.length > 0 ? ids[0] : undefined;
}

function steFromEvents(unit: CanonicalUnit): readonly StandingTransitionEvent[] {
  const out: StandingTransitionEvent[] = [];
  for (const e of unit.envelope.events) {
    const from = e.from_state;
    const to = e.to_state;
    if (!isStanding(to)) continue;
    const from_standing: ClaimStanding | "null" =
      from === "null" || from === undefined
        ? "null"
        : isStanding(from)
          ? from
          : "null";
    out.push(
      Object.freeze({
        event_id: e.event_id,
        at: e.at ?? "",
        from_standing,
        to_standing: to,
        authority_agent: e.authority_agent ?? "",
        reason: e.reason ?? "",
        ...(e.decision_ref !== undefined ? { decision_ref: e.decision_ref } : {}),
      }),
    );
  }
  return Object.freeze(out);
}

/**
 * Decode Claim from intact ClaimUnit payload stored on PersistenceEntity.
 */
export function claimFromClaimUnitPayload(payload: unknown): Claim {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new OpsError("INVALID_COMMAND_STATE", "ClaimUnit payload must be an object");
  }
  const unit = payload as CanonicalUnit;
  if (!unit.envelope || unit.envelope.unit_kind !== "ClaimUnit") {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "Payload is not a ClaimUnit CanonicalUnit",
    );
  }
  if (unit.intact !== true) {
    throw new OpsError("INVALID_COMMAND_STATE", "Cannot decode non-intact ClaimUnit");
  }
  const content = unit.envelope.content as Record<string, unknown>;
  const standing = content.standing;
  if (!isStanding(standing)) {
    throw new OpsError("INVALID_COMMAND_STATE", "ClaimUnit content.standing invalid");
  }
  const scopeRaw = content.scope;
  if (!scopeRaw || typeof scopeRaw !== "object" || Array.isArray(scopeRaw)) {
    throw new OpsError("INVALID_COMMAND_STATE", "ClaimUnit content.scope missing");
  }
  const s = scopeRaw as Record<string, unknown>;
  const scope: ClaimScope = Object.freeze({
    domain_context: String(s.domain_context ?? ""),
    bounds: String(s.bounds ?? ""),
    exclusions: String(s.exclusions ?? ""),
  });

  const supported_by = refsByRole(unit, "supported_by");
  const contested_by = refsByRole(unit, "contested_by");
  const qualified_by = refsByRole(unit, "qualified_by");
  const verified_via = refsByRole(unit, "verified_via");
  const supersedes = firstRef(unit, "supersedes");
  const superseded_by = firstRef(unit, "superseded_by");

  const claim: Claim = Object.freeze({
    claim_id: String(content.claim_id ?? unit.envelope.identity),
    ontology_ref: unit.envelope.ontology_ref,
    spec_ref: unit.envelope.spec_ref,
    claim_version: String(content.claim_version ?? unit.envelope.content_version),
    proposition: String(content.proposition ?? ""),
    scope,
    standing,
    ethics_constraint_marker: "non_clinical",
    created_by: String(content.created_by ?? ""),
    created_at: String(content.created_at ?? ""),
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
    ...(supported_by.length > 0 ? { supported_by } : {}),
    ...(contested_by.length > 0 ? { contested_by } : {}),
    ...(qualified_by.length > 0 ? { qualified_by } : {}),
    ...(verified_via.length > 0 ? { verified_via } : {}),
    ...(supersedes !== undefined ? { supersedes } : {}),
    ...(superseded_by !== undefined ? { superseded_by } : {}),
    standing_transition_log: steFromEvents(unit),
  });
  return claim;
}

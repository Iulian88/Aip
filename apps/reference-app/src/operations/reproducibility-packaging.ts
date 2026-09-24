/**
 * Sprint 026 — Provenance Projection & Reproducibility Packaging helpers.
 * OPS-local, non-scientific. Does NOT invent Core/Persistence authority.
 */
import { createHash } from "node:crypto";
import type { PersistenceEntity, PersistenceEvent } from "@sciros/persistence";
import { INITIAL_REVISION_ID } from "@sciros/persistence";
import { stableStringify } from "@sciros/serialization";
import { OpsError } from "../errors/ops-error.js";
import type { SessionMemberRef } from "../session/types.js";
import type { WorkspaceMemberRef } from "../workspace/types.js";

export const REPRO_PACK_SCHEMA_ID = "aip.repro.pack@1.0.0";
export const PACKAGE_ID = /^rpkg:[A-Za-z0-9._~-]{1,128}$/;

export type PackagingProfile = "minimal" | "with_ops_events";
export type RevisionPolicy =
  | "heads_only"
  | "explicit_revisions"
  | "full_lineage";

export interface PackageRevisionEntry {
  readonly revision_id: string;
  readonly predecessor_revision_id?: string;
  readonly storage_key: string;
  readonly intact: boolean;
  readonly ser: string;
}

export interface PackageArtifactEntry {
  readonly identity: string;
  readonly unit_kind: string;
  readonly head_revision_id: string;
  readonly revisions: readonly PackageRevisionEntry[];
}

export interface PackageMemberRef {
  readonly entity_kind: string;
  readonly unit_kind?: string;
  readonly identity: string;
}

export interface PackageOpsEvent {
  readonly event_id: string;
  readonly parent_identity: string;
  readonly event_type: string;
  readonly ordinal: number;
  readonly at?: string;
}

export interface ReproducibilityPackage {
  readonly schema_id: string;
  readonly package_id: string;
  readonly packaging_profile: PackagingProfile;
  readonly included_identities: readonly string[];
  readonly revision_policy: RevisionPolicy;
  readonly artifact_entries: readonly PackageArtifactEntry[];
  readonly source_locators: readonly string[];
  readonly axis_declaration: Readonly<Record<string, boolean>>;
  readonly content_digest: string;
  readonly session_id?: string;
  readonly workspace_id?: string;
  readonly member_refs?: readonly PackageMemberRef[];
  readonly ops_events?: readonly PackageOpsEvent[];
  readonly generated_at?: string;
}

export function assertPackageId(package_id: string): void {
  if (typeof package_id !== "string" || !PACKAGE_ID.test(package_id)) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "package_id must match rpkg:[A-Za-z0-9._~-]{1,128}",
    );
  }
}

export function assertPackagingProfile(
  v: string,
): asserts v is PackagingProfile {
  if (v !== "minimal" && v !== "with_ops_events") {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      `unknown packaging_profile: ${v}`,
    );
  }
}

export function assertRevisionPolicy(v: string): asserts v is RevisionPolicy {
  if (
    v !== "heads_only" &&
    v !== "explicit_revisions" &&
    v !== "full_lineage"
  ) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      `unknown revision_policy: ${v}`,
    );
  }
}

/** Resolve unit_kind from certified scientific identity grammar (O-FAR-026-01). */
export function unitKindFromIdentity(identity: string): string {
  if (identity.startsWith("claim:")) return "ClaimUnit";
  if (identity.startsWith("evidence:")) return "EvidenceUnit";
  if (identity.startsWith("contradiction:")) return "ContradictionUnit";
  if (identity.startsWith("negresult:")) return "NegativeResultUnit";
  if (identity.startsWith("verification:")) return "VerificationUnit";
  throw new OpsError(
    "INVALID_COMMAND_STATE",
    `cannot resolve unit_kind for identity: ${identity}`,
  );
}

export function unitKindFromEntity(entity: PersistenceEntity): string {
  const payload = entity.payload as {
    envelope?: { unit_kind?: string };
    unit_kind?: string;
  };
  if (typeof payload.unit_kind === "string" && payload.unit_kind.length > 0) {
    return payload.unit_kind;
  }
  const uk = payload.envelope?.unit_kind;
  if (typeof uk === "string" && uk.length > 0) return uk;
  throw new OpsError(
    "INVALID_COMMAND_STATE",
    `CanonicalUnit missing unit_kind: ${entity.identity}`,
  );
}

export function sortCodepoint(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function extractSourceLocators(
  entities: readonly PersistenceEntity[],
): readonly string[] {
  const set = new Set<string>();
  for (const e of entities) {
    const payload = e.payload as {
      envelope?: { content?: Record<string, unknown>; unit_kind?: string };
    };
    const content = payload.envelope?.content;
    if (!content || typeof content !== "object") continue;
    const uk = payload.envelope?.unit_kind;
    if (uk === "EvidenceUnit") {
      const source = content.source;
      if (source && typeof source === "object" && !Array.isArray(source)) {
        const loc = (source as { source_locator?: unknown }).source_locator;
        if (typeof loc === "string" && loc.trim().length > 0) set.add(loc);
      }
    }
    if (uk === "VerificationUnit") {
      const art = content.artifact_ref;
      if (typeof art === "string" && art.trim().length > 0) set.add(art);
    }
  }
  return Object.freeze([...set].sort(sortCodepoint));
}

export function filterMemberRefs(
  members: readonly (SessionMemberRef | WorkspaceMemberRef)[],
  included: ReadonlySet<string>,
): readonly PackageMemberRef[] {
  const out: PackageMemberRef[] = [];
  for (const m of members) {
    if (!included.has(m.identity)) continue;
    out.push(
      Object.freeze({
        entity_kind: m.entity_kind,
        ...(m.unit_kind !== undefined ? { unit_kind: m.unit_kind } : {}),
        identity: m.identity,
      }),
    );
  }
  out.sort((a, b) => {
    const ek = sortCodepoint(a.entity_kind, b.entity_kind);
    if (ek !== 0) return ek;
    const uk = sortCodepoint(a.unit_kind ?? "", b.unit_kind ?? "");
    if (uk !== 0) return uk;
    return sortCodepoint(a.identity, b.identity);
  });
  return Object.freeze(out);
}

export function projectOpsEvents(
  events: readonly PersistenceEvent[],
): readonly PackageOpsEvent[] {
  const out: PackageOpsEvent[] = events.map((e) =>
    Object.freeze({
      event_id: e.event_id,
      parent_identity: e.parent_identity,
      event_type: e.event_type,
      ordinal: e.ordinal,
      ...(e.at !== undefined ? { at: e.at } : {}),
    }),
  );
  out.sort((a, b) => {
    const p = sortCodepoint(a.parent_identity, b.parent_identity);
    if (p !== 0) return p;
    if (a.ordinal !== b.ordinal) return a.ordinal - b.ordinal;
    return sortCodepoint(a.event_id, b.event_id);
  });
  return Object.freeze(out);
}

export function revisionEntryFromEntity(
  entity: PersistenceEntity,
  ser: string,
): PackageRevisionEntry {
  if (entity.intact !== true) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      `Cannot package non-intact unit: ${entity.identity}`,
    );
  }
  return Object.freeze({
    revision_id: entity.revision_id ?? INITIAL_REVISION_ID,
    ...(entity.predecessor_revision_id !== undefined
      ? { predecessor_revision_id: entity.predecessor_revision_id }
      : {}),
    storage_key: entity.storage_key,
    intact: true,
    ser,
  });
}

export function axisDeclaration(input: {
  readonly packaging_profile: PackagingProfile;
  readonly include_session: boolean;
  readonly include_workspace: boolean;
  readonly include_ops_events: boolean;
}): Readonly<Record<string, boolean>> {
  return Object.freeze({
    scientific_provenance: true,
    operational_audit_history: input.include_ops_events,
    source_locator: true,
    persistence_history: true,
    revision_lineage: true,
    research_session_context: input.include_session,
    research_workspace_context: input.include_workspace,
  });
}

/** Build package without digest, then attach SHA-256 hex digest. */
export function sealReproducibilityPackage(
  withoutDigest: Omit<ReproducibilityPackage, "content_digest">,
): ReproducibilityPackage {
  const bodySer = stableStringify(withoutDigest);
  const content_digest = createHash("sha256")
    .update(bodySer, "utf8")
    .digest("hex");
  return Object.freeze({
    ...withoutDigest,
    content_digest,
  });
}

export function serializeReproducibilityPackage(
  pkg: ReproducibilityPackage,
): string {
  return stableStringify(pkg);
}

/**
 * Verify packaging digest. Does NOT restore Persistence.
 */
export function verifyReproducibilityPackage(
  serOrPackage: string | ReproducibilityPackage,
): { readonly ok: true } {
  const pkg: ReproducibilityPackage =
    typeof serOrPackage === "string"
      ? (JSON.parse(serOrPackage) as ReproducibilityPackage)
      : serOrPackage;
  if (!pkg || typeof pkg !== "object") {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "ReproducibilityPackage must be an object",
    );
  }
  if (pkg.schema_id !== REPRO_PACK_SCHEMA_ID) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      `unsupported schema_id: ${String(pkg.schema_id)}`,
    );
  }
  const { content_digest: claimed, ...rest } = pkg;
  if (typeof claimed !== "string" || claimed.length < 1) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "content_digest missing",
    );
  }
  const recomputed = createHash("sha256")
    .update(stableStringify(rest), "utf8")
    .digest("hex");
  if (recomputed !== claimed) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "content_digest mismatch",
    );
  }
  return Object.freeze({ ok: true as const });
}

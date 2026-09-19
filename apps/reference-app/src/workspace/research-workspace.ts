/**
 * ResearchWorkspace — OPS organizational boundary (SPEC-018 P-018-001…003).
 * Memory-only. Not a scientific entity. Not persisted.
 */

import { OpsError } from "../errors/ops-error.js";
import type { ResearchSession } from "../session/research-session.js";
import type {
  OpenResearchWorkspaceInput,
  WorkspaceMemberRef,
} from "./types.js";

function memberKey(ref: WorkspaceMemberRef): string {
  return `${ref.entity_kind}\0${ref.identity}\0${ref.unit_kind ?? ""}`;
}

function compareMembers(a: WorkspaceMemberRef, b: WorkspaceMemberRef): number {
  if (a.entity_kind < b.entity_kind) return -1;
  if (a.entity_kind > b.entity_kind) return 1;
  if (a.identity < b.identity) return -1;
  if (a.identity > b.identity) return 1;
  const ua = a.unit_kind ?? "";
  const ub = b.unit_kind ?? "";
  if (ua < ub) return -1;
  if (ua > ub) return 1;
  return 0;
}

export class ResearchWorkspace {
  readonly research_workspace_id: string;
  readonly title?: string;
  readonly purpose?: string;
  private readonly memberByKey = new Map<string, WorkspaceMemberRef>();
  private readonly boundSessionIdSet = new Set<string>();

  private constructor(input: OpenResearchWorkspaceInput) {
    this.research_workspace_id = input.research_workspace_id;
    if (input.title !== undefined) this.title = input.title;
    if (input.purpose !== undefined) this.purpose = input.purpose;
  }

  /**
   * Open an in-memory research workspace.
   * `research_workspace_id` MUST be caller-supplied and deterministic.
   */
  static open(input: OpenResearchWorkspaceInput): ResearchWorkspace {
    if (
      typeof input.research_workspace_id !== "string" ||
      input.research_workspace_id.trim().length < 1
    ) {
      throw new OpsError(
        "INVALID_WORKSPACE",
        "research_workspace_id must be a non-empty caller-supplied string",
      );
    }
    return new ResearchWorkspace({
      research_workspace_id: input.research_workspace_id.trim(),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.purpose !== undefined ? { purpose: input.purpose } : {}),
    });
  }

  /**
   * Bind a memory-only ResearchSession to this workspace (at most one workspace).
   * OPS metadata only — does not persist the session (SPEC-018 B1–B4).
   */
  bindSession(session: ResearchSession): void {
    session.bindWorkspace(this.research_workspace_id);
    this.boundSessionIdSet.add(session.research_session_id);
  }

  /** Explicit workspace membership upsert (non-authoritative OPS index). */
  registerMember(ref: WorkspaceMemberRef): void {
    this.upsertMember(ref);
  }

  /** Internal upsert used by session-driven membership (M3). */
  upsertMember(ref: WorkspaceMemberRef): void {
    if (typeof ref.identity !== "string" || ref.identity.trim().length < 1) {
      throw new OpsError("INVALID_MEMBERSHIP", "member identity must be non-empty");
    }
    if (typeof ref.entity_kind !== "string" || ref.entity_kind.length < 1) {
      throw new OpsError("INVALID_MEMBERSHIP", "member entity_kind is required");
    }
    if (ref.entity_kind === "CanonicalUnit") {
      if (typeof ref.unit_kind !== "string" || ref.unit_kind.trim().length < 1) {
        throw new OpsError(
          "INVALID_MEMBERSHIP",
          "unit_kind is required for CanonicalUnit membership",
        );
      }
    }
    const frozen: WorkspaceMemberRef = Object.freeze({
      entity_kind: ref.entity_kind,
      identity: ref.identity.trim(),
      ...(ref.unit_kind !== undefined ? { unit_kind: ref.unit_kind } : {}),
    });
    this.memberByKey.set(memberKey(frozen), frozen);
  }

  members(): readonly WorkspaceMemberRef[] {
    const list = [...this.memberByKey.values()].sort(compareMembers);
    return Object.freeze(list);
  }

  boundSessionIds(): readonly string[] {
    return Object.freeze([...this.boundSessionIdSet].sort());
  }
}


/**
 * ResearchSession — OPS-owned, memory-only (SPEC-016A P-016-001).
 * Not a scientific entity. Not persisted.
 * May optionally bind to at most one ResearchWorkspace (SPEC-018 P-018-001).
 */

import { OpsError } from "../errors/ops-error.js";
import type { OpenResearchSessionInput, SessionMemberRef } from "./types.js";

export class ResearchSession {
  readonly research_session_id: string;
  readonly title?: string;
  readonly purpose?: string;
  private workspaceId: string | undefined;
  private readonly memberList: SessionMemberRef[] = [];

  private constructor(input: OpenResearchSessionInput) {
    this.research_session_id = input.research_session_id;
    if (input.title !== undefined) this.title = input.title;
    if (input.purpose !== undefined) this.purpose = input.purpose;
  }

  /** Optional workspace binding — undefined for Sprint 016 orphan sessions. */
  get research_workspace_id(): string | undefined {
    return this.workspaceId;
  }

  /**
   * Open an in-memory research session.
   * `research_session_id` MUST be caller-supplied and deterministic.
   */
  static open(input: OpenResearchSessionInput): ResearchSession {
    if (
      typeof input.research_session_id !== "string" ||
      input.research_session_id.trim().length < 1
    ) {
      throw new OpsError(
        "INVALID_SESSION",
        "research_session_id must be a non-empty caller-supplied string",
      );
    }
    return new ResearchSession({
      research_session_id: input.research_session_id.trim(),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.purpose !== undefined ? { purpose: input.purpose } : {}),
    });
  }

  /**
   * Bind to a ResearchWorkspace (at most one). OPS metadata only.
   * Invoked via ResearchWorkspace.bindSession / ResearchOperations.bindSession.
   */
  bindWorkspace(research_workspace_id: string): void {
    if (
      typeof research_workspace_id !== "string" ||
      research_workspace_id.trim().length < 1
    ) {
      throw new OpsError(
        "INVALID_WORKSPACE",
        "research_workspace_id must be a non-empty caller-supplied string",
      );
    }
    const id = research_workspace_id.trim();
    if (this.workspaceId !== undefined && this.workspaceId !== id) {
      throw new OpsError(
        "INVALID_WORKSPACE",
        "ResearchSession is already bound to a different ResearchWorkspace",
      );
    }
    this.workspaceId = id;
  }

  /** In-memory membership only — never written to Persistence. */
  registerMember(ref: SessionMemberRef): void {
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
    const frozen: SessionMemberRef = Object.freeze({
      entity_kind: ref.entity_kind,
      identity: ref.identity.trim(),
      ...(ref.unit_kind !== undefined ? { unit_kind: ref.unit_kind } : {}),
    });
    this.memberList.push(frozen);
  }

  members(): readonly SessionMemberRef[] {
    return Object.freeze([...this.memberList]);
  }
}

/**
 * OPS read projections — non-authoritative (SPEC-016A §14–§15 / SPEC-018 §13).
 */

import type { PersistenceEvent, PersistenceSnapshot } from "@sciros/persistence";
import type { SessionMemberRef } from "../session/types.js";
import type { WorkspaceMemberRef } from "../workspace/types.js";

/** Timeline entry derived from PersistenceEvent — presentation only. */
export interface TimelineEntry {
  readonly event_id: string;
  readonly parent_identity: string;
  readonly event_type: string;
  readonly ordinal: number;
  readonly at?: string;
  readonly from_state?: string;
  readonly to_state?: string;
  readonly label: string;
}

/**
 * ResearchSnapshot — frozen Sprint 016 shape (SPEC-018 P-018-003).
 * Session-scoped only. Not a Persistence entity. Not persisted.
 */
export interface ResearchSnapshot {
  readonly research_session_id: string;
  readonly member_refs: readonly SessionMemberRef[];
  readonly persistence_snapshot: PersistenceSnapshot;
}

/**
 * WorkspaceSnapshot — additive OPS view (SPEC-018 P-018-003).
 * Not a Persistence entity. Not a second snapshot engine.
 */
export interface WorkspaceSnapshot {
  readonly research_workspace_id: string;
  readonly member_refs: readonly WorkspaceMemberRef[];
  readonly bound_session_ids: readonly string[];
  readonly persistence_snapshot: PersistenceSnapshot;
}

function compareTimeline(a: TimelineEntry, b: TimelineEntry): number {
  if (a.parent_identity < b.parent_identity) return -1;
  if (a.parent_identity > b.parent_identity) return 1;
  if (a.ordinal !== b.ordinal) return a.ordinal - b.ordinal;
  if (a.event_id < b.event_id) return -1;
  if (a.event_id > b.event_id) return 1;
  return 0;
}

/** Project Persistence events into a deterministic OPS timeline. */
export function projectTimeline(
  events: readonly PersistenceEvent[],
): readonly TimelineEntry[] {
  const entries: TimelineEntry[] = events.map((e) => {
    const entry: TimelineEntry = {
      event_id: e.event_id,
      parent_identity: e.parent_identity,
      event_type: e.event_type,
      ordinal: e.ordinal,
      label: e.event_type,
      ...(e.at !== undefined ? { at: e.at } : {}),
      ...(e.from_state !== undefined ? { from_state: e.from_state } : {}),
      ...(e.to_state !== undefined ? { to_state: e.to_state } : {}),
    };
    return Object.freeze(entry);
  });
  entries.sort(compareTimeline);
  return Object.freeze(entries);
}

export function createResearchSnapshot(input: {
  readonly research_session_id: string;
  readonly member_refs: readonly SessionMemberRef[];
  readonly persistence_snapshot: PersistenceSnapshot;
}): ResearchSnapshot {
  return Object.freeze({
    research_session_id: input.research_session_id,
    member_refs: Object.freeze([...input.member_refs]),
    persistence_snapshot: input.persistence_snapshot,
  });
}

export function createWorkspaceSnapshot(input: {
  readonly research_workspace_id: string;
  readonly member_refs: readonly WorkspaceMemberRef[];
  readonly bound_session_ids: readonly string[];
  readonly persistence_snapshot: PersistenceSnapshot;
}): WorkspaceSnapshot {
  return Object.freeze({
    research_workspace_id: input.research_workspace_id,
    member_refs: Object.freeze([...input.member_refs]),
    bound_session_ids: Object.freeze([...input.bound_session_ids]),
    persistence_snapshot: input.persistence_snapshot,
  });
}

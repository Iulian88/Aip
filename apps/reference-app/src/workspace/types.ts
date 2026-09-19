/**
 * ResearchWorkspace types — OPS organizational boundary (SPEC-018).
 */

import type { SessionMemberRef } from "../session/types.js";

/** Workspace membership uses the same ref shape as session membership. */
export type WorkspaceMemberRef = SessionMemberRef;

export interface OpenResearchWorkspaceInput {
  /** Caller-supplied operational id — distinct from session and Persistence ids. */
  readonly research_workspace_id: string;
  readonly title?: string;
  readonly purpose?: string;
}

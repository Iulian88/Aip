/**
 * @sciros/reference-app — Research Operations / OPS shell.
 * Sprint 016 Claim vertical slice + Sprint 018 ResearchWorkspace Foundation.
 * Orchestrates Core → ENC → Persistence → SER. Does NOT author scientific meaning.
 *
 * SPEC-016A · SPEC-018 v0.2.0-PATCHED (Workspace Foundation EXEC)
 */

export { OpsError, isOpsError, type OpsErrorCode } from "./errors/ops-error.js";

export { ResearchSession } from "./session/research-session.js";
export type {
  OpenResearchSessionInput,
  SessionMemberRef,
} from "./session/types.js";

export { ResearchWorkspace } from "./workspace/research-workspace.js";
export type {
  OpenResearchWorkspaceInput,
  WorkspaceMemberRef,
} from "./workspace/types.js";

export {
  ResearchOperations,
  createResearchOperations,
  type ResearchOperationsDeps,
  type RegisterClaimUnitResult,
} from "./operations/research-operations.js";

export {
  projectTimeline,
  createResearchSnapshot,
  createWorkspaceSnapshot,
  type TimelineEntry,
  type ResearchSnapshot,
  type WorkspaceSnapshot,
} from "./views/timeline.js";

export interface ReferenceAppMarker {
  readonly packageId: "@sciros/reference-app";
  readonly sprint: 18;
  readonly duplicatesProcessorLogic: false;
  readonly researchSessionPersisted: false;
  readonly researchWorkspacePersisted: false;
  readonly secondEventJournal: false;
  readonly secondIdentitySystem: false;
}

export const referenceAppMarker: ReferenceAppMarker = {
  packageId: "@sciros/reference-app",
  sprint: 18,
  duplicatesProcessorLogic: false,
  researchSessionPersisted: false,
  researchWorkspacePersisted: false,
  secondEventJournal: false,
  secondIdentitySystem: false,
};

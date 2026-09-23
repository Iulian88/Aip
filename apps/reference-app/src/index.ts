/**
 * @sciros/reference-app — Research Operations / OPS shell.
 * Sprint 016 Claim + Sprint 018 Workspace + Sprint 019 Evidence + Sprint 020 Model C
 * + Sprint 021 Evidence Record State post-persist + Sprint 022 Grade OPS
 * + Sprint 023 Contradiction OPS.
 * Orchestrates Core → ENC → Persistence → SER. Does NOT author scientific meaning.
 *
 * SPEC-016A · SPEC-018 · SPEC-019 · SPEC-020 · SPEC-021 · SPEC-022 · SPEC-023
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
  type RegisterEvidenceUnitResult,
  type RegisterEvidenceUnitOptions,
  type RegisterClaimUnitOptions,
  type TransitionClaimStandingInput,
  type TransitionClaimStandingResult,
  type TransitionEvidenceRecordStateInput,
  type TransitionEvidenceRecordStateResult,
  type AssignEvidenceGradeInput,
  type AssignEvidenceGradeResult,
  type RegisterContradictionUnitOptions,
  type RegisterContradictionUnitResult,
  type TransitionContradictionRecordStateInput,
  type TransitionContradictionRecordStateResult,
  type ClaimLineageEntry,
  type EvidenceLineageEntry,
  type ContradictionLineageEntry,
} from "./operations/research-operations.js";

export { claimFromClaimUnitPayload } from "./operations/claim-from-unit.js";
export { evidenceFromEvidenceUnitPayload } from "./operations/evidence-from-unit.js";
export { contradictionFromContradictionUnitPayload } from "./operations/contradiction-from-unit.js";

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
  readonly sprint: 23;
  readonly duplicatesProcessorLogic: false;
  readonly researchSessionPersisted: false;
  readonly researchWorkspacePersisted: false;
  readonly secondEventJournal: false;
  readonly secondIdentitySystem: false;
}

export const referenceAppMarker: ReferenceAppMarker = {
  packageId: "@sciros/reference-app",
  sprint: 23,
  duplicatesProcessorLogic: false,
  researchSessionPersisted: false,
  researchWorkspacePersisted: false,
  secondEventJournal: false,
  secondIdentitySystem: false,
};

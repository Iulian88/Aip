/**
 * ResearchOperations — OPS orchestration façade (SPEC-016A / SPEC-018 / SPEC-019 / SPEC-020 / SPEC-021 / SPEC-022).
 * Orchestrates Core → ENC → Persistence → SER. Does not author scientific meaning.
 * Sprint 020: Model C + Claim Standing post-persist.
 * Sprint 021: Evidence Record State post-persist (Model C).
 * Sprint 022: Evidence Grade assignment post-persist (Model C).
 */

import {
  ClaimFactory,
  ClaimTransitionService,
  EvidenceFactory,
  EvidenceGradeService,
  EvidenceTransitionService,
  type Claim,
  type CreateClaimInput,
  type CreateEvidenceInput,
  type Evidence,
  type EvidenceRecordTransitionInput,
  type GradeAssignmentInput,
  type StandingTransitionInput,
} from "@sciros/core";
import { CanonicalEncoder, type CanonicalUnit } from "@sciros/encoding";
import {
  INITIAL_REVISION_ID,
  assertRevisionId,
  entityFromCanonicalUnit,
  type PersistenceEntity,
  type PersistenceEvent,
  type PersistenceRepository,
  type PersistenceSession,
} from "@sciros/persistence";
import { JsonEncoder } from "@sciros/serialization";
import { OpsError } from "../errors/ops-error.js";
import { ResearchSession } from "../session/research-session.js";
import type { OpenResearchSessionInput, SessionMemberRef } from "../session/types.js";
import {
  createResearchSnapshot,
  createWorkspaceSnapshot,
  projectTimeline,
  type ResearchSnapshot,
  type TimelineEntry,
  type WorkspaceSnapshot,
} from "../views/timeline.js";
import { ResearchWorkspace } from "../workspace/research-workspace.js";
import type {
  OpenResearchWorkspaceInput,
  WorkspaceMemberRef,
} from "../workspace/types.js";
import { claimFromClaimUnitPayload } from "./claim-from-unit.js";
import { evidenceFromEvidenceUnitPayload } from "./evidence-from-unit.js";

export interface ResearchOperationsDeps {
  readonly claimFactory: ClaimFactory;
  readonly claimTransitions: ClaimTransitionService;
  readonly evidenceFactory: EvidenceFactory;
  readonly evidenceTransitions: EvidenceTransitionService;
  readonly evidenceGrades: EvidenceGradeService;
  readonly encoder: CanonicalEncoder;
  readonly jsonEncoder: JsonEncoder;
  /** Infrastructure PersistenceSession — distinct from ResearchSession. */
  readonly persistenceSession: PersistenceSession;
}

export interface RegisterClaimUnitResult {
  readonly claim: Claim;
  readonly unit: CanonicalUnit;
  readonly entity: PersistenceEntity;
}

export interface RegisterEvidenceUnitResult {
  readonly evidence: Evidence;
  readonly unit: CanonicalUnit;
  readonly entity: PersistenceEntity;
}

/** Optional in-memory Core transition applied before ENC assemble / Persistence.create. */
export interface RegisterEvidenceUnitOptions {
  readonly transition?: EvidenceRecordTransitionInput;
}

export interface RegisterClaimUnitOptions {
  /** Model C revision id; default rev:initial. */
  readonly revision_id?: string;
}

export interface TransitionClaimStandingInput {
  readonly identity: string;
  readonly transition: StandingTransitionInput;
  /** New immutable revision id (caller-supplied rev:…). */
  readonly revision_id: string;
  /** Expected current RevisionHead pointer (CAS). */
  readonly expected_head_revision_id: string;
  /** When true, append ops.claim_standing_revision operational event. */
  readonly append_event?: boolean;
}

export interface TransitionClaimStandingResult {
  readonly claim: Claim;
  readonly unit: CanonicalUnit;
  readonly entity: PersistenceEntity;
  readonly head_revision_id: string;
}

export interface ClaimLineageEntry {
  readonly revision_id: string;
  readonly predecessor_revision_id?: string;
  readonly content_version: string;
  readonly storage_key: string;
}

export interface TransitionEvidenceRecordStateInput {
  readonly identity: string;
  readonly transition: EvidenceRecordTransitionInput;
  /** New immutable revision id (caller-supplied rev:…). */
  readonly revision_id: string;
  /** Expected current RevisionHead pointer (CAS). */
  readonly expected_head_revision_id: string;
  /** When true, append ops.evidence_record_state_revision operational event. */
  readonly append_event?: boolean;
}

export interface TransitionEvidenceRecordStateResult {
  readonly evidence: Evidence;
  readonly unit: CanonicalUnit;
  readonly entity: PersistenceEntity;
  readonly head_revision_id: string;
}

export interface AssignEvidenceGradeInput {
  readonly identity: string;
  readonly assignment: GradeAssignmentInput;
  /** New immutable revision id (caller-supplied rev:…). */
  readonly revision_id: string;
  /** Expected current RevisionHead pointer (CAS). */
  readonly expected_head_revision_id: string;
  /** When true, append ops.evidence_grade_assignment_revision operational event. */
  readonly append_event?: boolean;
}

export interface AssignEvidenceGradeResult {
  readonly evidence: Evidence;
  readonly unit: CanonicalUnit;
  readonly entity: PersistenceEntity;
  readonly head_revision_id: string;
}

export type EvidenceLineageEntry = ClaimLineageEntry;

export class ResearchOperations {
  private readonly claims: ClaimFactory;
  private readonly claimTransitions: ClaimTransitionService;
  private readonly evidenceFactory: EvidenceFactory;
  private readonly evidenceTransitions: EvidenceTransitionService;
  private readonly evidenceGrades: EvidenceGradeService;
  private readonly encoder: CanonicalEncoder;
  private readonly jsonEncoder: JsonEncoder;
  private readonly persistenceSession: PersistenceSession;
  /** Process-local workspace registry (memory-only; not durable). */
  private readonly workspaces = new Map<string, ResearchWorkspace>();

  constructor(deps: ResearchOperationsDeps) {
    this.claims = deps.claimFactory;
    this.claimTransitions = deps.claimTransitions;
    this.evidenceFactory = deps.evidenceFactory;
    this.evidenceTransitions = deps.evidenceTransitions;
    this.evidenceGrades = deps.evidenceGrades;
    this.encoder = deps.encoder;
    this.jsonEncoder = deps.jsonEncoder;
    this.persistenceSession = deps.persistenceSession;
  }

  get repository(): PersistenceRepository {
    return this.persistenceSession.repository;
  }

  /** Infrastructure persistence session id — NOT research_session_id. */
  get persistenceSessionId(): string {
    return this.persistenceSession.session_id;
  }

  openSession(input: OpenResearchSessionInput): ResearchSession {
    return ResearchSession.open(input);
  }

  /**
   * Open a memory-only ResearchWorkspace (SPEC-018).
   * Duplicate id within this ResearchOperations instance is rejected.
   */
  openWorkspace(input: OpenResearchWorkspaceInput): ResearchWorkspace {
    const ws = ResearchWorkspace.open(input);
    if (this.workspaces.has(ws.research_workspace_id)) {
      throw new OpsError(
        "INVALID_WORKSPACE",
        `ResearchWorkspace already open: ${ws.research_workspace_id}`,
      );
    }
    this.workspaces.set(ws.research_workspace_id, ws);
    return ws;
  }

  /** Optional bind session → workspace (at most one workspace per session). */
  bindSession(workspace: ResearchWorkspace, session: ResearchSession): void {
    const registered = this.workspaces.get(workspace.research_workspace_id);
    if (registered !== workspace) {
      throw new OpsError(
        "INVALID_WORKSPACE",
        "Workspace must be opened via this ResearchOperations instance",
      );
    }
    workspace.bindSession(session);
  }

  /**
   * Core createDraft → ENC assemble → Persistence create (Model C rev:initial) → ensureInitialHead.
   * Does NOT append events or register membership (call those separately).
   * Lower-layer errors propagate unchanged.
   */
  async registerClaimUnit(
    input: CreateClaimInput,
    options?: RegisterClaimUnitOptions,
  ): Promise<RegisterClaimUnitResult> {
    const revision_id = options?.revision_id ?? INITIAL_REVISION_ID;
    assertRevisionId(revision_id);
    if (revision_id !== INITIAL_REVISION_ID) {
      throw new OpsError(
        "INVALID_COMMAND_STATE",
        "registerClaimUnit creates initial revision only; use transitionClaimStanding for later revisions",
      );
    }
    const claim = this.claims.createDraft(input);
    const unit = await this.encoder.assemble(claim);
    const entity = entityFromCanonicalUnit(unit, { revision_id });
    const stored = await this.repository.create(entity);
    await this.repository.ensureInitialHead(claim.claim_id, "ClaimUnit", revision_id);
    return { claim, unit, entity: stored };
  }

  /**
   * Core Evidence createDraft → optional TransitionService → ENC assemble → Persistence create.
   * Model C: initial revision + RevisionHead. Post-persist Record State: transitionEvidenceRecordState.
   */
  async registerEvidenceUnit(
    input: CreateEvidenceInput,
    options?: RegisterEvidenceUnitOptions,
  ): Promise<RegisterEvidenceUnitResult> {
    let evidence = this.evidenceFactory.createDraft(input);
    if (options?.transition !== undefined) {
      evidence = this.evidenceTransitions.transition(evidence, options.transition);
    }
    const unit = await this.encoder.assemble(evidence);
    const entity = entityFromCanonicalUnit(unit, {
      revision_id: INITIAL_REVISION_ID,
    });
    const stored = await this.repository.create(entity);
    await this.repository.ensureInitialHead(
      evidence.evidence_id,
      "EvidenceUnit",
      INITIAL_REVISION_ID,
    );
    return { evidence, unit, entity: stored };
  }

  /**
   * Post-persist Claim Standing transition (Model C).
   * Core validates → new immutable revision → advanceHead CAS → optional appendEvent.
   * Partial-write: if advanceHead fails after create, revision row may exist without becoming head.
   */
  async transitionClaimStanding(
    input: TransitionClaimStandingInput,
  ): Promise<TransitionClaimStandingResult> {
    assertRevisionId(input.revision_id);
    assertRevisionId(input.expected_head_revision_id, "expected_head_revision_id");
    if (input.revision_id === INITIAL_REVISION_ID) {
      throw new OpsError(
        "INVALID_COMMAND_STATE",
        "transitionClaimStanding revision_id must not be rev:initial",
      );
    }
    if (input.revision_id === input.expected_head_revision_id) {
      throw new OpsError(
        "INVALID_COMMAND_STATE",
        "revision_id must differ from expected_head_revision_id",
      );
    }

    // A/B: load headed claim, Core transition, ENC assemble (nothing persisted yet)
    const priorEntity = await this.getClaimUnit(input.identity);
    const priorClaim = claimFromClaimUnitPayload(priorEntity.payload);
    const claim = this.claimTransitions.transition(priorClaim, input.transition);
    const unit = await this.encoder.assemble(claim);

    // C: create immutable revision row
    const entity = entityFromCanonicalUnit(unit, {
      revision_id: input.revision_id,
      predecessor_revision_id: input.expected_head_revision_id,
    });
    const stored = await this.repository.create(entity);

    // D: RevisionHead CAS
    const head = await this.repository.advanceHead(
      input.identity,
      "ClaimUnit",
      input.expected_head_revision_id,
      input.revision_id,
    );

    // E: optional operational event (non-authoritative vs entity metadata)
    if (input.append_event === true) {
      const event_id =
        input.transition.event_id !== undefined
          ? `ops:${input.transition.event_id}`
          : `ops:claim_standing:${input.identity}:${input.revision_id}`;
      await this.repository.appendEvent(input.identity, {
        event_id,
        parent_identity: input.identity,
        event_type: "ops.claim_standing_revision",
        payload: Object.freeze({
          revision_id: input.revision_id,
          predecessor_revision_id: input.expected_head_revision_id,
          unit_kind: "ClaimUnit",
          to_standing: input.transition.to,
        }),
        ordinal: 0,
      });
    }

    return {
      claim,
      unit,
      entity: stored,
      head_revision_id: head.content_version,
    };
  }

  /**
   * Post-persist Evidence Record State transition (Model C).
   * Core validates → new immutable revision → advanceHead CAS → optional appendEvent.
   * Partial-write: if advanceHead fails after create, revision row may exist without becoming head.
   */
  async transitionEvidenceRecordState(
    input: TransitionEvidenceRecordStateInput,
  ): Promise<TransitionEvidenceRecordStateResult> {
    assertRevisionId(input.revision_id);
    assertRevisionId(input.expected_head_revision_id, "expected_head_revision_id");
    if (input.revision_id === INITIAL_REVISION_ID) {
      throw new OpsError(
        "INVALID_COMMAND_STATE",
        "transitionEvidenceRecordState revision_id must not be rev:initial",
      );
    }
    if (input.revision_id === input.expected_head_revision_id) {
      throw new OpsError(
        "INVALID_COMMAND_STATE",
        "revision_id must differ from expected_head_revision_id",
      );
    }

    const priorEntity = await this.getEvidenceUnit(input.identity);
    const priorEvidence = evidenceFromEvidenceUnitPayload(priorEntity.payload);
    const evidence = this.evidenceTransitions.transition(
      priorEvidence,
      input.transition,
    );
    const unit = await this.encoder.assemble(evidence);

    const entity = entityFromCanonicalUnit(unit, {
      revision_id: input.revision_id,
      predecessor_revision_id: input.expected_head_revision_id,
    });
    const stored = await this.repository.create(entity);

    const head = await this.repository.advanceHead(
      input.identity,
      "EvidenceUnit",
      input.expected_head_revision_id,
      input.revision_id,
    );

    if (input.append_event === true) {
      const event_id =
        input.transition.event_id !== undefined
          ? `ops:${input.transition.event_id}`
          : `ops:evidence_record_state:${input.identity}:${input.revision_id}`;
      await this.repository.appendEvent(input.identity, {
        event_id,
        parent_identity: input.identity,
        event_type: "ops.evidence_record_state_revision",
        payload: Object.freeze({
          revision_id: input.revision_id,
          predecessor_revision_id: input.expected_head_revision_id,
          unit_kind: "EvidenceUnit",
          to_record_state: input.transition.to,
        }),
        ordinal: 0,
      });
    }

    return {
      evidence,
      unit,
      entity: stored,
      head_revision_id: head.content_version,
    };
  }

  /**
   * Post-persist Evidence Grade assignment (Model C / SPEC-022 Option A).
   * Core EvidenceGradeService.assign → ENC EvidenceUnit → create → advanceHead CAS.
   * Does NOT persist GradeDesignationUnit. Does NOT mutate membership / Record State / Standing.
   * Partial-write: if advanceHead fails after create, revision row may exist without becoming head.
   */
  async assignEvidenceGrade(
    input: AssignEvidenceGradeInput,
  ): Promise<AssignEvidenceGradeResult> {
    assertRevisionId(input.revision_id);
    assertRevisionId(input.expected_head_revision_id, "expected_head_revision_id");
    if (input.revision_id === INITIAL_REVISION_ID) {
      throw new OpsError(
        "INVALID_COMMAND_STATE",
        "assignEvidenceGrade revision_id must not be rev:initial",
      );
    }
    if (input.revision_id === input.expected_head_revision_id) {
      throw new OpsError(
        "INVALID_COMMAND_STATE",
        "revision_id must differ from expected_head_revision_id",
      );
    }

    const priorEntity = await this.getEvidenceUnit(input.identity);
    const priorEvidence = evidenceFromEvidenceUnitPayload(priorEntity.payload);
    const evidence = this.evidenceGrades.assign(priorEvidence, input.assignment);
    const unit = await this.encoder.assemble(evidence);

    const entity = entityFromCanonicalUnit(unit, {
      revision_id: input.revision_id,
      predecessor_revision_id: input.expected_head_revision_id,
    });
    const stored = await this.repository.create(entity);

    const head = await this.repository.advanceHead(
      input.identity,
      "EvidenceUnit",
      input.expected_head_revision_id,
      input.revision_id,
    );

    if (input.append_event === true) {
      const event_id =
        input.assignment.event_id !== undefined
          ? `ops:${input.assignment.event_id}`
          : `ops:evidence_grade:${input.identity}:${input.revision_id}`;
      await this.repository.appendEvent(input.identity, {
        event_id,
        parent_identity: input.identity,
        event_type: "ops.evidence_grade_assignment_revision",
        payload: Object.freeze({
          revision_id: input.revision_id,
          predecessor_revision_id: input.expected_head_revision_id,
          unit_kind: "EvidenceUnit",
          to_grade_ref: evidence.grade_ref,
        }),
        ordinal: 0,
      });
    }

    return {
      evidence,
      unit,
      entity: stored,
      head_revision_id: head.content_version,
    };
  }

  /**
   * Explicit Persistence.appendEvent — sole event journal (SPEC-016A P-016-004).
   * Caller must supply deterministic event_id. Lower-layer errors propagate unchanged.
   */
  async appendResearchEvent(
    parent_identity: string,
    event: PersistenceEvent,
  ): Promise<PersistenceEvent> {
    return this.repository.appendEvent(parent_identity, event);
  }

  /**
   * Session membership + workspace upsert when bound (SPEC-018 M3).
   * Orphan sessions update session membership only (M5).
   */
  registerMember(session: ResearchSession, ref: SessionMemberRef): void {
    session.registerMember(ref);
    const wid = session.research_workspace_id;
    if (wid === undefined) return;
    const ws = this.workspaces.get(wid);
    if (!ws) {
      throw new OpsError(
        "INVALID_COMMAND_STATE",
        `Session bound to unknown workspace: ${wid}`,
      );
    }
    ws.upsertMember(ref);
  }

  /** Explicit workspace membership (non-authoritative OPS index). */
  registerWorkspaceMember(
    workspace: ResearchWorkspace,
    ref: WorkspaceMemberRef,
  ): void {
    const registered = this.workspaces.get(workspace.research_workspace_id);
    if (registered !== workspace) {
      throw new OpsError(
        "INVALID_WORKSPACE",
        "Workspace must be opened via this ResearchOperations instance",
      );
    }
    workspace.registerMember(ref);
  }

  /** Head-resolved current ClaimUnit (backward-compatible “current”). */
  async getClaimUnit(identity: string): Promise<PersistenceEntity> {
    return this.repository.get(identity, "CanonicalUnit", { unit_kind: "ClaimUnit" });
  }

  async getClaimUnitRevision(
    identity: string,
    revision_id: string,
  ): Promise<PersistenceEntity> {
    return this.repository.get(identity, "CanonicalUnit", {
      unit_kind: "ClaimUnit",
      revision_id,
    });
  }

  async getClaimHead(identity: string): Promise<PersistenceEntity> {
    return this.repository.getHead(identity, "ClaimUnit");
  }

  /**
   * Lineage metadata ordered by revision_id codepoint (SPEC-020 determinism).
   * Chain walk follows predecessor_revision_id; list is sorted for stable export.
   */
  async getClaimLineage(identity: string): Promise<readonly ClaimLineageEntry[]> {
    const rows = await this.repository.listRevisions(identity, "ClaimUnit");
    return Object.freeze(
      rows.map((e) =>
        Object.freeze({
          revision_id: e.revision_id ?? INITIAL_REVISION_ID,
          ...(e.predecessor_revision_id !== undefined
            ? { predecessor_revision_id: e.predecessor_revision_id }
            : {}),
          content_version: e.content_version,
          storage_key: e.storage_key,
        }),
      ),
    );
  }

  async getEvidenceUnit(identity: string): Promise<PersistenceEntity> {
    return this.repository.get(identity, "CanonicalUnit", {
      unit_kind: "EvidenceUnit",
    });
  }

  async getEvidenceUnitRevision(
    identity: string,
    revision_id: string,
  ): Promise<PersistenceEntity> {
    return this.repository.get(identity, "CanonicalUnit", {
      unit_kind: "EvidenceUnit",
      revision_id,
    });
  }

  async getEvidenceHead(identity: string): Promise<PersistenceEntity> {
    return this.repository.getHead(identity, "EvidenceUnit");
  }

  async getEvidenceLineage(
    identity: string,
  ): Promise<readonly EvidenceLineageEntry[]> {
    const rows = await this.repository.listRevisions(identity, "EvidenceUnit");
    return Object.freeze(
      rows.map((e) =>
        Object.freeze({
          revision_id: e.revision_id ?? INITIAL_REVISION_ID,
          ...(e.predecessor_revision_id !== undefined
            ? { predecessor_revision_id: e.predecessor_revision_id }
            : {}),
          content_version: e.content_version,
          storage_key: e.storage_key,
        }),
      ),
    );
  }

  async getEvents(parent_identity: string): Promise<readonly PersistenceEvent[]> {
    return this.repository.getEvents(parent_identity);
  }

  /**
   * Read-only timeline for session members from Persistence journal.
   * Ordering: parent_identity → ordinal → event_id.
   */
  async timeline(session: ResearchSession): Promise<readonly TimelineEntry[]> {
    const members = session.members();
    const collected: PersistenceEvent[] = [];
    const seenParents = new Set<string>();
    for (const m of members) {
      if (seenParents.has(m.identity)) continue;
      seenParents.add(m.identity);
      const events = await this.repository.getEvents(m.identity);
      for (const e of events) collected.push(e);
    }
    return projectTimeline(collected);
  }

  async snapshotView(session: ResearchSession): Promise<ResearchSnapshot> {
    const persistence_snapshot = await this.repository.snapshot();
    return createResearchSnapshot({
      research_session_id: session.research_session_id,
      member_refs: session.members(),
      persistence_snapshot,
    });
  }

  /** Additive WorkspaceSnapshot — does not alter ResearchSnapshot (P-018-003). */
  async workspaceSnapshotView(
    workspace: ResearchWorkspace,
  ): Promise<WorkspaceSnapshot> {
    const registered = this.workspaces.get(workspace.research_workspace_id);
    if (registered !== workspace) {
      throw new OpsError(
        "INVALID_WORKSPACE",
        "Workspace must be opened via this ResearchOperations instance",
      );
    }
    const persistence_snapshot = await this.repository.snapshot();
    return createWorkspaceSnapshot({
      research_workspace_id: workspace.research_workspace_id,
      member_refs: workspace.members(),
      bound_session_ids: workspace.boundSessionIds(),
      persistence_snapshot,
    });
  }

  /**
   * SER-JSON-001 encode of head-resolved ClaimUnit payload.
   * Lower-layer errors propagate unchanged.
   */
  async exportClaimUnit(identity: string): Promise<string> {
    const entity = await this.getClaimUnit(identity);
    return this.jsonEncoder.encode(entity.payload);
  }

  async exportClaimUnitRevision(
    identity: string,
    revision_id: string,
  ): Promise<string> {
    const entity = await this.getClaimUnitRevision(identity, revision_id);
    return this.jsonEncoder.encode(entity.payload);
  }

  /**
   * SER-JSON-001 encode of a persisted EvidenceUnit.
   * Lower-layer errors propagate unchanged. Does not inject OPS metadata into payload.
   */
  async exportEvidenceUnit(identity: string): Promise<string> {
    const entity = await this.getEvidenceUnit(identity);
    return this.jsonEncoder.encode(entity.payload);
  }

  async exportEvidenceUnitRevision(
    identity: string,
    revision_id: string,
  ): Promise<string> {
    const entity = await this.getEvidenceUnitRevision(identity, revision_id);
    return this.jsonEncoder.encode(entity.payload);
  }
}

/** Convenience factory with default Core/ENC/SER instances. */
export function createResearchOperations(
  persistenceSession: PersistenceSession,
): ResearchOperations {
  if (
    typeof persistenceSession.session_id !== "string" ||
    persistenceSession.session_id.trim().length < 1
  ) {
    throw new OpsError(
      "INVALID_COMMAND_STATE",
      "PersistenceSession.session_id must be non-empty",
    );
  }
  return new ResearchOperations({
    claimFactory: new ClaimFactory(),
    claimTransitions: new ClaimTransitionService(),
    evidenceFactory: new EvidenceFactory(),
    evidenceTransitions: new EvidenceTransitionService(),
    evidenceGrades: new EvidenceGradeService(),
    encoder: new CanonicalEncoder(),
    jsonEncoder: new JsonEncoder(),
    persistenceSession,
  });
}

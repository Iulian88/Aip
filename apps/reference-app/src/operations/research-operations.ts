/**
 * ResearchOperations — OPS orchestration façade (SPEC-016A / SPEC-018 Foundation).
 * Orchestrates Core → ENC → Persistence → SER. Does not author scientific meaning.
 */

import { ClaimFactory, type CreateClaimInput, type Claim } from "@sciros/core";
import { CanonicalEncoder, type CanonicalUnit } from "@sciros/encoding";
import {
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

export interface ResearchOperationsDeps {
  readonly claimFactory: ClaimFactory;
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

export class ResearchOperations {
  private readonly claims: ClaimFactory;
  private readonly encoder: CanonicalEncoder;
  private readonly jsonEncoder: JsonEncoder;
  private readonly persistenceSession: PersistenceSession;
  /** Process-local workspace registry (memory-only; not durable). */
  private readonly workspaces = new Map<string, ResearchWorkspace>();

  constructor(deps: ResearchOperationsDeps) {
    this.claims = deps.claimFactory;
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
   * Core createDraft → ENC assemble → Persistence create.
   * Does NOT append events or register membership (call those separately).
   * Lower-layer errors propagate unchanged.
   */
  async registerClaimUnit(input: CreateClaimInput): Promise<RegisterClaimUnitResult> {
    const claim = this.claims.createDraft(input);
    const unit = await this.encoder.assemble(claim);
    const entity = entityFromCanonicalUnit(unit);
    const stored = await this.repository.create(entity);
    return { claim, unit, entity: stored };
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

  async getClaimUnit(identity: string): Promise<PersistenceEntity> {
    return this.repository.get(identity, "CanonicalUnit", { unit_kind: "ClaimUnit" });
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
   * SER-JSON-001 encode of a persisted ClaimUnit (via ENC unit in entity payload).
   * Lower-layer errors propagate unchanged.
   */
  async exportClaimUnit(identity: string): Promise<string> {
    const entity = await this.getClaimUnit(identity);
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
    encoder: new CanonicalEncoder(),
    jsonEncoder: new JsonEncoder(),
    persistenceSession,
  });
}

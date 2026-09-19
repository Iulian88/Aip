/**
 * OPS membership reference — does not duplicate scientific state (SPEC-016A §10/§17).
 */

import type { PersistenceEntityKind } from "@sciros/persistence";

export interface SessionMemberRef {
  readonly entity_kind: PersistenceEntityKind;
  /** Required when entity_kind is CanonicalUnit (or otherwise ambiguous). */
  readonly unit_kind?: string;
  /** Scientific / canonical identity — authoritative. */
  readonly identity: string;
}

export interface OpenResearchSessionInput {
  /** Caller-supplied operational id — distinct from PersistenceSession.session_id. */
  readonly research_session_id: string;
  readonly title?: string;
  readonly purpose?: string;
}

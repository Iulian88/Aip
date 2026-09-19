/**
 * Shared ports for the SciROS Reference Implementation (RIA-001 / RIA-002).
 * Sprint 2: ports + observability interfaces — no scientific behaviour.
 */

/** Single authority pin binding (metadata only — not SCI logic). */
export interface AuthorityPin {
  readonly id: string;
  readonly version: string;
  readonly pathHint?: string;
  readonly status?: string;
  readonly contentHash?: string;
  readonly filing?: string;
}

/** Loads and freezes authority pin bindings (RPR S01–S03). */
export interface AuthorityLoader {
  /** Loads authority pins from the configured manifest source. */
  loadAuthorities(): Promise<AuthorityPin[]>;
  /** Verifies versions/hashes/availability and returns a sealed catalog. */
  pinAndFreeze(pins: readonly AuthorityPin[]): Promise<AuthorityCatalog>;
}

/** Opaque catalog of bound authority pins. */
export interface AuthorityCatalog {
  readonly sealed: true;
  readonly pinManifestId: string;
  readonly pins: readonly AuthorityPin[];
  readonly frozenAtIso: string;
}

/** Logical system-of-record for Core aggregates (RIA M2). */
export interface Repository {
  hasIdentity(identity: string): Promise<boolean>;
}

/** Append-only event journal port (RIA M7) — infrastructure only. */
export interface EventStore {
  append(parentIdentity: string, event: unknown): Promise<void>;
}

/** Durability hand-off only — no schema-as-law (RIA M13 / RPR S16). */
export interface PersistencePort {
  persist(unit: unknown): Promise<void>;
}

/** Clock port for timestamps (mechanism only). */
export interface Clock {
  nowIso(): string;
}

/** Maps runtime principals to SciROS agent identity strings. */
export interface IdentityProvider {
  currentAgentId(): Promise<string>;
}

/**
 * Captures Human Reviewer decisions for gated promotions (OPS / RPR S12).
 * Sprint 2: port only — no Human Reviewer logic.
 */
export interface HumanReviewerProvider {
  requestDecision(subjectIdentity: string): Promise<string | null>;
}

/** Structured logger port — no implementation required in Sprint 2. */
export interface Logger {
  debug(message: string, fields?: Readonly<Record<string, unknown>>): void;
  info(message: string, fields?: Readonly<Record<string, unknown>>): void;
  warn(message: string, fields?: Readonly<Record<string, unknown>>): void;
  error(message: string, fields?: Readonly<Record<string, unknown>>): void;
}

/** Metrics port — interface only. */
export interface Metrics {
  increment(name: string, tags?: Readonly<Record<string, string>>): void;
  timing(name: string, durationMs: number, tags?: Readonly<Record<string, string>>): void;
}

/** Tracing / correlation port — interface only. */
export interface Tracer {
  startSpan(name: string): Span;
}

export interface Span {
  readonly name: string;
  setAttribute(key: string, value: string | number | boolean): void;
  end(): void;
}

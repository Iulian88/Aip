# SPEC-016A — SciROS Research Operations / Reference Application

## Architecture & Workflow Design (Patched)

**SPEC-016A STATUS: PATCHED — PENDING ARCHITECTURE AUDIT**

| Field | Value |
|-------|--------|
| Spec ID | SPEC-016A |
| Supersedes (design) | SPEC-016 (PROPOSED) |
| Audit input | CODE-AUDIT-014 |
| Version | 0.2.0-PATCHED |
| Status | PATCHED — PENDING ARCHITECTURE AUDIT |
| Mode | Design / specification only |
| Intended implementation | EXEC-SPRINT-016 (not authorized by this document) |
| Intended re-audit | CODE-AUDIT-014A |
| Does not claim | Implementation, approval, or Sprint 016 certification |

This document incorporates **only** the required closures from CODE-AUDIT-014 (P-016-001…P-016-011). It does not redesign the architecture judged coherent by that audit.

---

## 1. Specification Identity

See table above.

Governing pins (consume only; do not rewrite):

OPS-001, RIA-001, RIA-002, RPR-001, SCI-000…006, ENC-001, SER-001, SER-JSON-001, REF-TEST-001…003, CONF-001, CERT-001/002, ADR-0006, EXEC-001…003, Persistence certified contract (Sprint 015).

**Authority safety:** No modification is required or authorized to SCI-000…006, ENC-001, SER-001, SER-JSON-001, RPR-001, REF-TEST-001…003, CONF-001, CERT-001/002, or the Persistence certified contract. OPS/RIA authorities are consumed, not rewritten. If an implementation would require changing a frozen authority, implementation must **STOP**.

---

## 2. Current Certified Architecture

Certified through **SPRINT-015 FULLY CERTIFIED** (P-001 closed by EXEC-SPRINT-015A; verified by CODE-AUDIT-013A):

```
Scientific Core
        ↓
Reference Processor
        ↓
Canonical Encoding
        ↓
Serialization
        ↓
Reference Tests
        ↓
Conformance
        ↓
Certification
        ↓
Persistence
        ↓
Reference Application / OPS   ← SPEC-016A (design)
```

Sprint 015 is not reopened. Persistence guarantees (including immutable Canonical Unit rows per `(unit_kind, identity)`) remain binding.

---

## 3. Problem Statement

SciROS can create, encode, serialize, test, conform, certify, and persist scientific artifacts, but lacks a coherent **orchestration** layer that sequences certified packages into an auditable research workflow without duplicating scientific or persistence semantics.

SPEC-016 proposed that layer. CODE-AUDIT-014 found the architecture coherent but left implementation-time forks. SPEC-016A closes those forks.

---

## 4. Goals

1. Define the Reference Application as an OPS orchestration layer only.
2. Fill existing `apps/reference-app` (`@sciros/reference-app`).
3. Introduce OPS-owned `ResearchSession` (memory-only) and `ResearchOperations`.
4. Prove Core → ENC → Persistence → SER orchestration via a locked create-once vertical slice.
5. Consume the single Persistence event journal; expose a read-only timeline projection.
6. Preserve identity, immutability, determinism, and ownership boundaries.
7. Provide testable acceptance criteria for EXEC-SPRINT-016 and CODE-AUDIT-014A.

---

## 5. Non-Goals

Sprint 016 SHALL NOT include:

- AI / LLM / autonomous agents / embeddings / vector DB / semantic search
- Literature ingestion / crawlers / browser automation / external research APIs
- Production DB (PostgreSQL, Supabase, …), Redis, Elasticsearch, Kafka
- CQRS / event-sourcing redesign / microservices
- Frontend UI / mobile / marketplace
- Production authN / authZ / billing / cloud deployment
- Persisted ResearchSession / durable session store
- Evidence, GradeDesignation, Verification, Contradiction, Negative Result workflows
- CONF/CERT invocation or attachment
- CLI product surface
- Research bundle / ZIP packaging
- Post-persist scientific transitions (Core transition → re-assemble → replace)
- Second scientific identity, second event journal, second snapshot engine
- Core / ENC / SER / Processor / Persistence / REF / CONF / CERT logic duplication or redesign
- Frozen authority or specification rewrites

---

## 6. Architectural Definition

**What is the Reference Application?**  
A programmatic research-operations orchestration layer that composes certified SciROS packages.

**Application and operations?**  
Both in the RIA sense: OPS-facing application shell (`@sciros/reference-app`). Not a scientific authority. Not Persistence.

**Core rule:** Orchestrates. Does not author scientific meaning.

---

## 7. Ownership Model

| Concern | Owner | Reference App role |
|---------|-------|-------------------|
| Standing, grades, verification, NR, contradiction, transitions | Core | Invoke factories only; never reimplement |
| S05 bind / S06 decode / S17 project | Processor | OPTIONAL; not required for vertical slice |
| Canonical unit / integrity | ENC-001 | `assemble` / `verify` |
| JSON profile | SER-JSON-001 | `encode` / `decode` for export |
| Fixture execution | Reference Tests | Outside runtime app path |
| Conformance evaluation | CONF-001 | **FUTURE** consume; not Sprint 016 |
| Certification decisions | CERT-001/002 | **FUTURE** consume; not Sprint 016 |
| Storage, journal, snapshot, TX | Persistence | Sole storage mechanism |
| Research session, workflow sequencing, inspection views | **Reference App (OPS)** | Memory session + façade only |

---

## 8. Package Structure

Implement inside existing **`apps/reference-app`** (`@sciros/reference-app`).

Do **not** create `packages/ops`.

Proposed modules (implementation names; not authorities):

```
apps/reference-app/src/
  session/          ResearchSession types + in-memory lifecycle
  operations/       ResearchOperations façade
  views/            Timeline / ResearchSnapshot (read-only)
  errors/           OpsError (OPS-layer only)
  index.ts          Public API
```

Tests: under `apps/reference-app` (or colocated test directory). Not a new monorepo package.

---

## 9. Dependency Graph

```
@sciros/core
@sciros/encoding
@sciros/serialization
@sciros/persistence     ← ADD for Sprint 016
@sciros/shared
        ↑
@sciros/reference-app

OPTIONAL:  @sciros/processor
NOT REQUIRED for Sprint 016 slice: @sciros/conformance, @sciros/certification
FORBIDDEN runtime: @sciros/reference-tests
```

Forbidden reverse dependencies: Core / ENC / SER / Processor / Persistence / REF / CONF / CERT MUST NOT depend on `reference-app`.

No new infrastructure dependencies (DB drivers, queues, UI frameworks, AI SDKs).

---

## 10. ResearchSession Design

**Ownership:** OPS / Reference Application — **not** a SCI Knowledge Object.

| Aspect | Lock |
|--------|------|
| Purpose | Operational container: title/purpose metadata + ordered membership refs for one research effort |
| Identity | Caller-supplied **`research_session_id`** (operational) |
| Persistence | **OPS-memory-only for Sprint 016** (P-016-001) |
| Membership | In-memory for process lifetime |
| Mutability | Membership/metadata mutable in OPS memory; scientific payloads remain Persistence-immutable |
| Determinism | No `Date.now` / `randomUUID` for `research_session_id` |

**FINAL for Sprint 016 (P-016-001):**

- ResearchSession is **NOT** persisted by Persistence.
- Do **NOT** add a ResearchSession Persistence entity kind.
- Do **NOT** modify Persistence entity-kind definitions.
- Do **NOT** use `SerializedDocument` to persist ResearchSession.
- Do **NOT** create a durable session store.
- Do **NOT** use Persistence `appendEvent` as a substitute for durable ResearchSession persistence.
- **ResearchSession persistence is FUTURE.**

**Identity separation (P-016-002):**

| Id | Meaning |
|----|---------|
| `research_session_id` | Operational identity of the OPS ResearchSession |
| `PersistenceSession.session_id` | Infrastructure persistence session / transaction context |

They MUST NOT be conflated. They MUST NOT share semantic ownership.

Membership entries MUST be:

```
{
  entity_kind,
  unit_kind,   // required when entity_kind is CanonicalUnit (or otherwise ambiguous)
  identity     // scientific / canonical identity — authoritative
}
```

Scientific identity remains authoritative. No second scientific identity model.

---

## 11. ResearchOperations Design

**Abstraction:** `ResearchOperations` façade bound to an in-memory `ResearchSession` + injected deps:

```
deps: {
  ClaimFactory (Core),
  CanonicalEncoder (ENC),
  JsonEncoder (SER),
  PersistenceSession / PersistenceRepository,
  // Processor OPTIONAL — not required for vertical slice
}
```

**Responsibilities:** Sequence Core → ENC → Persistence → SER; maintain memory membership; project timeline / ResearchSnapshot views; raise OpsError only for OPS violations.

**Not responsible for:** Scientific validation beyond calling Core; ENC integrity algorithms; SER profile rules; CONF/CERT evaluation; Persistence storage algorithms; session durability.

**Stateful:** May hold ResearchSession + repository references. Scientific state lives in Persistence / Core objects.

**Required minimal commands/queries for Sprint 016:** see §12 and §27.

**Out of Sprint 016 required surface:** `associateViaCoreThenPersist`, `attachConformanceReport`, `attachCertificationReport`, post-persist transitions.

---

## 12. Command / Query Model

Lightweight separation (not CQRS):

**Commands (required slice):**

- `session.open(research_session_id, …)` — memory only
- `registerClaimUnit` — Core `createDraft` → ENC `assemble` → Persistence `create`
- `appendResearchEvent` — Persistence `appendEvent` only
- `registerMember` — memory membership update

**Queries (required slice):**

- `getClaimUnit(identity, { unit_kind: "ClaimUnit" })`
- `getEvents` / timeline projection
- `snapshotView` — Persistence `snapshot` + ResearchSnapshot wrap
- `exportClaimUnit` — SER-JSON-001 encode

No message bus. No separate command store.

---

## 13. Persistence Interaction

| Need | API |
|------|-----|
| Persist ClaimUnit | `entityFromCanonicalUnit` + `create` |
| Retrieve | `get(identity, "CanonicalUnit", { unit_kind: "ClaimUnit" })` |
| Journal | `appendEvent` / `getEvents` |
| Snapshot | `snapshot` (restore not required in vertical slice) |
| TX | Available; **OPTIONAL** for Sprint 016 demos (P-016-009) |

ResearchSession is never written through Persistence in Sprint 016.

Respect O-003 (dangling relationship targets allowed at create), O-004 (no destructive delete), O-005 (immutable Canonical Unit row).

---

## 14. Event / Timeline Model

- **Single journal:** PersistenceEvent only. No OPS event database, bus, CQRS store, or event-sourcing redesign.
- **Required demonstration (P-016-004):** After ClaimUnit `create`, call Persistence `appendEvent` once with:
  - existing `PersistenceEvent` shape (`event_id`, `parent_identity`, `event_type`, `payload`, `ordinal` assigned by Persistence, optional `at` only if caller-supplied — never invent wall-clock),
  - caller-supplied deterministic `event_id`,
  - `parent_identity` = claim scientific identity,
  - retrievable via `getEvents`,
  - visible in OPS timeline projection.
- Draft Claim STE may be empty; do not rely on STE for the journal demonstration.
- **Timeline:** Read-only OPS projection; sort using Persistence ordering (`parent_identity`, `ordinal`, `event_id`). Non-authoritative. Presentation labels may map `event_type` without inventing new scientific event semantics.
- Session association for timeline: filter by in-memory membership identities (not durable session events).

---

## 15. Snapshot Model

| Layer | Owner |
|-------|--------|
| `PersistenceSnapshot` | Persistence |
| `ResearchSnapshot` | OPS pure in-memory view (P-016-007) |

**Locked shape:**

```
{
  research_session_id,
  member_refs,
  persistence_snapshot
}
```

(or equivalent with the same ownership semantics)

ResearchSnapshot MUST NOT be a Persistence entity, new entity kind, second snapshot engine, or replacement for PersistenceSnapshot. Research bundle packaging is FUTURE.

---

## 16. Provenance / Audit Model

Expose authoritative Core/ENC fields only (`created_by`, `created_at`, ontology/spec pins, STE when present, integrity flags). No parallel provenance store or authorship authority in OPS.

---

## 17. Identity Model

| Id | Kind | Owner |
|----|------|-------|
| `claim:…` (and other scientific ids) | Scientific | Core / ENC |
| `persist:CanonicalUnit:{unit_kind}:{identity}` | Storage key | Persistence metadata only |
| `research_session_id` | Operational | Reference App |
| `PersistenceSession.session_id` | Infra session | Persistence |

GradeDesignationUnit shares evidence scientific identity when used in future work; lookups MUST pass `unit_kind` (P-001 lesson). Sprint 016 required path uses ClaimUnit + `unit_kind: "ClaimUnit"`.

---

## 18. Relationship Model

Relationships remain owned by Core association fields → ENC references → Persistence entity.references. Sprint 016 required slice does **not** implement Evidence association. O-003 unchanged. FUTURE for relationship workflows beyond what ENC embeds on the draft Claim (typically empty on createDraft).

---

## 19. Conformance / Certification Interaction

**P-016-005 — FUTURE for Sprint 016.**

- Not REQUIRED.
- Not in smoke.
- Not in vertical slice.
- Do not invoke ConformanceEngine or CertificationEngine.
- Do not attach ConformanceReport or CertificationReport.

Packages remain certified and unchanged. Future sprints may consume artifacts as data. Reference Tests remain outside the runtime application path.

---

## 20. Serialization / Export Boundary

- Scientific export: SER-JSON-001 `JsonEncoder` on Canonical Units.
- Application packaging / research bundles: **FUTURE** (P-016-006).
- No competing JSON profile. No ZIP/bundle format in Sprint 016.

---

## 21. Error Model

**P-016-008 — locked policy:**

1. `PersistenceError` propagates unchanged.
2. Core typed errors propagate unchanged.
3. ENC typed errors propagate unchanged.
4. SER typed errors propagate unchanged.
5. Processor typed errors propagate unchanged (if Processor used).
6. `OpsError` ONLY for genuine OPS-layer violations (unknown ResearchSession, invalid membership shape, invalid OPS command state).

Original lower-level type and code MUST remain identifiable. No second scientific error taxonomy. No blanket OpsError wrapping.

---

## 22. Transaction Model

Persistence APIs: `beginTransaction` → `tx.repository` → `commit` / `rollback` — unchanged.

**P-016-009:** Multi-write transaction demonstration is **OPTIONAL**. Not part of the required minimal vertical slice. Sequential `create` then `appendEvent` is acceptable for the required slice. Optional separate test may cover TX. No durable ACID claims (single-process atomicity only, per Sprint 015).

---

## 23. Immutability Model

| Layer | Rule |
|-------|------|
| Scientific Standing | Core (not exercised post-persist in Sprint 016) |
| Persisted Canonical Unit payload | Immutable after create (Sprint 015 / O-005) |
| ResearchSession membership | OPS-memory mutable only |

**P-016-003 — CREATE-ONCE + INSPECT:**

Sprint 016 MUST NOT perform: Core transition → re-assemble Canonical Unit → replace persisted Canonical Unit.

Post-persist scientific transitions are **FUTURE**.

Sprint 016 does **not** demonstrate post-persistence scientific transition. Do not invent versioned replacement semantics. Do not modify Persistence to accommodate this.

---

## 24. Determinism Requirements

- Caller-supplied `research_session_id`
- Caller-supplied scientific IDs (`claim_id`, …)
- Caller-supplied event IDs
- Caller-supplied Claim `created_at` (Core UTC-second form)
- No `Date.now` for deterministic artifacts
- No `randomUUID` for scientific / session identity
- Stable timeline ordering (Persistence `compareEvent` semantics)
- Stable PersistenceSnapshot representation
- Stable SER export
- Processor-generated random UUIDs MUST NOT drive Sprint 016 scientific/session identity
- Double-run identical outputs for export / snapshot view / timeline (given identical inputs)

---

## 25. Security Boundaries

| Boundary | Note |
|----------|------|
| Trust | Local privileged orchestrator of packages |
| Input validation | Delegate to Core/ENC/Persistence; OPS validates session/membership shape only |
| SER | Decode/encode only via SER-JSON-001 |
| Persistence | Existing error hygiene (no secrets in messages) |
| AuthN/AuthZ | FUTURE / PROHIBITED for Sprint 016 |

---

## 26. Testing Strategy

| Kind | Focus |
|------|-------|
| Unit | ResearchSession lifecycle, membership, OpsError-only cases, timeline projection |
| Orchestration | Core→ENC→Persistence→appendEvent→get→SER |
| Persistence integration | `unit_kind` get, IMMUTABLE_ENTITY, PersistenceError codes |
| Determinism | Double-run stable views/export |
| Boundary | No Core/CONF/CERT logic duplication; no authority file mods |

**Required test themes:**

1. ResearchSession lifecycle  
2. Session membership  
3. Session identity separation (`research_session_id` ≠ PersistenceSession.session_id)  
4. Claim Core→ENC→Persistence path  
5. `unit_kind` lookup  
6. PersistenceError propagation unchanged  
7. OpsError only for OPS violations  
8. Explicit event append  
9. Timeline projection  
10. ResearchSnapshot view  
11. SER export  
12. Deterministic double-run  
13. IMMUTABLE_ENTITY on differing replace  
14. Architecture boundary  
15. No authority/specification modification  
16. Reference Tests remain **44/44**

Reference Test corpus MUST NOT be modified. CONF/CERT remain external certified packages (unused on required path).

---

## 27. Minimal Vertical Slice

**REQUIRED Sprint 016 vertical slice (FINAL LOCK):**

1. Create ResearchSession in memory (`research_session_id` caller-supplied).  
2. Create a Claim via existing Core `ClaimFactory.createDraft`.  
3. Assemble through ENC `CanonicalEncoder.assemble`.  
4. Persist Canonical ClaimUnit through Persistence `create`.  
5. Explicitly append one deterministic PersistenceEvent (`appendEvent`).  
6. Register scientific member ref in in-memory ResearchSession (`entity_kind`, `unit_kind: "ClaimUnit"`, `identity`).  
7. Retrieve ClaimUnit with scientific identity **and** `unit_kind`.  
8. Query event journal (`getEvents`).  
9. Project events into OPS timeline.  
10. Obtain `PersistenceSnapshot`.  
11. Wrap in in-memory `ResearchSnapshot` view.  
12. Export ClaimUnit via SER-JSON-001.  
13. Verify deterministic output on repeated execution.

**MUST NOT include:** persisted ResearchSession; Evidence / Grade / Verification / Contradiction / NR workflows; CONF/CERT invocation; CLI; research bundles; post-persist scientific transitions; durable database.

**Path lock (P-016-010):** Required path is **Core → ENC → Persistence** (then SER for export). Full RPR pipeline is OPTIONAL / not required for the slice.

---

## 28. Required / Optional / Future / Prohibited Scope

### REQUIRED

- `apps/reference-app`
- `@sciros/persistence` dependency
- ResearchSession memory-only
- ResearchOperations minimal façade
- Create-once Claim vertical slice
- Explicit PersistenceEvent
- Membership
- Inspection
- Timeline
- PersistenceSnapshot
- ResearchSnapshot pure view
- SER export
- Deterministic tests
- Smoke `scripts/smoke-016-reference-app.mjs` → `SMOKE_016_PASS` with real assertions
- Documentation

### OPTIONAL

- Processor integration
- Multi-write transaction test
- Additional non-required inspection helpers

### FUTURE

- ResearchSession persistence
- Evidence / GradeDesignation / Verification / Contradiction / Negative Result workflows
- Conformance invocation
- Certification invocation
- CLI
- Research bundles
- Post-persist scientific transitions
- Durable Persistence adapter
- UI
- AI

### PROHIBITED

- Second scientific identity
- Second event journal
- Second snapshot engine
- Core logic duplication
- Persistence redesign for session storage
- Authority/specification rewrites
- Database introduction
- AI / UI / authentication / authorization / CQRS / event sourcing redesign

**CLI:** FUTURE. Smoke script is allowed and expected; it is **not** a CLI product (P-016-006).

---

## 29. Architectural Risks

| Risk | Mitigation in SPEC-016A |
|------|-------------------------|
| ResearchSession as pseudo-scientific entity | Memory-only; OPS-owned; no Persistence kind |
| App as second Core | Create-once; factories only |
| Persistence as app storage | No session persistence in Sprint 016 |
| Event journal duplication | PersistenceEvent only |
| Identity duplication | Distinct research_session_id; membership refs scientific ids |
| Immutability vs iterative research | Create-once scoped; post-persist FUTURE |
| Excessive façade | Minimal command/query set |
| Session forcing Persistence redesign | Forbidden |
| Timeline non-determinism | Persistence ordering |
| Packaging as second SER format | Bundles FUTURE |
| CONF/CERT leak | FUTURE |
| Scope → AI/UI/DB | PROHIBITED / FUTURE |

---

## 30. Open Questions

**No unresolved fundamental architecture questions remain for EXEC-SPRINT-016.**

### CLOSED (P-016-010)

| Topic | Decision |
|-------|----------|
| ResearchSession persistence | Memory-only |
| Session identity distinction | `research_session_id` ≠ PersistenceSession.session_id |
| Create-once vs post-persist transition | Create-once only |
| Event demonstration | Explicit `appendEvent` |
| CONF/CERT | FUTURE |
| CLI | FUTURE |
| Bundles | FUTURE |
| ResearchSnapshot | Pure in-memory view |
| Error wrapping | Lower-level errors propagate; OpsError OPS-only |
| Transaction demo | OPTIONAL |
| Session ID | Caller-supplied `research_session_id` |
| Pipeline path | Core→ENC→Persistence required; Processor OPTIONAL |

### Future-only (do not block EXEC-016)

- When and how ResearchSession durability should be introduced without turning Persistence into domain storage.
- How post-persist scientific transitions should interact with immutable Canonical Unit rows in a later sprint.
- Product CLI / UI surfaces after programmatic OPS proof.

---

## 31. Acceptance Criteria

Objectively testable criteria for EXEC-SPRINT-016 / CODE-AUDIT-014A:

1. ResearchSession is memory-only (not written to Persistence).  
2. `research_session_id` is distinct from `PersistenceSession.session_id`.  
3. Scientific identity remains unchanged (no second scientific identity scheme).  
4. Canonical Unit lookup uses `unit_kind` where required.  
5. Required vertical slice is create-once + inspect.  
6. Post-persist scientific transitions are not demonstrated.  
7. Explicit `appendEvent` is required and exercised.  
8. Event identity is caller-supplied / deterministic.  
9. ResearchSnapshot is a pure in-memory view wrapping PersistenceSnapshot.  
10. CONF/CERT are FUTURE (not invoked in required path/smoke).  
11. CLI is FUTURE (smoke script only; not a CLI product).  
12. Research bundles are FUTURE.  
13. Lower-level typed errors propagate unchanged.  
14. OpsError is limited to OPS-layer violations.  
15. Transaction demonstration is OPTIONAL (not required in vertical slice).  
16. Double-run output is deterministic.  
17. `get(..., { unit_kind: "ClaimUnit" })` is explicitly tested.  
18. Differing replace produces `IMMUTABLE_ENTITY`.  
19. PersistenceError codes remain observable.  
20. No authority/specification is modified.  
21. Reference Tests remain **44/44**.  
22. `SMOKE_016_PASS` contains real assertions, not labels only.

**Smoke (`scripts/smoke-016-reference-app.mjs`) must assert at minimum:** ResearchSession creation; Claim creation; canonical encoding; Persistence create; unit_kind-aware retrieval; explicit appendEvent; event retrieval; timeline; Persistence snapshot; ResearchSnapshot view; SER export; deterministic repeated output; immutable replacement rejection; error code preservation.

---

## 32. Implementation Plan

Proposed sequence for a future EXEC-SPRINT-016 (not authorized by this document):

1. Package foundation — add `@sciros/persistence`; public markers; OpsError (OPS-only).  
2. ResearchSession — memory types + membership.  
3. ResearchOperations — façade + DI (Core, ENC, SER, Persistence).  
4. Vertical slice command path — createDraft → assemble → create → appendEvent → membership.  
5. Queries — get with unit_kind, getEvents, timeline view.  
6. Snapshot view — Persistence snapshot + ResearchSnapshot wrap.  
7. SER export.  
8. Tests (required themes §26).  
9. Smoke — `scripts/smoke-016-reference-app.mjs` → `SMOKE_016_PASS`.  
10. CODE-AUDIT of implementation (after CODE-AUDIT-014A approves this spec).

Optional parallel: Processor wiring; TX commit/rollback test.

---

## 33. Future Roadmap Boundary

After Sprint 016 proof: ResearchSession durability design, post-persist transition strategy under O-005, Evidence/relationship workflows, CONF/CERT artifact attach as data, CLI product, UI consuming OPS API, durable Persistence adapter, authN/Z — all outside Sprint 016.

---

## 34. CODE-AUDIT-014 Patch Closure Matrix

| Audit Finding | Resolution |
|---------------|------------|
| P-016-001 | ResearchSession memory-only; persistence FUTURE; no entity kind / SerializedDocument / durable store / appendEvent-as-session-store |
| P-016-002 | Distinct `research_session_id` vs PersistenceSession.session_id; membership `{ entity_kind, unit_kind?, identity }` |
| P-016-003 | Create-once + inspect only; post-persist scientific transitions FUTURE |
| P-016-004 | Explicit Persistence `appendEvent` with caller-supplied deterministic event id after ClaimUnit create |
| P-016-005 | CONF/CERT invocation and attachment FUTURE |
| P-016-006 | CLI FUTURE; research bundles FUTURE; smoke script allowed (not CLI product) |
| P-016-007 | ResearchSnapshot = pure in-memory view `{ research_session_id, member_refs, persistence_snapshot }` |
| P-016-008 | Lower-layer typed errors propagate unchanged; OpsError OPS-only |
| P-016-009 | Multi-write TX demonstration OPTIONAL; not in required slice |
| P-016-010 | All architecture forks closed (§30 CLOSED table) |
| P-016-011 | Acceptance criteria strengthened (§31 items 1–22 + smoke assertions) |

Every CODE-AUDIT-014 required finding has a concrete closure above.

---

## SPEC-016A STATUS

**PATCHED — PENDING ARCHITECTURE AUDIT**

This document does **not** authorize EXEC-SPRINT-016.  
It does **not** certify Sprint 016.  
CODE-AUDIT-014A must independently verify this specification before implementation begins.

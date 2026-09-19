# IMPLEMENTATION-DECISION-020

| Field | Value |
|-------|--------|
| Decision ID | IMPLEMENTATION-DECISION-020 |
| Title | Close Model C Implementation Questions (RQ-020-001…005) |
| Version | **0.1.0-DRAFT** |
| Status | **DRAFT — READY FOR EXEC-020** |
| Baseline | `dbbc8c67b8c80feada2c6b29389b2a284a619e87` |
| Architecture | ADR-020 / SPEC-020 v0.2.0-DRAFT — **Model C** |
| Re-audit | ARCHITECTURE-RE-AUDIT-020 — APPROVED WITH OBSERVATIONS |
| Mode | Design-only — **NO IMPLEMENTATION** |
| Does not authorize | Runtime changes until a separate EXEC-020 authorization |

---

## 1. Context

ARCHITECTURE-RE-AUDIT-020 approved SPEC-020 Model C with **0** architectural SPEC patches required. EXEC remains blocked by five concrete implementation questions:

| ID | Question |
|----|----------|
| RQ-020-001 | Exact `storage_key` formula including `revision_id` |
| RQ-020-002 | Exact initial `revision_id` token |
| RQ-020-003 | Where `predecessor_revision_id` is recorded |
| RQ-020-004 | Head entity_kind / API surface |
| RQ-020-005 | First EXEC OPS transition slice |

RQ-020-006 (mandatory GradeDesignationUnit) remains **NON-BLOCKING** and is **out of scope** for this decision.

This document closes RQ-020-001…005 using ADR-020, SPEC-020, and actual repository contracts (`makeStorageKey`, `PersistenceEntity`, `PersistenceRepository`, ENC assemble, ResearchOperations). It does not reconsider Models A/B/D/E.

---

## 2. Selected Architecture

**Model C** (normative, unchanged):

```
Stable scientific identity
  + immutable revision rows
  + Persistence-owned head pointer
```

- `envelope.identity` remains scientific identity.
- `revision_id` ≠ SemVer / `content_version`.
- Differing CanonicalUnit revision-payload `replace` remains rejected.
- Linear head history; no forks.
- One Persistence journal; no second scientific graph.

---

## 3. RQ-020-001 — Storage Key Formula

### 3.1 Verified current contract

```
persist:CanonicalUnit:{unit_kind}:{identity}
```

via `makeStorageKey("CanonicalUnit", identity, unit_kind)`.

`content_version` is not in the key. Same `(unit_kind, identity)` → one slot (`ALREADY_EXISTS` on second create).

`PersistenceEntity.identity` is documented as scientific/canonical identity preserved exactly; `storage_key` is storage metadata only (`packages/persistence/src/types.ts`, README).

### 3.2 Decision — cannot reuse sole scientific identity as the only address

Under the current key, a second immutable revision for the same scientific identity **cannot** coexist. Model C therefore requires an **explicit Persistence addressing extension**.

### 3.3 Exact conceptual formula (CanonicalUnit revision rows)

```
persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}
```

| Component | Source |
|-----------|--------|
| `CanonicalUnit` | `entity_kind` |
| `{unit_kind}` | ENC `envelope.unit_kind` (e.g. `ClaimUnit`, `EvidenceUnit`, `GradeDesignationUnit`) |
| `{scientific_identity}` | Core id / `envelope.identity` (e.g. `claim:…`, `evidence:…`) |
| `{revision_id}` | Model C revision identity (see §4) |

### 3.4 Identity field mapping

| Field | Value under Model C |
|-------|---------------------|
| ENC `envelope.identity` | Scientific identity (unchanged) |
| `PersistenceEntity.identity` | Scientific identity (unchanged semantics) |
| `PersistenceEntity.revision_id` | **New Persistence metadata field** (not Core; not a change to envelope.identity) |
| `storage_key` | Formula in §3.3 |
| OPS membership `identity` | Scientific identity (unchanged) |

**Revision identity is not `CanonicalUnit.identity`.** It is Persistence addressing metadata + `PersistenceEntity.revision_id`.

### 3.5 Compatibility class

| Aspect | Classification |
|--------|----------------|
| Change type | **Additive Persistence contract extension** (new key arity + `revision_id` metadata) |
| Breaking for old keys? | Old three-segment keys remain valid as **initial revision** under dual-read (§15) |
| Scientific payload rewrite? | **No** |
| Certificate invalidation? | **No** |

### 3.6 Status

**RQ-020-001 — CLOSED**

---

## 4. RQ-020-002 — Initial Revision Token

### 4.1 Constraints from repository

- Prefixed deterministic ids are the house style: `claim:`, `evidence:`, `ste:`, `event:`, `erte:`, …
- SemVer (`1.0.0`) is Core content versioning — **must not** be the revision token (ADR-020 / SPEC-020).
- Persistence forbids wall-clock / random identity generation on Persistence paths; REF fixtures use caller-supplied ids.
- Core STE builder may fallback to `randomUUID` when `event_id` omitted — **EXEC OPS paths must always supply caller ids** (existing REF discipline).

### 4.2 Decision — reserved initial token

```
rev:initial
```

| Rule | Statement |
|------|-----------|
| Grammar | `revision_id` matches `^rev:[A-Za-z0-9._~-]{1,128}$` |
| Initial / migrated sole revision | Exactly `rev:initial` |
| Later revisions | Caller-supplied `rev:…` **≠** `rev:initial` and **≠** any existing revision_id for that `(unit_kind, scientific_identity)` |
| Authority | Caller supplies post-initial tokens; Persistence does not mint random revision ids |
| Determinism | Same inputs → same `revision_id`; no `Date.now` / `randomUUID` / counters |

### 4.3 Status

**RQ-020-002 — CLOSED**

---

## 5. RQ-020-003 — Lineage Placement

### 5.1 Evaluated locations

| Location | Verdict |
|----------|---------|
| Scientific Core artifact fields | **Rejected** — would invent scientific graph edges / conflate with `superseded_by` |
| CanonicalUnit scientific `content` | **Rejected** — ENC content is scientific projection, not Persistence revision machinery |
| PersistenceEntity metadata | **Selected** — infrastructure; aligns ADR “representation metadata” |
| Persistence event only | **Insufficient alone** — events are operational; lineage must survive without relying on journal as scientific/revision authority |
| OPS metadata / membership | **Rejected** — OPS-only graph forbidden |
| Separate second journal | **Rejected** |

### 5.2 Decision — authoritative lineage

On each CanonicalUnit `PersistenceEntity` (Persistence metadata):

| Field | Rule |
|-------|------|
| `revision_id` | Required for Model C CanonicalUnit rows |
| `predecessor_revision_id` | **Absent** on `rev:initial`; **required** on every later revision; value = prior revision’s `revision_id` |

**Authority:** Persistence representation metadata.  
**Not** Core scientific relationships.  
**Not** head movement (head is current pointer only).  
**Scientific `supersedes` / `superseded_by`:** remain Core Standing semantics only.

### 5.3 Operational citation (non-authoritative)

Optional `appendEvent` on `parent_identity = scientific_identity` may **cite** `{ revision_id, predecessor_revision_id, unit_kind }` in event payload / type (illustrative: `ops.unit_revision_recorded`). Citation must not redefine lineage if metadata fields disagree — **entity metadata wins**.

### 5.4 Reconstruction / serialization / export

| Concern | Rule |
|---------|------|
| Reconstruct lineage | Walk `predecessor_revision_id` among entities sharing `(entity_kind=CanonicalUnit, unit_kind, identity)` |
| Serialize | Include `revision_id` / `predecessor_revision_id` on PersistenceEntity in Persistence snapshot |
| Export scientific bytes | SER encodes CanonicalUnit **payload** only (unchanged); lineage is not injected into scientific JSON |
| Export “revision with lineage” for REF | Assert via PersistenceEntity metadata / getLineage helpers — not by mutating SER scientific document |

### 5.5 Status

**RQ-020-003 — CLOSED**

---

## 6. RQ-020-004 — Head API Surface

### 6.1 What head is

Mutable Persistence infrastructure pointer:

```
(unit_kind, scientific_identity) → revision_id
```

- **Not** scientific state  
- **Not** CanonicalUnit payload  
- **Not** OPS-owned truth  
- **Persisted** and included in Persistence `snapshot` / `restore`  
- **Reconstructible** from revision rows + lineage under linear history (tip = unique revision with no successor, or explicit head)

### 6.2 Storage representation

New Persistence entity kind:

```
entity_kind: "RevisionHead"
```

| Item | Formula / rule |
|------|----------------|
| `storage_key` | `persist:RevisionHead:{unit_kind}:{scientific_identity}` |
| `identity` | Scientific identity |
| Discriminator | `unit_kind` (same pattern as CanonicalUnit coexistence) |
| `content_version` | Equals the **pointed** `revision_id` (CAS token) |
| `payload` | `{ unit_kind, scientific_identity, revision_id }` (frozen infrastructure record) |
| Immutability | **`RevisionHead` is NOT in `IMMUTABLE_KINDS`** — differing `replace` allowed with `expected_version` CAS |

### 6.3 Conceptual Persistence API (not REST)

| Operation | Semantics |
|-----------|-----------|
| `getHead(scientific_identity, unit_kind)` | Return current head entity / pointed `revision_id`; `NOT_FOUND` if absent |
| `ensureInitialHead(scientific_identity, unit_kind, revision_id="rev:initial")` | Create head if absent pointing at initial revision; if exists → idempotent only if same pointer; else conflict |
| `advanceHead(scientific_identity, unit_kind, { from_revision_id, to_revision_id })` | `replace` head with `expected_version = from_revision_id`, new `content_version = to_revision_id`; stale → `CONFLICT` |
| `get(scientific_identity, "CanonicalUnit", { unit_kind, revision_id? })` | If `revision_id` provided → that row; if omitted → resolve via head then load revision row |
| `getRevision(scientific_identity, unit_kind, revision_id)` | Direct revision row load |
| `listRevisions(scientific_identity, unit_kind)` | All revision rows for pair; deterministic sort by `revision_id` string (not wall-clock) |
| Branching | **Not supported** — `advanceHead` from non-current head fails CONFLICT |

### 6.4 Guarantees (in-memory honesty)

| Guarantees | Does **not** guarantee |
|------------|------------------------|
| Single-process CAS via `expected_version` | Distributed multi-writer serializability |
| Linear head history | Automatic merge of concurrent branches |
| Deterministic conflict errors | Cross-process locking |

### 6.5 Ownership

| Layer | Role |
|-------|------|
| Core | Never writes head |
| Persistence | Owns head storage + CAS API |
| OPS | Orchestrates `advanceHead` after successful revision `create` |

### 6.6 Status

**RQ-020-004 — CLOSED**

---

## 7. RQ-020-005 — OPS Implementation Slice

### 7.1 Minimal EXEC-020 slice (selected)

Prove Model C end-to-end on **Claim Standing** while keeping Evidence create-once compatible as initial revisions only.

| In slice | Out of first slice |
|----------|-------------------|
| Persistence Model C contract (keys, revision metadata, RevisionHead, snapshot heads) | Post-persist Evidence Record transitions |
| Claim initial persist as `rev:initial` + head | Grade OPS / Contradiction / NR / Verification OPS |
| `transitionClaimStanding` post-persist path | Mandatory GradeDesignationUnit (RQ-020-006) |
| Claim get head / get revision / lineage / export head-resolved | REST/API/UI |

Evidence `registerEvidenceUnit` / `getEvidenceUnit` / `exportEvidenceUnit` remain; they **must** create/read initial revision + head under Model C Persistence so Evidence does not break, but **no** Evidence post-persist transition method in EXEC-020.

### 7.2 Required ResearchOperations methods

#### A. `registerClaimUnit` (extend existing)

| Aspect | Contract |
|--------|----------|
| Input | Existing `CreateClaimInput` (+ optional explicit `revision_id`; default `rev:initial`) |
| Behavior | Core createDraft → ENC → `create` revision row → `ensureInitialHead` |
| Output | `{ claim, unit, entity }` (existing shape; entity carries `revision_id`) |
| Membership | Unchanged (caller registers scientific identity) |
| Errors | Lower-layer propagate |

#### B. `registerEvidenceUnit` (extend existing — initial only)

Same initial-revision + head pattern; optional pre-persist transition unchanged (SPEC-019). No post-persist Evidence API in this slice.

#### C. `transitionClaimStanding` (**new**)

| Aspect | Contract |
|--------|----------|
| Input | `identity`, Core `StandingTransitionInput` (incl. caller `event_id`/`at`), `revision_id` (new), `expected_head_revision_id` |
| Sequence | `get` headed ClaimUnit → decode Core Claim from payload → `ClaimTransitionService.transition` → ENC assemble → `create` new revision (`predecessor_revision_id = expected_head_revision_id`) → `advanceHead` → optional `appendEvent` |
| Output | `{ claim, unit, entity, head_revision_id }` |
| Membership | No schema change; still scientific identity |
| Errors | Core / ENC / Persistence typed errors; stale head → Persistence `CONFLICT` |

#### D. Read / support methods (**new or thin wrappers**)

| Method | Role |
|--------|------|
| `getClaimUnit(identity)` | **Head-resolved** (backward-compatible meaning of “current”) |
| `getClaimUnitRevision(identity, revision_id)` | Specific revision |
| `getClaimHead(identity)` | Head pointer record / revision_id |
| `getClaimLineage(identity)` | Ordered predecessor chain metadata |
| `exportClaimUnit(identity)` | SER-JSON of **head** revision payload (existing method semantics = current) |
| `exportClaimUnitRevision(identity, revision_id)` | SER-JSON of specific revision payload |

#### E. Snapshots

Existing `snapshotView` / `workspaceSnapshotView` unchanged schemas; Persistence `snapshot` **must** include `RevisionHead` entities and all revision rows.

### 7.3 Status

**RQ-020-005 — CLOSED**

---

## 8. Identity Contract

| Identity | Rule |
|----------|------|
| Scientific | Stable Core id |
| Canonical (`envelope.identity`) | = scientific |
| Revision | `rev:…` Persistence metadata |
| PersistenceEntity.identity | = scientific |
| storage_key | §3.3 |
| OPS membership | scientific + `unit_kind` |
| Session / workspace | Unchanged operational ids |

---

## 9. Revision Contract

```
previous immutable revision row
  → Core transition
  → ENC assemble (same scientific identity; SemVer as Core dictates)
  → Persistence.create new row (new revision_id; predecessor set)
  → advanceHead CAS
  → optional appendEvent
```

No differing replace of revision payloads.

---

## 10. Lineage Contract

- Authoritative: `predecessor_revision_id` on PersistenceEntity  
- Scientific supersession: Core only  
- No second graph  
- Reconstruct by walking predecessors  

---

## 11. Head Contract

- Kind `RevisionHead`; key `persist:RevisionHead:{unit_kind}:{identity}`  
- Mutable via `replace` + `expected_version`  
- One head per `(unit_kind, scientific_identity)`  
- Not scientific truth  

---

## 12. Persistence Contract

EXEC must extend Persistence to provide:

1. CanonicalUnit revision `storage_key` formula (§3.3)  
2. `PersistenceEntity.revision_id` / `predecessor_revision_id`  
3. `RevisionHead` kind + CAS via `content_version = revision_id`  
4. `get` options: `revision_id?` + head resolution when omitted  
5. Snapshot/restore includes heads + all revision rows  
6. Dual-read compatibility for pre-Model-C keys (§15)  
7. CanonicalUnit revision payloads remain immutable; heads mutable  

No second journal. No DB.

---

## 13. Partial-Write Contract

Ordered steps for `transitionClaimStanding`:

| Step | On failure |
|------|------------|
| A. Core transition | Stop; nothing persisted |
| B. ENC assemble | Stop; nothing persisted |
| C. `create` revision | Stop; head unchanged |
| D. `advanceHead` | **Partial:** revision row may exist without being head; head remains prior; **not** silent current scientific commit; caller may retry `advanceHead` with same `to_revision_id` if row exists and fingerprint matches, or leave orphan addressable via `getClaimUnitRevision` |
| E. `appendEvent` | Scientific revision+head may exist without operational event; journal is non-authoritative |
| F. Membership | Caller-controlled; failure does not roll back Persistence |

**No multi-step transaction. No automatic delete of orphan revisions** (delete remains forbidden for authoritative artifacts). Orphans are detectable (revision row not pointed by head and not in predecessor chain from head — or simply “not head”).

---

## 14. Determinism Contract

| Artifact | Rule |
|----------|------|
| `revision_id` | Caller-supplied (except default `rev:initial`) |
| Head CAS inputs | Explicit `from` / `to` |
| Lineage order for lists | Sort by `revision_id` codepoint order (document in EXEC); chain walk follows predecessors |
| SER export | Deterministic encoder; payload only |
| Snapshots | Existing Persistence deterministic snapshot rules + heads |
| Forbidden | `Date.now`, `randomUUID`, process counters for revision/head identity |

---

## 15. Existing Data Compatibility

| Rule | Statement |
|------|-----------|
| Old three-segment CanonicalUnit key | **≡** revision `rev:initial` for that `(unit_kind, identity)` |
| Dual-read | `getRevision(..., "rev:initial")` and head resolution must find old-form keys |
| New writes | Always use four-segment revision keys |
| Head bootstrap | On first Model C read/write touching an old unit: `ensureInitialHead(..., "rev:initial")` if missing |
| Payloads / events / certificates | Untouched |
| Optional key rewrite | Allowed as Persistence-only metadata migration; **not required** if dual-read is implemented |

**old entity = initial revision (`rev:initial`).**

---

## 16. REF / CONF / CERT Impact

Future additive REF-OPS (not created now), prefer `CONF-001@1.1.0-OPS`:

| Category | Evidence |
|----------|----------|
| Initial revision | registerClaim → `revision_id=rev:initial` + head |
| Post-persist revision | transitionClaimStanding creates new rev + head advance |
| Lineage | predecessor chain correct |
| Head | getHead matches |
| Stale head | CONFLICT |
| Duplicate revision_id | ALREADY_EXISTS / typed error |
| Idempotent identical | same revision_id + fingerprint |
| Deterministic SER | double-run export |
| Snapshot | contains prior+new revisions + RevisionHead |
| Partial-write | create without head advance leaves head unchanged |
| Regression | SCI 44; prior OPS 36; Claim/Evidence create-once paths |

SCI profile / engines unchanged unless Core changes (not in slice).

---

## 17. EXEC-020 Required Operations

| # | Layer | Operation |
|---|-------|-----------|
| 1 | Persistence | Revision storage_key + entity metadata |
| 2 | Persistence | RevisionHead + CAS API |
| 3 | Persistence | Head-aware get + dual-read |
| 4 | Persistence | Snapshot includes heads |
| 5 | OPS | registerClaimUnit / registerEvidenceUnit initial revision+head |
| 6 | OPS | transitionClaimStanding |
| 7 | OPS | getClaimUnit (head), getClaimUnitRevision, getClaimHead, getClaimLineage |
| 8 | OPS | exportClaimUnit (head), exportClaimUnitRevision |
| 9 | REF/Tests | Additive fixtures for above |
| 10 | Docs | IMPLEMENTATION.md Sprint 020 facts |

---

## 18. Remaining Open Questions

| ID | Status |
|----|--------|
| RQ-020-001…005 | **CLOSED** by this document |
| RQ-020-006 | Still NON-BLOCKING / out of slice |
| OQ-020-015 / 016 | Deferred (outside Sprint 020 selection) |
| Exact TypeScript method signatures / error subclasses | EXEC coding detail within this contract |
| Whether optional key rewrite is implemented vs dual-read only | EXEC choice; both allowed under §15 |

**No remaining question reopens Model C or RQ-001…005.**

---

## 19. Final Implementation Readiness

```
IMPLEMENTATION-READY
```

| Gate | Status |
|------|--------|
| RQ-020-001 | CLOSED |
| RQ-020-002 | CLOSED |
| RQ-020-003 | CLOSED |
| RQ-020-004 | CLOSED |
| RQ-020-005 | CLOSED |
| Hidden architecture invention required? | **No** — formulas and ownership fixed |
| Model C implementable without Model A/B/D? | **Yes** |

### SPEC-020 sections to patch afterward (not in this task)

When project process requires SPEC alignment with this decision, patch:

| Section | Update |
|---------|--------|
| §4.5 / §8 / §23 | Exact storage_key formula §3.3 |
| §5 / §30 | Record `rev:initial`; close RQ-001…005 as decided here |
| §12–§13 | Lineage on PersistenceEntity metadata |
| §22 / head | RevisionHead kind + CAS API summary |
| §24 / §31 | EXEC-020 Claim Standing slice; Evidence initial-only |
| §27 | Dual-read / old key ≡ `rev:initial` |
| §28 | Partial-write contract §13 |
| §31.2 | Preconditions satisfied by this decision |

**Do not patch SPEC-020 in this task.**

---

*End of IMPLEMENTATION-DECISION-020 v0.1.0-DRAFT — IMPLEMENTATION-READY.*

# SPEC-020 — Post-Persist Scientific Transition Contract

| Field | Value |
|-------|--------|
| Spec ID | SPEC-020 |
| Title | Post-Persist Scientific Transition Contract |
| Version | **0.3.0-DRAFT** |
| Status | **DRAFT — READY FOR RE-AUDIT** |
| Mode | Architecture / specification only — **NO IMPLEMENTATION** |
| Project | AIP — evidence-driven computational platform for exploring, modeling, and researching human biology |
| Inputs | SCI-001…006, ENC-001, Persistence Foundation (Sprint 015), SPEC-016A, SPEC-017, SPEC-018 v0.2.0-PATCHED, SPEC-019 v0.1.0-DRAFT, ARCHITECTURE-REVIEW-001/002, EXEC-SPRINT-016…019 certified, ARCHITECTURE-AUDIT-020, EXEC-020 BLOCKED, ADR-020 / ARCHITECTURE-DECISION-020 (Model C), ARCHITECTURE-RE-AUDIT-020, **IMPLEMENTATION-DECISION-020 (RQ-020-001…005 CLOSED)** |
| Intended re-audit | Final architecture re-audit of this patched SPEC before any EXEC |
| Does not claim | Certification, runtime Persistence change already landed, or EXEC authorization without re-audit |

---

## 1. Status

**Version:** `0.3.0-DRAFT`  
**Status:** DRAFT — READY FOR RE-AUDIT  

**SELECTED ARCHITECTURE (normative):**

```
Model C — Stable Scientific Identity + Immutable Revisions + Head Pointer
```

Authority: ADR-020 / ARCHITECTURE-DECISION-020; concrete Persistence/OPS formulas: **IMPLEMENTATION-DECISION-020**.

This document binds Model C and closes RQ-020-001…005. Models A, B, and D remain **rejected** (see §9 / §33).

This patch authorizes **neither** runtime changes nor immediate EXEC. Runtime landing remains **future EXEC** after final re-audit (§31).

**Sprint 020 EXEC scope (normative):** Model C Persistence infrastructure + Claim Standing post-persist transition; Evidence = initial-revision registration only (Sprint 019 semantics preserved).

**Baseline HEAD:** `dbbc8c67` (Sprint 019 FORMALLY CERTIFIED AND CLOSED).

---

## 2. Problem

AIP certified OPS workflows are **create-once**:

```
Core factory (+ optional in-memory transition)
  → ENC assemble
  → Persistence.create
```

Scientific Core, however, defines **evolution** of scientific meaning after an object exists:

| Unit | Example evolution |
|------|-------------------|
| Claim | Standing transitions (`draft_unverified` → `supported` → …); material version bumps |
| Evidence | Record State `draft` → `registered` → `withdrawn`; material version bumps; Grade assignment bumps `evidence_version` |
| Grade | Assignment changes Evidence `grade_ref` and may emit GradeDesignationUnit |
| Contradiction | Record State open → `resolved_*` / `unresolved_archived` |
| Negative Result | Registration / withdrawal transitions |
| Verification | planned → passed / failed / … |

Persistence stores CanonicalUnits as **immutable after create**: differing `replace` → `IMMUTABLE_ENTITY`. Optimistic `expected_version` exists but is **not** scientific mutation authorization.

**Problem:** Core allows scientific evolution; Persistence rejects mutation of stored CanonicalUnit payloads; OPS needs an audited Model C contract for post-persist evolution while preserving history, identity clarity, determinism, and authority boundaries.

---

## 3. Current certified baseline

| Layer | Certified fact |
|-------|----------------|
| Sprint 017–019 | FORMALLY CERTIFIED AND CLOSED |
| SCI / OPS / FULL | 44 / 36 / 80 |
| Profiles | `CONF-001@1.0.0`, `CONF-001@1.1.0-OPS` |
| Claim OPS / Evidence OPS | create-once; Evidence may optionally transition **before** first persist |
| ResearchSnapshot | Frozen field-set |
| WorkspaceSnapshot | Additive OPS view |
| Persistence | Memory adapter; single event journal; create-once CanonicalUnits |
| SPEC-018 §10.7 | Post-persist transition designed as FUTURE; replace/version interaction left open |
| ADR-020 / IMPLEMENTATION-DECISION-020 | Model C selected; RQ-020-001…005 **CLOSED**; EXEC awaits final re-audit |

---

## 4. Existing contracts

### 4.1 Core (scientific)

- **Claim:** `claim_id` stable; `claim_version` SemVer; `standing` + append-only `standing_transition_log` (STE); `ClaimTransitionService`; `ClaimVersionService` for material content bumps; `supported_by` independent of Evidence `bears_on` (SCI-001 SSR-5).
- **Evidence:** `evidence_id` stable; `evidence_version`; `record_state` + `record_transition_log` (ERTE); `EvidenceTransitionService`; Grade assignment via `EvidenceGradeService.assign` returns **new Evidence** with bumped version + `grade_assignment_log` (does **not** change Record State or Claim Standing).
- **Contradiction / NR / Verification:** factories + transition services; record logs; version services for material change.
- Core in-memory repositories are **not** Persistence.

### 4.2 ENC

- `CanonicalEnvelope`: `identity`, `content_version`, `unit_kind`, pins, `references[]`, `events[]`, `content`.
- `content_version` is projected from Core scientific version fields (e.g. `claim_version`, `evidence_version`).
- `CanonicalReference` may carry optional `version_hint`.
- Transitions/grade logs are mapped into unit `events` at assemble time.

### 4.3 Persistence (infrastructure)

- `create` / `get` / `replace` / `appendEvent` / `getEvents` / `snapshot` / `restore`.
- `PersistenceEntity`: `identity`, `content_version`, `storage_key`, payload (CanonicalUnit), references, events.
- **CanonicalUnit `storage_key` (certified today):** `persist:CanonicalUnit:{unit_kind}:{identity}` — **does not include `content_version` or `revision_id`**.
- `IMMUTABLE_KINDS` includes `CanonicalUnit` (and bare Claim/Evidence kinds if used).
- `replace`: identical fingerprint → idempotent success; differing content on immutable kind → `IMMUTABLE_ENTITY`; stale `expected_version` → `CONFLICT`.
- Single append-only Persistence event journal.

### 4.4 OPS (Sprint 016–019)

- Orchestrates Core → ENC → `create` only for Claim/Evidence.
- Membership points at `identity` + `unit_kind` (no revision pointer today).
- Timeline projects Persistence events; not scientific provenance.
- ResearchSnapshot / WorkspaceSnapshot unchanged schemas.

### 4.5 Repository discovery and Model C addressing (normative)

**D-020-001 (certified today):** Under **current** Persistence, two CanonicalUnits with the same `(unit_kind, identity)` share one `storage_key`:

```
persist:CanonicalUnit:{unit_kind}:{identity}
```

A second `create` with the same identity fails (`ALREADY_EXISTS`). That three-segment key is **insufficient** for Model C because immutable revisions cannot coexist under one slot.

**Model C CanonicalUnit revision key (IMPLEMENTATION-DECISION-020 / RQ-020-001 CLOSED):**

```
persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}
```

| Field | Meaning |
|-------|---------|
| `scientific_identity` | = `PersistenceEntity.identity` = ENC `envelope.identity` (stable Core id) |
| `revision_id` | Persistence metadata identifying one immutable revision row (**not** SemVer / `content_version`) |

Create-once applies **per revision row**. Prior revision keys remain occupied and immutable. Today’s three-segment keys are **not** silently reinterpreted as already versioned; they coexist via dual-read as `rev:initial` (§27).

---

## 5. Definitions

| Term | Meaning in this SPEC |
|------|----------------------|
| **Scientific identity** | Stable Core id (`claim_id`, `evidence_id`, …). Does **not** change across revisions. = `PersistenceEntity.identity` |
| **Revision identity** (`revision_id`) | Persistence metadata id of one immutable revision. Grammar `^rev:[A-Za-z0-9._~-]{1,128}$`. Initial = **`rev:initial`**. Later = caller-supplied `rev:…` ≠ `rev:initial`. **≠** SemVer / `content_version` / `expected_version` |
| **Canonical identity** | ENC `envelope.identity` — remains equal to scientific identity |
| **Content version** | ENC/Persistence entity `content_version` (= Core SemVer at assemble for CanonicalUnits). On `RevisionHead`, `content_version` = pointed `revision_id` (CAS token only) |
| **Persistence `expected_version`** | Optimistic concurrency argument to `replace` — **not** scientific mutation authorization and **not** `revision_id` of a CanonicalUnit row |
| **CanonicalUnit storage key** | `persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}` |
| **RevisionHead storage key** | `persist:RevisionHead:{unit_kind}:{identity}` |
| **OPS membership identity** | Scientific identity + `unit_kind` |
| **ResearchSession / ResearchWorkspace identity** | Operational ids; unchanged by Model C |
| **Persisted representation / revision row** | Immutable CanonicalUnit PersistenceEntity at a revision key |
| **In-memory transition** | Core transition before any Persistence write |
| **Post-persist transition** | Core → new immutable revision create → RevisionHead CAS → optional event |
| **Scientific provenance** | Core STE/ERTE/GAE/… + provenance fields + ENC unit events |
| **Persistence history** | Single `appendEvent` journal |
| **OPS timeline** | Projection of Persistence events |
| **Lineage** | Authoritative field `PersistenceEntity.predecessor_revision_id` (**not** Core/OPS graph) |
| **RevisionHead** | Mutable Persistence coordination pointer `(unit_kind, scientific_identity) → revision_id`. **Not** scientific truth |

**Determinism:** no `randomUUID` / `Date.now` / implicit counters for `revision_id` or head identity on EXEC evidence paths; caller-supplied ids; reproducible double-run.

**Forbidden ambiguous uses:** “update”, “modify”, “replace” unless tied to a named Persistence API. Post-persist evolution is **not** “replace CanonicalUnit scientific payload.”

---

## 6. Authority model

| Concern | Owner |
|---------|-------|
| Whether a transition is legal; resulting scientific object | **Scientific Core** |
| Canonical projection / integrity | **ENC** |
| Storage addressing, immutability, journal, snapshots, **head index** | **Persistence** |
| Sequencing Core → ENC → Persistence; membership; projections | **OPS** |
| Evidence of behavior | **REF** |
| Evaluation / certification | **CONF / CERT** |

OPS may **request** orchestration. OPS **must not** define standing, record state, grade meaning, or relationships. Head is **not** scientific authority.

---

## 7. Immutability model

**Principle:** Historical truth must not be silently rewritten.

**Normative under Model C (ADR-020):**

```
previous immutable revision row
  → Core transition yields next scientific object
  → ENC assembles next CanonicalUnit
  → Persistence.create new immutable revision row
  → Persistence advances head (CAS)
```

- An existing scientific revision is **immutable**.
- A scientific transition does **NOT** mutate the previous revision.
- Differing `replace` of a stored CanonicalUnit **revision payload** remains rejected (`IMMUTABLE_ENTITY` spirit).
- **`RevisionHead`** is the mutable coordination pointer (CAS/`replace` allowed; **not** in `IMMUTABLE_KINDS`). Mutating RevisionHead is **not** mutating a scientific revision.
- Model D audited overwrite of the scientific slot is **rejected**.

**Current Persistence fact (until EXEC):** differing `replace` of CanonicalUnit is rejected; today’s three-segment key cannot hold multiple revisions (D-020-001).

---

## 8. Identity model

### 8.1 Certified today (pre-Model-C runtime)

```
scientific id == CanonicalUnit.identity == PersistenceEntity.identity
storage_key = persist:CanonicalUnit:{unit_kind}:{identity}
content_version on entity/envelope but not on storage_key
```

### 8.2 Normative under Model C (IMPLEMENTATION-DECISION-020)

| Layer | Normative rule |
|-------|----------------|
| Scientific identity | Stable; = `PersistenceEntity.identity` |
| Canonical identity | `envelope.identity` = scientific identity |
| Revision identity | `revision_id` Persistence metadata; initial `rev:initial`; later caller `rev:…` |
| CanonicalUnit `storage_key` | `persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}` |
| RevisionHead `storage_key` | `persist:RevisionHead:{unit_kind}:{identity}` |
| OPS membership | Scientific identity (+ `unit_kind`); **current** via RevisionHead |
| Session / workspace ids | Unchanged |

**Coexistence:** each revision is a **new create** under the four-segment key. Create-once applies per revision row. `revision_id` is **not** `CanonicalUnit.identity`.

**Version trichotomy (must not merge):**

| Token | Meaning |
|-------|---------|
| `revision_id` | Identifies an immutable revision row |
| `content_version` (CanonicalUnit) | Core SemVer projection |
| `expected_version` / RevisionHead `content_version` | Persistence CAS / concurrency only |

ENC `version_hint` remains a pointing hook — not revision storage or head.

---

## 9. Selected architecture and rejected alternatives

### 9.1 SELECTED — Model C (normative)

**Model C — Stable Scientific Identity + Immutable Revisions + Head Pointer**

Binding (ADR-020):

1. Scientific id stable; `envelope.identity` = scientific id.  
2. Each post-persist transition → new immutable revision row with new caller-supplied `revision_id`.  
3. Persistence-owned **head**: `(unit_kind, scientific_identity) → revision_id`.  
4. Lineage via `predecessor_revision_id` (representation metadata).  
5. `revision_id` ≠ SemVer/`content_version`.  
6. Linear history only; no scientific forks.  
7. Differing CanonicalUnit replace for scientific payloads remains rejected.

### 9.2 REJECTED — Model A

**Rejected because:** `content_version`-keyed rows conflict with Core SemVer preservation on Standing/Record transitions; current storage_key forbids multi-row; SemVer ≠ revision identity (ADR-020).

### 9.3 REJECTED — Model B (standalone)

**Rejected because:** breaks certified Canonical↔scientific identity equality; cannot resolve scientific-id lookup/snapshots without a head — incomplete, and with a head collapses into Model C at higher identity cost (ADR-020).

### 9.4 REJECTED — Model D

**Rejected because:** weakens certified CanonicalUnit immutability; replace is not revision coexistence; “state at T” depends on archive strength (ADR-020).

### 9.5 Model E

Not introduced. Model C meets hard requirements.

---

## 10. Transition semantics

### 10.1 Normative orchestration shape (Model C)

```
OPS receives transition request
  (caller-supplied scientific ids, revision_id, timestamps, decision_ref as Core requires;
   expected head revision for CAS)
  → load prior revision (headed revision or explicit predecessor)
  → Core transition / grade assign / version service validates & returns next Core object
  → ENC assembles next CanonicalUnit (envelope.identity = scientific id;
       content_version = Core SemVer)
  → Persistence.create new immutable revision row (addressing includes revision_id)
  → Persistence head CAS: expected predecessor → new revision_id
  → optional Persistence.appendEvent (operational audit only)
  → OPS projections: membership still scientific id; current via head (not scientific rewrite)
```

Scientific transition success (Core) ≠ Persistence create success ≠ head CAS success ≠ event append success. No distributed transaction is claimed. EXEC must document actual ordering and failure visibility (see §28 / §31).

### 10.2 Pre-persist vs post-persist

| Mode | Status today | SPEC-020 |
|------|--------------|----------|
| Pre-persist Core transition then create-once | Certified (Evidence optional path; Claim typically draft) | Remains valid; must not be broken |
| Post-persist evolution | Not available for differing CanonicalUnit content under today’s key | **Model C** after Persistence contract extension + EXEC |

### 10.3 What “transition” means

A post-persist transition is **not** “OPS changed standing” and **not** “update existing entity.”

It is:

```
existing immutable revision
  → Core validates/performs scientific transition
  → new immutable scientific revision
  → canonical encoding
  → Persistence create
  → head advance per contract
```

---

## 11. Provenance semantics

Must remain distinct:

| Layer | Source | Answers |
|-------|--------|---------|
| Scientific provenance | Core STE/ERTE/GAE/… + Evidence.provenance + ENC unit events | Why is scientific state S? Who authorized? |
| Persistence history | `appendEvent` journal | What storage/OPS actions occurred? |
| OPS timeline | Projection of Persistence events | Operational audit for a session |

**Must not merge** these into one authority. A Persistence event may **cite** a Core event_id / decision_ref / revision_id but must not redefine scientific meaning.

---

## 12. Event semantics

- **One** Persistence journal only (R8).
- Illustrative operational event types (may cite revision/head; names not scientifically authoritative): `ops.unit_revision_recorded`, `ops.head_advanced`, `ops.transition_orchestrated`.
- Core ERTE/STE/GAE remain in Core objects / ENC unit events.
- Ordering: Persistence deterministic compare rules; Core logs retain Core ordering.
- Journal citations of `revision_id` / `predecessor_revision_id` are **non-authoritative** if they disagree with PersistenceEntity metadata — **entity metadata wins** (§13).
- The journal is not a second scientific provenance system.

---

## 13. Relationship and lineage semantics

Scientific relationships live on **Core objects / ENC projections**, not OPS membership.

| Question | Normative Model C answer |
|----------|--------------------------|
| Do scientific edges belong to each immutable revision? | **Yes** — each CanonicalUnit content carries relationship arrays at that revision |
| Authoritative representation lineage | **`PersistenceEntity.predecessor_revision_id`** (absent on `rev:initial`; required on later revisions) |
| Parent / predecessor | Prior `revision_id` for same `(unit_kind, scientific_identity)` |
| Child / successor | New `revision_id` created by post-persist orchestration |
| Lineage traversal | Walk `predecessor_revision_id` among CanonicalUnit revision rows |
| Serialization | `revision_id` / `predecessor_revision_id` on PersistenceEntity; included in Persistence snapshot |
| SER export of scientific bytes | CanonicalUnit **payload** only — lineage **not** injected into scientific JSON |
| Scientific `supersedes` / `superseded_by` | Core Claim Standing only — **not** RevisionHead movement |
| `bears_on` ↔ `supported_by` | Remain **independent** (SCI-001 SSR-5) |

**No second Core/OPS lineage graph. No second scientific relationship system.** Lineage authority is Persistence representation metadata only. OPS must not own lineage.

---

## 14. Grade dependency

**Repository facts (unchanged):**

- `EvidenceGradeService.assign` returns a **new Evidence** with updated `grade_ref`, GAE, and **bumped `evidence_version`**.
- Does not change Evidence Record State or Claim Standing.
- ENC can build `GradeDesignationUnit` (separate `unit_kind`); coexistence with EvidenceUnit via `unit_kind` discriminator.

**Normative under Model C (ADR-020):**

| Question | Answer |
|----------|--------|
| Is Grade an independent unit? | GradeDesignationUnit **may** be persisted as its own CanonicalUnit kind |
| Does Grade mutate a prior Evidence revision row? | **No** |
| Does Grade modify Claim? | **No** |
| Post-persist Grade | Requires a **new EvidenceUnit revision** (+ optional GradeDesignationUnit revision under same scientific evidence id) |
| Pre-persist Grade | Still possible before first EvidenceUnit create without revision machinery |
| Immutability | Prior Evidence revision unchanged |

Grade OPS **implementation** remains out of scope unless separately authorized. Whether GradeDesignationUnit revisions are **mandatory** on post-persist grade = **RQ-020-006** (soft).

---

## 15. Claim dependency (Sprint 020 post-persist slice)

**Repository facts:**

- Standing transitions via `ClaimTransitionService` produce new Claim objects; append STE; **preserve `claim_version`**.
- Claim OPS today persists create-once drafts; no post-persist Standing yet.
- Material content bumps `claim_version` via `ClaimVersionService`.

**Normative Sprint 020 Claim Standing post-persist flow:**

```
existing immutable Claim revision (headed)
  → Core ClaimTransitionService validates/performs Standing transition
  → ENC assembles new ClaimUnit (same scientific identity; SemVer as Core dictates)
  → Persistence.create new immutable Claim revision
       (revision_id caller-supplied; predecessor_revision_id = expected head)
  → RevisionHead advance via replace + expected_version CAS
  → optional operational appendEvent / OPS projection
```

- Previous Claim revision remains immutable and addressable.
- Scientific Standing semantics remain **Core-owned**; OPS orchestrates only.
- `superseded` / `superseded_by` remain Core semantics — not RevisionHead pointers.
- SemVer need **not** bump solely for Persistence addressing.

---

## 16. Evidence dependency (Sprint 020 = initial revision only)

**SPEC-019 certified (preserved):**

- Draft create-once.  
- Optional **pre-persist** `EvidenceTransitionService` (Human Reviewer for `registered`; AI cannot register).  
- No post-persist Record State evolution in Sprint 019.

**Sprint 020 normative Evidence scope:**

- Evidence registration becomes Model C **initial revision** (`rev:initial` + RevisionHead) so Persistence addressing is consistent.
- Sprint 019 Evidence OPS semantics remain valid (create-once + optional pre-persist transition).
- **No** Evidence post-persist Record State / material / Grade OPS transition implementation in Sprint 020.

Future Evidence post-persist remains Model C–compatible but **out of Sprint 020 EXEC slice**.

---

## 17. Contradiction dependency

- Factory `createOpen`; transitions to `resolved_*` / `unresolved_archived` (Core vocabulary — **not** `withdrawn`).  
- Involves Claim ids scientifically.  
- Create-once OPS possible without Model C EXEC; **resolution after persist** needs Model C revision + head.  
- No Contradiction OPS implementation in this SPEC.

---

## 18. NR dependency

- `createRegistered` embeds registration transition.  
- Later withdrawal after persist → new NegativeResultUnit revision + head.  
- No NR OPS implementation in this SPEC.

---

## 19. Verification dependency

- `createPlanned`; Human-gated leave-planned; AI restrictions.  
- Outcome after persist → new VerificationUnit revision + head.  
- No Verification OPS implementation in this SPEC.

---

## 20. Snapshot implications

**Frozen / additive schemas (unchanged):**

- `ResearchSnapshot = { research_session_id, member_refs, persistence_snapshot }` (Sprint 016 frozen)  
- `WorkspaceSnapshot` additive (Sprint 018)

**Normative under Model C:**

| Aspect | Rule |
|--------|------|
| `member_refs.identity` | Remains **scientific identity** |
| Current representation | **RevisionHead**-resolved revision at snapshot capture |
| Specific revision | Addressable via Persistence get by `revision_id` (OPS helpers); not a ResearchSnapshot schema field |
| Lineage | Via PersistenceEntity `predecessor_revision_id` / list revisions — not membership schema |
| Persistence snapshot | **Must include** all CanonicalUnit revision rows **and** `RevisionHead` entities |
| Schema break | **Forbidden** |

---

## 21. Determinism

Any future EXEC of this contract **SHALL**:

- Use caller-supplied scientific ids, `revision_id`, event ids, timestamps (`at`).  
- Avoid `Date.now` / `Math.random` / `randomUUID` on evidence paths.  
- Define deterministic ordering for lineage, head advances, and journal appends.  
- Ensure double-run identical inputs ⇒ identical serialized representations and projections.  
- Forbid hidden head mutation without explicit, deterministic orchestration inputs (expected head revision required for CAS).

---

## 22. Concurrency and RevisionHead CAS

**Normative (IMPLEMENTATION-DECISION-020):**

`RevisionHead` entity:

| Item | Rule |
|------|------|
| `entity_kind` | `RevisionHead` |
| `storage_key` | `persist:RevisionHead:{unit_kind}:{identity}` |
| `identity` | Scientific identity |
| `content_version` | Equals pointed `revision_id` (CAS token) |
| Immutability | **Not** in `IMMUTABLE_KINDS` — differing `replace` allowed |
| Scientific truth? | **No** — pointer only |

Advancement: `replace(head, { expected_version: from_revision_id })` with new pointed `to_revision_id`.

| Scenario | Outcome |
|----------|---------|
| Head at R1; R1→R2 and R1→R3 | Second stale advance → Persistence `CONFLICT` |
| Branching / forks | **Not authorized** — linear history only |
| Same `revision_id` + identical fingerprint | Idempotent create success |
| Same `revision_id` + different payload | Typed error |
| Distributed multi-writer | **Not claimed**; in-memory single-process CAS only |
| CanonicalUnit differing replace | Still `IMMUTABLE_ENTITY`; scientific evolution uses **create revision + head CAS** |

---

## 23. Persistence boundary

Persistence remains **infrastructure**.

Persistence **stores**:

- Immutable CanonicalUnit revision rows (scientific payloads already Core/ENC-authorized)
- Mutable `RevisionHead` coordination state
- Single operational event journal

Persistence does **not** determine Claim Standing, Evidence meaning, Grade meaning, contradiction/verification meaning, or scientific truth.

**Authorized for Sprint 020 EXEC (after final re-audit):**

- Four-segment CanonicalUnit revision keys (§4.5)  
- `PersistenceEntity.revision_id` / `predecessor_revision_id`  
- `RevisionHead` + `replace`/`expected_version` CAS  
- Head-aware get + dual-read of pre-Model-C keys as `rev:initial`  
- Snapshot/restore includes heads + all revision rows  
- Memory adapter first (no DB)

**Not authorized:**

- Persistence deciding scientific semantics  
- Second event journal  
- Database vendor selection  
- Model D overwrite of revision payloads  
- Silent reinterpretation of three-segment keys as already four-segment  

---

## 24. OPS boundary (Sprint 020 slice)

**In Sprint 020 EXEC:**

| Operation | Role |
|-----------|------|
| `registerClaimUnit` | Initial Claim revision `rev:initial` + ensure RevisionHead |
| `registerEvidenceUnit` | Initial Evidence revision only (+ optional pre-persist transition); Sprint 019 semantics preserved |
| `transitionClaimStanding` | Post-persist Claim Standing Model C path (§15) |
| `getClaimUnit` | Head-resolved current |
| `getClaimUnitRevision` / `getClaimHead` / `getClaimLineage` | Read support |
| `exportClaimUnit` / `exportClaimUnitRevision` | SER of head or specific revision payload |

**Explicitly out of Sprint 020:**

- Evidence post-persist Record State transitions  
- Grade / Contradiction / NR / Verification post-persist OPS  
- DB / API / frontend / AI / KG / literature / distributed infrastructure  

Normative orchestration shape:

```
OPS request
  → Core validates/performs scientific transition
  → ENC assembles
  → Persistence creates revision + RevisionHead CAS
  → optional appendEvent
  → OPS projects (membership schema unchanged; current via head)
```

OPS must not invent transition legality, sync `bears_on`/`supported_by`, treat membership as scientific edge, mint scientific meaning in events, or own head as scientific authority.

---

## 25. REF / CONF / CERT implications

| Concern | Future evidence for Sprint 020 EXEC (not created by this patch) |
|---------|------------------------------------------------------------------|
| REF | Additive REF-OPS: initial `rev:initial` + RevisionHead; Claim Standing post-persist revision; predecessor lineage; RevisionHead CAS / stale-head CONFLICT; duplicate revision_id; deterministic identity/SER; snapshot with revisions+heads; export head/revision; partial-write (create without head advance); Sprint 019 Evidence regression |
| CONF | Prefer additive fixtures under `CONF-001@1.1.0-OPS` |
| CERT | Same CertificationEngine; new ConformanceReports; no second engine |
| SCI corpus | Unchanged unless Core semantics change (out of scope) |

Profiles remain `CONF-001@1.0.0` and `CONF-001@1.1.0-OPS`. No CONF/CERT modification authorized by this SPEC patch.

---

## 26. Backward compatibility

REQUIRED:

- Sprint 016–019 create-once Claim/Evidence paths remain valid.  
- Existing certificates and REF-OPS-001…036 semantics remain.  
- ResearchSnapshot / WorkspaceSnapshot schemas unchanged.  
- No mandatory rewrite of historical persisted unit payloads.  
- Pre-Model-C create-once rows remain valid initial revisions under migration (§27).  

---

## 27. Migration (normative)

Per ADR-020 + IMPLEMENTATION-DECISION-020:

1. Keep payload bytes, scientific identity, events, certificates untouched.  
2. Old three-segment CanonicalUnit key **≡** revision **`rev:initial`** for that `(unit_kind, identity)` (dual-read).  
3. `ensureInitialHead(..., revision_id="rev:initial")` when first Model C touch lacks a head.  
4. New writes always use four-segment revision keys.  
5. No silent scientific history rewrite; no mandatory re-encode.  
6. Optional Persistence-only key rewrite allowed but **not required** if dual-read is implemented.

Dual-identity Model B migration is **not** used. Model D archive migration is **not** used.

---

## 28. Failure and partial-write modes

Ordered Sprint 020 Claim Standing path:

| Step | On failure |
|------|------------|
| 1. Core Standing transition | Stop; nothing persisted |
| 2. ENC assemble | Stop; nothing persisted |
| 3. Persistence.create revision | Stop; RevisionHead unchanged |
| 4. RevisionHead CAS (`replace` + `expected_version`) | **Partial write:** revision row may exist without becoming head; head remains prior; **not** silent current scientific commit; caller may retry CAS if row fingerprint matches, or address orphan via get-by-revision_id |
| 5. optional appendEvent | Revision+head may exist without operational event; journal non-authoritative |
| 6. OPS membership/projection | Caller-controlled; does not roll back Persistence |

| Other failure | Behavior |
|---------------|----------|
| Duplicate revision storage_key | `ALREADY_EXISTS` |
| Same revision_id + identical fingerprint | Idempotent success |
| Same revision_id + different payload | Typed error |
| Differing replace of revision payload | `IMMUTABLE_ENTITY` |
| Stale head CAS | `CONFLICT` |
| Missing predecessor | Persistence/OPS command-state error |
| Snapshot missing RevisionHead / revision rows after Model C EXEC | Invalid incomplete snapshot |
| Fabricated scientific meaning in OPS event | Architecture violation |

**No multi-step transaction. No automatic delete of orphan revisions** (delete remains forbidden for authoritative artifacts).

Scientific transition success ≠ Persistence create success ≠ head success ≠ event success ≠ OPS projection success.

---

## 29. Non-goals

SPEC-020 does **not** implement or authorize:

- Database / durable vendor adapters  
- Backend / API / frontend / auth / cloud / distributed systems  
- AI / Knowledge Graph store / Human Digital Twin / literature / DocumentArtifact  
- New Core scientific semantics  
- Second scientific relationship graph  
- Second event journal / second Persistence engine  
- Automatic relationship synchronization  
- Grade / Contradiction / NR / Verification OPS **implementation**  
- Evidence **post-persist** Record State OPS (Sprint 020)  
- Reopening Models A / B / D as candidates for this contract  
- Model D replace+archive path  
- Reopening RQ-020-001…005  

---

## 30. Open questions

### 30.1 Closed (ADR-020 + IMPLEMENTATION-DECISION-020 + this patch)

| ID | Resolution |
|----|------------|
| OQ-020-001…014 | As in SPEC-020 v0.2.0; unchanged substance |
| **RQ-020-001** | **CLOSED** — `persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}` |
| **RQ-020-002** | **CLOSED** — initial `rev:initial`; later caller `rev:…` |
| **RQ-020-003** | **CLOSED** — authoritative `PersistenceEntity.predecessor_revision_id` |
| **RQ-020-004** | **CLOSED** — `RevisionHead`; key `persist:RevisionHead:{unit_kind}:{identity}`; CAS via `replace` + `expected_version` |
| **RQ-020-005** | **CLOSED** — Sprint 020 = Model C Persistence + Claim Standing post-persist; Evidence initial-revision only |

### 30.2 Remaining

| ID | Class |
|----|--------|
| RQ-020-006 | **NON-BLOCKING** — mandatory GradeDesignationUnit on post-persist grade? Soft / future Grade OPS |
| OQ-020-015 | Deferred / outside Sprint 020 |
| OQ-020-016 | Deferred / outside Sprint 020 |

**No remaining question reopens Model C or RQ-020-001…005.**

---

## 31. Future EXEC boundary and implementation preconditions

### 31.1 Sprint 020 EXEC boundary

After **final architecture re-audit** of this SPEC, EXEC-020 is limited to:

1. **Model C Persistence** — revision keys, revision metadata, RevisionHead CAS, dual-read, snapshot heads  
2. **Claim Standing post-persist** — `transitionClaimStanding` + Claim read/export helpers  
3. **Evidence initial-revision registration** — preserve Sprint 019 behavior under Model C keys  
4. Additive REF-OPS / tests / smoke / docs  

**Out of Sprint 020:** Evidence post-persist; Grade/Contradiction/NR/Verification OPS; DB; API; frontend; AI; KG; literature; distributed infrastructure; Models A/B/D.

### 31.2 IMPLEMENTATION PRECONDITIONS

| # | Precondition | Status |
|---|--------------|--------|
| 1 | SPEC `0.3.0-DRAFT` passes final architecture re-audit | Pending |
| 2 | RQ-020-001…005 bound in this SPEC / IMPLEMENTATION-DECISION-020 | **Satisfied** |
| 3 | Identity / immutability / lineage / head / CAS / Claim slice / Evidence initial-only as herein | **Satisfied** |
| 4 | No second journal/graph; no DB/API/UI/AI/KG | Required |
| 5 | Honest partial-write (§28); deterministic caller ids | Required |
| 6 | Sprint 019 Evidence regression must pass | Required |

---

## 32. Acceptance criteria

SPEC-020 `0.3.0-DRAFT` is ready for final architecture re-audit iff:

| ID | Criterion |
|----|-----------|
| AC-020-001…004 | Authority / provenance / no second journal/graph (unchanged) |
| AC-020-005 | Model C normative; A/B/D rejected |
| AC-020-006 | Exact four-segment CanonicalUnit key + RevisionHead key defined |
| AC-020-007 | Claim Standing Sprint 020 slice + Evidence initial-only explicit |
| AC-020-008 | Sprint 019 Evidence create-once + pre-persist preserved |
| AC-020-009 | Snapshot schemas unchanged; Persistence snapshot includes heads |
| AC-020-010 | No DB/UI/API/AI/KG |
| AC-020-011 | Determinism; `rev:initial` / caller `rev:…`; no randomUUID/Date.now |
| AC-020-012 | REF/CONF/CERT plan without modifying engines |
| AC-020-013 | RQ-020-001…005 CLOSED; RQ-020-006 soft; OQ-015/016 deferred |
| AC-020-014 | Status DRAFT pending final re-audit |
| AC-020-015 | Lineage = `predecessor_revision_id`; CAS; partial-write; version trichotomy |

---

## 33. Model comparison (selected vs rejected)

| Dimension | Model A — **REJECTED** | Model B — **REJECTED** | Model C — **SELECTED** | Model D — **REJECTED** |
|-----------|------------------------|------------------------|------------------------|------------------------|
| Persistence addressing | content_version in key | New Canonical id per revision | **`persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}`** | Single key overwrite |
| Head | Not defined | Incomplete without head | **`RevisionHead` + replace/expected_version CAS** | Slot is “current” |
| Lineage | SemVer order | derived_from | **`predecessor_revision_id` on PersistenceEntity** | Archive chain |
| Sprint 020 OPS | — | — | **Claim Standing post-persist; Evidence initial only** | — |
| Rejection / selection | SemVer≠revision; D-020-001 | Identity split; incomplete | **ADR-020 + IMPLEMENTATION-DECISION-020** | Weakens IMMUTABLE_ENTITY |

No scores.

---

## 34. Repository change audit

At this patch (PATCH-SPEC-020-B):

```
Only: specs/architecture/SPEC-020_post_persist_scientific_transition.md
Binds IMPLEMENTATION-DECISION-020 (RQ-020-001…005).
No runtime / test / fixture / CONF / CERT / Core / ENC / SER / Persistence / OPS / ADR / IMPLEMENTATION-DECISION modifications.
No commit. No push.
```

---

## 35. Final status

**SPEC-020 — DRAFT — READY FOR RE-AUDIT**

Version `0.3.0-DRAFT`.

**SELECTED ARCHITECTURE: Model C**  
**RQ-020-001…005: CLOSED** (IMPLEMENTATION-DECISION-020 bound herein)

Sprint 020 EXEC scope: Model C Persistence + Claim Standing post-persist; Evidence initial-revision only.

No implementation in this patch. EXEC remains disallowed until **final architecture re-audit**.

---

*End of SPEC-020 v0.3.0-DRAFT (design only — Model C + implementation decisions normative).*

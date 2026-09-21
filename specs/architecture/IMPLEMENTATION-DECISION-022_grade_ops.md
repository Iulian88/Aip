# IMPLEMENTATION-DECISION-022
## Grade OPS

| Field | Value |
|-------|--------|
| Decision ID | IMPLEMENTATION-DECISION-022 |
| Title | Grade OPS — Implementation Contract |
| Version | **0.1.0** |
| Status | **IMPLEMENTATION-READY — PENDING FINAL ARCHITECTURE RE-AUDIT** |
| Baseline | `d2eedef23a4193c40d3a3b4d2a73cf81c65795c7` |
| SPEC | SPEC-022 (DRAFT — audited) |
| Architecture audit | ARCHITECTURE-AUDIT-022 — **APPROVED WITH OBSERVATIONS** (0 blockers · 0 required patches) |
| Discovery | DISCOVERY-022 — READY FOR SPEC-022 |
| Mode | Design-only — **NO RUNTIME IMPLEMENTATION** |
| Does not authorize | EXEC-022 coding, tests, fixtures, certification, commit, or push |

---

### 1. Decision Status

Convert audited SPEC-022 into a precise, implementation-ready contract for Sprint 022.

This decision removes EXEC ambiguity for:

- exact OPS API and Core delegation,
- Option A (EvidenceUnit + `grade_ref`; no GradeDesignationUnit dual-write),
- Model C / RevisionHead / CAS / partial-write behavior,
- determinism, errors, events, membership, snapshots, export,
- authorized file change budget,
- REF / CONF / CERT expectations,
- stop conditions.

**Implementation Decision complete. Sprint 022 is implementation-ready, subject to successful Final Architecture Re-Audit. No runtime implementation is authorized by this document.**

Process sequence:

```
ROADMAP-REVIEW-002
  → DISCOVERY-022
  → SPEC-022
  → ARCHITECTURE-AUDIT-022 (APPROVED WITH OBSERVATIONS)
  → IMPLEMENTATION-DECISION-022 (this document)
  → Final Architecture Re-Audit
  → EXEC-022 (only if separately authorized)
  → CODE-AUDIT-022
  → FORMAL-CERTIFICATION-022
  → FINAL GIT CLOSURE
```

---

### 2. Certified Baseline

| Item | Value |
|------|-------|
| Certified HEAD / origin/main | `d2eedef23a4193c40d3a3b4d2a73cf81c65795c7` |
| Sprint 021 | FORMALLY CERTIFIED AND CLOSED — Evidence Record State OPS |
| SCI / OPS / FULL | **44/44 · 61/61 · 105/105** (verified) |
| Profiles | SCI `CONF-001@1.0.0` · OPS `CONF-001@1.1.0-OPS` |
| Highest OPS fixture today | `REF-OPS-061` (next free additive id starts at **`REF-OPS-062`**) |
| Architecture audit | 0 blockers · 0 required patches · READY FOR IMPLEMENTATION DECISION |

Working tree may contain documentation-only untracked files (SPEC-022, DISCOVERY-022, ROADMAP-REVIEW-002, ARCHITECTURE-AUDIT-022). Those do not alter the certified runtime baseline.

### Frozen contracts (must not be redesigned)

- Scientific Core EG-0.1 / SCI-003 Grade semantics
- Evidence Record State / Claim Standing semantics
- ENC / SER architectures
- Persistence Model C addressing and CAS
- ResearchSnapshot (Sprint 016) / WorkspaceSnapshot (Sprint 018)
- Single Persistence event journal
- Single ConformanceEngine / CertificationEngine
- Profile ids listed above

---

### 3. Source Documents

| Source | Role |
|--------|------|
| `specs/architecture/SPEC-022_grade_ops.md` | Normative architecture subject |
| `audits/architecture/ARCHITECTURE-AUDIT-022_SPEC-022.md` | Audit acceptance + observations O-022-01…08 |
| `audits/roadmap/DISCOVERY-022_GRADE_OPS.md` | Discovery pin |
| `audits/roadmap/ROADMAP-REVIEW-002.md` | Frontier justification |
| SPEC-020 / ADR-020 / IMPLEMENTATION-DECISION-020 | Model C + RQ-020-006 closure via Option A |
| SPEC-021 / IMPLEMENTATION-DECISION-021 | Record State OPS orchestration precedent |
| Actual Core `EvidenceGradeService` | Scientific assignment (already implemented) |
| Actual OPS `transitionEvidenceRecordState` / `transitionClaimStanding` | Model C sequence template |
| Actual `evidenceFromEvidenceUnitPayload` | Evidence decode (already implemented) |

**Conflict check:** No conflict found between SPEC-022 Option A and certified implementation. Core already exposes `EvidenceGradeService.assign`. Persistence already supports EvidenceUnit Model C. No silent invention required.

---

### 4. Architectural Decision

| Decision | Value |
|----------|-------|
| Grade representation | **OPTION A** — EvidenceUnit + `grade_ref` authoritative |
| GradeDesignationUnit | **NOT IMPLEMENTED** on OPS assign path (no dual-write / dual-head) |
| OPS method | `ResearchOperations.assignEvidenceGrade` |
| Core delegation | `EvidenceGradeService.assign(evidence, GradeAssignmentInput)` |
| Model C | EvidenceUnit revisions + EvidenceUnit RevisionHead CAS only |
| Persistence / ENC / SER / CONF / CERT engines | **Unchanged** (use existing) |
| Generic lifecycle engine | **NOT AUTHORIZED** |
| Second scientific graph / journal | **NOT AUTHORIZED** |

#### Audit observations absorbed as EXEC discipline

| ID | Discipline |
|----|------------|
| O-022-01 | Restate: `grade_ref` = EG label string; GradeDesignationUnit identity = `evidence_id` (unused by this OPS path) |
| O-022-02 | Validate `revision_id` / expected head before persist (same preamble as Standing / Record State) |
| O-022-03 | Decode failures → OpsError; Grade legality → Core `EvidenceGradeValidationError` |
| O-022-04 | Operational event payload `to_grade_ref` = **Core result** `evidence.grade_ref` after assign |
| O-022-05 | AC themes covered by this decision + SPEC-022 §15; no SPEC rewrite required |
| O-022-06 | Method does not exist yet — expected |
| O-022-07 | README corpus drift is docs hygiene — out of EXEC-022 runtime scope unless docs touch authorized |
| O-022-08 | Do **not** introduce generic lifecycle despite third isomorphic OPS path |

---

### 5. Exact Grade OPS Contract

### 5.1 Method location

```
apps/reference-app/src/operations/research-operations.ts
ResearchOperations.assignEvidenceGrade(input) → result
```

Export types from `apps/reference-app/src/index.ts` (mirror Standing / Record State exports).

### 5.2 Dependency wiring

| Concern | Rule |
|---------|------|
| Core service | Construct / inject `EvidenceGradeService` parallel to `EvidenceTransitionService` / `ClaimTransitionService` in `ResearchOperations` / `createResearchOperations` |
| Decode | Reuse existing `evidenceFromEvidenceUnitPayload` — **no new decode module required** |
| ENC | Existing `CanonicalEncoder.assemble(evidence)` → EvidenceUnit |
| Persistence | Existing session repository `create` + `advanceHead` + optional `appendEvent` |

### 5.3 Input type (normative)

**Required name:** `AssignEvidenceGradeInput`

| Field | Required | Semantics |
|-------|----------|-----------|
| `identity` | Yes | Scientific `evidence_id` |
| `assignment` | Yes | Core `GradeAssignmentInput` |
| `revision_id` | Yes | New Model C revision id (`rev:…`) |
| `expected_head_revision_id` | Yes | Expected current EvidenceUnit head (= predecessor + CAS `from`) |
| `append_event` | No | Default `false`; if `true`, append operational citation |

#### `assignment` (Core `GradeAssignmentInput`) — deterministic EXEC/REF requirements

| Field | Required on certified paths | Notes |
|-------|----------------------------|-------|
| `to_grade_ref` **or** `label` | One required | Core resolves target |
| `pin_version` | No | When using `label` |
| `authority_agent` | Yes | Human pattern when Core AR-* requires |
| `reason` | Yes | Non-empty |
| `decision_ref` | Yes | Non-empty |
| `at` | Yes | UTC second (`GRADE_UTC_SECOND`) |
| `event_id` | **Yes** | `gae:…` — **must** be caller-supplied on certified paths |
| `from_grade_ref` | No | Defaults to current Evidence `grade_ref` |

### 5.4 Output type (normative)

**Required name:** `AssignEvidenceGradeResult`

| Field | Meaning |
|-------|---------|
| `evidence` | Core Evidence after `EvidenceGradeService.assign` |
| `unit` | ENC EvidenceUnit |
| `entity` | Persisted PersistenceEntity (new EvidenceUnit revision) |
| `head_revision_id` | EvidenceUnit RevisionHead pointer after successful CAS |

### 5.5 Normative sequence (exact)

```
1. Validate revision_id / expected_head_revision_id
   (grammar; ≠ each other; revision_id ≠ rev:initial)
2. getEvidenceUnit(identity)                          // head-resolved
3. evidenceFromEvidenceUnitPayload(entity.payload)   // OPS-local decode
4. EvidenceGradeService.assign(evidence, assignment)  // Core — may throw
5. CanonicalEncoder.assemble(evidence)                // EvidenceUnit only
6. entityFromCanonicalUnit(unit, {
     revision_id,
     predecessor_revision_id: expected_head_revision_id
   })
7. repository.create(entity)                          // may ALREADY_EXISTS
8. repository.advanceHead(
     identity, "EvidenceUnit",
     expected_head_revision_id, revision_id)          // may CONFLICT
9. optional appendEvent(...)                          // operational only
10. return { evidence, unit, entity, head_revision_id }
```

Steps 1–5 persist nothing.

### 5.6 Session / workspace

- **SHALL NOT** require open ResearchSession / ResearchWorkspace.
- **SHALL NOT** mutate membership.
- Callers **MAY** register membership separately.

### 5.7 Explicitly not in this API

- GradeDesignationUnit assemble/persist/CAS
- `EvidenceGradeMigrationSupport.migrateFromDeferred` OPS wrapper (assign-from-deferred via Core `assign` remains in scope)
- Record State / Standing transitions
- Material Evidence content rewrite

### 5.8 Core must not be reinvented

EXEC-022 **SHALL NOT** implement new Grade values, labels, eligibility, Human gates, GAE rules, or scientific relationships. If Core `EvidenceGradeService.assign` were missing, EXEC **MUST STOP** — repository fact: **it exists**.

---

### 6. Model C Contract

| Item | Normative value |
|------|-----------------|
| Scientific identity | `evidence_id` (stable) |
| Unit kind | `EvidenceUnit` |
| Revision storage key | `persist:CanonicalUnit:EvidenceUnit:{evidence_id}:{revision_id}` |
| Initial revision | Existing `rev:initial` from Evidence registration |
| Subsequent `revision_id` | Caller-supplied `^rev:[A-Za-z0-9._~-]{1,128}$`; **≠** `rev:initial` |
| `predecessor_revision_id` | **SHALL** = `expected_head_revision_id` |
| Head key | `persist:RevisionHead:EvidenceUnit:{evidence_id}` |
| Head advance | `advanceHead(identity, "EvidenceUnit", from, to)` |
| CAS token | `RevisionHead.content_version` = pointed `revision_id`; `expected_version` = `expected_head_revision_id` |
| Old revision | Immutable — **no update-in-place** |
| New revision | Immutable create |
| Stale head | Persistence `CONFLICT` — prior head retained |
| Duplicate revision key | Persistence `ALREADY_EXISTS` |
| Trichotomy | `evidence_version` (Core SemVer bump) ≠ `revision_id` ≠ head CAS token |

**Persistence changes:** **NONE** — use certified APIs only.

### Partial write (certified Model C precedent)

| Step | On failure |
|------|------------|
| Core assign / ENC assemble | Stop; nothing persisted |
| `create` | Stop; head unchanged |
| `advanceHead` after successful `create` | **Orphan revision may remain**; head unchanged; **not** silent current scientific commit |
| optional `appendEvent` after head success | Scientific revision+head may exist without ops event |

**No** invented transactions, rollback, or delete-on-conflict.

---

### 7. grade_ref Contract

| Concern | Rule |
|---------|------|
| What is stored | Evidence `grade_ref` string on the Core Evidence object, then on EvidenceUnit content |
| Exact value | Result of Core assign: conformant `SCI-003@0.1.<n>:<label>` (or interim only as **from** state when migrating via assign) |
| Identity referenced | **Not** an Evidence id — `grade_ref` is an EG designation string |
| Scientific identity | Remains `evidence_id` |
| Revision identity | Model C `revision_id` addresses the EvidenceUnit row carrying that `grade_ref` |
| Validation | **Core only** (eligibility, authority, material change, encoding) |
| Determinism | Caller-supplied assignment fields; Core must not be relied upon for UUID GAE ids on certified paths |
| GradeDesignationUnit | **Not written** by this OPS path |

---

### 8. Identity / Revision Contract

| Kind | Source |
|------|--------|
| scientific_identity | `input.identity` = Evidence `evidence_id` |
| revision_id | Caller-supplied |
| predecessor_revision_id | `expected_head_revision_id` (= current Evidence head revision) |
| RevisionHead | Existing EvidenceUnit head for that identity |
| expected_version (CAS) | Current head version = `expected_head_revision_id` |
| new revision | Immutable EvidenceUnit row |
| old revision | Unchanged |
| head update | CAS via `advanceHead` only |
| GAE event_id | Caller-supplied `gae:…` |
| OPS event_id | Deterministic scheme §9 |

---

### 9. Event Contract

### Scientific history (authoritative)

GAE on Evidence / EvidenceUnit envelope events — owned by Core/ENC. **Not** OPS journal.

### Optional operational journal event

When `append_event === true` **after successful head advance**:

| Field | Value |
|-------|-------|
| `event_type` | `ops.evidence_grade_assignment_revision` |
| `parent_identity` | `evidence_id` |
| `event_id` | Prefer `ops:{assignment.event_id}`; else `ops:evidence_grade:{identity}:{revision_id}` |
| Payload | `{ revision_id, predecessor_revision_id, unit_kind: "EvidenceUnit", to_grade_ref }` where `to_grade_ref` = **result** `evidence.grade_ref` |

| Rule | Statement |
|------|-----------|
| Required? | Optional (default off) |
| Authority | Operational only — **MUST NOT** redefine Grade |
| Journal | Sole Persistence journal |
| Failure after head | Does not roll back scientific commit |

---

### 10. Membership / Snapshot Contract

| Concern | Rule |
|---------|------|
| Membership on assign | **No automatic registration** |
| membership ≠ grade / scientific relationship / lineage / provenance | Preserved |
| ResearchSnapshot | Frozen `{ research_session_id, member_refs, persistence_snapshot }` |
| WorkspaceSnapshot | Frozen additive schema |
| Projection after assign | New EvidenceUnit revision + updated EvidenceUnit RevisionHead appear inside `persistence_snapshot` |
| Snapshot redesign | **Forbidden** |

Export:

| API | Behavior |
|-----|----------|
| `exportEvidenceUnit(identity)` | SER-JSON of **head-resolved** EvidenceUnit (includes new `grade_ref`) |
| `exportEvidenceUnitRevision(identity, revision_id)` | Specific revision |
| Serializer | Existing SER-JSON only — **no new serializer** |
| Grade-only export | Not required |

---

### 11. Error Contract

Propagate lower-layer errors unchanged. Do not wrap Core/Persistence into OpsError except OPS misuse / decode failure.

| Condition | Error |
|-----------|--------|
| Evidence / revision missing | Persistence `NOT_FOUND` |
| Invalid Grade / grade_ref / eligibility / authority / no-op | Core `EvidenceGradeValidationError` |
| Invalid `revision_id` grammar | Persistence `INVALID_ID` |
| Duplicate revision | Persistence `ALREADY_EXISTS` |
| Stale RevisionHead | Persistence `CONFLICT` |
| Immutable mutate attempt | Persistence `IMMUTABLE_ENTITY` |
| ENC assemble failure | Existing ENC errors |
| Decode / OPS misuse (`rev:initial`, id collision with expected head) | OPS `OpsError` `INVALID_COMMAND_STATE` |

---

### 12. Determinism Contract

Certified Grade OPS / REF / TEST paths **MUST** use caller-supplied:

- `revision_id`
- `expected_head_revision_id`
- GAE `event_id` (`gae:…`)
- GAE `at`
- `authority_agent`, `reason`, `decision_ref`

**Forbidden** on deterministic Grade OPS reference path:

- `randomUUID`
- `Date.now`
- `Math.random`
- wall-clock identity minting

**Inherited Core fallback (do not change Core):** if `event_id` omitted, Core may mint UUID-based GAE ids. Certified paths **must supply** `event_id` so the fallback is never exercised.

---

### 13. Reference Fixture Plan

Do **not** create fixtures in this decision phase.

| Item | Value |
|------|-------|
| Highest existing | `REF-OPS-061` (61 OPS fixtures) |
| Next free range | **`REF-OPS-062+`** |
| SCI fixtures | **Unchanged** (44/44; including `REF-GRADE-001`…`003`) |
| Numbering | Exact titles/ids at EXEC; do not renumber prior fixtures |

### Mandatory behavioral coverage (themes)

1. Successful post-persist Grade assignment (e.g. deferred → EG label or label reassignment)
2. Deterministic repeated run with identical caller-supplied ids (same scientific outcome / stable encoding)
3. Invalid Grade reference / ineligible assignment → Core error; head unchanged
4. Missing Evidence → `NOT_FOUND`
5. Stale RevisionHead / CAS conflict → `CONFLICT`; prior head retained
6. Duplicate `revision_id` → `ALREADY_EXISTS`
7. Export after assignment reflects new `grade_ref` at head; prior revision differs
8. Snapshot contains prior+new EvidenceUnit revisions + RevisionHead
9. Optional operational event when enabled; scientific authority remains unit/GAE
10. Lineage: `predecessor_revision_id === expected_head_revision_id`
11. Immutability of prior revision
12. `record_state` preserved; Claim Standing untouched
13. GradeDesignationUnit **not** created/headed by assign path
14. Human raise vs AI raise rejection (Core `F5` or applicable)
15. Regression: Sprint 019–021 OPS + Model C + SCI 44/44

Exact fixture count is **not** inflated here; EXEC assigns the minimum set that covers themes without redundancy.

---

### 14. Test Plan

| Artifact | Path |
|----------|------|
| Focused unit/script tests | `scripts/test-022-grade-ops.mjs` |

Conventions: mirror `scripts/test-021-evidence-record-state.mjs` (assert behavior, not file existence).

**Minimum behavioral themes for TEST-022** (exact test count chosen at EXEC to match coverage, not vanity):

- Decode headed Evidence then assign (integration through OPS)
- Success path: head advances; SemVer bumps; GAE present; Record State unchanged
- Core rejection path: nothing becomes head
- CAS conflict / duplicate revision
- Optional event citation
- Partial-write honesty (orphan possible; head unchanged)
- Export head reflects grade

Run after build using dist imports (Sprint 021 pattern).

---

### 15. Smoke Test Plan

| Artifact | Path |
|----------|------|
| Smoke | `scripts/smoke-022-grade-ops.mjs` |
| Marker (new only) | `SMOKE_022_PASS` (created by smoke on success) |

Smoke **MUST** verify the critical vertical slice: register Evidence → `assignEvidenceGrade` → head export shows new `grade_ref` → optional CAS conflict check as needed.

### Historical smoke marker immutability (HARD)

EXEC-022 / smoke-022 **MUST NOT** overwrite or regenerate:

- `SMOKE_019_PASS`
- `SMOKE_020_PASS`
- `SMOKE_021_PASS`
- any earlier `SMOKE_*_PASS`

Only **new** `SMOKE_022_PASS` may be created.

---

### 16. Conformance Plan

| Item | Rule |
|------|------|
| SCI | `CONF-001@1.0.0` — corpus **unchanged** 44/44 |
| OPS | `CONF-001@1.1.0-OPS` — existing 61 + additive `REF-OPS-062+` |
| FULL | SCI ∪ OPS |
| Engines | Single ConformanceEngine — **no redesign** |
| Fabrication | Forbidden — live corpora only |

Profile bump **not** planned. Stop only if measurement proves OPS profile cannot accept additive `REF-OPS-` fixtures (not expected).

---

### 17. Certification Plan

EXEC-022 **MUST NOT** certify itself.

Post-EXEC sequence (separately authorized steps):

```
EXEC-022
  → CODE-AUDIT-022
  → FORMAL-CERTIFICATION-022
  → FINAL GIT CLOSURE — SPRINT 022
```

| Rule | Statement |
|------|-----------|
| Certification architecture | Unchanged |
| Artifacts | Additive only |
| Historical cert artifacts | **Never overwrite** |
| Engines | Single CertificationEngine |

---

### 18. Authorized File Change Budget

EXEC-022 **may** modify **only** the following surfaces (exact paths confirmed at EXEC; do not broaden without STOP):

### AUTHORIZED — source

| File / surface | Purpose |
|----------------|---------|
| `apps/reference-app/src/operations/research-operations.ts` | `assignEvidenceGrade` + deps wiring (`EvidenceGradeService`) |
| `apps/reference-app/src/index.ts` | Export new types / method surface |

**Reuse only (no redesign):** `evidence-from-unit.ts`, Persistence, ENC, SER, Core Grade modules.

### AUTHORIZED — fixtures

| File | Purpose |
|------|---------|
| `packages/reference-tests/src/fixtures/ops.ts` | Additive `REF-OPS-062+` only |
| Corpus wiring in `packages/reference-tests/src/fixtures/index.ts` | **Only if** required for existing auto-inclusion patterns (prefer zero change if `opsFixtures` already spreads) |

### AUTHORIZED — scripts

| File | Purpose |
|------|---------|
| `scripts/test-022-grade-ops.mjs` | New |
| `scripts/smoke-022-grade-ops.mjs` | New |

### AUTHORIZED — documentation (EXEC phase)

| File | Purpose |
|------|---------|
| `IMPLEMENTATION.md` | Sprint 022 notes / counts |
| `audits/execution/EXEC-022_REPORT.md` (or repo-equivalent EXEC report path) | Execution report |
| README notes | Only if needed for corpus status hygiene |

### AUTHORIZED — certification phase only (NOT during EXEC coding)

Additive certification reports / fixtures under established `audits/certification/` and `fixtures/cert/` conventions — **only** during FORMAL-CERTIFICATION-022.
New marker: `SMOKE_022_PASS` only.

If any file outside this budget appears necessary → **STOP** (§20).

---

### 19. Forbidden Changes

EXEC-022 **MUST NOT**:

- redesign Scientific Core Grade / Evidence / Claim semantics
- redesign Persistence / Model C / RevisionHead
- redesign ENC / SER
- redesign ConformanceEngine / CertificationEngine
- redesign ResearchSnapshot / WorkspaceSnapshot
- implement GradeDesignationUnit dual-write / dual-head
- invent Grade lifecycle / state machine
- implement generic `ScientificUnitLifecycle` / generic transition engine
- implement Contradiction / NR / Verification OPS
- implement material Evidence content OPS
- introduce second scientific graph or second event journal
- introduce database, API, frontend, AI, literature, DocumentArtifact, KG
- overwrite historical smoke markers or historical certification artifacts
- modify SCI Grade fixtures (`REF-GRADE-*`) unless STOP proves otherwise (not expected)
- change certified Sprint 019–021 behavior

---

### 20. EXEC-022 Stop Conditions

EXEC-022 **MUST STOP** and report a blocker (no improvisation) if:

- required Core Grade semantics do not exist or contradict SPEC-022
- `grade_ref` semantics become ambiguous in implementation
- Model C cannot support the operation without redesign
- Persistence modification becomes necessary
- scientific authority would move outside Core
- a second scientific representation (e.g. mandatory GradeDesignationUnit authority) becomes necessary
- nondeterministic behavior cannot be contained on certified paths
- snapshot redesign becomes necessary
- existing certified behavior must change
- an unauthorized file must be modified
- a migration is required but unspecified
- historical `SMOKE_019_PASS` / `SMOKE_020_PASS` / `SMOKE_021_PASS` would be overwritten

---

### 21. Final Implementation Decision

| Statement | Value |
|-----------|--------|
| Implementation Decision | **COMPLETE** |
| Sprint 022 readiness | **IMPLEMENTATION-READY** |
| Gate remaining | **Final Architecture Re-Audit** |
| Runtime implementation authorized by this document? | **NO** |
| Tests / fixtures / certification authorized by this document? | **NO** |
| Commit / push authorized? | **NO** |
| Scope | Grade OPS only — `assignEvidenceGrade` → Core assign → EvidenceUnit Model C commit |
| Option A | Binding |
| RQ-020-006 | Closed for Sprint 022 OPS: GradeDesignationUnit **not mandatory** / **not implemented** on assign path |

**Implementation Decision complete. Sprint 022 is implementation-ready, subject to successful Final Architecture Re-Audit. No runtime implementation is authorized by this document.**

---

## Document Control

| Version | Status | Notes |
|---------|--------|-------|
| 0.1.0 | IMPLEMENTATION-READY — PENDING FINAL ARCHITECTURE RE-AUDIT | From SPEC-022 + ARCHITECTURE-AUDIT-022 |

---

IMPLEMENTATION-DECISION-022 FINAL VERDICT
==========================================

Decision:
IMPLEMENTATION-READY

Scope:
Grade OPS only — ResearchOperations.assignEvidenceGrade orchestrates Core EvidenceGradeService.assign onto headed EvidenceUnit under Model C (create immutable revision + EvidenceUnit RevisionHead CAS + optional operational event); reuse existing evidenceFromEvidenceUnitPayload; no GradeDesignationUnit dual-write; no generic lifecycle; no other canonical-unit OPS.

Grade representation:
EvidenceUnit + grade_ref

GradeDesignationUnit:
NOT IMPLEMENTED IN SPRINT 022

Core authority:
PRESERVED

Model C:
PRESERVED

Persistence:
UNCHANGED

ENC:
UNCHANGED

SER:
UNCHANGED

Conformance:
UNCHANGED / ADDITIVE OPS EVIDENCE

Certification:
UNCHANGED ARCHITECTURE

Generic lifecycle:
NOT AUTHORIZED

Second scientific graph:
NOT AUTHORIZED

Second event journal:
NOT AUTHORIZED

Database:
NOT AUTHORIZED

Frontend:
NOT AUTHORIZED

AI:
NOT AUTHORIZED

Implementation change budget:
OPS research-operations.ts + index exports; additive REF-OPS-062+ in ops fixtures; new test-022/smoke-022 scripts; EXEC docs (IMPLEMENTATION.md / EXEC report); certification artifacts only in later certification phase; new SMOKE_022_PASS only

EXEC-022:
NOT AUTHORIZED

Implementation authorization:
NO

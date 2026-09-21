# SPEC-022 — Grade OPS

| Field | Value |
|-------|--------|
| **Spec ID** | SPEC-022 |
| **Artifact** | `specs/architecture/SPEC-022_grade_ops.md` |
| **Status** | DRAFT — READY FOR ARCHITECTURE AUDIT |
| **Baseline commit** | `d2eedef23a4193c40d3a3b4d2a73cf81c65795c7` |
| **Depends on** | SCI-003@0.1.0 · SCI-002 · ADR-0006 · SPEC-020 · ADR-020 · SPEC-021 · DISCOVERY-022 · ROADMAP-REVIEW-002 |
| **Implementation authorization** | **NO** |

Normative language: RFC 2119 SHALL / MUST / SHOULD / MAY.

---

## 1. Purpose

Define the architectural contract for **post-persist Evidence Grade assignment** under certified Model C, such that Research Operations can orchestrate Core `EvidenceGradeService.assign` onto a headed EvidenceUnit without:

- inventing a Grade lifecycle / state machine,
- creating a second scientific authority,
- redesigning Persistence,
- introducing a generic lifecycle engine,
- or mutating immutable Evidence revisions in place.

This specification is **design-only**. It does **not** authorize EXEC.

---

## 2. Scope

### In scope (Sprint 022 architecture)

1. OPS orchestration of Core EG-0.1 grade assignment after EvidenceUnit has been persisted under Model C.
2. Immutable successor EvidenceUnit revisions carrying updated `grade_ref` and Grade Assignment Events (GAE).
3. RevisionHead CAS on **EvidenceUnit** only.
4. Optional operational Persistence journal citation.
5. Determinism, error, snapshot, export, REF / CONF / CERT requirements for future EXEC.
6. Explicit GradeDesignationUnit policy for this sprint (§5).

### Out of scope

See §18 Non-Goals.

---

## 3. Current Certified Baseline

| Item | Value |
|------|-------|
| HEAD / origin/main | `d2eedef23a4193c40d3a3b4d2a73cf81c65795c7` |
| Last certified sprint | Sprint 021 — Evidence Record State OPS |
| SCI corpus | 44/44 |
| OPS corpus | 61/61 |
| FULL corpus | 105/105 |
| Profiles | `CONF-001@1.0.0`, `CONF-001@1.1.0-OPS` |

### Certified Model C (unchanged)

| Element | Contract |
|---------|----------|
| Stable scientific identity | Preserved across revisions |
| Immutable revisions | `persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}` |
| Initial revision | `rev:initial` |
| Later revisions | Caller-supplied `rev:…` |
| Lineage | `predecessor_revision_id` |
| Head | `persist:RevisionHead:{unit_kind}:{identity}` |
| CAS | `advanceHead` via `replace` + `expected_version` |

### Already certified OPS post-persist precedents

| Axis | OPS method | Core service | Head unit_kind |
|------|------------|--------------|----------------|
| Claim Standing | `transitionClaimStanding` | `ClaimTransitionService` | `ClaimUnit` |
| Evidence Record State | `transitionEvidenceRecordState` | `EvidenceTransitionService` | `EvidenceUnit` |

### Discovery pin

`audits/roadmap/DISCOVERY-022_GRADE_OPS.md` — **READY FOR SPEC-022**.

---

## 4. Grade Core State

### 4.1 What Grade is

Per SCI-000 / SCI-003 EG-0.1:

> Evidence Grade is a controlled ordinal/categorical **warrant strength class** of Evidence — not probability of truth, clinical validity, Workflow State, or Claim Standing.

### 4.2 Authoritative storage

| Concern | Fact |
|---------|------|
| Slot | Evidence `grade_ref` (SCI-002) |
| Scheme | EG-0.1 labels encoded as `SCI-003@0.1.<n>:<label>` |
| Interim | `deferred_sci003` (not an EG-0.1 Grade) |
| History | Optional `grade_assignment_log` (GAE) |
| Identity | **No** `grade_id`; scientific identity remains `evidence_id` |
| Lifecycle | **NO CORE GRADE LIFECYCLE / STATE MACHINE** — label reassignment only (SCI-003 §13) |

### 4.3 Closed EG-0.1 labels

| Label | Rank |
|-------|------|
| `model_output_only` | 1 |
| `literature_secondary` | 2 |
| `curated_database_snapshot` | 3 |
| `registered_primary_data` | 4 |

### 4.4 Core assignment behavior (`EvidenceGradeService.assign`)

Given Evidence + `GradeAssignmentInput`, Core **SHALL**:

1. Resolve target `grade_ref` (`to_grade_ref` or `label` + pin).
2. Reject non-material no-ops (`F_ASSIGNMENT`).
3. Enforce eligibility (provenance ceiling + source class/state).
4. Enforce assignment authority (Human Reviewer gates AR-2…AR-5).
5. Append a validated GAE.
6. Return a **new Evidence** object with:
   - updated `grade_ref`,
   - appended `grade_assignment_log`,
   - **bumped** `evidence_version` (patch SemVer),
   - **unchanged** `record_state`,
   - **unchanged** Claim Standing (IR-1; Grade never sets Standing).

### 4.5 ENC / SER / Processor (existing)

| Layer | Existing capability |
|-------|---------------------|
| ENC EvidenceUnit | Embeds `grade_ref`; folds GAE into envelope events |
| ENC GradeDesignationUnit | `{ evidence_id, grade_ref }` + `grades` → Evidence; identity = `evidence_id` |
| SER-JSON | Encodes/decodes both unit kinds |
| Processor | `evidence.grade_assignment` via S11/S12/S13 |
| SCI REF | `REF-GRADE-001`…`003` |

### 4.6 OPS gap

**FACT:** No Grade OPS method exists. Post-persist assignment cannot commit without a new immutable EvidenceUnit revision.

---

## 5. Grade Designation Decision

### SELECTED OPTION:

**OPTION A — EvidenceUnit + `grade_ref` is the sole authoritative graded representation for Sprint 022 Grade OPS.**

Grade is an Evidence designation/reference stored on Evidence and revised as an EvidenceUnit under Model C. Sprint 022 OPS **SHALL NOT** persist or CAS-advance a separate GradeDesignationUnit RevisionHead as part of the Grade OPS commit path.

### REJECTED OPTIONS:

| Option | Decision |
|--------|----------|
| **OPTION B** — Persist a separate GradeDesignationUnit linked to Evidence as a mandatory dual-write / dual-head on every assign | **REJECTED** for Sprint 022 |
| **OPTION C** — Treat GradeDesignationUnit as the authoritative scientific aggregate with its own lifecycle | **REJECTED** (contradicts SCI-002/SCI-003) |

### RATIONALE:

1. **Scientific authority:** SCI-002 owns the `grade_ref` slot; SCI-003 assigns Grade **to Evidence**. Core `assign` returns Evidence only.
2. **Identity:** GradeDesignationUnit identity **is** `evidence_id`. There is no distinct Grade scientific identity to head independently without inventing one.
3. **Existing encoding:** EvidenceUnit already carries authoritative `grade_ref` + GAE. OPS already reconstructs GAE via `evidenceFromEvidenceUnitPayload`.
4. **Revision model:** Model C EvidenceUnit head is already the current scientific Evidence head (Sprints 019–021). Dual CAS risks split-brain (Evidence head ≠ GradeDesignation head) — a second-authority hazard.
5. **Provenance:** Scientific GAE history lives on Evidence; operational history uses the sole Persistence journal. Dual unit writes do not improve provenance separation.
6. **Determinism / certification:** Single-head Evidence path mirrors certified Standing / Record State orchestration and keeps REF-OPS themes clear.
7. **SPEC-020 soft note:** GradeDesignationUnit **may** be persisted; mandatory dual revision was left open (RQ-020-006). Sprint 022 **closes** that soft question for OPS commits: **not mandatory**.
8. **Future compatibility:** ENC may still assemble GradeDesignationUnit for SCI relationship fixtures (`REF-GRADE-003`) and for a **future** optional projection sprint. That does not require dual-head authority now.

### Normative consequences

| Rule | Statement |
|------|-----------|
| Authoritative graded artifact | Head-resolved **EvidenceUnit** |
| What is revisioned | EvidenceUnit CanonicalUnit rows |
| What head advances | `RevisionHead` for `unit_kind = "EvidenceUnit"` only |
| GradeDesignationUnit on OPS assign path | **SHALL NOT** be created/advanced by Sprint 022 Grade OPS |
| ENC `kind: "grade"` / `buildGradeDesignation` | Remains available outside this OPS commit path; unchanged |
| Persistence mapping of GradeDesignationUnit | Unchanged; unused by this OPS method |

### Decision status

**CLOSED** — sufficient repository evidence; EXEC is not blocked by GradeDesignationUnit ambiguity.

---

## 6. Scientific Authority Boundaries

| Layer | Owns | Must not |
|-------|------|----------|
| **Scientific Core** | Grade meaning, EG-0.1 labels/ranks, eligibility, Human gates, GAE validity, SemVer bump on material grade change | Be bypassed by OPS |
| **OPS** | Orchestration: decode headed Evidence → call Core → ENC → Model C create/CAS → optional journal | Redefine Grade labels, invent Grade state machine, invent scientific relationships |
| **Persistence** | Immutable storage, RevisionHead CAS, sole event journal, snapshots | Scientific Grade semantics |
| **ENC** | Canonical EvidenceUnit (and existing GradeDesignationUnit builder) | Become OPS business logic |
| **SER** | JSON encode/decode of CanonicalUnit payloads | New serializer |
| **Reference Tests** | Executable evidence (`REF-GRADE-*`, future `REF-OPS-*`) | Invent Core rules |
| **Conformance** | Evaluate ReferenceReports under profiles | Own Grade semantics |
| **Certification** | Certify ConformanceReports | Own Grade semantics |
| **AI** | Non-authoritative | Assign Grade as scientific authority |

**Invariant:** OPS **SHALL NOT** redefine Grade semantics.

---

## 7. Evidence ↔ Grade Semantics

### 7.1 What is being assigned?

An EG-0.1 **warrant-strength label** expressed as Evidence `grade_ref`, with append-only GAE provenance on that Evidence.

### 7.2 Is Grade an independent CanonicalUnit in this sprint?

**No** for Sprint 022 OPS authority.

- GradeDesignationUnit exists as an ENC kind but is **not** the authoritative commit target of Grade OPS (§5).
- The independent CanonicalUnit being revised is **EvidenceUnit**.

### 7.3 What is `grade_ref`?

The SCI-002 string slot holding either:

- interim `deferred_sci003`, or
- conformant `SCI-003@0.1.<n>:<eg_label>`.

### 7.4 Authoritative representation after assign

| Layer | Representation |
|-------|----------------|
| Core | Evidence object returned by `EvidenceGradeService.assign` |
| ENC | EvidenceUnit assembled from that Evidence |
| Persistence | Immutable EvidenceUnit revision row + advanced EvidenceUnit RevisionHead |
| OPS journal (optional) | Non-authoritative citation only |

### 7.5 Identity trichotomy (normative)

| Kind | Value | Role |
|------|-------|------|
| Scientific identity | `evidence_id` | Stable across grade assignments |
| Content SemVer | `evidence_version` | Bumped by Core on material grade change (AR-6) |
| Model C revision identity | `revision_id` (`rev:…`) | Persistence addressing; **≠** SemVer |

**SHALL NOT** conflate `evidence_version` with `revision_id` or with RevisionHead CAS token (`expected_version` = prior `revision_id`).

### 7.6 Separation of concepts

| Concept | Is | Is not |
|---------|----|--------|
| Grade assignment | Core scientific designation update on Evidence | Workspace membership |
| Membership | OPS organizational index | `grades` relationship / Grade semantics |
| Revision lineage | Persistence `predecessor_revision_id` | Scientific graph / `bears_on` |
| ENC `grades` reference | Encoding relationship GradeDesignation→Evidence | Required for Sprint 022 OPS commit |
| Claim Standing | SCI-001 | Set by Grade (forbidden IR-1) |
| Evidence Record State | SCI-002 | Changed by Grade (Core preserves it) |

---

## 8. Model C Revision Contract

### 8.1 Normative sequence

```
Existing EvidenceUnit head (scientific identity = evidence_id)
  → getEvidenceUnit(identity)                         // head-resolved
  → evidenceFromEvidenceUnitPayload(entity.payload) // OPS-local decode
  → EvidenceGradeService.assign(evidence, assignment) // Core — may throw
  → CanonicalEncoder.assemble(evidence)               // EvidenceUnit
  → entityFromCanonicalUnit(unit, {
       revision_id,
       predecessor_revision_id: expected_head_revision_id
     })
  → repository.create(entity)                         // immutable revision
  → repository.advanceHead(
       identity, "EvidenceUnit",
       expected_head_revision_id, revision_id)        // CAS
  → optional appendEvent(...)                         // operational only
  → return { evidence, unit, entity, head_revision_id }
```

Steps through Core/ENC persist nothing. Failures after `create` follow §10 / partial-write rules below.

### 8.2 Identifiers

| Field | Rule |
|-------|------|
| Scientific identity | `evidence_id` (input `identity`) |
| `revision_id` | Caller-supplied; match `rev:[A-Za-z0-9._~-]{1,128}`; **≠** `rev:initial`; **≠** `expected_head_revision_id` |
| `predecessor_revision_id` | **SHALL** equal `expected_head_revision_id` |
| Head key | `persist:RevisionHead:EvidenceUnit:{evidence_id}` |
| CAS expected | `expected_head_revision_id` as `RevisionHead.content_version` prior value |

### 8.3 Conflict / duplicate / partial-write

| Condition | Behavior |
|-----------|----------|
| Stale head CAS | Persistence `CONFLICT`; prior head retained |
| Duplicate revision storage key | Persistence `ALREADY_EXISTS` |
| `create` succeeds, `advanceHead` fails | **Partial write:** revision row may exist as orphan; head unchanged; **not** silent current scientific commit (SPEC-020/021) |
| No multi-head branching | Not a scientific multi-head model |

### 8.4 Persistence changes

**NONE.** Existing create / get / replace / RevisionHead / journal / snapshot APIs suffice.

---

## 9. EvidenceGradeService.assign Contract

### 9.1 Layering clarification

| Layer | Symbol | Role |
|-------|--------|------|
| Core | `EvidenceGradeService.assign(evidence, GradeAssignmentInput)` | Scientific assignment (already implemented) |
| OPS | `ResearchOperations.assignEvidenceGrade(input)` | Post-persist Model C orchestration (**this SPEC**) |

The prompt candidate “EvidenceGradeService.assign” names the **Core** operation. OPS **SHALL** expose a distinct ResearchOperations method that **calls** Core assign — mirroring Standing / Record State naming discipline.

### 9.2 OPS method

```
ResearchOperations.assignEvidenceGrade(input) → result
```

### 9.3 Input

| Field | Required | Meaning |
|-------|----------|---------|
| `identity` | Yes | Scientific `evidence_id` |
| `assignment` | Yes | Core `GradeAssignmentInput` |
| `revision_id` | Yes | New Model C revision id |
| `expected_head_revision_id` | Yes | Expected current EvidenceUnit head (= predecessor) |
| `append_event` | No | Default `false`; if `true`, append operational journal citation |

#### `assignment` fields (Core `GradeAssignmentInput`)

| Field | Required on deterministic OPS/REF paths | Notes |
|-------|------------------------------------------|-------|
| `to_grade_ref` **or** `label` | One required | Core resolves target ref |
| `pin_version` | No | Default Core pin when using `label` |
| `authority_agent` | Yes | Human pattern when Core AR-* requires |
| `reason` | Yes | Non-empty after NFC trim |
| `decision_ref` | Yes | Non-empty; required by Core gates |
| `at` | Yes | UTC second `GRADE_UTC_SECOND` |
| `event_id` | **Yes for deterministic OPS/REF** | `gae:…`; see §11 |
| `from_grade_ref` | No | Defaults to current Evidence `grade_ref`; may be `"null"` |

### 9.4 Output

| Field | Meaning |
|-------|---------|
| `evidence` | Core Evidence after assign |
| `unit` | ENC EvidenceUnit |
| `entity` | Persisted PersistenceEntity (new EvidenceUnit revision) |
| `head_revision_id` | EvidenceUnit RevisionHead pointer after successful CAS |

### 9.5 Session / workspace

- **SHALL NOT** require an open ResearchSession or ResearchWorkspace.
- **SHALL NOT** mutate membership.
- Callers **MAY** register membership / append events separately (Sprint 019 pattern).

### 9.6 Migration

| Concern | Sprint 022 rule |
|---------|-----------------|
| Assigning from `deferred_sci003` via Core `assign` | **In scope** (normal assignment) |
| Dedicated OPS wrapper for `EvidenceGradeMigrationSupport.migrateFromDeferred` | **Non-goal** |

### 9.7 Forbidden OPS inventions

OPS **SHALL NOT**:

- invent Grade states (`draft`/`registered`/… as Grade vocabulary),
- map Grade → Claim Standing,
- change Evidence Record State as part of grade assign,
- auto-sync membership or `bears_on`,
- dual-write GradeDesignationUnit (§5).

---

## 10. Error Semantics

Propagate lower-layer errors unchanged. Do not wrap Core/Persistence errors into OPS errors unless the failure is OPS command misuse / decode failure.

| Condition | Error |
|-----------|--------|
| Evidence / revision missing | Persistence `NOT_FOUND` |
| Invalid / illegal Grade assignment (eligibility, authority, no-op, bad ref, …) | Core `EvidenceGradeValidationError` (`F1`…`F9`, `F_ASSIGNMENT`, `F_MIGRATION`, …) |
| Invalid `revision_id` grammar | Persistence `INVALID_ID` |
| Duplicate revision key | Persistence `ALREADY_EXISTS` |
| Stale RevisionHead CAS | Persistence `CONFLICT` |
| Immutable revision mutate attempt | Persistence `IMMUTABLE_ENTITY` |
| Malformed headed CanonicalUnit / decode failure | OPS `OpsError` `INVALID_COMMAND_STATE` |
| OPS misuse (`revision_id === rev:initial`, `revision_id === expected_head_revision_id`) | OPS `OpsError` `INVALID_COMMAND_STATE` |
| ENC assemble failure | Existing ENC errors (propagate) |

**Invalid Grade before persist:** Core throws during step `assign` → **nothing persisted**, head unchanged.

**CAS conflict after create:** orphan revision may exist; head unchanged (§8.3).

---

## 11. Determinism

| Concern | Rule |
|---------|------|
| `revision_id` | Caller-supplied only |
| `expected_head_revision_id` | Caller-supplied |
| GAE `event_id` | Caller-supplied on all certified deterministic OPS/REF paths (`gae:…`) |
| GAE `at` | Caller-supplied UTC second |
| `authority_agent` / `decision_ref` / `reason` | Caller-supplied |
| Export / snapshot | Existing deterministic Persistence + SER rules |
| Forbidden | `randomUUID`, `Date.now`, `Math.random`, wall-clock identity minting for OPS reference paths |

### Inherited Core fallback (documented; not changed by this SPEC)

If `GradeAssignmentInput.event_id` is omitted, Core `EvidenceGradeValidator` **MAY** mint `gae:` + `randomUUID()`. That fallback is **outside** the deterministic OPS reference path. SPEC-022 **requires** callers to supply `event_id` for certified Grade OPS paths. This SPEC does **not** authorize Core changes.

---

## 12. Operational Event Contract

### 12.1 Scientific history

GAE on Evidence / EvidenceUnit envelope events remains the **scientific** assignment history. Authoritative.

### 12.2 Optional operational journal event

When `append_event === true` **after successful head advance**:

| Field | Normative value |
|-------|-----------------|
| `event_type` | `ops.evidence_grade_assignment_revision` |
| `parent_identity` | `evidence_id` |
| `event_id` | Prefer `ops:{assignment.event_id}`; else `ops:evidence_grade:{identity}:{revision_id}` |
| Payload (citation) | `{ revision_id, predecessor_revision_id, unit_kind: "EvidenceUnit", to_grade_ref }` |

| Rule | Statement |
|------|-----------|
| Required? | **Optional** (default off) |
| Authority | **Operational history only** — MUST NOT become scientific authority |
| Journal | Sole Persistence journal — **no second journal** |
| Failure after head success | Does **not** roll back scientific revision/head |

---

## 13. Snapshot Contract

Frozen shapes **SHALL NOT** change:

```
ResearchSnapshot  = { research_session_id, member_refs, persistence_snapshot }
WorkspaceSnapshot = { research_workspace_id, member_refs, bound_session_ids, persistence_snapshot }
```

Grade assignment is reflected **additively** by new EvidenceUnit revision rows + updated EvidenceUnit RevisionHead inside `persistence_snapshot`.

No new snapshot fields. No Grade-specific snapshot projection API.

---

## 14. Export / Serialization Contract

| API | Behavior |
|-----|----------|
| `exportEvidenceUnit(identity)` | SER-JSON of **head-resolved** EvidenceUnit (includes current `grade_ref`) |
| `exportEvidenceUnitRevision(identity, revision_id)` | SER-JSON of specific EvidenceUnit revision |
| Grade-only export API | **Not required** for Sprint 022 |
| New SER profile | **Forbidden** |
| New serializer | **Forbidden** |

Authoritative graded export = EvidenceUnit export after head advance.

---

## 15. Reference Test Requirements

Do **not** implement fixtures in this SPEC. Future EXEC **SHALL** add additive `REF-OPS-*` fixtures (exact numbering at EXEC; do not renumber existing fixtures).

### Themes (normative)

| Theme | Must prove |
|-------|------------|
| Post-persist assign (e.g. deferred → EG label, or label reassignment) | New EvidenceUnit revision; head advances; `grade_ref` updated; GAE present; `evidence_version` bumped |
| Human raise vs AI raise rejection | Core `F5` (or applicable code); nothing committed as head |
| CAS conflict | `CONFLICT`; prior head retained |
| Duplicate `revision_id` | `ALREADY_EXISTS` |
| Lineage | `predecessor_revision_id === expected_head_revision_id` |
| Immutability | Prior revision payload unchanged |
| Decode round-trip | `evidenceFromEvidenceUnitPayload` reconstructs GAE / `grade_ref` |
| Optional event | When enabled: `ops.evidence_grade_assignment_revision` citation; scientific authority remains unit |
| Snapshot | Persistence snapshot contains prior+new revisions + RevisionHead |
| Record State preserved | `record_state` unchanged across grade assign |
| Standing non-interference | No Claim mutation |
| GradeDesignationUnit non-write | Assign path does not create GradeDesignationUnit head/revision |
| Regression | REF-OPS Standing + Record State + prior OPS remain green; SCI 44/44 |

### Deterministic identifiers in fixtures

Caller-supplied: `evidence_id`, `revision_id`, `expected_head_revision_id`, GAE `event_id`, `at`, agents, `decision_ref`.

### Corpus impact (expected)

| Corpus | Impact |
|--------|--------|
| SCI | Unchanged 44/44 (no SCI fixture edits) |
| OPS | Additive fixtures (count increases from 61) |
| FULL | SCI ∪ OPS |

---

## 16. Conformance Requirements

| Profile | Sprint 022 stance |
|---------|-------------------|
| `CONF-001@1.0.0` | **Unchanged** |
| `CONF-001@1.1.0-OPS` | **Unchanged** — additive `REF-OPS-` recognition already present |

No ConformanceEngine redesign. No new profile id required for additive OPS Grade evidence.

If EXEC introduces a new authority prefix outside `REF-OPS-` / existing authorities, that would require a separate architecture decision — **out of scope** and not justified here.

---

## 17. Certification Requirements

Pipeline remains:

```
REF → CONF → CERT
```

| Concern | Requirement |
|---------|-------------|
| SCI certification | Remain 44/44 |
| OPS / FULL | Additive REF-OPS under existing OPS profile |
| Engines | No second Conformance or Certification engine |
| Regression | Sprints 019–021 OPS + Model C + SCI must remain green |
| Artifacts | Produced only by a future authorized certification step — **not** this SPEC |

**Certification architecture changes:** **NONE**.

---

## 18. Non-Goals

Sprint 022 **SHALL NOT**:

- introduce a generic lifecycle engine / `ScientificUnitLifecycle` / generic `postPersistTransition()`
- invent a Grade state machine (`draft`/`registered`/… as Grade states)
- dual-write / dual-head GradeDesignationUnit on the OPS assign path (§5)
- Grade AI / AI-generated authoritative grades
- literature ingestion / DocumentArtifact
- Knowledge Graph store or second scientific graph
- PostgreSQL / OpenSearch / Neo4j / vector DB / Redis
- frontend / REST / GraphQL / distributed workers / multi-user infra
- new scientific authority
- second event journal
- Contradiction / Negative Result / Verification OPS
- material Evidence content rewrite OPS (non-grade fields)
- Claim Standing changes via Grade
- Evidence Record State transitions via Grade
- Core redesign of EG-0.1
- Persistence architecture redesign
- snapshot schema redesign
- new SER profile

---

## 19. Future Compatibility

| Future capability | Compatibility stance |
|-------------------|----------------------|
| Contradiction / NR / Verification OPS | May consume graded Evidence heads; must use same Model C orchestration pattern with **explicit** per-unit OPS methods — not a generic engine |
| Provenance packaging (PROV / RO-Crate) | Remains deferred; GAE + Evidence provenance already separated from OPS journal |
| Literature / DocumentArtifact | Eligibility already uses Evidence source/provenance; Grade OPS does not require DocumentArtifact |
| Retrieval / search | May index head-resolved `grade_ref`; must not become scientific authority |
| Knowledge graph projection | **Derived only** from authoritative units; GradeDesignationUnit may later be projected — still not a second authority |
| AI proposal layer | May propose candidate grades; Human/Core gates remain authoritative (SCI-003 AR-*) |

This SPEC does **not** design those systems.

---

## 20. Open Questions

| ID | Topic | Status | Resolution |
|----|-------|--------|------------|
| **OQ-022-001** | GradeDesignationUnit vs Evidence `grade_ref` | **CLOSED** | §5 OPTION A |
| **OQ-022-002** | Exact Core Grade assignment semantics | **CLOSED** | §4 / SCI-003 / `EvidenceGradeService.assign` |
| **OQ-022-003** | Exact Evidence revision payload after assignment | **CLOSED** | Core Evidence after assign → ENC EvidenceUnit; SemVer bumped; Record State preserved |
| **OQ-022-004** | Event requirements | **CLOSED** | Optional `ops.evidence_grade_assignment_revision` (§12) |
| **OQ-022-005** | Snapshot projection | **CLOSED** | Frozen shapes; additive Persistence content (§13) |
| **OQ-022-006** | Deterministic identifier requirements | **CLOSED** | §11 |
| **OQ-022-007** | Reference fixture requirements | **CLOSED** | §15 themes; numbering at EXEC |
| **OQ-022-008** | Conformance impact | **CLOSED** | Profiles unchanged (§16) |

### Residual non-blocking notes (not open architecture blockers)

| ID | Note |
|----|------|
| N-022-001 | Exact REF-OPS fixture id integers assigned at EXEC |
| N-022-002 | Inherited Core `randomUUID` fallback if GAE `event_id` omitted — OPS path forbids relying on it |
| N-022-003 | Future optional GradeDesignationUnit projection sprint remains possible without revisiting OPTION A authority |

**No unresolved architectural OQ remains that blocks architecture audit.**

---

## 21. Execution Gate

**Status: DRAFT — READY FOR ARCHITECTURE AUDIT**

| Gate | State |
|------|-------|
| Fundamental Grade designation decision | CLOSED (§5) |
| Model C reuse | CLOSED |
| Persistence redesign | Not required |
| Conformance redesign | Not required |
| Generic lifecycle | Rejected |
| Implementation authorization | **NO** |

**Next authorized step (when separately commanded):** Architecture audit of SPEC-022 → Implementation Decision → Final re-audit → only then EXEC authorization.

**This document does not authorize implementation.**

---

## 22. Final Architectural Verdict

Sprint 022 Grade OPS is the third explicit Model C post-persist OPS orchestration (after Claim Standing and Evidence Record State), specialized to Core Evidence Grade assignment.

It revises **EvidenceUnit**, advances the **EvidenceUnit** RevisionHead, preserves Core as sole Grade authority, keeps Persistence/CONF/CERT architectures unchanged, rejects Grade state machines and generic lifecycle frameworks, and closes GradeDesignationUnit dual-write as **out of Sprint 022 OPS scope** without removing ENC’s existing GradeDesignationUnit capability for non-OPS uses.

---

SPEC-022 FINAL VERDICT
======================

Grade scientific authority:
Scientific Core (SCI-003 EG-0.1) solely owns Grade meaning, validity, eligibility, Human gates, and GAE semantics. OPS orchestrates only.

Grade representation:
Evidence designation via SCI-002 `grade_ref` (+ optional `grade_assignment_log`), revised as immutable EvidenceUnit under Model C.

GradeDesignationUnit decision:
OPTION A SELECTED — EvidenceUnit/`grade_ref` authoritative for Sprint 022 OPS; GradeDesignationUnit MUST NOT be dual-written or dual-headed on the OPS assign path. OPTION B and Option C REJECTED.

Evidence grade_ref:
Authoritative current Grade string on Evidence; updated only by Core `EvidenceGradeService.assign`; encoded into EvidenceUnit content.

OPS operation:
`ResearchOperations.assignEvidenceGrade` orchestrates headed Evidence decode → Core `EvidenceGradeService.assign` → ENC EvidenceUnit → Persistence.create → EvidenceUnit RevisionHead CAS → optional operational event.

Model C:
Compatible and unchanged — EvidenceUnit identity/revision/predecessor/head/CAS/partial-write semantics identical in shape to SPEC-020/021.

Persistence changes:
NONE

Conformance changes:
NONE

Certification changes:
NONE

Generic lifecycle:
NOT JUSTIFIED

New scientific authority:
NONE

New scientific graph:
NONE

New event journal:
NONE

Open architectural questions:
NONE blocking (OQ-022-001…008 CLOSED; residual N-022-* are EXEC numbering / inherited Core notes only)

Execution gate:
READY FOR ARCHITECTURE AUDIT

Implementation authorization:
NO

# SPEC-021 — Evidence Post-Persist Record State OPS

| Field | Value |
|-------|--------|
| Spec ID | SPEC-021 |
| Title | Evidence Post-Persist Record State OPS |
| Version | **0.1.0-DRAFT** |
| Status | **DRAFT — READY FOR ARCHITECTURE AUDIT** |
| Mode | Architecture / specification only — **NO IMPLEMENTATION** |
| Project | AIP — evidence-driven computational platform for exploring, modeling, and researching human biology |
| Inputs | SCI-000, SCI-002@0.1.0, ADR-0006, SPEC-016A, SPEC-017, SPEC-018, SPEC-019, SPEC-020 v0.3.0-DRAFT, ADR-020, IMPLEMENTATION-DECISION-020, DISCOVERY-021, ROADMAP-REVIEW-001, EXEC-SPRINT-019…020 certified |
| Baseline | Sprint 020 FORMALLY CERTIFIED AND CLOSED · `6c0106c3e27685f549bc7c2b882a0365c6b511d6` |
| Discovery | `audits/roadmap/DISCOVERY-021_EVIDENCE_RECORD_STATE.md` — READY FOR SPEC-021 |
| Does not claim | EXEC authorization, code changes, or certification |

---

## 1. Purpose

Define the **normative OPS orchestration contract** that applies Scientific Core Evidence **Record State** transitions to Evidence identities that are **already persisted**, using certified **Model C** immutable revisions and `RevisionHead` CAS.

This specification:

- Does **not** invent Evidence Record State vocabulary.
- Does **not** redesign Scientific Core Evidence semantics.
- Does **not** redesign Persistence Model C.
- Authorizes **neither** implementation nor tests until architecture audit (and any required patches / re-audit) succeed.

---

## 2. Background

| Sprint | Delivered | Gap remaining |
|--------|-----------|---------------|
| 019 | Evidence OPS register (create-once) + optional **pre-persist** `EvidenceTransitionService` | No post-persist Record State after first Persistence.create |
| 020 | Model C revisions + `RevisionHead` + Claim Standing post-persist | Evidence limited to `rev:initial` + head only |

After first persist, CanonicalUnit revisions are immutable. Changing Record State therefore requires a **new Model C revision**, not in-place mutation.

DISCOVERY-021 established that Record State is already Core science (`draft` / `registered` / `withdrawn`) and that the missing piece is OPS post-persist orchestration analogous to `transitionClaimStanding`.

---

## 3. Certified Baseline

| Item | Value |
|------|--------|
| Commit | `6c0106c3e27685f549bc7c2b882a0365c6b511d6` |
| SCI | 44/44 · `CONF-001@1.0.0` · CERTIFIED |
| OPS | 46/46 · `CONF-001@1.1.0-OPS` · CERTIFIED |
| FULL | 90/90 |
| Model C | Stable scientific identity; immutable revisions; `revision_id`; `predecessor_revision_id`; `RevisionHead`; `replace` + `expected_version` CAS |
| Evidence OPS today | `registerEvidenceUnit`, `getEvidenceUnit`, `exportEvidenceUnit`; membership; timeline via journal; snapshots |

---

## 4. Evidence Record State Semantics

### 4.1 Authority

Evidence Record State is **scientific semantic state** owned by Scientific Core under SCI-002 / SCI-000 Evidence Allowed States and ADR-0006.

It is **not** Workflow State, Claim Standing, Persistence metadata, OPS membership, or revision lineage.

### 4.2 Closed vocabulary (normative import — do not extend)

```
draft | registered | withdrawn
```

### 4.3 Object-local transition machine (Core — normative import)

| From | Allowed to |
|------|------------|
| (create) | `draft` |
| `draft` | `registered`, `withdrawn` |
| `registered` | `withdrawn` |
| `withdrawn` | ∅ (terminal for this `evidence_id`) |

### 4.4 Forbidden / not authorized by Core

| Transition / value | Status |
|--------------------|--------|
| `withdrawn` → `draft` / `registered` | **Not currently authorized by Core** |
| `registered` → `draft` | **Not currently authorized by Core** |
| Claim Standing values as Record State | Forbidden (SCI-002 / ADR-0006) |
| Workflow values as Record State | Forbidden (ADR-0006) |
| Invented states (`archived`, `active`, `deprecated`, …) as Record State | Forbidden |

SPEC-021 **SHALL NOT** invent transitions absent from Core `EvidenceTransitionService`.

### 4.5 Core guarantees retained

- Human Reviewer + non-empty `decision_ref` required for `draft` → `registered`.
- AI **SHALL NOT** register Evidence.
- ERTE appended on Record State change (except initial create at `draft`).
- `evidence_id` stable across Record State transitions.
- Core Record State transition **preserves** `evidence_version` unless a separate material-update path is used (out of scope).
- Material content updates and Grade assignment are **orthogonal** and **out of this SPEC’s EXEC slice**.

---

## 5. Authority Boundaries

| Concern | Owner |
|---------|-------|
| Record State vocabulary & transition legality | **Scientific Core** |
| Human Reviewer / registration gates | **Scientific Core** |
| Resulting Evidence aggregate content | **Scientific Core** |
| Canonical EvidenceUnit projection | **ENC** |
| Immutable revision storage, lineage fields, RevisionHead, CAS | **Persistence (Model C)** |
| Sole event journal | **Persistence** |
| Orchestration sequence, optional OPS event, session/workspace coordination | **OPS** |
| SER export bytes | **SER** |
| Conformance / certification of test evidence | **CONF / CERT** (existing engines) |

**Invariant:** No second scientific authority, no second Evidence model, no second relationship graph, no second event journal.

---

## 6. Scope

### 6.1 OQ-021-002 — CLOSED: Record State post-persist only

**Sprint 021 scope is limited to Evidence Record State post-persist transition OPS.**

| In scope | Out of scope |
|----------|--------------|
| OPS method to transition Record State on a **persisted** Evidence identity via Model C | Evidence semantic redesign |
| OPS-local EvidenceUnit → Evidence projection for transition input | Grade OPS |
| Thin read/export helpers for Evidence revisions if needed for REF | Contradiction / NR / Verification OPS |
| Additive REF-OPS / tests / docs (future EXEC) | Literature / DocumentArtifact / AI / KG |
| Preserve pre-persist path from Sprint 019 | Database / API / frontend / durable workspace / distributed infra |
| | Automatic relationship synchronization |
| | Material content update OPS (`EvidenceVersionService`) |

### 6.2 Pre-persist path preserved

Sprint 019 `registerEvidenceUnit(..., { transition })` remains valid and **SHALL NOT** be removed or redefined by this SPEC.

---

## 7. Non-Goals

See also §31. SPEC-021 does **not** authorize:

- New Evidence Record State vocabulary or illegal Core transitions  
- Grade / Contradiction / Negative Result / Verification OPS  
- Literature, DocumentArtifact, AI, Knowledge Graph  
- Database, API, frontend, durable workspace, distributed infrastructure  
- Automatic `bears_on` ↔ `supported_by` synchronization  
- Second journal / second scientific graph  
- Redesign of ResearchSnapshot schema  
- Changes to SCI profile or mandatory new CONF profile  
- EXEC / certification by this document alone  

---

## 8. Model C Integration

For every successful post-persist Record State transition:

| Rule | Normative statement |
|------|---------------------|
| Scientific identity | `evidence_id` unchanged; = `PersistenceEntity.identity` |
| Unit kind | `EvidenceUnit` |
| Initial revision | Existing `rev:initial` (or dual-read legacy ≡ `rev:initial`) remains immutable |
| New revision | Caller-supplied `revision_id` matching `^rev:[A-Za-z0-9._~-]{1,128}$` and ≠ `rev:initial` |
| Storage key | `persist:CanonicalUnit:EvidenceUnit:{evidence_id}:{revision_id}` |
| Lineage | `predecessor_revision_id` = revision being transitioned from (= caller `expected_head_revision_id`) |
| Head key | `persist:RevisionHead:EvidenceUnit:{evidence_id}` |
| Head advance | `advanceHead` via `replace` + `expected_version` (= prior head `revision_id`) |
| Stale head | Persistence `CONFLICT` |
| SemVer trichotomy | `evidence_version` ≠ `revision_id` ≠ head CAS token (`RevisionHead.content_version`) |

Record State lives in **Evidence canonical content** of each revision payload — not in RevisionHead and not as Persistence-only metadata.

---

## 9. Evidence Decode / Projection Contract

### 9.1 OQ-021-001 — CLOSED

OPS **SHALL** provide an OPS-local projection:

```
evidenceFromEvidenceUnitPayload(payload) → Evidence
```

analogous to `claimFromClaimUnitPayload`.

This projection is **not** a second Evidence scientific model. It reconstructs a Core-shaped `Evidence` object from an intact ENC `EvidenceUnit` so Core `EvidenceTransitionService.transition` can authorize the next scientific state. Authoritative meaning remains Core validation of the transitioned result.

### 9.2 Field classes

| Class | Fields (minimum) | Role |
|-------|------------------|------|
| **Canonical scientific (reconstruct)** | From `envelope.content`: `evidence_id`, `evidence_version`, `record_state`, `summary`, `source`, `provenance`, `grade_ref`, `items`, `ethics_constraint_marker`, `created_by`, `created_at`, optional `collection`, `ai_assisted`, `human_sponsor`, `protocol_ref`, `dataset_refs`, `citation_refs` | Input to Core transition |
| **Canonical scientific (reconstruct from envelope)** | `ontology_ref`, `spec_ref` from envelope; `bears_on` from references with role `bears_on`; `record_transition_log` from Evidence ERTE events in `envelope.events` (exclude Grade Assignment Events when reconstructing ERTE log — GAE remain grade-local) | Input to Core transition |
| **Persistence metadata (exclude from Core transition input object as scientific fields)** | `storage_key`, `revision_id`, `predecessor_revision_id`, `entity_kind`, Persistence relationship/event envelopes on `PersistenceEntity` | Used only for load/CAS/lineage |
| **OPS metadata (exclude)** | Session/workspace membership, timeline labels, OPS event payloads | Must not enter Core Evidence |

### 9.3 Grade Assignment Events in envelope

ENC may concatenate ERTE and GAE in `envelope.events`. Projection **SHALL** map ERTE-shaped events into `record_transition_log` and **MAY** map GAE into `grade_assignment_log` when reconstructible. Record State transition **SHALL NOT** invent or drop scientific grade history when present and reconstructible.

### 9.4 Lossiness

If ENC content omits a Core-optional field, projection omits it. SPEC-021 does not require ENC redesign. Core transition + validation of the **output** Evidence remains the scientific gate.

### 9.5 Authoritative after transition

The Evidence returned from `EvidenceTransitionService.transition` (then ENC-assembled and persisted) is the scientific authority for the new revision — not the OPS projection helper.

---

## 10. Transition Contract

### 10.1 OQ-021-003 — CLOSED: OPS API

#### Method

```
ResearchOperations.transitionEvidenceRecordState(input) → result
```

Naming differs from `transitionClaimStanding` because the scientific axis is **Record State**, not Standing.

#### Input

| Field | Required | Meaning |
|-------|----------|---------|
| `identity` | Yes | Scientific `evidence_id` |
| `transition` | Yes | Core `EvidenceRecordTransitionInput` (`to`, `authority_agent`, `reason`, `at`, optional `decision_ref`, **`event_id` required for deterministic EXEC paths**, optional `items`, optional `bears_on`) |
| `revision_id` | Yes | New Model C revision id (`rev:…` ≠ `rev:initial`) |
| `expected_head_revision_id` | Yes | Expected current head (= predecessor) |
| `append_event` | No | Default `false`; if `true`, append operational journal citation |

#### Output

| Field | Meaning |
|-------|---------|
| `evidence` | Core Evidence after transition |
| `unit` | ENC EvidenceUnit |
| `entity` | Persisted PersistenceEntity (new revision) |
| `head_revision_id` | RevisionHead pointer after successful CAS |

#### Normative sequence

```
1. Validate revision_id / expected_head_revision_id (Persistence grammar; ≠ each other; new ≠ rev:initial)
2. getEvidenceUnit(identity)                         // head-resolved
3. evidenceFromEvidenceUnitPayload(entity.payload) // OPS projection
4. EvidenceTransitionService.transition(...)         // Core — may throw
5. CanonicalEncoder.assemble(evidence)               // ENC — may throw
6. entityFromCanonicalUnit(unit, {
     revision_id,
     predecessor_revision_id: expected_head_revision_id
   })
7. repository.create(entity)                         // may ALREADY_EXISTS
8. repository.advanceHead(identity, "EvidenceUnit",
     expected_head_revision_id, revision_id)         // may CONFLICT
9. optional appendEvent(...)                         // operational only
10. return { evidence, unit, entity, head_revision_id }
```

Steps 2–5 persist nothing. Failures after step 7 follow §16.

#### Session / workspace

- Transition **SHALL NOT** require an open ResearchSession or ResearchWorkspace.
- Transition **SHALL NOT** mutate membership.
- Callers **MAY** append operational events and register membership separately (Sprint 019 pattern).

---

## 11. Valid Transitions

| Transition | Authorized by Core? | Human gate (Core) |
|------------|---------------------|-------------------|
| `draft` → `registered` | Yes | Human Reviewer + `decision_ref` |
| `draft` → `withdrawn` | Yes | Human if `ai_assisted` (Core rule) |
| `registered` → `withdrawn` | Yes | Human if `ai_assisted` (Core rule) |
| Any other Record State edge | **Not currently authorized by Core** | — |

Illegal transitions surface as Core `EvidenceValidationError` (e.g. `F_TRANSITION`) and **SHALL** propagate unchanged through OPS.

---

## 12. Revision Identity

| Kind | Rule |
|------|------|
| Initial | `rev:initial` (existing Sprint 019/020 Evidence registration) |
| Subsequent | Caller-supplied `rev:[A-Za-z0-9._~-]{1,128}` ≠ `rev:initial` |
| Duplicate storage key | Persistence `ALREADY_EXISTS` |
| Forbidden generators | `randomUUID`, `Date.now`, `Math.random`, implicit counters for `revision_id` |

---

## 13. Lineage

| Rule | Statement |
|------|-----------|
| Authoritative field | `PersistenceEntity.predecessor_revision_id` |
| On successor | **Required**; value = `expected_head_revision_id` (= prior revision’s `revision_id`) |
| On `rev:initial` | Absent |
| Not | Core scientific graph; not OPS membership graph; not `bears_on` |

Optional OPS journal citations of lineage are **non-authoritative** if they disagree with entity metadata (SPEC-020 rule).

---

## 14. RevisionHead

| Item | Rule |
|------|------|
| Key | `persist:RevisionHead:EvidenceUnit:{evidence_id}` |
| Role | Mutable coordination pointer — **not** scientific truth |
| Advance | `advanceHead(evidence_id, "EvidenceUnit", from, to)` |
| CAS token | `RevisionHead.content_version` = pointed `revision_id` |
| Mechanism | Existing `replace` + `expected_version` |

`getEvidenceUnit` remains **head-resolved** (Sprint 020 behavior).

---

## 15. CAS / Concurrency

Scenario:

- Actor A: head `R1` → create `R2` → advanceHead(`R1`→`R2`) → success; head=`R2`
- Actor B: expected `R1` → create `R3` → advanceHead(`R1`→`R3`) → **CONFLICT**; head remains `R2`

No silent overwrite. Orphan `R3` may exist and is addressable by revision id (partial write — §16). Branching is **not** supported as a scientific multi-head model.

---

## 16. Partial Write Semantics

Preserve SPEC-020 §28 / Sprint 020 tested behavior. **No new transaction architecture.**

| Step | On failure |
|------|------------|
| Core transition | Stop; nothing persisted |
| ENC assemble | Stop; nothing persisted |
| `create` revision | Stop; head unchanged |
| `advanceHead` CAS | **Partial:** revision row may exist; head remains prior; **not** silent current scientific commit |
| optional `appendEvent` | Scientific revision+head may exist without operational event |
| Membership | N/A (unchanged by transition) |

Caller may retry `advanceHead` with same `to` if row fingerprint matches, or leave orphan addressable via get-by-revision.

---

## 17. Membership

| Rule | Statement |
|------|-----------|
| Default | Record State transition **does not** change membership |
| Membership | Organizational OPS index only |
| ≠ | `bears_on`, `supported_by`, Record State, revision lineage |
| Sync | **Forbidden** automatic relationship repair |

---

## 18. Timeline / Events

### 18.1 Scientific ERTE

Owned by Core; embedded in Evidence / ENC envelope events. Authoritative for Record State history.

### 18.2 Optional operational journal event

When `append_event === true` after successful head advance:

| Field | Normative guidance |
|-------|--------------------|
| `event_type` | `ops.evidence_record_state_revision` |
| `parent_identity` | `evidence_id` |
| `event_id` | Deterministic: prefer `ops:{transition.event_id}`; else `ops:evidence_record_state:{identity}:{revision_id}` |
| Payload (citation) | `{ revision_id, predecessor_revision_id, unit_kind: "EvidenceUnit", to_record_state }` |

| Rule | Statement |
|------|-----------|
| Required? | **Optional** (default off) |
| Failure after head success | Does not roll back scientific revision/head |
| Second journal? | **No** — sole Persistence journal |

---

## 19. ResearchSnapshot

Sprint 016 frozen schema **SHALL NOT** change:

```
{ research_session_id, member_refs, persistence_snapshot }
```

Current Evidence Record State is reflected by:

- head-resolved Persistence entities inside `persistence_snapshot`, and/or  
- subsequent `getEvidenceUnit` / export  

No new ResearchSnapshot fields.

---

## 20. WorkspaceSnapshot

Sprint 018 additive schema **SHALL NOT** break. Same reflection rule as §19 via `persistence_snapshot` + membership pointers.

---

## 21. Serialization / Export

| API | Behavior |
|-----|----------|
| `exportEvidenceUnit(identity)` | SER-JSON of **head-resolved** EvidenceUnit payload (existing semantics = current) |
| `exportEvidenceUnitRevision(identity, revision_id)` | **Additive** SER-JSON of specific revision payload (authorized) |
| `getEvidenceUnitRevision(identity, revision_id)` | **Additive** Persistence get by revision |
| `getEvidenceHead` / `getEvidenceLineage` | **Additive** thin wrappers (optional but recommended for REF parity with Claim) |

No new SER profile. No ENC redesign.

---

## 22. Error Contract

Reuse existing typed errors; propagate lower-layer errors unchanged.

| Condition | Error |
|-----------|--------|
| Illegal / invalid target Record State transition | Core `EvidenceValidationError` (e.g. `F_TRANSITION`, `F4`, `F5`, …) |
| Invalid `revision_id` grammar | Persistence `INVALID_ID` |
| Duplicate revision storage key | Persistence `ALREADY_EXISTS` |
| Stale RevisionHead / CAS | Persistence `CONFLICT` |
| Missing Evidence / revision | Persistence `NOT_FOUND` |
| Immutable revision mutate | Persistence `IMMUTABLE_ENTITY` |
| Missing/invalid predecessor on entity build | Persistence `INVALID_STATE` |
| OPS misuse (e.g. `revision_id === rev:initial` on transition) | OPS `OpsError` `INVALID_COMMAND_STATE` |
| Decode/projection failure | OPS `OpsError` `INVALID_COMMAND_STATE` |

Do not wrap Core/Persistence errors into OPS errors.

---

## 23. Determinism

| Concern | Rule |
|---------|------|
| `revision_id` | Caller-supplied only |
| ERTE `event_id` / `at` | Caller-supplied on deterministic EXEC/REF paths |
| Head CAS | Explicit expected head |
| Forbidden | Generating scientific identity or revision identity with wall-clock/random |

**Note (non-blocking observation, inherited):** Core `EvidenceEventBuilder` may use `randomUUID` if ERTE `event_id` omitted. SPEC-021 **requires** callers to supply `event_id` for certified deterministic Evidence post-persist paths. This SPEC does **not** change Core STE/ERTE builder behavior.

---

## 24. Regression Requirements

Future EXEC **SHALL** preserve:

| Area | Source |
|------|--------|
| Evidence initial registration + optional pre-persist transition | Sprint 019 |
| Membership / bears_on / no supported_by sync | Sprint 019 |
| Snapshot / workspace / export / events patterns | Sprint 016–019 |
| Model C keys, lineage, head CAS, dual-read, Claim Standing | Sprint 020 |
| SCI 44/44 | Unchanged SCI fixtures |
| Prior OPS fixtures remain green | Additive fixtures only |

---

## 25. Reference Test Requirements

Future additive REF-OPS (illustrative ids; exact numbering at EXEC) **SHALL** prove:

| Theme | Must prove |
|-------|------------|
| Draft persisted then `draft`→`registered` | New revision; head advances; Core registered gates enforced |
| `registered`→`withdrawn` | Successor revision; terminal Record State |
| Invalid transition | Core error identity; nothing committed as head |
| Stale head | `CONFLICT`; prior head retained |
| Duplicate `revision_id` | `ALREADY_EXISTS` |
| Lineage | `predecessor_revision_id` correct |
| Immutability | Old revision unchanged |
| Snapshot | Persistence snapshot contains prior+new revisions + RevisionHead |
| Export | Head export reflects new `record_state`; old revision export differs |
| Determinism | Double-run identical with caller ids |
| Optional event | When enabled, journal citation present; entity metadata authoritative |
| Pre-persist regression | Sprint 019 register+optional transition still works |
| Claim Standing regression | Sprint 020 Claim path unbroken |
| Membership unchanged | Transition does not alter member_refs |

Do not author fixtures in this SPEC phase.

---

## 26. Conformance Requirements

| Profile | Rule |
|---------|------|
| SCI `CONF-001@1.0.0` | Remains SCI corpus target; no SCI fixture rewrite required for Record State OPS |
| OPS `CONF-001@1.1.0-OPS` | Additive REF-OPS under existing profile preferred |
| Engines | Single ConformanceEngine; no second engine |
| Path | REF → ReferenceReport → ConformanceEngine(profile) → ConformanceReport |

Profile bump only if architecture audit proves existing OPS profile cannot accept additive fixtures (historical pattern: additive through Sprint 020 without bump).

---

## 27. Certification Requirements

| Rule | Statement |
|------|-----------|
| Engines | Single CertificationEngine |
| Input | ConformanceReports only |
| Expected future decisions | CERTIFIED when EXEC + CODE-AUDIT + corpora pass |
| This SPEC | Does **not** certify |

Path: REF → CONF → CERT (unchanged).

---

## 28. Failure Modes

| Mode | Observable result |
|------|-------------------|
| Core rejects transition | Error; no new revision; head unchanged |
| ENC fails | Error; no new revision; head unchanged |
| Duplicate revision | `ALREADY_EXISTS` |
| Stale CAS | `CONFLICT`; possible orphan revision |
| Event append fails after head | Revision+head present; missing ops event |
| Attempt mutate old revision | `IMMUTABLE_ENTITY` |

---

## 29. Open Questions

### Closed by this SPEC

| ID | Resolution |
|----|------------|
| **OQ-021-001** | **CLOSED** — OPS-local `evidenceFromEvidenceUnitPayload`; §9 field contract |
| **OQ-021-002** | **CLOSED** — Record State post-persist only; §6 |
| **OQ-021-003** | **CLOSED** — `transitionEvidenceRecordState`; §10 |

### Remaining (non-blocking for architecture audit of this SPEC)

| ID | Question | Why it matters | Blocking? | Proposed resolution |
|----|----------|----------------|-----------|---------------------|
| **OQ-021-004** | Exact additive REF-OPS fixture id range / titles | EXEC packaging | Non-blocking | Assign at EXEC; themes fixed in §25 |
| **OQ-021-005** | Whether CONF OPS profile text needs bump for new themes | CERT packaging | Non-blocking unless audit finds prefix hard-fail | Prefer additive under `CONF-001@1.1.0-OPS` |
| **OQ-021-006** | Whether `getEvidenceHead` / `getEvidenceLineage` / revision export are mandatory vs recommended | API surface size | Non-blocking | **Recommended** for Claim parity; mandatory minimum = transition + head-resolved get/export |
| **OQ-021-007** | Optional `items` / `bears_on` overrides on post-persist transition in EXEC tests | Exercises Core optional inputs | Non-blocking | Allow passthrough of Core input; REF may omit overrides |

**Architecture blockers for this SPEC:** **0** (pending independent architecture audit).

---

## 30. Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-021-001 | Record State vocabulary imported from Core/SCI-002 only |
| AC-021-002 | No illegal Core transitions invented |
| AC-021-003 | Model C keys/lineage/head/CAS specified |
| AC-021-004 | OPS method `transitionEvidenceRecordState` fully contracted |
| AC-021-005 | Decode/projection boundary closed (OQ-021-001) |
| AC-021-006 | Scope limited to Record State post-persist (OQ-021-002) |
| AC-021-007 | Partial-write semantics explicit without new transactions |
| AC-021-008 | Membership / bears_on / supported_by boundaries preserved |
| AC-021-009 | ResearchSnapshot frozen; WorkspaceSnapshot unbroken |
| AC-021-010 | Determinism rules for revision/ERTE ids stated |
| AC-021-011 | Error reuse / propagation stated |
| AC-021-012 | REF / CONF / CERT additive path stated |
| AC-021-013 | Non-goals explicit |
| AC-021-014 | Pre-persist Sprint 019 path preserved |
| AC-021-015 | Claim Standing / Model C regression required |

---

## 31. Explicit Non-Goals

Restatement for audit checklist:

Grade OPS · Contradiction OPS · NR OPS · Verification OPS · material Evidence content OPS · literature · DocumentArtifact · AI · KG · DB · API · UI · durable workspace · distributed infra · auto relationship sync · second journal · second scientific graph · new Record State vocabulary · Core/ENC/SER/Persistence redesign · EXEC without architecture audit.

---

## 32. Future Extensions

Out of this SPEC; candidates after successful EXEC-021:

1. Evidence material content update OPS under Model C  
2. Grade OPS (SCI-003) using current Evidence head revision  
3. Contradiction / Negative Result / Verification OPS  
4. Stronger predecessor existence checks at Persistence.create (CODE-AUDIT-020 O-020-01)  
5. Durable Persistence adapters (separate infrastructure SPEC)

---

## Document Control

| Version | Status | Notes |
|---------|--------|-------|
| 0.1.0-DRAFT | READY FOR ARCHITECTURE AUDIT | Initial SPEC from DISCOVERY-021; OQ-021-001…003 closed |

**Next step:** Independent architecture audit of SPEC-021.  
**Not authorized:** EXEC, code, tests, certification, commit, push.

*End SPEC-021.*

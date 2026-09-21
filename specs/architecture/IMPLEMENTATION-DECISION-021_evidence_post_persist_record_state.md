# IMPLEMENTATION-DECISION-021

| Field | Value |
|-------|--------|
| Decision ID | IMPLEMENTATION-DECISION-021 |
| Title | Evidence Post-Persist Record State OPS — Implementation Contract |
| Version | **0.1.0** |
| Status | **IMPLEMENTATION-READY — PENDING FINAL ARCHITECTURE RE-AUDIT** |
| Baseline | `6c0106c3e27685f549bc7c2b882a0365c6b511d6` |
| SPEC | SPEC-021 v0.1.0-DRAFT |
| Architecture audit | ARCHITECTURE-AUDIT-021 — **APPROVED WITH OBSERVATIONS** |
| Discovery | DISCOVERY-021 — READY FOR SPEC-021 |
| Mode | Design-only — **NO RUNTIME IMPLEMENTATION** |
| Does not authorize | EXEC-021 coding, tests, certification, commit, or push |

---

## 1. Purpose

Convert audited SPEC-021 into a precise, implementation-ready contract for Sprint 021.

This decision removes EXEC ambiguity for:

- what is implemented / not implemented  
- layer ownership  
- frozen contracts  
- exact OPS API and decode helper  
- Model C / RevisionHead / CAS / partial-write behavior  
- determinism, errors, events, membership, snapshots, export  
- future REF / CONF / CERT expectations  
- allowed vs forbidden surfaces  
- stop conditions  

**Implementation Decision complete. Sprint 021 is implementation-ready, subject to successful Final Architecture Re-Audit. No runtime implementation is authorized by this document.**

---

## 2. Baseline

| Item | Value |
|------|--------|
| Certified HEAD | `6c0106c3e27685f549bc7c2b882a0365c6b511d6` |
| Sprint 019 | FORMALLY CERTIFIED AND CLOSED — Evidence OPS create-once + optional **pre-persist** transition |
| Sprint 020 | FORMALLY CERTIFIED AND CLOSED — Model C + Claim Standing post-persist + Evidence `rev:initial` only |
| SCI / OPS / FULL | 44/44 · 46/46 · 90/90 |
| Profiles | SCI `CONF-001@1.0.0` · OPS `CONF-001@1.1.0-OPS` |
| Highest OPS fixture today | `REF-OPS-046` (next free additive id starts at **`REF-OPS-047`**) |
| Architecture audit | 0 required patches · 0 blockers · 6 non-blocking observations · READY FOR IMPLEMENTATION DECISION |

Working tree may contain documentation-only untracked/modified files (README, DISCOVERY/ROADMAP, SPEC-021, ARCHITECTURE-AUDIT-021). Those do not alter the certified runtime baseline.

---

## 3. Authoritative Contracts

| Authority | Binding sources |
|-----------|-----------------|
| Scientific Record State | SCI-002 / SCI-000 · Core `EvidenceTransitionService` · `EVIDENCE_RECORD_STATES` |
| Model C Persistence | SPEC-020 / ADR-020 · certified Persistence revision keys, lineage, `RevisionHead`, CAS |
| Claim Standing precedent (structure only) | `ResearchOperations.transitionClaimStanding` · `claimFromClaimUnitPayload` |
| Evidence OPS today | `registerEvidenceUnit` · `getEvidenceUnit` · `exportEvidenceUnit` |
| SPEC subject | SPEC-021 §§1–32 |
| Audit constraints | ARCHITECTURE-AUDIT-021 (O-021-01…06 preserved as EXEC discipline) |

Frozen (must not be redesigned by Sprint 021):

- Scientific Core Record State vocabulary and transition table  
- ENC / SER architectures  
- Persistence Model C addressing and CAS semantics  
- ResearchSnapshot (Sprint 016)  
- WorkspaceSnapshot additive contract (Sprint 018)  
- Single Persistence event journal  
- Single ConformanceEngine / CertificationEngine  
- SCI and OPS conformance profile ids listed in §2  

---

## 4. Scope

Sprint 021 implements **only**:

**Evidence post-persist Record State OPS orchestration** using already-certified Model C infrastructure.

| In scope | Detail |
|----------|--------|
| OPS method | `ResearchOperations.transitionEvidenceRecordState` |
| OPS-local decode | `evidenceFromEvidenceUnitPayload` |
| Persistence use | Existing `create` + `advanceHead` (+ optional `appendEvent`) — **no new Persistence abstraction** |
| Thin Evidence revision helpers | **Recommended** (Claim parity); see §9 / §27 OQ-021-006 |
| Future additive tests/docs | REF-OPS themes, TEST-021 / smoke-021, IMPLEMENTATION.md notes — at EXEC only |
| Preserve | Sprint 019 pre-persist `registerEvidenceUnit(..., { transition })` |

---

## 5. Non-Scope

Sprint 021 does **not** implement:

- New Evidence Record State vocabulary or illegal Core transitions  
- Generic `ScientificUnitTransitionService` / merged Standing+Record State machine  
- Grade / Contradiction / Negative Result / Verification OPS  
- Material Evidence content OPS (`EvidenceVersionService`)  
- Literature, DocumentArtifact, AI/LLM, Knowledge Graph  
- Database, PostgreSQL, Redis, Kafka, OpenSearch, Neo4j  
- Durable workspace, multi-user, distributed concurrency  
- Frontend, REST, GraphQL, microservices  
- Python / Nextflow / Docker / Kubernetes infrastructure  
- Second scientific graph or second event journal  
- Automatic `bears_on` ↔ `supported_by` synchronization  
- Redesign of Core / ENC / SER / Persistence Model C / CONF / CERT engines  
- Stronger predecessor-existence checks at `create` (deferred future Persistence work)  
- Transactions, rollback, delete-on-conflict  

---

## 6. Scientific Authority

| Concern | Owner |
|---------|-------|
| Record State vocabulary | **Scientific Core only** |
| Transition legality / Human gates | **Scientific Core** (`EvidenceTransitionService`) |
| Resulting Evidence aggregate | **Scientific Core** |
| Canonical unit | **ENC** |
| Immutable revision storage, lineage, head, CAS, sole journal | **Persistence** |
| Orchestration, decode projection, optional ops event, session/workspace projection, export wiring | **OPS** |
| Compliance / certification evaluation | **CONF / CERT** (existing engines) |

**Invariant:** There is ONE scientific authority. OPS must **not** contain a duplicate transition table (`if draft…`). OPS **delegates** legality to Core.

---

## 7. Evidence Record State Contract

### 7.1 Closed vocabulary (do not extend)

```
draft | registered | withdrawn
```

### 7.2 Core-authorized edges (repository fact)

| From | To | Notes |
|------|-----|-------|
| (create) | `draft` | Factory / register path |
| `draft` | `registered` | Human Reviewer + non-empty `decision_ref` |
| `draft` | `withdrawn` | Human if `ai_assisted` |
| `registered` | `withdrawn` | Human if `ai_assisted` |
| `withdrawn` | ∅ | Terminal for this `evidence_id` |

Any other edge: **not currently authorized by Core** — surface as Core `EvidenceValidationError` (e.g. `F_TRANSITION`). Do not invent restore / demotion.

### 7.3 Orthogonal (out of Sprint 021)

- `evidence_version` SemVer (preserved by Core Record State transition)  
- Grade assignment / `grade_ref` history  
- Item/collection states  
- Material content updates  

---

## 8. Model C Revision Contract

Frozen exact formulas:

| Item | Normative value |
|------|-----------------|
| Scientific identity | `evidence_id` = `PersistenceEntity.identity` = ENC `envelope.identity` — **stable** |
| Unit kind | `EvidenceUnit` |
| Revision storage key | `persist:CanonicalUnit:EvidenceUnit:{evidence_id}:{revision_id}` |
| Initial revision | `rev:initial` (existing Evidence register) |
| Subsequent `revision_id` | Caller-supplied; matches `^rev:[A-Za-z0-9._~-]{1,128}$`; **≠** `rev:initial` |
| Lineage field | `PersistenceEntity.predecessor_revision_id` |
| Head key | `persist:RevisionHead:EvidenceUnit:{evidence_id}` |
| Head advance | `repository.advanceHead(identity, "EvidenceUnit", from, to)` → CAS via `replace` + `expected_version` |
| Stale head | Persistence `CONFLICT` |
| Old revisions | Immutable — no update-in-place; no content replace of prior revision |
| Trichotomy | `evidence_version` ≠ `revision_id` ≠ head CAS token (`RevisionHead.content_version`) |

No last-write-wins. No silent overwrite of head.

---

## 9. `transitionEvidenceRecordState` Contract

### 9.1 Method

```
ResearchOperations.transitionEvidenceRecordState(input) → result
```

Mirror Claim Standing structure; do **not** rename to Standing vocabulary.

### 9.2 Input (normative — parallel to `TransitionClaimStandingInput`)

| Field | Required | Semantics |
|-------|----------|-----------|
| `identity` | Yes | Scientific `evidence_id` |
| `transition` | Yes | Core `EvidenceRecordTransitionInput` (`to`, `authority_agent`, `reason`, `at`, optional `decision_ref`, optional `items`, optional `bears_on`, **`event_id` required on certified/deterministic paths**) |
| `revision_id` | Yes | New Model C revision id (`rev:…` ≠ `rev:initial`) |
| `expected_head_revision_id` | Yes | Expected current head (= predecessor for lineage + CAS `from`) |
| `append_event` | No | Default `false`; if `true`, append operational journal citation after successful head advance |

Do **not** invent extra parameters beyond repository/SPEC need. Do **not** mint `revision_id`, ERTE `event_id`, or `at` inside OPS.

### 9.3 Output (parallel to `TransitionClaimStandingResult`)

| Field | Meaning |
|-------|---------|
| `evidence` | Core Evidence after `EvidenceTransitionService.transition` |
| `unit` | ENC EvidenceUnit |
| `entity` | Persisted PersistenceEntity for the **new** revision |
| `head_revision_id` | RevisionHead pointer after successful CAS (`head.content_version`) |

### 9.4 Session / workspace

- Must **not** require open ResearchSession or ResearchWorkspace.  
- Must **not** mutate membership.  
- Callers may `registerMember` / `appendResearchEvent` separately (Sprint 019 pattern).

### 9.5 Mandatory vs recommended API surface (closes OQ-021-006 for EXEC)

| Surface | Status for Sprint 021 |
|---------|------------------------|
| `transitionEvidenceRecordState` | **Mandatory** |
| Existing `getEvidenceUnit` / `exportEvidenceUnit` (head-resolved) | **Mandatory** (already present) |
| `getEvidenceUnitRevision` / `exportEvidenceUnitRevision` | **Recommended** (Claim parity) — authorized if needed for REF |
| `getEvidenceHead` / `getEvidenceLineage` | **Recommended** — authorized if needed for REF |
| Pre-persist `registerEvidenceUnit` | **Frozen** — do not remove or redefine |

---

## 10. Evidence Decode Contract

### 10.1 Helper

```
evidenceFromEvidenceUnitPayload(payload: unknown): Evidence
```

OPS-local (new module analogous to `claim-from-unit.ts`). **Not** a Core API. **Not** a second Evidence model.

### 10.2 Purpose

Reconstruct Core-shaped `Evidence` from an intact ENC `EvidenceUnit` Persistence payload so Core can authorize the next Record State.

### 10.3 Field discipline

| Class | Action |
|-------|--------|
| Canonical scientific from `envelope.content` | Reconstruct: `evidence_id`, `evidence_version`, `record_state`, `summary`, `source`, `provenance`, `grade_ref`, `items`, `ethics_constraint_marker`, `created_by`, `created_at`, optional `collection`, `ai_assisted`, `human_sponsor`, `protocol_ref`, `dataset_refs`, `citation_refs` |
| From envelope | `ontology_ref`, `spec_ref`; `bears_on` from references with role `bears_on` |
| ERTE | Map envelope events whose `to_state ∈ EVIDENCE_RECORD_STATES` into `record_transition_log` |
| GAE | Discriminate non–Record-State events; **reconstruct** `grade_assignment_log` when discriminable (**O-021-01** — do not drop reconstructible grade history) |
| Persistence metadata | Exclude from Core object (`storage_key`, `revision_id`, `predecessor_revision_id`, …) |
| OPS metadata | Exclude (membership, timeline labels, ops event payloads) |

Reject non-object / non-`EvidenceUnit` / non-intact payloads with OPS `OpsError` `INVALID_COMMAND_STATE` (Claim decode precedent).

Authoritative scientific content after transition = Core `transition` result → ENC assemble → persisted revision — **not** the decode helper.

---

## 11. Persistence Order

Normative sequence (nothing persisted in steps 1–5):

```
1. Validate revision_id / expected_head_revision_id
   (Persistence grammar; revision_id ≠ rev:initial; revision_id ≠ expected_head)
2. getEvidenceUnit(identity)                         // head-resolved
3. evidenceFromEvidenceUnitPayload(entity.payload)
4. evidenceTransitions.transition(evidence, input.transition)  // Core — may throw
5. encoder.assemble(evidence)                        // ENC — may throw
6. entityFromCanonicalUnit(unit, {
     revision_id: input.revision_id,
     predecessor_revision_id: input.expected_head_revision_id
   })
7. repository.create(entity)                         // may ALREADY_EXISTS
8. repository.advanceHead(
     identity, "EvidenceUnit",
     expected_head_revision_id, revision_id)         // may CONFLICT
9. if append_event === true → appendEvent(...)       // after successful CAS only
10. return { evidence, unit, entity, head_revision_id }
```

Rules:

- Do **not** mutate/overwrite the old revision.  
- Do **not** advance head before the new revision row exists.  
- Do **not** invent rollback / delete-on-conflict.  
- Do **not** silently retry CAS with a different head or regenerate scientific content.

---

## 12. RevisionHead / CAS

| Rule | Statement |
|------|-----------|
| Load current content | Head-resolved `getEvidenceUnit` |
| CAS token | Caller’s `expected_head_revision_id` must match head for successful advance |
| Success | Head points at new `revision_id` |
| Failure | Persistence `CONFLICT`; prior head retained |
| Concurrent A/B from same head | Exactly one successful advance; other CONFLICT |
| Scientific commit | Head advance success = current scientific Evidence for get/export |

Same honesty as Claim Standing (O-021-04): content is loaded from head; lineage/CAS use caller expected head; mismatch → CONFLICT (+ possible orphan).

---

## 13. Lineage

| Rule | Statement |
|------|-----------|
| Field | `PersistenceEntity.predecessor_revision_id` |
| Value on successor | `= expected_head_revision_id` |
| On `rev:initial` | Absent |
| Not | Core relationship, `bears_on`, `supported_by`, membership, or OPS graph |
| Journal citations of lineage | Non-authoritative if they disagree with entity metadata |

Do **not** add predecessor into Scientific Core Evidence fields.

---

## 14. Partial-Write Semantics

Preserve Sprint 020 / SPEC-020 §28 / SPEC-021 §16 honesty:

| Step | On failure |
|------|------------|
| Core / ENC | Stop; nothing persisted |
| `create` | Stop; head unchanged |
| `advanceHead` | **Partial write:** revision row may exist; head remains prior; **not** a silent current scientific commit |
| `appendEvent` after head success | Scientific revision+head may exist without ops event |
| Membership | Unchanged by transition |

**Forbidden:** transactions, rollback, delete-on-conflict, compensating scientific mutation.

Caller may retry `advanceHead` with same `to` if row fingerprint matches, or address orphan via get-by-revision (when helper exists).

---

## 15. Determinism

| Concern | Rule |
|---------|------|
| `revision_id` | Caller-supplied only — no `Math.random` / `randomUUID` / `Date.now` |
| ERTE `event_id` / `at` | Caller-supplied on all certified EXEC/REF paths (**O-021-02**) |
| Head CAS | Explicit `expected_head_revision_id` |
| Export / snapshots | Existing deterministic SER / Persistence snapshot rules |
| Ops event id (when enabled) | Deterministic formula in §17 |

Core `EvidenceEventBuilder` may still `randomUUID` if `event_id` omitted — **EXEC must always supply `event_id`**. Do not change Core builder in Sprint 021.

---

## 16. Error Semantics

Propagate lower-layer errors **unchanged**. Do not wrap Core/Persistence errors into OPS errors.

| Condition | Error |
|-----------|--------|
| Illegal / gated Record State transition | Core `EvidenceValidationError` (`F_TRANSITION`, `F4`, `F5`, `F6`, …) |
| Invalid `revision_id` grammar | Persistence `INVALID_ID` |
| Duplicate revision storage key | Persistence `ALREADY_EXISTS` |
| Stale RevisionHead | Persistence `CONFLICT` |
| Missing Evidence / revision | Persistence `NOT_FOUND` |
| Immutable revision mutate | Persistence `IMMUTABLE_ENTITY` |
| Missing/invalid predecessor on entity build | Persistence `INVALID_STATE` |
| OPS misuse (`revision_id === rev:initial`, id collision with expected head, decode failure) | OPS `OpsError` `INVALID_COMMAND_STATE` |

No parallel OPS taxonomy for conditions already expressed by Core/Persistence.

---

## 17. Operational Event

Optional; default **off** (`append_event !== true`).

After **successful** head advance only:

| Field | Value |
|-------|--------|
| `event_type` | `ops.evidence_record_state_revision` |
| `parent_identity` | `evidence_id` |
| `event_id` | Prefer `ops:{transition.event_id}`; else `ops:evidence_record_state:{identity}:{revision_id}` |
| Payload | `{ revision_id, predecessor_revision_id, unit_kind: "EvidenceUnit", to_record_state }` |

| Rule | Statement |
|------|-----------|
| Authority | Operational citation only — **not** scientific truth |
| Journal | Sole Persistence journal — **no second journal** |
| Failure after head success | Does **not** roll back revision/head |
| Naming | Parallel to `ops.claim_standing_revision` |

---

## 18. Membership

| Rule | Statement |
|------|-----------|
| Transition effect | **None** — does not call `registerMember` / does not alter `member_refs` |
| Membership ≠ | Record State, `bears_on`, `supported_by`, revision lineage |
| Auto sync relationships | **Forbidden** |

---

## 19. Snapshot / Workspace Behavior

| Artifact | Rule |
|----------|------|
| ResearchSnapshot | **FROZEN** schema — no field changes |
| WorkspaceSnapshot | Additive Sprint 018 contract unbroken |
| Reflection of new Record State | Via head-resolved Persistence entities inside `persistence_snapshot` and/or subsequent get/export |
| Session / Workspace durability | Memory-only; **not** authorized to persist |
| New snapshot type | **Forbidden** |

Snapshots remain projections — not scientific authority.

---

## 20. Export

| API | Behavior |
|-----|----------|
| `exportEvidenceUnit(identity)` | SER-JSON of **head-resolved** EvidenceUnit payload (existing) |
| `exportEvidenceUnitRevision(identity, revision_id)` | Additive SER-JSON of specific revision (recommended) |
| Format | Existing JsonEncoder / SER — **no new serialization format** |
| Determinism | No wall-clock / random injection |

Head export after successful transition must reflect new `record_state`. Prior revision export (when available) must remain unchanged.

---

## 21. Regression Contract

Future EXEC **SHALL** keep green:

| Gate | Expectation |
|------|-------------|
| SCI corpus | **44/44** (no SCI fixture rewrite) |
| Prior OPS fixtures | All existing `REF-OPS-*` remain green; new fixtures **additive only** |
| FULL corpus | Prior 90 + additive Sprint 021 fixtures |
| TEST-016…020 | Remain green |
| smoke-015…020 | Remain green |
| typecheck / lint / build | Remain green |

Preserve behaviors:

- Evidence create-once + optional pre-persist transition (019)  
- Evidence initial `rev:initial` + head (020)  
- Evidence get/export/membership patterns  
- ResearchSession / ResearchWorkspace memory-only  
- ResearchSnapshot / WorkspaceSnapshot contracts  
- Model C keys, lineage, RevisionHead, CAS, immutability  
- Claim Standing post-persist path  

No certified behavior may be weakened to ship Sprint 021.

---

## 22. Required Future Reference Tests

Do **not** create fixtures in this decision phase.

### 22.1 Numbering (closes packaging portion of OQ-021-004)

Repository verified: highest id = `REF-OPS-046`.  

**Next available additive range starts at `REF-OPS-047`.** Exact titles/assignment at EXEC; themes below are mandatory coverage.

### 22.2 Required behavioral coverage

1. Existing registered Evidence usable as transition source  
2. `draft` → `registered` (new revision + head + Human/`decision_ref` gates)  
3. `registered` → `withdrawn` (terminal Record State)  
4. Invalid transition → Core error; head unchanged  
5. Stale RevisionHead → `CONFLICT`  
6. Duplicate `revision_id` → `ALREADY_EXISTS`  
7. `predecessor_revision_id` lineage correctness  
8. RevisionHead points at new revision after success  
9. Old revision immutability  
10. Snapshot contains prior+new revisions + RevisionHead  
11. Workspace projection remains coherent (membership unchanged; head content updated)  
12. Export head reflects new `record_state`; prior revision differs when exported  
13. Deterministic double-run with caller-supplied ids  
14. Optional operational event citation when enabled  
15. Sprint 019 Evidence regression (register + optional pre-persist transition)  
16. Sprint 020 Model C / Claim Standing regression  

Unit/script coverage (TEST-021 / smoke-021) should mirror Claim Standing TEST-020 themes where applicable, including partial-write honesty.

---

## 23. Conformance / Certification Impact

| Item | Rule |
|------|------|
| SCI profile | `CONF-001@1.0.0` — unchanged |
| OPS profile | Prefer additive under **`CONF-001@1.1.0-OPS`** (closes OQ-021-005 for Sprint 021) |
| Engines | Single ConformanceEngine · single CertificationEngine |
| Path | REF → ReferenceReport → ConformanceEngine → ConformanceReport → CertificationEngine → CertificationReport |
| Fabrication | **Forbidden** — live corpora only |
| New CONF-002 / second engines | **Forbidden** |

Profile bump only if EXEC measurement proves existing OPS profile cannot accept additive fixtures (not expected; family prefix `REF-OPS-` already required).

---

## 24. Allowed Implementation Surfaces

EXEC-021 **may** modify only what is required for the approved slice. Likely surfaces (exact files discovered at EXEC):

| Surface | Examples |
|---------|----------|
| OPS Research Operations | `apps/reference-app/src/operations/research-operations.ts` (+ exports in `index.ts`) |
| OPS Evidence decode helper | New module e.g. `apps/reference-app/src/operations/evidence-from-unit.ts` |
| Reference fixtures | Additive entries in `packages/reference-tests/src/fixtures/ops.ts` (and corpus wiring if required) |
| Sprint 021 tests / smoke | New TEST-021 / smoke-021 scripts only |
| Documentation | `IMPLEMENTATION.md`, EXEC reports, README notes as needed |
| Certification artifacts | Generated only during a later formal certification step |

Do **not** pre-authorize unrelated files.

---

## 25. Forbidden Implementation Surfaces

Sprint 021 **MUST NOT** modify:

- Scientific Core semantics / transition table (unless a missing Core primitive is proven required — then **STOP**)  
- Persistence architecture beyond **using** certified Model C APIs  
- ENC / SER / Conformance / Certification **architectures**  
- ResearchSnapshot / WorkspaceSnapshot contracts  
- Scientific relationship graph semantics  
- Event journal architecture (append only via existing API)  
- Database adapters, PostgreSQL, Redis, Kafka, OpenSearch, Neo4j  
- Python, Nextflow, Docker/Kubernetes infra  
- Frontend, REST, GraphQL  
- AI / LLM / literature / DocumentArtifact  
- Durable Workspace / multi-user / distributed concurrency systems  

---

## 26. Stop Conditions

Future EXEC-021 agent **MUST STOP** and report a blocker (no improvisation) if it encounters:

- Missing Core transition semantics for a claimed SPEC edge  
- Missing Evidence canonical fields required for decode/transition  
- Missing Persistence Model C primitive  
- Ambiguous RevisionHead / concurrency behavior contradicting certified contracts  
- Need for a new scientific authority, second graph, second journal, or new Record State  
- Need to modify certified Sprint 019/020 behavior  
- Need for a new database or unapproved dependency  
- Inability to preserve deterministic identity/export behavior  
- Unclear migration requirements beyond dual-read already certified  
- Requirements not covered by SPEC-021 + this decision  

---

## 27. Open Questions / Deferred Items

### Closed for implementation (this decision)

| ID | Implementation rule |
|----|---------------------|
| OQ-021-001 | Use OPS-local `evidenceFromEvidenceUnitPayload` per §10 |
| OQ-021-002 | Record State post-persist only per §4–§5 |
| OQ-021-003 | API name `transitionEvidenceRecordState` per §9 |
| OQ-021-004 (numbering) | Start additive fixtures at **`REF-OPS-047`**; assign exact titles at EXEC |
| OQ-021-005 | Prefer **`CONF-001@1.1.0-OPS`** additive fixtures — no profile bump planned |
| OQ-021-006 | Mandatory = transition + existing head get/export; revision/head/lineage helpers **recommended/authorized** |
| OQ-021-007 | Allow Core `items` / `bears_on` passthrough on `transition`; REF **may omit** overrides |

### Deferred — non-blocking for Sprint 021 implementation

| Item | Status |
|------|--------|
| Exact REF-OPS titles / final count within 047+ range | Deferred to EXEC packaging |
| Whether recommended Evidence head/lineage/revision-export helpers are all implemented in first EXEC pass | Deferred EXEC choice — transition remains mandatory minimum |
| Stronger predecessor row existence check at Persistence `create` | Deferred future Persistence work (O-021-03 / CODE-AUDIT-020 O-020-01) |
| Editorial SPEC tighten of GAE `MAY` → `SHALL` wording | Deferred optional docs; EXEC follows O-021-01 reconstruct rule |
| Core ERTE builder `randomUUID` fallback | Deferred Core change — EXEC supplies `event_id` always |

### Architecture audit observations — EXEC discipline (not new architecture)

| ID | Preserve |
|----|----------|
| O-021-01 | ERTE vs GAE decode discrimination; reconstruct discriminable GAE |
| O-021-02 | Caller-supplied ERTE ids on certified paths |
| O-021-03 | Honest partial-write orphans; no invented transactions |
| O-021-04 | Head-load + expected-head CAS pattern (Claim Standing isomorphic) |
| O-021-05 | Recommended helpers optional for REF parity |
| O-021-06 | Fixture themes fixed; numbering at EXEC |

**Required patches from this decision: 0**  
**Blockers: 0**

---

## 28. Final Implementation Authorization

| Statement | Value |
|-----------|--------|
| Implementation Decision | **COMPLETE** |
| Sprint 021 readiness | **IMPLEMENTATION-READY** |
| Gate remaining | **Final Architecture Re-Audit** |
| Runtime implementation authorized by this document? | **NO** |
| Tests / fixtures / certification authorized? | **NO** |
| Commit / push authorized? | **NO** |

Process sequence (unchanged):

```
SPEC-021
  → Architecture Audit (APPROVED WITH OBSERVATIONS)
  → Implementation Decision (this document)
  → Final Architecture Re-Audit
  → EXEC-021 (only if separately authorized)
```

**Implementation Decision complete. Sprint 021 is implementation-ready, subject to successful Final Architecture Re-Audit. No runtime implementation is authorized by this document.**

---

## Document Control

| Version | Status | Notes |
|---------|--------|-------|
| 0.1.0 | IMPLEMENTATION-READY — PENDING FINAL ARCHITECTURE RE-AUDIT | Initial decision from SPEC-021 + ARCHITECTURE-AUDIT-021 |

*End IMPLEMENTATION-DECISION-021.*

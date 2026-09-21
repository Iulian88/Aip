# DISCOVERY-021 — Evidence Post-Persist Record State

**Mode:** Read-only architectural discovery (+ conservative README alignment only)  
**Baseline:** Sprint 020 FORMALLY CERTIFIED AND CLOSED · `6c0106c3e27685f549bc7c2b882a0365c6b511d6`  
**Authorization:** Discovery only — **not** SPEC-021 · **not** ADR · **not** implementation  

---

## 1. Baseline

| Item | Value |
|------|--------|
| HEAD / origin/main | `6c0106c3e27685f549bc7c2b882a0365c6b511d6` |
| Sprint 019 | Evidence Operations — CLOSED (initial register + optional **pre-persist** transition) |
| Sprint 020 | Model C + Claim Standing post-persist — CLOSED |
| SCI / OPS / FULL | 44/44 · 46/46 · 90/90 |
| ROADMAP-REVIEW-001 next frontier | Research Semantics Completion → Evidence post-persist Record State OPS |

**Prerequisite status:** Model C revision infrastructure exists and is certified. Claim Standing post-persist is the proven OPS pattern. Evidence Core Record State machine already exists. What is missing is **OPS post-persist orchestration** for Evidence Record State (create-once persist currently freezes the first revision only).

---

## 2. Current Evidence Architecture

### 2.1 Scientific Core (`@sciros/core`)

| Element | Actual repository fact |
|---------|------------------------|
| Aggregate | `Evidence` with stable `evidence_id` |
| Scientific version | `evidence_version` (SemVer) |
| Record State | `record_state ∈ {draft, registered, withdrawn}` (`EVIDENCE_RECORD_STATES`) |
| Transition log | `record_transition_log` (ERTE — Evidence Record Transition Events) |
| Transition service | `EvidenceTransitionService.transition` |
| Allowed transitions | `draft → registered\|withdrawn`; `registered → withdrawn`; `withdrawn` terminal |
| Human gates | Registration requires Human Reviewer + `decision_ref`; AI cannot register |
| Material updates | `EvidenceVersionService.applyMaterialUpdate` (separate from Record State) |
| Relationships | `bears_on` (Claim ids) — identifiers only |
| Grade | `grade_ref` + optional `grade_assignment_log` (SCI-003; does not change Record State) |
| Forbidden conflation | Claim Standing / Workflow values must not appear as Record State (`FORBIDDEN_EVIDENCE_RECORD_STATES`, ADR-0006) |

Primary authorities: **SCI-002**, **SCI-000 Evidence Allowed States**, **ADR-0006**.

### 2.2 Encoding (`@sciros/encoding`)

- `CanonicalEncodingBuilder.buildEvidence` projects `record_state`, ERTE as envelope events, `bears_on` as references.
- Unit kind: `EvidenceUnit`.
- `content_version` ← `evidence_version`.

### 2.3 Persistence (post-020 Model C)

- `registerEvidenceUnit` → `entityFromCanonicalUnit(..., { revision_id: rev:initial })` → `create` → `ensureInitialHead(evidence_id, "EvidenceUnit")`.
- Storage key: `persist:CanonicalUnit:EvidenceUnit:{evidence_id}:{revision_id}`.
- Head: `persist:RevisionHead:EvidenceUnit:{evidence_id}`.
- `getEvidenceUnit` uses head-resolved `get` (Model C).
- **No** post-persist Evidence revision create path in OPS today.

### 2.4 Research Operations (Sprint 019 + 020)

| Capability | Status |
|------------|--------|
| `registerEvidenceUnit` | Implemented (draft create; optional **pre-persist** `transition`) |
| `getEvidenceUnit` | Head-resolved |
| `exportEvidenceUnit` | SER-JSON of current (head) payload |
| Membership | Caller `registerMember` with `unit_kind: EvidenceUnit` |
| Timeline / events | Caller `appendResearchEvent` on scientific identity |
| Post-persist Record State OPS | **Absent** (explicit Sprint 020 non-goal) |
| Evidence reconstruct-from-unit helper | **Absent** (Claim has `claimFromClaimUnitPayload`; Evidence has no analogue) |

### 2.5 Snapshots / export

- `ResearchSnapshot` / `WorkspaceSnapshot`: frozen schemas; Evidence appears only via `member_refs` + Persistence snapshot entities (includes revision rows + heads after 020).
- Export: payload-only SER-JSON; does not inject OPS metadata.

### 2.6 Spec alignment

| Source | Statement |
|--------|-----------|
| SPEC-019 §31 | Post-persist Evidence evolution deferred to FUTURE SPEC |
| SPEC-020 §29 / Evidence boundary | Evidence post-persist Record State OPS out of Sprint 020 |
| IMPLEMENTATION.md | Evidence initial revision only |

---

## 3. Problem Definition

### What “Evidence Record State” means (repository-authoritative)

**Record State is scientific semantic state** of an Evidence aggregate under SCI-002 / SCI-000.

It is **not**:

| Interpretation | Verdict |
|----------------|---------|
| A. Scientific semantic state | **Yes — authoritative** (`draft` / `registered` / `withdrawn`) |
| B. Operational / workflow state | **No** (ADR-0006 forbids Workflow as Record State) |
| C. Persistence metadata | **No** (Persistence stores CanonicalUnit revisions; does not own Record State vocabulary) |
| D. Combination requiring new hybrid | **No** — Record State stays in Core content; Persistence only versions the unit |

### Problem to solve (post-persist)

Today:

1. Evidence may be transitioned **in memory before first persist** (`registerEvidenceUnit` + `options.transition`).  
2. After Persistence.create of `rev:initial`, changing Record State would require mutating an immutable CanonicalUnit revision — **forbidden**.  
3. Model C now allows a **new immutable revision** + head CAS — used for Claim Standing, **not yet** for Evidence Record State.

**Discovery problem statement:** Define the OPS orchestration contract that applies an already-existing Core `EvidenceTransitionService` transition to a **persisted** Evidence identity by creating a Model C successor revision and advancing `RevisionHead`, without creating a second scientific authority or second journal.

---

## 4. Authority Analysis

| Concern | Owner | Rationale |
|---------|-------|-----------|
| State vocabulary | **Scientific Core** (SCI-000/SCI-002) | Already closed enum |
| Transition rules / legality | **Scientific Core** (`EvidenceTransitionService`) | Already implemented |
| Transition authorization (Human Reviewer) | **Scientific Core** | Already implemented |
| Canonical projection | **ENC** | `buildEvidence` already includes `record_state` + ERTE |
| Persistence of resulting revision | **Persistence Model C** | Same as Claim Standing |
| Head advancement | **Persistence** (`advanceHead` CAS) | Same as Claim Standing |
| Orchestration sequence | **OPS** | Mirror `transitionClaimStanding` |
| Operational journal citation | **Persistence journal** via OPS `appendEvent` (optional, non-authoritative) | Entity metadata wins |
| Snapshot/export projection | **OPS views / SER** | Non-authoritative |

**Preserved model:** Core = science · ENC = integrity · Persistence = storage/revision · OPS = orchestration · SER = bytes.

---

## 5. State Vocabulary

**Authoritative vocabulary already defined** — not missing.

| Layer | Vocabulary |
|-------|------------|
| Evidence Record State | `draft`, `registered`, `withdrawn` |
| Item state | `active`, `withdrawn` |
| Collection state | `open`, `closed`, `withdrawn` |
| Source state | `declared`, `unresolved` |
| Forbidden as Record State | Standing values, Workflow values, `archived`, `proof`, `certainty`, etc. |

Do **not** invent new Record States for SPEC-021. SPEC-021 should **import** SCI-002 / Core enums.

---

## 6. Model C Compatibility

### Recommended placement of Record State

| Option | Consequence | Verdict |
|--------|-------------|---------|
| **Part of Evidence canonical content** | Each revision’s ENC payload carries `record_state` + ERTE log; scientific identity stable | **Correct** (matches Core + ENC today) |
| Separate CanonicalUnit for state | Second scientific object / graph risk | Reject |
| Persistence metadata only | Moves science into Persistence | Reject |
| OPS projection only | OPS becomes scientific authority | Reject |

### Conceptual Model C shape

```text
evidence_id (stable scientific identity)
    ├── rev:initial     (immutable EvidenceUnit; some record_state)
    ├── rev:…           (immutable successor; new record_state; predecessor_revision_id)
    └── RevisionHead    (points at current revision_id; not scientific truth)
```

**Note:** `evidence_version` (SemVer) remains Core scientific versioning and is **orthogonal** to `revision_id` (Persistence). Core Record State transitions currently **preserve** `evidence_version` (observed in `EvidenceTransitionService`). SPEC-021 must not collapse SemVer into revision identity (trichotomy from SPEC-020).

---

## 7. Post-Persist Transition Analysis

### Consistency with Sprint 020

Isomorphic to Claim Standing:

```text
headed EvidenceUnit
  → decode Evidence from payload
  → EvidenceTransitionService.transition (Core)
  → ENC assemble
  → Persistence.create (revision_id caller-supplied; predecessor = expected_head)
  → advanceHead CAS
  → optional appendEvent
```

### Required invariants (for future SPEC)

| Area | Invariant |
|------|-----------|
| Identity | `evidence_id` unchanged across revisions |
| Revision | Caller-supplied `rev:…` ≠ `rev:initial` for successors; duplicate → `ALREADY_EXISTS` |
| Lineage | `predecessor_revision_id = expected_head_revision_id` |
| Head | CAS `from → to`; stale → `CONFLICT` |
| Immutability | Prior revision rows never rewritten |
| Science | Only Core may change `record_state` |
| Determinism | Caller `revision_id` + ERTE `event_id` + `at` |
| Snapshots | Persistence snapshot includes all revisions + head; ResearchSnapshot schema frozen |
| Export | Head export = current; optional revision export additive |

### Pre-persist vs post-persist

Both paths remain valid:

| Path | When |
|------|------|
| Pre-persist (Sprint 019) | Transition before first `create` → single `rev:initial` already at `registered`/`withdrawn` |
| Post-persist (candidate 021) | Transition after `rev:initial` exists → new revision |

SPEC-021 must not break the pre-persist path.

---

## 8. Evidence Semantic Boundaries

Must remain distinct:

| Concept | Meaning | Must not become |
|---------|---------|-----------------|
| Membership | OPS session/workspace index | Scientific relationship |
| `bears_on` | Evidence→Claim ids | Standing / membership |
| `supported_by` | Claim→Evidence ids | Auto-synced with `bears_on` |
| Record State | Evidence epistemic record posture | Workflow / Standing |
| Revision history | Persistence representation lineage | Scientific supersession graph |

**No automatic relationship synchronization** in an Evidence Record State slice.

---

## 9. Provenance Boundaries

| Information | Owner |
|-------------|-------|
| Evidence.provenance (completeness, custody, obtained_at, …) | **Core scientific content** |
| ERTE (`record_transition_log`) | **Core scientific event log** (inside aggregate / ENC events) |
| Persistence event journal OPS citations | **Operational audit** (non-authoritative vs entity metadata) |
| `predecessor_revision_id` / RevisionHead | **Persistence representation lineage / coordination** |
| Source locator / source_state | **Core Evidence.source** |

Record State transitions update Core ERTE + `record_state`; they do **not** redefine provenance completeness by themselves.

---

## 10. Snapshot Impact

| Artifact | Impact of post-persist Evidence revisions |
|----------|-------------------------------------------|
| ResearchSnapshot schema | **No field change required** (frozen Sprint 016) |
| WorkspaceSnapshot schema | **No field change required** |
| Persistence snapshot body | Will contain additional EvidenceUnit revision rows + updated RevisionHead (already authorized Model C behavior) |
| Membership | Still scientific identity + `unit_kind`; “current” via head |
| Timeline | Only if OPS appends operational events |

If SPEC-021 needs head/revision helpers in views, they must be **additive** and must not alter ResearchSnapshot keys.

---

## 11. Serialization Impact

| Component | Expected impact |
|-----------|-----------------|
| CanonicalEncoder | No new encoder; assemble post-transition Evidence as today |
| JsonEncoder | Encode head or specific revision payload |
| Identity | Unchanged (`evidence_id`) |
| `content_version` | Remains `evidence_version` from Core |
| Determinism | Same SER rules; caller-fixed ERTE ids required for double-run |

No ENC/SER redesign required for a Record-State-only OPS slice.

---

## 12. Error Semantics

Areas SPEC-021 must specify (reuse existing typed errors where possible; do not invent codes here):

| Condition | Likely layer |
|-----------|--------------|
| Illegal Record State transition | Core `EvidenceValidationError` `F_TRANSITION` |
| Missing Human / decision_ref on register | Core `F5` / `F4` |
| Invalid / duplicate `revision_id` | Persistence `INVALID_ID` / `ALREADY_EXISTS` |
| Stale head | Persistence `CONFLICT` |
| Missing revision / identity | Persistence `NOT_FOUND` |
| Immutable revision mutate | Persistence `IMMUTABLE_ENTITY` |
| Missing predecessor field / self-predecessor | Persistence `INVALID_STATE` (entity builder) |
| Decode failure from payload | OPS typed error (future helper) |

Lower-layer errors must propagate unchanged (Sprint 016–020 rule).

---

## 13. Determinism

| Identifier | Rule for future Evidence post-persist |
|------------|----------------------------------------|
| `revision_id` | Caller-supplied `rev:…` (never generated) |
| ERTE `event_id` | Caller-supplied (Core `EvidenceEventBuilder` may `randomUUID` if omitted — same observation as Claim STE) |
| `at` | Caller-supplied |
| Head CAS | Explicit `expected_head_revision_id` / `from`→`to` |
| Forbidden | `Date.now` / `Math.random` / implicit counters for revision/head identity |

Caller-supplied identifiers are **sufficient** for deterministic Evidence post-persist paths (proven by Sprint 020 Claim Standing tests/fixtures).

---

## 14. Concurrency

Two researchers on same Evidence head `R1`:

| Actor | Action | Expected Model C behavior |
|-------|--------|---------------------------|
| A | create R2 + advanceHead(R1→R2) | Success; head = R2 |
| B | create R3 with expected R1 + advanceHead(R1→R3) | `create` may succeed; **advanceHead CONFLICT**; head remains R2 |

Orphan R3 addressable by revision id; not silent current scientific commit. Same as Sprint 020 Claim Standing / SPEC-020 §28. No new transaction model required for discovery.

---

## 15. Partial Write

Existing Model C partial-write (revision created, head not advanced) is **sufficient** for Evidence Record State if SPEC-021 adopts the same ordered failure table:

1. Core fail → nothing persisted  
2. ENC fail → nothing persisted  
3. create fail → head unchanged  
4. advanceHead fail → orphan revision; head prior  
5. appendEvent fail → revision+head without ops event  

No Persistence transaction redesign indicated for this slice.

---

## 16. Regression Boundary

Sprint 021 (if authorized later) **must preserve**:

| Area | Evidence |
|------|----------|
| Evidence initial registration (draft / optional pre-persist) | Sprint 019 + REF-OPS-022…036 |
| Membership / bears_on independence / no supported_by sync | SPEC-019 / TEST-019 |
| ResearchSnapshot / WorkspaceSnapshot schemas | Sprint 016/018 frozen/additive contracts |
| Model C revision/head/CAS/dual-read | Sprint 020 |
| Claim Standing post-persist | Sprint 020 |
| SCI 44/44 | Unchanged SCI fixtures |
| Prior OPS 46 fixtures | Remain green; Evidence Record State fixtures additive |

---

## 17. Scope Boundary

### IN (candidate SPEC-021 slice)

- OPS post-persist Evidence **Record State** transition on Model C  
- Evidence reconstruct-from-ClaimUnit-analogue helper (OPS-local)  
- get/export head + get/export specific revision (thin wrappers if needed)  
- Additive REF-OPS / tests  

### OUT (unless separately justified)

- Grade OPS  
- Contradiction / NR / Verification OPS  
- Evidence **material content** update OPS (`EvidenceVersionService` path)  
- Literature / DocumentArtifact / AI / KG  
- Database / API / frontend / durable workspace / distributed infra  
- Automatic relationship synchronization  
- Second journal / second scientific graph  
- Core/ENC/SER/Persistence redesign  

---

## 18. Open Questions

### OQ-021-001 — Evidence decode-from-CanonicalUnit contract

**Why:** Claim Standing required `claimFromClaimUnitPayload`; Evidence has no equivalent. Post-persist OPS needs faithful reconstruction of `record_state`, ERTE, items, bears_on, provenance.  
**Depends:** OPS transition method design.  
**Blocks SPEC-021?** **Must resolve in SPEC** (can specify required reconstructible fields; implementation detail of helper can follow SPEC).  
**Defer?** No for SPEC scope; helper implementation is EXEC.

### OQ-021-002 — Slice exclusivity: Record State only vs material/Grade

**Why:** SPEC-020 lists Evidence post-persist Record State, material bumps, and Grade as related but distinct.  
**Depends:** SPEC scope, test plan, Grade sequencing.  
**Blocks SPEC-021?** **Must resolve** — recommend Record State **only** for first SPEC.  
**Defer:** Material update OPS and Grade OPS to later SPECs.

### OQ-021-003 — OPS method surface naming and inputs

**Why:** Need stable public OPS API analogous to `transitionClaimStanding` (identity, transition input, revision_id, expected_head, optional append_event).  
**Depends:** Reference tests / IMPLEMENTATION docs.  
**Blocks SPEC-021?** Must specify in SPEC; naming is SPEC decision, not research blocker.  
**Defer:** Exact event_type string literals can be EXEC detail if SPEC constrains non-proof language.

### OQ-021-004 — Interaction of dual paths (pre-persist register vs post-persist register)

**Why:** Both can yield `registered` Evidence; tests must define expectations for each.  
**Depends:** REF fixtures, docs.  
**Blocks SPEC-021?** Should be documented in SPEC; not an architectural unknown.  
**Defer:** UX policy for which path researchers prefer.

### OQ-021-005 — CONF profile fixture-prefix bump

**Why:** Additive REF-OPS may or may not require profile text changes (OQ-019-004 pattern).  
**Depends:** Certification packaging.  
**Blocks SPEC-021?** Only if prefix list cannot accept new fixtures — verify at SPEC/EXEC; historically additive OPS fixtures under `CONF-001@1.1.0-OPS` worked through 020.  
**Defer:** Until fixture themes are enumerated in SPEC.

### OQ-021-006 — Whether withdrawn Evidence may receive non-Record-State revisions later

**Why:** Record State machine is terminal at `withdrawn`; material/Grade paths are out of slice but may confuse readers.  
**Depends:** Later SPECs.  
**Blocks SPEC-021?** No if slice is Record-State-only (no further Record State transitions from withdrawn).  
**Defer:** Material-after-withdrawn policy.

---

## 19. Required Resolution Before SPEC-021

### MUST RESOLVE BEFORE SPEC

1. Confirm problem = OPS post-persist application of **existing** Core Record State machine under Model C (this discovery: **yes**).  
2. Fix slice boundary: **Record State only** (recommended).  
3. Specify authority split (Core/ENC/Persistence/OPS) matching §4.  
4. Specify Model C placement: Record State in Evidence canonical content; revision/head rules isomorphic to Claim Standing.  
5. Require caller-supplied `revision_id` + ERTE `event_id` + `at` for determinism.  
6. Specify reconstructible Evidence fields from EvidenceUnit payload (OQ-021-001).  
7. Explicit non-goals (Grade/material/DB/AI/…).  
8. Regression preservation list (§16).  
9. Partial-write / CAS semantics by reference to SPEC-020 §28 (no new transaction model).

### CAN BE DEFERRED

- Material content update OPS  
- Grade OPS  
- Exact operational `event_type` strings (within non-proof constraint)  
- Optional `exportEvidenceUnitRevision` / lineage helpers (nice-to-have symmetry)  
- CONF profile bump (only if forced)  
- CODE-AUDIT-020 observation patches  

---

## 20. Conceptual Future Flow

Justified by Claim Standing + Core Evidence transitions + Model C:

```text
Evidence current head revision (Persistence)
        ↓
OPS loads / reconstructs Core Evidence
        ↓
EvidenceTransitionService.transition (Scientific Core)
        ↓
CanonicalEncoder.assemble (ENC)
        ↓
Persistence.create new EvidenceUnit revision
  (revision_id caller-supplied;
   predecessor_revision_id = expected_head_revision_id)
        ↓
RevisionHead.advanceHead CAS (replace + expected_version)
        ↓
optional Persistence.appendEvent (operational citation)
        ↓
get/export/snapshot see head-resolved current Record State
```

Prior revision remains immutable. Head failure after create = orphan revision, not silent current commit.

**This is not implementation authorization.**

---

## 21. Final Discovery Verdict

# READY FOR SPEC-021

**Rationale:**

- Record State vocabulary and transition rules are **already defined and implemented** in Scientific Core.  
- Model C revision/head/CAS infrastructure is **certified** and proven via Claim Standing.  
- Sprint 019/020 explicitly deferred only the **OPS post-persist** wiring — not the science.  
- Remaining issues are SPEC-scoping and reconstruct/API detail (OQ-021-001…003), not architectural unknowns that block drafting.

**Next allowed step (separate authorization):** draft SPEC-021 only.  
**Still forbidden now:** EXEC, Core/Persistence/ENC/SER changes, ADR/IMPLEMENTATION-DECISION unless separately authorized, commit/push of this discovery work until documentation review completes.

---

### Appendix A — README alignment (Part A)

| Check | Result |
|-------|--------|
| README was stale? | **Yes** (claimed pre-implementation / no scientific code) |
| README updated? | **Yes** — conservative status + layout alignment through Sprint 020 |
| Source/tests/Core/Persistence/ENC/SER/CONF/CERT modified? | **No** |

### Appendix B — Key sources inspected

- `packages/core/src/evidence/{types,transition-service,factory,validator,version-service,event-builder}.ts`  
- `apps/reference-app/src/operations/research-operations.ts`  
- `apps/reference-app/src/views/timeline.ts`  
- `packages/encoding/src/builder.ts` (`buildEvidence`)  
- `packages/persistence` Model C revision/head APIs  
- `specs/scientific/SCI-002_evidence_object.md`  
- `specs/architecture/{SPEC-019,SPEC-020,ADR-0006}.md`  
- `IMPLEMENTATION.md`, `audits/roadmap/ROADMAP-REVIEW-001.md`, certification baseline  

*End DISCOVERY-021.*

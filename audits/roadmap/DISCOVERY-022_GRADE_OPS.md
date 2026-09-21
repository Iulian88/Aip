# DISCOVERY-022
## Grade OPS — Post-Sprint-021 Discovery

**Classification legend:** BLOCKER | REQUIRED FOR SPEC | OBSERVATION | DEFERRED | NOT APPLICABLE

**Authority pins inspected:** SCI-003@0.1.0 / EG-0.1 · SCI-002 (Evidence `grade_ref` slot) · ADR-0006 · SPEC-020/021 Model C · ROADMAP-REVIEW-002

---

### 1. Executive Summary

**FACT:** Evidence Grade is a Core-owned warrant-strength label scheme (EG-0.1) stored on Evidence via `grade_ref`, not a standalone scientific aggregate with its own identity or lifecycle state machine.

**FACT:** Core already implements assignment (`EvidenceGradeService.assign`), eligibility, Human Reviewer gates, GAE logging, SemVer patch bump of `evidence_version`, ENC `GradeDesignationUnit`, Processor `evidence.grade_assignment`, and SCI fixtures `REF-GRADE-001`…`003`.

**FACT:** Research Operations has **no** Grade API. Post-persist Grade assignment cannot be committed under Model C without a new immutable Evidence revision — the same architectural gap Claim Standing and Evidence Record State closed in Sprints 020–021.

**ARCHITECTURAL INTERPRETATION:** Grade OPS is justified as **OPS orchestration of Core grade assignment onto a headed EvidenceUnit**, not as invention of Grade “Standing” / “Record State” vocabulary.

**DEPENDENCY:** Model C Persistence primitives already accept `GradeDesignationUnit` as a CanonicalUnit kind and already manage EvidenceUnit RevisionHead. No Persistence redesign is required for an EvidenceUnit-headed path.

**OPEN QUESTION (for SPEC, not a blocker):** Whether OPS must also persist and CAS-advance a separate `GradeDesignationUnit` RevisionHead, or treat `GradeDesignationUnit` as an optional ENC projection while EvidenceUnit remains the authoritative graded revision.

**Verdict:** **READY FOR SPEC-022**. Implementation authorization remains **NO**.

---

### 2. Verified Git Baseline

| Check | Result |
|-------|--------|
| HEAD | `d2eedef23a4193c40d3a3b4d2a73cf81c65795c7` |
| origin/main | `d2eedef23a4193c40d3a3b4d2a73cf81c65795c7` |
| Branch | `main` tracking `origin/main` |
| HEAD == origin/main | YES |
| Certified commit message | `cert(sprint-021): certify Evidence Record State OPS` |
| Working tree at discovery start | Clean certified tree + untracked `audits/roadmap/ROADMAP-REVIEW-002.md` (prior review artifact; not modified by this discovery) |
| Source / tests / fixtures / cert artifacts | Unchanged by this discovery |

**OBSERVATION:** Untracked roadmap review file is documentation-only contamination relative to a perfectly clean tree. It is **not** an architecture STOP condition and was not patched.

---

### 3. Grade Core State

| Concern | Status | Evidence |
|---------|--------|----------|
| Spec | CERTIFIED / IMPLEMENTED | `specs/scientific/SCI-003_evidence_grade.md` (EG-0.1) |
| Types / labels / ranks | COMPLETE | `packages/core/src/grade/types.ts` |
| Value object | COMPLETE | `EvidenceGrade` |
| Identifiers / `grade_ref` encoding | COMPLETE | `identifiers.ts` (`GRADE_REF`, `encodeGradeRef`, …) |
| Eligibility | COMPLETE | `EvidenceGradeEligibilityEvaluator` |
| Assignment service | COMPLETE | `EvidenceGradeService.assign` |
| Authority / Human gate | COMPLETE | `EvidenceGradeValidator` AR-1…AR-5 |
| Migration from `deferred_sci003` | COMPLETE | `EvidenceGradeMigrationSupport` |
| Material change | COMPLETE | `isGradeMaterialChange`; bumps Evidence SemVer |
| ENC unit | COMPLETE | `GradeDesignationUnit` via `buildGradeDesignation` |
| SER | COMPLETE | `GradeDesignationUnit` in SER-JSON profile/registry |
| Processor | COMPLETE | S11/S12/S13 `evidence.grade_assignment` |
| SCI reference fixtures | COMPLETE | `REF-GRADE-001`…`003` (3 fixtures) |
| OPS surface | NOT IMPLEMENTED | No Grade methods in `ResearchOperations` |
| OPS reference fixtures | NOT IMPLEMENTED | Zero Grade refs in `fixtures/ops.ts` |

**FACT:** There is **no** `GradeFactory`, **no** `grade_id`, and **no** Grade-owned root aggregate. Storage ownership of the grade slot is SCI-002 Evidence.

---

### 4. Grade Scientific Semantics

**OQ-022-001 — Authoritative Core meaning**

Per SCI-000 / SCI-003:

> Evidence Grade — A controlled ordinal or categorical label expressing the warrant strength class of Evidence relative to a published grading scheme—not a probability of truth.

Under EG-0.1, a Grade is exactly one closed-set label with fixed ordinal rank, assigned to Evidence via `grade_ref`.

**Closed labels (rank):**

| Label | Rank |
|-------|------|
| `model_output_only` | 1 |
| `literature_secondary` | 2 |
| `curated_database_snapshot` | 3 |
| `registered_primary_data` | 4 |

**Authority ownership:**

| Question | Owner |
|----------|-------|
| What Grade means | Scientific Core (SCI-003) |
| Valid Grade values | Core (`GRADE_LABELS` / §9 `grade_ref`) |
| Valid assignment / raise / lower rules | Core (eligibility + AR-*) |
| Whether Grade can be replaced | Core (reassignment iff material + eligible + authority) |
| Coexistence of multiple Grades on one Evidence | Core: **one** current `grade_ref`; history in `grade_assignment_log` |
| Grade ↔ Claim | Core IR-1: Grade **SHALL NOT** alone set Claim Standing |
| Grade ↔ Evidence | Core: Grade is a field of Evidence |
| Temporal / revision semantics of Grade itself | Core: **no Grade state machine**; Evidence SemVer material change on `grade_ref` change (AR-6) |

**OPS MUST NOT** redefine labels, ranks, eligibility, Human gates, or IR-1…IR-6.

**Classification:** REQUIRED FOR SPEC — SPEC-022 must cite Core as sole Grade authority and forbid OPS Grade vocabulary invention.

---

### 5. Grade Data Model

**What currently exists (not a redesign):**

### 5.1 Value / encoding

| Field / concept | Required | Notes |
|-----------------|----------|-------|
| `label` | yes (on `EvidenceGrade`) | One of `GRADE_LABELS` |
| `pinVersion` | default `0.1.0` | Encoded into `grade_ref` |
| `grade_ref` | derived | `SCI-003@0.1.<n>:<label>` |
| `rank` | derived | Ordinal 1…4 |

Interim Evidence slot (not EG-0.1 Grade): `deferred_sci003`.

### 5.2 Storage on Evidence (SCI-002)

| Field | Required | Notes |
|-------|----------|-------|
| `grade_ref` | yes | Slot validated by Grade validators |
| `grade_assignment_log` | optional | Append-only GAE list |

### 5.3 `GradeAssignmentEvent` (all interface fields required when present)

`event_id`, `at`, `evidence_id`, `from_grade_ref` (`string | "null"`), `to_grade_ref`, `authority_agent`, `reason`, `decision_ref`.

`event_id` pattern: `gae:[A-Za-z0-9._~-]{1,128}`.

### 5.4 ENC `GradeDesignationUnit`

| Envelope / content | Value |
|--------------------|-------|
| `unit_kind` | `GradeDesignationUnit` |
| Scientific identity | Evidence `evidence_id` |
| `content_version` | Evidence `evidence_version` |
| `spec_ref` | `SCI-003@0.1.0` |
| Content | `{ evidence_id, grade_ref }` |
| References | one `grades` → Evidence |
| Events | empty array |

**FACT:** Authoritative graded content for OPS decode today is on **EvidenceUnit** (`grade_ref` + GAE folded into envelope events). `GradeDesignationUnit` is a designation encoding with relationship role `grades`.

---

### 6. Grade Relationships

| Relationship kind | Representation | Authority |
|-------------------|----------------|-----------|
| Scientific: Grade designates Evidence | ENC role `grades`, target_class `Evidence` | ENC + SCI-003 |
| Scientific: Grade stored on Evidence | `Evidence.grade_ref` | SCI-002 / SCI-003 |
| Scientific: GAE history | `grade_assignment_log` / EvidenceUnit events | Core |
| Scientific: Verification may cite grade tokens | `Verification.grade_refs` as Extension refs | SCI-006 (reference-only) |
| Claim Standing | Explicit non-interference (IR-1) | SCI-001 / SCI-003 |
| Contradiction / NR | No Grade assignment ownership | OBSERVATION |
| OPS membership | Session/Workspace member refs (`entity_kind` + `unit_kind` + `identity`) | OPS — **not** scientific relationship |
| Persistence revision lineage | `predecessor_revision_id` + RevisionHead | Persistence Model C — **not** Grade semantics |

**OQ-022-007 — New scientific relationship?**

**NOT APPLICABLE / NONE required.** Role `grades` already exists. Grade OPS must not invent a second graph.

**Classification:** REQUIRED FOR SPEC — membership ≠ `grades` relationship; do not conflate.

---

### 7. Grade Lifecycle / State

**OQ-022-002 — Lifecycle / state semantics?**

**NO CORE GRADE LIFECYCLE FOUND.**

SCI-003 §13:

> EG-0.1 does **not** define a separate Grade state machine beyond label reassignment.

Grade vocabulary that **does** exist is **labels**, not workflow/Standing/Record State:

- EG-0.1 labels listed in §8.1
- Interim: `deferred_sci003`
- Forbidden encodings include Standing-like and workflow-like tokens (`supported`, `contested`, `superseded`, `retracted`, `in_review`, …)

Evidence `record_state` (`draft` | `registered` | `withdrawn`) is an **authority gate** for Grade assignment (AR-4 / AR-5), not a Grade state.

**OQ-022-003 — Post-persist evolution?**

**YES — as Evidence material revision under Model C**, not as a Grade-owned state machine.

Because:

1. Persisted EvidenceUnit revisions are immutable.
2. `EvidenceGradeService.assign` produces a **new Evidence** object (new `grade_ref`, appended GAE, bumped `evidence_version`) while preserving `record_state`.
3. Committing that result requires `Persistence.create` of a successor EvidenceUnit revision + RevisionHead CAS — isomorphic orchestration to Standing / Record State, **different Core call**.

**Recommended operation class for SPEC (evidence-based, not symmetry-driven):**

| Option | Fit |
|--------|-----|
| A. create-only | Insufficient alone (registration already creates Evidence with default/deferred grade) |
| B. post-persist transition | **Primary fit**: post-persist Core assign → new Evidence revision |
| C. revision-only | Incomplete description — must include Core semantic assign |
| D. other | Migration (`migrateFromDeferred`) may be in-scope or explicit non-goal |

**Classification:** REQUIRED FOR SPEC — forbid inventing Grade `draft|registered|withdrawn` or Standing vocabulary.

---

### 8. Model C Compatibility

**OQ-022-005 — Can Grade use Model C unchanged?**

**Compatible** for the EvidenceUnit-headed path:

```
headed EvidenceUnit
→ evidenceFromEvidenceUnitPayload (existing OPS decode)
→ EvidenceGradeService.assign (Core)
→ CanonicalEncoder.assemble(evidence) → EvidenceUnit
→ Persistence.create (revision_id, predecessor_revision_id)
→ advanceHead(identity, "EvidenceUnit", expected, next)
→ optional appendEvent (OPS journal)
```

| Model C element | Grade fit |
|-----------------|-----------|
| Stable scientific identity | `evidence_id` (unchanged by assign) |
| Immutable revisions | New EvidenceUnit row per assignment |
| `revision_id` caller-supplied `rev:…` | Same rules as 020/021 (`≠ rev:initial`, ≠ expected head) |
| `predecessor_revision_id` | Set to expected head |
| RevisionHead | `persist:RevisionHead:EvidenceUnit:{evidence_id}` |
| CAS `expected_version` | Head `content_version` = prior `revision_id` |
| Determinism | Caller-supplied ids (see §10) |
| Partial-write | Same intentional orphan-revision behavior if CAS fails after create |

**What does NOT “fit” as a Grade-owned Model C root:**

- There is no Grade scientific identity distinct from Evidence.
- Treating Grade as a fourth Standing/Record-State machine would contradict SCI-003.

**GradeDesignationUnit under Model C (OPEN — REQUIRED FOR SPEC):**

| Fact | Implication |
|------|-------------|
| Persistence maps `GradeDesignationUnit` → CanonicalUnit | Storage already possible |
| Keys discriminate by `unit_kind` | Same `evidence_id` can host EvidenceUnit and GradeDesignationUnit rows |
| OPS today only ensures/advances **EvidenceUnit** heads | No GradeDesignationUnit head helpers |
| Dual CAS (Evidence + GradeDesignation) | Risk of split-brain if heads diverge |

**Discovery recommendation (interpretation, not SPEC):** Prefer **EvidenceUnit as sole authoritative graded head** for Sprint 022; treat GradeDesignationUnit persistence as optional/explicit secondary write with policy defined by SPEC. Do not create a second scientific authority.

**Classification:** REQUIRED FOR SPEC — GradeDesignationUnit revision/head policy.

---

### 9. Candidate Grade OPS Surface

Existing Claim/Evidence OPS pattern (location: `apps/reference-app/src/operations/research-operations.ts`):

- Register + get/export/lineage helpers
- Post-persist: `transitionClaimStanding`, `transitionEvidenceRecordState`
- Optional OPS journal events
- Explicit membership (not auto on register)

**Minimal Grade OPS surface supported by repository evidence:**

| Need | Candidate | Justification |
|------|-----------|---------------|
| Post-persist assign | **CANDIDATE API NAME:** `assignEvidenceGrade` (or SPEC-chosen synonym) | Orchestrate Core assign + Model C Evidence revision |
| Decode reuse | Existing `evidenceFromEvidenceUnitPayload` | Already reconstructs GAE from non-Record-State events |
| Read/export | Reuse `getEvidenceUnit*` / `exportEvidenceUnit*` | Graded content lives on EvidenceUnit |
| Lineage/head | Reuse Evidence helpers | No Grade-owned head required if EvidenceUnit-authoritative |
| Optional OPS event | `append_event` + dedicated `event_type` | Mirror 020/021; non-authoritative vs Core GAE |
| Membership | Existing `registerMember` | No new membership primitive |
| Snapshot | Existing `snapshotView` / `workspaceSnapshotView` | Frozen shapes include all persistence entities |

**Not justified as minimal surface (unless SPEC proves otherwise):**

- `registerGradeUnit` as a separate scientific create path (Grade is not a root create aggregate)
- Grade-only get/export that bypasses EvidenceUnit
- Workspace projection changes
- New timeline engine

**Migration:** Core `migrateFromDeferred` exists. SPEC must state whether OPS exposes migration as the same assign path, a distinct method, or non-goal.

**Classification:** REQUIRED FOR SPEC — exact method names, input types, event_type string, migration scope.

---

### 10. Determinism

**OQ-022-011 — Deterministic identifiers required**

| Identifier | Source | Note |
|------------|--------|------|
| `evidence_id` | Caller (already on headed Evidence) | Stable |
| `revision_id` | Caller `rev:…` | Model C |
| `expected_head_revision_id` | Caller | CAS |
| `GradeAssignmentInput.at` | Caller UTC-second | `GRADE_UTC_SECOND` |
| `authority_agent` | Caller | Human pattern when required |
| `decision_ref` | Caller | Required non-empty |
| `event_id` (GAE) | **Caller-required for deterministic REF-OPS** | Core defaults to `gae:` + `randomUUID()` when omitted |
| OPS journal `event_id` | Caller or deterministic default | Pattern like Standing/Record State |

**FACT:** `packages/core/src/grade/validator.ts` uses `randomUUID` when `event_id` is omitted. This is inherited Core behavior (also noted in ROADMAP-REVIEW-002). OPS deterministic reference paths **must supply** `event_id`.

**OBSERVATION:** Same class of discipline as Claim STE / Evidence ERTE ids in prior OPS sprints. Not a Persistence change; not a Core redesign trigger for SPEC-022.

**Classification:** REQUIRED FOR SPEC — mandate caller-supplied GAE `event_id` on OPS reference path.

---

### 11. Reference Test Implications

**OQ-022-012 — Fixtures eventually needed**

| Corpus | Grade today |
|--------|-------------|
| SCI (`REF-CORPUS-SCI`) | `REF-GRADE-001`…`003` (3) — assignment success, AI raise reject, GradeDesignationUnit relationship |
| OPS (`REF-OPS-*`) | **None** |
| FULL | SCI ∪ OPS (`REF-OPS-001`…`061` currently) |

**Infrastructure sufficiency:** ReferenceTestSuite / corpus construction can add additive `REF-OPS-` fixtures without new engines. **Do not renumber** existing fixtures.

**Likely future evidence themes (discovery only — do not create now):**

- Happy-path post-persist assign on headed Evidence (deferred → EG label or label reassignment)
- Human raise vs AI raise rejection under OPS path
- CAS conflict / expected_head mismatch
- SemVer bump (`evidence_version`) vs new `revision_id` coexistence
- GAE round-trip via `evidenceFromEvidenceUnitPayload`
- Optional: GradeDesignationUnit persistence policy tests **if** SPEC requires dual-write
- Regression: Standing / Record State / prior OPS unchanged

**Classification:** REQUIRED FOR SPEC — fixture themes and non-goals; numbering left to EXEC planning.

---

### 12. Conformance Implications

**OQ-022-010 — Existing profiles?**

| Profile | Role |
|---------|------|
| `CONF-001@1.0.0` | SCI corpus — already covers REF-GRADE-* |
| `CONF-001@1.1.0-OPS` | FULL corpus — recognizes `REF-OPS-` prefix + `OPS-001` authority |

**FACT:** OPS profile already accepts additive `REF-OPS-` fixtures. No profile redesign is **required** for Grade OPS if evidence is additive under `REF-OPS-` and SCI corpus remains frozen at 44.

**When profile versioning would be required:** Only if Grade OPS introduced new authority prefixes, new corpus ids, or semantic changes to CONF evaluation — none of which are necessitated by repository evidence today.

**Classification:** OBSERVATION — prefer unchanged profiles; SPEC must confirm additive-only stance.

---

### 13. Certification Implications

Pipeline REF → CONF → CERT remains sufficient.

| Impact | Expectation |
|--------|-------------|
| SCI certificate corpus | Unchanged (44) if Core untouched |
| OPS / FULL | Additive REF-OPS; counts increase |
| Engines | No second Conformance/Certification engine |
| Formal cert fixtures | Future Sprint 022 certification artifact set (not this discovery) |

**Classification:** OBSERVATION — certification architecture unchanged; future EXEC produces additive evidence only.

---

### 14. Persistence Boundary

**OQ-022-006 — New persistence primitive?**

**No Persistence architecture change required** for EvidenceUnit-headed Grade OPS:

| Primitive | Status for Grade OPS |
|-----------|----------------------|
| `create` | Sufficient |
| `get` / revision get | Sufficient via Evidence helpers |
| `replace` + `expected_version` | Used by `advanceHead` — unchanged |
| RevisionHead | EvidenceUnit head sufficient for authoritative path |
| Event journal | Sole journal; optional OPS event — unchanged |
| Snapshots / restore | Include all entities — unchanged |
| Queries | No new query API required |

**FACT:** `entityFromCanonicalUnit` already maps `GradeDesignationUnit` → CanonicalUnit storage. README documents coexistence with EvidenceUnit under distinct `unit_kind` keys.

If SPEC mandates dual-head CAS for GradeDesignationUnit, that is still **usage** of existing `ensureInitialHead` / `advanceHead` APIs — not a new Persistence primitive. It **is** an architectural consistency decision (REQUIRED FOR SPEC), not a Persistence redesign blocker.

**Classification:** Persistence = **unchanged** (no blocker).

---

### 15. Provenance Boundary

**OQ-022-008 — New provenance concept?**

| Concept | Grade interaction |
|---------|-------------------|
| Scientific provenance | Evidence `provenance.*` already gates eligibility (EL-P*) — Core |
| Operational audit history | Optional OPS `appendEvent` — non-authoritative |
| Revision lineage | Model C `predecessor_revision_id` — Persistence |
| Membership | OPS index — non-scientific |
| Source references | Evidence `source.*` — eligibility (EL-S*) — Core |
| GAE | Scientific assignment history on Evidence — Core |

**No new provenance model is required before Grade OPS.** Packaging profiles (W3C PROV / RO-Crate) remain **DEFERRED** (ROADMAP-REVIEW-002 Phase R2).

**Classification:** NOT APPLICABLE as blocker; OBSERVATION to keep boundaries separated in SPEC.

---

### 16. Workspace / Session Boundary

**OQ-022-009 — Snapshots frozen?**

| Surface | Grade need |
|---------|------------|
| ResearchSession / Workspace | No Grade-specific API required |
| Membership | Explicit; may reference EvidenceUnit identity; ≠ `grades` |
| Timeline | Existing projection over journal events |
| ResearchSnapshot / WorkspaceSnapshot | Shapes can remain frozen; Persistence snapshot already carries revision rows |

**FACT:** Snapshot schema_version `1.0.0` already serializes entities + journal. Grade OPS writing new EvidenceUnit revisions (and optionally GradeDesignationUnit rows) appears in snapshots without shape change.

**Classification:** Snapshots **can remain frozen**.

---

### 17. Multi-Unit Architecture Implications

**OQ-022-013 / OQ-022-014 — Shared pattern / generic lifecycle?**

**Legitimate shared architectural pattern (precedent):**

```
load headed CanonicalUnit
→ OPS-local decode to Core object
→ Core semantic operation
→ ENC assemble
→ create immutable revision
→ RevisionHead CAS
→ optional OPS journal event
```

This pattern is already demonstrated by Claim Standing and Evidence Record State. Grade would be the third **explicit per-unit** OPS method calling a **different** Core service (`EvidenceGradeService`), not a Standing/Record-State clone.

**Generic abstractions evaluated:**

| Abstraction | Verdict |
|-------------|---------|
| `ScientificUnitLifecycle` | **NOT JUSTIFIED** — would obscure SCI-003 vs SCI-001 vs SCI-002 semantics |
| `generic postPersistTransition()` | **NOT JUSTIFIED** — invites OPS-invented transition vocabulary |
| Generic revision service outside Persistence | **NOT JUSTIFIED** — Persistence already owns Model C |
| Generic transition engine in OPS | **NOT JUSTIFIED** — Processor already has Core transition wiring; OPS must stay orchestration |

**Why explicit per-unit OPS remains preferable:**

- Preserves Core as sole semantic authority per unit type
- Keeps certification evidence readable (named REF-OPS themes)
- Avoids second scientific authority disguised as “framework”
- Matches ROADMAP-REVIEW-002 rejection of generic lifecycle engine

**Classification:** Generic lifecycle abstraction = **NOT JUSTIFIED**.

---

### 18. Future Canonical Unit Implications

| Future unit | Relation to Grade OPS |
|-------------|------------------------|
| Contradiction | May later *consume* graded Evidence; must not be built inside Grade OPS |
| Negative Result | Same |
| Verification | Already may reference `grade_refs`; OPS Verification deferred |
| Literature / DocumentArtifact | Eligibility already uses Evidence source/provenance; DocumentArtifact **DEFERRED** |

**Reusable safe precedent:** Explicit OPS method + Core service + Model C Evidence/Claim heads.

**Unsafe generalization:** Assuming every canonical unit has Standing-like states; Grade proves label-assignment units may only need assign-on-revision.

**Classification:** DEFERRED for Contradiction/NR/Verification OPS; Grade does not block or require them.

---

### 19. Technology Boundary

| Technology | Required for Grade OPS? |
|------------|-------------------------|
| Current TypeScript monorepo | YES (existing) |
| PostgreSQL / Redis / OpenSearch / Neo4j / vectors | **NOT JUSTIFIED** |
| Python / LLM / RAG | **NOT JUSTIFIED** |
| API / frontend / workers | **NOT JUSTIFIED** |

No unavoidable external infrastructure dependency found.

**Classification:** Technology boundary intact; any such dependency would be a **BLOCKER** — none found.

---

### 20. Open Questions

| ID | Question | Answer | Classification |
|----|----------|--------|----------------|
| OQ-022-001 | Authoritative Core meaning of Grade? | EG-0.1 warrant-strength label on Evidence via `grade_ref` | ANSWERED |
| OQ-022-002 | Grade lifecycle/state? | **NO CORE GRADE LIFECYCLE FOUND** (label reassignment only) | ANSWERED |
| OQ-022-003 | Post-persist evolution? | Yes — Core assign → new EvidenceUnit revision under Model C | ANSWERED |
| OQ-022-004 | Minimal OPS surface? | Post-persist assign (+ reuse Evidence get/export/head); optional OPS event; migration scope TBD | ANSWERED / REQUIRED FOR SPEC naming |
| OQ-022-005 | Model C unchanged? | **Compatible** for EvidenceUnit path | ANSWERED |
| OQ-022-006 | New Persistence primitive? | **No** | ANSWERED |
| OQ-022-007 | New scientific relationship? | **No** (`grades` exists) | ANSWERED |
| OQ-022-008 | New provenance concept? | **No** | ANSWERED |
| OQ-022-009 | Snapshots frozen? | **Yes** | ANSWERED |
| OQ-022-010 | CONF/CERT unchanged? | **Yes** (additive REF-OPS under existing OPS profile) | ANSWERED |
| OQ-022-011 | Deterministic ids? | `revision_id`, expected head, GAE `event_id`, `at`, agents, `decision_ref` | ANSWERED |
| OQ-022-012 | REF fixtures needed? | Additive REF-OPS themes; SCI Grade fixtures remain | ANSWERED |
| OQ-022-013 | Shared pattern? | Yes — explicit per-unit Model C orchestration | ANSWERED |
| OQ-022-014 | Generic lifecycle abstraction? | **NOT JUSTIFIED** | ANSWERED |
| OQ-022-015 | SPEC-022 ready? | **YES** | ANSWERED |

**Remaining SPEC decisions (not discovery blockers):**

1. Exact OPS method name and input DTO.  
2. GradeDesignationUnit dual-write / dual-head policy.  
3. Whether `migrateFromDeferred` is in-scope.  
4. Exact OPS `event_type` string.  
5. Fixture theme list and failure-code expectations.  
6. Explicit non-goals list (Contradiction OPS, material Evidence rewrite, DocumentArtifact, AI, DB, generic engine).

---

### 21. Blockers / Required Decisions

### Blockers

**NONE** found that prevent writing SPEC-022.

No second scientific authority, no duplicate graph/journal requirement, no Persistence redesign, no infrastructure trigger, no Core Grade redesign needed.

### Required for SPEC

| ID | Decision |
|----|----------|
| D-022-001 | OPS operation name + input fields (must pass through to `GradeAssignmentInput`) |
| D-022-002 | GradeDesignationUnit persistence policy (none / best-effort mirror / transactional dual CAS) |
| D-022-003 | Authoritative head = EvidenceUnit only (recommended) vs dual heads |
| D-022-004 | Migration (`deferred_sci003`) in-scope vs non-goal |
| D-022-005 | OPS journal `event_type` / default `event_id` scheme |
| D-022-006 | Determinism mandate: caller-supplied GAE `event_id` |
| D-022-007 | SemVer (`evidence_version` bump by Core) vs `revision_id` trichotomy documentation |
| D-022-008 | Non-goals and rejection of generic lifecycle engine |
| D-022-009 | Additive REF-OPS evidence plan; SCI corpus freeze |
| D-022-010 | Partial-write orphan semantics unchanged |

### Observations

| ID | Note |
|----|------|
| OBS-022-001 | Core `randomUUID` fallback for GAE ids — OPS must not rely on it for REF |
| OBS-022-002 | GAE/ERTE event discrimination in decode uses Record State membership of `to_state` — SPEC should note regression risk if a Grade label ever collided with Record State tokens (currently impossible by closed sets) |
| OBS-022-003 | Docs drift from Sprint 021 (README/IMPLEMENTATION) remains unrelated hygiene |
| OBS-022-004 | Untracked `ROADMAP-REVIEW-002.md` present alongside this discovery |

### Deferred

Contradiction / NR / Verification OPS; DocumentArtifact; provenance packaging; durable DB; search/KG/AI; material Evidence content OPS.

---

### 22. SPEC-022 Requirements

If authorized, SPEC-022 **must** define (and must **not** implement):

1. **Problem statement:** Post-persist Evidence Grade assignment under certified Model C.  
2. **Architectural objective:** OPS orchestrates Core `EvidenceGradeService` onto headed EvidenceUnit revisions without inventing Grade lifecycle vocabulary.  
3. **Normative pins:** SCI-003, SCI-002, Model C (SPEC-020/021), ADR-0006 (Grade ≠ Workflow ≠ Standing).  
4. **Authority boundaries:** Core / Persistence / OPS / ENC / SER — unchanged principles.  
5. **Operation contract:** inputs, outputs, errors, CAS rules, partial-write behavior.  
6. **GradeDesignationUnit policy:** explicit.  
7. **Determinism contract:** caller-supplied identifiers listed in §10.  
8. **Event journal policy:** optional OPS event; Core GAE remains scientific history.  
9. **Non-goals:** including generic lifecycle engine, Contradiction/NR/Verification OPS, DocumentArtifact, AI, DB, API, UI, KG.  
10. **Evidence plan:** additive REF-OPS; regression of Sprints 019–021; SCI 44/44 unchanged.  
11. **Conformance stance:** remain on `CONF-001@1.1.0-OPS` unless SPEC proves otherwise.  
12. **Certification impact:** additive OPS evidence only.

SPEC-022 must **not** redefine EG-0.1 labels, eligibility, or IR-1…IR-6.

---

### 23. Discovery Verdict

**READY FOR SPEC-022**

Grade Core semantics, ENC/SER/Processor support, Model C Persistence, Evidence OPS decode, and prior post-persist orchestration precedent are sufficient to write an architecture specification.

Remaining items are **specification decisions**, not missing scientific foundations or Persistence blockers.

**Required next action:** Author **SPEC-022** (design-only) under separate authorization — still **no implementation**.

---

DISCOVERY-022 FINAL VERDICT
===========================

Grade Core:
EG-0.1 Evidence Grade is Core-complete: closed labels, eligibility, Human gates, GAE, SemVer material bump on Evidence; stored on Evidence.grade_ref; no Grade-owned lifecycle state machine; ENC GradeDesignationUnit exists as designation encoding.

Grade OPS:
NOT IMPLEMENTED. Justified as post-persist OPS orchestration of EvidenceGradeService.assign onto headed EvidenceUnit under Model C; reuse Evidence get/export/head; optional OPS journal event; no OPS-invented Grade state vocabulary.

Model C:
compatible

Persistence:
unchanged

Conformance:
unchanged

Certification:
unchanged

New scientific authority:
NONE

New scientific graph:
NONE

New event journal:
NONE

Generic lifecycle abstraction:
NOT JUSTIFIED

SPEC-022:
READY

Required next action:
Write SPEC-022 (design-only authorization required); resolve GradeDesignationUnit head/dual-write policy and OPS operation contract therein. No EXEC.

Implementation authorization:
NO

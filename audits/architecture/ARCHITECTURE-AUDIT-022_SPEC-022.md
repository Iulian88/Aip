# ARCHITECTURE-AUDIT-022
## SPEC-022 — Grade OPS

| Field | Value |
|-------|--------|
| Audit ID | ARCHITECTURE-AUDIT-022 |
| Subject | `specs/architecture/SPEC-022_grade_ops.md` |
| Spec status at audit | DRAFT — READY FOR ARCHITECTURE AUDIT |
| Baseline | `d2eedef23a4193c40d3a3b4d2a73cf81c65795c7` |
| Mode | **READ-ONLY** |
| Discovery | `audits/roadmap/DISCOVERY-022_GRADE_OPS.md` |
| Roadmap | `audits/roadmap/ROADMAP-REVIEW-002.md` |
| Does not authorize | EXEC, source/test changes, SPEC patches, certification, commit, push |

**Classification legend:** BLOCKER | REQUIRED PATCH | OBSERVATION | DEFERRED | NOT APPLICABLE

---

### 1. Audit Scope

Independent architecture audit of SPEC-022 Grade OPS against:

- certified Sprint 015–021 architecture,
- actual Core / ENC / SER / Persistence / OPS implementation,
- DISCOVERY-022 and ROADMAP-REVIEW-002.

**Question answered:** Can SPEC-022 safely become the architectural basis for a future Grade OPS Implementation Decision?

This audit does **not** implement, patch SPEC-022, or authorize EXEC.

---

### 2. Verified Git Baseline

| Check | Result |
|-------|--------|
| HEAD | `d2eedef23a4193c40d3a3b4d2a73cf81c65795c7` |
| origin/main | `d2eedef23a4193c40d3a3b4d2a73cf81c65795c7` |
| HEAD == origin/main | YES |
| Certified commit | `cert(sprint-021): certify Evidence Record State OPS` |
| Working tree | Docs-only untracked: DISCOVERY-022, ROADMAP-REVIEW-002, SPEC-022 (+ this audit) |
| Runtime / tests / fixtures / cert artifacts modified by this audit | **NONE** |

### Certified corpus (repository evidence)

| Corpus | Claimed by SPEC-022 | Repository evidence | Verdict |
|--------|---------------------|---------------------|---------|
| SCI | 44/44 | `packages/reference-tests` SCI construction; `CERTIFICATION-021` | **Verified** |
| OPS | 61/61 | `REF-OPS-001`…`061` in `fixtures/ops.ts`; CERT-021 | **Verified** |
| FULL | 105/105 | SCI ∪ OPS; CERT-021 JSON | **Verified** |
| Profiles | `CONF-001@1.0.0`, `CONF-001@1.1.0-OPS` | `packages/conformance/src/profiles.ts` | **Verified** |

### Sprint history (verified by commit subjects + cert docs)

| Sprint | Capability | Status at HEAD |
|--------|------------|----------------|
| 015 | Persistence Foundation | Certified (prior) |
| 016–017 | Research Operations + OPS CONF/CERT | Certified (prior) |
| 018 | ResearchWorkspace | Certified (prior) |
| 019 | Evidence Operations | Certified |
| 020 | Model C + Claim Standing post-persist | Certified |
| 021 | Evidence Record State OPS | **Formally certified and closed** |

---

### 3. Source Documents Audited

| Document | Role |
|----------|------|
| `specs/architecture/SPEC-022_grade_ops.md` | Subject |
| `audits/roadmap/DISCOVERY-022_GRADE_OPS.md` | Discovery input |
| `audits/roadmap/ROADMAP-REVIEW-002.md` | Frontier justification |
| `specs/architecture/SPEC-020_post_persist_scientific_transition.md` | Model C + RQ-020-006 |
| `specs/architecture/ADR-020_post_persist_revision_model.md` | Revision ADR |
| `specs/architecture/IMPLEMENTATION-DECISION-021_…` | Prior ID pattern |
| `specs/architecture/SPEC-021_…` | Record State OPS precedent |
| `audits/architecture/ARCHITECTURE-AUDIT-021_SPEC-021.md` | Prior audit pattern |
| `specs/scientific/SCI-003_evidence_grade.md` | Grade constitution |
| Core `packages/core/src/grade/**`, `evidence/**` | Grade + Evidence authority |
| ENC `packages/encoding/src/builder.ts` (+ registry) | EvidenceUnit / GradeDesignationUnit |
| Persistence `revision.ts`, `entity.ts`, `repository.ts` | Model C |
| OPS `research-operations.ts`, `evidence-from-unit.ts` | Standing / Record State / decode |
| Reference fixtures `grade.ts`, `ops.ts`, `fixtures/index.ts` | REF corpus |
| Conformance `profiles.ts` | Profile sufficiency |
| Certification Sprint 021 artifacts | Corpus counts |

---

### 4. Grade Authority Audit

| Concern | SPEC-022 | Repository | Verdict |
|---------|----------|------------|---------|
| Grade meaning | SCI-003 EG-0.1 | SCI-003 + Core types | **PASS** |
| Valid values | Closed labels + `grade_ref` encoding | `GRADE_LABELS`, `GRADE_REF` | **PASS** |
| Assignment semantics | Delegate to `EvidenceGradeService.assign` | `packages/core/src/grade/service.ts` | **PASS** |
| OPS invents validity? | Forbidden (§6, §9.7) | No Grade OPS exists yet; contract forbids | **PASS** |
| Standing interference | IR-1; Grade must not set Standing | Core assign does not touch Claim | **PASS** |
| Record State | Preserved by Core assign | `record_state` copied unchanged | **PASS** |

**Normative OPS chain audited:**

```
assignEvidenceGrade
  → evidenceFromEvidenceUnitPayload
  → EvidenceGradeService.assign     // sole scientific validity
  → CanonicalEncoder.assemble
  → Persistence.create + advanceHead
```

OPS does **not** decide Grade legality. Core `EvidenceGradeValidationError` propagates unchanged (§10).

**Scientific authority violations:** **NONE**.

---

### 5. Option A Audit

SPEC-022 selects **OPTION A**: EvidenceUnit + `grade_ref` authoritative; no GradeDesignationUnit dual-write/dual-head on OPS assign path.

| Question | Answer | Classification |
|----------|--------|----------------|
| 1. Is `grade_ref` already on authoritative Evidence? | **Yes** — required `Evidence.grade_ref` (SCI-002 / Core types / factory / validator) | FACT |
| 2. Is Grade already Core-represented? | **Yes** — EG-0.1 services, eligibility, GAE, Processor path | FACT |
| 3. Single scientific source of truth? | **Yes** — head-resolved EvidenceUnit | PASS |
| 4. Avoids duplicate scientific representation? | **Yes** — rejects mandatory dual-write (OPTION B) | PASS |
| 5. Model C clean? | **Yes** — EvidenceUnit head only; same sequence as SPEC-021 | PASS |
| 6. Deterministic identity? | **Yes** — stable `evidence_id`; caller `revision_id` | PASS |
| 7. Future compatibility? | ENC GradeDesignationUnit remains; optional future projection allowed (N-022-003) | PASS |
| 8. Ambiguity of what `grade_ref` points to? | Closed as EG string (`deferred` or `SCI-003@…:label`), **not** an Evidence id | PASS |
| 9. Identity semantics sufficient? | §7.3 + §7.5 trichotomy sufficient for IMPLEMENTATION DECISION | PASS |
| 10. Reject dual-write justified? | **Yes** — closes RQ-020-006 as not mandatory; avoids split-brain heads; matches SCI-002/003 ownership | PASS |

**Option A:** **ACCEPTED**.

Rejecting OPTION B/C is consistent with DISCOVERY-022, SPEC-020/ADR-020 soft RQ-020-006, and Core behavior (`assign` returns Evidence only).

---

### 6. Evidence / grade_ref Audit

| Concern | Finding |
|---------|---------|
| `grade_ref` definition | SCI-002 slot string; EG-0.1 encoding or interim `deferred_sci003` |
| Grade identity | **None** — no `grade_id`; scientific identity = `evidence_id` |
| GradeDesignationUnit identity | Same `evidence_id` (ENC); **not** confused with `grade_ref` value in SPEC §5 vs §7.3 |
| After assign | New Evidence with updated `grade_ref`, GAE, bumped `evidence_version` |
| Decode | Existing `evidenceFromEvidenceUnitPayload` reconstructs `grade_ref` + GAE |

**OBSERVATION (O-022-01):** Readers may confuse GradeDesignationUnit **identity** (`evidence_id`) with `grade_ref` **label string**. SPEC already distinguishes them; Implementation Decision should restate the distinction in the frozen contract table (no SPEC architecture defect).

---

### 7. Model C Audit

| Element | SPEC-022 | Repository precedent | Verdict |
|---------|----------|----------------------|---------|
| Sequence | Load head → decode → Core → ENC → create → CAS → optional event | Identical shape to `transitionClaimStanding` / `transitionEvidenceRecordState` | **COMPATIBLE** |
| Scientific identity | `evidence_id` stable | Core assign preserves id | **PASS** |
| Mutate existing revision? | Forbidden; new row only | Persistence `IMMUTABLE_KINDS` | **PASS** |
| `revision_id` | Caller `rev:…` ≠ `rev:initial` ≠ expected head | Same OPS guards as 020/021 | **PASS** |
| `predecessor_revision_id` | = expected head | `entityFromCanonicalUnit` options | **PASS** |
| RevisionHead | `EvidenceUnit` only | `advanceHead(identity, "EvidenceUnit", …)` | **PASS** |
| CAS | `expected_version` = prior revision_id | Store `advanceHead` | **PASS** |
| CONFLICT / ALREADY_EXISTS / partial-write | Explicit §8.3 | Certified Model C orphans | **PASS** |
| SemVer vs revision_id | Explicit trichotomy (§7.5) | Grade bumps SemVer; Standing does not — correctly distinguished | **PASS** |

**No path mutates an existing Evidence revision.** **BLOCKER count for Model C: 0.**

**OBSERVATION (O-022-02):** SPEC-021 lists “validate revision_id” as explicit step 1; SPEC-022 embeds the same rules in §8.2/§10 without a numbered step. Non-blocking; Implementation Decision should mirror the Standing/Record State validation preamble.

---

### 8. Identity Audit

| Identity | SPEC treatment | Conflation risk |
|----------|----------------|-----------------|
| Evidence scientific id | `evidence_id` / input `identity` | None |
| Evidence revision id | `revision_id` | Distinguished from SemVer |
| `grade_ref` | EG string designation | Not an Evidence id (§7.3) |
| Grade aggregate id | N/A (none) | Correct |
| Persistence key | Model C four-segment + unit_kind | Unchanged |
| RevisionHead id | EvidenceUnit + evidence_id | Correct |
| GAE `event_id` | `gae:…` | Scientific history |
| OPS journal `event_id` | `ops:…` | Operational only |
| Membership id | Session/workspace member refs | Explicitly ≠ grade (§7.6, §9.5) |

**Fundamental identity ambiguity:** **NONE** (no BLOCKER).

---

### 9. Persistence Audit

| API / concern | Required change? | Notes |
|---------------|------------------|-------|
| create / get / replace | No | Existing |
| RevisionHead / CAS | No | EvidenceUnit head only |
| Event journal | No | Sole journal; optional citation |
| Snapshots / restore | No | Additive entity rows |
| GradeDesignationUnit mapping | No change; unused by OPS path | Already mapped in `entity.ts` |

**Persistence:** **UNCHANGED**.

No undefined Persistence primitive required.

---

### 10. ENC / SER Audit

| Concern | Verdict |
|---------|---------|
| Evidence → EvidenceUnit after assign | Existing `CanonicalEncoder.assemble(evidence)` |
| OPS-specific scientific encoding | **Forbidden / absent** |
| Second encoder | **NONE** |
| SER-JSON export of headed/revision EvidenceUnit | Existing helpers suffice |
| Second serializer | **NONE** |
| GradeDesignationUnit builder retained outside OPS path | Compatible with OPTION A |

**ENC:** **COMPATIBLE**. **SER:** **COMPATIBLE**.

---

### 11. Error Semantics Audit

| Case | SPEC coverage | Verdict |
|------|---------------|---------|
| Evidence / revision not found | Persistence `NOT_FOUND` | **PASS** |
| Invalid Grade / grade_ref / eligibility / authority | Core `EvidenceGradeValidationError` | **PASS** |
| Duplicate revision | `ALREADY_EXISTS` | **PASS** |
| RevisionHead / persistence conflict | `CONFLICT` | **PASS** |
| Canonical encode failure | Propagate ENC | **PASS** |
| Core semantic rejection before persist | Nothing persisted | **PASS** |
| OPS misuse / decode failure | `OpsError` `INVALID_COMMAND_STATE` | **PASS** |
| Lower-layer wrap ban | Explicit | **PASS** |

**OBSERVATION (O-022-03):** “Invalid Evidence” as a holistic schema re-validation is not a separate OPS error class — Core assign validates Grade rules against the decoded Evidence; decode failures use OpsError. Sufficient and consistent with SPEC-021. Not a patch requirement.

---

### 12. Determinism Audit

| Concern | Verdict |
|---------|---------|
| Caller-supplied `revision_id` / expected head | **PASS** |
| Caller-supplied GAE `event_id` / `at` on certified paths | **PASS** |
| Forbidden wall-clock/random for OPS REF | **PASS** |
| Inherited Core `randomUUID` if `event_id` omitted | Documented §11; outside deterministic OPS path | **PASS** (certified pattern) |
| Export / snapshot determinism | Relies on existing Persistence/SER | **PASS** |

**Determinism:** **PASS**.

---

### 13. Event Audit

| Concern | Verdict |
|---------|---------|
| Operational only | Yes — `ops.evidence_grade_assignment_revision` |
| Optional | Default off |
| Append-only sole journal | Yes |
| Deterministic event_id scheme | Yes |
| Non-authoritative vs GAE | Explicit |
| Second journal | **NONE** |
| Redefines Grade semantics? | **No** |

**Events:** **PASS**.

**OBSERVATION (O-022-04):** Payload `to_grade_ref` should be taken from Core result after assign (Implementation Decision detail). SPEC intent is clear.

---

### 14. Membership Audit

SPEC §7.6 / §9.5:

- assign **SHALL NOT** mutate membership,
- membership ≠ grade assignment ≠ scientific relationship ≠ revision lineage ≠ provenance,
- no automatic `bears_on` / relationship sync.

Matches certified Sprint 019–021 discipline.

**Membership:** **PASS**.

---

### 15. Snapshot Audit

Frozen `ResearchSnapshot` / `WorkspaceSnapshot` shapes preserved; Grade reflected only via additive Persistence entities inside `persistence_snapshot`.

**Structural snapshot change:** **NOT REQUIRED**.

**Snapshots:** **PASS**.

---

### 16. Export Audit

Head-resolved and revision-pinned EvidenceUnit SER-JSON exports already exist; include `grade_ref` after head advance. No Grade-only export required. No second format.

**Export:** **PASS**.

---

### 17. Reference Test Audit

| Concern | Verdict |
|---------|---------|
| Themes sufficient for EXEC fixture authoring | **Yes** (§15) |
| Fixture numbering deferred to EXEC | Compatible (N-022-001); next free id after `REF-OPS-061` |
| Deterministic IDs listed | **Yes** |
| SCI freeze 44/44 | Correct |
| OPS additive | Correct |
| GradeDesignationUnit non-write theme | Aligns with OPTION A |

Fixtures are **not** created by this audit (correct).

**Reference Tests:** sufficiently specified for Implementation Decision / future EXEC planning.

---

### 18. Conformance Audit

| Profile | Impact |
|---------|--------|
| `CONF-001@1.0.0` | Unchanged |
| `CONF-001@1.1.0-OPS` | Unchanged; already recognizes `REF-OPS-` |

Additive, profile-local, non-breaking. No second ConformanceEngine. No fabricated reports.

**Conformance:** **UNCHANGED**.

---

### 19. Certification Audit

REF → CONF → CERT pipeline unchanged. Single CertificationEngine. Additive OPS evidence expected. No architecture change.

**Certification:** **UNCHANGED**.

---

### 20. Scope Audit

| Forbidden item | Present in SPEC-022? |
|----------------|----------------------|
| Grade lifecycle/state machine | **No** (explicitly rejected) |
| Generic lifecycle engine | **No** |
| GradeDesignationUnit dual-write | **No** (OPTION A) |
| Contradiction / NR / Verification OPS | **No** |
| Literature / DocumentArtifact | **No** |
| KG / AI / DB / frontend / API / distributed | **No** |
| Second scientific graph / journal | **No** |

**Scope creep:** **NONE**.

---

### 21. Future Compatibility Audit

SPEC §19 preserves explicit per-unit Model C OPS expansion for Contradiction / NR / Verification; derived-only KG; non-authoritative AI proposals; deferred DocumentArtifact. Does not design those systems.

**Future compatibility:** **PASS** (no premature coupling).

---

### 22. Generic Abstraction Audit

No `ScientificUnitLifecycle`, generic transition engine, or generic Grade OPS façade.

**Legitimate shared pattern (documented, not implemented):** load → decode → Core → ENC → create → CAS → optional event — third explicit instance after Standing / Record State.

**Generic lifecycle abstraction:** **NOT JUSTIFIED**.

---

### 23. Migration Audit

SPEC-022 does not change existing persisted artifact schemas. New EvidenceUnit revisions are additive under existing Model C keys.

**NO MIGRATION REQUIRED.**

Assigning from `deferred_sci003` via Core `assign` is a normal scientific assignment, not a Persistence migration.

---

### 24. Verification Matrix

| Area | SPEC-022 | Repository | Verdict |
|------|----------|------------|---------|
| Grade authority | Core-only via `EvidenceGradeService.assign` | Core Grade module complete | **PASS** |
| grade_ref | Authoritative Evidence slot | Required field + validators | **PASS** |
| Evidence revision | New immutable EvidenceUnit | Model C + IMMUTABLE | **PASS** |
| Model C | EvidenceUnit head CAS sequence | Matches Standing/Record State | **COMPATIBLE** |
| RevisionHead | EvidenceUnit only | `advanceHead` API | **PASS** |
| CAS | expected_version = prior revision_id | Persistence store | **PASS** |
| Persistence | Unchanged | No new primitive needed | **UNCHANGED** |
| ENC | EvidenceUnit assemble | Builder embeds grade_ref + GAE | **COMPATIBLE** |
| SER | Existing JSON | Profile includes EvidenceUnit | **COMPATIBLE** |
| Determinism | Caller ids; Core UUID fallback documented | `validator.ts` randomUUID fallback | **PASS** |
| Events | Optional ops citation | Sole journal pattern | **PASS** |
| Membership | Unchanged / non-mutating | Sprint 019–021 | **PASS** |
| Snapshots | Frozen shapes | Schema 1.0.0 persistence_snapshot | **PASS** |
| Export | EvidenceUnit SER-JSON | Existing export helpers | **PASS** |
| Reference Tests | Additive REF-OPS themes | Corpus 61 OPS; next free ≥062 | **PASS** |
| Conformance | Profiles unchanged | `profiles.ts` | **UNCHANGED** |
| Certification | Pipeline unchanged | CERT-021 architecture | **UNCHANGED** |
| Migration | None | Additive revisions only | **NOT REQUIRED** |
| Future compatibility | Explicit deferrals | ROADMAP-REVIEW-002 aligned | **PASS** |
| Scope | Narrow Grade OPS | Non-goals match discovery | **PASS** |
| Option A | Selected & justified | Closes RQ-020-006 | **ACCEPTED** |
| Generic lifecycle | Rejected | Not present in code | **NOT JUSTIFIED** |

---

### 25. Findings

### Blockers

**None.**

### Required patches

**None** (architecture-blocking or correctness-blocking).

### Observations (non-blocking)

| ID | Classification | Finding |
|----|----------------|---------|
| O-022-01 | OBSERVATION | Restate `grade_ref` (label string) vs GradeDesignationUnit identity (`evidence_id`) in Implementation Decision frozen table |
| O-022-02 | OBSERVATION | Mirror explicit revision_id validation preamble from SPEC-021 sequence in Implementation Decision |
| O-022-03 | OBSERVATION | “Invalid Evidence” covered by decode OpsError + Core Grade errors — no separate class needed |
| O-022-04 | OBSERVATION | Event payload `to_grade_ref` = Core result after assign |
| O-022-05 | OBSERVATION | SPEC-022 lacks formal `AC-022-*` Acceptance Criteria table and Document Control footer present in SPEC-021 — absorbable by Implementation Decision (SPEC template for 022 did not require them; not an architecture defect) |
| O-022-06 | OBSERVATION | Grade OPS method not implemented yet (expected; design-only) |
| O-022-07 | OBSERVATION | Root README corpus counts may lag CERT-021 (docs drift) — unrelated to SPEC-022 correctness |
| O-022-08 | OBSERVATION | Third isomorphic OPS path increases temptation for generic lifecycle — SPEC correctly forbids; keep forbidding in ID/EXEC |

### Deferred

Contradiction / NR / Verification OPS; GradeDesignationUnit projection sprint; DocumentArtifact; durable Persistence; AI.

### Not applicable

Second scientific graph; second journal; Persistence migration; Core EG-0.1 redesign.

---

### 26. Required Patches

**Count: 0**

No REQUIRED PATCH items. Observations O-022-01…05 are Implementation Decision discipline, not SPEC rewrites mandated before ID.

---

### 27. Blockers

**Count: 0**

No second authority/graph/journal; no immutable mutation; Model C intact; Core authority preserved; Persistence primitives defined; identity unambiguous; determinism specified; no unspecified migration; no unauthorized certified-behavior change.

---

### 28. Implementation Readiness

| Gate | State |
|------|-------|
| Architecture coherence | **PASS** |
| Discovery consistency | **PASS** (READY → SPEC Option A closes open dual-write Q) |
| Model C / Persistence / ENC / SER | **PASS** |
| REF / CONF / CERT | **PASS** |
| Precision for Implementation Decision | **Sufficient** |
| EXEC authorization | **NO** (not this audit’s role) |

**Implementation readiness:** **READY FOR IMPLEMENTATION DECISION**

**Next authorized action:** **IMPLEMENTATION DECISION** (design-only), then Final Architecture Re-Audit, then EXEC only if separately authorized.

---

### 29. Final Verdict

SPEC-022 is architecturally coherent with the certified AIP stack. Option A correctly preserves a single EvidenceUnit scientific source of truth for Grade, closes RQ-020-006 without Persistence redesign, and correctly places all Grade validity in Core `EvidenceGradeService.assign`. The proposed `assignEvidenceGrade` orchestration is a faithful third instance of the certified Model C post-persist pattern.

---

ARCHITECTURE-AUDIT-022 FINAL VERDICT
====================================

SPEC-022:
APPROVED WITH OBSERVATIONS

Grade authority:
Scientific Core (SCI-003 / EvidenceGradeService.assign) remains sole Grade semantic authority; OPS orchestrates only.

Option A:
ACCEPTED

grade_ref:
Authoritative EG-0.1 (or interim deferred) string slot on Evidence; revised via new EvidenceUnit revisions; not a separate Grade aggregate identity.

Model C:
COMPATIBLE

Persistence:
UNCHANGED

ENC:
COMPATIBLE

SER:
COMPATIBLE

Determinism:
PASS

Events:
PASS

Snapshots:
PASS

Conformance:
UNCHANGED

Certification:
UNCHANGED

Migration:
NOT REQUIRED

Generic lifecycle abstraction:
NOT JUSTIFIED

Scientific authority violations:
NONE

Second scientific graph:
NONE

Second event journal:
NONE

Blockers:
0

Required patches:
0

Implementation readiness:
READY FOR IMPLEMENTATION DECISION

Next authorized action:
IMPLEMENTATION DECISION

Implementation authorization:
NO

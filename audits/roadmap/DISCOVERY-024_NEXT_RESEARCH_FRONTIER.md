# DISCOVERY-024 — Next Research Frontier After Sprint 023

**Type:** Read-only architecture / roadmap discovery for Sprint 024  
**Mode:** No source, test, SPEC, or certification changes · no SPEC-024 · no commit · no push  
**Classification legend:** FACT | DEPENDENCY | OBSERVATION | OPEN QUESTION | DEFERRED | NOT APPLICABLE

Every status below is derived from the repository at the stated commit (source, fixtures, profiles, certification artifacts), not from documentation alone. Where a document and the code differ, the code is reported.

---

## 1. Baseline

| Item | Value |
|------|-------|
| Sprint 023 | FORMALLY CERTIFIED AND CLOSED — Contradiction OPS Under Model C |
| Commit | `207365fb260b9e334bb60f16252ab3f445411dd6` — `cert(sprint-023): certify Contradiction OPS under Model C` |
| `git rev-parse HEAD` | `207365fb260b9e334bb60f16252ab3f445411dd6` |
| `git rev-parse origin/main` | `207365fb260b9e334bb60f16252ab3f445411dd6` |
| HEAD == origin/main | YES |
| Working tree at discovery start | CLEAN |
| Certified corpus | SCI **44/44** · OPS **105/105** · FULL **149/149** |
| Profiles | `CONF-001@1.0.0` (SCI) · `CONF-001@1.1.0-OPS` (OPS, evaluated on FULL) |
| Engines | one `ConformanceEngine` · one `CertificationEngine` |
| Highest OPS fixture | `REF-OPS-105` → next free additive id **`REF-OPS-106`** |
| Certified OPS post-persist paths | Claim Standing (020) · Evidence Record State (021) · Grade (022) · Contradiction Record State (023) |
| OPS decode helpers | `claimFromClaimUnitPayload` · `evidenceFromEvidenceUnitPayload` · `contradictionFromContradictionUnitPayload` |

Documents read: ROADMAP-REVIEW-001/002, DISCOVERY-021/022/023, SPEC-020/021/022/023, CERTIFICATION-020…023, ADR-020, IMPLEMENTATION.md.  
Source inspected: `packages/core/src/{claim,evidence,grade,contradiction,negative-result,verification}`, `packages/encoding/src/builder.ts`, `packages/persistence/src/entity.ts`, `packages/processor/src/engines/transition-engine.ts`, `packages/serialization/src/json/**`, `packages/conformance`, `packages/certification`, `packages/reference-tests/src/fixtures/**`, `apps/reference-app/src/**`.

Repository modifications by this discovery: **this file only**.

---

## 2. Current Certified Architecture

| Layer | Status at baseline |
|-------|-------------------|
| Scientific Core (SCI-000…006) | COMPLETE for Claim, Evidence, Grade, Contradiction, Negative Result, Verification |
| ENC / SER | All six unit kinds assemble + SER-JSON registered |
| Persistence Model C | Generic by `unit_kind`; ClaimUnit / EvidenceUnit / ContradictionUnit OPS-exercised; NegativeResultUnit / VerificationUnit kind-mapped but never OPS-persisted |
| Research Operations | Claim create + Standing; Evidence create + Record State + Grade; Contradiction create + Record State |
| REF → CONF → CERT | SCI 44/44 · OPS 105/105 · FULL 149/149 · both profiles COMPLIANT · CERTIFIED |
| Sole scientific authority | Core |
| Sole operational journal | Persistence event journal |
| Sole Persistence mechanism | In-memory Model C repository |
| Dormant `Persistence.Relationship` | Still unused as scientific storage (Sprint 023 certified boundary) |

**FACT:** Sprint 023 closed the architectural pressure that DISCOVERY-023 identified as decisive — Claim Standing `contested` requires ≥1 `contested_by` Contradiction id (`ClaimValidator` `F7`), and that identity is now OPS-persistable (`registerContradictionUnit` / `transitionContradictionRecordState`, REF-OPS-077…105).

---

## 3. Scientific Capability Matrix

Legend — **Core**: scientific semantics in `@sciros/core`. **OPS create**: `ResearchOperations` create-once (`rev:initial` + RevisionHead). **OPS revise**: Model C successor revision + CAS. **Model C**: OPS-exercised headed persistence. **Certified**: SCI and/or OPS corpus coverage.

| Scientific Unit | Core | OPS create | OPS revise | Model C | Certified |
|-----------------|------|------------|------------|---------|-----------|
| Claim | COMPLETE — `createDraft` + Standing + VersionService | YES — `registerClaimUnit` | YES — Standing (`transitionClaimStanding`); **NO** material content OPS | YES | SCI + OPS |
| Evidence | COMPLETE — `createDraft` + Record State + VersionService | YES — `registerEvidenceUnit` | YES — Record State; **NO** material content OPS | YES | SCI + OPS |
| Grade | COMPLETE — `EvidenceGradeService.assign` (on Evidence) | N/A (no separate identity on OPS path — Option A) | YES — `assignEvidenceGrade` on EvidenceUnit | YES | SCI + OPS |
| Contradiction | COMPLETE — `createOpen` + Record State + VersionService | YES — `registerContradictionUnit` | YES — `transitionContradictionRecordState` | YES | SCI + OPS (023) |
| Negative Result | COMPLETE — `createRegistered` + `registered→withdrawn` + VersionService | **NO** | **NO** | **NO** (kind map exists) | SCI only |
| Verification | COMPLETE — `createPlanned` + leave-`planned` + VersionService | **NO** | **NO** | **NO** (kind map exists) | SCI only |

### Core lifecycle (remaining OPS-absent units)

| Unit | Issuance | Post-issuance | Human gate |
|------|----------|---------------|------------|
| Negative Result | `NegativeResultFactory.createRegistered(input, registration)` — issuance **is** Human-gated NRTE `(new)→registered` | `registered → withdrawn` (terminal) | registration **and** withdrawal; `decision_ref` required; `withdrawal_reason` for withdraw (`F7`); AI → `F5` |
| Verification | `VerificationFactory.createPlanned` → `planned` / outcome `pending` (empty VTE log; **not** Human-gated at create) | `planned → {passed, failed, inconclusive}` (terminal; outcome derived) | leaving `planned`; `decision_ref` required (`F7`) |

**FACT:** No OPS symbols for Negative Result or Verification under `apps/reference-app/`. No REF-OPS fixtures for either.

---

## 4. Remaining Core/OPS Gaps

| Gap | Semantic authority present? | Persistence sufficient? | Referenced entities OPS-operable? | Second graph needed? | Model C fit? | REF→CONF→CERT? | Unlocks later work? | Blocker for later capability? |
|-----|----------------------------|-------------------------|-----------------------------------|----------------------|--------------|----------------|---------------------|------------------------------|
| **Negative Result OPS** | YES (SCI-005) | YES (kind map) | Claim/Evidence/Contradiction YES; Verification NO (optional refs) | NO | YES | YES (additive OPS) | Claim `qualified_by` identities persistable; Verification optional `negative_result_refs` | Soft — not a hard blocker for Verification |
| **Verification OPS** | YES (SCI-006) | YES | Claim/Evidence/Contradiction YES; NR optional | NO | YES | YES | Claim `verified_via` identities persistable | Soft — not blocked by NR absence |
| Claim Standing add `qualified_by` / `verified_via` | Would require **Core** Standing redesign | N/A | After NR/Verification OPS | NO | N/A | Would touch SCI-001 | Bidirectional Claim↔NR/Verification after create | **Core change** — separate from NR/Verification OPS |
| Material content OPS (Claim/Evidence/Contradiction/NR/Verification VersionServices) | YES in Core | YES | YES for OPS units | NO | YES | YES | Content revisions without Record State change | Deferred across 020–023; not a frontier unlock for NR |
| Provenance packaging | Object-local only | Snapshot/journal exist | Units partial OPS | Risk of conflation | N/A | New profile risk | Literature / RO-Crate-shaped export | Not blocking OPS completion |
| DocumentArtifact / Literature | Evidence `literature_venue` + locator strings | No artifact store | N/A | Risk of second graph | N/A | Unknown | Computational biology citation | Premature |
| Generic lifecycle engine | Forbidden by 020–023 | Would reinvent Model C | — | Authority risk | — | — | Temptation only | **NOT JUSTIFIED** |

---

## 5. Negative Result Analysis

| Concern | Repository evidence |
|---------|---------------------|
| Core authority | `NegativeResultFactory.createRegistered` · `NegativeResultTransitionService.register` / `transition` · validator · reference-validator · version-service · event-builder |
| Creation | Human-gated issuance to `registered` in one factory call (registration input required; `to` must be `registered`) |
| States | `registered` \| `withdrawn` only |
| Transitions | Only `registered → withdrawn` |
| References | Optional `claim_refs` / `evidence_refs` / `contradiction_refs` / `verification_refs` — grammar-only; **no dereference** |
| Contradiction dependency | Soft — `contradiction_refs` optional; Contradiction now OPS-persistable (enables coexistence fixtures, not required for create) |
| Verification dependency | Soft — `verification_refs` optional; Core treats as opaque non-empty string; ENC asserts Verification identity grammar at assemble |
| ENC | `NegativeResultUnit`; content omits `ai_assisted` / `human_sponsor` (same OQ-023-002 class gap) |
| SER | Registered |
| Processor | `negative_result.record_transition` exists (non-OPS) |
| Model C | `NegativeResultUnit → CanonicalUnit` in `entity.ts`; keys/head/CAS reusable |
| OPS | **NONE** |
| Additive? | YES — fourth→**fifth** explicit per-unit OPS pair; no Persistence/ENC/SER redesign required |
| Hidden blockers | None found for Model C create + withdraw path; factory shape `(input, registration)` differs from Claim `createDraft` — SPEC must pin OPS API |

**FACT:** Negative Result does **not** require Verification or Contradiction to exist in Persistence.

---

## 6. Verification Analysis

| Concern | Repository evidence |
|---------|---------------------|
| Core authority | `VerificationFactory.createPlanned` · `VerificationTransitionService.createPlanned` / `transition` · outcome coupling · version-service |
| Creation | Ungated `planned` / `pending`; empty VTE log |
| Transitions | Leave `planned` to `passed` \| `failed` \| `inconclusive` (Human + `decision_ref`) |
| Target rule | ≥1 `claim_refs` OR ≥1 `evidence_refs` OR non-empty `artifact_ref` (ADM-T1 / F6) |
| References | Optional Contradiction / NR / grade_refs; NR refs grammar-only |
| Depends on Negative Result? | **NO** — `negative_result_refs` optional; transition does not require them |
| Depends on Contradiction? | **NO** — optional |
| ENC / SER / Processor | Complete (`VerificationUnit`) |
| OPS | **NONE** |
| Model C | Kind-mapped; reusable |
| Additive? | YES — sixth per-unit OPS path candidate |

**FACT:** Verification is **not** blocked by absence of Negative Result OPS. Ordering NR before Verification is justified by dependency *softness* (optional NR refs become real) and by simpler NR state machine — not by a hard prerequisite.

---

## 7. Provenance Analysis

| Axis | Where it lives today | Authority |
|------|----------------------|-----------|
| Scientific provenance | Core object `provenance` fields + scientific event logs (STE/ERTE/GAE/CRTE/NRTE/VTE) in ENC | Core |
| Operational audit | Persistence journal `ops.*` events + timeline projection | Operational only |
| Source locator | `Evidence.source.source_locator` + `source_class` (+ Verification `artifact_ref` opaque) | Core field grammar |
| Persistence history | Immutable CanonicalUnit rows + snapshot | Persistence |
| Revision lineage | `predecessor_revision_id` + RevisionHead | Persistence metadata ≠ scientific supersession |
| Research timeline | OPS `timeline` over member identities | Operational |

**Verdict:** Axes remain **sufficiently separated**. A formal Provenance packaging SPEC is **useful later**, **not blocking**, and **premature** while two Core units still lack OPS. Not required before Literature or AI as a hard gate — but Literature/AI should not precede completing research-semantics OPS coverage.

---

## 8. Literature / Document Boundary

| Present | Absent |
|---------|--------|
| Evidence `source_class` includes `literature_venue` | `DocumentArtifact` type |
| Opaque `source_locator` / `citation_refs` | Full-text store, DOI/PMID typed model, citation graph |
| Verification `artifact_ref` opaque string | Document ingestion pipeline |

**When Evidence becomes insufficient:** when AIP must treat documents as first-class scientific objects (versioned, cited by multiple Evidence units, with independent integrity) rather than as opaque locators on Evidence. That point has **not** been reached by any certified OPS consumer.

**Status:** **NOT YET JUSTIFIED** as next frontier.

---

## 9. Computational Biology Readiness

No Core types for genes, transcripts, proteins, variants, pathways, tissues, cell types, phenotypes, or simulation runs exist under `@sciros/core`.

**Status:** **PREMATURE**. Blocked by incomplete research-semantics OPS coverage and by absence of Literature/Document and Provenance packaging contracts that computational biology results would need to cite. Introducing biology entities now would invent a parallel domain ontology without OPS patterns for NR/Verification.

---

## 10. Search / Retrieval Readiness

No retrieval index, ranking service, or search API exists. Identity is exact (`claim:…`, `evidence:…`, etc.).

**Prerequisites for retrieval:** completed unit OPS surface (so indices are not incomplete), clear non-authoritative ranking rules (Standing ≠ search score), and usually Provenance/Literature if retrieval spans documents.

**Status:** **NOT YET JUSTIFIED**.

---

## 11. Knowledge Graph Readiness

Principle (ROADMAP-REVIEW-001 / prior discovery): **KG = DERIVED PROJECTION**, never second scientific authority.

Current scientific edges live in Core fields + ENC envelope references. `Persistence.Relationship` remains dormant. Graph projection over incomplete OPS unit coverage would be structurally incomplete and would pressure inventing edges.

**Status:** **NOT YET JUSTIFIED**; preferably after NR + Verification OPS and after clarifying Claim `qualified_by` / `verified_via` post-create story (Core, separate).

---

## 12. AI Research Layer Readiness

Core already gates AI via Human Reviewer rules (`F5`/`F6`/`F_AI` patterns). OPS certified paths require caller-supplied Human agents and deterministic event ids.

**Status:** AI as proposal/assistance layer is **architecturally contemplated** but **NOT YET JUSTIFIED** as a sprint frontier. Risk of authority leakage remains higher while NR/Verification lack OPS. ENC AI-marker omission for Contradiction/NR/Verification (OQ-023-002) remains deferred — not an AI product sprint.

---

## 13. Durable Infrastructure Readiness

In-memory Persistence Model C remains certified and sufficient. No certified multi-user, cross-process uniqueness, large corpus, or durable Workspace workload exists.

| Trigger | Present? |
|---------|----------|
| Process-restart continuity requirement | NO |
| Multi-user collaboration | NO |
| External ingestion volume | NO |
| Heavy computation / workers | NO |

**Status:** PostgreSQL, object storage, queues, OpenSearch, Neo4j, K8s, durable Workspace — **NOT JUSTIFIED**. Premature durability would freeze incomplete OPS surfaces (RR-002 / prior discovery).

---

## 14. Architectural Pressure Points

**Strongest justified pressure (post-023):**

**A. Research semantics incompleteness** — two Core-complete scientific units (Negative Result, Verification) still cannot be created or revised through Research Operations under Model C. The six-unit SCI model is SCI-certified but only four units (plus Grade-on-Evidence) are OPS-operable.

Secondary pressures (weaker / dependent):

| Category | Pressure now? |
|----------|---------------|
| A. Research semantics | **YES — primary** |
| B. Provenance packaging | Low — axes already separated |
| C. Literature/document | Low — Evidence locators suffice |
| D. Computational biology | None — no Core model |
| E. Search/retrieval | None |
| F. KG projection | Premature while NR/Verification OPS absent |
| G. AI proposal layer | Premature |
| H. Durable persistence | None |
| I. Multi-user/concurrency | None |
| J. Claim Standing `qualified_by`/`verified_via` creation-only | Real but **Core SCI-001** change — not OPS-only; weaker than former `contested_by` F7 pressure |

**FACT:** The former decisive pressure (Claim `contested` requiring non-persistable Contradiction) is **resolved**. The remaining Claim→NR/Verification links (`qualified_by` / `verified_via`) are **creation-only** and do **not** gate a Standing state — so pressure is softer, but still points at completing research-semantics OPS, not at infrastructure.

---

## 15. Candidate Frontiers

Candidates are analysed for dependencies — **not ranked**.

### Candidate A — Negative Result OPS under Model C

| Dimension | Assessment |
|-----------|------------|
| Evidence | Core complete; ENC/SER/Processor/SCI REF exist; OPS absent |
| Prerequisites satisfied | Claim/Evidence/Contradiction OPS; Model C; CONF/CERT pipeline |
| Prerequisites missing | OPS create/decode/transition/fixtures; SPEC for `(input, registration)` create shape |
| Architectural pressure | Completes next Core unit under OPS; enables persistable `qualified_by` targets |
| Scientific value | Absence/negative findings as first-class revisable objects (SCI-005) |
| Premature risk | Low — isomorphic to certified Standing/Record State/Contradiction paths |
| Unlocks | Soft enrichment of Verification refs; coexistence with Contradiction |
| New authority? | NO — Core remains sole |
| New persistence model? | NO |
| New infrastructure? | NO |
| REF→CONF→CERT reuse? | YES — additive `REF-OPS-106+` under `CONF-001@1.1.0-OPS` |

### Candidate B — Verification OPS under Model C

| Dimension | Assessment |
|-----------|------------|
| Evidence | Core complete; OPS absent |
| Prerequisites satisfied | Claim/Evidence/Contradiction OPS; Grade tokens exist; Model C |
| Prerequisites missing | OPS path; SPEC for createPlanned + leave-planned + outcome coupling |
| Pressure | Completes last primary unit |
| Soft dependency on NR | Optional `negative_result_refs` — not hard-blocked |
| Premature risk | Low if scoped tightly; slightly more complex than NR |
| New authority / persistence / infra? | NO / NO / NO |
| REF→CONF→CERT? | YES |

### Candidate C — Claim Standing extension for `qualified_by` / `verified_via`

| Dimension | Assessment |
|-----------|------------|
| Evidence | StandingTransitionInput lacks these fields; VersionService preserves only |
| Prerequisites | Would need NR and/or Verification identities meaningful — preferably after their OPS |
| Pressure | Real asymmetry vs `supported_by`/`contested_by` |
| Risk | **Core SCI-001 redesign** — not an OPS-only sprint |
| Classification | **DEFERRED** relative to NR/Verification OPS |

### Candidate D — Provenance packaging

| Dimension | Assessment |
|-----------|------------|
| Evidence | Object-local provenance already mandatory |
| Pressure | Low |
| Risk | Premature packaging before OPS unit completeness |
| Classification | Independent / later (Phase R2) |

### Candidate E — DocumentArtifact / Literature

| Dimension | Assessment |
|-----------|------------|
| Evidence | `literature_venue` + locator strings suffice today |
| Pressure | None from certified OPS |
| Classification | Premature |

### Candidate F — Material content OPS (VersionServices)

| Dimension | Assessment |
|-----------|------------|
| Evidence | Core VersionServices exist for Claim/Evidence/Contradiction/NR/Verification |
| Pressure | Deferred repeatedly (OQ-023-011 class) |
| Classification | Cross-cutting; not the research-semantics completion frontier |

---

## 16. Dependency Graph

Evidence-supported (not the illustrative template):

```
Research Semantics Completion (Phase R1)
│
├── Claim OPS + Standing ────────────── CERTIFIED (020)
├── Evidence OPS + Record State ─────── CERTIFIED (019–021)
├── Grade OPS (Option A on Evidence) ── CERTIFIED (022)
├── Contradiction OPS ───────────────── CERTIFIED (023)
│         ↑
│         closed Claim.contested_by F7 pressure
│
├── Negative Result OPS ─────────────── JUSTIFIED NEXT (this discovery)
│         · optional contradiction_refs now resolve to OPS-persistable targets
│         · does not require Verification OPS
│
└── Verification OPS ────────────────── FOLLOWS NR in research-semantics track
          · optional negative_result_refs benefit if NR already persistable
          · not hard-blocked by NR absence

After research-semantics OPS completion (NR + Verification):
    Provenance packaging (R2)
        → Literature / DocumentArtifact (R3)
            → Computational biology / analysis plane (R4+)
                → Retrieval (non-authoritative)
                    → KG projection (derived only)
                        → AI proposal layer (non-authority)
                            → Durable infrastructure (when triggers exist)
                                → Multi-user / distributed
```

**Second graph / second journal risk:** unchanged — any next SPEC MUST forbid `Persistence.Relationship` as scientific storage and MUST reuse the sole Persistence journal (Sprint 023 discipline).

---

## 17. JUSTIFIED NEXT FRONTIER

### Negative Result OPS under Model C

**What makes it justified now**

1. Sprint 023 removed the prior decisive blocker (Contradiction OPS / `contested_by`). The remaining Phase R1 incompleteness is exactly **NR + Verification**.
2. Negative Result is Core-complete, ENC/SER/Processor-ready, Persistence kind-mapped, and has a **simpler** Record State machine (`registered`/`withdrawn`) than Verification.
3. Its create path already embeds Human-gated issuance — OPS can orchestrate without inventing gates.
4. Optional `contradiction_refs` can now cite **real** OPS-persistable Contradiction units (coexistence evidence), without requiring those refs.
5. It fits the certified Model C / per-unit OPS pattern without Persistence, ENC, SER, CONF, or CERT redesign.
6. It does **not** require Verification OPS first (soft optional refs only).

**Dependencies it resolves**

- Makes Negative Result identities OPS-persistable (targets for Claim `qualified_by` at Claim create-time).
- Softly prepares Verification optional `negative_result_refs` for coexistence fixtures.

**Future work it enables**

- Verification OPS as the subsequent research-semantics completion step.
- Later Claim Standing designs for post-create `qualified_by` (Core change — separate).
- Cleaner Phase R2 Provenance packaging over a more complete unit set.

**What it does NOT require yet**

- DocumentArtifact, Literature crawlers, KG, AI, durable DB, search, multi-user, generic lifecycle engine, Claim Standing redesign, ENC AI-marker fix (OQ-023-002 remains deferred).

**Why other areas are not justified as next**

| Area | Why not next |
|------|----------------|
| Verification OPS | Valid candidate; not hard-blocked; better sequenced **after** NR so optional NR refs can be real; slightly richer Core contract |
| Claim Standing `qualified_by`/`verified_via` | Core SCI-001 redesign — not OPS-only |
| Provenance packaging | Axes already separated; packaging before OPS completeness freezes incomplete surfaces |
| Literature / DocumentArtifact | Evidence locators still sufficient |
| Computational biology | No Core biology model; depends on literature/provenance |
| Search / KG / AI | Non-authoritative projections/assists; incomplete unit OPS would make them structurally incomplete |
| Durable infrastructure | No durability trigger |
| Material content OPS | Deferred cross-cutting; not the Phase R1 completion frontier |
| Generic lifecycle | Explicitly NOT JUSTIFIED (020–023) |

---

## 18. What Must NOT Be Built Yet

| Item | Status |
|------|--------|
| PostgreSQL / Redis / Kafka | Premature |
| Neo4j / RDF store as authority | Forbidden as second scientific graph |
| OpenSearch / vector DB | Premature |
| Python / Nextflow / biology pipelines | Premature |
| Kubernetes / distributed workers | Premature |
| LLM / RAG as authority | Forbidden; AI product layer premature |
| FHIR | Out of scope |
| Durable Workspace / multi-user | Premature |
| Frontend / public API | Premature |
| DocumentArtifact ingestion | Premature |
| Generic `ScientificUnitLifecycle` / `postPersistTransition()` | NOT JUSTIFIED |
| `Persistence.Relationship` scientific store | Forbidden |
| Second event journal | Forbidden |
| ENC redesign for AI markers in Sprint 024 | Deferred (OQ-023-002 class) |
| Claim Standing Core redesign for `qualified_by`/`verified_via` | Deferred (separate Core discovery) |

---

## 19. NEXT SPEC Boundary

**NEXT SPEC SHOULD ADDRESS:** Negative Result OPS under Model C — create-once + post-persist withdraw — Core-delegated only.

| Concern | Boundary |
|---------|----------|
| Architectural problem | Core NR exists; OPS cannot persist or withdraw headed `NegativeResultUnit` revisions |
| Scope | `registerNegativeResultUnit` (name TBD) orchestrating `NegativeResultFactory.createRegistered`; `transitionNegativeResultRecordState` orchestrating `NegativeResultTransitionService.transition`; OPS-local decode; Model C `unit_kind=NegativeResultUnit`; optional ops event; additive REF-OPS from **106**; existing CONF/CERT |
| Scientific authority | Core only — no OPS vocabulary, no new states |
| Persistence | Reuse create / ensureInitialHead / advanceHead / journal — **no redesign** |
| OPS | Fifth explicit per-unit path — **no generic engine** |
| ENC / SER | Unchanged; accept AI-marker decode lossiness |
| REF / CONF / CERT | Additive OPS fixtures; `CONF-001@1.1.0-OPS`; single engines |
| Explicit non-goals | Verification OPS; Claim Standing redesign; material VersionService OPS; Relationship store; DocumentArtifact; AI; DB; API; UI; KG; provenance packaging; ENC AI-marker fix |

SPEC must pin:

- Exact OPS create signature given Core `createRegistered(input, registration)`
- Whether create emits NRTE-only scientific history (no create-once ops event — Claim/Evidence/Contradiction parity)
- Withdraw path: Human + `decision_ref` + `withdrawal_reason`
- Reference assertion from ENC payload (not `entity.references`)
- Relationship non-use filter (`entity_kind: "Relationship"`)
- Deterministic caller-supplied `event_id` on certified paths (NRTE / ops)

---

## 20. Non-Goals

Discovery-024 itself does not authorize EXEC, Core changes, infrastructure, or SPEC writing beyond this boundary recommendation.

Sprint 024 (when specified) must not absorb Verification OPS, Claim Standing redesign, material content OPS, or infrastructure.

---

## 21. Open Questions

| ID | Question | For |
|----|----------|-----|
| **OQ-024-001** | Exact OPS create API for `createRegistered(input, registration)` — single method vs split? | SPEC-024 |
| **OQ-024-002** | Operational event type name for NR revision (e.g. `ops.negative_result_record_state_revision`)? | SPEC-024 |
| **OQ-024-003** | Should certified fixtures demonstrate Contradiction coexistence via `contradiction_refs`? | SPEC-024 |
| **OQ-024-004** | ENC AI-marker omission for NR (and Verification) — remain deferred with Contradiction? | ENC/SCI discovery (carry OQ-023-002) |
| **OQ-024-005** | Claim `qualified_by` post-create Standing — still Core-only deferred? | Separate SCI-001 discovery |
| **OQ-024-006** | Core `verification_refs` opaque string vs ENC Verification id grammar — document boundary only? | SPEC-024 observation |
| **OQ-024-007** | Sequence Verification OPS immediately after NR certification, or re-discover? | After CERT-024 / DISCOVERY-025 |

---

## 22. Final Discovery Status

Evidence is sufficient to identify the next research/architecture frontier without inventing technologies or ranking scores.

**JUSTIFIED NEXT FRONTIER:** Negative Result OPS under Model C.

**DISCOVERY-024 — READY FOR SPEC-024**

---

DISCOVERY-024 FINAL VERDICT
===========================

Baseline:
207365fb260b9e334bb60f16252ab3f445411dd6 (Sprint 023 CLOSED)

Primary pressure:
Research semantics incompleteness (NR + Verification OPS absent)

JUSTIFIED NEXT FRONTIER:
Negative Result OPS under Model C

Why now:
Contradiction OPS closed contested_by pressure; NR is next Core-complete / OPS-absent unit with simpler state machine; Model C/ENC/SER/CONF/CERT ready; no hard Verification dependency

Why not Verification first:
Soft optional NR refs; richer Core contract; sequence after NR in Phase R1

Why not Provenance / Literature / Bio / Search / KG / AI / Durable infra:
Premature or dependent; axes already separated; no durability trigger; second-graph risk

Generic lifecycle:
NOT JUSTIFIED

Second scientific graph / second journal:
FORBIDDEN

Next:
SPEC-024 (Negative Result OPS Under Model C) — when separately commanded

Implementation authorization:
NO

Commit / push:
NONE

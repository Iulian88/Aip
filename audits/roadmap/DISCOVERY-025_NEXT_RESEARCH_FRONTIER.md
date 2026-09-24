# DISCOVERY-025 — Next Research Frontier

**Type:** Read-only architecture / roadmap discovery after Sprint 024  
**Mode:** No source, test, SPEC, or certification changes · no SPEC-025 · no commit · no push  
**Classification legend:** FACT | DEPENDENCY | OBSERVATION | OPEN QUESTION | DEFERRED | NOT APPLICABLE

Every status below is derived from the repository at the stated commit (source, fixtures, profiles, certification artifacts), not from documentation alone. Where a document and the code differ, the code is reported.

---

## 1. Baseline

| Item | Value |
|------|-------|
| Sprint 024 | FORMALLY CERTIFIED AND CLOSED — Negative Result OPS Under Model C |
| Commit | `47efca41c429c5de8bfc96da4c06082bc4c1e91c` — `cert(sprint-024): certify Negative Result OPS under Model C` |
| `git rev-parse HEAD` | `47efca41c429c5de8bfc96da4c06082bc4c1e91c` |
| `git rev-parse origin/main` | `47efca41c429c5de8bfc96da4c06082bc4c1e91c` |
| HEAD == origin/main | YES |
| Working tree at discovery start | CLEAN |
| Certified corpus | SCI **44/44** · OPS **133/133** · FULL **177/177** |
| Profiles | `CONF-001@1.0.0` (SCI) · `CONF-001@1.1.0-OPS` (OPS, evaluated on FULL) |
| Engines | one `ConformanceEngine` · one `CertificationEngine` |
| Highest OPS fixture | `REF-OPS-133` → next free additive id **`REF-OPS-134`** |
| Certified OPS post-persist paths | Claim Standing (020) · Evidence Record State (021) · Grade (022) · Contradiction Record State (023) · Negative Result Record State (024) |
| OPS decode helpers | `claimFromClaimUnitPayload` · `evidenceFromEvidenceUnitPayload` · `contradictionFromContradictionUnitPayload` · `negativeResultFromNegativeResultUnitPayload` |

Documents read: DISCOVERY-024, SPEC/IMPLEMENTATION-DECISION/ARCHITECTURE-AUDIT/FINAL-RE-AUDIT/EXEC/CODE-AUDIT/CERTIFICATION-024, IMPLEMENTATION.md, ROADMAP prior discovery chain.  
Source inspected: `packages/core/src/{claim,evidence,grade,contradiction,negative-result,verification}`, `packages/encoding/src/{builder,validator,registry}.ts`, `packages/persistence/src/entity.ts`, `packages/serialization/src/json/**`, `packages/processor/src/**`, `packages/conformance`, `packages/certification`, `packages/reference-tests/src/fixtures/**`, `apps/reference-app/src/**`.

Repository modifications by this discovery: **this file only**.

---

## 2. Current Scientific Architecture

| Layer | Status at baseline |
|-------|-------------------|
| Scientific Core (SCI-000…006) | COMPLETE for Claim, Evidence, Grade, Contradiction, Negative Result, Verification |
| ENC / SER | All six unit kinds assemble + SER-JSON registered |
| Persistence Model C | Generic by `unit_kind`; ClaimUnit / EvidenceUnit / ContradictionUnit / NegativeResultUnit OPS-exercised; VerificationUnit kind-mapped but **never OPS-persisted** |
| Research Operations | Claim create + Standing; Evidence create + Record State + Grade; Contradiction create + Record State; Negative Result create + Record State |
| REF → CONF → CERT | SCI 44/44 · OPS 133/133 · FULL 177/177 · both profiles COMPLIANT · CERTIFIED |
| Sole scientific authority | Core |
| Sole operational journal | Persistence event journal |
| Sole Persistence mechanism | In-memory Model C repository |
| Dormant `Persistence.Relationship` | Still unused as scientific storage (Sprint 023–024 certified boundary) |

**FACT:** Sprint 024 closed Negative Result OPS under Model C (`registerNegativeResultUnit` / `transitionNegativeResultRecordState`, REF-OPS-106…133). Phase R1 (research-semantics OPS completion) now has **one** remaining Core-complete / OPS-absent primary unit: **Verification**.

---

## 3. Current OPS Coverage

Legend — **Core**: scientific semantics in `@sciros/core`. **OPS create**: `ResearchOperations` create-once (`rev:initial` + RevisionHead). **OPS revise**: Model C successor revision + CAS. **Model C**: OPS-exercised headed persistence. **Certified**: SCI and/or OPS corpus coverage.

| Scientific Unit | Core | OPS create | OPS revise | Model C | Certified |
|-----------------|------|------------|------------|---------|-----------|
| Claim | COMPLETE — `createDraft` + Standing + VersionService | YES — `registerClaimUnit` | YES — Standing (`transitionClaimStanding`); **NO** material content OPS | YES | SCI + OPS |
| Evidence | COMPLETE — `createDraft` + Record State + VersionService | YES — `registerEvidenceUnit` | YES — Record State; **NO** material content OPS | YES | SCI + OPS |
| Grade | COMPLETE — `EvidenceGradeService.assign` (on Evidence) | N/A (Option A — no separate OPS identity) | YES — `assignEvidenceGrade` on EvidenceUnit | YES | SCI + OPS |
| Contradiction | COMPLETE — `createOpen` + Record State + VersionService | YES — `registerContradictionUnit` | YES — `transitionContradictionRecordState` | YES | SCI + OPS |
| Negative Result | COMPLETE — `createRegistered` + `registered→withdrawn` + VersionService | YES — `registerNegativeResultUnit` | YES — `transitionNegativeResultRecordState` | YES | SCI + OPS (024) |
| Verification | COMPLETE — `createPlanned` + leave-`planned` + VersionService | **NO** | **NO** | **NO** (kind map exists) | SCI only |

### Core lifecycle (remaining OPS-absent unit)

| Unit | Issuance | Post-issuance | Human gate |
|------|----------|---------------|------------|
| Verification | `VerificationFactory.createPlanned(input)` → `planned` / outcome `pending` (empty VTE log; **not** Human-gated at create) | `planned → {passed, failed, inconclusive}` (terminal; outcome derived by Core) | leaving `planned`; Human Reviewer + non-empty `decision_ref` (`F7` / `F_TRANSITION`); concluded states require matching Human VTE (`F8` / VRR-1) |

**FACT:** No OPS symbols for Verification under `apps/reference-app/`. No REF-OPS fixtures for Verification. SCI fixtures `REF-VERIF-*` exist.

---

## 4. Verification Readiness

| Concern | Repository evidence |
|---------|---------------------|
| Meaning in Core | SCI-006 — protocol-scoped verification of Claim/Evidence/artifact targets; **not** Claim Standing; **not** truth confirmation (`truth_confirmed` forbidden `F13`) |
| Factory | `VerificationFactory.createPlanned(input)` |
| Transition service | `VerificationTransitionService.createPlanned` / `transition` |
| States | `planned` \| `passed` \| `failed` \| `inconclusive` |
| Outcomes | Coupled: `planned↔pending`, `passed↔passed`, `failed↔failed`, `inconclusive↔inconclusive` (Core `F5`) |
| Methods | `reproduction` \| `protocol_conformance` \| `envelope_check` \| `other` |
| Target rule ADM-T1 / F6 | ≥1 `claim_refs` **OR** ≥1 `evidence_refs` **OR** non-empty `artifact_ref` |
| References | Optional `grade_refs` / `contradiction_refs` / `negative_result_refs` — grammar-only; **no dereference** |
| Claim / Evidence / Contradiction / NR OPS-operable? | **YES** — all four referenced scientific unit kinds now OPS-persistable |
| Grade refs | Token grammar (`isAllowedGradeRefEntry`); Grade OPS exists on Evidence |
| `artifact_ref` | Opaque non-empty string — **does not** require DocumentArtifact |
| ENC | `CanonicalEncoder.buildVerification` → `VerificationUnit`; roles `verifies_claim` / `verifies_evidence` / `related_negative_result` / `related_contradiction` / `grade_ref` |
| SER | Registered (`VerificationUnit`) |
| Processor | `verification.record_transition` exists (non-OPS) |
| Persistence | `VerificationUnit → CanonicalUnit` in `entity.ts`; Model C keys/head/CAS reusable |
| OPS | **NONE** |
| Model C sufficient? | **YES** — same create / ensureInitialHead / create successor / advanceHead pattern as 020–024 |
| Missing Core semantics blocking OPS? | **NONE** found for createPlanned + leave-planned path |
| Requires Claim/Evidence redesign? | **NO** — refs are grammar-only; no reverse sync required |
| Second graph / journal? | **NO** — ENC envelope refs + sole Persistence journal suffice |
| New provenance/evidence boundary? | Object-local `provenance` already mandatory; `artifact_ref` remains opaque locator — **no new authority plane** |

### Distinction required by this discovery

| Framing | Verdict |
|---------|---------|
| “Verification is next **because dependencies are satisfied**” | **SUPPORTED** — see below |
| “Verification is next **merely because it is the last remaining unit**” | **INSUFFICIENT alone** — lastness is correlative, not causal |

**Dependency-satisfaction evidence (not mere lastness):**

1. DISCOVERY-024 sequenced Verification **after** NR so optional `negative_result_refs` could cite OPS-persistable NR — that soft dependency is now **satisfied** (Sprint 024).
2. ADM-T1 scientific targets (Claim / Evidence) are OPS-operable; coexistence fixtures for Contradiction / NR / Grade tokens are possible without inventing stores.
3. Claim create-time `verified_via` can cite OPS-persistable Verification identities (soft unlock parallel to post-023 `contested_by` / post-024 `qualified_by` coexistences) — without requiring Claim Standing redesign.
4. Completing Verification OPS **closes Phase R1** (research-semantics OPS coverage for all six SCI units + Grade Option A), which is an architectural completion criterion — not a list-order preference.
5. Five prior Model C OPS paths prove the orchestration pattern; Verification does not invent a new persistence model.

**Hidden complexity SPEC must pin (not blockers):** outcome/state coupling (Core-owned); createPlanned has empty VTE (no create-once Human gate); leave-planned Human + `decision_ref`; three terminal edges vs NR’s single withdraw; ENC may omit `ai_assisted`/`human_sponsor` in content (same deferred OQ class as NR/Contradiction).

---

## 5. Provenance Readiness

| Axis | Where it lives today | Authority |
|------|----------------------|-----------|
| Scientific provenance | Core object `provenance` fields + scientific event logs (STE/ERTE/GAE/CRTE/NRTE/VTE) in ENC | Core |
| Operational audit | Persistence journal `ops.*` events + timeline projection | Operational only |
| Source locator | `Evidence.source.source_locator` + `source_class` (+ Verification `artifact_ref` opaque) | Core field grammar |
| Persistence history | Immutable CanonicalUnit rows + snapshot | Persistence |
| Revision lineage | `predecessor_revision_id` + RevisionHead | Persistence metadata ≠ scientific supersession |
| Research timeline | OPS `timeline` over member identities | Operational |

**Verdict:** Axes remain **sufficiently separated**. No conflation requiring an emergency Provenance SPEC before Verification OPS.

A formal Provenance packaging SPEC becomes **more justified after** Verification OPS (complete unit set for packaging), but is **not** a prerequisite for Verification OPS and is **premature** as the *next* frontier while Phase R1 remains incomplete.

W3C PROV / RO-Crate: **NOT JUSTIFIED** as an import now — no architectural trigger requires adopting an external provenance ontology before finishing research-semantics OPS.

---

## 6. Literature / Document Readiness

| Present | Absent |
|---------|--------|
| Evidence `source_class` includes `literature_venue` | `DocumentArtifact` type |
| Opaque `source_locator` / `citation_refs` | Full-text store, DOI/PMID typed model, citation graph |
| Verification `artifact_ref` opaque string | Document ingestion pipeline |

**When Evidence/artifact_ref becomes insufficient:** when AIP must treat documents as first-class scientific objects (versioned, multi-Evidence citation, independent integrity) rather than opaque locators. No certified OPS consumer has reached that point.

**Status:** **NOT YET JUSTIFIED** as next frontier. Literature can remain an external/source-locator concern. Verification OPS does **not** require DocumentArtifact.

---

## 7. Computational Biology Readiness

No Core types for genes, transcripts, proteins, variants, pathways, tissues, cell types, phenotypes, assays-as-domain-objects, or simulation runs exist under `@sciros/core`.

**Missing primitives (architecture level):** biological entity ontology; measurement/observation types distinct from Evidence; analysis-run provenance; dataset identity — all absent.

**Status:** **PREMATURE**. Blocked by incomplete research-semantics OPS (Verification) and by absence of Literature/Document and Provenance packaging contracts that computational biology results would need to cite. Introducing biology entities now would invent a parallel domain ontology without OPS patterns for Verification.

---

## 8. Search / Retrieval Readiness

No retrieval index, ranking service, or search API exists. Identity is exact (`claim:…`, `evidence:…`, `verification:…`, etc.).

**Prerequisites for retrieval:** completed unit OPS surface (so indices are not incomplete), clear non-authoritative ranking rules (Standing / Verification outcome ≠ search score), and usually Provenance/Literature if retrieval spans documents.

Search modality (lexical / structured / semantic / hybrid) is a **later design** concern — infrastructure must not be selected now.

**Status:** **NOT YET JUSTIFIED**. Prefer freezing Verification OPS (and ideally Provenance packaging) before retrieval becomes a frontier.

---

## 9. Knowledge Graph Readiness

Principle (ROADMAP-REVIEW-001 / prior discovery): **KG = DERIVED PROJECTION**, never second scientific authority.

Current scientific edges live in Core fields + ENC envelope references. `Persistence.Relationship` remains dormant. Graph projection over incomplete OPS unit coverage (Verification absent) would be structurally incomplete and would pressure inventing edges.

**Status:** **NOT YET JUSTIFIED**; preferably after Verification OPS and after clarifying Claim `qualified_by` / `verified_via` post-create story (Core, separate).

---

## 10. AI Research Readiness

Existing boundary: **AI = proposal / assistance only** — Core already gates AI via Human Reviewer rules (`F5`/`F7`/`F_AI` patterns). OPS certified paths require caller-supplied Human agents and deterministic event ids.

**What must exist before AI can safely interact:** deterministic scientific authority (Core), Human gates, complete OPS unit surface for grounding proposals, non-authoritative proposal schemas, citation/identity grounding — **not** an LLM, RAG stack, or agent runtime.

**Status:** AI research layer is **architecturally contemplated** but **NOT YET JUSTIFIED** as a sprint frontier. Completing Verification OPS reduces incompleteness risk for future AI grounding. ENC AI-marker omission for Contradiction/NR/Verification remains deferred — not an AI product sprint.

---

## 11. Durable Infrastructure Readiness

In-memory Persistence Model C remains certified and sufficient. No certified multi-user, cross-process uniqueness, large corpus, or durable Workspace workload exists.

| Trigger | Present? |
|---------|----------|
| Process-restart continuity requirement | NO |
| Multi-user collaboration | NO |
| External ingestion volume | NO |
| Heavy computation / workers | NO |
| Large-scale querying | NO |

**Status:** PostgreSQL, object storage, queues, OpenSearch, Neo4j, K8s, durable Workspace — **NOT JUSTIFIED**. Premature durability would freeze incomplete OPS surfaces.

---

## 12. Dependency Graph

Evidence-supported:

```
Research Semantics Completion (Phase R1)
│
├── Claim OPS + Standing ────────────── CERTIFIED (020)
├── Evidence OPS + Record State ─────── CERTIFIED (019–021)
├── Grade OPS (Option A on Evidence) ── CERTIFIED (022)
├── Contradiction OPS ───────────────── CERTIFIED (023)
├── Negative Result OPS ─────────────── CERTIFIED (024)
│         ↑ soft NR→Verification optional refs now OPS-real
│
└── Verification OPS ────────────────── JUSTIFIED NEXT (this discovery)
          · dependencies satisfied (not mere lastness)
          · closes Phase R1

After research-semantics OPS completion (Verification):
    Provenance packaging (R2)  ←── parallel-capable with Claim Standing Core extension
        → Literature / DocumentArtifact (R3)
            → Computational biology / analysis plane (R4+)
                → Retrieval (non-authoritative)
                    → KG projection (derived only)
                        → AI proposal layer (non-authority)
                            → Durable infrastructure (when triggers exist)
                                → Multi-user / distributed

Parallel (not Phase R1):
    Material content OPS (VersionServices) — cross-cutting deferred
    Claim Standing post-create qualified_by / verified_via — Core SCI-001 redesign
```

**Unsafe ordering:**

| Order | Risk |
|-------|------|
| Literature / Bio / Search / KG / AI / Durable **before** Verification OPS | Incomplete scientific surface; premature infrastructure freeze |
| KG as authority / `Persistence.Relationship` scientific store | Second scientific source of truth |
| Claim Standing Core redesign **as substitute for** Verification OPS | Wrong layer; does not complete Phase R1 |
| Generic lifecycle engine | Authority / Model C reinvention — NOT JUSTIFIED |

**Optional dependencies for Verification OPS:** none hard-required beyond existing Claim/Evidence OPS (ADM-T1). NR/Contradiction/Grade refs optional for coexistence fixtures.

**Second graph / second journal risk:** unchanged — any next SPEC MUST forbid `Persistence.Relationship` as scientific storage and MUST reuse the sole Persistence journal.

---

## 13. Candidate Frontier Analysis

Candidates analysed for dependencies — **not ranked**.

### A. Verification OPS under Model C

| Dimension | Assessment |
|-----------|------------|
| Scientific value | Completes SCI-006 as OPS-operable revisable objects; enables Claim `verified_via` coexistence |
| Architectural readiness | Core/ENC/SER/Processor/Persistence kind map complete |
| Dependency readiness | **SATISFIED** — Claim/Evidence/Contradiction/NR OPS; Grade tokens; Model C; CONF/CERT |
| Current blockers | OPS path + SPEC only (createPlanned, leave-planned, decode, fixtures) |
| Specifiable now? | **YES** |
| Wait? | **NO** — Phase R1 incompleteness is the primary pressure |
| Risk if too early | Low if scoped tightly to Core-delegated create + leave-planned |
| Risk if delayed | Leaves six-unit SCI model OPS-incomplete; blocks clean R2 packaging |

### B. Provenance / Projection Model

| Dimension | Assessment |
|-----------|------------|
| Scientific value | Packaging/export clarity across units |
| Architectural readiness | Axes already separated; packaging not blocking |
| Dependency readiness | Better **after** Verification OPS (complete unit set) |
| Blockers | None urgent |
| Specifiable now? | Possible but premature as *next* |
| Wait? | **YES** until Phase R1 closes |
| Risk if too early | Freezes packaging over incomplete OPS surface |

### C. Literature / DocumentArtifact boundary

| Dimension | Assessment |
|-----------|------------|
| Scientific value | First-class documents |
| Readiness | Evidence locators + Verification `artifact_ref` suffice |
| Wait? | **YES** |
| Risk if too early | Parallel document ontology without consumers |

### D. Computational Biology primitives

| Dimension | Assessment |
|-----------|------------|
| Readiness | No Core biology types |
| Wait? | **YES** — premature |
| Risk if too early | Domain ontology without research-semantics OPS completion |

### E. Search / Retrieval

| Dimension | Assessment |
|-----------|------------|
| Wait? | **YES** — prefer complete OPS unit surface |
| Risk if too early | Incomplete indices; Standing/Verification confused with ranking |

### F. Knowledge Graph projection

| Dimension | Assessment |
|-----------|------------|
| Wait? | **YES** — derived only; incomplete without Verification OPS |
| Risk if too early | Second-authority pressure |

### G. AI Research Layer

| Dimension | Assessment |
|-----------|------------|
| Wait? | **YES** — proposal layer premature; Human gates exist |
| Risk if too early | Authority leakage |

### H. Durable Persistence

| Dimension | Assessment |
|-----------|------------|
| Trigger present? | **NO** |
| Wait? | **YES** |

### I. Multi-user / concurrency

| Dimension | Assessment |
|-----------|------------|
| Trigger present? | **NO** |
| Wait? | **YES** |

### J. Human Biology computational model / K. Simulation

| Dimension | Assessment |
|-----------|------------|
| Wait? | **YES** — depend on D + provenance/literature |

### Additional candidates (not primary)

| Candidate | Classification |
|-----------|----------------|
| Claim Standing extension for post-create `qualified_by` / `verified_via` | **DEFERRED** — Core SCI-001 redesign; not OPS-only; parallel after Verification OPS possible |
| Material content OPS (VersionServices) | **DEFERRED** — cross-cutting; not Phase R1 completion |
| Generic lifecycle engine | **NOT JUSTIFIED** |
| ENC AI-marker fix (OQ-024-001 class) | **DEFERRED** — ENC/SCI discovery; not next OPS frontier |

---

## 14. Recommended Next Frontier

### Verification OPS under Model C

**What makes it justified now (dependency-safe):**

1. Sprint 024 closed Negative Result OPS; the soft DISCOVERY-024 sequencing dependency (optional `negative_result_refs` → persistable NR) is **satisfied**.
2. Verification is Core-complete, ENC/SER/Processor-ready, Persistence kind-mapped, SCI-fixture-covered, and has a clear create + leave-planned Record State machine owned entirely by Core.
3. All scientific reference targets used by Verification that are first-class units (Claim, Evidence, Contradiction, Negative Result) are OPS-operable; Grade refs are token-based with Grade OPS present; `artifact_ref` remains opaque without DocumentArtifact.
4. It fits the certified Model C / per-unit OPS pattern without Persistence, ENC, SER, CONF, or CERT redesign.
5. It closes **Phase R1** — research-semantics OPS coverage for the full SCI unit set — which is an architectural completion criterion supported by the dependency graph, not mere list-order lastness.
6. Soft unlock: Claim create-time `verified_via` can cite OPS-persistable Verification identities (coexistence), without Claim Standing redesign.

**What it does NOT require yet:** DocumentArtifact, Literature crawlers, KG, AI, durable DB, search, multi-user, generic lifecycle, Claim Standing Core redesign, ENC AI-marker fix, Provenance packaging SPEC.

**Architectural tensions before another OPS expansion?**

| Tension | Blocks Verification OPS? |
|---------|--------------------------|
| ENC AI-marker omit for Verification content | **NO** — deferred OQ class; same as NR/Contradiction |
| Claim Standing lacks post-create `qualified_by`/`verified_via` | **NO** — Core redesign; separate track |
| Outcome/state coupling complexity | **NO** — Core-owned; SPEC must pin OPS non-invention |
| `artifact_ref` vs DocumentArtifact | **NO** — opaque string sufficient |
| Provenance axis separation | **NO** — intact |
| Second graph / journal temptation | **NO** if SPEC forbids Relationship scientific store |

**Conclusion:** No architectural decision gate is required *before* SPEC-025 for Verification OPS. Tensions exist as deferred open questions, not as blockers.

---

## 15. Deferred Work

| Item | Status |
|------|--------|
| PostgreSQL / Redis / Kafka | Premature |
| Neo4j / RDF store as authority | Forbidden as second scientific graph |
| OpenSearch / vector DB | Premature |
| Python / Nextflow / biology pipelines | Premature |
| Kubernetes / distributed workers | Premature |
| LLM / RAG as authority | Forbidden; AI product layer premature |
| FHIR / clinical features | Out of scope (`ethics_constraint_marker: non_clinical`) |
| Durable Workspace / multi-user | Premature |
| Frontend / public API | Premature |
| DocumentArtifact ingestion | Premature |
| Simulation / advanced research | Premature |
| Generic `ScientificUnitLifecycle` / `postPersistTransition()` | NOT JUSTIFIED |
| `Persistence.Relationship` scientific store | Forbidden |
| Second event journal | Forbidden |
| ENC redesign for AI markers | Deferred (OQ-024-001 / OQ-023-002 class) |
| Claim Standing Core redesign for post-create `qualified_by`/`verified_via` | Deferred (separate SCI-001 discovery) |
| Material VersionService OPS | Deferred cross-cutting |
| Provenance packaging / W3C PROV import | Deferred until after Phase R1 |
| Search / KG / AI research layer | Deferred |

---

## 16. Risks

| Risk | Mitigation for next SPEC |
|------|--------------------------|
| Treating Verification as “last item” without dependency narrative | This discovery records dependency-satisfaction explicitly |
| OPS inventing outcome/state vocabulary | Delegate exclusively to Core `VerificationTransitionService` |
| Automatic Claim Standing / `verified_via` reverse sync | Forbid — coexistence only (Claim create-time refs) |
| Using `Persistence.Relationship` | Forbid as scientific store |
| Second event journal | Reuse sole Persistence journal; optional ops event only |
| Expanding into DocumentArtifact via `artifact_ref` | Keep opaque; no DocumentArtifact in Sprint 025 |
| Generic lifecycle temptation after six unit paths | Explicitly NOT JUSTIFIED |
| Absorbing Claim Standing Core redesign | Out of scope for Verification OPS SPEC |
| Premature Provenance packaging | Separate Phase R2 after CERT-025 |

---

## 17. Discovery Decision

Evidence is sufficient to identify the next research/architecture frontier without inventing technologies or ranking scores.

**JUSTIFIED NEXT FRONTIER:** Verification OPS under Model C.

**Justification class:** Dependency-safe Phase R1 completion — **not** mere last-remaining-unit preference.

### NEXT SPEC Boundary (constraint guidance only — not SPEC-025)

**NEXT SPEC SHOULD ADDRESS:** Verification OPS under Model C — create-once + post-persist leave-planned — Core-delegated only.

| Concern | Boundary |
|---------|----------|
| Architectural problem | Core Verification exists; OPS cannot persist or conclude headed `VerificationUnit` revisions |
| Scope | OPS create orchestrating `VerificationFactory.createPlanned`; OPS transition orchestrating `VerificationTransitionService.transition` (`planned → passed|failed|inconclusive`); OPS-local decode; Model C `unit_kind=VerificationUnit`; optional ops event; additive REF-OPS from **134**; existing CONF/CERT |
| Scientific authority | Core only — no OPS vocabulary, no new states/outcomes |
| Persistence | Reuse create / ensureInitialHead / advanceHead / journal — **no redesign** |
| OPS | Sixth explicit per-unit path — **no generic engine** |
| ENC / SER | Unchanged; accept AI-marker decode lossiness if present |
| REF / CONF / CERT | Additive OPS fixtures; `CONF-001@1.1.0-OPS`; single engines |
| Explicit non-goals | Claim Standing redesign; material VersionService OPS; Relationship store; DocumentArtifact; AI; DB; API; UI; KG; provenance packaging; ENC AI-marker fix; Literature; computational biology |

SPEC must pin (among others):

- Exact OPS create signature for `createPlanned(input)` (single-arg — differs from NR’s `(input, registration)`)
- Whether create emits VTE-only scientific history (empty log at create — Claim/Evidence/Contradiction/NR create-once ops-event parity)
- Leave-planned: Human + `decision_ref`; outcome derived by Core
- Three terminal edges + stale-CAS while still `planned`
- ADM-T1 target assertion (claim / evidence / artifact_ref)
- Reference assertion from ENC payload; Relationship non-use
- Deterministic caller-supplied `event_id` on certified paths (VTE / ops)
- Optional NR/Contradiction coexistence fixtures now that both are OPS-persistable

### Open Questions (for SPEC-025 / later — not blockers)

| ID | Question | For |
|----|----------|-----|
| **OQ-025-001** | Exact OPS create API name/signature for `createPlanned` | SPEC-025 |
| **OQ-025-002** | Operational event type name (e.g. `ops.verification_record_state_revision`)? | SPEC-025 |
| **OQ-025-003** | Should certified fixtures demonstrate NR + Contradiction coexistence via optional refs? | SPEC-025 |
| **OQ-025-004** | ENC AI-marker omission for Verification — remain deferred? | ENC/SCI discovery |
| **OQ-025-005** | Claim `verified_via` post-create Standing — still Core-only deferred? | Separate SCI-001 discovery |
| **OQ-025-006** | After CERT-025, re-discover Provenance packaging vs Claim Standing Core extension vs Material OPS? | DISCOVERY-026 |

---

## DISCOVERY-025 FINAL VERDICT

**DISCOVERY-025 — READY FOR SPEC-025**

| Field | Value |
|-------|--------|
| Baseline | `47efca41c429c5de8bfc96da4c06082bc4c1e91c` (Sprint 024 CLOSED) |
| Primary pressure | Research semantics incompleteness — Verification OPS absent (Phase R1 last gap) |
| JUSTIFIED NEXT FRONTIER | **Verification OPS under Model C** |
| Why now | Dependencies satisfied (Claim/Evidence/Contradiction/NR OPS; Model C; ENC/SER); soft NR-ref sequencing from DISCOVERY-024 closed; closes Phase R1 |
| Why not “merely last” | Soft dependency satisfaction + Phase R1 architectural completion + coexistence unlocks — lastness is correlative |
| Why not Provenance / Literature / Bio / Search / KG / AI / Durable infra | Premature or dependent; axes already separated; no durability trigger; second-graph risk |
| Architectural decision required first? | **NO** |
| Generic lifecycle | NOT JUSTIFIED |
| Second scientific graph / second journal | FORBIDDEN |
| Next | SPEC-025 (Verification OPS Under Model C) — when separately commanded |
| Implementation authorization | **NO** |
| Commit / push | **NONE** |

*End DISCOVERY-025 — read-only. No SPEC. No source changes. No commit. No push.*

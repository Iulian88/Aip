# ROADMAP-REVIEW-001

**Type:** Read-only architecture and roadmap review  
**Baseline:** Sprint 020 FORMALLY CERTIFIED AND CLOSED  
**Commit:** `6c0106c3e27685f549bc7c2b882a0365c6b511d6` (`HEAD == origin/main`, clean tree at review start)  
**Mode:** No source/test/SPEC changes · no Sprint 021 · no commit/push · no technology installation  

---

## 1. Certified Current State

### 1.1 Certified sprint chain (repository evidence)

| Sprint | Subject | Status |
|--------|---------|--------|
| 001–014 | SciROS foundation (Core, ENC, SER, Processor, REF, CONF, CERT) | Certified foundation |
| 015 | Persistence Foundation | Certified |
| 016 | Research Operations (Claim path) | Certified |
| 017 | OPS Conformance / Certification integration | Certified |
| 018 | ResearchWorkspace | Certified |
| 019 | Evidence Operations (create-once + optional pre-persist) | Certified |
| 020 | Model C Post-Persist Scientific Transition | **FORMALLY CERTIFIED AND CLOSED** |

### 1.2 Live evidence corpora (post-020)

| Corpus | Result | Profile |
|--------|--------|---------|
| SCI (REF-CORPUS-SCI) | **44/44** | `CONF-001@1.0.0` |
| OPS (REF-CORPUS-OPS) | **46/46** | authoring subset |
| FULL (REF-CORPUS-FULL) | **90/90** | `CONF-001@1.1.0-OPS` |

Chain (unchanged, certified):

```
OPS → REF-OPS → ReferenceRunner → ReferenceReport
  → ConformanceEngine(profile) → ConformanceReport
  → CertificationEngine → Certificate
```

### 1.3 What Sprint 020 actually delivered

- Model C Persistence: stable scientific identity + immutable CanonicalUnit revisions + `RevisionHead` CAS  
- Normative keys: `persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}`; `persist:RevisionHead:{unit_kind}:{identity}`  
- Initial `rev:initial`; later caller-supplied `rev:…`  
- Lineage: `PersistenceEntity.predecessor_revision_id`  
- Claim Standing post-persist via OPS orchestration (`transitionClaimStanding`)  
- Evidence: **initial revision + head only** (no Evidence post-persist Record State)  
- Dual-read of legacy three-segment keys ≡ `rev:initial`  
- Additive REF-OPS-037…046  

### 1.4 Documentation drift (observed)

Root `README.md` still states “Foundation documentation phase” and “No scientific implementation code has been written yet.” That is **false relative to the certified SciROS monorepo**. `IMPLEMENTATION.md` is the accurate implementation status document. This is a documentation gap, not an architecture failure (see §13).

---

## 2. Current Architecture

### 2.1 Package map (actual monorepo)

| Package / app | Role |
|---------------|------|
| `@sciros/core` | Scientific Core — Claim, Evidence, Grade, Contradiction, Negative Result, Verification |
| `@sciros/encoding` | ENC-001 Canonical Units (identity/integrity) |
| `@sciros/serialization` | SER-001 / SER-JSON-001 |
| `@sciros/processor` | RPR processor stages (authority/encoding hooks) |
| `@sciros/persistence` | Persistence foundation + Model C revision/head |
| `@sciros/reference-tests` | REF corpus (SCI + OPS) |
| `@sciros/conformance` | CONF-001 engine + profiles |
| `@sciros/certification` | CERT-001/002 engine |
| `@sciros/shared` | Shared ports/types |
| `@sciros/reference-app` | Research Operations façade (session/workspace/OPS) |

Runtime stack: **TypeScript · Node ≥20 · pnpm · in-memory Persistence**. No DB, API server, frontend app, AI runtime, or KG store in packages.

### 2.2 Authority / data flow (certified)

```text
Scientific Core (meaning)
        ↓
Canonical Encoding (ENC-001 unit)
        ↓
Persistence (store + Model C revision + RevisionHead + single event journal)
        ↑
ResearchOperations (orchestrate only)
        ↓
SER-JSON export / ResearchSnapshot / WorkspaceSnapshot (projection)
        ↓
REF → CONF → CERT (evidence of conformance; not scientific truth)
```

### 2.3 Parallel documentation plane (AIP vision docs)

`docs/` describes a broader Autoimmune Insight Platform (data connectors, pipelines, mimicry analysis, UI). That plane is **governance/vision**, not the certified SciROS runtime. SciROS is the scientific object + research-ops kernel that future AIP planes must hang off without becoming a second authority.

---

## 3. Scientific Authority Map

| Concern | Owner | Notes |
|---------|-------|-------|
| Scientific semantics | **Scientific Core** (`@sciros/core`) | Standing, Record State, grades, contradictions, NR, verification |
| Canonical identity / integrity | **ENC** (`@sciros/encoding`) | CanonicalUnit, intact, pins |
| Serialization | **SER** (`@sciros/serialization`) | Profile-bound JSON; no new serializers in 020 |
| Persistence / storage | **Persistence** | Does not redefine science |
| Revision infrastructure | **Persistence Model C** | `revision_id`, predecessor, RevisionHead |
| Research orchestration | **OPS** (`reference-app`) | Orchestrates Core→ENC→Persistence→SER |
| Operational history | **Persistence event journal** (sole journal) | OPS `appendResearchEvent` only |
| Conformance / certification | CONF / CERT engines | Consume ReferenceReports only |

### Authority invariants (still true after 020)

| Invariant | Status |
|-----------|--------|
| Exactly one scientific authority (Core) | **Held** |
| No second scientific relationship graph | **Held** (no auto bears_on↔supported_by sync) |
| No second event journal | **Held** |
| RevisionHead is not scientific truth | **Held** |
| Representation lineage ≠ scientific supersession | **Held** (`predecessor_revision_id` vs Core `supersedes`) |

---

## 4. Implemented Capability Matrix

Legend: **Core** = scientific semantics in `@sciros/core`; **OPS** = ResearchOperations path; **Pers** = Persistence-capable; **Cert** = covered by SCI and/or OPS certification corpora as applicable.

| Capability | Status | Owner | Certified? | Dependencies | Notes |
|------------|--------|-------|------------|--------------|-------|
| Claim | Core + OPS register + Standing post-persist | Core / OPS / Pers Model C | Yes (SCI + OPS) | ENC, Persistence, Model C | Full Standing post-persist via `transitionClaimStanding` |
| Evidence | Core + OPS register (+ optional pre-persist transition) | Core / OPS / Pers | Yes (SCI + OPS) | ENC, Persistence | **Initial revision only**; no post-persist Record State OPS |
| Grade | Core + ENC unit + REF | Core | SCI yes; **OPS no** | Evidence | No Grade OPS workflow |
| Contradiction | Core + ENC + REF | Core | SCI yes; **OPS no** | Claims | No Contradiction OPS |
| Negative Result | Core + ENC + REF | Core | SCI yes; **OPS no** | Claims | No NR OPS |
| Verification | Core + ENC + REF | Core | SCI yes; **OPS no** | Claims/Evidence | No Verification OPS |
| ResearchSession | OPS memory-only | OPS | OPS yes | — | Not durable |
| ResearchWorkspace | OPS memory-only | OPS | OPS yes | Session bind optional | Not durable |
| Persistence | In-memory foundation | Pers | Via OPS/SCI hand-off | — | No durable DB adapter |
| Revision (Model C) | Implemented | Pers + OPS Claim Standing | Yes (OPS 020 fixtures) | Persistence 015 | Evidence uses initial only |
| Provenance | Field-level validators on Core objects | Core | Partial (embedded in SCI objects) | — | Not W3C PROV / RO-Crate packaging |
| Literature | Not implemented | — | No | Provenance, Document boundary | Explicit non-goal through 020 |
| Knowledge Graph | Not implemented | — | No | Stable semantics + projection rules | Explicit non-goal through 020 |
| AI | Markers / gates in Core only | Core ethics gates | No AI runtime | Authority boundaries | No LLM integration |
| Durable database | Not implemented | — | No | Stable revision model (now present) | Deferred |
| API / backend | Not implemented | — | No | Stable OPS contracts | Deferred |
| Frontend | Not implemented | — | No | API | Deferred |
| Computational biology | Docs vision only | — | No | Research semantics + data plane | Not in SciROS packages |
| Human biology model | Not implemented | — | No | Comp. biology + ethics | Deferred / vision |
| Simulation | Not implemented | — | No | Models + provenance | Deferred |

---

## 5. Architectural Gaps

### 5.1 Missing scientific semantics (Core)

None material for the six primary aggregates: Claim, Evidence, Grade, Contradiction, NR, Verification already exist under SCI-000…006. Remaining Core work is refinement (open questions in specs), not greenfield ontology.

### 5.2 Missing OPS orchestration (highest near-term gap)

| Gap | Why it matters |
|-----|----------------|
| Evidence **post-persist** Record State OPS | SPEC-019 deferred pending revision model; Model C now exists |
| Grade OPS | SCI-003 Core exists; no OPS assignment workflow |
| Contradiction / NR / Verification OPS | Core + ENC exist; no OPS registration/transition paths |
| Cross-object relationship orchestration | Still caller-managed; no auto-sync (correct); may need explicit OPS commands later |

### 5.3 Missing provenance (packaging / export)

- Object-level provenance fields exist  
- Missing: run-level reproducibility bundles, W3C PROV / RO-Crate style export contracts, deposit helpers  

### 5.4 Missing infrastructure

- Durable Persistence adapter  
- Durable session/workspace  
- Distributed concurrency (beyond local head CAS)  
- Auth, multi-user, cloud  

### 5.5 Missing AIP vision planes (outside SciROS kernel)

- Literature / DocumentArtifact ingestion boundary  
- Computational mimicry / sequence analysis pipelines  
- Search / retrieval index  
- Knowledge Graph **projection** (must remain non-authoritative)  
- AI research assist layer (must remain non-authoritative)  
- Human biology computational model / simulation  
- UI / public API  

### 5.6 Gap classification summary

| Class | Examples |
|-------|----------|
| Scientific semantics | Largely complete for primary objects |
| OPS orchestration | **Primary gap** after 020 |
| Provenance packaging | Secondary near-term |
| Infrastructure | Justified only after semantics stabilize further |
| Comp. biology / AI / KG / UI | Later phases; vision-driven |

---

## 6. Future Phase Map

Phases are **capability frontiers**, not sprint numbers. Validated against repository (SciROS certified kernel + AIP docs vision). Example phases from the prompt are **adjusted** where the repo evidence requires it.

### Phase R0 — Certified SciROS Kernel (DONE)

**Purpose:** Scientific objects + ENC/SER + Persistence + OPS shell + CONF/CERT + Model C.  
**Prerequisites:** —  
**Impact:** Establishes single scientific authority and research-ops kernel.  
**Tech:** TypeScript / Node (adopted).  
**Risk if skipped:** None — complete through Sprint 020.

### Phase R1 — Research Semantics Completion (NEXT FRONTIER)

**Purpose:** Finish OPS for already-existing Core aggregates using Model C revisions.  
**Includes (ordered by dependency):**  
1. Evidence post-persist Record State OPS  
2. Grade OPS (depends on Evidence current revision)  
3. Contradiction OPS  
4. Negative Result OPS  
5. Verification OPS  

**Prerequisites:** Model C (done); Evidence/Claim OPS (done).  
**Architectural impact:** Extends OPS surface; must not invent second graphs/journals.  
**Scientific impact:** Makes full Core lifecycle operable under Persistence revisions.  
**Tech:** None new required.  
**Risks:** Scope creep into DB/UI/AI; relationship auto-sync temptation.  
**Ordering:** Before Provenance packaging and before Literature — you cannot provenance or cite what you cannot revise coherently.

### Phase R2 — Provenance & Reproducibility Packaging

**Purpose:** Define export/packaging contracts for research runs and artifact bundles (possibly W3C PROV / RO-Crate shaped).  
**Prerequisites:** Stable revisioned scientific units (R1 substantially underway).  
**Impact:** Cross-cutting; touches SER/export, not Core meaning.  
**Tech candidates:** RO-Crate conventions, object storage later.  
**Risks:** Treating packaging as scientific authority.

### Phase R3 — Literature / DocumentArtifact Boundary

**Purpose:** Ingest/reference literature and documents as **non-authoritative** inputs feeding Evidence/Claims under Core rules.  
**Prerequisites:** R1 Evidence/Grade paths; provenance rules (R2).  
**Impact:** New boundary types; must not bypass Core.  
**Tech:** Parsers, optional search later — **not** KG-as-truth.  
**Risks:** Literature-as-truth; automated systematic-review overclaim (forbidden by non-goals).

### Phase R4 — Computational Biology / Mimicry Analysis Plane

**Purpose:** Connect AIP vision pipelines (similarity, epitopes, ranking) to SciROS Claims/Evidence as outputs.  
**Prerequisites:** R1–R3 enough to record hypotheses with Evidence; data snapshot strategy.  
**Impact:** New analysis plane; SciROS remains authority for scientific objects.  
**Tech candidates:** Python scientific ecosystem, workflow engines (Nextflow/Snakemake — ADR pending in docs), containers.  
**Risks:** Pipeline tools becoming a second scientific authority; non-reproducible binaries without pins.

### Phase R5 — Search / Retrieval

**Purpose:** Index and retrieve research artifacts and literature aids.  
**Prerequisites:** Stable identities/revisions; optional R3 content.  
**Tech candidates:** OpenSearch (or similar) — **index, not authority**.  
**Risks:** Search ranking mistaken for scientific Standing.

### Phase R6 — Knowledge Graph Projection

**Purpose:** Project relationships for exploration.  
**Prerequisites:** Complete relationship semantics in Core/OPS; clear non-authority rule.  
**Tech candidates:** Neo4j or RDF store — **projection only**.  
**Risks:** KG becoming second relationship graph / truth store (architectural violation).

### Phase R7 — AI Research Assist Layer

**Purpose:** Assisted drafting, summarization, ranking suggestions under Human Reviewer gates.  
**Prerequisites:** Clear authority boundaries (already in Core); preferably R1–R2.  
**Tech candidates:** LLM APIs — outputs never auto-elevate Standing/Record State.  
**Risks:** Silent authority leakage; clinical overclaim; nondeterminism in certified paths.

### Phase R8 — Durable Infrastructure

**Purpose:** Durable Persistence adapter, object storage, optional API.  
**Prerequisites:** Model C + sufficient R1 semantics so schema migrations are meaningful.  
**Tech candidates:** PostgreSQL, object storage, Docker.  
**Risks:** Premature DB locking unfinished semantics; dual-write journals.

### Phase R9 — Human Biology Computational Model

**Purpose:** Longer-horizon computational physiology/immunology models.  
**Prerequisites:** R4 + ethics charter + validation plans.  
**Risks:** Clinical drift; overclaim.

### Phase R10 — Simulation / Advanced Research

**Purpose:** Simulation experiments producing Evidence/Negative Results under Core.  
**Prerequisites:** R9 or strong R4 models + provenance.  
**Risks:** Simulation outputs treated as clinical truth.

### Phase ordering rationale (corrected vs prompt example)

Durable Infrastructure (R8) is **after** Research Semantics completion and preferably after Provenance contracts — not before Literature/KG/AI as a default. Premature durability freezes incomplete OPS surfaces. Search/KG/AI remain **non-authoritative projections/assists** and must not precede a coherent revisioned semantics layer.

---

## 7. Dependency Graph

```text
Certified SciROS Foundation (Sprints 001–014)
        ↓
Persistence Foundation (015)
        ↓
Research Operations shell + Workspace (016–018)
        ↓
Evidence initial OPS (019) + Claim OPS (016)
        ↓
Model C Revision + Claim Standing post-persist (020)   ← YOU ARE HERE
        ↓
Research Semantics Completion
   Evidence post-persist Record State OPS
        ↓
   Grade OPS
        ↓
   Contradiction / Negative Result / Verification OPS
        ↓
Provenance & Reproducibility Packaging
        ↓
Literature / DocumentArtifact Boundary
        ↓
Computational Biology / Mimicry Analysis Plane
        ↓
Search / Retrieval ──────────────┐
        ↓                        │
KG Projection (non-authoritative)│
        ↓                        │
AI Research Assist (non-authoritative)
        ↓
Durable Infrastructure (DB / object store / API)
        ↓
Human Biology Computational Model
        ↓
Simulation / Advanced Research
```

**Note:** Frontend and public API hang off Durable Infrastructure / OPS contracts; they are not scientific prerequisites.

---

## 8. Technology Radar

| Technology | Category | Role | Justified phase | Dependency | Risk | Introduce now? |
|------------|----------|------|-----------------|------------|------|----------------|
| TypeScript | **ADOPTED** | SciROS monorepo language | R0 | — | — | Already |
| Node.js (≥20) | **ADOPTED** | Runtime | R0 | — | — | Already |
| pnpm | **ADOPTED** | Package manager | R0 | — | — | Already |
| In-memory Persistence | **ADOPTED** | Reference adapter | R0–R1 | — | Not durable | Keep for kernel |
| PostgreSQL | **DEFERRED** | Durable Persistence adapter | R8 | Model C + R1 progress | Schema churn | **No** |
| Object Storage | **DEFERRED** | Artifacts, crates, snapshots | R2/R8 | Provenance contracts | Cost/ops | **No** |
| Parquet / Arrow | **EVALUATED** | Tabular scientific datasets | R4 | Analysis plane | Dual data models | **No** |
| Docker | **CANDIDATE** | Reproducible tool pins | R4/R8 | Pipelines | Drift if unpinned | **No** |
| Nextflow / Snakemake | **CANDIDATE** | Workflow orchestration | R4 | ADR spike in docs | Becoming authority | **No** |
| Python | **CANDIDATE** | Scientific analysis adapters | R4 | Ports/adapters | Split-brain with TS Core | **No** |
| Rust / C++ | **DEFERRED** | Performance-critical tools | R4+ selective | Proven need | Maintenance | **No** |
| OpenSearch | **DEFERRED** | Retrieval index | R5 | Stable IDs | Rank≠Standing | **No** |
| Neo4j | **DEFERRED** | KG projection | R6 | Non-authority rules | Second graph | **No** |
| LLM / AI APIs | **DEFERRED** | Assist only | R7 | Human gates | Authority leakage | **No** |
| FHIR | **REJECTED** (near-term) | Clinical interoperability | — | Violates clinical non-goals | Ethics | **No** |
| W3C PROV | **CANDIDATE** | Provenance vocabulary | R2 | Export contracts | Over-modeling | **No** |
| RO-Crate | **CANDIDATE** | Reproducibility bundles | R2 | Export maturity | Ceremony | **No** |
| 3D / viz | **DEFERRED** | Structure UI | R4+/UI | Structure module | Scope | **No** |

---

## 9. Technology Introduction Gates

A technology may be introduced **only when all** hold:

1. An approved architectural requirement exists (SPEC/ADR).  
2. Existing adopted infrastructure cannot satisfy the requirement honestly.  
3. Role is classified (authority vs adapter vs projection vs assist).  
4. Data ownership is explicit (what is/ isn’t scientific truth).  
5. Failure behavior is specified (incl. partial-write honesty where relevant).  
6. Reproducibility implications are defined (pins, determinism, tolerance).  
7. Migration/rollback defined for durable stores.  
8. Non-goals / ethics documents are not violated.  
9. Introduction is tied to a phase gate, not convenience.

**Current gate result:** No new technology clears the gate for immediate introduction. Sprint-scale work should remain TypeScript/Node on the certified kernel.

---

## 10. Non-Goals (do not build yet)

From certified SPECs (esp. 019/020) and governance docs — **still binding**:

- Durable DB / cloud / distributed Persistence as next sprint  
- REST/API backend, frontend, auth products  
- AI/LLM integration as scientific authority  
- Knowledge Graph as truth store  
- Literature crawler / DocumentArtifact ingestion without Document boundary SPEC  
- Automatic relationship synchronization  
- Clinical CDS, FHIR clinical pathways, DTC apps  
- Human Digital Twin / simulation platforms  
- Reopening Model A/B/D/E for Claim Standing  
- Second event journal or second scientific graph  
- Replacing Core semantics with pipeline tool outputs  

---

## 11. Recommended Next Architectural Frontier

### Frontier (not yet “Sprint 021” numbered): **Research Semantics Completion — Evidence post-persist Record State OPS on Model C**

**Why this is next (dependency, not preference):**

1. **Prerequisite unlocked:** Sprint 020 delivered Model C specifically so post-persist transitions can create immutable revisions + CAS head — the missing piece SPEC-019 deferred.  
2. **Partial path already exists:** Evidence Core transitions + OPS `registerEvidenceUnit` + initial `RevisionHead` are certified.  
3. **Pattern proven:** Claim Standing post-persist is the template; Evidence Record State is the isomorphic next object.  
4. **Unblocks Grade OPS:** Grades attach to Evidence; grading workflows need a coherent current Evidence revision.  
5. **No new technology required:** Fits Technology Introduction Gates (use existing Persistence/OPS/ENC/Core).  
6. **Aligns with AIP vision without jumping planes:** Completes the scientific object kernel before Literature, pipelines, KG, or DB.

**Explicitly not next:** PostgreSQL, UI, AI, Neo4j, Nextflow, Human biology model — all fail prerequisite or gate tests.

Whether that frontier is packaged as one sprint or several is a planning decision **after** a dedicated SPEC for Evidence post-persist Model C OPS — out of scope for this review.

---

## 12. Risks (growth-induced degradation)

| Risk | Mechanism | Mitigation direction |
|------|-----------|----------------------|
| Second scientific authority | Pipelines/KG/AI write “truth” | Keep Core as sole semantics; adapters emit Claims/Evidence only via OPS |
| Second event journal | App-level logs as science history | Single Persistence journal |
| Premature durability | DB schema before OPS complete | Finish R1; then Persistence adapter SPEC |
| Relationship auto-sync | Convenience coupling | Keep SSR-5 independence; explicit commands only |
| README / docs drift | Vision docs contradict certified reality | Update status docs (see §13) |
| Observation debt | O-020-01…07 ignored until they become blockers | Track in registry; patch when touched |
| Nondeterministic STE ids | Core `randomUUID` if omitted | Require caller `event_id` on certified OPS paths |
| Partial-write orphans | Model C CAS gaps | Documented; detect via head vs revision list |
| Scope collapse into general bioinformatics OS | Vision expansion without SciROS anchors | Non-goals + phase gates |

---

## 13. Documentation Gaps

| Document need | Exists? | Recommendation |
|---------------|---------|----------------|
| Accurate root status vs SciROS reality | `IMPLEMENTATION.md` yes; root `README.md` **stale** | Update README status section in a **docs-only** follow-up (not this review) |
| AIP-MASTER-ROADMAP.md | No (only `docs/06-process/roadmap.md` pre-SciROS) | **Create later** from this review — do not invent parallel conflicting roadmaps |
| AIP-ARCHITECTURE-CONSTITUTION.md | Partial (governance + SCI/ADR) | Consolidate authority invariants into one constitution doc later |
| AIP-TECHNOLOGY-RADAR.md | No | Derive from §8 when radar becomes living |
| AIP-SPRINT-REGISTRY.md | No (certs + IMPLEMENTATION.md scatter) | Useful registry of closed sprints 015–020 |
| AIP-CURRENT-ARCHITECTURE.md | No | Package map + authority map from §§2–3 |

**This review does not create those five documents** (per instructions). Equivalent fragments exist across `IMPLEMENTATION.md`, SPECs, ADRs, and `docs/`, but no single post-020 master roadmap exists yet.

---

## 14. Final Recommendation

| Question | Answer |
|----------|--------|
| Current architectural state | Certified SciROS kernel through Model C + Claim Standing + Evidence initial OPS; single scientific authority preserved |
| Next frontier | **Research Semantics Completion**, starting with **Evidence post-persist Record State OPS** on Model C |
| Required documentation work | Reconcile root README with certified reality; later master roadmap / sprint registry / current-architecture / tech radar (docs-only) |
| Technology decisions that can wait | PostgreSQL, object storage, Python/Nextflow, OpenSearch, Neo4j, LLMs, FHIR, viz |
| What must not be touched yet | Certified Core/ENC/SER semantics redesign; second journals/graphs; clinical features; durable infra as “quick win”; AI-as-authority |

### Bottom line

AIP (SciROS) has completed the **scientific object + research-ops + revision** kernel. The critical path is to **finish OPS for remaining Core lifecycles** using Model C—not to introduce databases, AI, or knowledge graphs. Computational biology and the broader AIP vision remain valid **later phases** that must consume SciROS as authority, never replace it.

---

*End ROADMAP-REVIEW-001 — review only. No implementation. No Sprint 021. No commit. No push.*

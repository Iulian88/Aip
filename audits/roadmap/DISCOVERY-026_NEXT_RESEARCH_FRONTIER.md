# DISCOVERY-026 — Next Research Frontier

**Type:** Read-only architecture / roadmap discovery after Sprint 025  
**Mode:** No source, test, SPEC, or certification changes · no SPEC-026 · no commit · no push  
**Classification legend:** FACT | DEPENDENCY | OBSERVATION | OPEN QUESTION | DEFERRED | NOT APPLICABLE

Every status below is derived from the repository at the stated commit (source, fixtures, profiles, certification artifacts), not from documentation alone. Where a document and the code differ, the code is reported.

---

## Baseline

| Item | Value |
|------|-------|
| Sprint 025 | FORMALLY CERTIFIED AND CLOSED — Verification OPS Under Model C |
| Commit | `8541b20f2fbda7f1035f603bad3248bc10c8601f` — `cert(sprint-025): certify Verification OPS under Model C` |
| `git rev-parse HEAD` | `8541b20f2fbda7f1035f603bad3248bc10c8601f` |
| `git rev-parse origin/main` | `8541b20f2fbda7f1035f603bad3248bc10c8601f` |
| HEAD == origin/main | YES |
| Working tree at discovery start | CLEAN |
| Certified corpus | SCI **44/44** · OPS **161/161** · FULL **205/205** |
| Profiles | `CONF-001@1.0.0` (SCI) · `CONF-001@1.1.0-OPS` (OPS, evaluated on FULL) |
| Engines | one `ConformanceEngine` · one `CertificationEngine` |
| Highest OPS fixture | `REF-OPS-161` → next free additive id **`REF-OPS-162`** |
| Certified Model C OPS paths | Claim Standing (020) · Evidence Record State (021) · Grade (022) · Contradiction (023) · Negative Result (024) · Verification (025) |

Documents read: DISCOVERY-024/025, ROADMAP-REVIEW-001/002, SPEC/Decision/Audit/CERT chain 020–025, IMPLEMENTATION.md, README, `docs/05-science/{provenance,scientific-reproducibility}.md`, functional requirements FR-11.  
Source inspected: `packages/core/src/{claim,evidence,grade,contradiction,negative-result,verification}` (including VersionServices), `apps/reference-app/src/**`, Persistence/ENC/SER/CONF/CERT/reference-tests.

Repository modifications by this discovery: **this file only**.

---

## Current Certified State

| Layer | Status |
|-------|--------|
| Scientific Core (SCI-000…006) | COMPLETE for Claim, Evidence, Grade, Contradiction, Negative Result, Verification |
| ENC / SER | All six unit kinds assemble + SER-JSON registered |
| Persistence Model C | Generic by `unit_kind`; **all six** unit kinds OPS-exercised under Model C |
| Research Operations | Claim create + Standing; Evidence create + Record State + Grade; Contradiction create + Record State; Negative Result create + Record State; Verification createPlanned + leave-planned |
| REF → CONF → CERT | SCI 44/44 · OPS 161/161 · FULL 205/205 · both profiles COMPLIANT · CERTIFIED through Sprint 025 |
| Sole scientific authority | Core |
| Sole operational journal | Persistence event journal |
| Sole Persistence mechanism | In-memory Model C repository |
| Dormant `Persistence.Relationship` | Still unused as scientific storage |

**FACT:** Sprint 025 closed Verification OPS under Model C. **Phase R1 (research-semantics OPS completion for all six SCI units + Grade Option A) is COMPLETE.**

**FACT:** No OPS wiring of any `*VersionService.applyMaterialUpdate` exists under `apps/reference-app`. Material content evolution remains Core-only.

**FACT:** No DocumentArtifact type, no literature ingestion package, no research-run packaging/export bundle, no Knowledge Graph store, no durable Persistence adapter.

---

## Architectural Invariants

Frozen (must not be violated by the next frontier):

1. **One scientific truth** — Scientific Core only  
2. Persistence is infrastructure only  
3. Research Operations is orchestration only  
4. ENC owns canonical encoding/integrity; SER owns serialization  
5. REF → CONF → CERT pipeline unchanged (one ConformanceEngine · one CertificationEngine)  
6. **No** second scientific graph · **no** second event journal · **no** AI scientific authority  
7. **No** Persistence-owned or OPS-owned scientific semantics  
8. **No** generic ScientificUnit lifecycle engine  
9. Technology follows architecture (not the reverse)  
10. ResearchSession memory-only; ResearchWorkspace OPS-owned / non-scientific unless a future durability SPEC explicitly changes this  
11. Model C: Stable Scientific Identity + Immutable Revisions + RevisionHead + CAS  

---

## Scientific State

| Scientific Unit | Core | OPS create | OPS revise (state/grade) | Material content OPS | Model C | Certified |
|-----------------|------|------------|--------------------------|----------------------|---------|-----------|
| Claim | COMPLETE | YES | Standing | **NO** (VersionService unused by OPS) | YES | SCI + OPS |
| Evidence | COMPLETE | YES | Record State + Grade | **NO** | YES | SCI + OPS |
| Grade | COMPLETE (Option A on Evidence) | N/A | `assignEvidenceGrade` | N/A | YES | SCI + OPS |
| Contradiction | COMPLETE | YES | Record State | **NO** | YES | SCI + OPS |
| Negative Result | COMPLETE | YES | `registered→withdrawn` | **NO** | YES | SCI + OPS |
| Verification | COMPLETE | YES (`createPlanned`) | leave-planned → passed/failed/inconclusive | **NO** | YES | SCI + OPS |

### What Phase R1 completed

Research-semantics **issuance + record/standing/grade transitions** for the full SCI unit set are OPS-operable under Model C.

### What remains incomplete (not Phase R1)

| Gap | Layer | Notes |
|-----|-------|-------|
| Material content evolution via OPS | Core VersionServices exist; OPS absent | Cross-cutting deferred since ROADMAP-REVIEW-001 |
| Claim Standing post-create `qualified_by` / `verified_via` setters | Core SCI-001 | Create-time coexistence only (REF fixtures); reverse sync deferred |
| Provenance packaging / research-run export contracts | Export / OPS projection | Object-local provenance exists; packaging absent |
| DocumentArtifact / Literature plane | New boundary | Locators suffice today |
| Multi-unit ResearchCase/Workflow | Absent | Membership is organizational only |

**Primary pressure after CERT-025:** Phase R1 incompleteness is **gone**. The next pressure is **post-R1 foundation**: either packaging/reproducibility contracts (Phase R2) or material content OPS (parallel deferred track). DISCOVERY-025 **OQ-025-006** explicitly deferred that choice to this discovery.

---

## Candidate Frontiers

Candidates analysed for dependencies — **not numerically ranked**. Qualitative readiness only.

### A. Research Provenance / Provenance Projection Model

| Dimension | Assessment |
|-----------|------------|
| Current State | Object-local `provenance` on Core units; scientific transition logs (STE/ERTE/GAE/CRTE/NRTE/VTE) in ENC; Persistence event journal; Model C revision lineage; ResearchSnapshot / WorkspaceSnapshot / timeline projections |
| Missing Capability | Formal packaging/export contract that **distinguishes and projects** these axes without conflation; deterministic research-run / reproducibility bundle shape (product FR-11 / docs provenance strategy) |
| Dependencies | **SATISFIED** — Phase R1 complete unit set; Model C lineage; sole journal; snapshots |
| Architectural Impact | Cross-cutting export/SER/OPS projection; **must not** redefine Core meaning or invent a second journal/graph |
| Scientific Impact | Reproducibility packaging clarity; does not invent new scientific units |
| Technology Dependencies | **None required** for a contract + deterministic export sprint; W3C PROV / RO-Crate are **optional shaping**, not mandatory imports |
| Risks | Treating packaging as scientific authority; silently merging operational timeline into scientific provenance |
| Readiness | **HIGH** — now justified as Phase R2 after R1 closure |

### B. Multi-Unit Research Operations Expansion

| Dimension | Assessment |
|-----------|------------|
| Current State | All six units OPS-operable; session/workspace membership organizational; snapshots list members + Persistence snapshot |
| Missing Capability | Formal ResearchCase / ResearchWorkflow abstraction (absent) |
| Dependencies | Units exist; membership exists |
| Architectural Impact | If scientific → new Core authority risk / second graph; if OPS-owned aggregation → possible but easy to over-model |
| Scientific Impact | Unclear — membership already aggregates non-scientifically |
| Technology Dependencies | None |
| Risks | Generic workflow engine; scientific meaning via membership; premature orchestration DSL |
| Readiness | **LOW** — not justified as next; wait until packaging clarifies multi-unit export shapes |

### C. Literature / DocumentArtifact Boundary

| Dimension | Assessment |
|-----------|------------|
| Current State | Evidence `source_class` includes `literature_venue`; `source_locator` strings; Verification `artifact_ref` opaque |
| Missing Capability | First-class DocumentArtifact type / ingestion boundary |
| Dependencies | Prefer Provenance packaging rules (Phase R2) before Literature (Phase R3) |
| Architectural Impact | New boundary types; must remain non-authoritative inputs feeding Evidence/Claims |
| Scientific Impact | High for product vision; not blocking current OPS surface |
| Technology Dependencies | Parsers/crawlers later — not now |
| Risks | Literature-as-truth; second document ontology without packaging contracts |
| Readiness | **NOT YET** — premature as *next*; Phase R3 |

### D. Research Evidence / Source Locator Model

| Dimension | Assessment |
|-----------|------------|
| Current State | Evidence source model + locators already Core-validated |
| Missing Capability | Richer locator taxonomy / resolution policy (optional) |
| Dependencies | Overlaps C; does not require new unit |
| Readiness | **PARTIAL** — subsumed by Literature/Document boundary later; not a standalone next sprint |

### E. Knowledge Graph Projection

| Dimension | Assessment |
|-----------|------------|
| Current State | ENC envelope references + Core ref fields; dormant `Persistence.Relationship` |
| Missing Capability | Derived projection store |
| Dependencies | Prefer complete packaging + clear non-authority rules; relationship semantics already Core-owned |
| Risks | **KG as second scientific source of truth** |
| Readiness | **PREMATURE** — derived-only later (Phase R6) |

### F. Search / Retrieval

| Dimension | Assessment |
|-----------|------------|
| Current State | None |
| Dependencies | Stable identities/revisions (done); preferably Literature content |
| Risks | Ranking confused with Standing / Verification outcome |
| Readiness | **PREMATURE** (Phase R5) |

### G. AI Research Proposal Boundary

| Dimension | Assessment |
|-----------|------------|
| Current State | Human Reviewer gates in Core; ENC AI markers omitted for some units (deferred OQ class) |
| Missing Capability | Explicit non-authoritative AI proposal/assist boundary SPEC |
| Dependencies | Prefer R1–R2 clarity; Human gates already exist |
| Risks | Authority leakage; nondeterminism on certified paths |
| Readiness | **NOT YET JUSTIFIED** as next sprint (Phase R7) |

### H. Durable Workspace / Durable Persistence

| Dimension | Assessment |
|-----------|------------|
| Current State | In-memory Persistence; memory-only session/workspace |
| Trigger present? | **NO** — no multi-user, restart continuity, concurrent writers, external API, or production deployment pressure in certified kernel |
| Risks | Freezing incomplete post-R1 contracts into durable schema |
| Readiness | **WAIT** (Phase R8) |

### I. Computational Biology Integration

| Dimension | Assessment |
|-----------|------------|
| Current State | Product vision docs only; no Core biology types |
| Missing Capability | Biological entity / measurement / analysis-run ontology; dataset identity |
| Dependencies | Literature/Document + Provenance packaging + Claims/Evidence recording patterns |
| Readiness | **PREMATURE** (Phase R4+) |

### J. Human Biology Computational Model

| Dimension | Assessment |
|-----------|------------|
| Current State | Absent |
| Dependencies | I + long-term domain modeling |
| Readiness | **FAR** — foundational abstractions (scientific units + provenance + literature + analysis plane) first |

### K. Additional frontiers discovered from repository

| Candidate | Classification |
|-----------|----------------|
| Material content OPS (`*VersionService.applyMaterialUpdate` under Model C) | **STRONG PARALLEL** — Core complete; OPS absent; cross-cutting; not Phase R2 packaging |
| Claim Standing Core extension for post-create `qualified_by` / `verified_via` | **DEFERRED** — SCI-001 redesign; create-time coexistence already certified |
| ENC AI-marker content for Contradiction/NR/Verification | **DEFERRED** — ENC/SCI discovery; not next OPS frontier |
| Generic lifecycle engine | **NOT JUSTIFIED** — rejected architecture |
| `Persistence.Relationship` as scientific store | **FORBIDDEN** |

---

## Dependency Analysis

Evidence-supported post-025 graph:

```
Research Semantics Completion (Phase R1) ──────── COMPLETE (CERT-025)
│
├── Claim / Evidence / Grade / Contradiction / NR / Verification OPS
│
After Phase R1:
│
├── Provenance packaging / reproducibility projection (Phase R2)  ←── JUSTIFIED NEXT
│         · unit set complete for packaging
│         · axes already separated; packaging contract missing
│         · unlocks Literature boundary safely
│
├── Material content OPS (VersionServices) ────── PARALLEL / NEXT-AFTER candidate
│         · Core ready; OPS absent
│         · must remain Core-delegated Model C revisions
│         · do NOT conflate with packaging
│
├── Claim Standing Core extension (qualified_by / verified_via post-create)
│         · SCI-001 redesign track — deferred
│
└── Literature / DocumentArtifact (Phase R3)
          → Computational biology / analysis plane (R4+)
              → Retrieval (non-authoritative)
                  → KG projection (derived only)
                      → AI proposal layer (non-authority)
                          → Durable infrastructure (when triggers exist)
```

**Unsafe ordering:**

| Order | Risk |
|-------|------|
| Literature / Bio / Search / KG / AI / Durable **before** packaging contracts | Incomplete export/authority clarity; premature tech freeze |
| Material OPS **as substitute for** packaging | Completes content revision but leaves reproducibility/export gap; both eventually needed |
| KG / `Persistence.Relationship` as scientific store | Second scientific source of truth |
| Multi-unit ResearchCase as scientific workflow engine | Authority leakage / second graph |
| Generic lifecycle engine | Model C / Core reinvention — NOT JUSTIFIED |
| W3C PROV imported as Core scientific ontology | External authority substitution |

**Second graph / second journal risk:** unchanged — any SPEC-026 MUST forbid `Persistence.Relationship` as scientific storage and MUST reuse the sole Persistence journal. Packaging MAY project journal + lineage + Core provenance; it MUST NOT become a second history authority.

---

## Provenance Analysis

| Axis | Current owner | Present? | Packaging? |
|------|---------------|----------|------------|
| 1. Scientific provenance | Core object `provenance` fields + scientific event logs in ENC | YES | No unified export contract |
| 2. Operational audit history | Persistence event journal (`ops.*` events) | YES | Mixed with scientific logs only by careless consumers |
| 3. Source locator | Evidence `source_locator` / `source_class`; Verification `artifact_ref` | YES (string-level) | Not DocumentArtifact |
| 4. Persistence history | Immutable CanonicalUnit revisions + storage keys | YES | Per-unit export only |
| 5. Revision lineage | `predecessor_revision_id` + RevisionHead | YES | Lineage APIs exist; no research-run bundle |
| 6. ResearchSession timeline | `projectTimeline` over Persistence events | YES (operational) | Presentation only |
| 7. Workspace organization | Membership + WorkspaceSnapshot | YES (organizational) | Non-scientific |

**Verdict:** Axes remain **sufficiently separated in architecture**. What is missing is a **formal packaging / projection specification** that:

- names each axis and forbids conflation;
- defines a deterministic research-run / reproducibility export shape over the **complete** Phase R1 unit set;
- keeps packaging **non-authoritative** (Core remains truth; Persistence remains infrastructure);
- optionally allows later PROV/RO-Crate *transforms* without adopting them as Core ontology now.

**Does this warrant a formal architecture specification NOW?** **YES.**

Why now (not earlier): Phase R1 incomplete would have frozen packaging over a missing Verification surface (DISCOVERY-025). That blocker is closed.

Why packaging rather than inventing new provenance science: object-local provenance and logs already exist — the gap is **contracts and projection**, not new scientific meaning.

W3C PROV / RO-Crate: **shaping candidates only** — NOT justified as mandatory Core imports in the next sprint.

---

## Literature Boundary Analysis

| Question | Answer |
|----------|--------|
| Can Evidence already reference external literature? | **YES** — `literature_venue` + locators |
| Is DocumentArtifact required for Verification `artifact_ref`? | **NO** — opaque string sufficient (Sprint 025) |
| Is AIP ready for Literature → Document → Source → Evidence as a full plane? | **NOT YET** — needs packaging rules (R2) before first-class DocumentArtifact (R3) |
| Locator-based Evidence still sufficient? | **YES** for current certified kernel |

**Status:** Premature as next frontier. Do not implement DocumentArtifact in Sprint 026.

---

## Multi-Unit Operations Analysis

| Question | Answer |
|----------|--------|
| Are Claim/Evidence/Grade/Contradiction/NR/Verification enough building blocks? | **YES** for recording research semantics |
| What is missing for “workflow”? | Explicit ResearchCase/ResearchWorkflow abstraction — **absent** |
| Scientific or operational? | If introduced now, must be **OPS-owned organizational** — not scientific |
| Second graph risk? | High if modeled as relationship/workflow truth store |
| Justified now? | **NO** — membership + snapshots already provide organizational aggregation; packaging should define multi-unit *export* first |

---

## Knowledge Graph Analysis

Core → derived projection → KG is the **only** acceptable direction.  
Core ↔ KG is **forbidden**.

Current semantics/provenance are mature enough for *thinking* about projections, but **not** for introducing a KG store now. Incomplete packaging + unused Relationship kind create second-authority pressure.

**Status:** Premature. Not next.

---

## AI Boundary Analysis

Human gates already exist in Core. AI as non-authoritative proposal/assist layer remains architecturally contemplated.

**Status:** Not justified as next sprint. Prefer packaging clarity and Human-gate preservation before AI boundary SPEC. ENC AI-marker omission remains deferred (not an AI product sprint).

---

## Durability Analysis

| Trigger | Present? |
|---------|----------|
| Process restart continuity requirement | NO |
| Multi-user state | NO |
| Cross-process uniqueness pressure | NO |
| Concurrent writers | NO (CAS exists in-memory only) |
| Large-scale query | NO |
| External API / production deployment | NO |

**Status:** No genuine durability trigger. Do not introduce PostgreSQL/Redis/Kafka/Neo4j/etc. now.

---

## Computational Biology Analysis

Distance from current research semantics to computational biology remains **large**.

Required first: packaging/reproducibility contracts; Literature/Document boundary; then analysis-plane outputs recorded as Claims/Evidence under Core — **without** pipeline tools becoming scientific authority.

**Status:** Premature. Sequences/genomes/proteins/pathways/datasets/workflows/simulation are out of scope for Sprint 026.

---

## Human Biology Model Analysis

Long-term organism/system models require prior foundations: scientific unit OPS (done), provenance packaging, literature/evidence recording, computational analysis plane, and clear non-clinical ethics boundaries.

**Status:** Far future. Do not design the complete model now.

---

## Recommended Next Frontier

### Selected

**Research Provenance / Provenance Projection & Reproducibility Packaging Model (Phase R2)**

Exact short name for SPEC-026 subject:

**Provenance Projection & Reproducibility Packaging under SciROS (non-authoritative export contracts)**

### Why (repository evidence)

1. **Phase R1 is complete** — all six scientific units + Grade are OPS-operable under Model C (CERT-025). The prior “wait until Verification OPS” blocker for packaging is closed.
2. **Provenance axes already exist and are separated**, but **packaging/export contracts do not** — ResearchSnapshot/timeline/unit exports cover pieces; no research-run reproducibility bundle contract exists despite product FR-11 / docs provenance strategy.
3. Packaging is **dependency-safe**: uses existing Core provenance + ENC scientific logs + Persistence journal + Model C lineage + snapshots — **without** new scientific units, second graph, second journal, or durable infrastructure.
4. It is the **Phase R2** dependency for Literature/DocumentArtifact (R3) and later computational biology recording — technology must follow these contracts.
5. Independently certifiable: additive REF-OPS fixtures; deterministic double-run packaging export; axis-separation assertions; CONF/CERT profile reuse.

### What SPEC-026 must pin (when authorized)

- Explicit axis taxonomy (scientific provenance vs operational audit vs locator vs Persistence history vs revision lineage vs session timeline vs workspace membership)
- Deterministic packaging/export shape (caller-supplied ids/timestamps; no wall-clock / randomUUID on certified paths)
- Non-authority rule: package is projection, not scientific truth
- Forbidden: Relationship scientific store; second journal; PROV-as-Core; DocumentArtifact ingestion; Material VersionService OPS conflated into packaging; AI; durable DB
- Additive fixture range starting at **REF-OPS-162**

### What it does NOT require yet

DocumentArtifact, Literature crawlers, KG, AI, durable DB, search, multi-user, generic lifecycle, Claim Standing Core redesign, ENC AI-marker fix, computational biology entities.

### Strongest deferred alternative (not selected)

**Material Content OPS under Model C** (Evidence-first or bounded single-unit slice via Core `*VersionService.applyMaterialUpdate`):

- Scientifically important — content evolution still Core-only  
- Architecturally ready (VersionServices exist; Model C pattern proven)  
- Cross-cutting if attempted for all units at once  
- Must remain a **separate** frontier — do not fold into packaging  

If future review rejects packaging as “too soft,” Material Evidence OPS is the next-best bounded SPEC candidate — not Multi-unit ResearchCase, not Literature, not durable infra.

### Claim Standing Core extension

Still **DEFERRED** (SCI-001). Create-time `verified_via` / `qualified_by` / `contested_by` coexistence is already certified. Post-create reverse sync is not an OPS-only sprint.

---

## Next Frontier Requirements Checklist

| Requirement | Met by recommendation? |
|-------------|------------------------|
| Bounded scope | YES — contracts + projection/export + fixtures |
| Explicit architecture | YES — Phase R2 packaging |
| No premature infrastructure | YES |
| No duplicate scientific authority | YES — projection only |
| Independently testable / auditable / certifiable | YES |
| Compatible with Model C / REF→CONF→CERT / Persistence / ENC/SER / OPS | YES |
| Scientifically meaningful | YES — reproducibility packaging over complete unit set |

---

## Open Questions for SPEC-026 (non-blocking)

| ID | Question | Owner |
|----|----------|-------|
| **OQ-026-001** | Exact packaging artifact name/shape (research-run manifest vs session package vs workspace package)? | SPEC-026 |
| **OQ-026-002** | Include Persistence operational events in package by default, or opt-in only? | SPEC-026 |
| **OQ-026-003** | Allow optional PROV-JSON/RO-Crate *transform* fixtures without Core import? | SPEC-026 |
| **OQ-026-004** | Sequence Material Evidence OPS as Sprint 027 vs parallel discovery? | DISCOVERY-027 |
| **OQ-026-005** | Claim Standing post-create `verified_via` still Core SCI-001 only? | Separate SCI discovery |

---

## Final Discovery Statement

| Field | Value |
|-------|-------|
| Selected next frontier | **Provenance Projection & Reproducibility Packaging (Phase R2)** |
| Justification class | Post-R1 dependency-safe packaging/export contracts over complete scientific unit set |
| Key dependency | Phase R1 complete (CERT-025) — now satisfied |
| Major blocker | **NONE** for SPEC-026 on packaging |
| Why not Material OPS now | Strong parallel; cross-cutting; must not be conflated; packaging unlocks Literature path |
| Why not Literature / Bio / Search / KG / AI / Durable | Premature or dependent; no durability trigger; second-graph / authority risks |
| SPEC-026 | **NOT CREATED** by this discovery |
| Implementation changes | **NONE** |

**Next gate (when separately commanded):** SPEC-026 — Provenance Projection & Reproducibility Packaging.

*End DISCOVERY-026.*

# SPEC-018
## Research Workspace / Research Operations Architecture

| Field | Value |
|-------|--------|
| Spec ID | SPEC-018 |
| Title | Research Workspace / Research Operations Architecture |
| Version | **0.2.0-PATCHED** |
| Status | **SPEC-018 PATCHED — PENDING ARCHITECTURE RE-AUDIT** |
| Mode | Architecture / specification only — **NO IMPLEMENTATION** |
| Inputs | SPEC-016A, SPEC-017 v0.2.0-PATCHED, CODE-AUDIT-015…018, EXEC-SPRINT-016/017, EXEC-FORMAL-CERTIFICATION-017 |
| Patch input | CODE-AUDIT-019 (P-018-001…P-018-003) |
| Intended re-audit | CODE-AUDIT-019A |
| Intended future execution | Future EXEC sprints (not authorized by this document) |
| Does not claim | Approval, implementation, execution readiness, or certification |

---

## 1. Status

**DESIGN ONLY**  
**SPEC-018 PATCHED — PENDING ARCHITECTURE RE-AUDIT (CODE-AUDIT-019A)**

This document does **not** authorize code changes, fixture creation, package changes, migrations, databases, AI integration, UI, or any modification to frozen authorities or Sprint 016/017 certified contracts.

Patched to close CODE-AUDIT-019 findings P-018-001 through P-018-003. Not approved.

Architecture approval must come from an independent re-audit. This document does **not** mark itself APPROVED.

---

## 1A. CODE-AUDIT-019 Patch Closure

| Patch | Problem | Resolution | Status |
|-------|---------|------------|--------|
| P-018-001 | Session↔Workspace binding / Sprint 016 orphan sessions unspecified | Normative binding rules: sessions remain valid without workspace; optional bind to ≤1 workspace; OPS metadata only; session never persisted | **CLOSED** |
| P-018-002 | Workspace vs session membership sync unspecified | Membership = non-authoritative OPS index; session membership is primary working set; workspace membership = explicit union maintained on `registerMember`; no scientific relationship store | **CLOSED** |
| P-018-003 | ResearchSnapshot schema conflated with workspace view | Freeze Sprint 016 `ResearchSnapshot`; define additive `WorkspaceSnapshot` | **CLOSED** |

**Canonical term:** `ResearchWorkspace` is the normative OPS name. `ResearchCase` is an informal synonym only (not a second type).

---

## 2. Purpose

Define the next **safe architectural evolution** of SciROS Research Operations after formal certification of Sprint 017.

Sprint 017 answered:

> Can Research Operations participate in the formal REF → CONF → CERT chain?  
> **Yes.**

Sprint 018 asks:

> What should Research Operations become next, now that it is formally certifiable?

This specification determines whether SciROS should introduce a formal **Research Workspace / Research Case** above the existing memory-only `ResearchSession`, and how Claim, Evidence, GradeDesignation, Contradiction, NegativeResult, and Verification enter OPS workflows **without** becoming a new scientific authority, without duplicating Persistence/ENC/SER/REF/CONF/CERT, and without prematurely introducing AI, literature ingestion, durable distributed infrastructure, or UI.

---

## 3. Context

### 3.1 Completed program (Sprint 001–017)

| Sprint | Deliverable | Formal state (as of SPEC-018 drafting) |
|--------|-------------|----------------------------------------|
| 001–008 | Repository + SCI-000…006 | Scientific Core established |
| 009–011 | ENC-001, SER-001, SER-JSON-001 | Encoding / serialization |
| 012–014 | Reference Tests, Conformance, Certification | Evidence chain |
| 015 | Persistence Foundation | Infrastructure persistence |
| 016 | Research Operations / Reference Application | OPS orchestration (memory-only ResearchSession) |
| 017 | OPS Conformance & Certification Integration | OPS formally CERTIFIED |

### 3.2 Sprint 017 certified evidence chain (frozen meaning)

```
OPS
  → REF-OPS fixtures
  → ReferenceRunner
  → ReferenceReport
  → ConformanceEngine(profile)
  → ConformanceReport(profile_id)
  → CertificationEngine
  → CertificationCertificate
```

Authoritative profiles (must not be mutated by SPEC-018):

| Profile | Corpus | Authorities |
|---------|--------|-------------|
| `CONF-001@1.0.0` | `REF-CORPUS-SCI` | SCI REQUIRED_* (frozen) |
| `CONF-001@1.1.0-OPS` | `REF-CORPUS-FULL` | SCI ∪ `{ OPS-001 }` (no `PERSIST-001`) |

There remains **one** Reference Test system, **one** ConformanceEngine, **one** CertificationEngine.

### 3.3 What Sprint 018 must not redo

Sprint 018 must **not** reopen Sprint 017’s conformance/certification architecture. It builds **above** the certified OPS surface.

---

## 4. Problem Statement

SciROS now has:

- a certified Scientific Core,
- certified Persistence infrastructure,
- a certified OPS Claim vertical slice,
- formal OPS entry into REF → CONF → CERT.

It does **not** yet have an architectural definition for:

1. whether `ResearchSession` remains the sole top-level operational unit,
2. how multi-unit research workflows (Evidence, Grade, Contradiction, NR, Verification) compose under OPS,
3. how scientific state differs from operational state,
4. how operational timeline relates to scientific provenance,
5. where documents/literature attach without inventing a competing KO,
6. where future AI may propose inputs without becoming scientific authority,
7. what abstract Persistence capabilities future research workflows need,
8. how future certification evidence would extend without breaking SCI/OPS profiles.

Without this design, future implementation risks:

- treating OPS as a second Core,
- persisting ResearchSession as if it were scientific,
- merging operational events into scientific provenance,
- inventing parallel journals / identity systems,
- expanding CONF/CERT prematurely,
- introducing AI or literature as silent authorities.

---

## 5. Current Architecture

### 5.1 Certified scientific / compliance stack

```
Scientific Core (SCI-000…006)
        ↓
Reference Processor (RPR-001: S05 / S06 / S17)
        ↓
Canonical Encoding (ENC-001)
        ↓
Serialization (SER-001 / SER-JSON-001)
        ↓
Reference Tests (REF-TEST-001/002/003) ──► ReferenceReport
        ↓
Conformance (CONF-001 profiles) ──► ConformanceReport(profile_id)
        ↓
Certification (CERT-001/002) ──► Certificate
```

### 5.2 Certified Research Operations stack

```
Research Operations (@sciros/reference-app)
   orchestrates → Scientific Core
               → ENC-001
               → Persistence (infrastructure)
               → SER / SER-JSON-001
```

OPS **orchestrates**. OPS does **not** author scientific meaning.

---

## 6. ResearchSession Current Contract

Locked by SPEC-016A / EXEC-SPRINT-016 / CODE-AUDIT-015 and preserved by SPEC-017 / CODE-AUDIT-018:

| Property | Contract |
|----------|----------|
| Ownership | OPS |
| Scientific entity? | **No** |
| Persistence | **MEMORY-ONLY** — not a Persistence entity |
| Identity | Caller-supplied deterministic `research_session_id` |
| Distinct from | `PersistenceSession.session_id` |
| Membership | In-memory `SessionMemberRef` (entity_kind, identity, unit_kind when needed) |
| Event journal | **None owned by OPS** — uses Persistence `appendEvent` only |
| Timeline | Read-only projection over Persistence events for session members |
| Snapshot | `ResearchSnapshot` = OPS view wrapping `PersistenceSnapshot` (not persisted as its own entity) |
| Vertical slice | Claim draft → ENC assemble → Persistence create → appendEvent → membership → get/timeline → snapshot → SER |

**SPEC-018 invariant:** `ResearchSession` remains memory-only unless a future audited design proves a *different* concept is required for durable workspace state. SPEC-018 does **not** authorize persisting `ResearchSession`.

---

## 7. Architectural Alternatives

### Option A — ResearchSession remains the sole top-level operational unit

**Summary:** No Workspace/Case layer. All future multi-unit workflows hang off one or many independent memory-only sessions.

| Dimension | Analysis |
|-----------|----------|
| Identity | Only `research_session_id` (operational) |
| Ownership | OPS |
| Lifecycle | Open → register members/units → inspect → discard (process end) |
| Persistence | Session not persisted; scientific units persist via Persistence |
| Provenance | Scientific provenance via Core/ENC; operational history via Persistence journal only |
| Timeline | Existing OPS timeline projection |
| Snapshots | Existing ResearchSnapshot wrapping PersistenceSnapshot |
| Certification | Current OPS profile sufficient for Claim slice; new REF-OPS fixtures for additional workflows later |
| Future AI | AI proposals enter via session-scoped OPS commands |
| Complexity | Lowest |
| Risks | Poor model for multi-session research programs; no durable operational case identity; hard to name “this investigation” across process restarts without inventing ad-hoc indexing |

**Fit:** Correct for the **certified Claim vertical slice**. Insufficient as the *only* long-term research-program boundary.

---

### Option B — ResearchWorkspace / ResearchCase contains ResearchSessions

**Summary:** Introduce an OPS-owned **Research Workspace** (also called Research Case) that groups one or more memory-only `ResearchSession`s and references scientific members by identity. Workspace is **not** a ScientificUnit.

| Dimension | Analysis |
|-----------|----------|
| Identity | Caller-supplied deterministic `research_workspace_id` (operational), distinct from session and Persistence session ids |
| Ownership | OPS |
| Lifecycle | Workspace open → zero or more Sessions open → unit registration under active session → workspace-level membership index (refs only) → inspect/export |
| Persistence | **Scientific units** remain Persistence CanonicalUnits. Workspace itself: **not** a scientific entity. Durable workspace index is **FUTURE** (see §17); design-phase default is memory-only workspace metadata unless a later EXEC explicitly implements durable OPS index |
| Provenance | Unchanged scientific provenance owners; workspace holds only refs + operational audit pointers |
| Timeline | Session timeline remains primary operational view; workspace may aggregate member timelines (read-only) |
| Snapshots | Workspace snapshot = deterministic set of member identities + PersistenceSnapshot subset/view; still not a second snapshot engine |
| Certification | Does **not** change Sprint 017 profiles. Future REF-OPS fixtures may evidence workspace orchestration under OPS-001 |
| Future AI | AI proposals attach to workspace/session as operational context, then enter Core validation |
| Complexity | Medium — new OPS concept, clear separation of case vs working session |
| Risks | Premature durability; confusing Workspace with scientific Case KO; accidental second journal if poorly implemented |

**Fit:** Aligns with SciROS ownership rules: keeps Session memory-only; adds organizational boundary for multi-unit research **without** new scientific authority.

---

### Option C — Promote Case to a Scientific Core entity (or Persistence-owned “folder”)

**Summary:** Create a Core `ResearchCase` KO or treat folders as Persistence scientific structure.

| Dimension | Analysis |
|-----------|----------|
| Identity | Would require new scientific identity / ontology |
| Ownership | Would pull OPS concern into Core or overload Persistence |
| Lifecycle | Scientific lifecycle rules would apply to operational grouping |
| Persistence | Would persist operational organization as if scientific truth |
| Provenance | High risk of duplicating or displacing scientific provenance |
| Timeline / Snapshots | Likely merge operational and scientific histories |
| Certification | Would force SCI authority / fixture / CONF changes |
| Future AI | Temptation to let AI “create cases” as scientific acts |
| Complexity | High governance cost |
| Risks | **Violates invariants** — OPS must not become scientific authority; Persistence must not own research meaning |

**Fit:** **Rejected** for Sprint 018 direction. Conflicts with certified ownership boundaries.

---

### Alternative evaluation conclusion (no scoring)

- **Option C** is incompatible with SciROS ownership invariants.  
- **Option A** remains valid as the *execution* model and as the certified baseline.  
- **Option B** is the justified evolution for research-program organization **because** it preserves memory-only `ResearchSession`, avoids a new scientific KO, and provides a place for multi-unit / multi-session research without reopening Persistence or Core.

**Recommendation for proposed architecture:** **Option B**, with Session remaining the active working boundary and Workspace the organizational boundary.

---

## 8. Proposed Architecture

### 8.1 Conceptual layers

```
ResearchWorkspace                  (OPS — organizational; normative name)
        │
        ├── ResearchSession*       (OPS — memory-only working boundary; Sprint 016 contract)
        │         └── optional bind → at most one ResearchWorkspace
        │
        ├── Member refs            (OPS — identity pointers only; see §8.6)
        │
        └── Orchestration commands (OPS)
                 │
                 ├── Scientific Core factories / transitions / relationships
                 ├── ENC assemble / decode
                 ├── Persistence create / get / appendEvent / snapshot
                 │     (Persistence replace = FUTURE only — §10.7)
                 └── SER encode / decode
```

\* Zero or more sessions may be bound to a workspace. Sessions do not become scientific.  
\* Sprint 016 **orphan sessions** (no workspace) remain valid (P-018-001).

### 8.2 Entities (OPS-owned, non-scientific)

| Concept | Kind | Persisted as scientific entity? | Notes |
|---------|------|----------------------------------|-------|
| `ResearchWorkspace` | Operational container | **No** | Normative name; deterministic caller-supplied `research_workspace_id` |
| `ResearchSession` | Operational working context | **No** (memory-only) | Existing Sprint 016 contract; may be orphan or bound |
| `SessionMemberRef` | Operational pointer | **No** | Primary working membership on a session |
| `WorkspaceMemberRef` | Operational pointer | **No** | Workspace index; maintained per §8.6 |
| `ResearchSnapshot` | Operational view | **No** | **Frozen Sprint 016 shape** — session-scoped only (P-018-003) |
| `WorkspaceSnapshot` | Operational view | **No** | **Additive** workspace view (P-018-003); not a second Persistence snapshot engine |
| `TimelineEntry` | Operational projection | **No** | Derived from Persistence events |

`ResearchCase` is an informal synonym for `ResearchWorkspace` only — **not** a second OPS type.

### 8.3 Entities (scientific — Core-owned)

Claim, Evidence, GradeDesignation, Contradiction, NegativeResult, Verification, and their scientific relationships remain **exclusively** Core-owned. OPS may only invoke Core APIs and persist ENC CanonicalUnits via Persistence.

### 8.4 Dependencies (direction)

```
@sciros/reference-app
  → @sciros/core
  → @sciros/encoding
  → @sciros/persistence
  → @sciros/serialization
  → (@sciros/processor only if orchestration requires host stages; not for scientific authorship)
```

No reverse dependency from Core/ENC/Persistence/SER/REF/CONF/CERT into OPS for meaning.

CONF/CERT continue to consume ReferenceReports only — never OPS objects directly.

### 8.5 Lifecycle (proposed) — with P-018-001 binding rules

**Normative binding rules (P-018-001):**

| Rule | Statement |
|------|-----------|
| B1 | `ResearchSession` **SHALL** remain valid **without** any `ResearchWorkspace` (Sprint 016 orphan-session compatibility). |
| B2 | A session **MAY** optionally bind to **at most one** `ResearchWorkspace`. |
| B3 | Binding is **OPS metadata only** (e.g. optional `research_workspace_id` on the session handle or workspace registry of session ids). |
| B4 | Binding **SHALL NOT** persist `ResearchSession` or make it a Persistence / scientific entity. |
| B5 | Unbinding / session end = memory discard of session state; does not delete scientific Persistence entities. |
| B6 | A workspace **MAY** exist with zero bound sessions (organizational shell only). |

**Lifecycle steps:**

1. (Optional) Open `ResearchWorkspace` with caller-supplied `research_workspace_id`.  
2. Open `ResearchSession` with caller-supplied `research_session_id` — either orphan (Sprint 016 path) or bound to a workspace (B2).  
3. Execute OPS commands: Core create/transition → ENC assemble → Persistence **create** (and **get** / **appendEvent** / **snapshot** as today). Persistence **replace** for post-persist scientific transitions remains **FUTURE** (§10.7) — not part of Workspace foundation semantics.  
4. On `registerMember`, update session membership and, if bound, workspace membership per §8.6.  
5. Project session `timeline` / `ResearchSnapshot` / SER export; optionally project `WorkspaceSnapshot`.  
6. End sessions (memory discard). Workspace in-memory member index may remain for the process; durable workspace index is FUTURE (§17, §25).

### 8.6 Membership model (P-018-002)

**Principle:** Membership is a **non-authoritative OPS index** of scientific identities. It is **never** a scientific relationship store and **never** overrides Core/ENC relationship semantics.

| Rule | Statement |
|------|-----------|
| M1 | `SessionMemberRef` is the **primary working membership** for a `ResearchSession` (Sprint 016 semantics unchanged). |
| M2 | `WorkspaceMemberRef` is a **workspace-level index** of scientific identities known to the workspace. |
| M3 | When a session is **bound** to a workspace and `registerMember(session, ref)` succeeds, OPS **SHALL** also upsert the same identity into that workspace’s member index (deterministic key: `entity_kind` + `identity` + `unit_kind` when present). |
| M4 | Workspace membership is therefore the **union** of identities registered through any currently or previously bound session **within the process lifetime** of the in-memory workspace (plus any explicit workspace-level register API if a future EXEC adds one — default is session-driven upsert only). |
| M5 | An **orphan** session (no workspace) updates **only** `SessionMemberRef` — identical to Sprint 016. |
| M6 | Divergent indexes are forbidden as a design outcome: workspace index is derived/maintained from session registrations (M3), not independently authored scientific truth. |
| M7 | Membership **SHALL NOT** store scientific field copies (proposition, standing, grades, relationship graphs, etc.). |
| M8 | Core relationships remain the sole authority for “supports / contradicts / grades / …” questions. |

---

## 9. Scientific vs Operational State

| Category | Examples | Owner | May OPS duplicate truth? |
|----------|----------|-------|---------------------------|
| Scientific entities | Claim, Evidence, GradeDesignation, Contradiction, NegativeResult, Verification | Scientific Core | **No** |
| Scientific relationships | supported_by, bears_on, grades, involved_claims, … | Scientific Core | **No** — OPS stores refs only |
| Canonical identity / integrity | unit envelopes, hashes, pins | ENC-001 | **No** |
| Serialized instances | SER-JSON-001 documents | SER | **No** — OPS requests encode/decode |
| Persisted rows / journal / snapshots | entities, events, PersistenceSnapshot | Persistence | **No** — OPS calls APIs |
| ResearchSession | working context, membership list | OPS | N/A (OPS-owned; not scientific) |
| ResearchWorkspace | case grouping, member index | OPS | N/A (OPS-owned; not scientific) |
| Operational timeline projection | TimelineEntry[] | OPS (read-only over Persistence) | Must not invent alternate journal |
| UI / temp working buffers | FUTURE UI state | Outside Core | Must not become scientific authority |
| Certification state | ConformanceReport, Certificate | CONF/CERT | OPS may *cite* certificates; must not mint them |

**Rule:** No operational object is a `ScientificUnit`. No OPS structure may shadow Core fields as authoritative copies.

---

## 10. Research Workflow Model

All workflows follow the same ownership pattern:

```
OPS command
  → Core (create / transition / validate)     [scientific meaning]
  → ENC assemble                              [canonical unit]
  → Persistence create / get / appendEvent    [infrastructure]
  → OPS membership registration               [operational refs]
  → optional SER encode                       [export]
```

Lower-layer typed errors propagate unchanged.

### 10.1 Claim (already certified vertical slice)

| Concern | Authority |
|---------|-----------|
| Creation / standing / version | SCI-001 / Core |
| Canonicalization | ENC-001 |
| Persistence | Persistence `create` (create-once identity rules) |
| Membership | OPS session/workspace refs |
| Events | Persistence journal via OPS `appendResearchEvent` |
| Timeline / snapshot / SER | Existing Sprint 016 semantics |

### 10.2 Evidence

| Concern | Authority |
|---------|-----------|
| Creation / registration / standing | SCI-002 / Core |
| Canonicalization | ENC-001 EvidenceUnit |
| Persistence | Persistence CanonicalUnit row |
| Association to Claim | Core relationship fields + ENC relationships; OPS registers both identities as members |
| Events | Persistence journal (explicit OPS append) |
| Future REF evidence | Additive REF-OPS fixtures (FUTURE EXEC) |

### 10.3 GradeDesignation

| Concern | Authority |
|---------|-----------|
| Grade assignment / eligibility | SCI-003 / Core |
| Canonicalization | ENC-001 GradeDesignationUnit |
| Persistence | Persistence |
| Link to Evidence | Core relationship semantics |
| OPS role | Orchestrate Core grade service → ENC → Persistence → membership |

### 10.4 Contradiction

| Concern | Authority |
|---------|-----------|
| Open / resolve semantics | SCI-004 / Core |
| Involved claims | Core |
| Canonicalization / Persistence | ENC + Persistence |
| OPS role | Register contradiction unit; ensure involved claim identities are members; append operational events as needed |

### 10.5 NegativeResult

| Concern | Authority |
|---------|-----------|
| Registration / transitions | SCI-005 / Core |
| Canonicalization / Persistence | ENC + Persistence |
| OPS role | Orchestration + membership + timeline |

### 10.6 Verification

| Concern | Authority |
|---------|-----------|
| Planned / passed / failed semantics | SCI-006 / Core |
| Canonicalization / Persistence | ENC + Persistence |
| OPS role | Orchestration + membership + timeline |

### 10.7 Post-persist scientific transitions

SPEC-016A deferred “Core transition → re-assemble → Persistence replace” as FUTURE. SPEC-018 **designs** the rule:

- Scientific transition remains Core-owned.  
- Re-assembly remains ENC-owned.  
- Persistence replace remains Persistence-owned (immutable CanonicalUnit rules apply).  
- OPS may orchestrate that sequence in a **future EXEC**, but must not invent a parallel transition engine.

Exact replace/version interaction with Persistence immutability remains an **open question** for a later design/audit if implementation is attempted (§26).

---

## 11. Relationship Model

| Rule | Statement |
|------|-----------|
| Authoritative relationships | Live only in Core objects / ENC relationship projections |
| OPS storage of relationships | **Forbidden** as parallel graphs |
| OPS membership | Identity pointers only — governed by §8.6 (P-018-002) |
| Timeline | May display relationship-affecting Persistence events; does not redefine relationships |
| Export | SER projects CanonicalUnits including relationships; OPS does not rewrite them |

---

## 12. Timeline Model

### Decision: Option C — separate operational timeline from scientific provenance

| Stream | Source of truth | Purpose |
|--------|-----------------|---------|
| **Operational event history** | Persistence event journal (sole journal) | Auditable OPS/Persistence actions (`appendEvent`) |
| **Scientific provenance** | Core provenance fields + ENC unit authority pins + scientific relationships | “Why is this Claim standing X?” / “Which Evidence supports it?” |

**Rules:**

1. OPS must **not** create a second event journal.  
2. OPS `timeline()` remains a **read-only projection** of Persistence events for selected members.  
3. Scientific provenance queries are answered by Core/ENC data (and Persistence-held CanonicalUnits), **not** by inventing timeline entries that redefine science.  
4. Workspace-level timeline aggregation (FUTURE) is still projection-only.

**Rejected:** Merging operational events and scientific provenance into one ambiguous stream.

---

## 13. Snapshot Model

| Aspect | Rule |
|--------|------|
| PersistenceSnapshot | Owned by Persistence — deterministic infrastructure snapshot |
| `ResearchSnapshot` (**frozen Sprint 016**) | OPS view: `{ research_session_id, member_refs, persistence_snapshot }` only — **no workspace fields** (P-018-003) |
| `WorkspaceSnapshot` (**additive**) | OPS view: `{ research_workspace_id, member_refs, bound_session_ids?, persistence_snapshot }` — deterministic ordered member list + PersistenceSnapshot (or filtered subset) |
| Identity | Snapshot ids from Persistence rules; OPS must not mint competing snapshot authorities |
| Determinism | Same members + same Persistence state ⇒ same exportable snapshot content |
| Reconstruction | Rebuild views from Persistence entities/events + OPS member refs; do not require persisted ResearchSession |
| Relationship/event state | Contained in Persistence payload / journal; OPS does not duplicate |

**P-018-003:** Certified Sprint 016/017 `ResearchSnapshot` semantics and field set remain unchanged. Workspace views use `WorkspaceSnapshot` (or equivalent named additive type) — **not** a breaking extension of `ResearchSnapshot`. Neither view is a second Persistence snapshot engine.

---

## 14. Provenance Model

### Scientific provenance (authoritative)

Owned by Scientific Core (+ ENC authority/integrity metadata):

- entity provenance structures,
- standing transition reasons / decision refs (where Core defines them),
- scientific relationships,
- ontology/spec pins on CanonicalUnits.

### Operational audit history

Owned by Persistence journal + OPS projections:

- `appendEvent` records with caller-supplied deterministic event ids,
- who/what invoked an OPS command (as event fields when recorded),
- order of operational actions.

### Certification provenance (citation only)

Certificates and ConformanceReports are produced by CERT/CONF. OPS may record certificate ids as operational references in FUTURE workflows; OPS must **not** generate certification decisions.

**Forbidden:** A third “OPS provenance authority” that competes with Core or Persistence.

---

## 15. Document / Literature Boundary

### Decision (design)

Do **not** introduce a Scientific Core `Document` KO in Sprint 018.

| Approach | Role |
|----------|------|
| **Primary** | Literature enters research as **Evidence** (SCI-002) with `source` / `source_locator` / provenance |
| **Secondary (FUTURE)** | Optional **DocumentArtifact** as Persistence infrastructure payload (bytes/metadata), referenced by Evidence — **not** a ScientificUnit |
| **External refs** | Immutable locators (DOI, URL, content hash) recorded on Evidence/source — preferred before inventing entities |

| Concern | Implication |
|---------|-------------|
| Identity | Evidence identity remains scientific; document artifact identity (if any) is infrastructure |
| Provenance | Scientific provenance on Evidence; artifact hash/locator as supporting metadata |
| Versioning | Core Evidence versioning rules; artifact immutability via hash |
| Serialization | SER of CanonicalUnits; binary artifacts out of SER-JSON unless a future SER profile exists |
| AI ingestion | AI may propose Evidence drafts from documents; Core validates |

**Open:** Whether DocumentArtifact is required before first literature EXEC (§26).

---

## 16. AI Integration Boundary

### Principle

**AI is an assisting actor. AI is not a scientific authority.**

```
AI system (external)
  → proposal payload (claim text, evidence candidates, links, summaries)
  → OPS proposal intake (FUTURE)
  → Core validation / factories / transitions
  → ENC assemble
  → Persistence
  → membership / events
  → Reference evidence / CONF / CERT where applicable
```

| Rule | Statement |
|------|-----------|
| AI may propose | Text, candidates, suggested relationships, ranked lists |
| AI may not | Directly set scientific standing, mint CanonicalUnits, write Persistence as authority, issue certificates |
| Human / validated agent | Remains required where Core already requires Human Reviewer / ADR-0006 constraints |
| Provenance | AI involvement recorded as operational/source metadata — never as replacement for Core provenance |
| Sprint 018 | Design only — **no AI implementation** |

---

## 17. Persistence Requirements

Abstract requirements for future research workflows (no database, no migrations):

| Capability | Requirement |
|------------|-------------|
| Entity persistence | CanonicalUnits for all six KO kinds via existing Persistence APIs |
| Relationship persistence | As encoded in CanonicalUnits / Persistence relationships — no OPS graph store |
| Event persistence | Single Persistence journal; deterministic event ids; ordinal rules |
| Snapshot persistence | PersistenceSnapshot; OPS ResearchSnapshot remains a view |
| Query | Get/list by identity and unit_kind; member-set reconstruction |
| Deterministic reconstruction | Same inputs ⇒ same entities/events/views |
| Version handling | Respect Persistence/Core version contracts |
| Provenance lookup | Retrieve CanonicalUnits and events; Core interprets scientific provenance |
| Workspace durability | **FUTURE optional** OPS index of workspace id → member identities — must not store scientific field copies |

**Explicitly out of Sprint 018:** PostgreSQL, Redis, Kafka, Elasticsearch, vector DB, event-sourcing platforms, CQRS, distributed transactions.

`PERSIST-001` remains **not** required by OPS profile v1 (Sprint 017). Any future Persistence-conformance authority is a separate design.

---

## 18. Serialization / Export

| Requirement | Owner |
|-------------|-------|
| Unit export | SER-JSON-001 via existing encoders |
| Research-state export (FUTURE) | Deterministic package of: workspace/session metadata (OPS) + ordered member identities + SER projections of units + optional event excerpts |
| Bundle/ZIP | FUTURE — not designed as SER contract change |
| SER contracts | **Unchanged** by SPEC-018 |

Export must be reconstructible and free of wall-clock unless explicitly labeled non-evidence metadata (and such metadata must not enter REF/CONF/CERT evidence).

---

## 19. Conformance / Certification Impact

### Remains unchanged (mandatory)

- `CONF-001@1.0.0` semantics and global SCI REQUIRED_*  
- `CONF-001@1.1.0-OPS` semantics (SCI ∪ OPS-001; FULL corpus)  
- One ConformanceEngine / one CertificationEngine  
- REF → CONF → CERT chain  
- ResearchSession memory-only boundary as certified  

### FUTURE (not Sprint 018)

| Possible future item | Notes |
|----------------------|-------|
| Additional REF-OPS fixtures | Evidence/Grade/Contradiction/NR/Verification/Workspace orchestration |
| Additive OPS profile version | Only if new OPS surface requires it — must not mutate `@1.0.0` or silently expand SCI |
| Workspace-specific fixture family | Still under REF-OPS / OPS-001 unless audit proves otherwise |
| PERSIST-001 | Still deferred |

### Not part of Sprint 018

Any CONF/CERT code, fixture, profile, or authority change.

---

## 20. Security / Integrity Boundaries

Architecture-level only:

| Boundary | Rule |
|----------|------|
| Identity | Scientific identities authoritative; OPS ids are operational and distinct |
| Tampering | CanonicalUnits immutable per Persistence rules; OPS must not mutate payloads |
| Provenance | Scientific vs operational streams separated (§14) |
| Operational events | Deterministic ids; no silent rewrite of journal history |
| Authorization | FUTURE — OPS may later gate commands; must not embed auth into Core |
| AI trust | AI outputs untrusted until Core validation (§16) |
| Certification | Only CERT-001/002 mint certificates |

---

## 21. Determinism

| Artifact | Determinism rule |
|----------|------------------|
| Workspace / session ids | Caller-supplied; no `randomUUID` / `Date.now` in evidence paths |
| Event ids | Caller-supplied deterministic |
| Member order in snapshots/exports | Stable sorted order by identity (and unit_kind when needed) |
| Timeline order | Existing Persistence/OPS ordering (parent → ordinal → event_id) |
| Reconstruction | Same Persistence state + same member refs ⇒ same views |
| REF/CONF/CERT | Unchanged: no wall-clock in evidence |

---

## 22. Error Model

| Layer | Policy |
|-------|--------|
| Core / ENC / SER / Persistence errors | Propagate unchanged |
| Existing OPS errors | `INVALID_SESSION`, `INVALID_MEMBERSHIP`, `INVALID_COMMAND_STATE` |
| New OPS errors | Only if Workspace introduces genuinely new failure modes (e.g. `INVALID_WORKSPACE`) — **FUTURE EXEC detail**; must not wrap lower-layer codes |

---

## 23. Dependency Graph

```
apps/reference-app (OPS)
  ├─ packages/core
  ├─ packages/encoding
  ├─ packages/serialization
  ├─ packages/persistence
  └─ packages/processor          (optional host use; not authorship)

packages/reference-tests
  └─ (evidences OPS via REF-OPS; may depend on reference-app)

packages/conformance → reference-tests
packages/certification → conformance
```

**No cycles** that make Core depend on OPS. CONF/CERT must not depend on OPS objects.

---

## 24. Scope

### IN (this document)

- Architecture and workflow design for Research Workspace evolution  
- Scientific vs operational ownership  
- Timeline / provenance / snapshot / document / AI boundaries  
- Abstract Persistence requirements  
- Future sprint decomposition  
- Open questions and acceptance criteria for the **design**

### OUT

- Implementation of any kind  
- AI / LLM / embeddings / vector DB / agents  
- UI / React / CLI product  
- Databases / SQL / migrations / Docker / cloud  
- Literature crawlers / PDF pipelines  
- Microservices / queues / event buses  
- Changes to frozen SCI/ENC/SER/RPR/CONF/CERT/Persistence/REF contracts  
- New certification profiles in this sprint  

---

## 25. Future Sprint Decomposition

Logical candidates (**names illustrative; not authorized**):

| Candidate | Intent |
|-----------|--------|
| Research Workspace Foundation | Introduce memory-only Workspace grouping + APIs; keep Session contract |
| Evidence Operations | OPS Evidence registration + membership + REF-OPS evidence |
| Multi-unit Operations | Grade / Contradiction / NR / Verification orchestration |
| Research Provenance Views | Read models distinguishing scientific provenance vs operational audit |
| Literature Boundary | Evidence+locator patterns; optional DocumentArtifact design EXEC |
| AI Proposal Boundary | Proposal intake adapters; never scientific authority |
| Durable Workspace Index | Optional Persistence-backed OPS member index (not ResearchSession persistence) |
| Research Export Bundle | Deterministic multi-unit export using existing SER |
| OPS Certification Extension | Additive REF-OPS fixtures / possible future profile bump — audited separately |

These are **FUTURE WORK**. SPEC-018 does not schedule or implement them.

---

## 26. Open Questions

1. **Workspace durability:** Should the first Workspace EXEC be memory-only only, or include a Persistence-backed OPS index in the same EXEC?  
2. ~~**Naming:** Prefer `ResearchWorkspace` vs `ResearchCase`?~~ **CLOSED (patch):** `ResearchWorkspace` is normative; `ResearchCase` is informal synonym only.  
3. **Multi-session concurrency:** Are overlapping sessions within one workspace allowed to mutate the same scientific identity, or must OPS serialize per identity?  
4. **Post-persist transitions:** Exact Persistence replace path for standing transitions under CanonicalUnit immutability — needs Persistence-aware design before EXEC.  
5. **DocumentArtifact:** Required before literature workflows, or is Evidence.source sufficient for first literature EXEC?  
6. **AI proposal schema:** Stable proposal types vs free-form payloads — deferred to AI boundary sprint.  
7. **Workspace REF-OPS evidence:** New fixture themes vs extension of existing REF-OPS family under OPS-001.  
8. **Certificate citation in OPS events:** Whether recording CERT ids in Persistence events is desirable or scope creep.  
9. **Human multi-actor model:** Out of scope now; may affect future authZ and ADR-0006 operationalization.  
10. **Query API surface:** Whether OPS should expose read-only scientific graph queries or remain command/projection only.  
11. **Durable workspace uniqueness:** Process-local vs durable uniqueness rules for `research_workspace_id` when FUTURE durable index exists.

Unresolved items must be closed by future design audits before related EXEC sprints.

---

## 27. Acceptance Criteria (for SPEC-018 as a design)

SPEC-018 is **design-complete** iff:

| ID | Criterion |
|----|-----------|
| AC-018-001 | Sprint 016 ResearchSession semantics are explicitly preserved (memory-only, non-scientific) |
| AC-018-002 | Sprint 017 REF→CONF→CERT chain and profiles are explicitly preserved (no mutation) |
| AC-018-003 | Alternatives A/B/C are analyzed without scoring; recommendation is justified by ownership constraints |
| AC-018-004 | Proposed architecture does not create a new scientific authority |
| AC-018-005 | Scientific vs operational ownership table is explicit |
| AC-018-006 | Workflows for Claim/Evidence/Grade/Contradiction/NR/Verification are designed without implementation |
| AC-018-007 | No duplicate provenance authority is introduced |
| AC-018-008 | No second event journal is introduced |
| AC-018-009 | Timeline vs scientific provenance separation is explicit |
| AC-018-010 | Document/literature boundary is explicit without forcing a Core Document KO |
| AC-018-011 | AI boundary states AI is non-authoritative |
| AC-018-012 | Persistence requirements are abstract; no DB/vendor design |
| AC-018-013 | Certification impact states what is unchanged vs FUTURE |
| AC-018-014 | Future sprint candidates are listed without authorizing EXEC |
| AC-018-015 | Open questions are enumerated |
| AC-018-016 | Scope IN/OUT and non-goals forbid AI/UI/DB/implementation |
| AC-018-017 | Dependency direction forbids Core←OPS meaning dependence |
| AC-018-018 | Status remains pending independent re-audit (not self-approved) |
| AC-018-019 | **P-018-001:** Orphan sessions and optional ≤1 workspace binding are normative; session never persisted |
| AC-018-020 | **P-018-002:** Membership rules M1–M8 define session primary + workspace union index; no scientific relationship store |
| AC-018-021 | **P-018-003:** `ResearchSnapshot` frozen; `WorkspaceSnapshot` additive |

---

## 28. Non-Goals

SPEC-018 does **not**:

- implement Workspace or new OPS APIs,
- persist ResearchSession,
- add Evidence/Grade/Contradiction/NR/Verification runtime workflows,
- modify SCI/ENC/SER/RPR/CONF/CERT/Persistence/REF packages,
- file PERSIST-001,
- add AI, UI, CLI, databases, crawlers, embeddings, agents,
- create microservices, queues, or cloud architecture,
- change Sprint 017 certificates or profiles,
- claim architecture approval.

---

## 29. Final Architectural Decision

### Decision summary

Adopt **Option B** as the architectural direction:

- Introduce OPS-owned **`ResearchWorkspace`** (normative name; `ResearchCase` = informal synonym) as the organizational research boundary.  
- Keep **`ResearchSession`** as the memory-only working boundary (Sprint 016/017 invariant), including **orphan sessions** without a workspace.  
- Membership: session primary; workspace index = union via `registerMember` upsert when bound (P-018-002).  
- Snapshots: freeze `ResearchSnapshot`; add `WorkspaceSnapshot` (P-018-003).  
- Keep scientific meaning in Core; Persistence as infrastructure; ENC/SER/REF/CONF/CERT unchanged.  
- Separate **operational timeline** (Persistence journal projections) from **scientific provenance** (Core/ENC).  
- Treat literature primarily as **Evidence**; optional DocumentArtifact is FUTURE infrastructure.  
- Treat AI as a **proposal actor**, never a scientific authority.

### Formal status line

**READY FOR ARCHITECTURE RE-AUDIT (CODE-AUDIT-019A)**

---

*End of SPEC-018 v0.2.0-PATCHED (design only).*


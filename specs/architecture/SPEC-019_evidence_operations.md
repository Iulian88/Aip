# SPEC-019 — Evidence Operations

| Field | Value |
|-------|--------|
| Spec ID | SPEC-019 |
| Title | Evidence Operations — Research Operations Extension |
| Version | **0.1.0-DRAFT** |
| Status | **DRAFT — READY FOR ARCHITECTURE AUDIT** |
| Mode | Architecture / specification only — **NO IMPLEMENTATION** |
| Project | AIP — evidence-driven computational platform for exploring, modeling, and researching human biology |
| Inputs | SCI-002@0.1.0, SCI-000, SCI-001, SCI-003 (grade boundary), ADR-0006, SPEC-016A, SPEC-017 v0.2.0-PATCHED, SPEC-018 v0.2.0-PATCHED, CODE-AUDIT-020, ARCHITECTURE-REVIEW-001, EXEC-SPRINT-016…018 (certified) |
| Intended re-audit | Future CODE-AUDIT (architecture) before any EXEC-SPRINT-019 |
| Does not claim | Approval, EXEC readiness, or certification |

---

## 1. Status and Version

**Version:** `0.1.0-DRAFT`  
**Status:** DRAFT — READY FOR ARCHITECTURE AUDIT  

This document authorizes **neither** code changes nor fixture creation. It must pass independent architecture audit (and any required patches / re-audit) before EXEC.

---

## 2. Context

AIP Sprint 018 is **FORMALLY CERTIFIED AND CLOSED**. Research Operations today provides:

- memory-only `ResearchSession` and `ResearchWorkspace`
- Claim-centric create-once orchestration: Core → ENC → Persistence → event → timeline → snapshot → SER
- additive OPS evidence chain: REF-OPS → Conformance (`CONF-001@1.1.0-OPS`) → Certification

Scientific Core already implements **Evidence** (SCI-002) with factories, validation, Record State transitions, ENC `EvidenceUnit`, SER round-trips, and SCI REF fixtures (`REF-EVID-*`).

**Gap:** OPS does not orchestrate Evidence. ARCHITECTURE-REVIEW-001 identified Evidence OPS as a natural research-operations extension **without** inventing a second Evidence model.

---

## 3. Problem Statement

Without Evidence Operations:

1. Certified Core Evidence cannot enter ResearchSession / ResearchWorkspace workflows.
2. Claim OPS cannot be complemented by warrant-bearing Evidence in the same OPS shell.
3. Timeline / membership / export paths remain Claim-skewed relative to the scientific surface.
4. Future literature, AI proposal, and multi-unit OPS work lack a safe Evidence orchestration pattern.

The problem is **operational under-exercise** of existing scientific Evidence—not missing Evidence semantics.

---

## 4. Goals

1. Define OPS orchestration for Evidence **analogous in architectural role** to Claim OPS (SPEC-016A).
2. Preserve Scientific Core as the sole Evidence meaning authority (SCI-002).
3. Reuse ENC `EvidenceUnit`, Persistence create-once + event journal, SER-JSON-001, Session/Workspace membership (SPEC-018 M1–M8), frozen `ResearchSnapshot`, additive `WorkspaceSnapshot`.
4. Keep membership organizational; keep Core `bears_on` (and related) as the scientific relationship authority.
5. Specify future REF-OPS / CONF / CERT integration as **additive** evidence under existing OPS profile rules where possible.
6. Explicitly defer post-persist Evidence evolution, Grade OPS, literature, DocumentArtifact, durable workspace, concurrency, AI, UI/API/DB.

---

## 5. Non-Goals

SPEC-019 does **not** implement or authorize:

| Forbidden | Reason |
|-----------|--------|
| Database / durable Persistence adapter | Infrastructure not required for OPS design |
| Durable Workspace index | SPEC-018 deferred; memory-only preserved |
| Backend / API / frontend / authN / authZ / cloud | Access layer premature |
| Literature ingestion / crawlers / DOI clients / PDF pipelines | FUTURE Literature boundary |
| DocumentArtifact as ScientificUnit or OPS requirement | FUTURE; Evidence.source sufficient for foundation |
| Knowledge Graph / graph database | Would risk second relationship authority |
| AI Evidence generation/validation/ranking/auto-registration | AI non-authoritative; FUTURE proposal workflow |
| Human Digital Twin / organ/cell/gene ontologies | Domain modeling premature |
| New scientific Evidence semantics | SCI-002 remains authority |
| Second Evidence event journal | Single Persistence journal |
| Second ConformanceEngine / CertificationEngine | Sprint 017 frozen |
| Profile mutation in this SPEC | Document only if later audit requires bump |
| Post-persist replace / in-place Evidence mutation | Separate future SPEC (with Claim post-persist) |
| Multi-session concurrency / distributed locking / uniqueness | Explicitly deferred |
| Evidence Grade OPS (SCI-003 assignment workflows) | Separate future package |
| Contradiction / NR / Verification OPS | Separate future packages |
| Solving CODE-AUDIT-020 observations | Carry-forward; not Sprint 018.1 |

---

## 6. Frozen Contracts

The following remain frozen unless a future audited SPEC authorizes compatible evolution:

| Contract | Source |
|----------|--------|
| Scientific Core Evidence meaning | SCI-002 / `packages/core` Evidence* |
| Claim OPS create-once path | SPEC-016A / Sprint 016 |
| ResearchSession memory-only; orphan sessions valid | SPEC-016A / SPEC-018 P-018-001 |
| ResearchWorkspace memory-only; ≤1 workspace per session; OPS-only binding | SPEC-018 |
| Membership M1–M8 (session primary; workspace upsert; not relationship store) | SPEC-018 P-018-002 |
| `ResearchSnapshot` field set | Sprint 016 / SPEC-018 P-018-003 |
| `WorkspaceSnapshot` additive OPS view | SPEC-018 P-018-003 |
| Persistence create-once immutability; single event journal | Sprint 015 / SPEC-016A |
| ENC / SER ownership | ENC-001 / SER-001 / SER-JSON-001 |
| One ConformanceEngine; one CertificationEngine | SPEC-017 |
| Profiles `CONF-001@1.0.0` and `CONF-001@1.1.0-OPS` | Sprint 017 (additive fixtures preferred) |
| ONE SOURCE OF SCIENTIFIC TRUTH | Platform invariant |
| AI does not own scientific truth | Platform invariant |

---

## 7. Existing Scientific Evidence Model

**Authority:** SCI-002@0.1.0 implemented in `@sciros/core` (`packages/core/src/evidence/**`).

### 7.1 What Evidence is

Evidence is a Knowledge Object that **attaches warrant** to Claims. It **SHALL NOT** replace Claims, set Claim Standing, or certify clinical validity (SCI-002).

### 7.2 Creation

- `EvidenceFactory.createDraft(CreateEvidenceInput)` → `Evidence` with `record_state: "draft"`.
- Caller-supplied: `evidence_id`, `summary`, `source`, `provenance`, `created_by`, `created_at` (UTC-second form), optional items/collection/`bears_on`/pins/version/AI flags.
- Default pins: `ontology_ref` SCI-000@0.1.0, `spec_ref` SCI-002@0.1.0, `evidence_version` 1.0.0.
- Default `grade_ref`: `deferred_sci003` until SCI-003 assignment.

### 7.3 Identity

- Scientific identity: `evidence_id` (caller-supplied; Core/identifier rules).
- Canonical unit identity: same `evidence_id` on `EvidenceUnit` envelope (ENC).
- Persistence identity: CanonicalUnit identity preserved; `unit_kind: "EvidenceUnit"` required for unambiguous lookup (EvidenceUnit and GradeDesignationUnit can share evidence identity in storage_key design).

### 7.4 Authoritative fields (logical)

Including: `evidence_id`, pins, `evidence_version`, `summary`, `record_state`, `source` (`source_class`, `source_locator`, `source_state`), `provenance` (completeness, obtained_at, transform_summary, custody_agent, optional refs), `grade_ref`, `ethics_constraint_marker: "non_clinical"`, `created_by`/`created_at`, `items`, optional `collection`, optional `bears_on` (Claim ids), optional AI/human_sponsor/citation/dataset/protocol fields, optional transition/grade logs.

### 7.5 Relationships (Core / ENC)

| Relation | Owner | Meaning |
|----------|-------|---------|
| `bears_on` → Claim id(s) | Core Evidence + ENC references | Evidence warrants / bears on Claim(s) — **scientific** |
| Claim `supported_by` → Evidence id(s) | Core Claim + ENC | Inverse scientific linkage from Claim side |
| Grade `grades` → Evidence | SCI-003 / ENC GradeDesignationUnit | Grade assignment — **out of SPEC-019 EXEC foundation** |
| Verification / Contradiction cites | SCI-004/006 | Out of SPEC-019 foundation |

OPS membership **is not** any of the above.

### 7.6 Validation and errors

- `EvidenceValidator` and specialized source/provenance/item/collection validators.
- Failures surface as `EvidenceValidationError` with SCI-002 failure codes (F1…, F_TRANSITION, F_AI, …).

### 7.7 Record State transitions

- States: `draft` → `registered` | `withdrawn`; `registered` → `withdrawn`; `withdrawn` terminal.
- `EvidenceTransitionService.transition` — Human Reviewer required for `registered`; AI must not register (REF-EVID-004).
- Registration requires non-empty `decision_ref`.
- Forbidden states include Claim Standing vocabulary and workflow words (ADR-0006).

### 7.8 Grading

- Grade ladder and assignment: **SCI-003** (`EvidenceGradeService` exists in Core).
- SPEC-019 foundation **does not** define OPS Grade workflows. `grade_ref` may remain `deferred_sci003` on registered Evidence.

### 7.9 Verification

- Verification is SCI-006 — **out of SPEC-019 foundation**.

### 7.10 Canonicalization and serialization

- ENC: `CanonicalEncoder.assemble(evidence)` → `EvidenceUnit` with content + `bears_on` references + ERTE/GAE events mapped into unit events.
- SER: SER-JSON-001 encode/decode of CanonicalUnits (existing REF-RT / REF-SER coverage).

### 7.11 Persistence immutability

- After `Persistence.create` of CanonicalUnit, differing `replace` → `IMMUTABLE_ENTITY` (Sprint 015).
- Therefore **create-once** applies to EvidenceUnits the same as ClaimUnits.
- Core-side transition/version services remain valid **in memory before first persist**; **post-persist** Record State / material version evolution requires a **future** Persistence-aware SPEC (shared problem with Claim).

---

## 8. Scientific vs Operational Ownership

| Concern | Owner | OPS role |
|---------|-------|----------|
| Evidence meaning, Record State, Source, Provenance, Items | Scientific Core | Must not redefine |
| `bears_on` / Claim support linkage | Core + ENC projections | Read/project only; never invent edges |
| Canonical identity/integrity | ENC | Invoke assemble only |
| Wire form | SER | Invoke encode/decode only |
| Stored CanonicalUnit + Persistence events | Persistence | create / get / appendEvent / snapshot |
| Session/workspace membership | OPS | Identity pointers only |
| Timeline / OPS snapshots | OPS | Projections; not scientific provenance |
| REF / CONF / CERT | REF / CONF / CERT | Evidence OPS enters via REF-OPS reports |

**Rule:** No operational object is a ScientificUnit. No OPS structure may shadow Core Evidence fields as authoritative copies.

---

## 9. Evidence Identity

| Id | Layer | Notes |
|----|-------|-------|
| `evidence_id` | Scientific | Caller-supplied; Core-validated |
| CanonicalUnit identity | ENC | Equals `evidence_id` for EvidenceUnit |
| Persistence entity identity | Persistence | Same scientific identity; lookup requires `unit_kind: "EvidenceUnit"` |
| Persistence `session_id` | Infra | Distinct |
| `research_session_id` | OPS | Distinct |
| `research_workspace_id` | OPS | Distinct |

**Q1 closed:** Evidence OPS identity boundary is the Core/ENC `evidence_id` carried as CanonicalUnit identity with `unit_kind: "EvidenceUnit"`. OPS must not mint scientific Evidence ids.

Deterministic evidence paths: no `Date.now` / `Math.random` / `randomUUID` for Evidence or event ids; caller supplies them.

---

## 10. Evidence Registration

### 10.1 Normative create-once orchestration (mirrors Claim)

```
EvidenceFactory.createDraft(input)
    → (optional) EvidenceTransitionService.transition(...)   // in-memory only, before persist
    → CanonicalEncoder.assemble(evidence)
    → entityFromCanonicalUnit(unit)
    → PersistenceRepository.create(entity)
```

**Q2 closed:** Use existing `EvidenceFactory` (+ optional `EvidenceTransitionService` before encode). Do **not** duplicate Evidence construction in OPS.

### 10.2 Recommended OPS command (conceptual)

**Name (illustrative):** `registerEvidenceUnit`

| Aspect | Rule |
|--------|------|
| Purpose | Orchestrate Core → ENC → Persistence create for one EvidenceUnit |
| Input | `CreateEvidenceInput` plus optional pre-persist transition params **or** a Core-produced `Evidence` already validated |
| Output | `{ evidence, unit, entity }` (shape analogous to Claim registration result) |
| Ownership | OPS orchestration; Core/ENC/Persistence retain semantics |
| Persistence | `create` only; create-once |
| Determinism | Caller-supplied `evidence_id`, `created_at`, transition `at` / `event_id` when used |
| Scientific state | May create draft Evidence; MAY transition to `registered`/`withdrawn` **only in memory before create** |
| Errors | Core/ENC/Persistence errors propagate unchanged |

### 10.3 Registration policy (foundation)

1. **Default path:** persist `draft` Evidence (parity with Claim draft create-once).  
2. **Optional path:** caller may transition to `registered` (Human Reviewer + `decision_ref`) before assemble/create so the **first** persisted unit is registered.  
3. **Forbidden in SPEC-019 EXEC:** Persistence `replace` after create to apply Record State changes.

**Q11 closed:** Existing Evidence lifecycle supports create-once OPS for draft and for optionally pre-persisted registered Evidence.  
**Q12 closed:** Post-persist Record State / material version / grade-driven unit evolution remains a **separate future SPEC**.

### 10.4 Association with session

Registration **does not** auto-membership. Explicit `registerMember(session, { entity_kind: "CanonicalUnit", identity, unit_kind: "EvidenceUnit" })` required (same as Claim).

---

## 11. Evidence Membership

**Q3 closed:** Evidence membership **SHALL** follow SPEC-018 M1–M8:

| Rule | Application to Evidence |
|------|-------------------------|
| M1 | Session membership primary working set |
| M2 | Workspace member index of scientific identities |
| M3 | Bound session `registerMember` upserts workspace (key: `entity_kind` + `identity` + `unit_kind`) |
| M4 | Workspace = union via session-driven upsert (+ existing explicit workspace register API) |
| M5 | Orphan session updates session only |
| M6–M8 | Non-authoritative OPS index; no scientific field copies; Core owns relationships |

**Identity tuple for Evidence membership:**

```
entity_kind: "CanonicalUnit"
identity: <evidence_id>
unit_kind: "EvidenceUnit"
```

Membership means **organizational inclusion only**. It does **not** mean supports / contradicts / validates / proves / causes / grades.

---

## 12. Evidence Relationships

| Kind | Mechanism | OPS behavior |
|------|-----------|--------------|
| Scientific `bears_on` | Core field → ENC references | Created only via Core Evidence input; OPS may pass through `CreateEvidenceInput.bears_on`; must not invent alternate edges |
| Scientific Claim `supported_by` | Core Claim | Not rewritten by Evidence OPS; Claim workflows remain Claim-owned |
| OPS membership | Session/Workspace refs | Organizational only |
| Persistence events | appendEvent journal | Operational audit; not relationship store |

**Projection:** Queries that need relationships **SHALL** read CanonicalUnit / Core objects (or ENC reference lists) — **read-only**. No OPS relationship graph.

---

## 13. Evidence Provenance

### 13.1 Layers (must not collapse)

| Layer | What it is | Owner |
|-------|------------|-------|
| **Source metadata** | `Evidence.source` (class, locator, state) | Core |
| **Scientific provenance** | `Evidence.provenance` (+ items/collection) | Core |
| **Scientific transition history** | `record_transition_log` / grade logs on Evidence; ENC unit events | Core / ENC |
| **Operational Persistence journal** | `PersistenceEvent` via `appendEvent` | Persistence |
| **OPS timeline projection** | Ordered view of Persistence events for session members | OPS |

### 13.2 OPS exposure

- OPS **MAY** surface Core `source` / `provenance` fields when projecting/exporting EvidenceUnits (via get/export).
- OPS **MUST NOT** invent literature resolution, crawl results, or DocumentArtifact bytes as Evidence meaning.
- `source_locator` is **locator metadata**, not proof of truth.
- **Q9 closed:** OPS exposes existing Core source/provenance fields only; no new provenance authority.

### 13.3 DocumentArtifact / literature

**FUTURE — Literature / DocumentArtifact boundary.** Not required for Evidence Operations foundation while `EvidenceSource` + `EvidenceProvenance` exist.

---

## 14. Timeline Semantics

### 14.1 Operational timeline

Existing OPS `timeline(session)` projects Persistence events for **all** session member identities (Claim or Evidence). No second journal.

### 14.2 Recommended operational events (caller-supplied; illustrative types)

OPS **MAY** append Persistence events after create, e.g.:

- `ops.evidence.registered` — operational note that create/membership occurred  
- Existing pattern parity with Claim: `ops.registered` or evidence-specific type string

**Normative constraints:**

1. Event ids / ordinals / `at` caller-supplied and deterministic.  
2. Event **does not** assert scientific “proves Claim.”  
3. Scientific ERTEs live on the Evidence / EvidenceUnit; Persistence events are infrastructure/OPS audit.  
4. **Q8 closed:** Operationally meaningful events are Persistence journal entries for OPS audit/timeline; scientific Record transitions remain Core ERTEs (pre-persist) until a future post-persist SPEC.

### 14.3 Timeline ≠ scientific provenance

An OPS timeline entry “Evidence registered” **≠** Evidence proves a Claim. Proof/warrant requires Core relationships + Record State + Grade/Verification rules as applicable.

---

## 15. ResearchSession Integration

**Q4 closed:**

- Orphan sessions remain valid (no workspace).
- Evidence is included by explicit membership with `unit_kind: "EvidenceUnit"`.
- `timeline` / `snapshotView` automatically include Evidence members via identity list — **no ResearchSnapshot schema change**.
- Sprint 016 Claim path remains valid without Evidence.

---

## 16. ResearchWorkspace Integration

**Q5 closed:**

- Binding rules unchanged (optional; ≤1 workspace; OPS metadata).
- Bound-session Evidence membership upserts workspace index (M3).
- Explicit `registerWorkspaceMember` remains allowed for OPS index (non-scientific).
- Workspace remains memory-only for SPEC-019.
- Durable workspace index: **out of scope**.

CODE-AUDIT-020 public-bind footgun remains relevant if Evidence membership follows bind: still prefer `ResearchOperations.bindSession` / registered workspace path. Not patched here.

---

## 17. ResearchSnapshot Compatibility

**Q6 closed:**

- `ResearchSnapshot` remains `{ research_session_id, member_refs, persistence_snapshot }` **only**.
- Evidence appears **inside** `member_refs` when members include EvidenceUnit identities.
- **No** new Evidence fields on `ResearchSnapshot`.
- **No** `EvidenceSnapshot` Persistence engine.
- Optional **additive** OPS helper views (e.g. filtered member lists) **MAY** be introduced in EXEC as named functions **without** mutating the frozen interface — if introduced, they must be documented as additive projections.

---

## 18. WorkspaceSnapshot Compatibility

**Q7 closed:**

- `WorkspaceSnapshot` already carries `member_refs` + `bound_session_ids` + `persistence_snapshot`.
- Evidence identities appear in `member_refs` when upserted.
- No schema change required for foundation.
- Ordering remains deterministic (existing sort rules).
- Still not a scientific graph.

---

## 19. Persistence Interaction

| Operation | Allowed in SPEC-019 design |
|-----------|----------------------------|
| `create` EvidenceUnit | Yes (foundation) |
| `get(..., { unit_kind: "EvidenceUnit" })` | Yes |
| `appendEvent` / `getEvents` | Yes (single journal) |
| `snapshot` / restore | Existing APIs; OPS views consume |
| `replace` differing content | **No** for SPEC-019 Evidence evolution |
| New tables / durable adapter | **No** |
| Second journal | **No** |

Memory adapter remains the reference implementation.

---

## 20. ENC Interaction

- OPS **SHALL** assemble Evidence exclusively via `CanonicalEncoder.assemble` / ENC EvidenceUnit builder path.
- OPS **SHALL NOT** hand-build envelopes or forge references.
- `bears_on` Claim ids validated by ENC identity rules at assemble time.

---

## 21. SER Interaction

- Export Evidence via existing SER-JSON-001 on CanonicalUnit payload (parity with `exportClaimUnit`).
- Conceptual query: `exportEvidenceUnit(identity)` → `jsonEncoder.encode(entity.payload)`.
- No second serialization stack.
- New SER profiles: **FUTURE** only if audit proves need (not expected for foundation).

---

## 22. Error Semantics

Preserve lower-layer error identity (SPEC-016A P-016-008):

| Origin | Propagation |
|--------|-------------|
| Evidence validation / transition | `EvidenceValidationError` unchanged |
| ENC | ENC typed errors unchanged |
| Persistence | `PersistenceError` unchanged |
| SER | SER typed errors unchanged |
| OPS-only (empty session, bad membership shape, unknown workspace, invalid OPS command state) | `OpsError` with existing codes (`INVALID_SESSION`, `INVALID_MEMBERSHIP`, `INVALID_WORKSPACE`, `INVALID_COMMAND_STATE`) |

**Do not** blanket-wrap in `OpsError`.

| Condition | Expected |
|-----------|----------|
| Invalid Evidence input | Core `EvidenceValidationError` |
| Duplicate Evidence identity on create | Persistence uniqueness / conflict semantics as today |
| Invalid session / membership | `OpsError` |
| Invalid workspace bind / registry | `OpsError` (`INVALID_WORKSPACE` / `INVALID_COMMAND_STATE`) |
| Canonical encode failure | ENC error |
| Serialization failure | SER error |
| Ambiguous get without `unit_kind` | Persistence `INVALID_ID` / ambiguity error as today |

**Q10 closed:** Lower-layer errors propagate unchanged; OpsError only for genuine OPS violations. No new Evidence-specific OpsError taxonomy required for foundation unless audit finds a gap (OPEN if EXEC discovers a true OPS-only Evidence failure mode).

---

## 23. Determinism

1. Caller-supplied `evidence_id`, `created_at`, transition `at`/`event_id`, Persistence `event_id`/`ordinal`/`at`.  
2. No nondeterministic generators on Evidence OPS evidence path.  
3. Membership lists / workspace snapshots retain deterministic ordering rules from Sprint 018.  
4. Double-run identical inputs ⇒ identical export / snapshot member sets / timeline ordering.  
5. REF-OPS Evidence fixtures must be deterministic and assertion-based (not marker-only).

---

## 24. Command Surface

Conceptual commands (names illustrative; EXEC may align naming with Claim):

| Command | Purpose | Changes scientific state? | Changes OPS state? | Persistence |
|---------|---------|---------------------------|--------------------|-------------|
| `registerEvidenceUnit` | Core→ENC→create | Yes (creates Evidence object & persisted unit) | No (unless followed by membership) | `create` |
| `appendResearchEvent` (existing) | Append ops/audit event | No | No (journal only) | `appendEvent` |
| `registerMember` (existing) | Session (+ workspace upsert if bound) | No | Yes | None |
| `registerWorkspaceMember` (existing) | Explicit workspace index | No | Yes | None |
| `bindSession` (existing) | Workspace bind | No | Yes | None |

**Not in foundation commands:** grade assign, post-persist transition, literature fetch, AI register.

---

## 25. Query Surface

| Query | Purpose | Ownership |
|-------|---------|-----------|
| `getEvidenceUnit(identity)` | Persistence get with `unit_kind: "EvidenceUnit"` | Infra read |
| `getEvents(identity)` | Persistence journal | Infra read |
| `timeline(session)` | OPS projection over member events | OPS |
| `snapshotView(session)` | Frozen ResearchSnapshot | OPS |
| `workspaceSnapshotView(workspace)` | Additive WorkspaceSnapshot | OPS |
| `exportEvidenceUnit(identity)` | SER-JSON-001 encode | SER via OPS |

Queries **MUST NOT** redefine scientific truth. Relationship interpretation reads Core/ENC data.

---

## 26. Reference Test Requirements

**Do not create fixtures in this SPEC.** Future EXEC **SHALL** add assertion-based REF-OPS fixtures, for example:

| Theme | Intent |
|-------|--------|
| Evidence registration create-once | draft path success |
| Optional pre-persist register transition | Human Reviewer path; AI rejection still Core |
| Deterministic evidence_id / export double-run | Determinism |
| Persistence create + get with EvidenceUnit | unit_kind |
| Session membership EvidenceUnit | M1 |
| Orphan session Evidence membership | M5 |
| Bound session upserts workspace | M3 |
| Invalid Evidence rejected with Core error type | Error identity |
| Duplicate create behavior | Persistence semantics |
| PersistenceError propagation | No OpsError wrap |
| Timeline includes Evidence member events | Projection |
| ResearchSnapshot unchanged field set; Evidence in member_refs | P-018-003 |
| WorkspaceSnapshot member_refs include Evidence | Additive |
| SER export round-trip stability | SER |
| Membership ≠ bears_on | Separation assertion |
| Claim path regression | Sprint 016 compatibility |

**Q14 closed:** Above themes define minimum future REF-OPS coverage for EXEC-019.

---

## 27. Conformance Integration

- Prefer **additive** REF-OPS fixtures under existing **`CONF-001@1.1.0-OPS`** (FULL corpus = SCI ∪ OPS).
- SCI profile `CONF-001@1.0.0` unchanged; SCI Evidence fixtures already exist (`REF-EVID-*`).
- **Do not** create a second ConformanceEngine.
- **Q13 closed (design intent):** Evidence OPS **can** be absorbed additively under current OPS profile **if** OPS-001 / fixture-prefix rules already accept new `REF-OPS-*` fixtures.  
- If EXEC proves profile fixture-prefix or authority lists reject new Evidence OPS fixtures: **STOP** — require audited profile bump SPEC (not silent mutation). Marked as execution risk, not authorized change here.

---

## 28. Certification Integration

```
REF-OPS (Evidence themes) + existing REF
  → ReferenceRunner → ReferenceReport
  → ConformanceEngine(profile) → ConformanceReport
  → CertificationEngine → Certificate
```

- Certification continues to consume **ConformanceReports only**.
- **Q15 closed:** Future formal certification of an Evidence OPS EXEC certifies the OPS profile report that includes the new REF-OPS evidence — same engine, no Workspace/Evidence objects passed to CERT.

---

## 29. Backward Compatibility

EXEC of SPEC-019 **SHALL NOT** break:

- Sprint 016 Claim vertical slice and orphan sessions  
- Sprint 017 CONF/CERT dual-profile architecture  
- Sprint 018 Workspace foundation  
- Frozen ResearchSnapshot  
- Memory-only Session/Workspace  
- Single Persistence journal  
- Existing SCI 44 fixtures  

Additive only.

---

## 30. Security / Trust Boundary

Even without authN/Z:

Evidence is **not** trusted merely because:

- a user/session registered it  
- a workspace lists it  
- an OPS timeline event exists  
- UI would display it (FUTURE)  
- AI proposed it (FUTURE)  

Scientific trust remains Core validation, Human Reviewer gates, Grade/Verification rules, and certification of **test evidence**—not of individual Evidence rows by OPS membership.

FUTURE AI proposal workflow: propose → human validation → Core factory/transition — never autonomous registration by AI (already Core-enforced for `registered`).

---

## 31. Explicitly Deferred Areas

| Area | Status |
|------|--------|
| Post-persist Evidence / Claim evolution | FUTURE SPEC |
| Evidence Grade OPS (SCI-003) | FUTURE |
| Contradiction / NR / Verification OPS | FUTURE |
| Durable Workspace index | FUTURE |
| Multi-session concurrency | FUTURE |
| Literature / DocumentArtifact | FUTURE |
| AI proposal intake | FUTURE |
| Knowledge Graph store | FUTURE |
| Frontend / API / DB / cloud | FUTURE |
| CODE-AUDIT-020 observation patches | OPTIONAL future hardening SPEC |

---

## 32. Architectural Risks

| Risk | Mitigation in this SPEC |
|------|-------------------------|
| Second source of truth | OPS membership pointers only; Core owns Evidence |
| Evidence/Claim confusion | Explicit boundary §7–§8; Evidence does not set Standing |
| Membership/relationship confusion | §11–§12; membership ≠ bears_on |
| Provenance/timeline confusion | §13–§14 layered model |
| AI/Evidence authority leakage | Non-goals; Core Human Reviewer; FUTURE proposals only |
| Persistence/domain coupling | Persistence stores CanonicalUnits only |
| Duplicate serialization / journal | SER-JSON-001; single appendEvent journal |
| Breaking ResearchSnapshot | Evidence via member_refs only |
| Profile drift | Additive REF-OPS preferred; bump only via audit |
| Scope creep | Hard non-goals §5 / §31 |
| Determinism failure | Caller-supplied ids/timestamps; REF assertion rules |
| CODE-AUDIT-020 bind footgun | Documented pressure; not patched; prefer Ops.bindSession |

---

## 33. Open Questions

Resolved in this draft where possible; remaining for architecture audit / owner:

| ID | Question | Draft disposition |
|----|----------|-------------------|
| OQ-019-001 | Must foundation EXEC require `registered` before first persist, or allow draft persist (Claim parity)? | **Recommend allow draft**; optional pre-persist register. Audit may harden. |
| OQ-019-002 | Should OPS expose a dedicated `EvidenceOpsView` type beyond member_refs? | **Default no**; additive helpers optional in EXEC if needed without frozen snapshot mutation. |
| OQ-019-003 | Exact Persistence `event_type` strings for Evidence OPS audit events | **EXEC detail**; must not imply scientific proof. |
| OQ-019-004 | Does `CONF-001@1.1.0-OPS` fixture-prefix list need extension for Evidence themes? | **Verify at EXEC**; if yes → audited profile bump SPEC first. |
| OQ-019-005 | Whether citing CERT ids in Persistence events is desirable | Deferred (SPEC-018 open Q); out of 019 foundation. |
| OQ-019-006 | Interaction when Claim `supported_by` and Evidence `bears_on` disagree | Core/ENC concern; OPS must not “repair” via membership. |

---

## 34. Future EXEC Boundary

### 34.1 Allowed for future EXEC-SPRINT-019 (pending audit approval)

- Implement Evidence OPS orchestration methods on Research Operations (register/get/export EvidenceUnit).  
- Wire `EvidenceFactory` / optional `EvidenceTransitionService` / ENC / Persistence / SER.  
- Reuse existing membership, timeline, snapshots (no ResearchSnapshot field break).  
- Additive REF-OPS fixtures with real assertions.  
- Additive test-019 / smoke-019 scripts.  
- Update IMPLEMENTATION.md status notes **only** as needed for EXEC documentation.  
- Produce CONF/CERT evidence via **existing** engines/profiles (or stop for profile SPEC if blocked).

### 34.2 Forbidden in EXEC-019

Everything in §5 Non-Goals; Core/ENC/SER/Persistence/CONF/CERT semantic redesign; durable workspace; Grade/Contradiction/NR/Verification OPS packages; AI; UI; DB; post-persist replace; patching CODE-AUDIT-020 observations unless separately authorized.

---

## 35. Acceptance Criteria

SPEC-019 is **design-complete for architecture audit** iff:

| ID | Criterion |
|----|-----------|
| AC-019-001 | References SCI-002 Evidence semantics without redefining them |
| AC-019-002 | States Core owns Evidence meaning; OPS orchestrates only |
| AC-019-003 | Defines create-once Core→ENC→Persistence registration |
| AC-019-004 | Membership follows M1–M8; not scientific relationships |
| AC-019-005 | Separates source/provenance / scientific logs / Persistence journal / OPS timeline |
| AC-019-006 | Preserves frozen ResearchSnapshot; Evidence via member_refs |
| AC-019-007 | Preserves WorkspaceSnapshot as OPS index projection |
| AC-019-008 | Preserves error propagation and determinism rules |
| AC-019-009 | Defers post-persist, Grade OPS, literature, DocumentArtifact, concurrency, durable workspace, AI, UI/API/DB, KG |
| AC-019-010 | Defines future REF-OPS themes and CONF/CERT additive path |
| AC-019-011 | Preserves Sprint 016–018 compatibility |
| AC-019-012 | Defines EXEC-019 in/out boundary |
| AC-019-013 | Status remains DRAFT pending independent architecture audit |
| AC-019-014 | Does not authorize implementation |

---

## 36. Final Status

**SPEC-019 — DRAFT — READY FOR ARCHITECTURE AUDIT**

Version `0.1.0-DRAFT`. No implementation authorized. No approval claimed.

---

*End of SPEC-019 v0.1.0-DRAFT (design only).*

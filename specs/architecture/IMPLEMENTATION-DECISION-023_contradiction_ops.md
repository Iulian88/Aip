# IMPLEMENTATION-DECISION-023
## Contradiction OPS Under Model C

| Field | Value |
|-------|--------|
| Decision ID | IMPLEMENTATION-DECISION-023 |
| Title | Contradiction OPS — Implementation Contract |
| Version | **0.1.0** |
| Status | **IMPLEMENTATION-READY — PENDING FINAL ARCHITECTURE RE-AUDIT** |
| Baseline | `662d7f7881337809c7973a39b683053ae3c45a87` |
| SPEC | SPEC-023 (DRAFT — audited) |
| Architecture audit | ARCHITECTURE-AUDIT-023 — **APPROVED WITH OBSERVATIONS** (0 blockers · 0 required patches) |
| Discovery | DISCOVERY-023 — READY FOR SPEC-023 |
| Mode | Design-only — **NO RUNTIME IMPLEMENTATION** |
| Does not authorize | EXEC-023 coding, tests, fixtures, certification, commit, or push |

---

### 1. Baseline

| Item | Value |
|------|-------|
| Certified HEAD / origin/main | `662d7f7881337809c7973a39b683053ae3c45a87` |
| Sprint 022 | FORMALLY CERTIFIED AND CLOSED — Grade OPS |
| SCI / OPS / FULL | **44/44 · 76/76 · 120/120** (verified) |
| Profiles | SCI `CONF-001@1.0.0` · OPS `CONF-001@1.1.0-OPS` |
| Highest OPS fixture today | `REF-OPS-076` (next free additive id starts at **`REF-OPS-077`**) |
| Architecture audit | 0 blockers · 0 required patches · READY FOR IMPLEMENTATION DECISION |

Working tree may contain documentation-only untracked files (DISCOVERY-023, SPEC-023, ARCHITECTURE-AUDIT-023, this decision). Those do not alter the certified runtime baseline.

### Frozen contracts (must not be redesigned)

- Scientific Core SCI-004 Contradiction semantics (states, gates, refs, F\* codes)
- Claim Standing / Evidence Record State / Evidence Grade semantics
- ENC / SER architectures (including ContradictionUnit content as certified)
- Persistence Model C addressing and CAS
- ResearchSnapshot (Sprint 016) / WorkspaceSnapshot (Sprint 018)
- Single Persistence event journal
- Single ConformanceEngine / CertificationEngine
- Profile ids listed above

---

### 2. SPEC / Architecture Audit Reference

| Source | Role |
|--------|------|
| `specs/architecture/SPEC-023_contradiction_ops.md` | Normative architecture subject |
| `audits/architecture/ARCHITECTURE-AUDIT-023_SPEC-023.md` | Audit acceptance + observations O-023-01…05 |
| `audits/roadmap/DISCOVERY-023_NEXT_RESEARCH_FRONTIER.md` | Discovery pin |
| SPEC-020 / ADR-020 / IMPLEMENTATION-DECISION-020 | Model C |
| SPEC-021 / IMPLEMENTATION-DECISION-021 | Record State OPS orchestration + decode precedent |
| SPEC-022 / IMPLEMENTATION-DECISION-022 | Third isomorphic OPS path (Grade) |
| Actual Core `ContradictionFactory` / `ContradictionTransitionService` | Scientific authority (already implemented) |
| Actual OPS `registerClaimUnit` / `transitionClaimStanding` / `transitionEvidenceRecordState` / `assignEvidenceGrade` | Model C sequence templates |
| Actual `claimFromClaimUnitPayload` / `evidenceFromEvidenceUnitPayload` | Decode helper pattern |

**Conflict check:** No conflict found between SPEC-023 and certified implementation. Core already exposes `createOpen` and `transition`. Persistence already maps `ContradictionUnit` → CanonicalUnit Model C. ENC/SER already assemble/encode ContradictionUnit. No silent invention required.

Process sequence:

```
DISCOVERY-023
  → SPEC-023
  → ARCHITECTURE-AUDIT-023 (APPROVED WITH OBSERVATIONS)
  → IMPLEMENTATION-DECISION-023 (this document)
  → Final Architecture Re-Audit
  → EXEC-023 (only if separately authorized)
  → CODE-AUDIT-023
  → FORMAL-CERTIFICATION-023
  → FINAL GIT CLOSURE
```

**Implementation Decision complete. Sprint 023 is implementation-ready, subject to successful Final Architecture Re-Audit. No runtime implementation is authorized by this document.**

---

### 3. Authorized Scope

Sprint 023 EXEC (when separately authorized) is **ONLY**:

| Letter | Capability |
|--------|------------|
| A | Contradiction creation OPS (`registerContradictionUnit`) |
| B | Contradiction post-persist Record State transition OPS (`transitionContradictionRecordState`) |
| C | Model C immutable revisions for `ContradictionUnit` |
| D | RevisionHead initialization / advancement (`ensureInitialHead` / `advanceHead`) |
| E | Canonicalization through **existing** ENC (`CanonicalEncoder.assemble`) |
| F | `Persistence.create` (existing) |
| G | OPS membership (existing `registerMember` / `registerWorkspaceMember` — **caller-explicit**, not implicit in create/transition) |
| H | Existing ResearchSnapshot / WorkspaceSnapshot integration (additive Persistence content only) |
| I | Existing export (`JsonEncoder.encode` of ContradictionUnit payload) |
| J | Optional operational event (`ops.contradiction_record_state_revision`) |
| K | Additive Reference Tests (`REF-OPS-077+`) |
| L | Existing CONF/CERT integration (no profile/engine change) |

**No other scientific unit may be extended** (no NR, Verification, Grade, Evidence, Claim Standing redesign).

---

### 4. Architectural Decision

| Decision | Value |
|----------|-------|
| Creation Core | `ContradictionFactory.createOpen` — **not** `createDraft` |
| Transition Core | `ContradictionTransitionService.transition` |
| OPS create | `ResearchOperations.registerContradictionUnit` |
| OPS transition | `ResearchOperations.transitionContradictionRecordState` |
| Decode | New OPS-local `contradictionFromContradictionUnitPayload` (mirror Evidence/Claim helpers) |
| Model C | `unit_kind = "ContradictionUnit"` revisions + RevisionHead CAS |
| Persistence / ENC / SER / CONF / CERT engines | **Unchanged** |
| Generic lifecycle engine | **NOT AUTHORIZED** |
| Second scientific graph / journal | **NOT AUTHORIZED** |
| `Persistence.Relationship` as scientific storage | **NOT AUTHORIZED** |
| ENC AI markers (`ai_assisted` / `human_sponsor`) | **NOT MODIFIED** (OQ-023-002 deferred) |

#### Audit observations absorbed as EXEC discipline

| ID | Discipline |
|----|------------|
| **O-023-01** | Fixtures asserting no scientific `Relationship` storage **SHALL** filter `entity_kind: "Relationship"` (e.g. `list({ filter: { entity_kind: "Relationship" } }).total === 0`). Do **not** treat `queryRelationships` emptiness as the assertion — CanonicalUnit rows with mirrored envelope refs also appear there. |
| **O-023-02** | Do **not** invent fixtures that force the decode `<2 involved_claims` guard. That guard is unreachable for intact units. Core `F2`/`F3`/`F4` at **create** remain the observed reference-validation authority. |
| **O-023-03** | When asserting `involved_claims` / `evidence_refs`, inspect **ENC payload** (`unit.envelope.references` roles `involves` / `cites_evidence`, or decoded Core object). Do **not** treat `PersistenceEntity.references` as scientific truth. |
| **O-023-04** | Every certified path **SHALL** supply caller `transition.event_id` (`crte:…`). Do **not** rely on Core `ContradictionEventBuilder` `randomUUID` fallback. Operational `event_id` derived as `ops:{transition.event_id}` when `append_event`. |
| **O-023-05** | Non-Contradiction source touches limited to: ResearchOperations API + deps wiring, `index.ts` exports, marker sprint bump, fixture/support, test/smoke scripts, EXEC docs. **STOP** if Core / Persistence / ENC / SER / CONF / CERT engine redesign appears necessary. |

---

### 5. Exact Implementation Path

### 5.1 Method locations

```
apps/reference-app/src/operations/research-operations.ts
  ResearchOperations.registerContradictionUnit(input, options?) → result
  ResearchOperations.transitionContradictionRecordState(input) → result
  + getContradictionUnit / getContradictionUnitRevision / getContradictionHead / getContradictionLineage
  + exportContradictionUnit / exportContradictionUnitRevision

apps/reference-app/src/operations/contradiction-from-unit.ts   // NEW
  contradictionFromContradictionUnitPayload(payload) → Contradiction

apps/reference-app/src/index.ts
  Export methods, DTOs, decode helper; referenceAppMarker.sprint → 23
```

### 5.2 Dependency wiring

| Concern | Rule |
|---------|------|
| Core create | Inject `ContradictionFactory` parallel to `ClaimFactory` / `EvidenceFactory` |
| Core transition | Inject `ContradictionTransitionService` parallel to Claim/Evidence transition services |
| `createResearchOperations` | Wire `new ContradictionFactory()` and `new ContradictionTransitionService()` |
| Decode | New OPS-local helper — **not** a Core API |
| ENC | Existing `CanonicalEncoder.assemble(contradiction)` → ContradictionUnit |
| Persistence | Existing session repository `create` + `ensureInitialHead` / `advanceHead` + optional `appendEvent` |

### 5.3 Core must not be reinvented

OPS **SHALL NOT** reimplement:

- Record State vocabulary
- `ALLOWED` transition table
- Human gate `F6` / `leavesOpen`
- `decision_ref` requirement
- `resolution_note` requirement for `resolved_*` (`F7`)
- `F8` note-change rule
- Core `ContradictionValidator` / reference grammar (`F2`/`F3`/`F4`)

All scientific validity comes from Core throws (`ContradictionValidationError`).

---

### 6. Model C Contract

| Element | Value |
|---------|-------|
| Storage key | `persist:CanonicalUnit:ContradictionUnit:{contradiction_id}:{revision_id}` |
| Head key | `persist:RevisionHead:ContradictionUnit:{contradiction_id}` |
| Initial revision | `rev:initial` |
| Later revisions | Caller-supplied `rev:[A-Za-z0-9._~-]{1,128}` |
| Grammar | `assertRevisionId` → Persistence `INVALID_ID` |
| Lineage | `predecessor_revision_id` (= `expected_head_revision_id` on transition) |
| Head init | `ensureInitialHead(identity, "ContradictionUnit", "rev:initial")` |
| CAS | `advanceHead(identity, "ContradictionUnit", expected_head, revision_id)` |
| Stale head | Persistence `CONFLICT` |
| Prior revisions | Immutable (`IMMUTABLE_KINDS` / no `replace` of CanonicalUnit rows) |

**No alternative revision model. No Persistence redesign.**

---

### 7. Creation Path

### 7.1 Normative sequence — `registerContradictionUnit`

```
1. options.revision_id (default rev:initial); if ≠ rev:initial → OpsError INVALID_COMMAND_STATE
2. ContradictionFactory.createOpen(input)              // Core — may throw
3. CanonicalEncoder.assemble(contradiction)            // ContradictionUnit
4. entityFromCanonicalUnit(unit, { revision_id: "rev:initial" })
5. repository.create(entity)                           // may ALREADY_EXISTS
6. repository.ensureInitialHead(contradiction_id, "ContradictionUnit", "rev:initial")
7. return { contradiction, unit, entity }
```

### 7.2 Explicitly **not** inside this method

| Action | Who |
|--------|-----|
| Operational event | **Not** emitted (parity with Claim/Evidence create-once) |
| Membership | Caller: `registerMember` / `registerWorkspaceMember` |
| Snapshot / export | Caller: `snapshotView` / `workspaceSnapshotView` / `exportContradictionUnit*` |

Prompt wording that lists “optional event → registerMember → snapshots” after create is **caller orchestration**, not method body — same as certified `registerClaimUnit` / `registerEvidenceUnit`.

### 7.3 Input / output

| Symbol | Content |
|--------|---------|
| Input | Core `CreateContradictionInput` (pass-through) |
| Options | `RegisterContradictionUnitOptions { revision_id? }` — create-once only |
| Result | `RegisterContradictionUnitResult { contradiction, unit, entity }` |

### 7.4 No pre-persist transition option

`options.transition` is **not** offered (SPEC OQ-023-012 CLOSED). Resolution is post-persist only.

---

### 8. Transition Path

### 8.1 Normative sequence — `transitionContradictionRecordState`

```
1. assertRevisionId(revision_id); assertRevisionId(expected_head_revision_id)
   revision_id === rev:initial              → OpsError INVALID_COMMAND_STATE
   revision_id === expected_head_revision_id → OpsError INVALID_COMMAND_STATE
2. getContradictionUnit(identity)            // head-resolved
3. contradictionFromContradictionUnitPayload(entity.payload)
4. ContradictionTransitionService.transition(prior, input.transition)  // Core — may throw
5. CanonicalEncoder.assemble(next)
6. entityFromCanonicalUnit(unit, {
     revision_id,
     predecessor_revision_id: expected_head_revision_id
   })
7. repository.create(entity)                 // may ALREADY_EXISTS
8. repository.advanceHead(
     identity, "ContradictionUnit",
     expected_head_revision_id, revision_id) // may CONFLICT
9. optional appendEvent(...)                 // if append_event === true
10. return { contradiction, unit, entity, head_revision_id }
```

### 8.2 Input / output

| Field | Required | Semantics |
|-------|----------|-----------|
| `identity` | Yes | `contradiction_id` |
| `transition` | Yes | Core `ContradictionRecordTransitionInput` |
| `revision_id` | Yes | New Model C revision |
| `expected_head_revision_id` | Yes | Expected head (= predecessor + CAS `from`) |
| `append_event` | No | Default `false` |

**Result:** `TransitionContradictionRecordStateResult { contradiction, unit, entity, head_revision_id }`

### 8.3 Partial write (certified Model C precedent)

If `create` succeeds and `advanceHead` fails: orphan revision row **may** exist; head unchanged; **not** a scientific commit. Same honesty as SPEC-020/021/022.

---

### 9. Identity Rules

| Kind | Value | Role |
|------|-------|------|
| Scientific identity | `contradiction_id` | Stable across all revisions |
| Content SemVer | `contradiction_version` | **Unchanged** by Record State transition; only `ContradictionVersionService` bumps (out of scope) |
| Model C revision | `revision_id` (`rev:…`) | Persistence addressing; **≠** SemVer; CAS token = prior `revision_id` |

**SHALL NOT** conflate SemVer with `revision_id` or RevisionHead `content_version`.

---

### 10. Lineage Rules

| Rule | Statement |
|------|-----------|
| Authoritative lineage | `PersistenceEntity.predecessor_revision_id` |
| Create (`rev:initial`) | No predecessor |
| Transition | `predecessor_revision_id === expected_head_revision_id` |
| Listing | `getContradictionLineage` via `listRevisions(identity, "ContradictionUnit")` — sorted by `revision_id` |
| Shape | `ContradictionLineageEntry = ClaimLineageEntry` |
| Scientific supersession | **Not** RevisionHead movement; `resolved_by_supersession` is Core Record State about Claims |

Inherited: predecessor existence check at `create` remains deferred (O-020-01).

---

### 11. Head / CAS Rules

| Operation | API |
|-----------|-----|
| Init | `ensureInitialHead(id, "ContradictionUnit", "rev:initial")` — idempotent if already at same revision |
| Advance | `advanceHead(id, "ContradictionUnit", from, to)` — `replace` + `expected_version = from` |
| Stale | `CONFLICT`; prior head retained |
| Duplicate revision key | `ALREADY_EXISTS` on `create` |
| Multi-head branching | Not a scientific model |

---

### 12. Human Gate Rules

Preserve Core exactly (no OPS alternatives):

| Rule | Code / mechanism |
|------|------------------|
| States | `open`, `resolved_by_supersession`, `resolved_by_scope_split`, `resolved_by_retraction`, `unresolved_archived` — no additions, no rename, no draft |
| Creation | `createOpen` → `open`; empty CRTE log |
| Edges | Only `open → {resolved_*, unresolved_archived}`; terminals have none |
| Human gate | Every legal leave-`open` edge → Human Reviewer (`F6`) |
| `decision_ref` | Required when leaving `open` (`F_TRANSITION`) |
| `resolution_note` | Required for `resolved_*` (`F7`); not required for `unresolved_archived` |
| Note change | Changing existing non-empty note via transition → `F8` |
| Deterministic CRTE | Caller `event_id` (`crte:…`) **required** on certified paths (O-023-04) |

---

### 13. Reference Rules

| Rule | Statement |
|------|-----------|
| Representation | ENC envelope only: `involves` (Claim) · `cites_evidence` (Evidence) |
| Validation | Core grammar-only (`F2`/`F3`/`F4`); ENC grammar-only; **no** Persistence dereference |
| Existence of cited Claim/Evidence | **Not required** for create (OQ-023-001 CLOSED) |
| Fixture assertion | Inspect ENC payload / decoded object — **not** `entity.references` (O-023-03) |
| Decode defensive `<2 involved_claims` | Keep structural; do **not** fixture-force (O-023-02) |

---

### 14. Relationship Boundary

| Forbidden | Reason |
|-----------|--------|
| Create `Relationship` entities for Contradiction edges | Second scientific graph |
| Use `queryRelationships` as scientific truth | Non-authoritative; also returns CanonicalUnit mirrors |
| Auto reverse-sync `Claim.contested_by` | SCI-004 / Claim Standing ownership |
| Duplicate scientific edge store | Edges live only in ContradictionUnit payload |

Contradiction remains a ScientificUnit. Fixture T-22 / O-023-01: assert `list({ filter: { entity_kind: "Relationship" } }).total === 0`.

---

### 15. Claim.contested_by Coexistence

| Rule | Statement |
|------|-----------|
| Claim Standing | **Frozen** — no Core Claim change |
| Effect of Sprint 023 | Contradiction identity becomes **persistable** |
| Reverse sync | **Forbidden** |
| Graph | Independent Claim→Contradiction (`contested_by`) and Contradiction→Claim (`involves`) edges — SSR-5 pattern |
| Required fixture | Coexistence: Standing `contested` with `contested_by: [C]` + persisted Contradiction `C` (either order); no auto-sync |

---

### 16. Membership

| Rule | Statement |
|------|-----------|
| Member ref | `{ entity_kind: "CanonicalUnit", unit_kind: "ContradictionUnit", identity }` — **no type change** |
| Create / transition | **SHALL NOT** register or mutate membership |
| Caller | Explicit `registerMember` / `registerWorkspaceMember` |
| Distinct from | `involved_claims`, `evidence_refs`, `Claim.contested_by`, lineage, scientific provenance |

---

### 17. Snapshot / Export

| Surface | Rule |
|---------|------|
| `ResearchSnapshot` | Frozen shape — unchanged |
| `WorkspaceSnapshot` | Additive shape — unchanged |
| Participation | Additive `persistence_snapshot` rows (revisions + head + optional journal) |
| Export | `exportContradictionUnit(identity)` / `exportContradictionUnitRevision(identity, revision_id)` via existing `JsonEncoder.encode(entity.payload)` |
| Timeline | Existing `projectTimeline` over member identities — unchanged |
| New SER profile | **Forbidden** |

---

### 18. Event / Determinism Rules

### Scientific history (authoritative)

CRTE on Contradiction / ContradictionUnit envelope events.

### Optional operational journal (transition only)

When `append_event === true` **after** successful head advance:

| Field | Value |
|-------|-------|
| `event_type` | `ops.contradiction_record_state_revision` |
| `parent_identity` | `contradiction_id` |
| `event_id` | Prefer `ops:{transition.event_id}`; else `ops:contradiction_record_state:{identity}:{revision_id}` |
| Payload | `{ revision_id, predecessor_revision_id, unit_kind: "ContradictionUnit", to_record_state }` |

| Rule | Statement |
|------|-----------|
| Create-once event | **None** |
| Authority | Operational only — not scientific |
| Journal | Sole Persistence journal |
| Failure after head | Does not roll back scientific revision/head |

### Determinism (HARD)

| Concern | Rule |
|---------|------|
| Forbidden on certified paths | `randomUUID`, `Math.random`, `Date.now` for identity minting |
| Caller-supplied | `contradiction_id`, `revision_id`, `expected_head_revision_id`, CRTE `event_id` / `at` / agents / `decision_ref` / `resolution_note` |
| Core fallback | `ContradictionEventBuilder` may mint `crte:`+`randomUUID` if `event_id` omitted — **outside** certified OPS path; EXEC **must** always supply `event_id` (O-023-04) |

---

### 19. Error Rules

Propagate lower-layer errors unchanged. `OpsError` only for OPS command misuse / decode failure.

| Condition | Error |
|-----------|--------|
| Core create/transition validation | `ContradictionValidationError` (`F1`…`F9`, `F_AI`, `F_TRANSITION`, `F6`, `F7`, `F8`, …) |
| ENC assemble | `CanonicalEncodingError` (propagate) |
| Bad `revision_id` grammar | Persistence `INVALID_ID` |
| Missing unit / revision / head | Persistence `NOT_FOUND` |
| Duplicate create / duplicate revision | Persistence `ALREADY_EXISTS` |
| Stale head CAS | Persistence `CONFLICT` |
| Immutable row mutate attempt | Persistence `IMMUTABLE_ENTITY` |
| OPS misuse / decode failure | `OpsError INVALID_COMMAND_STATE` |

**No new error categories.** Ordering: Core/ENC failures before any `create` → nothing persisted.

---

### 20. Reference Test Scope

Additive fixtures starting at **`REF-OPS-077`**. Do not renumber or edit `REF-OPS-001…076`. Authorities: `OPS-001` (+ `SCI-004` / `ENC-001` where asserting Core/ENC through OPS).

### Mandatory coverage (map to SPEC themes; exact ids at EXEC)

| # | Must prove |
|---|------------|
| 1 | Contradiction creation (`registerContradictionUnit`) |
| 2 | `createOpen` semantics (`record_state: open`, empty CRTE log) |
| 3 | Canonicalization (intact ContradictionUnit) |
| 4 | Persistence (`rev:initial` row) |
| 5 | Initial RevisionHead |
| 6 | Later revision (post-persist transition) |
| 7 | `predecessor_revision_id` |
| 8 | Stale-head CAS → `CONFLICT` |
| 9 | Immutable historical revision |
| 10 | Supported transitions (`resolved_*` + `unresolved_archived`) |
| 11 | Human gate `F6` |
| 12 | `decision_ref` requirement |
| 13 | `resolution_note` for `resolved_*` (`F7`) |
| 14 | Claim reference (`involves` from ENC payload — O-023-03) |
| 15 | Evidence reference (`cites_evidence` from ENC payload) |
| 16 | `Claim.contested_by` coexistence |
| 17 | Membership (explicit; methods do not auto-register) |
| 18 | ResearchSnapshot unchanged shape + additive Persistence content |
| 19 | WorkspaceSnapshot unchanged shape |
| 20 | Export |
| 21 | Operational event (`append_event: true`; caller `event_id`) |
| 22 | Invalid revision identity (`OpsError` / `INVALID_ID`) |
| 23 | Duplicate revision / duplicate create → `ALREADY_EXISTS` |
| 24 | `Persistence.Relationship` non-use — filter `entity_kind: "Relationship"` (O-023-01) |

Also: Core validation at create (`F2`/`F3`/`F4`/`F9`) as observed authority (O-023-02); regression SCI 44/44 + OPS 001–076 green; no overwrite of historical smoke markers.

### Test / smoke scripts (when EXEC authorized)

| Script | Purpose |
|--------|---------|
| `scripts/test-023-contradiction-ops.mjs` | New |
| `scripts/smoke-023-contradiction-ops.mjs` | New — writes **only** `SMOKE_023_PASS` |

---

### 21. Change Budget

### AUTHORIZED — source

| File / surface | Purpose |
|----------------|---------|
| `apps/reference-app/src/operations/research-operations.ts` | Create + transition + get/lineage/export helpers; deps wiring |
| `apps/reference-app/src/operations/contradiction-from-unit.ts` | **New** decode helper |
| `apps/reference-app/src/index.ts` | Export surface; `referenceAppMarker.sprint → 23` |

### AUTHORIZED — fixtures

| File | Purpose |
|------|---------|
| `packages/reference-tests/src/fixtures/ops.ts` | Additive `REF-OPS-077+` only |
| `packages/reference-tests/src/fixtures/ops-support.ts` | Only if needed for Contradiction input helpers (prefer minimal) |
| Corpus wiring in `fixtures/index.ts` | **Only if** required (prefer zero change if `opsFixtures` already spreads) |

### AUTHORIZED — scripts

| File | Purpose |
|------|---------|
| `scripts/test-023-contradiction-ops.mjs` | New |
| `scripts/smoke-023-contradiction-ops.mjs` | New |

### AUTHORIZED — documentation (EXEC phase)

| File | Purpose |
|------|---------|
| `IMPLEMENTATION.md` | Sprint 023 notes / counts |
| `audits/execution/EXEC-023_REPORT.md` | Execution report |
| README notes | Only if needed for corpus status hygiene |

### AUTHORIZED — certification phase only (NOT during EXEC coding)

Additive cert reports under `audits/certification/` and `fixtures/cert/` — **only** during FORMAL-CERTIFICATION-023. New marker: `SMOKE_023_PASS` only.

If any file outside this budget appears necessary → **STOP** (§22).

### FORBIDDEN

- Scientific Core redesign (Contradiction / Claim / Evidence / Grade)
- Persistence / Model C / RevisionHead redesign
- ENC redesign (including adding `ai_assisted` / `human_sponsor` to ContradictionUnit)
- SER redesign / new profile
- ConformanceEngine / CertificationEngine redesign
- ResearchSnapshot / WorkspaceSnapshot redesign
- Generic lifecycle / `postPersistTransition()`
- Second scientific graph or second event journal
- `Persistence.Relationship` as scientific storage
- NR / Verification OPS; Grade/Evidence/Claim Standing changes
- Material content OPS (`ContradictionVersionService`)
- Database, API, frontend, AI, literature, DocumentArtifact, KG, multi-user, durable workspace
- Overwrite historical smoke markers / historical certification artifacts
- Unrelated refactoring

---

### 22. Deferred Questions

| ID | Item | Handling |
|----|------|----------|
| OQ-023-002 | ENC AI markers on Contradiction/NR/Verification units | **DEFERRED** — separate ENC/SCI discovery; Sprint 023 accepts decode lossiness |
| OQ-023-005 | Claim `qualified_by` / `verified_via` creation-only | **DEFERRED** — SCI-001 / NR-Verification discovery |
| OQ-023-011 | Material content OPS | **DEFERRED** — future multi-unit material OPS sprint |
| O-020-01 | Predecessor existence check at `create` | **Inherited deferred** — unchanged |

Do **not** resolve these in EXEC-023.

---

### 23. Stop Conditions

EXEC-023 **MUST STOP** and report a blocker (no improvisation) if:

- Core `createOpen` / `transition` semantics do not exist or contradict SPEC-023
- Model C cannot support ContradictionUnit without redesign
- Persistence / ENC / SER / CONF / CERT engine modification becomes necessary
- Scientific authority would move outside Core
- A second scientific graph / journal / Relationship store becomes necessary
- Nondeterministic behavior cannot be contained on certified paths
- Snapshot redesign becomes necessary
- Existing certified behavior (Sprints 016–022) must change
- An unauthorized file must be modified
- A migration is required but unspecified
- Historical `SMOKE_019`…`SMOKE_022_PASS` would be overwritten
- Implementation would require inventing scientific semantics or new error categories
- Requirements cannot be derived from SPEC-023 + ARCHITECTURE-AUDIT-023 + existing Model C + actual repository APIs

---

### 24. Final Implementation Authorization State

| Statement | Value |
|-----------|--------|
| Implementation Decision | **COMPLETE** |
| Sprint 023 readiness | **IMPLEMENTATION-READY** |
| Gate remaining | **Final Architecture Re-Audit** |
| Runtime implementation authorized by this document? | **NO** |
| Tests / fixtures / certification authorized by this document? | **NO** |
| Commit / push authorized? | **NO** |
| Scope | Contradiction OPS only — createOpen + transition under Model C |
| Observations O-023-01…05 | Binding EXEC discipline |

**Status: IMPLEMENTATION-READY — PENDING FINAL ARCHITECTURE RE-AUDIT**

**Implementation Decision complete. Sprint 023 is implementation-ready, subject to successful Final Architecture Re-Audit. No runtime implementation is authorized by this document.**

---

## Document Control

| Version | Status | Notes |
|---------|--------|-------|
| 0.1.0 | IMPLEMENTATION-READY — PENDING FINAL ARCHITECTURE RE-AUDIT | From SPEC-023 + ARCHITECTURE-AUDIT-023 |

---

IMPLEMENTATION-DECISION-023 FINAL VERDICT
==========================================

Decision:
IMPLEMENTATION-READY — PENDING FINAL ARCHITECTURE RE-AUDIT

Scope:
Contradiction OPS only — ResearchOperations.registerContradictionUnit orchestrates ContradictionFactory.createOpen → ENC ContradictionUnit → Persistence.create (rev:initial) → ensureInitialHead; ResearchOperations.transitionContradictionRecordState orchestrates decode → ContradictionTransitionService.transition → ENC → create successor → ContradictionUnit RevisionHead CAS → optional ops.contradiction_record_state_revision; new contradictionFromContradictionUnitPayload; no generic lifecycle; no other unit OPS.

Core authority:
PRESERVED (createOpen + transition)

Record State vocabulary:
UNCHANGED

Relationship boundary:
Persistence.Relationship NOT AUTHORIZED as scientific storage

Claim.contested_by:
COEXISTENCE ONLY — no reverse sync; Claim Standing frozen

ENC AI markers:
NOT MODIFIED (OQ-023-002 deferred)

Model C:
PRESERVED — unit_kind = ContradictionUnit

Persistence / ENC / SER / CONF / CERT:
UNCHANGED

Generic lifecycle:
NOT AUTHORIZED

Second scientific graph / journal:
NOT AUTHORIZED

Implementation change budget:
research-operations.ts + contradiction-from-unit.ts + index exports; additive REF-OPS-077+; test-023/smoke-023; EXEC docs; cert artifacts only in later certification phase; SMOKE_023_PASS only

EXEC-023:
NOT AUTHORIZED

Implementation authorization:
NO

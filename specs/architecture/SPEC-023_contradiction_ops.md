# SPEC-023 — Contradiction OPS Under Model C

| Field | Value |
|-------|-------|
| **Spec ID** | SPEC-023 |
| **Artifact** | `specs/architecture/SPEC-023_contradiction_ops.md` |
| **Status** | DRAFT — READY FOR ARCHITECTURE AUDIT |
| **Baseline commit** | `662d7f7881337809c7973a39b683053ae3c45a87` (Sprint 022 certified + closed) |
| **Depends on** | SCI-004@0.1.0 · SCI-001 (Claim `contested_by`) · SCI-002 (Evidence id grammar) · ADR-0006 · ADR-020 / SPEC-020 (Model C) · SPEC-021 (decode / post-persist pattern) · SPEC-022 (third precedent) · DISCOVERY-023 |
| **Implementation authorization** | **NO** |

Normative language: RFC 2119 SHALL / MUST / SHOULD / MAY.  
Every API, error code, grammar, and field named below was verified against source at the baseline commit. Where this SPEC names a **new** OPS symbol, it is marked *(new — Sprint 023)*.

---

## 1. Status

**DRAFT — READY FOR ARCHITECTURE AUDIT**

Design-only. No source, test, fixture, certification, or documentation-of-prior-sprint changes accompany this SPEC.

---

## 2. Baseline

| Item | Value |
|------|-------|
| Sprint | 022 — Grade OPS — FORMALLY CERTIFIED AND CLOSED |
| Commit | `662d7f7881337809c7973a39b683053ae3c45a87` (`cert(sprint-022): certify Grade OPS`) |
| HEAD == origin/main | YES |
| SCI corpus | 44/44 under `CONF-001@1.0.0` |
| OPS corpus | 76/76 (`REF-OPS-001…076`) |
| FULL corpus | 120/120 under `CONF-001@1.1.0-OPS` |
| Discovery pin | `audits/roadmap/DISCOVERY-023_NEXT_RESEARCH_FRONTIER.md` — READY FOR SPEC-023 |

### Certified Model C (unchanged, reused verbatim)

| Element | Contract (source) |
|---------|-------------------|
| Revision key | `persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}` (`makeCanonicalUnitRevisionStorageKey`) |
| Initial revision | `INITIAL_REVISION_ID = "rev:initial"` |
| Revision grammar | `REVISION_ID = /^rev:[A-Za-z0-9._~-]{1,128}$/` (`assertRevisionId`) |
| Lineage | `PersistenceEntity.predecessor_revision_id` — absent on `rev:initial`, required otherwise (`entityFromCanonicalUnit`) |
| Head key | `persist:RevisionHead:{unit_kind}:{identity}` (`makeRevisionHeadStorageKey`) |
| Head init | `repository.ensureInitialHead(identity, unit_kind, revision_id)` — idempotent when already at same revision |
| CAS | `repository.advanceHead(identity, unit_kind, from_revision_id, to_revision_id)` → `replace` with `expected_version = from_revision_id`; stale → `CONFLICT` |
| Journal | sole `repository.appendEvent(parent_identity, event)` |

### Certified OPS post-persist precedents

| Axis | OPS method | Core service | Head `unit_kind` | Sprint |
|------|------------|--------------|------------------|--------|
| Claim Standing | `transitionClaimStanding` | `ClaimTransitionService.transition` | `ClaimUnit` | 020 |
| Evidence Record State | `transitionEvidenceRecordState` | `EvidenceTransitionService.transition` | `EvidenceUnit` | 021 |
| Evidence Grade | `assignEvidenceGrade` | `EvidenceGradeService.assign` | `EvidenceUnit` | 022 |

Sprint 023 is the **fourth explicit per-unit** orchestration of the same shape. It is **not** a generic engine.

---

## 3. Problem Statement

1. Core owns a complete Contradiction aggregate (SCI-004): factory, validator, Record State transition service, version service, ENC `ContradictionUnit`, SER-JSON registration, Processor stage, SCI fixtures `REF-CONTRA-001…002`, `REF-CANON` assembly.
2. Research Operations has **no** Contradiction path: no create-once, no decode-from-unit, no post-persist transition, no get/lineage/export helpers. No `ContradictionUnit` row or RevisionHead has ever been created by OPS or any fixture.
3. A **certified OPS path already cites Contradiction identities**: `transitionClaimStanding` accepts `StandingTransitionInput.contested_by`, `ClaimValidator` requires ≥1 `contested_by` id when Standing = `contested` (`F7`), and `REF-OPS-039` commits `contested_by: ["contradiction:ref-ops-039"]` — an identity that no OPS operation can persist.
4. Once a Contradiction is persisted, its Core resolution (`open → resolved_* | unresolved_archived`) cannot be committed without an immutable successor revision — the same gap Sprints 020–022 closed for Standing, Record State, and Grade.

**Sprint 023 objective:** make Core Contradiction operationally **creatable** and **transitionable after persistence** under certified Model C, using existing Core semantics only.

---

## 4. Scientific Authority

| Layer | Owns | Must not |
|-------|------|----------|
| **Scientific Core** (`@sciros/core` `contradiction/*`) | Contradiction meaning; Record State vocabulary and legal edges; Human Reviewer gate; `resolution_note` rules; `involved_claims` / `evidence_refs` admissibility; CRTE validity; SemVer material bump | Be bypassed, re-implemented, or extended by OPS |
| **OPS** (`@sciros/reference-app`) | Orchestration: Core create/transition → ENC → Model C create → head init / CAS → optional journal citation; membership index; snapshot/export projections | Define Contradiction vocabulary, states, gates, relationship semantics; dereference scientific ids as a scientific rule; own lineage |
| **ENC** | `ContradictionUnit` canonical projection (content, `involves` / `cites_evidence` references, CRTE events) | Be modified by Sprint 023 |
| **SER** | JSON encode/decode of CanonicalUnit payloads | New profile / serializer |
| **Persistence** | Immutable rows, RevisionHead, CAS, sole journal, snapshot | Scientific Contradiction semantics; `Relationship` entity as scientific edge store (§9) |
| **REF / CONF / CERT** | Executable evidence; profile evaluation; certification | Own semantics |
| **AI** | Non-authoritative | Leave `open` as sole authority (Core `F6`) |

**Invariants (SHALL hold after Sprint 023):**

- exactly one scientific authority (Core);
- no second scientific relationship graph;
- no second event journal;
- RevisionHead ≠ scientific truth; `predecessor_revision_id` ≠ scientific supersession;
- Claim Standing and Contradiction Record State remain **orthogonal** (SCI-004 §8.3 / §9.0; ADR-0006).

---

## 5. Existing Core Contradiction Semantics

Everything in this section is **existing Core behaviour** (`packages/core/src/contradiction/*`). Sprint 023 changes none of it.

### 5.1 Identity and pins

| Field | Grammar / rule | Source |
|-------|----------------|--------|
| `contradiction_id` | `/^contradiction:[A-Za-z0-9._~-]{1,128}$/` (`CONTRADICTION_OBJECT_ID`) — Core `F1` | `identifiers.ts` |
| `ontology_ref` | `/^SCI-000@0\.1\.[0-9]+$/`; factory default `SCI-000@0.1.0` | `identifiers.ts`, `factory.ts` |
| `spec_ref` | `/^SCI-004@0\.1\.[0-9]+$/`; factory default `SCI-004@0.1.0` | same |
| `contradiction_version` | SemVer `/^\d+\.\d+\.\d+$/`; factory default `1.0.0` | same |
| `created_at`, `provenance.recorded_at`, CRTE `at` | UTC second `YYYY-MM-DDTHH:MM:SSZ` (`CONTRADICTION_UTC_SECOND`) | same |
| CRTE `event_id` | `/^crte:[A-Za-z0-9._~-]{1,128}$/` (`CRTE_ID`) | same |
| Human Reviewer | `/^human:[A-Za-z0-9._~-]{1,128}$/` (`CONTRADICTION_HUMAN_REVIEWER`) | same |

### 5.2 Object shape (`Contradiction`)

Mandatory: `contradiction_id`, `ontology_ref`, `spec_ref`, `contradiction_version`, `record_state`, `summary`, `involved_claims`, `overlap_statement`, `incompatibility_statement`, `ethics_constraint_marker: "non_clinical"`, `provenance {completeness, recorded_at, custody_agent, method_summary}`, `created_by`, `created_at`.  
Optional: `evidence_refs`, `resolution_note`, `ai_assisted`, `human_sponsor`, `record_transition_log`.

### 5.3 Creation — `ContradictionFactory.createOpen(input: CreateContradictionInput)`

**FACT:** the Core creation method is `createOpen`, **not** `createDraft` (Contradiction has no `draft` state; `draft` is a forbidden Record State — `FORBIDDEN_CONTRADICTION_RECORD_STATES`). Sprint 023 uses the repository name.

Behaviour: validates `involved_claims` (≥2, distinct after NFC+trim, each matching SCI-001 Claim id grammar — `F2`/`F3`) and optional `evidence_refs` (each matching SCI-002 Evidence id grammar — `F4`); NFC-trims strings; sets `record_state: "open"`, `record_transition_log: []` (**no** CRTE at creation); runs `ContradictionValidator.validate`.

### 5.4 Record State machine — `ContradictionTransitionService`

| From | To (legal) |
|------|------------|
| `open` | `resolved_by_supersession`, `resolved_by_scope_split`, `resolved_by_retraction`, `unresolved_archived` |
| any `resolved_*` | — (terminal) |
| `unresolved_archived` | — (terminal) |

`transition(contradiction, input: ContradictionRecordTransitionInput)`:

| Input field | Required | Core rule |
|-------------|----------|-----------|
| `to` | Yes | must be legal per table (`F_TRANSITION`) |
| `authority_agent` | Yes | every legal edge leaves `open` → **Human Reviewer required** (`F6`) |
| `reason` | Yes | non-empty after NFC+trim (`F_TRANSITION`) |
| `decision_ref` | **Effectively yes** (optional in type; required by gate for every edge leaving `open` — `F_TRANSITION`) | non-empty |
| `at` | Yes | UTC second |
| `event_id` | Optional in Core; **required on OPS paths** (§18) | `crte:…` grammar |
| `resolution_note` | Required for `resolved_*` (`F7`); ignored for `unresolved_archived` | if prior note non-empty and differs → `F8` (requires new `contradiction_version`, i.e. version service, not transition) |

Result: new frozen `Contradiction` with `record_state = to`, appended CRTE (`from_state = prior`, `to_state = to`), `resolution_note` set when previously empty, `contradiction_version` **unchanged**, all other fields carried over; validated.

**FACT:** Core has **no** `assertRegistrationLegal` / issuance transition for Contradiction (unlike Negative Result) — `(new) → open` is factory-only.

### 5.5 Validation — `ContradictionValidator.validate`

`F1` identity/pins/version/summary/ethics/created_by/created_at/provenance · `F2`/`F3` involved_claims · `F4` evidence_refs · `F5` record_state forbidden/invalid · `F6` non-human CRTE leaving `open`, or `ai_assisted` non-open without Human CRTE · `F7` `resolved_*` without `resolution_note` · `F9` empty overlap / empty or `none` / `n/a` incompatibility · `F_AI` `ai_assisted` without `human_sponsor` · `F_TRANSITION` CRTE grammar, duplicate `event_id`, non-open state without matching CRTE.

### 5.6 Material change — `ContradictionVersionService.applyMaterialUpdate`

Exists in Core (bumps `contradiction_version` patch on material change of summary/claims/statements/provenance/evidence_refs/resolution_note; `F8` on no-op). **Not an OPS operation in Sprint 023** (§22; OQ-023-011).

### 5.7 Canonical representation — ENC `ContradictionUnit`

`CanonicalEncodingBuilder.buildContradiction(c)` (dispatch via `CanonicalEncoder.assemble` → registry detects `"contradiction_id" in o && "involved_claims" in o`):

| Envelope part | Content |
|---------------|---------|
| `unit_kind` | `"ContradictionUnit"` |
| `identity` | `contradiction_id` |
| `content_version` | `contradiction_version` |
| `content` | `contradiction_id`, `contradiction_version`, `record_state`, `summary`, `overlap_statement`, `incompatibility_statement`, `provenance`, `ethics_constraint_marker`, `created_by`, `created_at`, `resolution_note?` |
| `references` | one `{target_class: "Claim", role: "involves"}` per `involved_claims` entry; one `{target_class: "Evidence", role: "cites_evidence"}` per `evidence_refs` entry (ENC asserts id grammar; no dereference) |
| `events` | one `CanonicalEvent` per CRTE (`parent_class: "Contradiction"`, `from_state`, `to_state`, `authority_agent`, `reason`, `decision_ref?`, `at`) |

**FACT (DISCOVERY-023 / OQ-023-002):** `ContradictionUnit.content` does **not** carry `ai_assisted` or `human_sponsor` (ClaimUnit/EvidenceUnit do). This is certified ENC behaviour covered by SCI `REF-CANON` fixtures and is **not modified** by Sprint 023.

### 5.8 SER / Processor / Persistence (existing)

- SER-JSON registry, profile, validator, encoder, decoder recognise `ContradictionUnit`.
- Processor `transition-engine.ts` handles `contradiction.record_transition` (not used by OPS; OPS calls Core directly, as for Claim/Evidence).
- `entityFromCanonicalUnit` maps `ContradictionUnit → entity_kind "CanonicalUnit"`; Model C keys/head are `unit_kind`-generic.

---

## 6. OPS Boundary

### 6.1 Additive OPS surface *(new — Sprint 023)*

| Symbol | Kind | Mirrors |
|--------|------|---------|
| `ResearchOperations.registerContradictionUnit(input, options?)` | create-once | `registerClaimUnit` |
| `ResearchOperations.transitionContradictionRecordState(input)` | post-persist | `transitionEvidenceRecordState` |
| `contradictionFromContradictionUnitPayload(payload)` (`operations/contradiction-from-unit.ts`) | OPS-local decode | `evidenceFromEvidenceUnitPayload` |
| `getContradictionUnit` · `getContradictionUnitRevision` · `getContradictionHead` · `getContradictionLineage` | read helpers | Claim/Evidence equivalents |
| `exportContradictionUnit` · `exportContradictionUnitRevision` | SER-JSON export | Claim/Evidence equivalents |
| `RegisterContradictionUnitResult` · `RegisterContradictionUnitOptions` · `TransitionContradictionRecordStateInput` · `TransitionContradictionRecordStateResult` · `ContradictionLineageEntry` (`= ClaimLineageEntry`) | DTO types | existing DTOs |
| `ResearchOperationsDeps.contradictionFactory: ContradictionFactory` · `ResearchOperationsDeps.contradictionTransitions: ContradictionTransitionService` | deps | `evidenceGrades` (022) |

`createResearchOperations` SHALL wire `new ContradictionFactory()` and `new ContradictionTransitionService()`. Direct JS constructors that omit these deps (e.g. `scripts/smoke-016-reference-app.mjs`) remain runtime-unaffected because they never invoke Contradiction methods (same situation as `evidenceGrades` in Sprint 022).

`apps/reference-app/src/index.ts` SHALL export the new symbols; `referenceAppMarker.sprint` becomes `23`; marker booleans unchanged.

### 6.2 What OPS SHALL NOT do

- define or map Contradiction states, or accept a `to` outside `CONTRADICTION_RECORD_STATES`;
- open a Contradiction with any `record_state` other than Core's `open`;
- resolve a Contradiction without Core `ContradictionTransitionService`;
- dereference `involved_claims` / `evidence_refs` against Persistence as a scientific admissibility rule (§9);
- write or read `Persistence.Relationship` entities for Contradiction edges (§9);
- mutate any Claim or Evidence unit, Standing, Record State, or Grade (§10);
- auto-populate `Claim.contested_by` or any reverse edge (§10);
- register membership or append events implicitly inside create/transition (callers do so explicitly, as for Claim/Evidence);
- introduce a generic `postPersistTransition()` / lifecycle abstraction (§22).

---

## 7. Creation Flow

### 7.1 Normative sequence — `registerContradictionUnit`

```
ContradictionFactory.createOpen(input)                 // Core — validates; may throw ContradictionValidationError
  → CanonicalEncoder.assemble(contradiction)            // ENC ContradictionUnit (intact)
  → entityFromCanonicalUnit(unit, { revision_id: "rev:initial" })
  → repository.create(entity)                           // immutable rev:initial row
  → repository.ensureInitialHead(contradiction_id, "ContradictionUnit", "rev:initial")
  → return { contradiction, unit, entity }
```

Nothing is persisted before `repository.create`. No operational event, no membership, no snapshot is produced by this method (Sprint 016/019 discipline; callers use `appendResearchEvent`, `registerMember`, `snapshotView` explicitly).

### 7.2 Input / options

| Parameter | Type | Rule |
|-----------|------|------|
| `input` | Core `CreateContradictionInput` (`contradiction_id`, `summary`, `involved_claims`, `overlap_statement`, `incompatibility_statement`, `provenance`, `created_by`, `created_at`, optional `ontology_ref`, `spec_ref`, `contradiction_version`, `evidence_refs`, `ai_assisted`, `human_sponsor`) | passed through unchanged to Core |
| `options.revision_id` | optional | default `rev:initial`; any other value → `OpsError INVALID_COMMAND_STATE` ("registerContradictionUnit creates initial revision only; use transitionContradictionRecordState for later revisions") — identical to `registerClaimUnit` |

**No pre-persist transition option.** Unlike `registerEvidenceUnit`, Sprint 023 does **not** offer `options.transition` (OQ-023-012 CLOSED: opening and resolving before first persist has no certified precedent for a unit whose only edges leave `open`; post-persist resolution is the specified path).

### 7.3 Output — `RegisterContradictionUnitResult`

`{ contradiction: Contradiction, unit: CanonicalUnit, entity: PersistenceEntity }` — `entity.revision_id === "rev:initial"`, no `predecessor_revision_id`, `storage_key === persist:CanonicalUnit:ContradictionUnit:{id}:rev:initial`.

### 7.4 Duplicate creation

Second `registerContradictionUnit` for the same `contradiction_id` → Persistence `ALREADY_EXISTS` from `repository.create` (row key collision); head untouched (already at `rev:initial`).

---

## 8. Model C Revision Contract

### 8.1 Post-persist transition — `transitionContradictionRecordState`

```
assertRevisionId(input.revision_id); assertRevisionId(input.expected_head_revision_id)
input.revision_id === "rev:initial"              → OpsError INVALID_COMMAND_STATE
input.revision_id === expected_head_revision_id  → OpsError INVALID_COMMAND_STATE
  → priorEntity = getContradictionUnit(identity)                 // head-resolved get(identity,"CanonicalUnit",{unit_kind:"ContradictionUnit"})
  → prior = contradictionFromContradictionUnitPayload(priorEntity.payload)   // OPS-local decode (§8.4)
  → next  = contradictionTransitions.transition(prior, input.transition)     // Core — may throw
  → unit  = CanonicalEncoder.assemble(next)                                  // ContradictionUnit
  → entity = entityFromCanonicalUnit(unit, { revision_id, predecessor_revision_id: expected_head_revision_id })
  → stored = repository.create(entity)                                       // immutable successor row
  → head   = repository.advanceHead(identity, "ContradictionUnit", expected_head_revision_id, revision_id)  // CAS
  → if append_event: repository.appendEvent(...)                             // §16
  → return { contradiction: next, unit, entity: stored, head_revision_id: head.content_version }
```

### 8.2 Input — `TransitionContradictionRecordStateInput`

| Field | Required | Meaning |
|-------|----------|---------|
| `identity` | Yes | `contradiction_id` |
| `transition` | Yes | Core `ContradictionRecordTransitionInput` (§5.4) |
| `revision_id` | Yes | new caller-supplied `rev:…`; ≠ `rev:initial`; ≠ `expected_head_revision_id` |
| `expected_head_revision_id` | Yes | expected current head; becomes `predecessor_revision_id` |
| `append_event` | No | default `false` (§16) |

### 8.3 Identity trichotomy (normative)

| Kind | Value | Role |
|------|-------|------|
| Scientific identity | `contradiction_id` | stable across all revisions |
| Content SemVer | `contradiction_version` | **unchanged** by Record State transition (Core); bumped only by `ContradictionVersionService` (out of scope) |
| Model C revision identity | `revision_id` | Persistence addressing; **≠** SemVer; CAS token = prior `revision_id` |

Consequence: consecutive `ContradictionUnit` revisions `rev:initial` → `rev:…` carry the **same** `content_version` (as Claim Standing revisions do in Sprint 020). Lineage MUST be read from `predecessor_revision_id`, never from SemVer.

### 8.4 Decode contract — `contradictionFromContradictionUnitPayload`

| Class | Fields | Source |
|-------|--------|--------|
| Reconstruct from `envelope.content` | `contradiction_id`, `contradiction_version`, `record_state` (must be in `CONTRADICTION_RECORD_STATES`), `summary`, `overlap_statement`, `incompatibility_statement`, `provenance`, `ethics_constraint_marker: "non_clinical"`, `created_by`, `created_at`, `resolution_note?` | content |
| Reconstruct from envelope | `ontology_ref`, `spec_ref` (envelope); `involved_claims` = references with role `involves` (order preserved); `evidence_refs` = references with role `cites_evidence` (omit key when empty); `record_transition_log` = events whose `to_state ∈ CONTRADICTION_RECORD_STATES` mapped to CRTE (`from_state` `"null"` when absent/`"null"`/invalid) | references / events |
| **Not reconstructible (lossy)** | `ai_assisted`, `human_sponsor` | not in ENC content — OQ-023-002 |
| Exclude | Persistence metadata (`storage_key`, `revision_id`, `predecessor_revision_id`), OPS metadata | never enters Core object |

Guards (all `OpsError INVALID_COMMAND_STATE`): payload not an object; `envelope.unit_kind !== "ContradictionUnit"`; `intact !== true`; `record_state` invalid; `involved_claims` reconstructed with < 2 entries (defensive — Core would also reject with `F2`).

The decode helper is a **projection**, not a second Core API; the Contradiction returned by Core `transition` is authoritative for the new revision (SPEC-021 §9.5 principle).

### 8.5 Conflict / duplicate / partial write

| Condition | Behaviour |
|-----------|-----------|
| Stale head | `advanceHead` → Persistence `CONFLICT`; prior head retained |
| Duplicate `revision_id` | `create` → Persistence `ALREADY_EXISTS`; head unchanged |
| `create` succeeds, `advanceHead` fails | **partial write**: orphan revision row may exist; head unchanged; not a scientific commit (SPEC-020 §28 / SPEC-021 §16 / SPEC-022 §8.3) |
| Predecessor existence check at `create` | **not** performed (inherited O-020-01 deferral; unchanged) |
| Multi-head branching | not a scientific model; second successor from same predecessor fails CAS |

### 8.6 Persistence changes

**NONE.** `create`, `get` (with `unit_kind` / `revision_id`), `getHead`, `ensureInitialHead`, `advanceHead`, `listRevisions`, `appendEvent`, `getEvents`, `snapshot` suffice.

---

## 9. Reference Integrity

### 9.1 Representation

`involved_claims` and `evidence_refs` are **Core scientific fields**. Their only persisted representation is the ENC `ContradictionUnit` envelope (`references` with roles `involves` / `cites_evidence`) inside the immutable `CanonicalUnit` row payload. `entityFromCanonicalUnit` additionally mirrors envelope references into `PersistenceEntity.references` as `PersistenceRelationship` **records on the same entity** — this is existing, generic, non-authoritative mirroring (same for Claim `supported_by`, Evidence `bears_on`) and is **not** a separate relationship store.

### 9.2 Persistence.Relationship — FORBIDDEN as scientific storage

`PERSISTENCE_ENTITY_KINDS` contains `"Relationship"` and `entityFromRelationship` exists; neither is used by OPS or any Reference Test at HEAD.

Sprint 023 **SHALL NOT**:

- create `Relationship` entities for `involves`, `cites_evidence`, `contested_by`, or any Contradiction edge;
- read `queryRelationships` to derive scientific meaning for Contradiction;
- treat `PersistenceEntity.references` as authoritative over the ENC payload.

**Rule:** the scientific edge set of a Contradiction revision is exactly what its `ContradictionUnit` payload encodes. Any future relationship projection is a derived, non-authoritative view (ROADMAP-REVIEW-001 R6) and is **out of scope**.

### 9.3 Existence of referenced Claims / Evidence

**FACT:** Core (`ContradictionReferenceValidator`) and ENC (`CanonicalReferenceResolver.assertIdentity`) validate **grammar only**; neither dereferences. No certified OPS path dereferences `bears_on`, `supported_by`, or `contested_by` (`REF-OPS-039` cites a non-existent Contradiction id).

**Decision (OQ-023-001 CLOSED):** OPS **SHALL NOT** require referenced Claim/Evidence units to exist in Persistence before `registerContradictionUnit`, and **SHALL NOT** add a Persistence-level existence rule. Inventing one would (a) create a Persistence-level scientific constraint SCI-004 does not define, (b) break parity with every certified reference field, and (c) make Contradiction admissibility depend on operational store contents. Fixtures MAY and SHOULD demonstrate both cases (referenced Claims persisted; referenced Claims absent) to make the boundary explicit (§19).

---

## 10. Claim.contested_by Integration

| Check | Verified |
|-------|----------|
| Claim Standing semantics unchanged | YES — `ClaimTransitionService.ALLOWED`, Human gates, `contested→supported` marker rule, `F7` (`contested` requires ≥1 `contested_by`) untouched |
| Claim remains Core authority | YES — `Claim.contested_by` is set only via Core `StandingTransitionInput.contested_by` (or `CreateClaimInput`) through `transitionClaimStanding`; OPS Contradiction methods never touch ClaimUnit rows or heads |
| Contradiction remains Core authority | YES — opening or resolving a Contradiction changes no Claim (SCI-004 §8.3 items 3; Core object never references Claim objects) |
| No reverse-sync | YES — creating a Contradiction with `involved_claims: [A, B]` **does not** add the Contradiction id to A or B `contested_by`; resolving it does not remove it; the caller MAY issue a separate `transitionClaimStanding` with `contested_by` (Human-gated) |
| No second graph | YES — Claim→Contradiction (`contested_by`) lives on ClaimUnit; Contradiction→Claim (`involves`) lives on ContradictionUnit; independent edges (SSR-5 pattern); no join table |

**Sprint 023 effect:** the Contradiction identity a Claim cites in `contested_by` **becomes persistable** as a headed `ContradictionUnit`. Nothing requires it to be persisted first (§9.3), and nothing checks consistency between the two edge sets. Coexistence is demonstrated by fixture (§19, theme T-13).

---

## 11. ENC / SER

| Concern | Sprint 023 rule |
|---------|-----------------|
| `buildContradiction` | **Unchanged** |
| ENC content set | **Unchanged** — `ai_assisted` / `human_sponsor` remain absent (OQ-023-002 deferred) |
| `REF-CANON-*` | **Unchanged** (SCI frozen) |
| `CanonicalEncoder.assemble` dispatch | reused; registry detection already returns `ContradictionUnit` |
| SER-JSON | `exportContradictionUnit*` use existing `JsonEncoder.encode(entity.payload)`; no new profile / serializer |
| Lossiness | accepted per SPEC-021 §9.4 precedent: "If ENC content omits a Core-optional field, projection omits it"; Core validation of the transitioned output remains the gate |

**Gate analysis of the lossiness (repository fact, not a redesign):** every legal Contradiction edge leaves `open` and therefore requires a Human Reviewer via `ContradictionTransitionService.assertHumanReviewerGate` / `ContradictionEventBuilder` (`requireHuman = leavesOpen(to)`) **regardless** of `ai_assisted`. The reconstructed object lacking `ai_assisted` therefore does not bypass any Core gate on the Sprint 023 path; it only omits an authorship marker that the certified canonical representation already omits. Restoring the marker is an ENC/SCI decision recorded in OQ-023-002, **not** resolved here.

---

## 12. Persistence

Infrastructure-only; unchanged.

| Reused | How |
|--------|-----|
| `entityFromCanonicalUnit` | kind map `ContradictionUnit → CanonicalUnit`; Model C options |
| `repository.create` | immutable rows; `ALREADY_EXISTS` on key collision |
| `repository.ensureInitialHead` / `getHead` / `advanceHead` | `unit_kind = "ContradictionUnit"` |
| `repository.get(identity, "CanonicalUnit", { unit_kind, revision_id? })` | head-resolved / specific revision; dual-read legacy ≡ `rev:initial` inherited |
| `repository.listRevisions(identity, "ContradictionUnit")` | lineage listing (sorted by `revision_id`) |
| `repository.appendEvent` / `getEvents` | sole journal (§16) |
| `repository.snapshot` | includes new rows + head + journal |

Not introduced: database, durable workspace/session, second journal, CQRS, event sourcing, graph DB, relationship store, distributed infrastructure, predecessor-existence check.

---

## 13. Membership

- `SessionMemberRef` / `WorkspaceMemberRef` already carry `{ entity_kind, unit_kind?, identity }`. A Contradiction member is `{ entity_kind: "CanonicalUnit", unit_kind: "ContradictionUnit", identity: contradiction_id }`. **No type change.**
- `registerMember(session, ref)` / `registerWorkspaceMember(workspace, ref)` are explicit caller actions; `registerContradictionUnit` and `transitionContradictionRecordState` **SHALL NOT** register or alter membership.
- Membership is an organizational index only. It is **not** `involved_claims`, `evidence_refs`, `Claim.contested_by`, revision lineage, or scientific provenance. Registering a Contradiction as a member does not imply its involved Claims are members, and vice versa.
- Transition does not change membership (same identity; new revision).

---

## 14. Snapshots

Frozen shapes **SHALL NOT** change:

```
ResearchSnapshot  = { research_session_id, member_refs, persistence_snapshot }
WorkspaceSnapshot = { research_workspace_id, member_refs, bound_session_ids, persistence_snapshot }
```

Contradiction participates **additively** through `persistence_snapshot.entities` (each `ContradictionUnit` revision row + its `RevisionHead`) and `persistence_snapshot.event_journal` (optional `ops.*` citations). No Contradiction-specific snapshot field or API. `timeline(session)` projects journal events for member identities, so a Contradiction member's operational events appear once it is registered as a member.

---

## 15. Export

| API *(new — Sprint 023)* | Behaviour |
|--------------------------|-----------|
| `exportContradictionUnit(identity)` | SER-JSON of head-resolved `ContradictionUnit` payload |
| `exportContradictionUnitRevision(identity, revision_id)` | SER-JSON of a specific revision payload |

Rules: payload only (no OPS/Persistence metadata injected — SPEC-020 §13); lower-layer errors propagate; no new SER profile; `getContradictionLineage(identity)` returns `{ revision_id, predecessor_revision_id?, content_version, storage_key }[]` for lineage export, identical in shape to Claim/Evidence (`ContradictionLineageEntry = ClaimLineageEntry`).

---

## 16. Operational Events

### 16.1 Scientific history

CRTE on the Contradiction / `ContradictionUnit` envelope events is the **scientific** transition history. Authoritative.

### 16.2 Optional operational citation (post-persist transition only)

When `append_event === true`, **after** successful `advanceHead`:

| Field | Normative value |
|-------|-----------------|
| `event_type` | `ops.contradiction_record_state_revision` |
| `parent_identity` | `contradiction_id` |
| `event_id` | `ops:{transition.event_id}` when supplied; else `ops:contradiction_record_state:{identity}:{revision_id}` — deterministic in both branches; certified paths SHALL supply `transition.event_id` |
| `payload` | `{ revision_id, predecessor_revision_id, unit_kind: "ContradictionUnit", to_record_state }` |
| `ordinal` | `0` (store assigns journal order, as in 020–022) |

| Rule | Statement |
|------|-----------|
| Create-once event | **None** emitted by `registerContradictionUnit` (parity with Claim/Evidence create-once) |
| Authority | operational only; citations are non-authoritative if they disagree with entity metadata (SPEC-020 §12) |
| Journal | sole Persistence journal — no second journal |
| Failure after head success | does not roll back revision or head |
| Meaning | "OPS recorded a Contradiction Record State revision at `revision_id`" — not the scientific resolution itself (that is the CRTE) |

---

## 17. Error Semantics

Propagate lower-layer errors unchanged (`OpsError` only for OPS command misuse / decode failure — `ops-error.ts` contract).

| Condition | Error (existing) |
|-----------|------------------|
| Invalid `contradiction_id`, pins, statements, provenance | Core `ContradictionValidationError` `F1` / `F9` |
| `involved_claims` < 2, duplicate, or bad Claim id grammar | Core `F2` / `F3` |
| Bad Evidence id grammar in `evidence_refs` | Core `F4` |
| `ai_assisted` without `human_sponsor` | Core `F_AI` |
| Illegal edge (e.g. `resolved_* → open`, terminal → anything) | Core `F_TRANSITION` |
| Non-human authority leaving `open` | Core `F6` |
| Missing `decision_ref` leaving `open`; empty `reason`; bad CRTE id | Core `F_TRANSITION` |
| `resolved_*` without `resolution_note` | Core `F7` |
| Changing an existing non-empty `resolution_note` via transition | Core `F8` |
| ENC assemble failure (bad ref grammar / pins / foreign embed) | `CanonicalEncodingError` (propagate) |
| Invalid `revision_id` / `expected_head_revision_id` grammar | Persistence `INVALID_ID` (`assertRevisionId`) |
| `revision_id === rev:initial` on transition; `revision_id === expected_head_revision_id`; non-initial `options.revision_id` on register | OPS `OpsError INVALID_COMMAND_STATE` |
| Contradiction / revision not found | Persistence `NOT_FOUND` |
| Duplicate `contradiction_id` on register; duplicate `revision_id` on transition | Persistence `ALREADY_EXISTS` |
| Stale head CAS | Persistence `CONFLICT` |
| Attempt to mutate an immutable revision row | Persistence `IMMUTABLE_ENTITY` |
| Malformed / non-intact / wrong-kind payload at decode | OPS `OpsError INVALID_COMMAND_STATE` |

**Ordering guarantee:** Core and ENC failures occur **before** any `create` → nothing persisted, head unchanged. `ALREADY_EXISTS` / `CONFLICT` follow §8.5.

No new error codes, classes, or categories are introduced. There is no distinct "invalid reference" OPS error — references are Core (`F2`/`F3`/`F4`) or ENC concerns.

---

## 18. Determinism

| Concern | Rule |
|---------|------|
| `contradiction_id`, `created_at`, `provenance.recorded_at` | caller-supplied |
| `revision_id`, `expected_head_revision_id` | caller-supplied |
| CRTE `event_id`, `at`, `authority_agent`, `reason`, `decision_ref`, `resolution_note` | caller-supplied; `transition.event_id` **REQUIRED** on all certified OPS/REF paths |
| Operational `event_id` | derived deterministically (§16) |
| Export / snapshot / lineage ordering | existing deterministic Persistence + SER rules; `listRevisions` sorted by `revision_id` |
| Forbidden on OPS paths | `randomUUID`, `Date.now`, `Math.random`, wall-clock minting |

**Inherited Core fallback (documented; not changed):** `ContradictionEventBuilder.build` mints `crte:` + `randomUUID()` when `event_id` is omitted. That fallback lies outside the deterministic OPS reference path. SPEC-023 requires callers to supply `event_id`; it does **not** authorize Core changes (same stance as SPEC-022 §11 / RR-002-02).

---

## 19. Reference Tests

Do **not** implement in this SPEC. EXEC-023 SHALL add **additive** fixtures starting at **`REF-OPS-077`** (next free id at baseline; existing fixtures SHALL NOT be renumbered or edited). `authorities: ["OPS-001"]` (plus `SCI-004` / `ENC-001` where a fixture asserts Core/ENC behaviour through OPS, following the `REF-OPS-004` pattern). Themes (normative; exact id-to-theme mapping at EXEC):

| # | Theme | Must prove |
|---|-------|------------|
| T-01 | Create-once open Contradiction | `createOpen` → `ContradictionUnit` `rev:initial` row; head `rev:initial`; `record_state: "open"`; empty CRTE log; `involves` refs ×2; `cites_evidence` refs when supplied |
| T-02 | Canonicalization | `unit.intact === true`; envelope `unit_kind`, `identity`, `content_version === contradiction_version`; SER-JSON export deterministic |
| T-03 | Core validation at create | `involved_claims` < 2 → `F2`; bad Claim id → `F3`; bad Evidence id → `F4`; incompatibility `none` → `F9`; **nothing persisted**, no head |
| T-04 | Duplicate create | second register same id → `ALREADY_EXISTS`; head unchanged |
| T-05 | Register with non-initial `revision_id` | `OpsError INVALID_COMMAND_STATE` |
| T-06 | Post-persist resolve (Human) | `open → resolved_by_scope_split` with `resolution_note`, `decision_ref`, `crte:` id → new revision; `predecessor_revision_id === "rev:initial"`; head advanced; CRTE present; `contradiction_version` unchanged |
| T-07 | Post-persist archive (Human) | `open → unresolved_archived` (no `resolution_note` needed) → new revision + head |
| T-08 | AI leaving open rejected | non-`human:` agent → Core `F6`; no revision row; head unchanged |
| T-09 | Missing `resolution_note` on `resolved_*` | Core `F7`; nothing persisted |
| T-10 | Terminal state re-transition | `resolved_* → unresolved_archived` (or any) → `F_TRANSITION`; nothing persisted |
| T-11 | Stale head CAS | second successor from `rev:initial` after head moved → `CONFLICT`; prior head retained; orphan row semantics documented |
| T-12 | Duplicate `revision_id` | `ALREADY_EXISTS`; head unchanged |
| T-13 | `Claim.contested_by` coexistence | `registerClaimUnit` → `transitionClaimStanding(to: "contested", contested_by: [C])` → `registerContradictionUnit(C, involved_claims: [claim, other])` (either order) → both heads independent; Claim payload unchanged by Contradiction ops; no auto-sync |
| T-14 | Referenced Claims absent | Contradiction with `involved_claims` not in Persistence still registers (grammar-only boundary, §9.3) |
| T-15 | Invalid revision grammar | `rev:initial` as transition `revision_id`, `revision_id === expected_head_revision_id` → `OpsError`; malformed `revision_id` → `INVALID_ID` |
| T-16 | Immutability | prior `rev:initial` payload byte-identical after transition; `exportContradictionUnitRevision(rev:initial)` unchanged |
| T-17 | Lineage | `getContradictionLineage` lists both revisions; predecessor chain correct; sorted by `revision_id` |
| T-18 | Decode round-trip | `contradictionFromContradictionUnitPayload` reconstructs `involved_claims`, `evidence_refs`, `resolution_note`, CRTE log; re-`assemble` yields identical envelope content/references/events |
| T-19 | Membership | explicit `registerMember({ entity_kind: "CanonicalUnit", unit_kind: "ContradictionUnit", identity })`; register/transition do not alter membership; membership ≠ `involved_claims` |
| T-20 | Snapshots | `ResearchSnapshot` / `WorkspaceSnapshot` shapes unchanged; `persistence_snapshot` contains both revisions + head |
| T-21 | Operational event | `append_event: true` → single `ops.contradiction_record_state_revision` with deterministic `ops:{crte id}` and payload citation; scientific authority remains the unit; `append_event` default emits nothing |
| T-22 | Persistence.Relationship non-use | no `Relationship` entity created by any Contradiction operation (`list`/`queryRelationships` empty for `Relationship` kind) |
| T-23 | Regression | `REF-OPS-001…076` unchanged and green; SCI 44/44 |

### Corpus impact (expected)

| Corpus | Impact |
|--------|--------|
| SCI | **Unchanged** 44/44 — no SCI fixture edits |
| OPS | additive from 76 |
| FULL | SCI ∪ OPS |

Deterministic identifiers in fixtures: `contradiction_id`, Claim/Evidence ids, `revision_id`, `expected_head_revision_id`, CRTE `event_id`, `at`, agents, `decision_ref`, `resolution_note`.

---

## 20. CONF / CERT

| Item | Sprint 023 stance |
|------|-------------------|
| `CONF-001@1.0.0` (SCI) | **Unchanged** |
| `CONF-001@1.1.0-OPS` | **Unchanged** — `REF-OPS-` prefix and `OPS-001` authority already in `REQUIRED_FIXTURE_PREFIXES_OPS` / `REQUIRED_AUTHORITIES_OPS`; `SCI-004` already in `REQUIRED_AUTHORITIES` |
| New profile / profile extension | **Not required** |
| New authority | **Not required** |
| ConformanceEngine / CertificationEngine | **ONE each**; no redesign |
| `CERTIFICATION_SCOPE_OPS` | unchanged (`SCI-000…006`, `ENC-001`, `SER-001`, `SER-JSON-001`, `RPR-001`, `ADR-0006`, `CONF-001`, `OPS-001`) |
| ReferenceReport semantics | unchanged (additive fixtures only) |
| Pipeline | `REF → CONF → CERT`; artifacts produced only by a future authorized certification step |
| Regression | Sprints 016–022 OPS + Model C + SCI remain green; `SMOKE_019/020/021/022_PASS` untouched |

CONF/CERT source is **not modified** by this SPEC or by EXEC-023.

---

## 21. Provenance Boundary

| Concept | Where it lives for Contradiction | Authority | Sprint 023 effect |
|---------|----------------------------------|-----------|-------------------|
| 1. Scientific provenance | `Contradiction.provenance {completeness, recorded_at, custody_agent, method_summary}` + CRTE log — in ENC content / events | Core | encoded/persisted per revision; unchanged semantics |
| 2. Operational audit | Persistence journal `ops.contradiction_record_state_revision` (optional) + `timeline` projection | Operational; non-authoritative citation | optional, default off |
| 3. Source locator | none on Contradiction; `evidence_refs` point at Evidence ids whose Evidence carries `source.source_locator` | Core (Evidence) | untouched |
| 4. Persistence history | immutable `ContradictionUnit` rows + snapshot `event_journal` | Infrastructure | additive rows |
| 5. Revision lineage | `predecessor_revision_id` + `RevisionHead` | Infrastructure representation metadata; ≠ SCI-004 `resolved_by_supersession` (which is a Record State about **Claims**, not about Contradiction revisions) | reused |

**Explicit non-conflation:** `resolved_by_supersession` / `resolved_by_retraction` name Claim-level scientific outcomes recorded on the Contradiction; they are **not** Model C revision movements, and RevisionHead advancement is **not** scientific resolution. No provenance subsystem is created. No provenance gap specific to Sprint 023 was found (the AI-marker omission is an ENC canonical-content question — OQ-023-002 — not a provenance-layer merge).

---

## 22. Scope / Non-Scope

### In scope

Contradiction create-once OPS · post-persist Record State OPS via Core `ContradictionTransitionService` · OPS-local decode · `ContradictionUnit` Model C rows / head / CAS · lineage / get / export helpers · explicit membership behaviour · frozen snapshots (additive content) · optional operational event · additive `REF-OPS-077+` · existing CONF/CERT integration · additive deps in `ResearchOperationsDeps` / `createResearchOperations` / `index.ts` exports / marker sprint bump.

### Out of scope (SHALL NOT be done in Sprint 023)

Negative Result OPS · Verification OPS · Grade changes · Evidence changes · Claim Standing redesign · Claim `qualified_by`/`verified_via` Core changes · new Contradiction vocabulary/states/gates · Contradiction material content OPS (`ContradictionVersionService`) · pre-persist transition option on register · dereference / existence rules for referenced ids · auto-sync of `Claim.contested_by` · `Persistence.Relationship` as scientific storage · any relationship graph / KG · provenance subsystem / packaging · DocumentArtifact · literature crawler · search · Neo4j · OpenSearch · PostgreSQL / durable adapter · AI layer · frontend · API · multi-user · durable workspace/session · distributed infrastructure · ENC content changes (incl. AI markers) · `REF-CANON` / SCI fixture edits · CONF/CERT changes · generic lifecycle framework / `postPersistTransition()` · Processor changes · Core changes of any kind.

---

## 23. Open Questions

Each entry: issue · why it matters · affected boundary · blocks implementation? · resolution path.

| ID | Issue | Why it matters | Boundary | Blocks? | Resolution |
|----|-------|----------------|----------|---------|------------|
| **OQ-023-001** | Should OPS require referenced Claims/Evidence to exist before Contradiction creation? | Would introduce a Persistence-level scientific admissibility rule absent from SCI-004 and break parity with `bears_on`/`supported_by`/`contested_by` | Core ↔ OPS ↔ Persistence | No | **CLOSED** — grammar-only, no dereference (§9.3); fixtures T-13/T-14 make the boundary explicit |
| **OQ-023-002** | `ContradictionUnit` (and NR/Verification units) content omits `ai_assisted` / `human_sponsor`; decode is lossy for AI-authorship markers | Reconstructed objects cannot carry the marker; a future consumer reading canonical units cannot tell AI-assisted Contradictions apart | ENC ↔ SCI (frozen `REF-CANON`) ↔ OPS decode | **No** — every Sprint 023 edge is Human-gated independently of `ai_assisted`; lossiness precedent SPEC-021 §9.4 | **DEFERRED ARCHITECTURE QUESTION** — requires a separately authorized ENC/SCI discovery (ENC minor version + `REF-CANON` impact analysis). Sprint 023 SHALL NOT modify ENC or SCI fixtures. Recorded for ROADMAP follow-up |
| **OQ-023-003** | Slice: create-once only, or create-once + post-persist resolution? | Core `ContradictionTransitionService` exists; leaving resolution out would re-open the exact gap Sprints 020–022 closed | OPS scope | No | **CLOSED** — both, in one sprint (§7, §8) |
| **OQ-023-004** | Operational event type / create-once event | Naming consistency; second-journal risk | Persistence journal ↔ OPS | No | **CLOSED** — `ops.contradiction_record_state_revision`, transition only, optional (§16) |
| **OQ-023-005** | `Claim.qualified_by` / `verified_via` are creation-only in Core | Affects future NR/Verification OPS linkage; not Contradiction (`contested_by` is settable via Standing) | Core / SCI-001 | No (out of scope) | **DEFERRED** to NR/Verification discovery; Core authority decision |
| **OQ-023-008** | Use of `Persistence.Relationship` for Contradiction edges | Second relationship graph hazard | Persistence ↔ scientific authority | No | **CLOSED** — forbidden (§9.2); fixture T-22 |
| **OQ-023-009** | Should fixtures prove `Claim.contested_by` → persisted Contradiction coexistence? | Closes the dangling-edge evidence gap from `REF-OPS-039` without auto-sync | OPS evidence | No | **CLOSED** — T-13 required; no sync (§10) |
| **OQ-023-010** | Fourth isomorphic per-unit path — generic lifecycle engine? | RR-002-05 / FO-022-06 | OPS architecture | No | **CLOSED** — rejected; explicit per-unit methods only (§6, §22) |
| **OQ-023-011** | Core `ContradictionVersionService.applyMaterialUpdate` exists — expose as OPS in 023? | Material content OPS for Claim/Evidence is itself deferred (SPEC-021 §32 #1); mixing would widen scope and `F8` note-change semantics need their own contract | OPS scope | No | **CLOSED** — non-goal; candidate for a later material-content OPS sprint covering all units |
| **OQ-023-012** | Offer `options.transition` (pre-persist resolution) on `registerContradictionUnit` as `registerEvidenceUnit` does? | Contradiction has no issuance edge; a Contradiction opened and resolved before first persist has no scientific precedent in fixtures | OPS scope | No | **CLOSED** — not offered; post-persist path is the specified resolution path |
| **OQ-023-013** | Should `getContradictionUnit` dual-read legacy three-segment keys? | Inherited generic Persistence behaviour for `rev:initial`; no legacy Contradiction rows exist | Persistence | No | **CLOSED** — inherited generic behaviour applies; nothing Contradiction-specific |

**No open question blocks architecture audit.** OQ-023-002 and OQ-023-005 are deferred architecture questions outside Sprint 023 authority and are not resolved by this SPEC.

---

## 24. Implementation Gates

| Gate | State |
|------|-------|
| Contradiction scientific semantics defined by Core | YES (§5) |
| Post-persist transition exists in Core | YES — `ContradictionTransitionService.transition` |
| Model C reuse without new primitive | YES (§8, §12) |
| Identity defined (scientific / SemVer / revision) | YES (§8.3) |
| Reference boundary defined | YES (§9) |
| `Claim.contested_by` non-interference verified | YES (§10) |
| ENC / SER unchanged | YES (§11) |
| Persistence.Relationship forbidden | YES (§9.2) |
| Determinism guaranteed on OPS paths | YES (§18) |
| CONF/CERT unchanged | YES (§20) |
| Generic lifecycle engine | REJECTED |
| Blockers per prompt §26 | **NONE** |
| Implementation authorization | **NO** |

**Next authorized step (when separately commanded):** ARCHITECTURE-AUDIT-023 → IMPLEMENTATION-DECISION-023 → FINAL-ARCHITECTURE-RE-AUDIT-023 → only then EXEC-023.

---

## 25. Final Status

**DRAFT — READY FOR ARCHITECTURE AUDIT**

SPEC-023 FINAL VERDICT
======================

Contradiction scientific authority:
Scientific Core (SCI-004) solely owns Contradiction meaning, Record State vocabulary and edges, Human Reviewer gate, `resolution_note` rules, and reference admissibility. OPS orchestrates only.

OPS operations:
`registerContradictionUnit` — `ContradictionFactory.createOpen` → ENC `ContradictionUnit` → `Persistence.create` (`rev:initial`) → `ensureInitialHead`.
`transitionContradictionRecordState` — head-resolved decode → `ContradictionTransitionService.transition` → ENC → `Persistence.create` (successor) → `advanceHead` CAS → optional `ops.contradiction_record_state_revision`.

Model C:
Reused unchanged — stable `contradiction_id`; immutable revisions; `predecessor_revision_id`; `RevisionHead` for `unit_kind = "ContradictionUnit"`; CAS; partial-write honesty identical to SPEC-020/021/022.

References:
`involved_claims` / `evidence_refs` are Core fields carried in the `ContradictionUnit` envelope only; grammar-validated; never dereferenced; `Persistence.Relationship` forbidden as scientific storage.

Claim.contested_by:
Unchanged Core semantics; Contradiction identity becomes persistable; no reverse synchronization; independent edges; no second graph.

ENC / SER / Persistence / CONF / CERT changes:
NONE

New scientific authority / graph / journal:
NONE

Generic lifecycle:
NOT JUSTIFIED

Deferred architecture questions:
OQ-023-002 (ENC AI-marker canonical content) · OQ-023-005 (Claim `qualified_by` / `verified_via` Core setter)

Blockers:
NONE

Execution gate:
READY FOR ARCHITECTURE AUDIT

Implementation authorization:
NO

*End SPEC-023 — design only. No implementation. No commit. No push.*

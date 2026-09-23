# SPEC-024 — Negative Result OPS Under Model C

| Field | Value |
|-------|-------|
| **Spec ID** | SPEC-024 |
| **Artifact** | `specs/architecture/SPEC-024_negative_result_ops.md` |
| **Status** | DRAFT — READY FOR ARCHITECTURE AUDIT |
| **Baseline commit** | `207365fb260b9e334bb60f16252ab3f445411dd6` (Sprint 023 certified + closed) |
| **Depends on** | SCI-005@0.1.0 · SCI-001 (Claim `qualified_by`) · SCI-002 · SCI-004 · ADR-0006 · ADR-020 / SPEC-020 (Model C) · SPEC-021 (decode / post-persist) · SPEC-022 · SPEC-023 · DISCOVERY-024 |
| **Implementation authorization** | **NO** |

Normative language: RFC 2119 SHALL / MUST / SHOULD / MAY.  
Every API, error code, grammar, and field named below was verified against source at the baseline commit. Where this SPEC names a **new** OPS symbol, it is marked *(new — Sprint 024)*.

---

## 1. Status

**DRAFT**

Design-only. No source, test, fixture, certification, or documentation-of-prior-sprint changes accompany this SPEC.

**Audit readiness:** READY FOR ARCHITECTURE AUDIT (§29).

---

## 2. Baseline

| Item | Value |
|------|-------|
| Sprint | 023 — Contradiction OPS Under Model C — FORMALLY CERTIFIED AND CLOSED |
| Commit | `207365fb260b9e334bb60f16252ab3f445411dd6` (`cert(sprint-023): certify Contradiction OPS under Model C`) |
| HEAD == origin/main | YES |
| SCI corpus | 44/44 under `CONF-001@1.0.0` |
| OPS corpus | 105/105 (`REF-OPS-001…105`) |
| FULL corpus | 149/149 under `CONF-001@1.1.0-OPS` |
| Highest OPS fixture | `REF-OPS-105` → next free additive id **`REF-OPS-106`** |
| Discovery pin | `audits/roadmap/DISCOVERY-024_NEXT_RESEARCH_FRONTIER.md` — READY FOR SPEC-024 · JUSTIFIED NEXT = Negative Result OPS under Model C |

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
| Contradiction Record State | `transitionContradictionRecordState` | `ContradictionTransitionService.transition` | `ContradictionUnit` | 023 |

Sprint 024 is the **fifth explicit per-unit** orchestration of the same shape. It is **not** a generic engine.

---

## 3. Problem Statement

1. Core owns a complete Negative Result aggregate (SCI-005): factory (`createRegistered`), validator, Record State transition service (`registered → withdrawn`), version service, ENC `NegativeResultUnit`, SER-JSON registration, Processor stage, SCI fixtures (`REF-NR-*`), `REF-CANON` assembly.
2. Research Operations has **no** Negative Result path: no create-once, no decode-from-unit, no post-persist withdrawal, no get/lineage/export helpers. No `NegativeResultUnit` row or RevisionHead has ever been created by OPS or any REF-OPS fixture.
3. A **certified Claim edge already cites Negative Result identities**: `CreateClaimInput.qualified_by` / `ClaimReferenceValidator.validateQualifiedBy` require SCI-005 `negresult:…` grammar (`F12`). Those identities cannot be OPS-persisted today.
4. Once a Negative Result is persisted, Core withdrawal (`registered → withdrawn`) cannot be committed without an immutable successor revision — the same gap Sprints 020–023 closed for Standing, Record State, Grade, and Contradiction.

**Sprint 024 objective:** make Core Negative Result operationally **creatable** (Human-gated issuance) and **withdrawable after persistence** under certified Model C, using existing Core semantics only.

---

## 4. Scope

### In scope

- Negative Result create-once OPS via Core `NegativeResultFactory.createRegistered`
- Post-persist Record State OPS via Core `NegativeResultTransitionService.transition` (`registered → withdrawn`)
- OPS-local decode helper for `NegativeResultUnit` payloads
- Model C persistence for `unit_kind = "NegativeResultUnit"` (reuse create / ensureInitialHead / advanceHead / journal)
- Get / lineage / export helpers mirroring Claim / Evidence / Contradiction
- Explicit membership behaviour (unchanged shapes)
- Frozen snapshots (additive persistence content only)
- Optional operational citation event on post-persist withdrawal
- Additive `REF-OPS-106+` under existing `CONF-001@1.1.0-OPS`
- Additive deps in `ResearchOperationsDeps` / `createResearchOperations` / `index.ts` exports / marker sprint bump

### Out of scope

See §27 Explicit Non-Goals.

---

## 5. Scientific Authority

| Layer | Owns | Must not |
|-------|------|----------|
| **Scientific Core** (`@sciros/core` `negative-result/*`) | Negative Result meaning; Record State vocabulary and legal edges; Human Reviewer gate at registration and withdrawal; `withdrawal_reason` rules; reference admissibility; NRTE validity; SemVer material bump | Be bypassed, re-implemented, or extended by OPS |
| **OPS** (`@sciros/reference-app`) | Orchestration: Core create/transition → ENC → Model C create → head init / CAS → optional journal citation; membership index; snapshot/export projections | Define Negative Result vocabulary, states, gates, or relationship semantics; dereference scientific ids as a scientific rule; own lineage |
| **ENC** | `NegativeResultUnit` canonical projection (content, envelope references, NRTE events) | Be modified by Sprint 024 |
| **SER** | JSON encode/decode of CanonicalUnit payloads | New profile / serializer |
| **Persistence** | Immutable rows, RevisionHead, CAS, sole journal, snapshot | Scientific Negative Result semantics; `Relationship` entity as scientific edge store (§11) |
| **REF / CONF / CERT** | Executable evidence; profile evaluation; certification | Own semantics |
| **AI** | Non-authoritative | Register or withdraw as sole authority (Core `F5`) |

**Invariants (SHALL hold after Sprint 024):**

- exactly one scientific authority (Core);
- no second scientific relationship graph;
- no second event journal;
- RevisionHead ≠ scientific truth; `predecessor_revision_id` ≠ scientific supersession;
- Claim Standing / Negative Result Record State remain **orthogonal** (ADR-0006); Claim `qualified_by` is independent of NR Record State.

---

## 6. Core Negative Result Semantics

Everything in this section is **existing Core behaviour** (`packages/core/src/negative-result/*`). Sprint 024 changes none of it.

### 6.1 Identity and pins

| Field | Grammar / rule | Source |
|-------|----------------|--------|
| `negative_result_id` | `/^negresult:[A-Za-z0-9._~-]{1,128}$/` (`NEGATIVE_RESULT_OBJECT_ID`) — Core `F1` | `identifiers.ts` |
| `ontology_ref` | `/^SCI-000@0\.1\.[0-9]+$/`; factory default `SCI-000@0.1.0` | `identifiers.ts`, `transition-service.ts` `register` |
| `spec_ref` | `/^SCI-005@0\.1\.[0-9]+$/`; factory default `SCI-005@0.1.0` | same |
| `negative_result_version` | SemVer `/^[0-9]+\.[0-9]+\.[0-9]+$/`; factory default `1.0.0` | same |
| `created_at`, `provenance.recorded_at`, NRTE `at` | UTC second `YYYY-MM-DDTHH:MM:SSZ` (`NEGATIVE_RESULT_UTC_SECOND`) | same |
| NRTE `event_id` | `/^nrte:[A-Za-z0-9._~-]{1,128}$/` (`NRTE_ID`) | same |
| Human Reviewer | `/^human:[A-Za-z0-9._~-]{1,128}$/` (`NEGATIVE_RESULT_HUMAN_REVIEWER`) | same |
| `ethics_constraint_marker` | MUST be `"non_clinical"` (`F11`) | `validator.ts` |

### 6.2 Object shape (`NegativeResult`)

Mandatory: `negative_result_id`, `ontology_ref`, `spec_ref`, `negative_result_version`, `record_state`, `summary`, `description`, `expected_observation`, `observed_absence`, `scope {domain_context, bounds, exclusions}`, `protocol_ref`, `sensitivity_context`, `ethics_constraint_marker: "non_clinical"`, `provenance {completeness, recorded_at, custody_agent, method_summary}`, `created_by`, `created_at`.

Optional: `claim_refs`, `evidence_refs`, `contradiction_refs`, `verification_refs`, `ai_assisted`, `human_sponsor`, `withdrawal_reason`, `record_transition_log`.

### 6.3 Creation — `NegativeResultFactory.createRegistered(input, registration)`

**FACT:** Core issuance is `createRegistered`, **not** an ungated draft/open factory. There is **no** `draft` Record State (`FORBIDDEN_NEGATIVE_RESULT_RECORD_STATES` includes `draft`, Contradiction states, Standing states, Verification outcomes, etc.).

Behaviour (`factory.ts` → `NegativeResultTransitionService.register`):

1. `registration.to` MUST be `"registered"` else `F_TRANSITION`.
2. Human Reviewer gate on `registration` (`assertHumanReviewerGate`) — §8.
3. Grammar-validate optional refs (`NegativeResultReferenceValidator`).
4. NFC-trim content fields; freeze scope/provenance.
5. Build initial NRTE (`from_state: "null"`, `to_state: "registered"`).
6. Produce frozen `NegativeResult` with `record_state: "registered"` and `record_transition_log: [nrte]`.
7. `NegativeResultValidator.validate`.

**FACT:** Issuance **always** embeds a Human NRTE. Unlike Contradiction `createOpen` (empty CRTE log), Negative Result create is itself a gated transition edge `(new) → registered`.

### 6.4 Material change — `NegativeResultVersionService.applyMaterialUpdate`

Exists in Core (bumps `negative_result_version` patch on material change; `F9` on no-op). **Not an OPS operation in Sprint 024** (§27; OQ-024-004).

### 6.5 Processor / Persistence kind map (existing)

- Processor handles `negative_result.record_transition` (not used by OPS; OPS calls Core directly, as for Claim/Evidence/Contradiction).
- `entityFromCanonicalUnit` maps `NegativeResultUnit → entity_kind "CanonicalUnit"`; Model C keys/head are `unit_kind`-generic.

---

## 7. State Model

**FACT:** Exact vocabulary from `NEGATIVE_RESULT_RECORD_STATES`:

| State | Meaning | Terminal? |
|-------|---------|-----------|
| `registered` | Issued Negative Result; only legal post-issuance source state | No |
| `withdrawn` | Withdrawn Negative Result; requires non-empty `withdrawal_reason` | Yes |

### 7.1 Legal edges (`NegativeResultTransitionService`)

| From | To (legal) | Notes |
|------|------------|-------|
| *(new)* | `registered` | Issuance only via `register` / `createRegistered` — not via `transition` |
| `registered` | `withdrawn` | Sole post-persist edge |
| `withdrawn` | — | Terminal (`ALLOWED.withdrawn = []`) |

Forbidden: any Standing / Contradiction / Verification / workflow vocabulary as Record State (`F4`); `registered → registered`; `withdrawn → *`; inventing states.

### 7.2 Transition input (`NegativeResultRecordTransitionInput`)

| Field | Required | Core rule |
|-------|----------|-----------|
| `to` | Yes | must be legal (`F_TRANSITION`) |
| `authority_agent` | Yes | Human Reviewer for `registered` and `withdrawn` (`F5`) |
| `reason` | Yes | non-empty after NFC+trim (`F_TRANSITION`) |
| `decision_ref` | Yes (gate) | non-empty after NFC+trim for registration and withdrawal (`F_TRANSITION`) |
| `at` | Yes | UTC second |
| `event_id` | Optional in Core; **required on OPS paths** (§24) | `nrte:…` grammar |
| `withdrawal_reason` | Required when `to === "withdrawn"` (`F7`) | non-empty after NFC+trim |

`transition(nr, input)` result: new frozen `NegativeResult` with `record_state = to`, appended NRTE, `withdrawal_reason` set when withdrawing, `negative_result_version` **unchanged**, other fields carried; validated.

### 7.3 Validation highlights (`NegativeResultValidator`)

| Code | Condition |
|------|-----------|
| `F1` | Bad id / pins / version / empty summary·description·created_by / bad timestamps / provenance |
| `F2` | Empty `protocol_ref`; empty / `none` / `n/a` for expected_observation or observed_absence; empty sensitivity |
| `F3` | Missing/empty scope fields |
| `F4` | Forbidden or invalid `record_state` / NRTE states |
| `F5` | Non-human NRTE authority |
| `F6` | NRR-1: registered/withdrawn lineage lacks Human NRTE with `to_state=registered` |
| `F7` | `withdrawn` without non-empty `withdrawal_reason` |
| `F8` | Bad claim/evidence/contradiction/verification ref arrays |
| `F11` | `ethics_constraint_marker !== "non_clinical"` |
| `F_AI` | `ai_assisted === true` without non-empty `human_sponsor` |
| `F_TRANSITION` | Illegal edge; empty reason/decision_ref; bad/duplicate NRTE `event_id`; withdrawn without matching NRTE |

---

## 8. Human-Gated Creation

**FACT:** Registration is Human-gated in Core. OPS MUST preserve these gates exactly and MUST NEVER weaken or bypass them.

### 8.1 Gate location

`NegativeResultTransitionService.assertHumanReviewerGate` (invoked by both `register` and `transition`):

1. For `to ∈ {"registered","withdrawn"}` (`requiresHumanForTransition`):
2. `authority_agent` MUST match `/^human:[A-Za-z0-9._~-]{1,128}$/` — else **`F5`**
   - register message: `"AI SHALL NOT register Negative Result; Human Reviewer required"`
   - withdraw message: `"AI SHALL NOT withdraw Negative Result; Human Reviewer required"`
3. `decision_ref` MUST be non-empty after NFC+trim — else **`F_TRANSITION`**
4. When `to === "withdrawn"`: `withdrawal_reason` MUST be non-empty after NFC+trim — else **`F7`**

### 8.2 NRTE construction

`NegativeResultEventBuilder.build` additionally requires Human Reviewer, non-empty `reason` / `decision_ref`, and `nrte:` event id grammar. If `event_id` omitted, Core mints `nrte:` + `randomUUID()` — **forbidden on certified OPS paths** (§24).

### 8.3 Failure before persistence

Core validation / Human gate failures occur **before** any `repository.create`. Nothing is persisted; no head is written. OPS SHALL propagate `NegativeResultValidationError` unchanged.

### 8.4 Optional authorship markers

`ai_assisted` / `human_sponsor` are Core-optional. When `ai_assisted === true`, Core requires `human_sponsor` (`F_AI`). ENC `NegativeResultUnit` content **omits** both markers (same class as Contradiction — OQ-023-002 / OQ-024-001). Human gates on registration/withdrawal do **not** depend on these markers.

---

## 9. Model C Persistence Contract

Reuse certified Model C without redesign.

| Concern | Rule |
|---------|------|
| Scientific identity | `negative_result_id` — stable across revisions |
| Persistence identity | `persist:CanonicalUnit:NegativeResultUnit:{negative_result_id}:{revision_id}` |
| Initial revision | `rev:initial` only via create-once |
| Later revisions | caller-supplied `rev:*` ≠ `rev:initial` |
| Lineage | `predecessor_revision_id` = prior head revision on successors |
| Head | `persist:RevisionHead:NegativeResultUnit:{negative_result_id}` |
| Head advancement | CAS via `advanceHead` |
| Stale head | Persistence `CONFLICT`; prior head retained |
| Old revisions | immutable (`IMMUTABLE_ENTITY` on mutate) |
| Partial write | if `create` succeeds and `advanceHead` fails → orphan revision MAY exist; head unchanged; **not** scientific rollback; OPS MUST NOT claim transactional scientific rollback |

**Identity trichotomy (normative):**

| Kind | Value | Role |
|------|-------|------|
| Scientific identity | `negative_result_id` | stable across all revisions |
| Content SemVer | `negative_result_version` | **unchanged** by Record State transition (Core); bumped only by `NegativeResultVersionService` (out of scope) |
| Model C revision identity | `revision_id` | Persistence addressing; **≠** SemVer; CAS token = prior `revision_id` |

Consequence: consecutive `NegativeResultUnit` revisions may carry the **same** `content_version`. Lineage MUST be read from `predecessor_revision_id`, never from SemVer.

**Persistence changes:** NONE. Existing `create` / `get` / `getHead` / `ensureInitialHead` / `advanceHead` / `listRevisions` / `appendEvent` / `getEvents` / `snapshot` suffice.

---

## 10. CanonicalUnit Contract

### 10.1 Unit kind

**FACT:** ENC unit kind is `"NegativeResultUnit"` — existing; do not invent another kind.

Detection: `CanonicalEncoder` registry returns `NegativeResultUnit` when `"negative_result_id" in o` (and related shape); `buildNegativeResult(nr)`.

### 10.2 Envelope (existing `CanonicalEncodingBuilder.buildNegativeResult`)

| Envelope part | Content |
|---------------|---------|
| `unit_kind` | `"NegativeResultUnit"` |
| `identity` | `negative_result_id` |
| `content_version` | `negative_result_version` |
| `ontology_ref` / `spec_ref` | from Core object |
| `content` | `negative_result_id`, `negative_result_version`, `record_state`, `summary`, `description`, `expected_observation`, `observed_absence`, `scope`, `protocol_ref`, `sensitivity_context`, `provenance`, `ethics_constraint_marker`, `created_by`, `created_at`, `withdrawal_reason?` |
| `references` | see §11 |
| `events` | one `CanonicalEvent` per NRTE (`parent_class: "NegativeResult"`, `from_state`, `to_state`, `authority_agent`, `reason`, `decision_ref?`, `at`) |

**FACT (OQ-023-002 class):** `NegativeResultUnit.content` does **not** carry `ai_assisted` or `human_sponsor`. Sprint 024 SHALL NOT modify ENC.

### 10.3 SER

SER-JSON registry, profile, validator, encoder, decoder already recognise `NegativeResultUnit`. Export reuses `JsonEncoder.encode(entity.payload)`. No new profile.

---

## 11. Reference Semantics

### 11.1 Core fields (grammar-only; no dereference)

| Field | Target grammar (Core) | ENC role | Authoritative? | OPS dereference? |
|-------|----------------------|----------|----------------|------------------|
| `claim_refs?` | SCI-001 Claim id (`F8`) | `qualifies_or_challenges` → Claim | Core field in unit payload | **NO** |
| `evidence_refs?` | SCI-002 Evidence id (`F8`) | `cites_evidence` → Evidence | Core field in unit payload | **NO** |
| `contradiction_refs?` | SCI-004 Contradiction id (`F8`) | `related_contradiction` → Contradiction | Core field in unit payload | **NO** |
| `verification_refs?` | **opaque non-empty string** after NFC+trim until SCI-006 (`F8`) | `related_verification` → Verification | Core field; see §11.4 | **NO** |

References are **scientific content**, not membership. They are **not** Persistence.Relationship rows.

### 11.2 Persistence.Relationship — FORBIDDEN as scientific storage

Sprint 024 **SHALL NOT**:

- create `Relationship` entities for any Negative Result edge;
- read `queryRelationships` to derive scientific meaning;
- treat `PersistenceEntity.references` as authoritative over the ENC payload.

**Rule:** the scientific edge set of a Negative Result revision is exactly what its `NegativeResultUnit` payload encodes.

### 11.3 Existence of referenced entities

**FACT:** Core and ENC validate **grammar** (or opacity for verification_refs at Core); neither dereferences Persistence.

**Decision (OQ-024-002 CLOSED):** OPS **SHALL NOT** require referenced Claim / Evidence / Contradiction / Verification units to exist in Persistence before `registerNegativeResultUnit`. Fixtures MAY demonstrate both persisted and absent targets (especially Contradiction coexistence after Sprint 023).

### 11.4 Core/ENC asymmetry on `verification_refs` (existing)

| Layer | Rule |
|-------|------|
| Core | non-empty string after NFC+trim (SCI-005 §11.4 “until SCI-006”) |
| ENC | `assertIdentity("Verification", id)` requires `/^verification:[A-Za-z0-9._~-]{1,128}$/` |

**Consequence:** a Core-valid opaque non-`verification:` string will fail at `CanonicalEncoder.assemble` with `CanonicalEncodingError` / `BROKEN_REFERENCE` **before** persistence. OPS SHALL NOT invent a third validation rule. Certified fixtures that supply `verification_refs` SHALL use Verification identity grammar (or omit the field). This asymmetry is **pre-existing** and is **not** resolved by Sprint 024 (OQ-024-003).

### 11.5 Claim.qualified_by coexistence

| Check | Rule |
|-------|------|
| Claim remains Core authority | `qualified_by` set only via Claim create (`CreateClaimInput`); Standing transition does **not** set it (OQ-023-005 deferred) |
| Negative Result remains Core authority | NR create/withdraw changes no Claim |
| No reverse-sync | Creating an NR with `claim_refs` does **not** mutate Claim `qualified_by`; citing NR in Claim `qualified_by` does **not** require NR to exist first |
| No second graph | Claim→NR (`qualified_by`) lives on ClaimUnit; NR→Claim (`qualifies_or_challenges`) lives on NegativeResultUnit; independent edges |

Sprint 024 effect: Negative Result identity becomes persistable as a headed `NegativeResultUnit`. Coexistence fixture theme required (§21 T-13).

---

## 12. OPS API Surface

### 12.1 Additive OPS surface *(new — Sprint 024)*

| Symbol | Kind | Mirrors |
|--------|------|---------|
| `ResearchOperations.registerNegativeResultUnit(input, registration, options?)` | create-once (Human-gated) | `registerContradictionUnit` shape + required registration (unlike Contradiction) |
| `ResearchOperations.transitionNegativeResultRecordState(input)` | post-persist | `transitionContradictionRecordState` |
| `negativeResultFromNegativeResultUnitPayload(payload)` (`operations/negative-result-from-unit.ts`) | OPS-local decode | `contradictionFromContradictionUnitPayload` |
| `getNegativeResultUnit` · `getNegativeResultUnitRevision` · `getNegativeResultHead` · `getNegativeResultLineage` | read helpers | Claim/Evidence/Contradiction |
| `exportNegativeResultUnit` · `exportNegativeResultUnitRevision` | SER-JSON export | Claim/Evidence/Contradiction |
| `RegisterNegativeResultUnitResult` · `RegisterNegativeResultUnitOptions` · `TransitionNegativeResultRecordStateInput` · `TransitionNegativeResultRecordStateResult` · `NegativeResultLineageEntry` (`= ClaimLineageEntry`) | DTO types | existing DTOs |
| `ResearchOperationsDeps.negativeResultFactory: NegativeResultFactory` · `ResearchOperationsDeps.negativeResultTransitions: NegativeResultTransitionService` | deps | Contradiction deps (023) |

`createResearchOperations` SHALL wire `new NegativeResultFactory()` and `new NegativeResultTransitionService()`.

`apps/reference-app/src/index.ts` SHALL export the new symbols; `referenceAppMarker.sprint` becomes `24`; marker booleans unchanged.

### 12.2 Minimum API justification

| API | Justified because |
|-----|-------------------|
| `registerNegativeResultUnit` | Core create exists; Model C create-once required for OPS |
| `transitionNegativeResultRecordState` | Core `transition` exists for `registered → withdrawn`; Model C successor required |
| decode helper | Post-persist path must reconstruct Core object from unit payload (SPEC-021 pattern) |
| get / lineage / export | Parity with every headed unit OPS surface; required for REF themes |

**Not included:** material content OPS; pre-persist withdrawal on register; Verification OPS; Claim Standing redesign.

### 12.3 What OPS SHALL NOT do

- define or map Negative Result states, or accept a `to` outside `NEGATIVE_RESULT_RECORD_STATES`;
- register a Negative Result without Core Human-gated `createRegistered` / registration input;
- withdraw without Core `NegativeResultTransitionService.transition`;
- dereference refs against Persistence as scientific admissibility (§11);
- write or read `Persistence.Relationship` for scientific edges;
- mutate any Claim / Evidence / Contradiction / Verification / Grade unit;
- auto-populate `Claim.qualified_by` or any reverse edge;
- register membership or append events implicitly inside create/transition;
- introduce a generic `postPersistTransition()` / lifecycle abstraction.

---

## 13. Creation Flow

### 13.1 Normative sequence — `registerNegativeResultUnit`

```
NegativeResultFactory.createRegistered(input, registration)   // Core — Human gate + validate; may throw
  → CanonicalEncoder.assemble(negativeResult)                 // ENC NegativeResultUnit (intact)
  → entityFromCanonicalUnit(unit, { revision_id: "rev:initial" })
  → repository.create(entity)                                 // immutable rev:initial row
  → repository.ensureInitialHead(negative_result_id, "NegativeResultUnit", "rev:initial")
  → return { negativeResult, unit, entity }
```

Nothing is persisted before `repository.create`. No operational event, no membership, no snapshot is produced by this method (Sprint 016/019/023 discipline).

### 13.2 Input / options

| Parameter | Type | Rule |
|-----------|------|------|
| `input` | Core `CreateNegativeResultInput` | passed through unchanged to Core |
| `registration` | Core `NegativeResultRecordTransitionInput` | **required**; `to` MUST be `"registered"`; Human Reviewer; non-empty `decision_ref` / `reason` / `at`; certified paths supply `event_id` |
| `options.revision_id` | optional | default `rev:initial`; any other value → `OpsError INVALID_COMMAND_STATE` ("registerNegativeResultUnit creates initial revision only; use transitionNegativeResultRecordState for later revisions") |

**No pre-persist withdrawal option.** Unlike `registerEvidenceUnit`’s optional `options.transition`, Sprint 024 does **not** offer withdrawing before first persist (OQ-024-005 CLOSED: issuance is already the gated edge; withdrawal is post-persist only).

### 13.3 Output — `RegisterNegativeResultUnitResult`

`{ negativeResult: NegativeResult, unit: CanonicalUnit, entity: PersistenceEntity }` — `entity.revision_id === "rev:initial"`, no `predecessor_revision_id`, `storage_key === persist:CanonicalUnit:NegativeResultUnit:{id}:rev:initial`, `record_state === "registered"`, NRTE log length ≥ 1.

### 13.4 Duplicate creation

Second `registerNegativeResultUnit` for the same `negative_result_id` → Persistence `ALREADY_EXISTS` from `repository.create`; head untouched (already at `rev:initial`).

---

## 14. Post-Persist Transition Flow

**FACT:** Post-persist transition **exists** in Core (`NegativeResultTransitionService.transition`). SPEC-024 **includes** it.

### 14.1 Normative sequence — `transitionNegativeResultRecordState`

```
assertRevisionId(input.revision_id); assertRevisionId(input.expected_head_revision_id)
input.revision_id === "rev:initial"              → OpsError INVALID_COMMAND_STATE
input.revision_id === expected_head_revision_id  → OpsError INVALID_COMMAND_STATE
  → priorEntity = getNegativeResultUnit(identity)   // head-resolved get(..., { unit_kind: "NegativeResultUnit" })
  → prior = negativeResultFromNegativeResultUnitPayload(priorEntity.payload)
  → next  = negativeResultTransitions.transition(prior, input.transition)  // Core — may throw
  → unit  = CanonicalEncoder.assemble(next)
  → entity = entityFromCanonicalUnit(unit, { revision_id, predecessor_revision_id: expected_head_revision_id })
  → stored = repository.create(entity)
  → head   = repository.advanceHead(identity, "NegativeResultUnit", expected_head_revision_id, revision_id)
  → if append_event: repository.appendEvent(...)   // §17
  → return { negativeResult: next, unit, entity: stored, head_revision_id: head.content_version }
```

### 14.2 Input — `TransitionNegativeResultRecordStateInput`

| Field | Required | Meaning |
|-------|----------|---------|
| `identity` | Yes | `negative_result_id` |
| `transition` | Yes | Core `NegativeResultRecordTransitionInput` (§7.2); certified path: `to: "withdrawn"` |
| `revision_id` | Yes | new caller-supplied `rev:…`; ≠ `rev:initial`; ≠ `expected_head_revision_id` |
| `expected_head_revision_id` | Yes | expected current head; becomes `predecessor_revision_id` |
| `append_event` | No | default `false` (§17) |

### 14.3 Decode contract — `negativeResultFromNegativeResultUnitPayload`

| Class | Fields | Source |
|-------|--------|--------|
| Reconstruct from `envelope.content` | `negative_result_id`, `negative_result_version`, `record_state` (must be in `NEGATIVE_RESULT_RECORD_STATES`), `summary`, `description`, `expected_observation`, `observed_absence`, `scope`, `protocol_ref`, `sensitivity_context`, `provenance`, `ethics_constraint_marker: "non_clinical"`, `created_by`, `created_at`, `withdrawal_reason?` | content |
| Reconstruct from envelope | `ontology_ref`, `spec_ref`; `claim_refs` = refs role `qualifies_or_challenges` (omit when empty); `evidence_refs` = `cites_evidence`; `contradiction_refs` = `related_contradiction`; `verification_refs` = `related_verification`; `record_transition_log` = events with `to_state ∈ NEGATIVE_RESULT_RECORD_STATES` mapped to NRTE (`from_state` `"null"` when absent/`"null"`/invalid) | references / events |
| **Not reconstructible (lossy)** | `ai_assisted`, `human_sponsor` | not in ENC content — OQ-024-001 |
| Exclude | Persistence / OPS metadata | never enters Core object |

Guards (all `OpsError INVALID_COMMAND_STATE`): payload not an object; `envelope.unit_kind !== "NegativeResultUnit"`; `intact !== true`; `record_state` invalid.

The decode helper is a **projection**, not a second Core API; the Negative Result returned by Core `transition` is authoritative for the new revision.

### 14.4 Conflict / duplicate / partial write

| Condition | Behaviour |
|-----------|-----------|
| Stale head | `advanceHead` → Persistence `CONFLICT`; prior head retained |
| Duplicate `revision_id` | `create` → Persistence `ALREADY_EXISTS`; head unchanged |
| `create` succeeds, `advanceHead` fails | **partial write**: orphan revision row may exist; head unchanged; not a scientific commit |
| Predecessor existence check at `create` | **not** performed (inherited O-020-01 deferral) |
| Terminal re-transition | Core `F_TRANSITION` before any create |

---

## 15. Error Semantics

Propagate lower-layer errors unchanged (`OpsError` only for OPS command misuse / decode failure).

| Condition | Error (existing) |
|-----------|------------------|
| Invalid id / pins / empty mandatory content / provenance | Core `NegativeResultValidationError` `F1` / `F2` / `F3` |
| Forbidden / invalid Record State | Core `F4` |
| Non-human registration or withdrawal | Core `F5` |
| Missing Human registered NRTE in lineage (NRR-1) | Core `F6` |
| Missing `withdrawal_reason` on withdraw | Core `F7` |
| Bad reference arrays | Core `F8` |
| `ai_assisted` without `human_sponsor` | Core `F_AI` |
| Illegal edge / empty decision_ref·reason / bad NRTE | Core `F_TRANSITION` |
| Ethics marker not `non_clinical` | Core `F11` |
| ENC assemble failure (bad Verification id grammar, pins, foreign embed) | `CanonicalEncodingError` (propagate) |
| Invalid revision grammar | Persistence `INVALID_ID` |
| `revision_id === rev:initial` on transition; `revision_id === expected_head`; non-initial register revision | OPS `OpsError INVALID_COMMAND_STATE` |
| Not found | Persistence `NOT_FOUND` |
| Duplicate identity / revision | Persistence `ALREADY_EXISTS` |
| Stale head CAS | Persistence `CONFLICT` |
| Mutate immutable revision | Persistence `IMMUTABLE_ENTITY` |
| Malformed / non-intact / wrong-kind payload at decode | OPS `OpsError INVALID_COMMAND_STATE` |

**Ordering:** Core and ENC failures occur **before** any `create` → nothing persisted, head unchanged.

No new error codes, classes, or categories.

---

## 16. Membership Semantics

- `SessionMemberRef` / `WorkspaceMemberRef` already carry `{ entity_kind, unit_kind?, identity }`. A Negative Result member is `{ entity_kind: "CanonicalUnit", unit_kind: "NegativeResultUnit", identity: negative_result_id }`. **No type change.**
- `registerMember` / `registerWorkspaceMember` are explicit caller actions; create/transition **SHALL NOT** alter membership.
- Membership is organizational only — **not** `claim_refs` / scientific provenance / revision lineage.
- Transition does not change membership (same identity; new revision).

---

## 17. Operational Events

### 17.1 Scientific history

NRTE on the Negative Result / `NegativeResultUnit` envelope events is the **scientific** transition history. Authoritative.

### 17.2 Optional operational citation (post-persist transition only)

When `append_event === true`, **after** successful `advanceHead`:

| Field | Normative value |
|-------|-----------------|
| `event_type` | `ops.negative_result_record_state_revision` |
| `parent_identity` | `negative_result_id` |
| `event_id` | `ops:{transition.event_id}` when supplied; else `ops:negative_result_record_state:{identity}:{revision_id}` — deterministic in both branches; certified paths SHALL supply `transition.event_id` |
| `payload` | `{ revision_id, predecessor_revision_id, unit_kind: "NegativeResultUnit", to_record_state }` |
| `ordinal` | `0` (store assigns journal order) |

| Rule | Statement |
|------|-----------|
| Create-once event | **None** emitted by `registerNegativeResultUnit` |
| Authority | operational only; non-authoritative if disagreeing with entity metadata |
| Journal | sole Persistence journal — no second journal |
| Failure after head success | does not roll back revision or head |
| Meaning | "OPS recorded a Negative Result Record State revision at `revision_id`" — not the scientific withdrawal itself (that is the NRTE) |

---

## 18. Snapshot Semantics

Frozen shapes **SHALL NOT** change:

```
ResearchSnapshot  = { research_session_id, member_refs, persistence_snapshot }
WorkspaceSnapshot = { research_workspace_id, member_refs, bound_session_ids, persistence_snapshot }
```

Negative Result participates **additively** through `persistence_snapshot.entities` (`NegativeResultUnit` revision rows + `RevisionHead`) and optional `ops.*` journal citations. No NR-specific snapshot field. `timeline(session)` projects journal events for member identities once registered as a member.

---

## 19. Export Semantics

| API *(new — Sprint 024)* | Behaviour |
|--------------------------|-----------|
| `exportNegativeResultUnit(identity)` | SER-JSON of head-resolved `NegativeResultUnit` payload |
| `exportNegativeResultUnitRevision(identity, revision_id)` | SER-JSON of a specific revision payload |

Rules: payload only (no OPS/Persistence metadata injected); lower-layer errors propagate; no new SER profile; `getNegativeResultLineage` returns `{ revision_id, predecessor_revision_id?, content_version, storage_key }[]` sorted by `revision_id`.

---

## 20. ENC / Processor Boundary

| Concern | Sprint 024 rule |
|---------|-----------------|
| `buildNegativeResult` | **Unchanged** |
| ENC content set | **Unchanged** — `ai_assisted` / `human_sponsor` remain absent |
| `REF-CANON-*` | **Unchanged** (SCI frozen) |
| `CanonicalEncoder.assemble` | reused; registry already returns `NegativeResultUnit` |
| SER-JSON | reuse existing encode path |
| Processor | **Unchanged**; OPS does not route through Processor stages |
| Lossiness | accepted per SPEC-021 / SPEC-023 precedent |

**Gate analysis:** every registration and withdrawal edge is Human-gated independently of `ai_assisted`. Reconstructing without AI markers does not bypass Core gates on the Sprint 024 path.

**Prerequisite check:** ENC / SER / Processor Negative Result support is **sufficient**. No missing dependency expands scope.

---

## 21. Reference Test Requirements

Do **not** implement in this SPEC. EXEC-024 SHALL add **additive** fixtures starting at **`REF-OPS-106`** (next free id at baseline; existing fixtures SHALL NOT be renumbered or edited). `authorities: ["OPS-001"]` (plus `SCI-005` / `ENC-001` where asserting Core/ENC through OPS). Themes (normative; exact id-to-theme mapping at EXEC):

| # | Theme | Must prove |
|---|-------|------------|
| T-01 | Create-once registered NR | `createRegistered` → `NegativeResultUnit` `rev:initial`; head `rev:initial`; `record_state: "registered"`; ≥1 Human NRTE `null→registered`; content fields present |
| T-02 | Canonicalization | `unit.intact === true`; envelope kind/identity/`content_version`; SER-JSON export deterministic |
| T-03 | Human gate at create | non-`human:` `authority_agent` → Core `F5`; empty `decision_ref` → `F_TRANSITION`; **nothing persisted**, no head |
| T-04 | Core validation at create | bad id → `F1`; empty protocol → `F2`; expected_observation `none` → `F2`; bad Claim id in `claim_refs` → `F8`; nothing persisted |
| T-05 | Duplicate create | second register same id → `ALREADY_EXISTS`; head unchanged |
| T-06 | Register with non-initial `revision_id` | `OpsError INVALID_COMMAND_STATE` |
| T-07 | Post-persist withdraw (Human) | `registered → withdrawn` with `withdrawal_reason`, `decision_ref`, `nrte:` id → new revision; `predecessor_revision_id === "rev:initial"`; head advanced; NRTE appended; `negative_result_version` unchanged |
| T-08 | AI withdrawal rejected | non-`human:` agent → Core `F5`; no revision row; head unchanged |
| T-09 | Missing `withdrawal_reason` | Core `F7`; nothing persisted |
| T-10 | Terminal re-transition | `withdrawn → registered` (or any) → `F_TRANSITION`; nothing persisted |
| T-11 | Stale head CAS | second successor from stale expected head → `CONFLICT`; prior head retained; orphan row semantics documented |
| T-12 | Duplicate `revision_id` | `ALREADY_EXISTS`; head unchanged |
| T-13 | `Claim.qualified_by` coexistence | `registerClaimUnit` with `qualified_by: [NR]` and `registerNegativeResultUnit(NR)` (either order) → both heads independent; Claim payload unchanged by NR ops; no auto-sync |
| T-14 | Contradiction ref coexistence | NR with `contradiction_refs` citing OPS-persisted Contradiction (and/or absent Contradiction) still registers; grammar-only |
| T-15 | Referenced Claims absent | NR with `claim_refs` not in Persistence still registers |
| T-16 | Invalid revision grammar | `rev:initial` as transition revision; `revision_id === expected_head` → `OpsError`; malformed → `INVALID_ID` |
| T-17 | Immutability | prior `rev:initial` payload unchanged after withdraw; export of `rev:initial` unchanged |
| T-18 | Lineage | `getNegativeResultLineage` lists both revisions; predecessor chain correct |
| T-19 | Decode round-trip | reconstruct content + refs + NRTE; re-`assemble` yields identical envelope content/references/events (modulo known AI-marker lossiness) |
| T-20 | Membership | explicit `registerMember({ entity_kind: "CanonicalUnit", unit_kind: "NegativeResultUnit", identity })`; create/transition do not alter membership |
| T-21 | Snapshots | ResearchSnapshot / WorkspaceSnapshot shapes unchanged; persistence_snapshot contains both revisions + head |
| T-22 | Operational event | `append_event: true` → single `ops.negative_result_record_state_revision` with deterministic `ops:{nrte id}`; default emits nothing of that type |
| T-23 | Persistence.Relationship non-use | no `Relationship` entity created by any NR operation |
| T-24 | Regression | `REF-OPS-001…105` unchanged and green; SCI 44/44 |

### Corpus impact (expected)

| Corpus | Impact |
|--------|--------|
| SCI | **Unchanged** 44/44 — no SCI fixture edits |
| OPS | additive from 105 |
| FULL | SCI ∪ OPS |

Deterministic identifiers in fixtures: `negative_result_id`, Claim/Evidence/Contradiction ids, `revision_id`, `expected_head_revision_id`, NRTE `event_id`, `at`, agents, `decision_ref`, `withdrawal_reason`, registration/transition fields.

---

## 22. Conformance

| Item | Sprint 024 stance |
|------|-------------------|
| `CONF-001@1.0.0` (SCI) | **Unchanged** |
| `CONF-001@1.1.0-OPS` | **Unchanged** — `REF-OPS-` prefix and `OPS-001` authority already recognized; `SCI-005` already in SCI authorities |
| New profile / profile extension | **Not required** |
| New authority | **Not required** |
| ConformanceEngine | **ONE**; no redesign |
| Minimum additive OPS requirements | fixtures for create-once Human-gated registration, post-persist withdraw, Model C head/CAS, decode, export, membership/snapshot non-interference, Relationship non-use, Claim `qualified_by` coexistence |

CONF source is **not modified** by this SPEC or by EXEC-024.

---

## 23. Certification

| Item | Sprint 024 stance |
|------|-------------------|
| CertificationEngine | **ONE**; no redesign |
| Evidence required (future cert gate) | Additive REF-OPS PASS; FULL corpus PASS; CONF-001@1.0.0 COMPLIANT; CONF-001@1.1.0-OPS COMPLIANT; typecheck/lint/build; TEST/SMOKE for Sprint 024; prior SMOKE/TEST 016…023 untouched; determinism |
| Artifacts | produced only by a future authorized certification step — **not** by this SPEC |

---

## 24. Security / Determinism

| Concern | Rule |
|---------|------|
| `negative_result_id`, `created_at`, `provenance.recorded_at` | caller-supplied |
| `revision_id`, `expected_head_revision_id` | caller-supplied |
| NRTE `event_id`, `at`, `authority_agent`, `reason`, `decision_ref`, `withdrawal_reason` | caller-supplied; `event_id` **REQUIRED** on all certified OPS/REF paths |
| Operational `event_id` | derived deterministically (§17) |
| Export / snapshot / lineage ordering | existing deterministic Persistence + SER rules |
| Forbidden on OPS paths | `randomUUID`, `Date.now`, `Math.random`, wall-clock minting |

**Inherited Core fallback (documented; not changed):** `NegativeResultEventBuilder.build` mints `nrte:` + `randomUUID()` when `event_id` is omitted. SPEC-024 requires callers to supply `event_id`; it does **not** authorize Core changes (same stance as SPEC-022/023).

Human gates are security-relevant scientific controls: OPS MUST NOT substitute AI agents, empty `decision_ref`, or skip `withdrawal_reason`.

---

## 25. Risks and Guards

| Risk | Guard |
|------|-------|
| Reference target availability | Grammar-only; no Persistence existence rule (§11.3) |
| Core/OPS semantic drift | OPS delegates exclusively to Core factory/transition; no OPS vocabulary |
| Human-gate bypass | Required `registration` / transition through Core gates; REF themes T-03/T-08 |
| Model C CAS conflicts | Documented `CONFLICT` + partial-write honesty (§9, §14.4) |
| Partial writes | Honest orphan semantics; no fake rollback |
| Duplicate scientific authority | Forbidden — Core only |
| Relationship graph duplication | `Persistence.Relationship` forbidden (§11.2); T-23 |
| Event/scientific provenance confusion | NRTE authoritative; `ops.*` citation optional and non-authoritative (§17) |
| Serialization mismatch | Reuse SER-JSON; no new profile |
| Deterministic identity problems | Caller-supplied ids; forbid RNG on OPS paths (§24) |
| Core/ENC `verification_refs` asymmetry | Documented; fixtures use `verification:` grammar or omit (§11.4) |
| Generic lifecycle temptation | Explicit per-unit methods only; rejected (§27) |
| Claim `qualified_by` reverse sync | Forbidden; coexistence without sync (§11.5) |

No risk is solved by adding infrastructure.

---

## 26. Open Questions

| ID | Question | Why it matters | Blocks architecture audit? | Blocks implementation? | Resolution |
|----|----------|----------------|----------------------------|------------------------|------------|
| **OQ-024-001** | `NegativeResultUnit` content omits `ai_assisted` / `human_sponsor` (same as Contradiction) | Decode lossy for authorship markers | **No** — gates independent of markers | **No** | **DEFERRED** — ENC/SCI discovery (inherits OQ-023-002); Sprint 024 SHALL NOT change ENC |
| **OQ-024-002** | Should OPS require referenced entities to exist before NR create? | Would invent Persistence-level scientific admissibility | No | No | **CLOSED** — grammar-only; T-14/T-15 |
| **OQ-024-003** | Core opaque `verification_refs` vs ENC `verification:` grammar | Assemble can fail after Core accept | No — document asymmetry | No — fixtures use grammar or omit | **CLOSED for Sprint 024** — document only; Core/ENC redesign out of scope |
| **OQ-024-004** | Expose `NegativeResultVersionService` as OPS material-content path? | Cross-cutting deferred theme (020–023) | No | No | **CLOSED** — non-goal for 024 |
| **OQ-024-005** | Offer pre-persist withdrawal on `registerNegativeResultUnit`? | Evidence has optional pre-persist transition; NR issuance is already gated | No | No | **CLOSED** — not offered; withdrawal is post-persist only |
| **OQ-024-006** | Operational event type naming | Journal consistency | No | No | **CLOSED** — `ops.negative_result_record_state_revision`, transition only, optional |
| **OQ-024-007** | Claim Standing post-create `qualified_by` setter | Soft Claim↔NR linkage asymmetry | No (Core SCI-001) | No (out of scope) | **DEFERRED** — Core redesign; not Sprint 024 |

**No open question blocks architecture audit.**

---

## 27. Explicit Non-Goals

Sprint 024 **SHALL NOT**:

- Verification OPS
- Claim Standing redesign / post-create `qualified_by` / `verified_via`
- Negative Result material content OPS (`NegativeResultVersionService`)
- New Negative Result states, vocabulary, or gates
- ENC content changes (including AI markers)
- SCI fixture / `REF-CANON` edits
- CONF/CERT engine or profile changes
- `Persistence.Relationship` as scientific storage
- Second event journal / second scientific graph
- Generic lifecycle / `postPersistTransition()`
- Literature / DocumentArtifact / DOI-PMID typed model
- Provenance packaging subsystem
- Knowledge Graph / Neo4j
- Search / OpenSearch / vector DB
- Computational biology entities or pipelines
- Python / Nextflow
- PostgreSQL / object storage / durable Workspace
- Distributed workers / queues / multi-user concurrency
- AI proposal layer / LLM / RAG as authority
- Frontend / public API / FHIR / external ingestion
- Processor redesign

---

## 28. Implementation Boundary

### Already existing and reusable

- Core: `NegativeResultFactory`, `NegativeResultTransitionService`, `NegativeResultValidator`, `NegativeResultReferenceValidator`, `NegativeResultEventBuilder`, types/identifiers/errors
- ENC: `buildNegativeResult` / `NegativeResultUnit` assemble + integrity
- SER-JSON: `NegativeResultUnit` registration
- Persistence Model C: create / head / CAS / journal / snapshot; `NegativeResultUnit → CanonicalUnit` kind map
- OPS patterns: Claim / Evidence / Grade / Contradiction create + post-persist + decode + export
- REF → CONF → CERT pipeline; `CONF-001@1.1.0-OPS`

### Required changes for Sprint 024

- `apps/reference-app`: `registerNegativeResultUnit`, `transitionNegativeResultRecordState`, decode helper, get/lineage/export helpers, deps wiring, exports, marker sprint `24`
- Additive `REF-OPS-106+` fixtures + TEST/SMOKE scripts for Sprint 024
- EXEC report / IMPLEMENTATION.md updates (authorized exec phase only)
- Later: certification artifacts (authorized cert phase only)

### Explicitly out of scope

Everything in §27; Core/ENC/SER/Persistence/Processor/CONF/CERT source modifications.

---

## 29. Audit Readiness

| Gate | State |
|------|-------|
| Actual Core semantics verified | YES (§6–§8) |
| Post-persist transition exists in Core | YES — `NegativeResultTransitionService.transition` |
| Unsupported assumptions introduced | NONE |
| Model C preserved | YES (§9) |
| Scientific authority remains in Core | YES (§5) |
| No second graph / journal | YES (§11, §17) |
| Scope closed | YES (§4, §27) |
| Open questions explicit | YES (§26) |
| Implementation boundary clear | YES (§28) |
| Generic lifecycle engine | REJECTED |
| Blockers | **NONE** |
| Implementation authorization | **NO** |

**Next authorized step (when separately commanded):** ARCHITECTURE-AUDIT-024 → IMPLEMENTATION-DECISION-024 → FINAL-ARCHITECTURE-RE-AUDIT-024 → only then EXEC-024.

---

## Final Status

**SPEC-024 — READY FOR ARCHITECTURE AUDIT**

SPEC-024 FINAL VERDICT
======================

Negative Result scientific authority:
Scientific Core (SCI-005) solely owns Negative Result meaning, Record State vocabulary (`registered`/`withdrawn`), Human Reviewer gates at registration and withdrawal, `withdrawal_reason` rules, and reference admissibility. OPS orchestrates only.

OPS operations:
`registerNegativeResultUnit` — `NegativeResultFactory.createRegistered(input, registration)` → ENC `NegativeResultUnit` → `Persistence.create` (`rev:initial`) → `ensureInitialHead`.
`transitionNegativeResultRecordState` — head-resolved decode → `NegativeResultTransitionService.transition` → ENC → `Persistence.create` (successor) → `advanceHead` CAS → optional `ops.negative_result_record_state_revision`.

Model C:
Reused unchanged — stable `negative_result_id`; immutable revisions; `predecessor_revision_id`; `RevisionHead` for `unit_kind = "NegativeResultUnit"`; CAS; partial-write honesty identical to SPEC-020…023.

References:
`claim_refs` / `evidence_refs` / `contradiction_refs` / `verification_refs` are Core fields carried in the `NegativeResultUnit` envelope only; never dereferenced; `Persistence.Relationship` forbidden as scientific storage.

Claim.qualified_by:
Unchanged Core semantics (creation-only); Negative Result identity becomes persistable; no reverse synchronization; independent edges; no second graph.

ENC / SER / Persistence / CONF / CERT changes:
NONE

New scientific authority / graph / journal:
NONE

Generic lifecycle:
NOT JUSTIFIED

Deferred architecture questions:
OQ-024-001 (ENC AI-marker canonical content) · OQ-024-007 (Claim Standing `qualified_by` Core setter)

Blockers:
NONE

Execution gate:
READY FOR ARCHITECTURE AUDIT

Implementation authorization:
NO

*End SPEC-024 — design only. No implementation. No commit. No push.*

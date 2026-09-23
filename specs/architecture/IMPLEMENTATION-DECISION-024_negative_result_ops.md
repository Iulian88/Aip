# IMPLEMENTATION-DECISION-024 — Negative Result OPS Under Model C

| Field | Value |
|-------|-------|
| Decision ID | IMPLEMENTATION-DECISION-024 |
| Title | Negative Result OPS — Implementation Contract |
| Version | **0.1.0** |
| Status | **IMPLEMENTATION-READY — PENDING FINAL ARCHITECTURE RE-AUDIT** |
| Baseline | `207365fb260b9e334bb60f16252ab3f445411dd6` |
| SPEC | SPEC-024 (DRAFT — audited) |
| Architecture audit | ARCHITECTURE-AUDIT-024 — **APPROVED WITH OBSERVATIONS** (0 blockers · 0 required patches · 6 observations) |
| Discovery | DISCOVERY-024 — READY FOR SPEC-024 |
| Mode | Design-only — **NO RUNTIME IMPLEMENTATION** |
| Does not authorize | EXEC-024 coding, tests, fixtures, certification, commit, or push |

---

## 1. Status

**IMPLEMENTATION-READY — PENDING FINAL ARCHITECTURE RE-AUDIT**

All required Sprint 024 implementation choices are closed from SPEC-024 + ARCHITECTURE-AUDIT-024 + actual repository APIs.  
This document does **not** authorize EXEC. Next gate: FINAL-ARCHITECTURE-RE-AUDIT-024.

---

## 2. Baseline

| Item | Value |
|------|-------|
| Certified HEAD / origin/main | `207365fb260b9e334bb60f16252ab3f445411dd6` |
| Sprint 023 | FORMALLY CERTIFIED AND CLOSED — Contradiction OPS under Model C |
| SCI / OPS / FULL | **44/44 · 105/105 · 149/149** (verified) |
| Profiles | SCI `CONF-001@1.0.0` · OPS `CONF-001@1.1.0-OPS` |
| Highest OPS fixture today | `REF-OPS-105` → next free additive id **`REF-OPS-106`** |
| Architecture audit | 0 blockers · 0 required patches · READY FOR IMPLEMENTATION DECISION |

Working tree may contain documentation-only untracked files (DISCOVERY-024, SPEC-024, ARCHITECTURE-AUDIT-024, this decision). Those do not alter the certified runtime baseline.

### Frozen contracts (must not be redesigned)

- Scientific Core SCI-005 Negative Result semantics (states, gates, refs, F\* codes)
- Claim Standing / Evidence Record State / Evidence Grade / Contradiction Record State
- ENC / SER architectures (including `NegativeResultUnit` content as certified)
- Persistence Model C addressing and CAS
- ResearchSnapshot (016) / WorkspaceSnapshot (018)
- Single Persistence event journal
- Single ConformanceEngine / CertificationEngine
- Profile ids listed above

**Conflict check:** No conflict between SPEC-024 and certified implementation. Core already exposes `createRegistered` and `transition`. Persistence already maps `NegativeResultUnit → CanonicalUnit`. ENC/SER already assemble/encode `NegativeResultUnit`. No silent invention required. No SPEC patch required before FINAL RE-AUDIT.

Process sequence:

```
DISCOVERY-024
  → SPEC-024
  → ARCHITECTURE-AUDIT-024 (APPROVED WITH OBSERVATIONS)
  → IMPLEMENTATION-DECISION-024 (this document)
  → FINAL-ARCHITECTURE-RE-AUDIT-024
  → EXEC-024 (only if separately authorized)
  → CODE-AUDIT-024
  → FORMAL-CERTIFICATION-024
  → FINAL GIT CLOSURE
```

---

## 3. Scope

Sprint 024 EXEC (when separately authorized) is **ONLY**:

| Letter | Capability |
|--------|------------|
| A | Negative Result creation OPS (`registerNegativeResultUnit`) via Core `createRegistered` |
| B | Negative Result post-persist Record State OPS (`transitionNegativeResultRecordState`) via Core `transition` (`registered → withdrawn`) |
| C | Model C immutable revisions for `NegativeResultUnit` |
| D | RevisionHead init / advance (`ensureInitialHead` / `advanceHead`) |
| E | Canonicalization through **existing** ENC (`CanonicalEncoder.assemble`) |
| F | `Persistence.create` (existing) |
| G | OPS membership (existing `registerMember` / `registerWorkspaceMember` — **caller-explicit**) |
| H | Existing ResearchSnapshot / WorkspaceSnapshot (additive Persistence content only) |
| I | Existing export (`JsonEncoder.encode` of NegativeResultUnit payload) |
| J | Optional operational event (`ops.negative_result_record_state_revision`) |
| K | Additive Reference Tests (`REF-OPS-106+`) |
| L | Existing CONF/CERT integration (no profile/engine change) |
| M | OPS-local decode helper `negativeResultFromNegativeResultUnitPayload` |
| N | Get / lineage helpers mirroring Contradiction |

**No other scientific unit may be extended** (no Verification OPS, Claim Standing redesign, Grade/Evidence/Contradiction changes, material VersionService OPS).

---

## 4. Architecture-Audit Observation Disposition

| ID | Meaning (from ARCHITECTURE-AUDIT-024) | Decision | Disposition |
|----|----------------------------------------|----------|-------------|
| **O-024-01** | `queryRelationships` may return CanonicalUnit rows with mirrored envelope refs; T-23 must not assert “queryRelationships empty” | Fixtures proving no scientific Relationship store **SHALL** use `list({ filter: { entity_kind: "Relationship" } }).total === 0` (parity REF-OPS-102 / O-023-01) | **ABSORBED** — EXEC fixture discipline |
| **O-024-02** | Core `NegativeResultEventBuilder` mints `nrte:`+`randomUUID` when `event_id` omitted | Every Sprint 024 REF / TEST / smoke path **SHALL** supply caller `nrte:` `event_id` on registration and withdrawal; never rely on Core fallback | **ABSORBED** — determinism discipline |
| **O-024-03** | `entityFromCanonicalUnit` mirrors refs into `PersistenceEntity.references` (non-authoritative) | Ref assertions **SHALL** read ENC payload (`unit.envelope.references` roles) or decoded Core object — **not** `entity.references` | **ABSORBED** — fixture discipline |
| **O-024-04** | `ResearchOperationsDeps` gains two required fields; marker sprint → 24 | Only `createResearchOperations` wires full deps; `smoke-016` partial deps never call NR methods; marker checks remain `>=`/`<`; source touch list limited (§3 / change budget) | **ABSORBED** — wiring / marker discipline |
| **O-024-05** | Create API is three-arg `(input, registration, options?)` — first OPS create requiring Core transition input at issuance | All call sites / helpers / smoke **SHALL** pass Human `registration` with `to: "registered"`, non-empty `decision_ref` / `reason` / `at`, and `event_id` | **ABSORBED** — API contract pinned §6 |
| **O-024-06** | SPEC detection prose is abbreviated; exact registry requires `"negative_result_id" in o && "expected_observation" in o` | EXEC cites exact `CanonicalEncodingRegistry.detectKind` predicate; **no ENC change** | **ABSORBED** — documentation/exec discipline; not a SPEC patch |

No observation is deferred as unresolved for EXEC. No observation expands scope.

Deferred (from audit, **not** EXEC work): D-024-01 ENC AI markers · D-024-02 Claim Standing `qualified_by` · D-024-03 material VersionService OPS · O-020-01 predecessor existence check.

---

## 5. Core Authority Decisions

| Authority | Exact name (source) | Role |
|-----------|---------------------|------|
| Creation | `NegativeResultFactory.createRegistered(input, registration)` | Sole issuance; requires `registration.to === "registered"` |
| Issuance transition (internal) | `NegativeResultTransitionService.register(content, registration)` | Builds NRTE `null→registered`; called by factory |
| Post-persist transition | `NegativeResultTransitionService.transition(nr, input)` | Sole `registered → withdrawn` |
| State vocabulary | `NEGATIVE_RESULT_RECORD_STATES` = `["registered","withdrawn"]` | Core-owned; OPS must not redefine |
| Validator | `NegativeResultValidator.validate` | Structural / NRR-1 / F\* codes |
| Reference grammar | `NegativeResultReferenceValidator` | claim/evidence/contradiction/verification refs |
| Human gate | `NegativeResultTransitionService.assertHumanReviewerGate` + `NegativeResultEventBuilder.build` | `F5` / `decision_ref` / `withdrawal_reason` `F7` |
| NRTE builder | `NegativeResultEventBuilder` | `nrte:` grammar; UUID fallback **out of certified path** |
| Material version | `NegativeResultVersionService` | **NOT called by OPS in Sprint 024** |

OPS **SHALL NOT** reimplement any of the above. All scientific validity comes from Core throws (`NegativeResultValidationError`).

---

## 6. Creation Contract

### 6.1 Method

```
ResearchOperations.registerNegativeResultUnit(
  input: CreateNegativeResultInput,
  registration: NegativeResultRecordTransitionInput,
  options?: RegisterNegativeResultUnitOptions,
): Promise<RegisterNegativeResultUnitResult>
```

`RegisterNegativeResultUnitOptions = { revision_id?: string }` — default `rev:initial`.

### 6.2 Normative sequence

```
1. revision_id = options?.revision_id ?? INITIAL_REVISION_ID
2. assertRevisionId(revision_id)
3. if revision_id !== rev:initial → OpsError INVALID_COMMAND_STATE
     ("registerNegativeResultUnit creates initial revision only;
       use transitionNegativeResultRecordState for later revisions")
4. negativeResult = negativeResultFactory.createRegistered(input, registration)
     // Core Human gate + validate — may throw NegativeResultValidationError
5. unit = await encoder.assemble(negativeResult)
     // detectKind: negative_result_id ∧ expected_observation → NegativeResultUnit
6. entity = entityFromCanonicalUnit(unit, { revision_id: "rev:initial" })
     // no predecessor_revision_id
7. stored = await repository.create(entity)
8. await repository.ensureInitialHead(
     negativeResult.negative_result_id,
     "NegativeResultUnit",
     "rev:initial",
   )
9. return { negativeResult, unit, entity: stored }
```

### 6.3 Explicit non-steps

| Step | Decision |
|------|----------|
| Operational event on create | **NONE** (Claim/Evidence/Contradiction parity) |
| Automatic membership | **NONE** — caller uses `registerMember` / `registerWorkspaceMember` |
| Pre-persist withdrawal (`options.transition`) | **NOT OFFERED** (OQ-024-005 CLOSED) |
| Snapshot production | **NONE** inside create |

### 6.4 Registration input requirements (O-024-05)

Certified / REF / smoke paths **SHALL** supply:

| Field | Value |
|-------|-------|
| `to` | `"registered"` |
| `authority_agent` | `human:…` |
| `reason` | non-empty |
| `decision_ref` | non-empty |
| `at` | UTC second |
| `event_id` | `nrte:…` (O-024-02) |

### 6.5 Output

`{ negativeResult, unit, entity }` with `record_state === "registered"`, `entity.revision_id === "rev:initial"`, head at `rev:initial`, NRTE log length ≥ 1.

### 6.6 Duplicate

Second create same `negative_result_id` → Persistence `ALREADY_EXISTS`; head untouched.

---

## 7. Post-Persist Transition Contract

### Decision (unambiguous)

**YES — POST-PERSIST NEGATIVE RESULT TRANSITION IS IN SCOPE FOR SPRINT 024.**

Core supports `registered → withdrawn` via `NegativeResultTransitionService.transition`. SPEC-024 includes it. This decision does **not** invent a transition.

### 7.1 Method

```
ResearchOperations.transitionNegativeResultRecordState(
  input: TransitionNegativeResultRecordStateInput,
): Promise<TransitionNegativeResultRecordStateResult>
```

| Field | Required |
|-------|----------|
| `identity` | Yes — `negative_result_id` |
| `transition` | Yes — Core `NegativeResultRecordTransitionInput` |
| `revision_id` | Yes — new `rev:…` ≠ `rev:initial` ≠ `expected_head_revision_id` |
| `expected_head_revision_id` | Yes — current head; becomes predecessor |
| `append_event` | No — default `false` |

### 7.2 Normative sequence

```
1. assertRevisionId(revision_id); assertRevisionId(expected_head_revision_id)
2. if revision_id === rev:initial → OpsError INVALID_COMMAND_STATE
3. if revision_id === expected_head_revision_id → OpsError INVALID_COMMAND_STATE
4. priorEntity = await getNegativeResultUnit(identity)
5. prior = negativeResultFromNegativeResultUnitPayload(priorEntity.payload)
6. next = negativeResultTransitions.transition(prior, input.transition)
     // Core — may throw (F5 / F7 / F_TRANSITION / …)
7. unit = await encoder.assemble(next)
8. entity = entityFromCanonicalUnit(unit, {
     revision_id,
     predecessor_revision_id: expected_head_revision_id,
   })
9. stored = await repository.create(entity)
10. head = await repository.advanceHead(
      identity, "NegativeResultUnit",
      expected_head_revision_id, revision_id,
    )  // stale → CONFLICT
11. if append_event === true → repository.appendEvent(...)  // §15
12. return { negativeResult: next, unit, entity: stored, head_revision_id: head.content_version }
```

### 7.3 Certified transition path

`to: "withdrawn"` with Human agent, `decision_ref`, non-empty `withdrawal_reason`, caller `nrte:` `event_id`.

Illegal / terminal re-transition → Core `F_TRANSITION` **before** any `create`.

---

## 8. Persistence Key Contract

| Element | Exact value |
|---------|-------------|
| Revision storage key | `persist:CanonicalUnit:NegativeResultUnit:{negative_result_id}:{revision_id}` |
| Head storage key | `persist:RevisionHead:NegativeResultUnit:{negative_result_id}` |
| Scientific identity | `negative_result_id` (stable) |
| `revision_id` | Persistence metadata only — **≠** SemVer |

No alternate key format. No Persistence redesign.

Kind map (existing): `NegativeResultUnit → entity_kind "CanonicalUnit"` in `entityFromCanonicalUnit`.

---

## 9. Revision ID Contract

| Case | Value |
|------|-------|
| Initial | `rev:initial` (`INITIAL_REVISION_ID`) only |
| Later | Caller-supplied matching `/^rev:[A-Za-z0-9._~-]{1,128}$/` via `assertRevisionId` |
| Forbidden generators on certified paths | `Date.now`, `Math.random`, `randomUUID` |

Malformed → Persistence `INVALID_ID`. Non-initial on register → `OpsError INVALID_COMMAND_STATE`.

---

## 10. Lineage Contract

| Revision | `predecessor_revision_id` |
|----------|---------------------------|
| `rev:initial` | **absent** / `undefined` (must not be set — Persistence rejects predecessor on initial) |
| Successor | `= expected_head_revision_id` (prior head) |

Lineage is Persistence metadata. It is **not** scientific supersession and **not** a second scientific graph. SemVer `negative_result_version` is **unchanged** by Record State transition (Core).

---

## 11. RevisionHead / CAS Contract

| Operation | API |
|-----------|-----|
| Create | `ensureInitialHead(identity, "NegativeResultUnit", "rev:initial")` |
| Transition | `advanceHead(identity, "NegativeResultUnit", expected_head_revision_id, revision_id)` |
| Stale head | Persistence `CONFLICT` — **no** retry, overwrite, merge, or lock infrastructure |
| Prior revisions | Immutable |

Do not silently advance from a different expected head.

---

## 12. Partial-Write Contract

If `repository.create` succeeds and `advanceHead` fails (`CONFLICT`):

- successor revision row **MAY** remain (orphan)
- head **unchanged**
- operation reports `CONFLICT`
- **no** fake rollback / compensating delete
- **no** claim of transactional scientific atomicity

Inherited O-020-01: no predecessor-existence check at `create` — unchanged.

---

## 13. Reference Contract

| Field | Target | Where stored | Dereference? | Existence required? |
|-------|--------|--------------|--------------|---------------------|
| `claim_refs?` | Claim id grammar | Core field → ENC role `qualifies_or_challenges` | **NO** | **NO** |
| `evidence_refs?` | Evidence id | ENC `cites_evidence` | **NO** | **NO** |
| `contradiction_refs?` | Contradiction id | ENC `related_contradiction` | **NO** | **NO** (may cite OPS-persistable Contradiction after 023) |
| `verification_refs?` | Core: opaque non-empty; ENC: `verification:` grammar | ENC `related_verification` | **NO** | **NO** |

**Rules:**

- Scientific edge set = `NegativeResultUnit` envelope only (assert via ENC / decode — O-024-03).
- **NO** `Persistence.Relationship` writes (O-024-01).
- **NO** reverse-sync of `Claim.qualified_by`.
- Fixtures using `verification_refs` **SHALL** use `verification:…` ids (or omit field) so assemble succeeds (OQ-024-003 closed for Sprint 024).

---

## 14. Decode / Reconstruction Contract

### New file

`apps/reference-app/src/operations/negative-result-from-unit.ts`

```
negativeResultFromNegativeResultUnitPayload(payload: unknown): NegativeResult
```

| Responsibility | Rule |
|----------------|------|
| Input | Persistence entity payload (CanonicalUnit) |
| Output | Frozen Core `NegativeResult` projection |
| Authority | **Projection only** — not a second Core API |
| Validation | Structural `OpsError INVALID_COMMAND_STATE` for non-object / wrong `unit_kind` / `intact !== true` / invalid `record_state` |
| Content fields | From `envelope.content` per SPEC-024 §14.3 |
| Refs | By ENC roles (§13); omit empty arrays |
| NRTE log | From envelope events with `to_state ∈ NEGATIVE_RESULT_RECORD_STATES` |
| Lossy omit | `ai_assisted`, `human_sponsor` (ENC omission — D-024-01) |
| Post-transition authority | Core `transition` output is authoritative for the new revision |

Mirror `contradictionFromContradictionUnitPayload` structure. Do **not** route OPS through Processor stages (Processor NR path exists but unused by OPS — Claim/Evidence/Contradiction precedent).

---

## 15. Event Contract

### Scientific

NRTE on Core object / ENC events — **authoritative**.

### Operational (optional, post-persist only)

When `append_event === true` **after** successful `advanceHead`:

| Field | Value |
|-------|-------|
| `event_type` | `ops.negative_result_record_state_revision` |
| `parent_identity` | `negative_result_id` |
| `event_id` | Prefer `ops:{transition.event_id}`; else `ops:negative_result_record_state:{identity}:{revision_id}` |
| `payload` | `{ revision_id, predecessor_revision_id, unit_kind: "NegativeResultUnit", to_record_state }` |
| `ordinal` | `0` |

| Rule | Statement |
|------|-----------|
| Create-once event | **None** |
| Authority | Operational citation only |
| Journal | Sole Persistence journal — no second journal |
| Failure after head | Does not roll back revision/head |

---

## 16. Membership Contract

| Concern | Decision |
|---------|----------|
| Session | Existing `registerMember(session, ref)` |
| Workspace | Existing `registerWorkspaceMember` / bound-session upsert |
| Member ref | `{ entity_kind: "CanonicalUnit", unit_kind: "NegativeResultUnit", identity: negative_result_id }` |
| Auto-register on create/transition | **NO** |
| Scientific refs = membership? | **NO** |

No new membership semantics.

---

## 17. Snapshot Contract

| Snapshot | Decision |
|----------|----------|
| `ResearchSnapshot` | **Frozen** — shape unchanged |
| `WorkspaceSnapshot` | **Frozen** — shape unchanged |
| NR appearance | Additive only via `persistence_snapshot.entities` (rows + head) and optional journal citations |
| New snapshot fields | **NONE** |

---

## 18. Export Contract

| API | Path |
|-----|------|
| `exportNegativeResultUnit(identity)` | `getNegativeResultUnit` → `jsonEncoder.encode(entity.payload)` |
| `exportNegativeResultUnitRevision(identity, revision_id)` | `getNegativeResultUnitRevision` → encode |
| `getNegativeResultLineage(identity)` | `listRevisions` → `{ revision_id, predecessor_revision_id?, content_version, storage_key }[]` sorted by `revision_id` |

Reuse SER-JSON-001. No new export format. Payload only — no OPS/Persistence metadata injection.

---

## 19. Error Contract

Propagate lower-layer errors unchanged. `OpsError` **only** for OPS command misuse / decode failure.

| Condition | Error |
|-----------|-------|
| Core create/transition validation | `NegativeResultValidationError` (`F1`…`F8`, `F11`, `F_AI`, `F5`, `F6`, `F7`, `F_TRANSITION`, …) |
| ENC assemble (incl. bad Verification grammar) | `CanonicalEncodingError` |
| Bad revision grammar | Persistence `INVALID_ID` |
| Missing unit / revision / head | Persistence `NOT_FOUND` |
| Duplicate create / revision | Persistence `ALREADY_EXISTS` |
| Stale head CAS | Persistence `CONFLICT` |
| Immutable mutate | Persistence `IMMUTABLE_ENTITY` |
| OPS misuse / decode | `OpsError INVALID_COMMAND_STATE` |

**No new error categories.** Ordering: Core/ENC failures before any `create` → nothing persisted.

Why `OpsError` exists: command-state misuse (non-initial register revision; `rev:initial` on transition; equal revision/expected_head; decode structural failure) cannot be expressed as Core scientific validation or Persistence key errors.

---

## 20. Determinism Contract

| Concern | Rule |
|---------|------|
| Scientific identity | Caller-supplied `negresult:…` |
| Revision ids | Caller-supplied |
| NRTE `event_id` / `at` / agents / `decision_ref` / `withdrawal_reason` | Caller-supplied; `event_id` **required** on certified paths (O-024-02) |
| Ops event id | Deterministic derivation (§15) |
| Export / lineage / snapshots | Existing Persistence + SER ordering |
| Forbidden on certified paths | `randomUUID`, `Math.random`, `Date.now` for identity minting |
| Core UUID fallback | Outside certified path — EXEC must never omit `event_id` |

---

## 21. Reference Test Contract

| Item | Decision |
|------|----------|
| Last existing fixture | `REF-OPS-105` |
| First Sprint 024 fixture | **`REF-OPS-106`** |
| Range | Additive `REF-OPS-106+` — do not renumber or edit `001…105` |
| Authorities | `OPS-001` (+ `SCI-005` / `ENC-001` where asserting Core/ENC through OPS) |
| Exact terminal id | Fixed at EXEC from theme coverage (expect mid-20s–~30 fixtures; SPEC themes T-01…T-24) |

### Mandatory themes (map 1:1 to SPEC-024 §21)

Create-once registered · canonicalization · Human gate create (`F5` / empty `decision_ref`) · Core validation create · duplicate create · non-initial register `OpsError` · post-persist withdraw · AI withdraw rejected · missing `withdrawal_reason` · terminal re-transition · stale CAS · duplicate revision · Claim `qualified_by` coexistence · Contradiction ref coexistence · absent Claim refs · invalid revision grammar · immutability · lineage · decode round-trip · membership · snapshots · ops event · Relationship non-use (`entity_kind: "Relationship"` — O-024-01) · regression SCI 44/44 + OPS 001–105.

### Support helpers (ops-support)

Add minimal deterministic helpers, e.g.:

- `negativeResultInput(id, overrides?)` → `CreateNegativeResultInput`
- `negativeResultRegistration(overrides?)` → Human `NegativeResultRecordTransitionInput` with `to: "registered"` + `nrte:` `event_id` (O-024-05)

Prefer minimal additions; mirror `contradictionInput` style.

---

## 22. Test / Smoke Contract

Naming follows Sprint 022/023:

| Script | Purpose |
|--------|---------|
| `scripts/test-024-negative-result-ops.mjs` | Focused create / withdraw / CAS / decode / gate tests |
| `scripts/smoke-024-negative-result-ops.mjs` | End-to-end smoke; writes **only** `SMOKE_024_PASS` |

Do **not** overwrite `SMOKE_019`…`SMOKE_023_PASS`.

Do **not** create these scripts in this decision step.

---

## 23. Conformance Contract

| Item | Decision |
|------|----------|
| Profile | `CONF-001@1.1.0-OPS` — **unchanged** |
| SCI profile | `CONF-001@1.0.0` — **unchanged** |
| Engine | One `ConformanceEngine` — **no redesign** |
| Additive OPS | `REF-OPS-106+` under existing prefixes/authorities |
| SCI corpus | Remains 44/44 — no SCI fixture edits |
| FULL | SCI ∪ OPS (additive) |

---

## 24. Certification Contract

| Item | Decision |
|------|----------|
| Engine | Existing `CertificationEngine` — **no redesign** |
| Scope | Existing `CERTIFICATION_SCOPE_OPS` (includes SCI-005 + OPS-001) |
| Evidence (future cert gate) | SCI/OPS/FULL PASS · CONF both profiles COMPLIANT · typecheck/lint/build · TEST-024 · smoke-024 · prior TEST/SMOKE 016…023 untouched · determinism · semantic checks (Human gate, Model C, Relationship non-use, `qualified_by` coexistence) |
| Artifacts now | **NONE** — certification phase only |

---

## 25. Security Contract

| Control | Decision |
|---------|----------|
| Human gate | Cannot be bypassed — Core `assertHumanReviewerGate` on register and withdraw |
| Identity validation | Core / ENC / Persistence grammars |
| Persistence writes | Only via create / ensureInitialHead / advanceHead / optional appendEvent on defined APIs |
| Hidden scientific mutation | Forbidden |
| Unauthorized transition | Core rejects illegal edges before persist |
| Secrets / new authz infrastructure | **None** — no new trust boundary |
| AI as authority | Forbidden — Core `F5` |

---

## 26. Explicit Non-Goals

- Verification OPS
- Claim Standing redesign / post-create `qualified_by` / `verified_via`
- Material content OPS (`NegativeResultVersionService`)
- ENC AI-marker restoration
- SCI / REF-CANON edits
- Persistence / Model C / ENC / SER / CONF / CERT redesign
- Generic lifecycle / `postPersistTransition()`
- `Persistence.Relationship` scientific store
- Second event journal / second scientific graph
- Literature / DocumentArtifact / AI / KG / Search / Comp Bio
- Python / Nextflow / PostgreSQL / object storage / OpenSearch / Neo4j
- Distributed systems / multi-user / durable Workspace / frontend / API / FHIR
- Pre-persist withdrawal on register

---

## 27. Remaining Execution Questions

| ID | Question | Blocks EXEC? | Resolution |
|----|----------|--------------|------------|
| EQ-024-01 | Exact final `REF-OPS-###` terminal id | No | Fixed during EXEC fixture authoring from T-01…T-24 coverage |
| EQ-024-02 | Exact TEST-024 case count / naming inside smoke | No | Follow test-023 density; must cover create, withdraw, CAS, Human gate, decode |
| — | Core / Model C / keys / CAS / refs / events / membership / SER / CONF | — | **CLOSED** in this document |

No remaining question may change Core semantics, persistence keys, revision/head semantics, references, state transitions, event semantics, membership, serialization, or certification scope without **STOP**.

---

## 28. Implementation Readiness

| Gate | State |
|------|-------|
| SPEC-024 frozen scope | **CLOSED** |
| Architecture-audit observations O-024-01…06 | **ABSORBED** |
| Core authorities named exactly | **CLOSED** |
| Create + post-persist contracts | **CLOSED** (transition **YES**) |
| Model C keys / CAS / partial-write | **CLOSED** |
| Decode / events / membership / snapshots / export | **CLOSED** |
| Errors / determinism / security | **CLOSED** |
| REF / CONF / CERT | **CLOSED** |
| Change budget | **CLOSED** (§29) |
| EXEC authorization | **NO** — pending FINAL-ARCHITECTURE-RE-AUDIT-024 |

### IMPLEMENTATION-READY

An engineer/agent can execute Sprint 024 without inventing architecture, provided FINAL-ARCHITECTURE-RE-AUDIT-024 passes and EXEC is separately authorized.

---

## 29. Final Decision

### Change budget (when EXEC authorized)

**AUTHORIZED — source**

| File | Purpose |
|------|---------|
| `apps/reference-app/src/operations/research-operations.ts` | register / transition / get / lineage / export; deps wiring |
| `apps/reference-app/src/operations/negative-result-from-unit.ts` | **New** decode helper |
| `apps/reference-app/src/index.ts` | Exports; `referenceAppMarker.sprint → 24` |

**AUTHORIZED — fixtures**

| File | Purpose |
|------|---------|
| `packages/reference-tests/src/fixtures/ops.ts` | Additive `REF-OPS-106+` only |
| `packages/reference-tests/src/fixtures/ops-support.ts` | Minimal NR input/registration helpers if needed |
| `fixtures/index.ts` | Only if required (prefer zero change) |

**AUTHORIZED — scripts**

| File | Purpose |
|------|---------|
| `scripts/test-024-negative-result-ops.mjs` | New |
| `scripts/smoke-024-negative-result-ops.mjs` | New — `SMOKE_024_PASS` only |

**AUTHORIZED — docs (EXEC phase)**

| File | Purpose |
|------|---------|
| `IMPLEMENTATION.md` | Sprint 024 notes |
| `audits/execution/EXEC-024_REPORT.md` | Execution report |

**AUTHORIZED — certification phase only**

Additive cert reports under `audits/certification/` / `fixtures/cert/` during FORMAL-CERTIFICATION-024 only.

### FORBIDDEN

Core/ENC/SER/Persistence/CONF/CERT redesign; snapshot redesign; Relationship scientific store; second journal/graph; Verification OPS; Claim Standing redesign; material VersionService OPS; infrastructure; unrelated refactors; overwrite of historical smoke/cert markers.

### Stop conditions

EXEC **MUST STOP** if Core create/transition contradict this contract; Model C cannot support `NegativeResultUnit` without redesign; Persistence/ENC/SER/CONF/CERT redesign becomes necessary; scientific authority would leave Core; second graph/journal becomes necessary; nondeterminism cannot be contained; snapshot redesign required; historical certified behavior must change; unauthorized file must be modified; invention of scientific semantics or new error categories is required.

---

IMPLEMENTATION-DECISION-024 FINAL VERDICT
========================================

IMPLEMENTATION-DECISION-024 — IMPLEMENTATION-READY

Post-persist transition:
YES — `registered → withdrawn` via Core `NegativeResultTransitionService.transition`

Creation:
`registerNegativeResultUnit(input, registration, options?)` → `NegativeResultFactory.createRegistered` → ENC → Model C `rev:initial` → `ensureInitialHead`

Observations O-024-01…06:
ALL ABSORBED as EXEC discipline

SPEC patch required:
NO

Next gate:
FINAL-ARCHITECTURE-RE-AUDIT-024

EXEC authorization:
NO

*End IMPLEMENTATION-DECISION-024 — design only. No implementation. No commit. No push.*

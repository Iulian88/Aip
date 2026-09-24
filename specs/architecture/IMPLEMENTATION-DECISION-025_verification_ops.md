# IMPLEMENTATION-DECISION-025 — Verification OPS Under Model C

| Field | Value |
|-------|-------|
| Decision ID | IMPLEMENTATION-DECISION-025 |
| Title | Verification OPS — Implementation Contract |
| Version | **0.1.0** |
| Status | **IMPLEMENTATION-READY — EXEC-025 AUTHORIZED** (pending FINAL-ARCHITECTURE-RE-AUDIT-025) |
| Baseline | `47efca41c429c5de8bfc96da4c06082bc4c1e91c` |
| SPEC | SPEC-025 (DRAFT — audited) |
| Architecture audit | ARCHITECTURE-AUDIT-025 — **APPROVED WITH OBSERVATIONS** (0 blockers · 0 required patches · 6 observations) |
| Discovery | DISCOVERY-025 — READY FOR SPEC-025 |
| Mode | Design-only — **NO RUNTIME IMPLEMENTATION** |
| Does not authorize | EXEC-025 coding until FINAL-ARCHITECTURE-RE-AUDIT-025 separately authorizes; certification; commit; push |

---

## 1. Status

**IMPLEMENTATION-READY — EXEC-025 AUTHORIZED** (subject to FINAL-ARCHITECTURE-RE-AUDIT-025)

All required Sprint 025 implementation choices are closed from SPEC-025 + ARCHITECTURE-AUDIT-025 + actual repository APIs.  
This document freezes the EXEC contract. It does **not** itself start coding. Next gate: FINAL-ARCHITECTURE-RE-AUDIT-025.

| Metric | Value |
|--------|-------|
| BLOCKERS | **0** |
| REQUIRED PATCHES | **0** |
| Observations absorbed | **6** (O-025-01…06) |
| Architecture-blocking OQs | **0** |

---

## 2. Baseline

| Item | Value |
|------|-------|
| Certified HEAD / origin/main | `47efca41c429c5de8bfc96da4c06082bc4c1e91c` |
| Sprint 024 | FORMALLY CERTIFIED AND CLOSED — Negative Result OPS under Model C |
| SCI / OPS / FULL | **44/44 · 133/133 · 177/177** |
| Profiles | SCI `CONF-001@1.0.0` · OPS `CONF-001@1.1.0-OPS` |
| Highest OPS fixture today | `REF-OPS-133` → next free additive id **`REF-OPS-134`** |
| Architecture audit | 0 blockers · 0 required patches · READY FOR IMPLEMENTATION DECISION |

Working tree may contain documentation-only untracked files (DISCOVERY-025, SPEC-025, ARCHITECTURE-AUDIT-025, this decision). Those do not alter the certified runtime baseline.

### Frozen contracts (must not be redesigned)

- Scientific Core SCI-006 Verification semantics (states, outcomes, gates, refs, F\* codes)
- Claim Standing / Evidence Record State / Evidence Grade / Contradiction / Negative Result OPS
- ENC / SER architectures (including `VerificationUnit` content as certified)
- Persistence Model C addressing and CAS
- ResearchSnapshot (016) / WorkspaceSnapshot (018)
- Single Persistence event journal
- Single ConformanceEngine / CertificationEngine
- Profile ids listed above

**Conflict check:** No conflict between SPEC-025 and certified implementation. Core already exposes `createPlanned` and `transition`. Persistence already maps `VerificationUnit → CanonicalUnit`. ENC/SER already assemble/encode `VerificationUnit`. No silent invention required. No SPEC patch required before FINAL RE-AUDIT.

Process sequence:

```
DISCOVERY-025
  → SPEC-025
  → ARCHITECTURE-AUDIT-025 (APPROVED WITH OBSERVATIONS)
  → IMPLEMENTATION-DECISION-025 (this document)
  → FINAL-ARCHITECTURE-RE-AUDIT-025
  → EXEC-025 (only if separately authorized)
  → CODE-AUDIT-025
  → FORMAL-CERTIFICATION-025
  → FINAL GIT CLOSURE
```

---

## 3. Binding SPEC

| Binding | Value |
|---------|-------|
| Spec | `specs/architecture/SPEC-025_verification_ops.md` |
| Status | DRAFT — READY FOR ARCHITECTURE AUDIT (audited) |
| Discovery | `audits/roadmap/DISCOVERY-025_NEXT_RESEARCH_FRONTIER.md` |
| Subject | Verification OPS under Model C — Phase R1 completion |

### EXEC scope (ONLY)

| Letter | Capability |
|--------|------------|
| A | Verification creation OPS (`registerVerificationUnit`) via Core `createPlanned` |
| B | Verification post-persist Record State OPS (`transitionVerificationRecordState`) via Core `transition` (`planned → passed\|failed\|inconclusive`) |
| C | Model C immutable revisions for `VerificationUnit` |
| D | RevisionHead init / advance (`ensureInitialHead` / `advanceHead`) |
| E | Canonicalization through **existing** ENC (`CanonicalEncoder.assemble`) |
| F | `Persistence.create` (existing) |
| G | OPS membership (existing — **caller-explicit**) |
| H | Existing ResearchSnapshot / WorkspaceSnapshot (additive Persistence content only) |
| I | Existing export (`JsonEncoder.encode` of VerificationUnit payload) |
| J | Optional operational event (`ops.verification_record_state_revision`) |
| K | Additive Reference Tests (`REF-OPS-134+`) |
| L | Existing CONF/CERT integration (no profile/engine change) |
| M | OPS-local decode helper `verificationFromVerificationUnitPayload` |
| N | Get / lineage helpers mirroring Contradiction / Negative Result |

**No other scientific unit may be extended** (no Claim Standing redesign, material VersionService OPS, DocumentArtifact, ENC AI-marker fix).

---

## 4. Architecture Audit

| Item | Value |
|------|-------|
| Artifact | `audits/architecture/ARCHITECTURE-AUDIT-025_SPEC-025.md` |
| Verdict | **APPROVED WITH OBSERVATIONS** |
| Blockers | **0** |
| Required patches | **0** |
| Observations | **6** (O-025-01…06) |
| Implementation readiness | READY FOR IMPLEMENTATION DECISION |

No observation requires a SPEC correction. No observation is an implementation blocker.

---

## 5. Audit Observations

Exact six observations from ARCHITECTURE-AUDIT-025 §24, with disposition for EXEC-025.

### O-025-01 — Create is `createPlanned`, not NR `createRegistered`

| Field | Value |
|-------|-------|
| Observation | SPEC correctly refuses NR create pattern: Verification `createPlanned` is ungated with empty VTE (Contradiction-like), not Human-gated `createRegistered`. EXEC must not invent a registration transition argument. |
| Classification | **ABSORBED into EXEC discipline** · non-blocking implementation constraint |
| Why | Core API is single-arg `createPlanned(input)`. Inventing a second `registration` argument would invent scientific semantics. |
| EXEC MUST | Call `VerificationFactory.createPlanned(input)` only; OPS signature `registerVerificationUnit(input, options?)` — **two args max**; no `NegativeResultRecordTransitionInput`-style create arg; assert empty VTE log / `planned`+`pending` at create |

### O-025-02 — Leave-planned AI gate is Core `F7` (not NR `F5`)

| Field | Value |
|-------|-------|
| Observation | Leave-planned AI rejection is Core **`F7`** (message: promote out of planned). Fixtures must assert `F7`, not NR’s create-gate `F5`. |
| Classification | **ABSORBED into EXEC discipline** · non-blocking implementation constraint |
| Why | Core `assertHumanReviewerGate` throws `F7` for non-human leave-planned. Copying NR fixture codes would produce false failures / wrong evidence. |
| EXEC MUST | AI leave-planned REF/TEST fixtures assert failure_code **`F7`**; Human leave-planned uses `human:…` + non-empty `decision_ref`; head unchanged on failure |

### O-025-03 — Outcome is Core-coupled; OPS supplies `to` only

| Field | Value |
|-------|-------|
| Observation | Outcome is Core-coupled (`F5` on mismatch). OPS transition input must supply `to` only; must not invent independent outcome fields. |
| Classification | **ABSORBED into EXEC discipline** · non-blocking implementation constraint |
| Why | `OUTCOME_FOR[state]` is owned by `VerificationTransitionService`. OPS inventing `verification_outcome` would create a parallel scientific rule. |
| EXEC MUST | `VerificationRecordTransitionInput` fields only (`to`, `authority_agent`, `reason`, `decision_ref?`, `at`, `event_id?`); assert post-transition outcome equals Core coupling; never accept/ops-set outcome separately |

### O-025-04 — `artifact_ref` is content, not ENC envelope reference

| Field | Value |
|-------|-------|
| Observation | `artifact_ref` is CanonicalUnit **content**, not an ENC envelope reference — decode/export must round-trip content, not invent a reference role. |
| Classification | **ABSORBED into EXEC discipline** · non-blocking implementation constraint |
| Why | `buildVerification` places `artifact_ref` in content only; no ENC role for artifact. Inventing a role would fork ENC. |
| EXEC MUST | Decode helper reconstructs `artifact_ref` from `content.artifact_ref`; fixtures asserting ADM-T1 via artifact use content field; ref-role assertions cover only `verifies_claim` / `verifies_evidence` / `related_*` / `grade_ref` |

### O-025-05 — VersionService material path out of scope

| Field | Value |
|-------|-------|
| Observation | `VerificationVersionService.applyMaterialUpdate` after conclusion returns object to `planned`/`pending` with cleared VTE log (Core). Remains out of scope; EXEC must not expose material OPS accidentally. |
| Classification | **ABSORBED into EXEC discipline** · non-blocking implementation constraint · requires later sprint for material OPS |
| Why | Material bump after conclusion is Core-defined but SPEC-025 / OQ-025-004 close it as non-goal. Exposing it would expand Phase R1 scope. |
| EXEC MUST | Do **not** wire `VerificationVersionService` into ResearchOperations; do **not** add material-content OPS methods; Record State transitions only |

### O-025-06 — Stale-CAS / partial-write while still `planned`

| Field | Value |
|-------|-------|
| Observation | Three concluded terminals imply stale-CAS / partial-write fixtures while still `planned` (OQ-025-009) — same class as Contradiction/NR terminal patterns. |
| Classification | **ABSORBED into EXEC discipline** · non-blocking implementation constraint |
| Why | After conclude, Core has no second legal edge; stale CAS cannot be demonstrated post-terminal without inventing illegal transitions. |
| EXEC MUST | Stale-CAS / orphan partial-write fixtures use mismatched `expected_head_revision_id` while Record State is still **`planned`**; assert `CONFLICT` and prior head retained; do not attempt second leave-planned after conclude for CAS demos |

**Summary:** All six observations → **ABSORBED**. None require SPEC correction. None are implementation blockers.

---

## 6. Core Authority

| Authority | Exact name (source) | Role |
|-----------|---------------------|------|
| Creation | `VerificationFactory.createPlanned(input)` | Sole issuance → `planned` / `pending`; empty VTE log |
| Issuance internal | `VerificationTransitionService.createPlanned(content)` | Called by factory |
| Post-persist transition | `VerificationTransitionService.transition(v, input)` | Sole leave-planned edges |
| State vocabulary | `VERIFICATION_RECORD_STATES` | `planned` \| `passed` \| `failed` \| `inconclusive` |
| Outcome vocabulary | `VERIFICATION_OUTCOMES` + Core `OUTCOME_FOR` coupling | OPS must not redefine |
| Validator | `VerificationValidator.validate` | ADM-T1 / F\* / VRR-1 |
| Reference grammar | `VerificationReferenceValidator` | claim/evidence/grade/contradiction/NR refs |
| Human gate | `assertHumanReviewerGate` + `VerificationEventBuilder.build` | Leave-planned: `F7` + `decision_ref` |
| VTE builder | `VerificationEventBuilder` | `vte:` grammar; UUID fallback **out of certified path** |
| Material version | `VerificationVersionService` | **NOT called by OPS in Sprint 025** (O-025-05) |

OPS **SHALL NOT** reimplement any of the above. All scientific validity comes from Core throws (`VerificationValidationError`).

---

## 7. Creation Flow

### 7.1 Method (frozen)

```
ResearchOperations.registerVerificationUnit(
  input: CreateVerificationInput,
  options?: RegisterVerificationUnitOptions,
): Promise<RegisterVerificationUnitResult>
```

`RegisterVerificationUnitOptions = { revision_id?: string }` — default `rev:initial`.

**O-025-01:** No third `registration` / transition argument.

### 7.2 Normative sequence

```
1. revision_id = options?.revision_id ?? INITIAL_REVISION_ID
2. assertRevisionId(revision_id)
3. if revision_id !== rev:initial → OpsError INVALID_COMMAND_STATE
     ("registerVerificationUnit creates initial revision only;
       use transitionVerificationRecordState for later revisions")
4. verification = verificationFactory.createPlanned(input)
     // Core ADM-T1 + validate — may throw VerificationValidationError
     // NO Human gate at create (O-025-01)
5. unit = await encoder.assemble(verification)
     // detectKind: verification_id ∧ verification_outcome → VerificationUnit
6. entity = entityFromCanonicalUnit(unit, { revision_id: "rev:initial" })
     // no predecessor_revision_id
7. stored = await repository.create(entity)
8. await repository.ensureInitialHead(
     verification.verification_id,
     "VerificationUnit",
     "rev:initial",
   )
9. return { verification, unit, entity: stored }
```

### 7.3 Explicit non-steps

| Step | Decision |
|------|----------|
| Operational event on create | **NONE** |
| Automatic membership | **NONE** |
| Pre-persist leave-planned | **NOT OFFERED** (OQ-025-005) |
| Snapshot production | **NONE** inside create |
| Relationship writes | **NONE** |

### 7.4 Output

`{ verification, unit, entity }` with `record_state === "planned"`, `verification_outcome === "pending"`, empty VTE log, `entity.revision_id === "rev:initial"`, head at `rev:initial`.

### 7.5 Duplicate

Second create same `verification_id` → Persistence `ALREADY_EXISTS`; head untouched.

---

## 8. Post-Persist Transition Flow

### Decision (unambiguous)

**YES — POST-PERSIST VERIFICATION LEAVE-PLANNED IS IN SCOPE FOR SPRINT 025.**

Leave-planned changes canonical content (`record_state`, coupled `verification_outcome`, VTE log) → **new Model C successor revision required**.

### 8.1 Certified edges

| From | To | Requires revision + CAS? |
|------|----|--------------------------|
| `planned` | `passed` | **YES** |
| `planned` | `failed` | **YES** |
| `planned` | `inconclusive` | **YES** |
| concluded | * | Illegal — Core `F_TRANSITION` before persist |

### 8.2 Method (frozen)

```
ResearchOperations.transitionVerificationRecordState(
  input: TransitionVerificationRecordStateInput,
): Promise<TransitionVerificationRecordStateResult>
```

| Field | Required |
|-------|----------|
| `identity` | Yes — `verification_id` |
| `transition` | Yes — Core `VerificationRecordTransitionInput` (**`to` only for state** — O-025-03) |
| `revision_id` | Yes — new `rev:…` ≠ `rev:initial` ≠ `expected_head_revision_id` |
| `expected_head_revision_id` | Yes — current head; becomes predecessor |
| `append_event` | No — default `false` |

### 8.3 Normative sequence

```
1. assertRevisionId(revision_id); assertRevisionId(expected_head_revision_id)
2. if revision_id === rev:initial → OpsError INVALID_COMMAND_STATE
3. if revision_id === expected_head_revision_id → OpsError INVALID_COMMAND_STATE
4. priorEntity = await getVerificationUnit(identity)
5. prior = verificationFromVerificationUnitPayload(priorEntity.payload)
6. next = verificationTransitions.transition(prior, input.transition)
     // Core — may throw (F7 / F_TRANSITION / F5 / …)
7. unit = await encoder.assemble(next)
8. entity = entityFromCanonicalUnit(unit, {
     revision_id,
     predecessor_revision_id: expected_head_revision_id,
   })
9. stored = await repository.create(entity)
10. head = await repository.advanceHead(
      identity, "VerificationUnit",
      expected_head_revision_id, revision_id,
    )  // stale → CONFLICT
11. if append_event === true → repository.appendEvent(...)  // §14
12. return { verification: next, unit, entity: stored, head_revision_id: head.content_version }
```

### 8.4 Transition input requirements (O-025-02 / O-025-03)

Certified / REF / smoke leave-planned paths **SHALL** supply:

| Field | Value |
|-------|-------|
| `to` | `"passed"` \| `"failed"` \| `"inconclusive"` |
| `authority_agent` | `human:…` |
| `reason` | non-empty |
| `decision_ref` | non-empty |
| `at` | UTC second |
| `event_id` | `vte:…` (determinism) |
| outcome field | **MUST NOT exist** on OPS input |

Illegal / terminal re-transition → Core `F_TRANSITION` **before** any `create`.

---

## 9. Model C

| Element | Exact value |
|---------|-------------|
| Revision storage key | `persist:CanonicalUnit:VerificationUnit:{verification_id}:{revision_id}` |
| Head storage key | `persist:RevisionHead:VerificationUnit:{verification_id}` |
| Scientific identity | `verification_id` (stable) |
| Initial revision | `rev:initial` only via create-once |
| Later revisions | Caller-supplied `/^rev:[A-Za-z0-9._~-]{1,128}$/` |
| Lineage | `predecessor_revision_id = expected_head_revision_id` on successors; absent on initial |
| Head init | `ensureInitialHead(identity, "VerificationUnit", "rev:initial")` |
| CAS | `advanceHead(identity, "VerificationUnit", expected_head, to)` |
| Stale head | Persistence `CONFLICT` — no retry/overwrite/merge |
| Prior revisions | Immutable |
| Partial-write | create ok + CAS fail → orphan MAY remain; head unchanged; not scientific rollback |
| SemVer | `verification_version` unchanged by Record State transition |

No Model C redesign. No alternate key format. Kind map existing: `VerificationUnit → entity_kind "CanonicalUnit"`.

Stale-CAS fixtures: **while still `planned`** (O-025-06).

---

## 10. Reference Semantics

| Field | Meaning | Owner | Location | Target existence | Dereference | Relationship store | Reverse sync |
|-------|---------|-------|----------|------------------|-------------|-------------------|--------------|
| `claim_refs?` | Verification targets Claim | Core | ENC `verifies_claim` | Not required | NO | Forbidden | NO |
| `evidence_refs?` | Verification targets Evidence | Core | ENC `verifies_evidence` | Not required | NO | Forbidden | NO |
| `grade_refs?` | Grade token citation | Core | ENC `grade_ref` (Extension) | Not required | NO | Forbidden | NO |
| `contradiction_refs?` | Related Contradiction | Core | ENC `related_contradiction` | Not required | NO | Forbidden | NO |
| `negative_result_refs?` | Related Negative Result | Core | ENC `related_negative_result` | Not required | NO | Forbidden | NO |
| `artifact_ref?` | Opaque locator | Core | **Content only** (O-025-04) | Not required | NO | N/A | NO |

**FORBIDDEN:** `Persistence.Relationship` as scientific storage; inventing Verification→Verification edges; Claim Standing auto-update; reverse sync of `verified_via`.

**Coexistence (fixtures MAY):** Claim create-time `verified_via`; NR/Contradiction optional refs citing OPS-persisted or absent targets (OQ-025-003).

Relationship non-use filter: `list({ filter: { entity_kind: "Relationship" } }).total === 0` (parity O-024-01 / REF-OPS-102/131).

---

## 11. ENC / SER

| Concern | Decision |
|---------|----------|
| Encoder | Existing `CanonicalEncoder.assemble` only |
| Unit kind | `"VerificationUnit"` |
| Detection | `verification_id` ∧ `verification_outcome` in registry |
| SER | Existing SER-JSON only — no second serializer |
| AI markers in content | Omitted (OQ-025-001 deferred); decode lossy — **no ENC change** |
| `artifact_ref` | Content round-trip (O-025-04) |
| Decode helper | `verificationFromVerificationUnitPayload(payload)` — OPS-local, non-authoritative; validates `unit_kind`; reconstructs content + refs + VTE + optional `artifact_ref` |

---

## 12. Persistence

Allowed: `create`, `get`, head-resolved get, `ensureInitialHead`, `advanceHead`, `listRevisions`, `appendEvent`, `getEvents`, `snapshot`.

Forbidden: scientific replace/update mutation; DB/SQL/Redis/Kafka; CQRS; event sourcing redesign; second journal; second repository.

---

## 13. OPS API

### 13.1 Frozen methods

| Method | Signature intent |
|--------|------------------|
| `registerVerificationUnit` | `(input, options?) → { verification, unit, entity }` |
| `transitionVerificationRecordState` | `(input) → { verification, unit, entity, head_revision_id }` |
| `getVerificationUnit` | `(identity) → PersistenceEntity` (head) |
| `getVerificationUnitRevision` | `(identity, revision_id) → PersistenceEntity` |
| `getVerificationRevisionHead` | `(identity) → head` |
| `listVerificationUnitRevisions` | `(identity) → lineage` |
| `exportVerificationUnit` | `(identity) → string` (SER-JSON) |
| `exportVerificationUnitRevision` | `(identity, revision_id) → string` |

### 13.2 Wiring

`ResearchOperationsDeps` gains `VerificationFactory` + `VerificationTransitionService` (or construct defaults). `createResearchOperations` / `index.ts` exports / marker sprint **25**. Partial smoke deps that never call Verification methods remain valid (parity O-024-04 class).

### 13.3 No convenience APIs beyond SPEC-025

No material VersionService OPS. No pre-persist leave-planned. No Claim reverse-sync helpers.

---

## 14. Events

| Concern | Decision |
|---------|----------|
| Create-once ops event | **NONE** |
| Leave-planned ops event | Optional `append_event === true` |
| Type | `ops.verification_record_state_revision` |
| Authority | Operational only — never scientific truth |
| Journal | Sole Persistence journal |
| Event id | Prefer `ops:${transition.event_id}` when VTE id supplied; else `ops:verification_record_state:{identity}:{revision_id}` |
| Payload | `{ revision_id, predecessor_revision_id, unit_kind: "VerificationUnit", to_record_state }` |

Scientific VTE remains in ENC envelope events.

---

## 15. Membership / Snapshots / Timeline

| Surface | Decision |
|---------|----------|
| Session membership | Explicit `registerMember` with `unit_kind: "VerificationUnit"` — create/transition MUST NOT auto-register |
| Workspace membership | Existing M3 upsert when bound |
| Timeline | Existing operational timeline |
| ResearchSnapshot | Frozen shape |
| WorkspaceSnapshot | Additive — unchanged |

Membership = organizational metadata only.

---

## 16. Reference Corpus

| Concern | Decision |
|---------|----------|
| Additive range | **`REF-OPS-134+`** (start at 134; exact count is EXEC, themes mandatory) |
| Preserve | All SCI fixtures; `REF-OPS-001…133` unchanged |
| Profile | `CONF-001@1.1.0-OPS` on FULL |
| Engines | One ConformanceEngine · one CertificationEngine |

### Required themes (EXEC MUST cover)

| Theme | Assert |
|-------|--------|
| Valid createPlanned → `rev:initial` + head | success; empty VTE; `planned`/`pending` |
| ADM-T1 failure | `F6` |
| Invalid id / empty protocol / bad method | `F1`/`F2`/`F3` |
| Duplicate create | `ALREADY_EXISTS` |
| Non-initial register revision | OpsError |
| Leave-planned → `passed` / `failed` / `inconclusive` | success + lineage + outcome coupling |
| AI leave-planned | **`F7`** (O-025-02); head unchanged |
| Missing `decision_ref` | `F_TRANSITION` |
| Terminal re-transition | `F_TRANSITION` |
| Stale CAS while **planned** | `CONFLICT` (O-025-06) |
| Duplicate revision_id | `ALREADY_EXISTS` |
| Immutability of `rev:initial` after conclude | success |
| Lineage predecessor chain | success |
| Decode round-trip (content + refs + VTE + `artifact_ref`) | success (O-025-04) |
| Explicit membership / no auto-register | success |
| Snapshot frozen shape | success |
| Ops event present/absent | success |
| No `Relationship` entities | success |
| Deterministic export double-run | success |
| Claim `verified_via` coexistence | success |
| NR / Contradiction optional ref coexistence | success (OQ-025-003) |
| Grammar-only absent Claim/Evidence targets | success |
| Missing identity transition | `NOT_FOUND` |

TEST-025 / smoke-025 scripts + `SMOKE_025_PASS` marker (new only; do not overwrite prior smoke markers).

---

## 17. Determinism

| Concern | Rule |
|---------|------|
| Scientific ids | Caller-supplied `verification:…` |
| Revision ids | Caller-supplied `rev:…` |
| VTE `event_id` | Caller-supplied `vte:…` on all certified paths — Core `randomUUID` fallback **forbidden** on evidence path |
| Timestamps | Caller-supplied UTC seconds |
| Ops event ids | Deterministic from VTE id or identity+revision |
| Export / snapshots | Deterministic double-run |
| Forbidden on Sprint 025 evidence path | `Date.now`, `Math.random`, `randomUUID` |

---

## 18. Error Semantics

| Source | Propagation |
|--------|-------------|
| `VerificationValidationError` | Unchanged — do not wrap (`F1`…`F13`, `F_TRANSITION`, `F_AI`, `F7` leave-planned, `F5` outcome mismatch, `F6` ADM-T1, `F8` VRR-1, …) |
| Persistence `NOT_FOUND` / `ALREADY_EXISTS` / `CONFLICT` / `IMMUTABLE_ENTITY` / `INVALID_ID` | Unchanged |
| ENC errors | Unchanged |
| OpsError | Only operational command/decode guards (`INVALID_COMMAND_STATE`, wrong unit kind, etc.) |

No new error taxonomy.

---

## 19. Change Budget

### Allowed (EXEC-025 when authorized)

| Path / category |
|-----------------|
| `apps/reference-app/src/operations/research-operations.ts` — Verification APIs + deps |
| `apps/reference-app/src/operations/verification-from-unit.ts` — **new** decode helper |
| `apps/reference-app/src/index.ts` — exports + marker sprint 25 |
| `packages/reference-tests/src/fixtures/ops-support.ts` — Verification input helpers |
| `packages/reference-tests/src/fixtures/ops.ts` — additive `REF-OPS-134+` only |
| `scripts/test-025-verification-ops.mjs` — **new** |
| `scripts/smoke-025-verification-ops.mjs` — **new** |
| `SMOKE_025_PASS` — **new** only |
| `IMPLEMENTATION.md` — Sprint 025 section |
| `audits/execution/EXEC-025_REPORT.md` — **new** |

### Forbidden

| Path / category |
|-----------------|
| `packages/core/**` |
| `packages/persistence/**` |
| `packages/encoding/**` |
| `packages/serialization/**` |
| `packages/processor/**` |
| `packages/conformance/**` |
| `packages/certification/**` |
| Historical `REF-OPS-001…133` rewrites |
| SCI fixture edits |
| Historical certification / smoke markers (`CERT_*`, `SMOKE_0{16…24}_PASS`) |
| Unrelated apps/packages |

---

## 20. Open Questions

| ID | Status | Constrains EXEC? | Future sprint? |
|----|--------|------------------|----------------|
| **OQ-025-001** ENC AI markers omitted | **DEFERRED** | Decode lossy OK; do not change ENC | Yes — ENC/SCI |
| **OQ-025-002** Target existence | **CLOSED** — grammar-only | Fixtures may use absent targets | No |
| **OQ-025-003** NR/Contradiction coexistence fixtures | **CLOSED** — recommended | Cover in REF themes | No |
| **OQ-025-004** VersionService OPS | **CLOSED** — non-goal | Do not wire (O-025-05) | Later material OPS |
| **OQ-025-005** Pre-persist leave-planned | **CLOSED** — not offered | Do not implement | No |
| **OQ-025-006** Ops event name | **CLOSED** | Use `ops.verification_record_state_revision` | No |
| **OQ-025-007** Claim Standing `verified_via` setter | **DEFERRED** | Coexistence at Claim create only; no reverse sync | Yes — Core SCI-001 |
| **OQ-025-008** Method name | **CLOSED** | `registerVerificationUnit` | No |
| **OQ-025-009** Stale-CAS strategy | **CLOSED** | While still `planned` (O-025-06) | No |

No silent closure of scientific decisions. No blocking unresolved question remains.

---

## 21. EXEC Authorization

### Preconditions checklist

| Condition | Met? |
|-----------|------|
| BLOCKERS = 0 | **YES** |
| REQUIRED PATCHES = 0 | **YES** |
| All six observations accounted for | **YES** — ABSORBED |
| Core authority frozen | **YES** §6 |
| Creation flow frozen | **YES** §7 (`createPlanned`, no registration arg) |
| Transition/revision semantics frozen | **YES** §8 (leave-planned → successor + CAS) |
| Reference semantics frozen | **YES** §10 |
| Model C frozen | **YES** §9 |
| Persistence boundary frozen | **YES** §12 |
| ENC/SER frozen | **YES** §11 |
| Test corpus frozen | **YES** §16 (`REF-OPS-134+`) |
| Change budget frozen | **YES** §19 |
| No unresolved blocking scientific question | **YES** |

### Authorization statement

## IMPLEMENTATION-READY — EXEC-025 AUTHORIZED

Subject to successful **FINAL-ARCHITECTURE-RE-AUDIT-025**.

EXEC-025 (when separately commanded after final re-audit) may implement **only** the frozen change budget above, absorbing O-025-01…06 as mandatory discipline.

| Item | Value |
|------|-------|
| Next gate | **FINAL-ARCHITECTURE-RE-AUDIT-025** |
| This document authorizes coding now? | **NO** — final re-audit first |
| Commit / push | **NONE** |
| Source changes by this decision | **NONE** |

*End IMPLEMENTATION-DECISION-025 — design only.*

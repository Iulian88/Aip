# SPEC-025 — Verification OPS Under Model C

| Field | Value |
|-------|-------|
| **Spec ID** | SPEC-025 |
| **Artifact** | `specs/architecture/SPEC-025_verification_ops.md` |
| **Status** | DRAFT — READY FOR ARCHITECTURE AUDIT |
| **Baseline commit** | `47efca41c429c5de8bfc96da4c06082bc4c1e91c` (Sprint 024 certified + closed) |
| **Depends on** | SCI-006@0.1.0 · SCI-001 (Claim `verified_via`) · SCI-002 · SCI-003 · SCI-004 · SCI-005 · ADR-0006 · ADR-020 / SPEC-020 (Model C) · SPEC-021…024 · DISCOVERY-025 |
| **Implementation authorization** | **NO** |

Normative language: RFC 2119 SHALL / MUST / SHOULD / MAY.  
Every API, error code, grammar, and field named below was verified against source at the baseline commit. Where this SPEC names a **new** OPS symbol, it is marked *(new — Sprint 025)*.

**Non-equivalence notice:** Verification is **not** Claim Standing, Evidence Record State, Grade, Contradiction Record State, or Negative Result Record State. Creation is ungated `createPlanned` (Contradiction-like), not Human-gated `createRegistered` (Negative Result-like). Post-persist edges leave `planned` to three concluded states with Core-owned outcome coupling.

---

## 1. Status

**DRAFT — READY FOR ARCHITECTURE AUDIT**

Design-only. No source, test, fixture, certification, or prior-sprint documentation changes accompany this SPEC.

Implementation authorization: **NO**.  
Audit readiness: confirmed in §28.

---

## 2. Scope

### 2.1 Baseline

| Item | Value |
|------|-------|
| Sprint | 024 — Negative Result OPS Under Model C — FORMALLY CERTIFIED AND CLOSED |
| Commit | `47efca41c429c5de8bfc96da4c06082bc4c1e91c` |
| HEAD == origin/main | YES |
| SCI corpus | 44/44 under `CONF-001@1.0.0` |
| OPS corpus | 133/133 (`REF-OPS-001…133`) |
| FULL corpus | 177/177 under `CONF-001@1.1.0-OPS` |
| Highest OPS fixture | `REF-OPS-133` → next free additive id **`REF-OPS-134`** |
| Discovery pin | `audits/roadmap/DISCOVERY-025_NEXT_RESEARCH_FRONTIER.md` — READY FOR SPEC-025 · JUSTIFIED NEXT = Verification OPS under Model C |

### 2.2 Problem statement

1. Core owns a complete Verification aggregate (SCI-006): factory (`createPlanned`), validator, Record State transition service (`planned → passed|failed|inconclusive`), outcome coupling, version service, ENC `VerificationUnit`, SER-JSON registration, Processor stage, SCI fixtures (`REF-VERIF-*`).
2. Research Operations has **no** Verification path: no create-once, no decode-from-unit, no post-persist leave-planned, no get/lineage/export helpers. No `VerificationUnit` row or RevisionHead has ever been created by OPS or any REF-OPS fixture.
3. A **certified Claim edge already cites Verification identities**: `CreateClaimInput.verified_via` / `ClaimReferenceValidator.validateVerifiedVia` require SCI-006 `verification:…` grammar. Those identities cannot be OPS-persisted today.
4. Once a Verification is persisted in `planned`, Core leave-planned transitions cannot be committed without an immutable successor revision — the same Model C gap Sprints 020–024 closed for Standing, Record State, Grade, Contradiction, and Negative Result.

**Sprint 025 objective:** make Core Verification operationally **creatable** (`planned` / `pending`) and **concludable after persistence** under certified Model C, using existing Core semantics only.

### 2.3 In scope

- Verification create-once OPS via Core `VerificationFactory.createPlanned`
- Post-persist Record State OPS via Core `VerificationTransitionService.transition` (`planned → passed|failed|inconclusive`)
- OPS-local decode helper for `VerificationUnit` payloads
- Model C persistence for `unit_kind = "VerificationUnit"` (reuse create / ensureInitialHead / advanceHead / journal)
- Get / lineage / export helpers mirroring Claim / Evidence / Contradiction / Negative Result
- Explicit membership behaviour (unchanged shapes)
- Frozen snapshots (additive persistence content only)
- Optional operational citation event on post-persist leave-planned
- Additive `REF-OPS-134+` under existing `CONF-001@1.1.0-OPS`
- Additive deps in `ResearchOperationsDeps` / `createResearchOperations` / `index.ts` exports / marker sprint bump

### 2.4 Out of scope

See §24 Explicit Non-Goals.

### 2.5 Certified Model C (unchanged, reused verbatim)

| Element | Contract (source) |
|---------|-------------------|
| Revision key | `persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}` |
| Initial revision | `INITIAL_REVISION_ID = "rev:initial"` |
| Revision grammar | `REVISION_ID = /^rev:[A-Za-z0-9._~-]{1,128}$/` (`assertRevisionId`) |
| Lineage | `PersistenceEntity.predecessor_revision_id` — absent on `rev:initial`, required otherwise |
| Head key | `persist:RevisionHead:{unit_kind}:{identity}` |
| Head init | `repository.ensureInitialHead(identity, unit_kind, revision_id)` |
| CAS | `repository.advanceHead(identity, unit_kind, from_revision_id, to_revision_id)` → stale → `CONFLICT` |
| Journal | sole `repository.appendEvent(parent_identity, event)` |

Sprint 025 is the **sixth explicit per-unit** orchestration of the same shape. It is **not** a generic engine.

---

## 3. Architectural Principles

| Principle | Normative rule |
|-----------|----------------|
| One scientific authority | Scientific Core only (`@sciros/core` `verification/*`) |
| OPS orchestrates | Core create/transition → ENC → Model C create → head init/CAS → optional journal |
| One relationship authority | Core fields + ENC envelope references; **no** `Persistence.Relationship` scientific store |
| One event journal | Persistence journal only; ops events are operational citations |
| Model C immutability | Old revisions immutable; head advances only via CAS |
| Determinism | Caller-supplied scientific ids, revision ids, VTE `event_id`, timestamps on certified paths |
| Human gates preserved | Leave-planned Human Reviewer + `decision_ref` — OPS MUST NOT weaken |
| Orthogonality (ADR-0006) | Verification Record State / outcome ≠ Claim Standing ≠ Evidence Record State ≠ Grade |
| No second graph / journal | Forbidden |
| No generic lifecycle | Explicit per-unit methods only |

---

## 4. Core Verification Authority

Everything in this section is **existing Core behaviour** (`packages/core/src/verification/*`). Sprint 025 changes none of it.

| Layer | Owns | Must not |
|-------|------|----------|
| **Scientific Core** | Verification meaning; Record State + Outcome vocabulary and coupling; legal leave-planned edges; Human Reviewer gate leaving `planned`; ADM-T1 target rule; reference admissibility; VTE validity; SemVer material bump | Be bypassed, re-implemented, or extended by OPS |
| **OPS** | Orchestration only | Define Verification vocabulary, states, outcomes, methods, gates, or relationship semantics; dereference scientific ids as a scientific rule |
| **ENC** | `VerificationUnit` canonical projection | Be modified by Sprint 025 |
| **SER** | JSON encode/decode of CanonicalUnit payloads | New profile / serializer |
| **Persistence** | Immutable rows, RevisionHead, CAS, sole journal, snapshot | Scientific Verification semantics |
| **REF / CONF / CERT** | Executable evidence; profile evaluation; certification | Own semantics |
| **AI** | Non-authoritative | Promote Verification out of `planned` as sole authority (Core `F7`) |

### 4.1 Identity and pins

| Field | Grammar / rule | Source |
|-------|----------------|--------|
| `verification_id` | `/^verification:[A-Za-z0-9._~-]{1,128}$/` (`VERIFICATION_OBJECT_ID`) — Core `F1` | `identifiers.ts` |
| `ontology_ref` | `/^SCI-000@0\.1\.[0-9]+$/`; factory default `SCI-000@0.1.0` | same |
| `spec_ref` | `/^SCI-006@0\.1\.[0-9]+$/`; factory default `SCI-006@0.1.0` | same |
| `verification_version` | SemVer `/^[0-9]+\.[0-9]+\.[0-9]+$/`; factory default `1.0.0` | same |
| `created_at`, `provenance.recorded_at`, VTE `at` | UTC second `YYYY-MM-DDTHH:MM:SSZ` | same |
| VTE `event_id` | `/^vte:[A-Za-z0-9._~-]{1,128}$/` (`VTE_ID`) | same |
| Human Reviewer | `/^human:[A-Za-z0-9._~-]{1,128}$/` (`VERIFICATION_HUMAN_REVIEWER`) | same |
| `ethics_constraint_marker` | MUST be `"non_clinical"` (`F12`) | `validator.ts` |

### 4.2 Object shape (`Verification`)

Mandatory: `verification_id`, `ontology_ref`, `spec_ref`, `verification_version`, `record_state`, `verification_outcome`, `summary`, `description`, `scope {domain_context, bounds, exclusions}`, `protocol_ref`, `verification_method`, `verification_context`, `verification_rationale`, `ethics_constraint_marker: "non_clinical"`, `provenance {completeness, recorded_at, custody_agent, method_summary}`, `created_by`, `created_at`.

Optional: `claim_refs`, `evidence_refs`, `grade_refs`, `contradiction_refs`, `negative_result_refs`, `artifact_ref`, `ai_assisted`, `human_sponsor`, `record_transition_log`.

### 4.3 Methods (`VERIFICATION_METHODS`)

`reproduction` | `protocol_conformance` | `envelope_check` | `other` — Core `F3` if invalid.

### 4.4 Forbidden vocabularies

`FORBIDDEN_VERIFICATION_RECORD_STATES` / `FORBIDDEN_VERIFICATION_OUTCOMES` exclude Standing, Evidence Record State, Contradiction, Negative Result, workflow, and `truth_confirmed` (`F4` / `F13`). OPS MUST NOT invent alternate vocabularies.

---

## 5. Verification Creation Semantics

### 5.1 Authoritative factory

**FACT:** Creation is `VerificationFactory.createPlanned(input: CreateVerificationInput): Verification`.

| Question | Answer (source) |
|----------|-----------------|
| Draft-based? | **NO** — no `draft` Record State |
| Registered directly? | **NO** — issuance state is `planned`, not `registered` |
| Open-like? | **Closest analogy:** Contradiction `createOpen` (ungated create, empty event log) |
| NR-like `createRegistered`? | **NO** — Verification create is **not** Human-gated |
| Authoritative service | `VerificationFactory` → `VerificationTransitionService.createPlanned` |

### 5.2 Create behaviour (`createPlanned`)

1. Grammar-validate optional refs (`VerificationReferenceValidator`).
2. Reject empty `artifact_ref` when present (`F6`).
3. NFC-trim content fields; freeze scope/provenance/refs.
4. Produce frozen `Verification` with:
   - `record_state: "planned"`
   - `verification_outcome: "pending"`
   - `record_transition_log: []` (**empty** — no VTE at create)
5. `VerificationValidator.validate` (includes ADM-T1 / F6 target rule).

**FACT:** Unlike Negative Result issuance, createPlanned does **not** embed a Human VTE. Human gate applies only when **leaving** `planned`.

### 5.3 Immutable after creation (scientific content vs Record State)

| Aspect | Rule |
|--------|------|
| Scientific identity | `verification_id` immutable |
| Pins / created_by / created_at | carried unchanged across Record State transitions |
| Material content fields | unchanged by `transition`; bumped only by `VerificationVersionService` (**out of scope**) |
| Record State / Outcome | change only via Core `transition` (leave-planned) |
| Refs at create | frozen into object; Record State transition **carries** refs unchanged (Core `transition` copies prior refs) |

### 5.4 OPS create contract *(new)*

```
registerVerificationUnit(input: CreateVerificationInput, options?: { revision_id?: string })
  → { verification, unit, entity }
```

Flow (normative):

```
assertRevisionId / OpsError if revision_id ≠ rev:initial
  → VerificationFactory.createPlanned(input)
  → CanonicalEncoder.assemble(verification)
  → entityFromCanonicalUnit({ revision_id: rev:initial })
  → Persistence.create
  → ensureInitialHead(verification_id, "VerificationUnit", rev:initial)
  → return { verification, unit, entity }
```

| Rule | Value |
|------|-------|
| Create ops event | **NONE** (Claim / Evidence / Contradiction / NR parity) |
| Auto membership | **NONE** |
| Relationship writes | **NONE** |
| Pre-persist leave-planned | **NOT offered** (OQ-025-005 CLOSED) |

Core validation failures occur **before** `repository.create`. OPS SHALL propagate `VerificationValidationError` unchanged.

---

## 6. Verification Record State

**FACT:** Exact vocabulary from `VERIFICATION_RECORD_STATES` / `VERIFICATION_OUTCOMES`:

| Record State | Coupled Outcome | Terminal? |
|--------------|-----------------|-----------|
| `planned` | `pending` | No |
| `passed` | `passed` | Yes |
| `failed` | `failed` | Yes |
| `inconclusive` | `inconclusive` | Yes |

Outcome/state mismatch → Core `F5`. OPS MUST NOT set outcome independently.

### 6.1 Legal edges (`VerificationTransitionService`)

| From | To (legal) | Notes |
|------|------------|-------|
| *(new)* | `planned` | Issuance only via `createPlanned` — not via `transition` |
| `planned` | `passed` | Leave-planned; Human + `decision_ref` |
| `planned` | `failed` | Leave-planned; Human + `decision_ref` |
| `planned` | `inconclusive` | Leave-planned; Human + `decision_ref` |
| `passed` / `failed` / `inconclusive` | — | Terminal (`ALLOWED[state] = []`) |

Forbidden: `planned → planned`; concluded → anything; inventing states; using Standing/NR/Contradiction vocabularies.

### 6.2 Transition input (`VerificationRecordTransitionInput`)

| Field | Required | Core rule |
|-------|----------|-----------|
| `to` | Yes | must be legal leave-planned target (`F_TRANSITION`) |
| `authority_agent` | Yes | Human Reviewer when leaving `planned` (`F7`) |
| `reason` | Yes | non-empty after NFC+trim (`F_TRANSITION`) |
| `decision_ref` | Yes when leaving `planned` | non-empty after NFC+trim (`F_TRANSITION`) |
| `at` | Yes | UTC second |
| `event_id` | Optional in Core; **required on OPS paths** (§23) | `vte:…` grammar |

`transition(v, input)` result: new frozen `Verification` with `record_state = to`, `verification_outcome = OUTCOME_FOR[to]`, appended VTE, `verification_version` **unchanged**, other fields carried; validated (including VRR-1 / `F8` for concluded Human VTE).

---

## 7. Post-Persist Transition Semantics

### 7.1 Does leave-planned change canonical scientific content?

**YES.** Core produces a new Verification object with:

- changed `record_state`
- changed `verification_outcome` (coupled)
- appended `record_transition_log` VTE

Therefore Model C **MUST** create an immutable successor `VerificationUnit` revision and advance RevisionHead via CAS. OPS MUST NOT mutate the prior revision in place.

### 7.2 OPS transition contract *(new)*

```
transitionVerificationRecordState(input: {
  identity: string;
  revision_id: string;                 // new successor ≠ rev:initial
  expected_head_revision_id: string;   // CAS token
  transition: VerificationRecordTransitionInput;
  append_event?: boolean;
})
  → { verification, unit, entity, head_revision_id }
```

Flow (normative):

```
OpsError guards (rev:initial / equal revision ids)
  → getVerificationUnit(identity)           // head-resolved
  → verificationFromVerificationUnitPayload // OPS-local decode
  → VerificationTransitionService.transition(prior, transition)
  → CanonicalEncoder.assemble
  → Persistence.create(+ predecessor_revision_id = expected_head)
  → advanceHead CAS
  → optional appendEvent
  → return
```

### 7.3 Partial-write honesty

If `create` succeeds and `advanceHead` fails → orphan successor revision MAY exist; head unchanged; **not** scientific rollback. OPS MUST NOT claim transactional scientific rollback.

### 7.4 Stale CAS while concluded

Concluded states have no second legal Core edge. Stale-CAS fixtures MUST use mismatched `expected_head_revision_id` while still `planned` (Contradiction / NR certified pattern).

### 7.5 Material content OPS

`VerificationVersionService.applyMaterialUpdate` exists (material bump; after conclusion returns to `planned`). **Not an OPS operation in Sprint 025** (§24; OQ-025-004).

---

## 8. Model C Revision Semantics

| Concern | Rule |
|---------|------|
| Scientific identity | `verification_id` — stable across revisions |
| Persistence identity | `persist:CanonicalUnit:VerificationUnit:{verification_id}:{revision_id}` |
| Initial revision | `rev:initial` only via create-once |
| Later revisions | caller-supplied `rev:*` ≠ `rev:initial` |
| Lineage | `predecessor_revision_id` = prior head revision on successors |
| Head | `persist:RevisionHead:VerificationUnit:{verification_id}` |
| Head advancement | CAS via `advanceHead` |
| Stale head | Persistence `CONFLICT`; prior head retained |
| Old revisions | immutable (`IMMUTABLE_ENTITY` on mutate) |
| Optimistic concurrency | yes — expected head revision as CAS token |

**Does every Verification operation require the same revision pattern?**

| Operation | New revision? | Head change? |
|-----------|---------------|--------------|
| `registerVerificationUnit` | Yes — `rev:initial` | `ensureInitialHead` |
| `transitionVerificationRecordState` | Yes — caller `rev:*` | `advanceHead` CAS |
| get / export / lineage | No | No |
| membership / snapshot read | No | No |

**Identity trichotomy (normative):**

| Kind | Value | Role |
|------|-------|------|
| Scientific identity | `verification_id` | stable across all revisions |
| Content SemVer | `verification_version` | **unchanged** by Record State transition (Core); bumped only by VersionService (out of scope) |
| Model C revision identity | `revision_id` | Persistence addressing; **≠** SemVer |

Consequence: consecutive `VerificationUnit` revisions may carry the **same** `content_version`. Lineage MUST be read from `predecessor_revision_id`, never from SemVer.

**Persistence changes:** NONE.

---

## 9. Reference Semantics

### 9.1 Complete reference audit

| Field | Semantic meaning | Owner | Kind | Target existence required? | OPS dereference? | Target OPS-persistable? |
|-------|------------------|-------|------|----------------------------|------------------|-------------------------|
| `claim_refs?` | Claims this Verification targets | Core | Scientific field → ENC `verifies_claim` | **NO** (grammar-only) | **NO** | YES (Claim OPS) |
| `evidence_refs?` | Evidence this Verification targets | Core | Scientific field → ENC `verifies_evidence` | **NO** | **NO** | YES (Evidence OPS) |
| `grade_refs?` | Grade tokens related to verification | Core | Scientific field → ENC `grade_ref` (Extension class) | **NO** | **NO** | Grade tokens via Grade OPS on Evidence |
| `contradiction_refs?` | Related Contradiction ids | Core | Scientific field → ENC `related_contradiction` | **NO** | **NO** | YES (Contradiction OPS) |
| `negative_result_refs?` | Related Negative Result ids | Core | Scientific field → ENC `related_negative_result` | **NO** | **NO** | YES (Negative Result OPS — Sprint 024) |
| `artifact_ref?` | Opaque artifact / source locator | Core | Content field (not ENC reference) | **NO** | **NO** | N/A — opaque string; **not** DocumentArtifact |

### 9.2 ADM-T1 target rule (Core F6)

At least one of:

- `claim_refs.length ≥ 1`, **or**
- `evidence_refs.length ≥ 1`, **or**
- non-empty `artifact_ref`

ENC validator mirrors: `VerificationUnit requires Claim, Evidence, or artifact target`.

### 9.3 Self-references / Verification→Verification

**FACT:** Core Verification type has **no** `verification_refs` field. No Verification→Verification scientific edge exists. Out of scope.

### 9.4 Persistence.Relationship — FORBIDDEN as scientific storage

Sprint 025 **SHALL NOT**:

- create `Relationship` entities for any Verification edge;
- read `queryRelationships` to derive scientific meaning;
- treat `PersistenceEntity.references` as authoritative over the ENC payload.

**Rule:** the scientific edge set of a Verification revision is exactly what its `VerificationUnit` payload encodes.

### 9.5 Existence of referenced entities

**Decision (OQ-025-002 CLOSED):** OPS **SHALL NOT** require referenced Claim / Evidence / Contradiction / Negative Result units to exist in Persistence before `registerVerificationUnit`. Fixtures MAY demonstrate both persisted and absent targets (especially NR/Contradiction coexistence after Sprints 023–024).

---

## 10. Claim / Evidence / Contradiction / Negative Result Boundary

| Target axis | Does Verification OPS modify it? | Authority direction |
|-------------|----------------------------------|---------------------|
| Claim Standing | **NO** | Orthogonal (ADR-0006) |
| Claim `verified_via` | **NO reverse sync** | Claim → Verification ids at Claim create (grammar); StandingTransitionInput **lacks** `verified_via` / `qualified_by` setters — creation-only / VersionService-preserved |
| Evidence Record State | **NO** | Orthogonal |
| Evidence Grade | **NO** | `grade_refs` are citations of grade tokens; Grade OPS remains Evidence-local |
| Contradiction Record State | **NO** | Optional `contradiction_refs` citation only |
| Negative Result Record State | **NO** | Optional `negative_result_refs` citation only |

**FACT:** Core does **not** define bidirectional automatic synchronization between Verification and Claim/Evidence/Contradiction/Negative Result. Sprint 025 **SHALL NOT** introduce reverse sync.

**Coexistence (certified fixtures MAY show):**

- Claim created with `verified_via: [verification_id]` after Verification OPS persist
- Verification with `claim_refs` / `evidence_refs` / `contradiction_refs` / `negative_result_refs` citing OPS-persisted or absent targets

---

## 11. Provenance Boundary

| Axis | Representation | Verification impact |
|------|----------------|---------------------|
| Scientific provenance | Core `provenance` object + VTE log in ENC | Mandatory on Verification; unchanged contract |
| Operational audit | Persistence `ops.*` journal + timeline | Optional leave-planned ops event only |
| Source locator | `artifact_ref` opaque; Evidence `source_locator` separate | No DocumentArtifact |
| Persistence revision lineage | `predecessor_revision_id` + RevisionHead | Model C metadata ≠ scientific supersession |
| Workspace/session organization | membership / snapshots | Organizational only |

**Gap analysis:** Verification does **not** require provenance data not currently representable. No new provenance framework in SPEC-025.

---

## 12. Canonical Encoding

**FACT:** ENC unit kind is `"VerificationUnit"` — existing; do not invent another kind.

Detection: registry returns `VerificationUnit` when `"verification_id" in o && "verification_outcome" in o`; `buildVerification(v)`.

### 12.1 Envelope (existing `CanonicalEncodingBuilder.buildVerification`)

| Envelope part | Content |
|---------------|---------|
| `unit_kind` | `"VerificationUnit"` |
| `identity` | `verification_id` |
| `content_version` | `verification_version` |
| `ontology_ref` / `spec_ref` | from Core object |
| `content` | `verification_id`, `verification_version`, `record_state`, `verification_outcome`, `summary`, `description`, `scope`, `protocol_ref`, `verification_method`, `verification_context`, `verification_rationale`, `provenance`, `ethics_constraint_marker`, `created_by`, `created_at`, `artifact_ref?` |
| `references` | §9 ENC roles |
| `events` | one `CanonicalEvent` per VTE (`parent_class: "Verification"`, …) |

**FACT (OQ-025-001 class):** `VerificationUnit.content` does **not** carry `ai_assisted` or `human_sponsor` (same class as Contradiction / Negative Result). Sprint 025 SHALL NOT modify ENC.

**Sufficiency:** Current ENC is sufficient for Verification OPS. No ENC architecture change.

---

## 13. Serialization

SER-JSON registry, profile, validator, encoder, decoder already recognise `VerificationUnit`.

| Capability | Status |
|------------|--------|
| Encode | YES — existing |
| Decode | YES — existing |
| Export | YES — OPS reuses `JsonEncoder.encode(entity.payload)` |
| Deterministic serialization | YES — existing SER-JSON-001 |

No second serializer. No Verification-specific JSON schema.

---

## 14. Processor Integration

Processor already handles `verification.record_transition` stages (create-stages / transition-engine). **OPS does not invoke Processor** for Verification Record State — OPS calls Core `VerificationTransitionService` directly (Claim / Evidence / Contradiction / NR parity).

### 14.1 OPS decode / reconstruction *(new)*

```
verificationFromVerificationUnitPayload(payload: unknown): Verification
```

| Requirement | Rule |
|-------------|------|
| Reconstruct Core Verification | From intact `VerificationUnit` CanonicalUnit payload |
| Preserve content + refs + VTE | Yes |
| Validate `unit_kind === "VerificationUnit"` | Yes — else OpsError |
| Non-authoritative | MUST NOT invent states or bypass Core validators |
| AI markers | Omit on reconstruct if absent from ENC content (lossy — OQ-025-001) |
| `artifact_ref` | Reconstruct from content when present |

---

## 15. Persistence Integration

Allowed operations only:

| Operation | Use |
|-----------|-----|
| `create` | Initial + successor revisions |
| `get` / head-resolved get | Read current / by revision |
| `ensureInitialHead` | Create-once |
| `advanceHead` | Leave-planned CAS |
| `listRevisions` | Lineage helper |
| `appendEvent` / `getEvents` | Optional ops citation |
| `snapshot` | Existing snapshot projection |

**Forbidden:** scientific replace/update mutation; database; CQRS; event sourcing redesign; Kafka/Redis/SQL; second journal; second repository.

---

## 16. OPS API Surface

Derived from Core semantics (not assumed from other units).

### 16.1 Methods *(new)*

| Method | Purpose |
|--------|---------|
| `registerVerificationUnit` | Create-once Model C `rev:initial` |
| `transitionVerificationRecordState` | Post-persist leave-planned |
| `getVerificationUnit` | Head-resolved PersistenceEntity |
| `getVerificationUnitRevision` | Specific revision |
| `getVerificationRevisionHead` | RevisionHead |
| `listVerificationUnitRevisions` | Lineage |
| `exportVerificationUnit` | SER-JSON of head payload |
| `exportVerificationUnitRevision` | SER-JSON of specific revision |

### 16.2 Per-method contract summary

| API | Core authority | Persistence | Revision | Event | Membership | Snapshot |
|-----|----------------|-------------|----------|-------|------------|----------|
| `registerVerificationUnit` | `createPlanned` | create + ensureInitialHead | `rev:initial` | none | none auto | unchanged shape |
| `transitionVerificationRecordState` | `transition` | create + advanceHead (+ optional appendEvent) | caller successor | optional ops | none auto | unchanged shape |
| get / list / export | none (read) | get / list / encode | n/a | none | n/a | n/a |

### 16.3 Deps / wiring *(new)*

`ResearchOperationsDeps` SHALL accept `VerificationFactory` and `VerificationTransitionService` (or construct defaults), mirroring Negative Result wiring. `createResearchOperations` / `index.ts` exports / marker sprint **25**.

---

## 17. Operational Events

| Concern | Rule |
|---------|------|
| Create-once ops event | **NONE** |
| Leave-planned ops event | Optional when `append_event === true` |
| Event type | `ops.verification_record_state_revision` *(new — CLOSED OQ-025-006)* |
| Scientific authority? | **NO** — operational citation only |
| Journal | Sole Persistence journal |
| Deterministic event id | Prefer `ops:${transition.event_id}` when VTE id supplied; else deterministic fallback `ops:verification_record_state:{identity}:{revision_id}` |
| Payload | `{ revision_id, predecessor_revision_id, unit_kind: "VerificationUnit", to_record_state }` |
| Timestamp | Caller-controlled on VTE (`at`); ops event uses Persistence event fields as existing |

Scientific VTE remains in ENC envelope events — distinct from ops journal citation.

---

## 18. Membership / Snapshot / Timeline

| Surface | Rule |
|---------|------|
| ResearchSession membership | Explicit `registerMember` with `unit_kind: "VerificationUnit"` — create/transition MUST NOT auto-register |
| ResearchWorkspace membership | Unchanged M3 upsert when session bound |
| Timeline | Existing operational timeline over member identities — may include Verification after explicit membership |
| ResearchSnapshot | Frozen shape — Verification appears only via existing membership/projection mechanisms |
| WorkspaceSnapshot | Additive — unchanged contract |

Membership remains organizational metadata — **not** scientific relationships.

---

## 19. Export

Reuse existing SER-JSON:

```
exportVerificationUnit(identity) → JsonEncoder.encode(head payload)
exportVerificationUnitRevision(identity, revision_id) → JsonEncoder.encode(revision payload)
```

Deterministic: same input → same export bytes (fixtures MUST double-run). No Verification-specific schema.

---

## 20. Reference Tests

| Concern | Rule |
|---------|------|
| Corpus | Additive `REF-OPS-134+` only |
| Historical SCI fixtures | **MUST NOT** modify (`REF-VERIF-*` remain SCI-only) |
| Historical OPS fixtures | **MUST NOT** rewrite `REF-OPS-001…133` |
| Profile | `CONF-001@1.1.0-OPS` evaluated on FULL |
| Engines | One ConformanceEngine · one CertificationEngine |
| Fabricated reports | Forbidden |

### 20.1 Required fixture themes (not implemented here)

| Theme | Examples |
|-------|----------|
| Valid createPlanned → VerificationUnit `rev:initial` + head | success |
| ADM-T1 failure (no claim/evidence/artifact) | `F6` |
| Invalid id / empty protocol / bad method | `F1`/`F2`/`F3` |
| Duplicate create | `ALREADY_EXISTS` |
| Non-initial revision on register | OpsError |
| Leave-planned Human → `passed` / `failed` / `inconclusive` | success + lineage |
| AI leave-planned | `F7`; head unchanged |
| Missing `decision_ref` | `F_TRANSITION` |
| Terminal re-transition | `F_TRANSITION` |
| Stale CAS while still `planned` | `CONFLICT` |
| Duplicate revision_id | `ALREADY_EXISTS` |
| Immutability of `rev:initial` after conclude | success |
| Lineage predecessor chain | success |
| Decode round-trip (content + refs + VTE) | success |
| Explicit membership / no auto-register | success |
| Snapshot frozen shape | success |
| Optional ops event present/absent | success |
| No Persistence.Relationship entities | success |
| Deterministic export double-run | success |
| Claim `verified_via` coexistence | success |
| NR / Contradiction optional ref coexistence | success |
| Missing identity transition | `NOT_FOUND` |
| Grammar-only absent Claim/Evidence targets | success |

Exact fixture count is an EXEC concern; themes above are mandatory coverage intent.

---

## 21. Conformance

| Track | Profile | Corpus |
|-------|---------|--------|
| SCI | `CONF-001@1.0.0` | REF-CORPUS-SCI (unchanged 44) |
| OPS | `CONF-001@1.1.0-OPS` | FULL = SCI + OPS (additive fixtures) |

No profile redesign. No new engines. Certification uses existing `CertificationEngine.certify(session_id, ConformanceReport)`.

---

## 22. Error Semantics

| Source | Propagation |
|--------|-------------|
| `VerificationValidationError` (F1…F13, F_TRANSITION, F_AI, …) | Unchanged — do not wrap |
| Persistence `NOT_FOUND` / `ALREADY_EXISTS` / `CONFLICT` / `IMMUTABLE_ENTITY` / `INVALID_ID` | Unchanged |
| ENC `CanonicalEncodingError` | Unchanged |
| OpsError | Only genuine operational command invalidity (`INVALID_COMMAND_STATE` for revision guards, decode kind mismatch, etc.) |

No new error taxonomy.

---

## 23. Determinism

| Concern | Rule |
|---------|------|
| Scientific ids | Caller-supplied `verification:…` |
| Revision ids | Caller-supplied `rev:…` |
| VTE `event_id` | Caller-supplied on certified OPS paths (`vte:…`) — Core may `randomUUID` if omitted (**forbidden on certified paths**) |
| Timestamps | Caller-supplied UTC seconds |
| Ops event ids | Deterministic from VTE id or identity+revision |
| Serialization / export / snapshots | Deterministic double-run |
| Fixtures | No `Date.now` / `Math.random` / `randomUUID` in Sprint 025 evidence path |

---

## 24. Explicit Non-Goals

Sprint 025 **SHALL NOT**:

- AI / LLM / RAG as authority or product layer
- Literature ingestion / DocumentArtifact / DOI-PMID typed model
- Knowledge Graph storage / Neo4j as authority
- Frontend / REST / GraphQL / public API
- Database / Redis / Kafka / SQL / CQRS / event sourcing redesign
- Distributed infrastructure / multi-user concurrency / durable Workspace
- Computational biology primitives / simulation
- New provenance framework (W3C PROV import, etc.)
- Second relationship graph / `Persistence.Relationship` scientific store
- Second event journal
- Claim Standing redesign / post-create `verified_via` / `qualified_by` setters
- Evidence / Contradiction / Negative Result / Grade redesign
- Verification material content OPS (`VerificationVersionService`)
- New Verification states, outcomes, methods, or gates
- ENC content changes (including AI markers)
- SCI fixture / `REF-CANON` edits
- CONF/CERT engine or profile changes
- Generic lifecycle / `postPersistTransition()`
- Processor redesign
- Pre-persist leave-planned on create
- Verification→Verification edges (unsupported by Core)

### Core-unsupported work that remains out of scope

| Item | Why |
|------|-----|
| Automatic Claim Standing update from Verification conclusion | Core does not define it |
| Reverse sync Claim↔Verification | Core does not define it |
| DocumentArtifact from `artifact_ref` | Opaque string only |
| Truth confirmation semantics | `truth_confirmed` forbidden (`F13`) |

---

## 25. Open Questions

| ID | Question | Classification | Resolution |
|----|----------|----------------|------------|
| **OQ-025-001** | `VerificationUnit` content omits `ai_assisted` / `human_sponsor` | **non-blocking** · requires later sprint (ENC/SCI) | **DEFERRED** — inherit OQ-023-002 / OQ-024-001; Sprint 025 SHALL NOT change ENC |
| **OQ-025-002** | Should OPS require referenced entities to exist before Verification create? | **non-blocking** | **CLOSED** — grammar-only; no Persistence existence check |
| **OQ-025-003** | Should certified fixtures demonstrate NR + Contradiction coexistence via optional refs? | **non-blocking** | **CLOSED** — YES recommended; optional refs; not architecture-blocking |
| **OQ-025-004** | Expose `VerificationVersionService` as OPS material-content path? | **non-blocking** · requires later sprint | **CLOSED** — non-goal for 025 |
| **OQ-025-005** | Offer pre-persist leave-planned on `registerVerificationUnit`? | **non-blocking** | **CLOSED** — not offered; leave-planned is post-persist only |
| **OQ-025-006** | Operational event type naming | **non-blocking** | **CLOSED** — `ops.verification_record_state_revision`, transition only, optional |
| **OQ-025-007** | Claim Standing post-create `verified_via` setter | **non-blocking** · requires later sprint (Core SCI-001) | **DEFERRED** — Core redesign; not Sprint 025 |
| **OQ-025-008** | Exact OPS create method name (`registerVerificationUnit` vs alternatives) | **non-blocking** | **CLOSED** — `registerVerificationUnit` (create-once naming parity with Claim/Contradiction/NR) |
| **OQ-025-009** | Stale-CAS fixture strategy for three terminals | **non-blocking** | **CLOSED** — mismatched `expected_head` while still `planned` |

**No architecture-blocking open question.**

---

## 26. Dependency Analysis

| Dependency | Available at baseline? |
|------------|------------------------|
| Claim OPS + Standing | YES (020) |
| Evidence OPS + Record State | YES (019–021) |
| Grade OPS | YES (022) |
| Contradiction OPS | YES (023) |
| Negative Result OPS | YES (024) |
| Model C Persistence | YES |
| CanonicalEncoder `VerificationUnit` | YES |
| SER-JSON `VerificationUnit` | YES |
| Processor Verification stages | YES (unused by OPS path) |
| Conformance `CONF-001@1.0.0` / `CONF-001@1.1.0-OPS` | YES |
| CertificationEngine | YES |
| ResearchSession / ResearchWorkspace / snapshots / timeline / membership | YES |

**Missing dependency:** OPS Verification path itself (the subject of this SPEC).

**Implementation-ready?** **YES** — all hard dependencies exist; soft NR-ref sequencing from DISCOVERY-024 is satisfied.

---

## 27. Change Budget

| Allowed now | Forbidden now |
|-------------|----------------|
| This SPEC file only | Source / tests / fixtures / migrations / certification / IMPLEMENTATION.md edits / Git commit / push |

Later authorized phases (when separately commanded): ARCHITECTURE-AUDIT → IMPLEMENTATION-DECISION → FINAL-RE-AUDIT → EXEC → CODE-AUDIT → FORMAL-CERT → GIT CLOSURE.

### Expected EXEC change surface (informative — not authorized)

- `apps/reference-app`: Verification register/transition/get/lineage/export + decode helper + deps + exports + marker sprint 25
- Additive `REF-OPS-134+` + TEST/SMOKE-025 scripts
- EXEC report / IMPLEMENTATION.md (exec phase only)
- Later certification artifacts (cert phase only)

**Explicitly unmodified:** `packages/core`, `persistence`, `encoding`, `serialization`, `processor`, `conformance`, `certification`.

---

## 28. Implementation Readiness

| Gate | Result |
|------|--------|
| Core Verification semantics documented from source | YES |
| Creation path identified (`createPlanned`) | YES |
| Post-persist leave-planned edges identified | YES |
| Model C mapping complete | YES |
| Reference / boundary / provenance rules closed | YES |
| ENC / SER / Processor sufficiency | YES |
| OPS API derived (not copied blindly from NR) | YES |
| Dependencies available | YES |
| Architecture-blocking OQs | **NONE** |
| Non-goals explicit | YES |

### Final status

**SPEC-025 — DRAFT — READY FOR ARCHITECTURE AUDIT**

Verification OPS under Model C is design-complete for independent architecture audit. It preserves Scientific Core as sole scientific authority, reuses certified Model C without fork, forbids second graph/journal, and closes Phase R1 research-semantics OPS coverage when executed under separate authorization.

| Item | Value |
|------|-------|
| Next authorized gate | ARCHITECTURE-AUDIT-025 (when separately commanded) |
| Implementation authorization | **NO** |
| Commit / push | **NONE** |

*End SPEC-025 — design only.*

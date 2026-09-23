# ARCHITECTURE-AUDIT-024 — SPEC-024

| Field | Value |
|-------|-------|
| Audit ID | ARCHITECTURE-AUDIT-024 |
| Subject | `specs/architecture/SPEC-024_negative_result_ops.md` |
| Spec status at audit | DRAFT — READY FOR ARCHITECTURE AUDIT |
| Baseline | `207365fb260b9e334bb60f16252ab3f445411dd6` (Sprint 023 certified + closed) |
| Mode | **READ-ONLY** |
| Discovery | `audits/roadmap/DISCOVERY-024_NEXT_RESEARCH_FRONTIER.md` |
| Does not authorize | EXEC, source/test changes, SPEC patches, certification, commit, push |

**Classification legend:** BLOCKER | REQUIRED PATCH | OBSERVATION | DEFERRED | NOT APPLICABLE

---

## 1. Audit Scope

Independent architecture audit of SPEC-024 — Negative Result OPS Under Model C — against:

- the certified Sprint 015–023 architecture (Model C, OPS post-persist pattern, CONF/CERT),
- the **actual** Core / ENC / SER / Persistence / OPS / REF / Processor source at the baseline commit,
- DISCOVERY-024.

**Question answered:** Can Negative Result OPS be introduced under the existing certified Model C architecture without creating a second scientific authority, without bypassing Core semantics, and without changing the certified ENC / Persistence / Conformance / Certification foundations?

This audit implements nothing, patches nothing, and authorizes no EXEC.

---

## 2. Baseline Verification

| Check | Result |
|-------|--------|
| `git rev-parse HEAD` | `207365fb260b9e334bb60f16252ab3f445411dd6` |
| `git rev-parse origin/main` | `207365fb260b9e334bb60f16252ab3f445411dd6` |
| HEAD == origin/main | YES |
| Certified commit | `cert(sprint-023): certify Contradiction OPS under Model C` |
| Working tree | Docs-only untracked: `DISCOVERY-024_NEXT_RESEARCH_FRONTIER.md`, `SPEC-024_negative_result_ops.md` (+ this audit after write) |
| Unexpected source / test / cert modifications | **NONE** |

### Certified corpus (repository evidence)

| Corpus | Claimed by SPEC-024 | Repository evidence | Verdict |
|--------|---------------------|---------------------|---------|
| SCI | 44/44 | SCI fixture families; CERTIFICATION-023 | **Verified** |
| OPS | 105/105 | `REF-OPS-001…105` in `fixtures/ops.ts` (last id `REF-OPS-105`) | **Verified** |
| FULL | 149/149 | SCI ∪ OPS; Sprint 023 formal certification | **Verified** |
| Profiles | `CONF-001@1.0.0`, `CONF-001@1.1.0-OPS` | `packages/conformance/src/profiles.ts` | **Verified** |
| Next free OPS id | `REF-OPS-106` | no `REF-OPS-106+` in corpus | **Verified** |

---

## 3. Source Verification

| Artifact | Role |
|----------|------|
| `specs/architecture/SPEC-024_negative_result_ops.md` | Subject |
| `audits/roadmap/DISCOVERY-024_NEXT_RESEARCH_FRONTIER.md` | Discovery input |
| `specs/architecture/SPEC-020…023`, `ADR-020` | Model C + post-persist precedents |
| `audits/certification/CERTIFICATION-023.md` | Prior certified OPS surface |
| `packages/core/src/negative-result/{types,identifiers,factory,transition-service,validator,reference-validator,event-builder,version-service,index}.ts` | NR Core authority |
| `packages/core/src/claim/{factory,transition-service,reference-validator}.ts` | `Claim.qualified_by` (creation-only) |
| `packages/encoding/src/{builder,registry,reference-resolver,types}.ts` | `NegativeResultUnit` |
| `packages/serialization/src/json/{encoder,decoder,validator,profile,registry}.ts` | SER-JSON registration |
| `packages/persistence/src/{entity,revision,repository,errors}.ts`, `memory/store.ts` | Model C, RevisionHead, CAS, journal, Relationship kind |
| `packages/processor/src/engines/{transition-engine,validation-engine}.ts`, `stages/create-stages.ts` | Processor NR path (non-OPS) |
| `apps/reference-app/src/operations/{research-operations,contradiction-from-unit}.ts`, `session/types.ts`, `errors/ops-error.ts` | OPS pattern / decode precedent / membership / errors |
| `packages/reference-tests/src/fixtures/{ops,negative-result}.ts` | REF corpus / SCI NR fixtures |
| `packages/conformance/src/{profiles,types}.ts`, `packages/certification/src/types.ts` | CONF / CERT |

**FACT:** `apps/reference-app` contains **no** Negative Result OPS symbols at HEAD (grep: zero matches). SPEC’s “OPS absent” claim is correct.

---

## 4. Core Authority

| Concern | SPEC-024 | Repository | Verdict |
|---------|----------|------------|---------|
| NR meaning | SCI-005, Core-owned (§5–§6) | `packages/core/src/negative-result/*` — sole implementation | **PASS** |
| Creation authority | `NegativeResultFactory.createRegistered(input, registration)` | `factory.ts` — only creation method; requires `to=registered`; delegates to `TransitionService.register` | **PASS** — correct name (not inventing `createDraft` / `createOpen`) |
| Transition authority | `NegativeResultTransitionService.transition` | `transition-service.ts` — `ALLOWED.registered = ["withdrawn"]`; `withdrawn = []` | **PASS** |
| Issuance transition | `register` / `(new)→registered` | Same service; factory calls `register`; not via `transition` | **PASS** |
| Validator | `NegativeResultValidator` | `validator.ts` — F1–F8, F11, F_AI, F_TRANSITION, F6 NRR-1 | **PASS** |
| Human-gate authority | `assertHumanReviewerGate` + `NegativeResultEventBuilder` | `transition-service.ts`, `event-builder.ts`, `identifiers.ts` | **PASS** |
| OPS invents legality? | Forbidden (§12.3) | Proposed chain calls Core before any `create`; Core errors propagate | **PASS** |
| Generic lifecycle | Rejected (§27) | Fifth explicit per-unit pair after Claim/Evidence/Grade/Contradiction | **PASS** |

**Scientific authority violations:** **NONE**.

---

## 5. Negative Result State Model

| Concern | SPEC | Source | Verdict |
|---------|------|--------|---------|
| Vocabulary | `registered` \| `withdrawn` | `NEGATIVE_RESULT_RECORD_STATES` exactly | **PASS** |
| Initial state | `registered` via issuance | `createRegistered` → `record_state: "registered"` + NRTE `null→registered` | **PASS** |
| Legal post-persist edge | `registered → withdrawn` | `ALLOWED` table | **PASS** |
| Terminal | `withdrawn` | empty allowed set | **PASS** |
| Forbidden states | Standing/Contradiction/Verification/workflow etc. | `FORBIDDEN_NEGATIVE_RESULT_RECORD_STATES` | **PASS** |
| Invented states | None | None | **PASS** |
| `withdrawal_reason` | Required on withdraw (`F7`) | Gate + validator | **PASS** |
| SemVer on transition | Unchanged | `transition` does not bump `negative_result_version` | **PASS** |

No SPEC state absent from Core. No Core state remapped.

---

## 6. Human-Gated Creation

| Gate element | SPEC | Source | Verdict |
|--------------|------|--------|---------|
| Creation method | `createRegistered(input, registration)` | `factory.ts` | **PASS** |
| `registration.to` | Must be `registered` | `F_TRANSITION` if not | **PASS** |
| Human agent | `/^human:[A-Za-z0-9._~-]{1,128}$/` | `NEGATIVE_RESULT_HUMAN_REVIEWER` / `isNegativeResultHumanReviewerAgent` | **PASS** |
| Non-human | Core `F5` | Exact messages match SPEC §8.1 | **PASS** |
| `decision_ref` | Non-empty (gate) | Type optional; gate requires non-empty → `F_TRANSITION` | **PASS** |
| `withdrawal_reason` | Required when withdrawing | Gate `F7` | **PASS** |
| NRR-1 | Human NRTE to `registered` required in lineage | Validator `F6` | **PASS** |
| OPS bypass | Forbidden | Registration is a required Core argument; OPS must pass it through | **PASS** |
| OPS-only replacement gate | Forbidden | No OPS scientific gate defined | **PASS** |
| Failure before persist | Core throws before `create` | Chain ordering in §13 | **PASS** |

**AI / sponsor markers:** `ai_assisted` + `human_sponsor` (`F_AI`) correctly documented as Core-optional and ENC-lossy; gates do not depend on them. **PASS**.

---

## 7. Model C Compliance

| Element | SPEC | Certified contract | Verdict |
|---------|------|--------------------|---------|
| Scientific identity stable | `negative_result_id` | Model C / SCI-005 | **PASS** |
| Revision key | `persist:CanonicalUnit:NegativeResultUnit:{id}:{revision_id}` | `makeCanonicalUnitRevisionStorageKey` | **PASS** |
| Head key | `persist:RevisionHead:NegativeResultUnit:{id}` | `makeRevisionHeadStorageKey` | **PASS** |
| Initial | `rev:initial` | `INITIAL_REVISION_ID` | **PASS** |
| Later | caller `rev:*` | `assertRevisionId` | **PASS** |
| Lineage | `predecessor_revision_id` | `entityFromCanonicalUnit` | **PASS** |
| CAS / CONFLICT | `advanceHead` | store CAS | **PASS** |
| Immutability | old revisions immutable | `IMMUTABLE_ENTITY` | **PASS** |
| Kind map | `NegativeResultUnit → CanonicalUnit` | `entity.ts` lines 187–188 | **PASS** |
| Redesign of Model C | None | None proposed | **PASS** |

Model C is reused, not altered.

---

## 8. Creation Flow

Normative SPEC chain (verified against Contradiction/Claim precedents):

```
registerNegativeResultUnit(input, registration, options?)
  → NegativeResultFactory.createRegistered(input, registration)  // sole creation validity + Human gate
  → CanonicalEncoder.assemble → NegativeResultUnit
  → entityFromCanonicalUnit(unit, { revision_id: "rev:initial" })
  → repository.create → repository.ensureInitialHead(id, "NegativeResultUnit", "rev:initial")
  → return { negativeResult, unit, entity }
```

| Check | Verdict |
|-------|---------|
| Core remains authoritative | **PASS** |
| No scientific mutation after creation | **PASS** — persist stores already-authoritative artifact |
| Initial revision deterministic | **PASS** — `rev:initial` only; non-initial → `OpsError` |
| Create emits no operational event | **PASS** — explicit; parity with Claim/Evidence/Contradiction create |
| Membership explicit (not inside create) | **PASS** |
| Required `registration` arg (differs from Contradiction `createOpen`) | **PASS** — correctly pinned to Core API shape |
| Pre-persist withdrawal option | Correctly **excluded** (OQ-024-005 CLOSED) | **PASS** |

Parity with certified create-once pattern: **PASS** (with justified second-arg difference).

---

## 9. Post-Persist Transition

| Question | Answer from source |
|----------|-------------------|
| Does Core have post-persist transition? | **YES** — `NegativeResultTransitionService.transition` |
| Sole legal edge | `registered → withdrawn` |
| Invented by SPEC? | **NO** |

SPEC chain:

```
transitionNegativeResultRecordState
  → getNegativeResultUnit (head-resolved)
  → negativeResultFromNegativeResultUnitPayload
  → NegativeResultTransitionService.transition
  → CanonicalEncoder.assemble
  → entityFromCanonicalUnit(..., predecessor_revision_id)
  → repository.create → advanceHead (CAS) → optional appendEvent
```

| Check | Verdict |
|-------|---------|
| Decode → Core → ENC → create → CAS | **PASS** — matches SPEC-021/023 |
| Partial-write honesty | **PASS** — orphan revision allowed; no scientific rollback claimed |
| Terminal re-transition | Core `F_TRANSITION` before create | **PASS** |
| Ops event only after successful CAS | **PASS** (§17) |

**Critical gate:** PASS — transition is not invented; it is Core-owned and correctly exposed under Model C.

---

## 10. Reference Semantics

| Field | Core | ENC role | SPEC handling | Verdict |
|-------|------|----------|---------------|---------|
| `claim_refs` | Claim id grammar (`F8`) | `qualifies_or_challenges` | grammar-only; no dereference | **PASS** |
| `evidence_refs` | Evidence id (`F8`) | `cites_evidence` | same | **PASS** |
| `contradiction_refs` | Contradiction id (`F8`) | `related_contradiction` | same; may cite OPS-persistable Contradiction after 023 | **PASS** |
| `verification_refs` | opaque non-empty (Core); ENC requires `verification:` | `related_verification` | asymmetry documented (§11.4 / OQ-024-003) | **PASS** |

| Forbidden pattern | SPEC | Verdict |
|-------------------|------|---------|
| `Persistence.Relationship` scientific store | Forbidden (§11.2); T-23 | **PASS** |
| Reverse sync Claim.`qualified_by` | Forbidden (§11.5) | **PASS** |
| Second graph | Forbidden | **PASS** |
| Membership = scientific refs | Explicitly not | **PASS** |

`Claim.qualified_by`: creation-only on `CreateClaimInput`; `StandingTransitionInput` has `supported_by` / `contested_by` only — **no** `qualified_by`. SPEC coexistence theme T-13 correctly uses Claim create, not Standing. **PASS**.

---

## 11. ENC Boundary

| Concern | Evidence | Verdict |
|---------|----------|---------|
| Unit kind exists | `"NegativeResultUnit"` in ENC types / builder / registry | **PASS** |
| `buildNegativeResult` complete | content, refs, NRTE events | **PASS** |
| Detection | `"negative_result_id" in o && "expected_observation" in o` | **PASS** (SPEC §10.1 “related shape” — see O-024-06) |
| AI markers omitted from content | Confirmed in builder (same OQ-023-002 class) | **PASS** / deferred |
| SPEC modifies ENC? | Explicitly no | **PASS** |
| Support sufficient for OPS? | Yes — SCI REF-CANON already exercises assemble | **PASS** |

No missing ENC prerequisite. No silent ENC redesign permitted.

---

## 12. Processor Boundary

| Concern | Evidence | Verdict |
|---------|----------|---------|
| Processor NR support exists | `negative_result.record_transition`, validation/version engines | **FACT** |
| OPS uses Processor? | SPEC §20: **no** — OPS calls Core directly | **PASS** — identical to Claim/Evidence/Contradiction OPS |
| OPS-local decode | Projection only; Core validates transitioned output | **PASS** |
| Bypass of Core? | No — Core `transition` still authoritative | **PASS** |

Processor remains unused by OPS for this path by certified precedent. Not a blocker.

---

## 13. Serialization Boundary

| Concern | Evidence | Verdict |
|---------|----------|---------|
| SER-JSON `NegativeResultUnit` | registry, profile, validator, encoder, decoder | **PASS** |
| Role mappings | `qualifies_or_challenges` → `claim_refs`, etc. | **PASS** |
| New profile required? | No | **PASS** |
| Export path | Reuse `JsonEncoder.encode(entity.payload)` | **PASS** |

SER support is sufficient. No expansion needed.

---

## 14. Persistence Boundary

| Allowed | Used by SPEC? | Verdict |
|---------|---------------|---------|
| create / get / listRevisions | Yes | **PASS** |
| ensureInitialHead / advanceHead | Yes | **PASS** |
| appendEvent (sole journal) | Optional ops citation only | **PASS** |
| Scientific update / replace-as-mutation | No | **PASS** |
| Second journal | No | **PASS** |
| DB adapter / CQRS / event sourcing | No | **PASS** |
| New relationship authority | Forbidden | **PASS** |
| Partial-write honesty | Explicit | **PASS** |

No Persistence redesign.

---

## 15. Membership / Snapshot Boundary

| Concern | Verdict |
|---------|---------|
| Member ref shape unchanged | **PASS** — `{ entity_kind: "CanonicalUnit", unit_kind: "NegativeResultUnit", identity }` |
| Create/transition do not register membership | **PASS** |
| Scientific refs ≠ membership | **PASS** |
| ResearchSnapshot / WorkspaceSnapshot frozen | **PASS** — additive persistence content only |
| Timeline projects member journal events | **PASS** — existing behaviour |

---

## 16. Event Boundary

| Concern | Verdict |
|---------|---------|
| Scientific history = NRTE | **PASS** |
| Ops event type | `ops.negative_result_record_state_revision` — operational only | **PASS** |
| Deterministic ops `event_id` | `ops:{nrte id}` or identity+revision formula | **PASS** |
| Create-once ops event | None | **PASS** |
| Second journal | Forbidden | **PASS** |
| Core `randomUUID` fallback when NRTE `event_id` omitted | Documented; forbidden on certified OPS paths | **PASS** (see O-024-02) |

---

## 17. Error Semantics

| Category | SPEC reuse | Verdict |
|----------|------------|---------|
| Core `NegativeResultValidationError` codes | F1–F8, F11, F_AI, F_TRANSITION, F5/F6/F7 | **PASS** |
| Persistence | INVALID_ID, NOT_FOUND, ALREADY_EXISTS, CONFLICT, IMMUTABLE_ENTITY | **PASS** |
| ENC | CanonicalEncodingError propagate | **PASS** |
| OPS | Existing `OpsError INVALID_COMMAND_STATE` only | **PASS** |
| New error taxonomy | None | **PASS** |
| Propagation before persist | Core/ENC before create | **PASS** |

---

## 18. Reference Test Boundary

| Check | Result |
|-------|--------|
| Next free id | **`REF-OPS-106`** verified (highest existing `REF-OPS-105`) |
| Themes T-01…T-24 | Inside SPEC-024 scope (create, gates, withdraw, Model C, refs, membership, snapshots, events, Relationship non-use, regression) |
| Out-of-scope tests | None proposed (no Verification OPS, no material VersionService, no ENC change) |
| SCI frozen | Explicit — 44/44 unchanged | **PASS** |
| Authorities | OPS-001 (+ SCI-005 / ENC-001 where asserting through OPS) | **PASS** |

---

## 19. Conformance

| Item | Verdict |
|------|---------|
| Reuse `CONF-001@1.1.0-OPS` | **PASS** — profile already recognizes `REF-OPS-` / `OPS-001` |
| SCI `CONF-001@1.0.0` unchanged | **PASS** |
| New profile | Not required | **PASS** |
| One ConformanceEngine | **PASS** |
| `SCI-005` already in SCI authorities | **PASS** (`conformance/types.ts`) |

---

## 20. Certification

| Item | Verdict |
|------|---------|
| Existing CertificationEngine | **PASS** |
| `CERTIFICATION_SCOPE_OPS` includes SCI-005 + OPS-001 | **PASS** |
| New cert engine / semantics | None | **PASS** |
| Proposed REF evidence sufficient for later formal cert | **YES** — themes cover create, Human gates, withdraw, CAS, determinism, Relationship non-use, coexistence |
| Cert artifacts generated now? | No (correct) | **PASS** |

---

## 21. Determinism

| Concern | Verdict |
|---------|---------|
| Caller-supplied scientific IDs | **PASS** |
| Caller-supplied revision IDs | **PASS** |
| Caller-supplied NRTE ids on certified paths | **PASS** (required) |
| Deterministic ops event ids | **PASS** |
| Deterministic export / lineage sort | **PASS** |
| Forbidden RNG/time on OPS paths | **PASS** |
| Inherited Core UUID fallback | Documented; out of certified path | **PASS** |

---

## 22. Security

| Concern | Verdict |
|---------|---------|
| New trust boundary | None beyond existing Core Human Reviewer | **PASS** |
| Arbitrary payload execution | None | **PASS** |
| Unvalidated identifiers | Core/ENC/Persistence grammars | **PASS** |
| Human-gate bypass | Forbidden; REF themes T-03/T-08 | **PASS** |
| Hidden writes | Create/transition surfaces explicit; membership/events separate | **PASS** |
| Privilege / authz redesign | None | **PASS** |
| Secrets handling | N/A | **NOT APPLICABLE** |

---

## 23. Scope Integrity

| Excluded area | SPEC excludes? | Verdict |
|---------------|----------------|---------|
| Verification OPS | Yes (§27) | **PASS** |
| Literature / DocumentArtifact | Yes | **PASS** |
| AI / KG / Search / Comp Bio | Yes | **PASS** |
| Python / Nextflow / PG / object storage / OpenSearch / Neo4j | Yes | **PASS** |
| Distributed / multi-user / durable Workspace | Yes | **PASS** |
| Frontend / API / FHIR | Yes | **PASS** |
| Claim Standing redesign | Yes | **PASS** |
| Evidence / Grade / Contradiction redesign | Yes | **PASS** |
| ENC / SER / Persistence / CONF / CERT redesign | Yes | **PASS** |
| Material VersionService OPS | Yes (OQ-024-004) | **PASS** |
| Generic lifecycle | Yes | **PASS** |

Architectural coherence invariants:

| Invariant | Preserved? |
|-----------|------------|
| ONE scientific truth (Core) | **YES** |
| ONE Persistence model (Model C) | **YES** |
| ONE operational event journal | **YES** |
| ONE ConformanceEngine | **YES** |
| ONE CertificationEngine | **YES** |
| NO second scientific graph | **YES** |
| Pattern parity with Claim/Evidence/Grade/Contradiction OPS | **YES** (fifth explicit per-unit path) |

---

## 24. Open Questions

| ID | Real uncertainty? | Answerable from source now? | Blocks audit? | Blocks impl? | Audit disposition |
|----|-------------------|-----------------------------|---------------|--------------|-------------------|
| OQ-024-001 | ENC AI-marker omission | Yes (confirmed omitted) | No | No | **DEFERRED** — ENC/SCI discovery; inherits OQ-023-002 |
| OQ-024-002 | Persistence existence rule for refs | Yes — Core/ENC grammar-only | No | No | **CLOSED correctly** — no SPEC patch needed |
| OQ-024-003 | Core opaque vs ENC `verification:` | Yes — asymmetry exists | No | No | **CLOSED for Sprint 024** — document + fixture discipline sufficient |
| OQ-024-004 | Material VersionService OPS | Yes — exists; out of scope pattern | No | No | **CLOSED** — non-goal |
| OQ-024-005 | Pre-persist withdraw on register | Yes — no certified NR precedent | No | No | **CLOSED** — correctly excluded |
| OQ-024-006 | Ops event naming | Naming choice only | No | No | **CLOSED** — consistent with 020–023 pattern |
| OQ-024-007 | Claim Standing `qualified_by` setter | Yes — StandingTransitionInput lacks field | No | No | **DEFERRED** — Core SCI-001; not Sprint 024 |

No OQ blocks architecture audit. No OQ must be “resolved by SPEC rewrite” before EXEC beyond what SPEC already closed.

---

## 25. Findings

### Blockers — **0**

No second authority, graph, or journal; Model C intact; Core create/transition reused exactly; Human gates preserved; identity and determinism defined; no unauthorized ENC/SCI change; `Persistence.Relationship` not required for correctness.

### Required patches — **0**

No SPEC statement contradicts source. All named Core APIs exist. New OPS symbols are explicitly marked and mirror certified Contradiction/Claim patterns. Create signature correctly accounts for Core `createRegistered(input, registration)`.

### Observations — **6** (Implementation Decision discipline; no SPEC rewrite required)

| ID | Observation | Direction for IMPLEMENTATION-DECISION-024 |
|----|-------------|-------------------------------------------|
| **O-024-01** | `queryRelationships` may return `CanonicalUnit` rows with mirrored envelope references; T-23 parenthetical could be misread as “queryRelationships empty”. | Fixture SHALL assert `list({ filter: { entity_kind: "Relationship" } }).total === 0` (parity with O-023-01 / REF-OPS-102). |
| **O-024-02** | Inherited `NegativeResultEventBuilder` `randomUUID` fallback when `event_id` omitted (Core; unchanged). | Every Sprint 024 fixture / smoke / TEST path SHALL supply `nrte:` `event_id` on registration and withdrawal. |
| **O-024-03** | `entityFromCanonicalUnit` mirrors envelope references into `PersistenceEntity.references` (non-authoritative). | Fixtures asserting refs SHALL read ENC payload / decoded object, not `entity.references`. |
| **O-024-04** | `ResearchOperationsDeps` gains two required fields; `referenceAppMarker.sprint` → 24. | Same safety as 022/023: only `createResearchOperations` constructs full deps; `smoke-016` partial deps never calls NR methods; marker checks use `>=`/`<`. |
| **O-024-05** | Create API is three-argument `(input, registration, options?)` — first OPS create that requires a Core transition input at issuance (unlike Contradiction `createOpen`). | ID SHALL pin call sites, fixture helpers, and smoke to always pass Human registration with `to: "registered"`. |
| **O-024-06** | SPEC §10.1 detection prose says `"negative_result_id" in o (and related shape)`; exact registry also requires `"expected_observation" in o`. | ID SHALL cite exact `detectKind` predicate; no ENC change. |

### Deferred — **3**

| ID | Item | Routing |
|----|------|---------|
| D-024-01 | OQ-024-001 — ENC omits `ai_assisted` / `human_sponsor` | Separate ENC/SCI discovery |
| D-024-02 | OQ-024-007 — Claim Standing post-create `qualified_by` | Core SCI-001 redesign |
| D-024-03 | OQ-024-004 / material VersionService OPS | Future cross-cutting material-content sprint |
| (inherited) | O-020-01 predecessor existence check at `create` | unchanged since Sprint 020 |

### Not applicable

Snapshot redesign; new CONF profile; new CERT scope; migration; Verification OPS; Literature/AI/KG/search/durable infra; secrets handling.

---

## 26. Required Patches

**NONE.**

---

## 27. Observations

See §25 observations O-024-01…O-024-06. None require SPEC rewrite before FINAL-ARCHITECTURE-RE-AUDIT. All are Implementation Decision / fixture discipline items of the same class accepted for SPEC-023.

---

## 28. Implementation Readiness

| Gate | State |
|------|-------|
| Architecture coherence | **PASS** |
| Discovery consistency | **PASS** — DISCOVERY-024 JUSTIFIED NEXT = NR OPS; SPEC closes create + withdraw under Model C |
| Core authority / exact transition reuse | **PASS** |
| Human gates preserved | **PASS** |
| Model C / Persistence / ENC / SER | **PASS** |
| Relationship boundary | **PASS** (with O-024-01 fixture precision) |
| REF / CONF / CERT | **PASS** |
| Precision for Implementation Decision | **Sufficient** |
| EXEC authorization | **NO** (not this audit’s role) |

**Implementation readiness classification:**

### APPROVED WITH OBSERVATIONS

- BLOCKERS = 0  
- REQUIRED PATCHES = 0  
- Non-blocking observations exist (O-024-01…06)

**Next authorized action:** IMPLEMENTATION-DECISION-024 (design-only), then **FINAL-ARCHITECTURE-RE-AUDIT-024**, then EXEC-024 only if separately authorized.

**READY FOR FINAL ARCHITECTURE RE-AUDIT** — after IMPLEMENTATION-DECISION-024 closes observation discipline (same process as Sprint 023).

---

## 29. Final Verdict

SPEC-024 is architecturally coherent with the certified AIP stack. It reuses `NegativeResultFactory.createRegistered` and `NegativeResultTransitionService.transition` exactly, keeps Core as sole Negative Result authority, preserves Human Reviewer gates at registration and withdrawal, applies certified Model C to `unit_kind = "NegativeResultUnit"` without any new Persistence primitive, represents scientific references solely through the existing `NegativeResultUnit` envelope, forbids `Persistence.Relationship` as scientific storage, leaves Claim Standing untouched while making `qualified_by` targets persistable, documents the pre-existing Core/ENC `verification_refs` asymmetry without expanding scope, defers ENC AI-marker restoration, and remains under `CONF-001@1.1.0-OPS` with single Conformance and Certification engines. The proposed `registerNegativeResultUnit` / `transitionNegativeResultRecordState` pair is a faithful fifth instance of the certified per-unit Model C orchestration pattern, not a generic engine.

---

ARCHITECTURE-AUDIT-024 FINAL VERDICT
====================================

SPEC-024:
APPROVED WITH OBSERVATIONS

Negative Result authority:
Scientific Core (SCI-005 / `NegativeResultFactory.createRegistered` + `NegativeResultTransitionService.transition`) remains sole semantic authority; OPS orchestrates only.

Record State vocabulary:
UNCHANGED (`registered`, `withdrawn`); Human gates `F5`, `decision_ref`, `withdrawal_reason` `F7`, NRR-1 `F6` preserved.

References:
Carried only in the `NegativeResultUnit` envelope; grammar-only (Verification ENC asymmetry documented); not dereferenced; `Persistence.Relationship` NOT used as scientific storage.

Claim.qualified_by:
COMPATIBLE — creation-only Core semantics unchanged; Negative Result identity becomes persistable; no reverse synchronization; no second graph.

Model C:
COMPATIBLE — exact reuse.

Persistence:
UNCHANGED

ENC:
UNCHANGED — AI-marker omission correctly DEFERRED (OQ-024-001)

SER:
UNCHANGED

Determinism:
PASS

Events:
PASS

Snapshots:
PASS

Conformance:
`CONF-001@1.1.0-OPS` unchanged — additive `REF-OPS-106+`

Certification:
Existing CertificationEngine — no new engine

BLOCKERS:
0

REQUIRED PATCHES:
0

OBSERVATIONS:
6 (O-024-01…06)

DEFERRED:
OQ-024-001 · OQ-024-007 · material VersionService OPS

Next gate:
IMPLEMENTATION-DECISION-024 → FINAL-ARCHITECTURE-RE-AUDIT-024

EXEC authorization:
NO

*End ARCHITECTURE-AUDIT-024 — read-only. No SPEC patch. No implementation. No commit. No push.*

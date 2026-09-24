# ARCHITECTURE-AUDIT-025 — SPEC-025 Verification OPS Under Model C

| Field | Value |
|-------|-------|
| Audit ID | ARCHITECTURE-AUDIT-025 |
| Subject | `specs/architecture/SPEC-025_verification_ops.md` |
| Spec status at audit | DRAFT — READY FOR ARCHITECTURE AUDIT |
| Baseline | `47efca41c429c5de8bfc96da4c06082bc4c1e91c` (Sprint 024 certified + closed) |
| Mode | **READ-ONLY** |
| Discovery | `audits/roadmap/DISCOVERY-025_NEXT_RESEARCH_FRONTIER.md` |
| Does not authorize | EXEC, source/test changes, SPEC patches, certification, commit, push |

**Classification legend:** BLOCKER | REQUIRED PATCH | OBSERVATION | DEFERRED | NOT APPLICABLE

**Primary question:** Does SPEC-025 faithfully derive a safe Verification OPS design from existing Scientific Core Verification semantics and the certified Model C / OPS architecture — without copying Claim/Evidence/Contradiction/Negative Result patterns where Core differs?

**Answer: YES** — with non-blocking observations only.

---

## 1. Baseline

| Check | Result |
|-------|--------|
| `git rev-parse HEAD` | `47efca41c429c5de8bfc96da4c06082bc4c1e91c` |
| Certified commit | `cert(sprint-024): certify Negative Result OPS under Model C` |
| Sprint 024 | FORMALLY CLOSED |
| Working tree | Docs-only untracked: `DISCOVERY-025_NEXT_RESEARCH_FRONTIER.md`, `SPEC-025_verification_ops.md` (+ this audit after write) |
| Unexpected source / test / cert modifications | **NONE** |

### Certified corpus (repository evidence)

| Corpus | Claimed by SPEC-025 | Repository evidence | Verdict |
|--------|---------------------|---------------------|---------|
| SCI | 44/44 | CERTIFICATION-024 / SCI fixtures | **Verified** |
| OPS | 133/133 | `REF-OPS-001…133` (last id `REF-OPS-133`) | **Verified** |
| FULL | 177/177 | SCI ∪ OPS | **Verified** |
| Profiles | `CONF-001@1.0.0`, `CONF-001@1.1.0-OPS` | `packages/conformance/src/profiles.ts` | **Verified** |
| Next free OPS id | `REF-OPS-134` | no `REF-OPS-134+` in corpus | **Verified** |

---

## 2. Scope

Independent architecture audit of SPEC-025 against:

- certified Sprint 015–024 architecture (Model C, OPS post-persist pattern, CONF/CERT),
- **actual** Core / ENC / SER / Persistence / OPS / REF / Processor source at baseline,
- DISCOVERY-025.

**In-scope subject:** Verification create-once + leave-planned Record State OPS under Model C.

**Not audited as authorization:** EXEC-025, IMPLEMENTATION-DECISION-025, source patches.

### Source inspected

| Artifact | Role |
|----------|------|
| `specs/architecture/SPEC-025_verification_ops.md` | Subject |
| `audits/roadmap/DISCOVERY-025_NEXT_RESEARCH_FRONTIER.md` | Discovery input |
| `packages/core/src/verification/{types,identifiers,factory,transition-service,validator,reference-validator,event-builder,version-service}.ts` | Verification Core authority |
| `packages/core/src/claim/{factory,transition-service,reference-validator}.ts` | `Claim.verified_via` (creation-only) |
| `packages/encoding/src/{builder,registry,validator}.ts` | `VerificationUnit` |
| `packages/serialization/src/json/**` | SER-JSON registration |
| `packages/persistence/src/entity.ts` | Model C kind map |
| `packages/processor/src/**` | Processor Verification path (non-OPS) |
| `apps/reference-app/src/operations/research-operations.ts` | Certified OPS patterns (Claim…NR) |
| `packages/reference-tests`, `packages/conformance`, `packages/certification` | REF / CONF / CERT |

**FACT:** `apps/reference-app` contains **no** Verification OPS symbols at HEAD (grep: zero matches). SPEC’s “OPS absent” claim is correct.

---

## 3. Core Verification Authority

| Concern | SPEC-025 | Repository | Verdict |
|---------|----------|------------|---------|
| Meaning | SCI-006; Core-owned | `packages/core/src/verification/*` sole implementation | **PASS** |
| Factory | `VerificationFactory.createPlanned` | Confirmed | **PASS** |
| Transitions | `VerificationTransitionService.transition` | Confirmed | **PASS** |
| Validator / refs / VTE | Core-owned | Confirmed | **PASS** |
| OPS as scientific authority | Forbidden | SPEC §3–§4 | **PASS** |
| Parallel OPS state machine | Forbidden | SPEC forbids invented vocabulary | **PASS** |

SPEC correctly identifies Core as sole scientific authority. OPS is orchestration only. **PASS**.

---

## 4. Creation Semantics

| Concern | SPEC-025 | Source | Verdict |
|---------|----------|--------|---------|
| Mode | Ungated `createPlanned` → `planned` / `pending` | `factory.ts` / `transition-service.ts` `createPlanned` | **PASS** |
| Not draft / registered / open | Explicitly distinguished; analogy to Contradiction `createOpen` only | No `draft`/`registered` Verification states | **PASS** |
| Not NR `createRegistered` | Explicit non-equivalence notice | NR requires Human registration NRTE; Verification create has empty VTE log | **PASS** |
| Arguments | Single `CreateVerificationInput` | `createPlanned(input)` | **PASS** |
| Human gate at create | **None** | Gate only in `assertHumanReviewerGate` when `leavesPlanned` | **PASS** |
| Initial VTE log | Empty `[]` | `record_transition_log: Object.freeze([])` | **PASS** |
| ADM-T1 at create | Via `validate` | `assertTargetRule` / F6 | **PASS** |
| OPS API | `registerVerificationUnit(input, options?)` | New OPS symbol; create-once naming parity justified | **PASS** |

SPEC does **not** copy Negative Result’s `(input, registration)` Human-gated create. **PASS**.

---

## 5. Record State / Transition Semantics

| Concern | SPEC-025 | Source (`ALLOWED` / `OUTCOME_FOR`) | Verdict |
|---------|----------|-------------------------------------|---------|
| States | `planned` \| `passed` \| `failed` \| `inconclusive` | `VERIFICATION_RECORD_STATES` | **PASS** |
| Outcomes | Coupled `pending`/`passed`/`failed`/`inconclusive` | `OUTCOME_FOR`; mismatch → `F5` | **PASS** |
| Edges | `planned → {passed,failed,inconclusive}` | Exact `ALLOWED.planned` | **PASS** |
| Terminals | Concluded states empty successors | `ALLOWED[passed|failed|inconclusive] = []` | **PASS** |
| Human gate | Leave-planned: Human + `decision_ref` → `F7` / `F_TRANSITION` | `assertHumanReviewerGate` | **PASS** |
| VRR-1 | Concluded requires matching Human VTE | Validator `F8` | **PASS** |
| Invented states | Forbidden | SPEC §6 / §24 | **PASS** |

No borrowed NR (`registered`/`withdrawn`) or Contradiction (`open`/resolved*) vocabulary. **PASS**.

Leave-planned changes `record_state`, `verification_outcome`, and VTE log → canonical content changes → Model C successor revision **required**. SPEC derives this correctly (not “every transition blindly”). **PASS**.

---

## 6. Model C Compatibility

| Concern | SPEC-025 | Repository | Verdict |
|---------|----------|------------|---------|
| Keys | `persist:CanonicalUnit:VerificationUnit:…` / `persist:RevisionHead:VerificationUnit:…` | Generic Model C + kind map | **PASS** |
| Kind map | `VerificationUnit → CanonicalUnit` | `entity.ts` | **PASS** |
| `rev:initial` / successor / predecessor / CAS / CONFLICT | Reused verbatim | Certified 020–024 pattern | **PASS** |
| Partial-write honesty | Documented | Same create-then-CAS honesty | **PASS** |
| SemVer ≠ revision_id | Trichotomy documented | Core leave-planned does not bump SemVer | **PASS** |
| Global Model C mutation | Forbidden | SPEC change budget | **PASS** |
| Stale CAS while planned | OQ-025-009 CLOSED | Required: no second legal Core edge after conclude | **PASS** |

**PASS** — no Model C fork.

---

## 7. Reference Semantics

| Ref | SPEC | Source | Verdict |
|-----|------|--------|---------|
| `claim_refs` | ENC `verifies_claim`; grammar-only | `builder.ts` / `reference-validator.ts` | **PASS** |
| `evidence_refs` | ENC `verifies_evidence`; grammar-only | same | **PASS** |
| `grade_refs` | ENC `grade_ref` Extension | same | **PASS** |
| `contradiction_refs` | ENC `related_contradiction` | same | **PASS** |
| `negative_result_refs` | ENC `related_negative_result`; OPS-persistable after 024 | same | **PASS** |
| `artifact_ref` | Opaque **content** field; not ENC reference; not DocumentArtifact | `builder.ts` content only | **PASS** |
| Verification→Verification | None; out of scope | No Core field | **PASS** |
| Target existence | Not required (OQ-025-002 CLOSED) | Core/ENC grammar-only | **PASS** |
| `Persistence.Relationship` | Forbidden as scientific store | SPEC §9.4 | **PASS** |
| New relationship primitive | Not required | Existing Core+ENC sufficient | **PASS** |

**PASS**.

---

## 8. Claim / Evidence Boundary

| Interaction | SPEC | Source | Verdict |
|-------------|------|--------|---------|
| Changes Claim Standing | NO | Orthogonal ADR-0006 | **PASS** |
| Creates `contested_by` | NO | Contradiction-owned | **PASS** |
| Changes Evidence / Grade / Contradiction / NR state | NO | Citation only | **PASS** |
| Reverse sync `verified_via` | Forbidden | `StandingTransitionInput` lacks `verified_via`/`qualified_by`; transition preserves prior only | **PASS** |
| Coexistence Claim `verified_via` at create | Allowed | `CreateClaimInput.verified_via` + grammar | **PASS** |

No invented bidirectional sync. **PASS**.

---

## 9. Provenance Boundary

Axes remain separated (scientific provenance + VTE; ops journal; `artifact_ref` locator; Model C lineage; membership). No new provenance framework required. SPEC correctly refuses to solve packaging inside OPS. **PASS**.

---

## 10. ENC

| Concern | Verdict |
|---------|---------|
| `VerificationUnit` exists | **PASS** |
| Content fields sufficient for OPS | **PASS** |
| Envelope refs sufficient | **PASS** |
| `ai_assisted`/`human_sponsor` omitted from content | **PASS** (documented; OQ-025-001 deferred; not a blocker) |
| ENC redesign required? | **NO** |

---

## 11. SER

`VerificationUnit` registered in SER-JSON encoder/decoder/validator/profile. Export reuses `JsonEncoder`. No second serializer. **PASS**.

---

## 12. Processor

Processor has Verification record-transition stages. SPEC correctly states OPS calls Core directly (020–024 parity), not Processor. Decode helper reconstructs from CanonicalUnit only — non-authoritative. **PASS**.

---

## 13. Persistence

Only create / get / ensureInitialHead / advanceHead / listRevisions / appendEvent / snapshot. No mutable scientific replace, DB, CQRS, second journal. **PASS**.

---

## 14. OPS API Surface

| API | Necessity | Core call | Verdict |
|-----|-----------|-----------|---------|
| `registerVerificationUnit` | Required create-once | `createPlanned` | **PASS** |
| `transitionVerificationRecordState` | Required leave-planned | `transition` | **PASS** |
| get / lineage / export helpers | Required read/export parity | none (read) | **PASS** |
| Decode helper | Required reconstruction | none | **PASS** |
| Material VersionService OPS | Explicitly out of scope | — | **PASS** |
| Pre-persist leave-planned | Explicitly not offered | — | **PASS** |

No unnecessary APIs that duplicate lower-layer authority. Create signature correctly single-arg (not NR two-arg). **PASS**.

---

## 15. Events

Optional `ops.verification_record_state_revision` on leave-planned only; create-once silent; operational-only; deterministic id rules; sole journal. VTE remains scientific in ENC. **PASS**.

---

## 16. Membership / Snapshots / Timeline

Explicit membership; no auto-register on create/transition; ResearchSnapshot frozen; WorkspaceSnapshot additive; membership ≠ scientific relationship. **PASS**.

---

## 17. Export

CanonicalEncoder + existing SER-JSON; deterministic double-run required. **PASS**.

---

## 18. Reference Tests

Additive `REF-OPS-134+`; no SCI/`REF-OPS-001…133` rewrites; `CONF-001@1.1.0-OPS`; single engines. Fixture themes cover create, ADM-T1, leave-planned (three terminals), Human/`decision_ref` failures, Model C, stale CAS, partial-write, refs, membership, events, export, coexistence, errors. **PASS**.

---

## 19. Errors

Core `VerificationValidationError` codes (`F1`…`F13`, `F_TRANSITION`, `F_AI`, …) propagate; Persistence/ENC unchanged; OpsError only for command/decode guards. Note: leave-planned AI gate is Core **`F7`** (not NR’s registration **`F5`**) — SPEC correctly documents `F7`. **PASS**.

---

## 20. Determinism

Caller-supplied `verification:` / `rev:` / `vte:` / UTC seconds; Core `randomUUID` VTE fallback documented as forbidden on certified OPS paths. **PASS**.

---

## 21. Conformance / Certification

SCI `CONF-001@1.0.0`; OPS `CONF-001@1.1.0-OPS`; no new engines/profiles; no fabricated reports. **PASS**.

---

## 22. Scope Integrity

SPEC §24 prohibits AI/LLM/RAG, literature/DocumentArtifact, KG, frontend/API, DB/distributed, durable Workspace, multi-user, computational biology, simulation, new provenance framework, second graph/journal, Claim Standing redesign, material VersionService OPS, ENC AI-marker fix, generic lifecycle.

No scope violation found. **PASS**.

---

## 23. Open Questions

| ID | Classification in SPEC | Audit assessment |
|----|------------------------|------------------|
| OQ-025-001 ENC AI markers | non-blocking / deferred | **Agree** — same class as 023/024; gates independent |
| OQ-025-002 target existence | CLOSED grammar-only | **Agree** |
| OQ-025-003 NR/Contradiction coexistence fixtures | CLOSED recommended | **Agree** — non-blocking |
| OQ-025-004 VersionService OPS | CLOSED non-goal | **Agree** — note Core resets concluded→planned on material bump (**OBS**) |
| OQ-025-005 pre-persist leave-planned | CLOSED not offered | **Agree** |
| OQ-025-006 ops event name | CLOSED | **Agree** |
| OQ-025-007 Claim Standing `verified_via` setter | deferred Core | **Agree** |
| OQ-025-008 method name | CLOSED `registerVerificationUnit` | **Agree** |
| OQ-025-009 stale-CAS strategy | CLOSED while planned | **Agree** |

**Architecture-blocking OQs: 0.** No hidden implementation blocker under a READY claim.

---

## 24. Observations

| ID | Observation |
|----|-------------|
| **O-025-01** | SPEC correctly refuses NR create pattern: Verification `createPlanned` is ungated with empty VTE (Contradiction-like), not Human-gated `createRegistered`. EXEC must not invent a registration transition argument. |
| **O-025-02** | Leave-planned AI rejection is Core **`F7`** (message: promote out of planned). Fixtures must assert `F7`, not NR’s create-gate `F5`. |
| **O-025-03** | Outcome is Core-coupled (`F5` on mismatch). OPS transition input must supply `to` only; must not invent independent outcome fields. |
| **O-025-04** | `artifact_ref` is CanonicalUnit **content**, not an ENC envelope reference — decode/export must round-trip content, not invent a reference role. |
| **O-025-05** | `VerificationVersionService.applyMaterialUpdate` after conclusion returns object to `planned`/`pending` with cleared VTE log (Core). Remains out of scope; EXEC must not expose material OPS accidentally. |
| **O-025-06** | Three concluded terminals imply stale-CAS / partial-write fixtures while still `planned` (OQ-025-009) — same class as Contradiction/NR terminal patterns. |

None of these are blockers or required SPEC patches.

---

## 25. Required Patches

**NONE.**

No incorrect Core API named. No invented states/transitions. No ENC/Persistence redesign required. No architecture-blocking unresolved OQ.

---

## 26. Final Verdict

## SPEC-025 — APPROVED WITH OBSERVATIONS

SPEC-025 faithfully derives Verification OPS under Model C from actual SCI-006 Core semantics (`createPlanned`, leave-planned edges, outcome coupling, ADM-T1, grammar-only refs) and the certified Model C / OPS orchestration pattern, without incorrectly copying Negative Result Human-gated issuance or inventing Claim/Evidence reverse synchronization.

| Metric | Value |
|--------|-------|
| **BLOCKERS** | **0** |
| **REQUIRED PATCHES** | **0** |
| **OBSERVATIONS** | **6** (O-025-01…06) |

**IMPLEMENTATION READINESS:**  
**READY FOR IMPLEMENTATION DECISION**

Next authorized gate (when separately commanded): **IMPLEMENTATION-DECISION-025**.

This audit does **not** authorize EXEC, SPEC patches, source changes, tests, certification, commit, or push.

*End ARCHITECTURE-AUDIT-025 — read-only.*

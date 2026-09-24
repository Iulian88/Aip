# CODE-AUDIT-025 — Verification OPS Under Model C

| Field | Value |
|-------|--------|
| Audit ID | CODE-AUDIT-025 |
| Sprint | 025 — Verification OPS Under Model C |
| Mode | **READ-ONLY** code audit |
| Subject | EXEC-025 implementation (uncommitted working tree) |
| Baseline | `47efca41c429c5de8bfc96da4c06082bc4c1e91c` |
| Authoritative inputs | SPEC-025 · IMPLEMENTATION-DECISION-025 · ARCHITECTURE-AUDIT-025 · FINAL-ARCHITECTURE-RE-AUDIT-025 · EXEC-025_REPORT · DISCOVERY-025 |
| Does not authorize | Formal certification, source/test edits, commit, push |

**Primary question:** Does EXEC-025 conform to the approved architecture without unauthorized scientific authority, nondeterminism, regression, or scope creep?

**Answer: YES** — with non-blocking observations only.

**Classification legend:** BLOCKER | REQUIRED PATCH | OBSERVATION | DEFERRED | NOT APPLICABLE

---

## 1. Baseline

| Check | Result |
|-------|--------|
| `git rev-parse HEAD` | `47efca41c429c5de8bfc96da4c06082bc4c1e91c` |
| Sprint 024 commit | `cert(sprint-024): certify Negative Result OPS under Model C` |
| HEAD == Sprint 024 certified baseline | **YES** |
| Commit created by EXEC/this audit | **NONE** |

Working tree contains EXEC-025 runtime delta + Sprint 025 design artifacts (untracked). No Sprint 025 changes are committed.

---

## 2. Independent Verification

EXEC-025 claimed: COMPLETE · SCI 44/44 · OPS 161/161 · FULL 205/205 · all gates PASS.

**Independently re-executed:**

| Gate | Independent result |
|------|--------------------|
| `pnpm run typecheck` | **PASS** |
| `pnpm run lint` | **PASS** |
| `pnpm run build` | **PASS** |
| TEST-025 | **7 passed, 0 failed** |
| TEST-016…025 regression | **ALL PASS** |
| SMOKE-025 | **PASS** → `SMOKE_025_PASS` |
| Corpus SCI / OPS / FULL | **44 / 161 / 205** |
| SCI Conformance `CONF-001@1.0.0` | **COMPLIANT** |
| OPS Conformance `CONF-001@1.1.0-OPS` | **COMPLIANT** |
| Independent double-export | **PASS** |

EXEC claims match independent evidence. Not trusted blindly.

### Git delta vs `47efca4`

**Modified (tracked):**

| Path | Classification |
|------|----------------|
| `apps/reference-app/src/operations/research-operations.ts` | **AUTHORIZED** Verification APIs + deps |
| `apps/reference-app/src/index.ts` | **AUTHORIZED** exports + marker sprint **25** |
| `packages/reference-tests/src/fixtures/ops-support.ts` | **AUTHORIZED** Verification helpers only |
| `packages/reference-tests/src/fixtures/ops.ts` | **AUTHORIZED** additive REF-OPS-134…161 only |
| `IMPLEMENTATION.md` | **AUTHORIZED** Sprint 025 section |

**Untracked — implementation / tests / markers / EXEC:**

| Path | Classification |
|------|----------------|
| `apps/reference-app/src/operations/verification-from-unit.ts` | **AUTHORIZED** |
| `scripts/test-025-verification-ops.mjs` | **AUTHORIZED** |
| `scripts/smoke-025-verification-ops.mjs` | **AUTHORIZED** |
| `SMOKE_025_PASS` | **AUTHORIZED** (new only) |
| `audits/execution/EXEC-025_REPORT.md` | **AUTHORIZED** |

**Untracked — design chain (pre-EXEC):** DISCOVERY-025 · SPEC-025 · ARCHITECTURE-AUDIT-025 · IMPLEMENTATION-DECISION-025 · FINAL-ARCHITECTURE-RE-AUDIT-025 — design artifacts; not unauthorized runtime.

**Certified subsystems vs baseline:** `packages/core`, `persistence`, `encoding`, `serialization`, `processor`, `conformance`, `certification`, `package.json`, `pnpm-lock.yaml` — **NONE**.

`ops.ts` diff hunks: import additions + append after REF-OPS-133 only (no deleted historical fixture lines).

---

## 3. Core Authority

| Authority | Actual call site | Verdict |
|-----------|------------------|---------|
| Creation | `this.verificationFactory.createPlanned(input)` | **PASS** |
| Transition | `this.verificationTransitions.transition(prior, input.transition)` | **PASS** |
| Human leave-planned gate | Core `assertHumanReviewerGate` → **`F7`** + `decision_ref` | **PASS** |
| Outcome coupling | Core-owned (`OUTCOME_FOR`); OPS supplies `to` only | **PASS** |
| ADM-T1 | Core validator **`F6`** | **PASS** |
| VersionService | **Not wired** (O-025-05) | **PASS** |

OPS does not reimplement validators, state tables, or scientific rules. Command guards only (`OpsError INVALID_COMMAND_STATE` for non-`rev:initial` create / bad transition revision ids). Core `VerificationValidationError` / Persistence errors propagate unwrapped.

---

## 4. Creation Flow

Traced `registerVerificationUnit`:

```
assertRevisionId / OpsError if ≠ rev:initial
  → verificationFactory.createPlanned(input)   // ungated; no registration arg (O-025-01)
  → encoder.assemble → VerificationUnit
  → entityFromCanonicalUnit({ revision_id })
  → repository.create
  → ensureInitialHead(id, "VerificationUnit", revision_id)
  → return { verification, unit, entity }
```

Confirmed:

| Property | Result |
|----------|--------|
| No create-once operational event | **PASS** |
| No auto membership | **PASS** |
| Empty VTE / `planned`+`pending` at create | **PASS** (REF-OPS-134 / T025-001) |
| No scientific semantics in Persistence | **PASS** |
| No pre-persist leave-planned | **PASS** (OQ-025-005) |

---

## 5. Post-Persist Transitions

Sole authorized OPS transition: leave-planned → `passed` \| `failed` \| `inconclusive`.

Traced `transitionVerificationRecordState`:

```
getVerificationUnit → verificationFromVerificationUnitPayload
  → verificationTransitions.transition(prior, transition)
  → encoder.assemble
  → create(successor + predecessor_revision_id = expected_head)
  → advanceHead CAS
  → optional appendEvent
```

| Check | Result |
|-------|--------|
| Decode → Core → encode successor | **PASS** |
| Immutable new revision (not replace) | **PASS** |
| `predecessor_revision_id` = expected head | **PASS** |
| Stale CAS → `CONFLICT` while still `planned` | **PASS** (REF-OPS-147 / T025-004) |
| `rev:initial` immutability after conclude | **PASS** (REF-OPS-150) |
| Terminal re-transition → `F_TRANSITION` | **PASS** (REF-OPS-146) |
| AI leave-planned → `F7`; head unchanged | **PASS** (REF-OPS-144 / T025-003) |
| Partial-write honesty (create before CAS) | **PASS** (code order; Model C honesty preserved) |

Leave-planned always produces a successor revision under Model C — matches Core content change + SPEC. No unauthorized extra transitions.

---

## 6. Model C

| Expectation | Result |
|-------------|--------|
| No Model C redesign / Persistence changes | **PASS** |
| Unit key `persist:CanonicalUnit:VerificationUnit:{id}:{revision_id}` | **PASS** (via existing primitives) |
| Head `persist:RevisionHead:VerificationUnit:{id}` | **PASS** |
| `rev:initial` create-once | **PASS** |
| Caller-supplied successor `rev:*` | **PASS** |
| Expected-version CAS via `advanceHead` | **PASS** |
| No second revision mechanism | **PASS** |

---

## 7. References

ENC roles used (existing encoder, unchanged):

| Core field | Envelope role | Placement |
|------------|---------------|-----------|
| `claim_refs` | `verifies_claim` | Envelope refs |
| `evidence_refs` | `verifies_evidence` | Envelope refs |
| `contradiction_refs` | `related_contradiction` | Envelope refs |
| `negative_result_refs` | `related_negative_result` | Envelope refs |
| `grade_refs` | `grade_ref` | Envelope refs |
| `artifact_ref` | **content only** | Content (O-025-04) |

| Check | Result |
|-------|--------|
| Grammar-only target existence | **PASS** (REF-OPS-160) |
| No Persistence.Relationship scientific graph | **PASS** (REF-OPS-156 / smoke) |
| No reverse-sync `Claim.verified_via` | **PASS** (coexistence at Claim create only — REF-OPS-158) |
| No second relationship authority | **PASS** |

---

## 8. Cross-Unit Semantics

Verification OPS does **not** mutate Claim Standing, Evidence Record State, Evidence Grade, Contradiction state, or Negative Result state. No reverse sync helpers. Coexistence fixtures only create sibling units / optional refs. **PASS**.

---

## 9. ENC / SER / Processor

| Component | Usage | Verdict |
|-----------|-------|---------|
| `CanonicalEncoder.assemble` | create + transition | **PASS** |
| `JsonEncoder.encode` | export | **PASS** |
| Processor | untouched | **PASS** |
| Decode helper | OPS-local reconstruct from intact VerificationUnit payload | **PASS** |

Decode guards: object payload, `unit_kind === VerificationUnit`, `intact === true`, enum checks for state/outcome/method. Reconstructs content + envelope refs + VTE + content `artifact_ref`. Omits ENC-absent `ai_assisted` / `human_sponsor` (OQ-025-001 deferred). No second encoder/serializer.

---

## 10. Persistence

Primitives used: `create`, `get`, `list`/`listRevisions`, `ensureInitialHead`, `advanceHead`, `appendEvent`, `getEvents`, `snapshot`. No scientific replace mutation, DB/SQL/Redis/Kafka, CQRS, event sourcing redesign, or second journal. **PASS**.

---

## 11. Events

| Property | Result |
|----------|--------|
| Type | `ops.verification_record_state_revision` only when `append_event === true` |
| ID | Deterministic `ops:{vte id}` (fallback identity+revision if VTE id omitted) |
| Scientific authority | **No** — VTE remains Core authority |
| `randomUUID` / `Date.now` / `Math.random` on Sprint 025 OPS path | **None** |
| Present/absent covered | **PASS** (REF-OPS-155) |

Certified / REF leave-planned paths supply caller `vte:` event ids.

---

## 12. Membership / Snapshots / Timeline

| Property | Result |
|----------|--------|
| Explicit membership only | **PASS** (REF-OPS-153) |
| Organizational / non-scientific | **PASS** |
| ResearchSnapshot frozen | **PASS** (REF-OPS-154) |
| WorkspaceSnapshot additive | **PASS** |
| Timeline operational | **PASS** (unchanged projection) |

---

## 13. Export / Determinism

Export = `JsonEncoder.encode` of head-resolved VerificationUnit payload.

| Check | Result |
|-------|--------|
| REF-OPS-157 double-run | **PASS** |
| T025-006 | **PASS** |
| SMOKE-025 | **PASS** |
| Independent auditor double-export | **PASS** |
| Caller-supplied ids/timestamps on evidence path | **PASS** |

---

## 14. Reference Corpus

| Corpus | Expected | Independent |
|--------|----------|-------------|
| SCI | 44/44 | **44/44** |
| OPS | 161/161 (= 133 + 28) | **161/161** |
| FULL | 205/205 (= 44 + 161) | **205/205** |

Additive fixtures: **REF-OPS-134…161** (exactly **28**). Historical REF-OPS-001…133 untouched. All IMPLEMENTATION-DECISION-025 required themes covered (create, ADM-T1, F1/F2/F3, duplicates, leave-planned ×3, F7, decision_ref, terminal, stale CAS planned, immutability, lineage, decode/artifact_ref, membership, snapshots, events, Relationship non-use, determinism, verified_via coexistence, NR/Contradiction refs, grammar-only absent targets, NOT_FOUND).

---

## 15. Tests

TEST-025 (`scripts/test-025-verification-ops.mjs`) — **7/7 PASS**:

| ID | Protects |
|----|----------|
| T025-001 | createPlanned → planned/pending/empty VTE + VerificationUnit + head |
| T025-002 | leave-planned → passed + lineage + decode |
| T025-003 | AI leave-planned → Core F7; head unchanged |
| T025-004 | Stale CAS while planned → CONFLICT |
| T025-005 | ADM-T1 without targets → F6 |
| T025-006 | Deterministic export double-run |
| T025-007 | Optional ops event when `append_event: true` |

Behavior-bearing assertions (not marker-only). **PASS**.

---

## 16. Regression

| Suite | Result |
|-------|--------|
| TEST-016…024 | **PASS** |
| TEST-025 | **PASS** |
| SMOKE-025 | **PASS** |
| Prior smoke markers `SMOKE_016…024_PASS` | **Unchanged** (only `SMOKE_025_PASS` new/untracked) |

---

## 17. Quality Gates

| Gate | Result |
|------|--------|
| typecheck | **PASS** |
| lint | **PASS** |
| build | **PASS** |
| Dependency expansion | **NONE** |

---

## 18. Conformance

| Profile | Engine | Result |
|---------|--------|--------|
| `CONF-001@1.0.0` | Existing ConformanceEngine | **SCI COMPLIANT** |
| `CONF-001@1.1.0-OPS` | Existing ConformanceEngine on FULL | **OPS COMPLIANT** |

No new engines/profiles. Formal certification **not** performed by this audit.

---

## 19. Security

Sprint 025 delta inspected for secrets, tokens, credentials, API keys, private keys, real environment values: **none found**. In-memory Persistence only. **SECURITY PASS**.

---

## 20. Historical Integrity

| Artifact class | Status |
|----------------|--------|
| `CERT_017…024_PASS` | **Unchanged** (not in working-tree mods) |
| `fixtures/cert/SPRINT-017…024_*` | **Unchanged** |
| `SMOKE_016…024_PASS` | **Unchanged** |
| Sprint 020–024 certified semantics | **Intact** (regressions green; no foundation package edits) |

**PASS**.

---

## 21. Change Budget

Compared to IMPLEMENTATION-DECISION-025 §19 Allowed/Forbidden:

| Constraint | Status |
|------------|--------|
| Only permitted paths touched | **MET** |
| No Core / Persistence / ENC / SER / Processor / CONF / CERT | **MET** |
| No historical fixture rewrites | **MET** |
| No historical smoke/cert overwrites | **MET** |
| No Sprint 026 work / tech introduction | **MET** |
| Architecture redesign | **NONE** |

**PASS**.

---

## 22. Code Quality

Inspected Verification OPS + decode + fixtures:

| Concern | Finding |
|---------|---------|
| Duplicated scientific logic | **None** — Core delegated |
| Parallel Persistence revision path | **None** |
| Unsafe `any` / silent catch | **None** |
| Structural casts in decode | Present after guards — same class as NR/Contradiction decode; not a correctness defect |
| Nondeterministic OPS evidence path | **None** |
| Hidden side effects (membership/events on create) | **None** |
| Debug logging / dead production test hooks | **None** |
| Naming / API shape | Consistent with Claim/Contradiction/NR Model C OPS pattern; create differs correctly (`createPlanned`, no registration arg) |

No material maintainability/architecture defects requiring patches.

---

## 23. Observations

### Architecture observations O-025-01…06 — EXEC respect

| ID | Respected? | Evidence |
|----|------------|----------|
| O-025-01 | **YES** | `createPlanned(input)` only; empty VTE / planned+pending |
| O-025-02 | **YES** | AI leave-planned asserts **F7**; head unchanged |
| O-025-03 | **YES** | Transition uses `to` only; outcome Core-coupled in fixtures |
| O-025-04 | **YES** | Decode reads `content.artifact_ref` |
| O-025-05 | **YES** | No VersionService wiring |
| O-025-06 | **YES** | Stale CAS while still **planned** |

None conceal blockers.

### Code-audit observations (non-blocking)

| ID | Observation |
|----|-------------|
| **O-025-CA-01** | Decode is lossy for `ai_assisted` / `human_sponsor` (ENC omits; OQ-025-001 deferred). Documented; does not invent markers. Same class as NR/Contradiction decode. |
| **O-025-CA-02** | REF-OPS-144 asserts F7 via failure expectation; explicit head-unchanged assertion is in T025-003 (not duplicated in the REF body). Adequate coverage; not a SPEC miss. |
| **O-025-CA-03** | Ops event ID fallback when VTE `event_id` omitted is deterministic (`ops:verification_record_state:{identity}:{revision_id}`). Certified paths still require caller `vte:` (Decision §17). Same class as prior OPS event patterns. |

### Deferred (not blockers)

| ID | Item |
|----|------|
| D-025-01 | OQ-025-001 ENC AI markers |
| D-025-02 | OQ-025-007 Claim Standing `verified_via` post-create setter |
| D-025-03 | Material `VerificationVersionService` OPS (O-025-05) |

---

## 24. Blockers

**0**

---

## 25. Required Patches

**0**

---

## 26. Final Verdict

## CODE-AUDIT-025 — APPROVED WITH OBSERVATIONS

EXEC-025 faithfully implements Verification OPS under Model C: Core `createPlanned` / `transition` remain sole scientific authority; OPS orchestrates create-once and leave-planned under certified Model C without a second graph/journal; ENC/SER/Persistence/CONF/CERT foundations are untouched; additive REF-OPS-134…161 and TEST/SMOKE-025 are assertion-based and green; regressions 016–025 pass; determinism and conformance hold; architecture observations O-025-01…06 are respected.

VERDICT:
APPROVED WITH OBSERVATIONS

BLOCKERS:
0

REQUIRED PATCHES:
0

OBSERVATIONS:
3

CERTIFICATION READINESS:
READY

Next authorized gate (when separately commanded): **FORMAL-CERTIFICATION-025**.

This audit does **not** create `CERT_025_PASS` or `fixtures/cert/SPRINT-025_*`.

*End CODE-AUDIT-025.*

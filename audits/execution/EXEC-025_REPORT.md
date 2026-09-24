# EXEC-025 — Verification OPS Under Model C

## 1. Baseline

| Item | Value |
|------|--------|
| Certified HEAD (pre-EXEC) | `47efca41c429c5de8bfc96da4c06082bc4c1e91c` |
| Authorization chain | DISCOVERY-025 · SPEC-025 · ARCHITECTURE-AUDIT-025 · IMPLEMENTATION-DECISION-025 · FINAL-ARCHITECTURE-RE-AUDIT-025 |
| Final architecture gate | FINAL-ARCHITECTURE-RE-AUDIT-025 — APPROVED WITH OBSERVATIONS · **YES — EXEC-025 AUTHORIZED** |
| Mode | EXEC implementation (no commit / no formal certification) |

## 2. Scope

Verification OPS under Model C only:

- `registerVerificationUnit(input, options?)` via Core `createPlanned`
- `transitionVerificationRecordState` (leave-planned → `passed` \| `failed` \| `inconclusive`)
- get / lineage / export helpers
- OPS-local `verificationFromVerificationUnitPayload`
- Additive `REF-OPS-134…161`
- TEST-025 / SMOKE-025

No Core / ENC / SER / Persistence / CONF / CERT redesign. No Model C changes. No certification. No Sprint 026 work.

## 3. Implementation

| Symbol | Kind |
|--------|------|
| `registerVerificationUnit` | create-once |
| `transitionVerificationRecordState` | post-persist leave-planned |
| `verificationFromVerificationUnitPayload` | OPS-local decode |
| `getVerificationUnit` / `Revision` / `Head` / `Lineage` | read |
| `exportVerificationUnit` / `Revision` | SER-JSON export |

Deps: `verificationFactory`, `verificationTransitions`. Marker sprint → **25**.

Files touched (change budget only):

- `apps/reference-app/src/operations/verification-from-unit.ts` (new)
- `apps/reference-app/src/operations/research-operations.ts`
- `apps/reference-app/src/index.ts`
- `packages/reference-tests/src/fixtures/ops-support.ts`
- `packages/reference-tests/src/fixtures/ops.ts` (additive only)
- `scripts/test-025-verification-ops.mjs` (new)
- `scripts/smoke-025-verification-ops.mjs` (new)
- `SMOKE_025_PASS` (new)
- `IMPLEMENTATION.md`
- `audits/execution/EXEC-025_REPORT.md` (this file)

## 4. Core Authority Verification

| Role | API |
|------|-----|
| Creation | `VerificationFactory.createPlanned(input)` only (ungated; empty VTE) |
| Transition | `VerificationTransitionService.transition` |
| Leave-planned terminals | `passed` \| `failed` \| `inconclusive` |
| Outcome coupling | Core-owned (F5); OPS does not set outcome |
| Human gate leave-planned | Core `F7` + `decision_ref` (O-025-02) |
| ADM-T1 | Core `F6` — claim_refs \| evidence_refs \| artifact_ref |

OPS does not reimplement state machine, validators, or scientific rules.

## 5. Creation Flow

```
VerificationFactory.createPlanned(input)
  → CanonicalEncoder.assemble → VerificationUnit
  → entityFromCanonicalUnit({ revision_id: rev:initial })
  → repository.create
  → ensureInitialHead(id, "VerificationUnit", rev:initial)
  → return { verification, unit, entity }
```

Asserted at create: `record_state=planned`, `verification_outcome=pending`, empty VTE log. No create-once operational event. No auto membership. No registration transition argument (O-025-01).

## 6. Post-Persist Transitions

```
getVerificationUnit → verificationFromVerificationUnitPayload
  → Core.transition(leave-planned)
  → assemble → create(successor + predecessor_revision_id)
  → advanceHead CAS
  → optional appendEvent(ops.verification_record_state_revision)
```

Authorized edges only: leave-planned → `passed` \| `failed` \| `inconclusive`. Old revisions remain immutable. Partial-write honesty preserved (create may succeed while CAS fails).

## 7. Model C

- Keys: `persist:CanonicalUnit:VerificationUnit:{id}:{revision_id}`
- Head: `persist:RevisionHead:VerificationUnit:{id}`
- Initial `rev:initial`; successors caller-supplied `rev:*`
- `predecessor_revision_id` + expected-version CAS via `advanceHead`
- Stale CAS → `CONFLICT` while still `planned` (O-025-06)
- No global Model C implementation changes

## 8. References

Envelope roles only (`verifies_claim` / `verifies_evidence` / `related_contradiction` / `related_negative_result` / `grade_ref`). `artifact_ref` content-only (O-025-04). Grammar-only target existence (OQ-025-002). No `Persistence.Relationship` scientific store. No reverse-sync of `Claim.verified_via` (OQ-025-007). No second relationship graph.

## 9. ENC / SER / Processor

Reused existing `CanonicalEncoder`, `JsonEncoder` (SER-JSON-001), Processor unchanged. Decode helper is OPS-local bridge only — not a second scientific representation. ENC AI markers remain omitted on reconstruct (OQ-025-001 deferred).

## 10. Persistence

Used only existing primitives: `create`, `get`, `list`/`listRevisions`, `ensureInitialHead`, `advanceHead` (CAS), `appendEvent`. No database / SQL / Redis / Kafka / CQRS / second journal / scientific mutable replace.

## 11. Events

Optional `ops.verification_record_state_revision` after successful CAS when `append_event: true`. Deterministic id `ops:{vte id}` (or identity+revision fallback). Events are operational, not scientific authority. VTE `event_id` caller-supplied on certified paths.

## 12. Membership / Snapshots / Timeline

- Membership: explicit `registerMember` / `registerWorkspaceMember` only; create/transition do not auto-register
- ResearchSnapshot: frozen shape
- WorkspaceSnapshot: additive Persistence rows + head only
- Timeline: operational projection unchanged

## 13. Reference Fixtures

Additive **REF-OPS-134…161** (28). Themes: createPlanned, ADM-T1 F6, Core validation, leave-planned ×3 terminals, Human/AI F7, decision_ref, Model C revisions, stale CAS, immutability, lineage, decode/artifact_ref, membership, snapshots, ops event, Claim.verified_via coexistence, NR/Contradiction refs, Relationship non-use, determinism, NOT_FOUND.

Support: `verificationInput` / `verificationLeavePlanned` in `ops-support.ts`. No historical SCI / REF-OPS-001…133 rewrites. No fabricated ReferenceReport.

## 14. Tests

| Script | Result |
|--------|--------|
| `scripts/test-025-verification-ops.mjs` | **7/7 PASS** |
| `scripts/smoke-025-verification-ops.mjs` | **PASS** → `SMOKE_025_PASS` |

TEST-025 covers: createPlanned, transition+lineage+decode, Human F7, stale CAS, ADM-T1 F6, deterministic export, ops event.

## 15. Regression

| Suite | Result |
|-------|--------|
| TEST-016 | PASS |
| TEST-017 | PASS |
| TEST-018 | PASS |
| TEST-019 | PASS |
| TEST-020 | PASS |
| TEST-021 | PASS |
| TEST-022 | PASS |
| TEST-023 | PASS |
| TEST-024 | PASS |
| TEST-025 | PASS |

Corpora (live): SCI **44/44** · OPS **161/161** (= 133 + 28) · FULL **205/205** (= 44 + 161)

## 16. Determinism

Double-run export matches (TEST-025 / REF-OPS-157 / SMOKE-025). No new `randomUUID` / `Date.now` / `Math.random` on Sprint 025 OPS evidence paths. Caller-supplied `vte:` / `rev:` / timestamps.

## 17. Typecheck / Lint / Build

| Gate | Result |
|------|--------|
| `pnpm run typecheck` | **PASS** |
| `pnpm run lint` | **PASS** |
| `pnpm run build` | **PASS** |

No unrelated dependency changes.

## 18. Conformance

| Profile | Result |
|---------|--------|
| `CONF-001@1.0.0` (SCI) | **COMPLIANT** |
| `CONF-001@1.1.0-OPS` (FULL) | **COMPLIANT** |

Formal certification **NOT PERFORMED**.

## 19. Security

No new attack surface beyond prior OPS pattern. Persistence remains in-memory reference. No credentials, network services, or second journals introduced. Relationship filter confirms zero scientific Relationship rows after Verification OPS paths.

## 20. Change Budget

| Constraint | Status |
|------------|--------|
| Only IMPLEMENTATION-DECISION-025 permitted paths | **MET** |
| No `packages/core/**` edits | **MET** |
| No Persistence / ENC / SER / Processor / CONF / CERT edits | **MET** |
| No historical REF-OPS-001…133 / SCI fixture edits | **MET** |
| No historical smoke/cert marker overwrites | **MET** (`SMOKE_025_PASS` new only) |
| Required patches | **0** |

## 21. Observations

| ID | Applied |
|----|---------|
| O-025-01 | `registerVerificationUnit(input, options?)` → `createPlanned` only; empty VTE / planned+pending |
| O-025-02 | Leave-planned Human gate is Core `F7` (not F5); AI rejected; head unchanged |
| O-025-03 | Transition input uses `to` only; outcome Core-coupled |
| O-025-04 | `artifact_ref` reconstructed from content, not envelope refs |
| O-025-05 | No VersionService OPS wiring |
| O-025-06 | Stale-CAS fixtures/tests while still `planned` |

## 22. Final Status

**EXEC-025 — COMPLETE**

| Gate | Result |
|------|--------|
| SCI | 44/44 |
| OPS | 161/161 |
| FULL | 205/205 |
| TEST-025 | PASS |
| Regressions 016–025 | PASS |
| SMOKE-025 | PASS |
| Typecheck / Lint / Build | PASS |
| Determinism | PASS |
| Conformance SCI + OPS | COMPLIANT |
| Blockers | 0 |
| Required patches | 0 |
| Certification | **NOT PERFORMED** |
| Commit | NONE |
| Push | NONE |
| Next | CODE-AUDIT-025 |

*End EXEC-025.*

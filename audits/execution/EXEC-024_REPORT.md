# EXEC-024 — Negative Result OPS Under Model C

## Scope

Negative Result OPS under Model C only:

- `registerNegativeResultUnit(input, registration, options?)`
- `transitionNegativeResultRecordState` (`registered → withdrawn`)
- get / lineage / export helpers
- OPS-local decode
- Additive `REF-OPS-106…133`
- TEST-024 / SMOKE-024

No Core / ENC / SER / Persistence / CONF / CERT redesign. No Verification OPS. No certification.

## Baseline

| Item | Value |
|------|--------|
| Certified HEAD (pre-EXEC) | `207365fb260b9e334bb60f16252ab3f445411dd6` |
| Final architecture gate | FINAL-ARCHITECTURE-RE-AUDIT-024 — APPROVED WITH OBSERVATIONS · EXEC AUTHORIZED |
| SPEC / Decision | SPEC-024 · IMPLEMENTATION-DECISION-024 |
| Mode | EXEC implementation (no commit / no formal certification) |

## Core Authority Used

| Role | API |
|------|-----|
| Creation | `NegativeResultFactory.createRegistered(input, registration)` |
| Transition | `NegativeResultTransitionService.transition` |
| States | `registered` \| `withdrawn` |
| Human gate | Core `assertHumanReviewerGate` (`F5` / `decision_ref` / `F7` withdrawal_reason) |

OPS does not reimplement scientific semantics.

## APIs Implemented

| Symbol | Kind |
|--------|------|
| `registerNegativeResultUnit` | create-once |
| `transitionNegativeResultRecordState` | post-persist |
| `negativeResultFromNegativeResultUnitPayload` | OPS-local decode |
| `getNegativeResultUnit` / `Revision` / `Head` / `Lineage` | read |
| `exportNegativeResultUnit` / `Revision` | SER-JSON export |

Deps: `negativeResultFactory`, `negativeResultTransitions`. Marker sprint → **24**.

## Creation Flow

```
createRegistered(input, registration)
  → CanonicalEncoder.assemble → NegativeResultUnit
  → entityFromCanonicalUnit({ revision_id: rev:initial })
  → repository.create
  → ensureInitialHead(id, "NegativeResultUnit", rev:initial)
  → return { negativeResult, unit, entity }
```

No create-once operational event. No auto membership.

## Post-Persist Transition Flow

```
getNegativeResultUnit → decode → Core.transition
  → assemble → create(successor + predecessor)
  → advanceHead CAS
  → optional appendEvent(ops.negative_result_record_state_revision)
```

Sole edge: `registered → withdrawn`.

## Model C

- Keys: `persist:CanonicalUnit:NegativeResultUnit:{id}:{revision_id}`
- Head: `persist:RevisionHead:NegativeResultUnit:{id}`
- Initial `rev:initial`; successors caller-supplied `rev:*`
- Stale CAS → `CONFLICT` (fixture uses mismatched expected head while still `registered`)
- Partial-write honesty preserved

## References

Envelope roles only (`qualifies_or_challenges` / `cites_evidence` / `related_contradiction` / `related_verification`). Grammar-only. No `Persistence.Relationship` scientific store. No reverse-sync of `Claim.qualified_by`.

## Membership

Explicit `registerMember` / `registerWorkspaceMember` only. Create/transition do not alter membership.

## Events

Optional `ops.negative_result_record_state_revision` after successful CAS. Deterministic `ops:{nrte id}`. Scientific authority remains NRTE.

## Snapshots

ResearchSnapshot / WorkspaceSnapshot shapes unchanged; additive Persistence rows + head only.

## Export

`JsonEncoder.encode` of NegativeResultUnit payload (SER-JSON-001).

## Errors

Core `NegativeResultValidationError` / ENC / Persistence codes propagate. `OpsError INVALID_COMMAND_STATE` for command misuse / decode only. No new taxonomy.

## Fixtures

Additive **REF-OPS-106…133** (28). Themes: create, Human gate, validation, withdraw, CAS, coexistence, membership, snapshots, ops event, Relationship non-use, determinism, NOT_FOUND.

Support: `negativeResultInput` / `negativeResultRegistration` in `ops-support.ts`.

## Tests

| Script | Result |
|--------|--------|
| `scripts/test-024-negative-result-ops.mjs` | **7/7 PASS** |
| `scripts/smoke-024-negative-result-ops.mjs` | **PASS** → `SMOKE_024_PASS` |

## Regression

| Suite | Result |
|-------|--------|
| TEST-016…019 | PASS |
| TEST-020 (`test-020-model-c-revision.mjs`) | PASS |
| TEST-021…023 | PASS |
| TEST-024 | PASS |
| `pnpm test` (SCI default) | 44/44 PASS |

## Determinism

Double-run export matches (TEST-024 / REF-OPS-132 / smoke). Caller-supplied `nrte:` event ids on all certified paths (O-024-02).

## Typecheck

**PASS** (`pnpm run typecheck`)

## Lint

**PASS** (`pnpm run lint`)

## Build

**PASS** (`pnpm run build`)

## Conformance

| Profile | Result |
|---------|--------|
| `CONF-001@1.0.0` (SCI) | **COMPLIANT** |
| `CONF-001@1.1.0-OPS` (FULL) | **COMPLIANT** |

Corpora (live): SCI **44/44** · OPS **133/133** · FULL **177/177**

## Scope Integrity

No Core/ENC/SER/Persistence/CONF/CERT foundation edits. No Verification OPS. No Relationship scientific graph. No second journal. Observations O-024-01…06 applied as EXEC discipline.

## Observations

| ID | Applied |
|----|---------|
| O-024-01 | REF-OPS-131 uses `entity_kind: "Relationship"` filter |
| O-024-02 | All fixtures/smoke supply `nrte:` event_id |
| O-024-03 | Ref assertions use ENC envelope / decode |
| O-024-04 | Deps wired only in `createResearchOperations`; marker sprint 24 |
| O-024-05 | Three-arg create + `negativeResultRegistration` helper |
| O-024-06 | Existing `detectKind` reused; no ENC change |

## Certification Boundary

**NOT PERFORMED.** No `CERT_024_PASS` / `fixtures/cert/SPRINT-024_*`. Next gate: CODE-AUDIT-024.

## Final Status

**EXEC-024 — COMPLETE**

| Gate | Result |
|------|--------|
| SCI | 44/44 |
| OPS | 133/133 |
| FULL | 177/177 |
| TEST-024 | PASS |
| Regressions 016–023 | PASS |
| SMOKE-024 | PASS |
| Typecheck / Lint / Build | PASS |
| Determinism | PASS |
| Conformance SCI + OPS | COMPLIANT |
| Blockers | 0 |
| Required patches | 0 |
| Certification | NOT PERFORMED |
| Commit | NONE |
| Push | NONE |
| Next | CODE-AUDIT-024 |

*End EXEC-024.*

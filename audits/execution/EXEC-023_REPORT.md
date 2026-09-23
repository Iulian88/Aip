# EXEC-023 — Contradiction OPS Under Model C

## 1. Baseline

| Item | Value |
|------|--------|
| Certified HEAD (pre-EXEC) | `662d7f7881337809c7973a39b683053ae3c45a87` |
| origin/main (pre-EXEC) | `662d7f7881337809c7973a39b683053ae3c45a87` |
| Final architecture gate | FINAL-ARCHITECTURE-RE-AUDIT-023 — **APPROVED** · EXEC AUTHORIZED (exact scope) |
| SPEC / Decision | SPEC-023 · IMPLEMENTATION-DECISION-023 |
| Mode | EXEC implementation (no commit / no formal certification) |

## 2. Documents Used

- DISCOVERY-023
- SPEC-023
- ARCHITECTURE-AUDIT-023
- IMPLEMENTATION-DECISION-023
- FINAL-ARCHITECTURE-RE-AUDIT-023
- Sprint 020–022 Model C / Standing / Record State / Grade OPS precedents (code + audits)

## 3. Exact Implementation

### Creation — `registerContradictionUnit`

```
ContradictionFactory.createOpen(input)
  → CanonicalEncoder.assemble
  → entityFromCanonicalUnit({ revision_id: rev:initial })
  → repository.create
  → ensureInitialHead(id, "ContradictionUnit", rev:initial)
  → return { contradiction, unit, entity }
```

No operational event. No auto membership.

### Transition — `transitionContradictionRecordState`

```
assertRevisionId / OpsError guards
  → getContradictionUnit (head)
  → contradictionFromContradictionUnitPayload
  → ContradictionTransitionService.transition
  → CanonicalEncoder.assemble
  → entityFromCanonicalUnit(+ predecessor_revision_id)
  → repository.create
  → advanceHead CAS
  → optional appendEvent(ops.contradiction_record_state_revision)
  → return { contradiction, unit, entity, head_revision_id }
```

### Decode

New `apps/reference-app/src/operations/contradiction-from-unit.ts` — reconstructs Core Contradiction from intact ContradictionUnit (involves / cites_evidence / CRTE). Omits `ai_assisted` / `human_sponsor` (ENC content absent — OQ-023-002).

### Model C

- `unit_kind = "ContradictionUnit"`
- Storage / head keys per certified Model C
- Stale head → `CONFLICT`
- Partial-write honesty preserved

### Stale-CAS fixture note

Contradiction terminals have no second legal Core edge after leave-`open`. REF-OPS-091 / T023-004 prove CAS CONFLICT via mismatched `expected_head_revision_id` (`rev:not-current`) while head remains `rev:initial` and Core transition is still legal from `open`.

## 4. Files Changed

| Path | Change |
|------|--------|
| `apps/reference-app/src/operations/contradiction-from-unit.ts` | **Added** — decode helper |
| `apps/reference-app/src/operations/research-operations.ts` | Create + transition + get/lineage/export; deps wiring |
| `apps/reference-app/src/index.ts` | Exports + marker sprint **23** |
| `packages/reference-tests/src/fixtures/ops-support.ts` | `contradictionInput` helper |
| `packages/reference-tests/src/fixtures/ops.ts` | Additive REF-OPS-077…105 |
| `scripts/test-023-contradiction-ops.mjs` | **Added** |
| `scripts/smoke-023-contradiction-ops.mjs` | **Added** |
| `IMPLEMENTATION.md` | Sprint 023 documentation |
| `SMOKE_023_PASS` | **Added** (new only) |
| `audits/execution/EXEC-023_REPORT.md` | This report |

Pre-existing untracked design docs (DISCOVERY/SPEC/audits) unchanged by EXEC logic beyond this report.

**Unauthorized files:** none modified (Core / Persistence / ENC / SER / CONF / CERT untouched).

**Historical smoke markers:** `SMOKE_019`…`SMOKE_022_PASS` **not** modified.

## 5. Fixture Range

| Range | Count |
|-------|-------|
| Prior OPS | REF-OPS-001…076 (76) |
| Sprint 023 additive | **REF-OPS-077…105** (**29**) |
| Final OPS | **105** |

Themes covered: createOpen, canon, Core F2/F3/F4/F9, duplicate create, non-initial register, all four leave-open transitions, F6/F7/F_TRANSITION/decision_ref, stale CAS, duplicate revision, contested_by coexistence, absent claims, invalid revision ids, immutability, lineage, decode, membership, snapshots, ops event + default-off, Relationship non-use (entity_kind filter), deterministic export, NOT_FOUND.

## 6. Test Results

| Suite | Result |
|-------|--------|
| TEST-023 | **7/7 PASS** |
| SCI corpus | **44/44** |
| OPS corpus | **105/105** |
| FULL corpus | **149/149** |
| Conformance SCI `CONF-001@1.0.0` | **COMPLIANT** |
| Conformance OPS `CONF-001@1.1.0-OPS` | **COMPLIANT** |

## 7. Regression Results

| Suite | Result |
|-------|--------|
| TEST-016 | PASS |
| TEST-017 | PASS |
| TEST-018 | PASS |
| TEST-019 | PASS |
| TEST-020 | PASS |
| TEST-021 | PASS |
| TEST-022 | PASS |

## 8. Smoke Results

| Smoke | Result |
|-------|--------|
| smoke-023 | **SMOKE_023_PASS** |
| Historical 019–022 markers | Untouched |

## 9. Typecheck / Lint / Build

| Gate | Result |
|------|--------|
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** |
| `npm run build` | **PASS** |

## 10. Determinism

| Check | Result |
|-------|--------|
| Double-run export (TEST-023 / REF-OPS-103 / smoke) | **PASS** |
| Caller-supplied `revision_id` / `event_id` on certified paths | **PASS** |
| No `randomUUID` / `Math.random` / `Date.now` in Sprint 023 evidence paths | **PASS** |

## 11. Conformance

| Profile | Result |
|---------|--------|
| `CONF-001@1.0.0` | COMPLIANT (SCI 44/44) |
| `CONF-001@1.1.0-OPS` | COMPLIANT (FULL 149/149) |
| Engines | ONE ConformanceEngine · ONE CertificationEngine — unchanged |

## 12. Blockers / Observations

| Class | Count | Notes |
|-------|-------|-------|
| Blockers | **0** | — |
| Required patches | **0** | — |
| Observations | — | O-023-01 applied (Relationship filter); O-023-02 no artificial decode `<2` fixture; O-023-03 ENC payload assertions; O-023-04 caller `event_id`; O-023-05 change budget held |

## 13. Scope Verification

| Authorized | Done |
|------------|------|
| Contradiction create OPS | Yes |
| Contradiction transition OPS | Yes |
| Decode helper | Yes |
| Model C revisions / head / CAS | Yes |
| Membership / snapshots / export | Yes (existing mechanisms) |
| Optional operational events | Yes |
| REF + smoke + docs | Yes |

| Forbidden | Status |
|-----------|--------|
| Core / Persistence / ENC / SER redesign | Not touched |
| Second graph / journal | Not introduced |
| Generic lifecycle | Not introduced |
| ENC AI markers | Not added |
| Claim Standing redesign / reverse sync | Not done |

## 14. Certification Status

**NOT PERFORMED** during EXEC-023.

## 15. Working Tree

**MODIFIED** — implementation + fixtures + scripts + docs + `SMOKE_023_PASS`. No commit. No push.

## 16. Next

**CODE-AUDIT-023**

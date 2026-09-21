# EXEC-022 — Grade OPS

## 1. Baseline

| Item | Value |
|------|--------|
| Certified HEAD (pre-EXEC) | `d2eedef23a4193c40d3a3b4d2a73cf81c65795c7` |
| origin/main (pre-EXEC) | `d2eedef23a4193c40d3a3b4d2a73cf81c65795c7` |
| Final architecture gate | FINAL-ARCHITECTURE-RE-AUDIT-022 — EXEC AUTHORIZED (exact scope) |
| SPEC / Decision | SPEC-022 · IMPLEMENTATION-DECISION-022 |
| Mode | EXEC implementation (no commit / no formal certification) |

## 2. Documents Used

- ROADMAP-REVIEW-002
- DISCOVERY-022
- SPEC-022
- ARCHITECTURE-AUDIT-022
- IMPLEMENTATION-DECISION-022
- FINAL-ARCHITECTURE-RE-AUDIT-022
- Sprint 020/021 Model C + Record State precedents (code + audits)

## 3. Implementation Scope

Grade OPS only (Option A):

- `ResearchOperations.assignEvidenceGrade`
- Core `EvidenceGradeService.assign`
- EvidenceUnit + `grade_ref` authoritative
- Model C create + EvidenceUnit RevisionHead CAS
- Optional `ops.evidence_grade_assignment_revision`
- Additive REF-OPS-062…076
- TEST-022 / smoke-022

**Not implemented:** GradeDesignationUnit dual-write, Grade lifecycle, generic lifecycle, other canonical-unit OPS.

## 4. Files Changed

| Path | Change |
|------|--------|
| `apps/reference-app/src/operations/research-operations.ts` | `assignEvidenceGrade` + `EvidenceGradeService` wiring |
| `apps/reference-app/src/index.ts` | Exports + marker sprint 22 |
| `packages/reference-tests/src/fixtures/ops.ts` | Additive REF-OPS-062…076 |
| `scripts/test-022-grade-ops.mjs` | **Added** |
| `scripts/smoke-022-grade-ops.mjs` | **Added** |
| `IMPLEMENTATION.md` | Sprint 022 documentation |
| `SMOKE_022_PASS` | **Added** (new only) |
| `audits/execution/EXEC-022_REPORT.md` | This report |

Pre-existing untracked design docs (SPEC/DISCOVERY/audits) unchanged by EXEC logic.

**Unauthorized files:** none modified.

**Historical smoke markers:** `SMOKE_019_PASS` / `SMOKE_020_PASS` / `SMOKE_021_PASS` **not** modified.

## 5. Grade OPS Implementation

```
getEvidenceUnit (head)
  → evidenceFromEvidenceUnitPayload
  → EvidenceGradeService.assign
  → CanonicalEncoder.assemble (EvidenceUnit only)
  → entityFromCanonicalUnit + repository.create
  → advanceHead(EvidenceUnit)
  → optional appendEvent
```

- Input: `AssignEvidenceGradeInput` (`identity`, `assignment`, `revision_id`, `expected_head_revision_id`, `append_event?`)
- Output: `AssignEvidenceGradeResult` (`evidence`, `unit`, `entity`, `head_revision_id`)
- No OPS Grade validity table; Core errors propagate (`EvidenceGradeValidationError`)

## 6. Model C Implementation

| Item | Result |
|------|--------|
| Storage key | Existing four-segment EvidenceUnit keys |
| Initial | `rev:initial` unchanged |
| Subsequent | Caller-supplied `rev:…` |
| Head | `persist:RevisionHead:EvidenceUnit:{identity}` |
| CAS | Existing `advanceHead` |
| Persistence architecture | **Unchanged** |

## 7. Identity / Revision

| Concern | Result |
|---------|--------|
| Scientific identity | Stable `evidence_id` |
| `grade_ref` | EG string on Evidence / EvidenceUnit (not Evidence id) |
| SemVer | Core bumps `evidence_version` on material grade change |
| `revision_id` | Caller-supplied; ≠ SemVer |
| Lineage | `predecessor_revision_id = expected_head_revision_id` |
| GradeDesignationUnit | Not created / not headed |

## 8. Event Behavior

| Item | Result |
|------|--------|
| Type | `ops.evidence_grade_assignment_revision` |
| Required | Optional (`append_event`, default false) |
| Authority | Operational only |
| Payload | `{ revision_id, predecessor_revision_id, unit_kind: "EvidenceUnit", to_grade_ref }` from Core result |
| Journal | Sole Persistence journal |

## 9. Snapshot / Export Behavior

- ResearchSnapshot / WorkspaceSnapshot schemas frozen
- Grade appears via additive Persistence entities in `persistence_snapshot`
- `exportEvidenceUnit` / `exportEvidenceUnitRevision` SER-JSON unchanged APIs
- Membership not auto-mutated

## 10. Error Behavior

| Condition | Propagation |
|-----------|-------------|
| Missing Evidence | Persistence `NOT_FOUND` |
| Invalid Grade / AI raise / bad ref | Core `EvidenceGradeValidationError` (`F5`, `F1`, …) |
| Stale head | Persistence `CONFLICT` |
| Duplicate revision | Persistence `ALREADY_EXISTS` |
| OPS misuse | `OpsError` `INVALID_COMMAND_STATE` |

## 11. Determinism

- Caller-supplied `revision_id`, GAE `event_id`, `at`
- Double-run exports match (TEST-022 / REF-OPS-064)
- Core UUID GAE fallback not exercised on certified paths

## 12. Reference Fixtures

| Range | Themes |
|-------|--------|
| REF-OPS-062…076 (15 additive) | success, lineage, determinism, F5, NOT_FOUND, CONFLICT, ALREADY_EXISTS, export, snapshot, event, no GradeDesignationUnit, immutability, F1, membership, Record State+Grade coexistence |

SCI fixtures unchanged (`REF-GRADE-*` remain SCI-only).

## 13. Tests

| Suite | Result |
|-------|--------|
| TEST-022 | **7/7 PASS** |

## 14. Regression Tests

| Suite | Result |
|-------|--------|
| TEST-016 | 10/10 PASS |
| TEST-017 | 12/12 PASS |
| TEST-018 | 10/10 PASS |
| TEST-019 | 10/10 PASS |
| TEST-020 | 22/22 PASS |
| TEST-021 | 15/15 PASS |

## 15. Smoke Test

| Item | Result |
|------|--------|
| smoke-022 | **PASS** → `SMOKE_022_PASS` created |
| Historical markers | Unmodified |

## 16. Conformance

| Corpus | Result |
|--------|--------|
| SCI | 44/44 · `CONF-001@1.0.0` COMPLIANT |
| OPS | 76/76 · additive under `CONF-001@1.1.0-OPS` |
| FULL | 120/120 · OPS profile COMPLIANT |

ConformanceEngine unchanged.

## 17. Build / Typecheck / Lint

| Gate | Result |
|------|--------|
| typecheck | **PASS** |
| build | **PASS** |
| lint | **PASS** |

## 18. Certification Boundary

EXEC-022 **did not** perform formal certification.

Next authorized stages:

```
CODE-AUDIT-022
  → FORMAL-CERTIFICATION-022
  → FINAL GIT CLOSURE — SPRINT 022
```

## 19. Observations

| ID | Note |
|----|------|
| O-EXEC-022-01 | Partial-write orphans preserved (T022-006 / Model C honesty) |
| O-EXEC-022-02 | Stale-CAS fixtures apply a *different* eligible Grade so Core succeeds before CAS fails (same pattern as Record State) |
| O-EXEC-022-03 | `referenceAppMarker.sprint` advanced to 22 |
| O-EXEC-022-04 | Exact fixture titles within 062–076 chosen at EXEC; themes from Implementation Decision covered |

## 20. Blockers

**None.**

## 21. Final Execution Verdict

Sprint 022 Grade OPS implemented exactly per Option A under certified Model C. Core remains sole Grade authority. Persistence/ENC/SER unchanged. No GradeDesignationUnit dual-write. No generic lifecycle. Certified Sprint 019–021 behavior preserved.

---

EXEC-022 FINAL VERDICT
======================

Status:
COMPLETE WITH OBSERVATIONS

Grade OPS:
IMPLEMENTED

Core semantics:
USED

Model C:
PRESERVED

Persistence:
UNCHANGED

ENC:
UNCHANGED

SER:
UNCHANGED

Scientific authority:
PRESERVED

Second scientific graph:
NONE

Second event journal:
NONE

Generic lifecycle:
NOT INTRODUCED

Determinism:
PASS

Tests:
TEST-022 7/7 PASS

Regression:
TEST-016…021 ALL PASS

Smoke:
SMOKE_022_PASS

Conformance:
SCI 44/44 · OPS 76/76 · FULL 120/120 COMPLIANT

Typecheck:
PASS

Lint:
PASS

Build:
PASS

Certification:
NOT PERFORMED BY EXEC-022

Blockers:
0

Observations:
4

Next authorized action:
CODE-AUDIT-022

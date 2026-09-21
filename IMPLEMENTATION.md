# SciROS Reference Implementation

**Sprint:** EXEC-SPRINT-022 · Grade OPS  
**Status:** **IMPLEMENTATION COMPLETE** (pending CODE-AUDIT-022; not formally certified by this EXEC)

| Field | Value |
|-------|--------|
| Implementation | COMPLETE WITH OBSERVATIONS |
| Architecture | SPEC-022 · IMPLEMENTATION-DECISION-022 · FINAL-ARCHITECTURE-RE-AUDIT-022 — EXEC AUTHORIZED (exact scope) |
| SCI profile | `CONF-001@1.0.0` |
| OPS profile | `CONF-001@1.1.0-OPS` |
| Corpora (live) | SCI 44/44 · OPS 76/76 · FULL 120/120 |
| Prior certified baseline | Sprint 021 @ `d2eedef` — FORMALLY CERTIFIED AND CLOSED |

Prior: Sprint 021 FORMALLY CERTIFIED AND CLOSED (Evidence Record State OPS).

| Field | Value |
|-------|--------|
| SPEC | SPEC-022 |
| Slice | Evidence Grade post-persist OPS (`assignEvidenceGrade`) — Option A |
| Representation | EvidenceUnit + `grade_ref` (no GradeDesignationUnit dual-write) |
| Core | `EvidenceGradeService.assign` |
| Revision model | Certified Model C (unchanged) |
| Head | `persist:RevisionHead:EvidenceUnit:{identity}` · CAS via `advanceHead` |

## Commands

```bash
pnpm install
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm test
node scripts/test-016-reference-app.mjs
node scripts/smoke-016-reference-app.mjs
node scripts/test-017-ops-conformance-certification.mjs
node scripts/smoke-017-ops-conformance-certification.mjs
node scripts/test-018-research-workspace.mjs
node scripts/smoke-018-research-workspace.mjs
node scripts/test-019-evidence-operations.mjs
node scripts/smoke-019-evidence-operations.mjs
node scripts/test-020-model-c-revision.mjs
node scripts/smoke-020-model-c-revision.mjs
node scripts/test-021-evidence-record-state.mjs
node scripts/smoke-021-evidence-record-state.mjs
node scripts/test-022-grade-ops.mjs
node scripts/smoke-022-grade-ops.mjs
```

## Evidence chain (unchanged)

```
OPS → REF-OPS → ReferenceRunner → ReferenceReport
    → ConformanceEngine(profile) → ConformanceReport(profile_id)
    → CertificationEngine → Certificate
```

## Sprint 022 — Grade OPS (Option A)

### OPS

- `assignEvidenceGrade` → Core `EvidenceGradeService.assign` → ENC EvidenceUnit → create revision → `advanceHead` CAS → optional `appendEvent`
- Reuses `evidenceFromEvidenceUnitPayload` (no new decode module)
- Event type: `ops.evidence_grade_assignment_revision` (optional; non-authoritative; `to_grade_ref` from Core result)
- **Does not** persist or CAS-advance `GradeDesignationUnit`
- Does not mutate membership, Claim Standing, or Evidence Record State

### Determinism

- Caller-supplied `revision_id` and GAE `event_id` (Core may `randomUUID` if GAE id omitted — callers must supply)
- Double-run exports match

### Concurrency / partial-write

- Same Model C honesty: create may succeed while CAS fails → orphan revision; head unchanged
- No transactions / rollback / delete-on-conflict

### Tests

- `scripts/test-022-grade-ops.mjs` (7 assertion tests)
- `scripts/smoke-022-grade-ops.mjs` → `SMOKE_022_PASS` only (does not overwrite 019/020/021)
- Additive REF-OPS-062…076
- Regression: Sprint 016–021 tests green; SCI 44; prior OPS fixtures green

### Limitations / non-goals

- No GradeDesignationUnit OPS dual-write
- No Grade lifecycle / state machine / generic lifecycle engine
- No Contradiction / Negative Result / Verification OPS
- No material Evidence content OPS
- No DB / API / UI / AI / KG / DocumentArtifact
- ResearchSession / ResearchWorkspace remain memory-only

## Sprint 021 — Evidence Record State post-persist (certified / closed)

### OPS

- `transitionEvidenceRecordState` → Core `EvidenceTransitionService` → ENC → create revision → `advanceHead` CAS → optional `appendEvent`
- OPS-local decode: `evidenceFromEvidenceUnitPayload` (ERTE vs GAE discrimination)
- Event type: `ops.evidence_record_state_revision` (optional; non-authoritative)
- Pre-persist `registerEvidenceUnit(..., { transition })` preserved (Sprint 019)

## Sprint 020 — Model C (certified / closed)

### Persistence

- CanonicalUnit storage key: `persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}`
- Dual-read: legacy three-segment key ≡ `rev:initial`
- `RevisionHead` mutable; CAS via `advanceHead`
- No second journal; no distributed transactions

### OPS

- `transitionClaimStanding` → Core → ENC → create → CAS → optional event
- Claim decode: `claimFromClaimUnitPayload`

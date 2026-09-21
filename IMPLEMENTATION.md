# SciROS Reference Implementation

**Sprint:** EXEC-SPRINT-021 · Evidence Post-Persist Record State OPS  
**Status:** **IMPLEMENTATION COMPLETE** (pending CODE-AUDIT-021; not formally certified by this EXEC)

| Field | Value |
|-------|--------|
| Implementation | COMPLETE WITH OBSERVATIONS |
| Architecture | SPEC-021 · IMPLEMENTATION-DECISION-021 · FINAL-ARCHITECTURE-RE-AUDIT-021 APPROVED WITH OBSERVATIONS |
| SCI profile | `CONF-001@1.0.0` |
| OPS profile | `CONF-001@1.1.0-OPS` |
| Corpora (live) | SCI 44/44 · OPS 61/61 · FULL 105/105 |
| Prior certified baseline | Sprint 020 @ `6c0106c` — FORMALLY CERTIFIED AND CLOSED |

Prior: Sprint 020 FORMALLY CERTIFIED AND CLOSED (Model C + Claim Standing).

| Field | Value |
|-------|--------|
| SPEC | SPEC-021 v0.1.0-DRAFT |
| Slice | Evidence Record State post-persist OPS (`transitionEvidenceRecordState`) |
| Vocabulary | Core `draft \| registered \| withdrawn` only |
| Revision model | Certified Model C (unchanged) |
| Initial revision | `rev:initial` |
| Later revisions | Caller-supplied `rev:…` |
| Lineage | `PersistenceEntity.predecessor_revision_id` |
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
```

## Evidence chain (unchanged)

```
OPS → REF-OPS → ReferenceRunner → ReferenceReport
    → ConformanceEngine(profile) → ConformanceReport(profile_id)
    → CertificationEngine → Certificate
```

## Sprint 021 — Evidence Record State post-persist

### OPS

- `transitionEvidenceRecordState` → Core `EvidenceTransitionService` → ENC → create revision → `advanceHead` CAS → optional `appendEvent`
- OPS-local decode: `evidenceFromEvidenceUnitPayload` (ERTE vs GAE discrimination)
- Reads: `getEvidenceUnit` (head), `getEvidenceUnitRevision`, `getEvidenceHead`, `getEvidenceLineage`
- Export: `exportEvidenceUnit` (head), `exportEvidenceUnitRevision`
- Event type: `ops.evidence_record_state_revision` (optional; non-authoritative)
- Pre-persist `registerEvidenceUnit(..., { transition })` preserved (Sprint 019)

### Determinism

- Caller-supplied `revision_id` and ERTE `event_id` (Core may `randomUUID` if ERTE id omitted — callers must supply)
- Double-run exports match

### Concurrency / partial-write

- Same Model C honesty as Sprint 020: create may succeed while CAS fails → orphan revision; head unchanged
- No transactions / rollback / delete-on-conflict

### Tests

- `scripts/test-021-evidence-record-state.mjs` (15 assertion tests)
- `scripts/smoke-021-evidence-record-state.mjs`
- Additive REF-OPS-047…061
- Regression: Sprint 016–020 tests + smokes; SCI 44; prior OPS fixtures green

### Limitations / non-goals

- No Grade / Contradiction / Negative Result / Verification OPS
- No material Evidence content OPS
- No DB / API / UI / AI / KG / DocumentArtifact
- ResearchSession / ResearchWorkspace remain memory-only

## Sprint 020 — Model C (certified / closed)

### Persistence

- CanonicalUnit storage key: `persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}`
- Dual-read: legacy three-segment key ≡ `rev:initial`
- `PersistenceEntity.identity` = scientific identity (unchanged)
- `revision_id` / `predecessor_revision_id` = Persistence metadata (not SemVer)
- `RevisionHead` mutable; **not** in `IMMUTABLE_KINDS`
- APIs: `getHead`, `ensureInitialHead`, `advanceHead`, `listRevisions`
- Snapshot/restore includes all revision rows + heads
- No second journal; no distributed transactions

### OPS

- `registerClaimUnit` / `registerEvidenceUnit` → `rev:initial` + `ensureInitialHead`
- `transitionClaimStanding` → Core transition → ENC → create revision → `advanceHead` CAS → optional `appendEvent`
- Reads: `getClaimUnit` (head-resolved), `getClaimUnitRevision`, `getClaimHead`, `getClaimLineage`
- Export: `exportClaimUnit` (head), `exportClaimUnitRevision`
- Claim decode from ClaimUnit payload: OPS-local `claimFromClaimUnitPayload`

### Evidence boundary (Sprint 020)

- Sprint 019 Evidence Operations preserved
- Sprint 020 delivered **initial revision**; Sprint 021 adds post-persist Record State

### Determinism

- Caller-supplied `revision_id` and STE `event_id` (Core may use `randomUUID` if STE id omitted — callers must supply for deterministic OPS)
- Lineage lists sorted by `revision_id` codepoint order
- Double-run exports/snapshots match

### Concurrency / partial-write

- Head CAS: `replace` + `expected_version` (= pointed `revision_id`)
- Stale head → `CONFLICT`
- Ordered failure modes (SPEC-020 §28): Core → ENC → create → advanceHead → appendEvent
- After create without successful advanceHead: orphan revision addressable; head unchanged; **not** silent current scientific commit
- No multi-step transaction; no orphan auto-delete

### Tests

- `scripts/test-020-model-c-revision.mjs` (22 assertion tests)
- `scripts/smoke-020-model-c-revision.mjs`
- Additive REF-OPS-037…046
- Regression: Sprint 016–019 tests + smokes; SCI 44; prior OPS fixtures remain green

### Limitations / non-goals (Sprint 020 historical)

- No Grade / Contradiction / Negative Result / Verification OPS
- No DB / API / UI / AI / KG / DocumentArtifact ingestion
- No distributed concurrency claims
- ResearchSession / ResearchWorkspace remain memory-only

## Sprint 019 IN / OUT (closed)

**IN:** registerEvidenceUnit, getEvidenceUnit, exportEvidenceUnit, REF-OPS-022…036, tests, formal certification.  
**OUT:** Durable workspace, concurrency, Grade/Contradiction/NR/Verification OPS, literature, DocumentArtifact, AI, UI, DB (post-persist Record State delivered in Sprint 021).

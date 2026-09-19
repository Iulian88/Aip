# EXEC-020 FINAL REPORT

## 1. Baseline

| Item | Value |
|------|--------|
| Repository | Iulian88/Aip (local `c:\Users\esell\Desktop\AIP`) |
| Certified baseline HEAD | `dbbc8c67b8c80feada2c6b29389b2a284a619e87` |
| `origin/main` | `dbbc8c67b8c80feada2c6b29389b2a284a619e87` |
| Branch | `main` |
| Commit during EXEC | **NONE** (DO NOT COMMIT / DO NOT PUSH observed) |
| Prior closed sprints | 017, 018, 019 FORMALLY CERTIFIED AND CLOSED |
| Architecture authorization | FINAL-ARCHITECTURE-RE-AUDIT-020 — APPROVED WITH OBSERVATIONS; EXEC authorized |

## 2. Model C Implementation

Implemented **Model C** exactly as ADR-020 / SPEC-020 v0.3.0 / IMPLEMENTATION-DECISION-020:

- Stable scientific identity (`PersistenceEntity.identity`)
- Immutable CanonicalUnit revision rows
- Mutable `RevisionHead` coordination pointer

Authority preserved: Core (science) → ENC → Persistence (storage) → OPS (orchestration). No second journal or scientific graph.

## 3. Revision Identity

| Rule | Implementation |
|------|----------------|
| Initial | `rev:initial` (`INITIAL_REVISION_ID`) |
| Later | Caller-supplied matching `^rev:[A-Za-z0-9._~-]{1,128}$` |
| Forbidden | `randomUUID` / `Math.random` / `Date.now` for revision ids |
| Duplicate | Same storage key → Persistence `ALREADY_EXISTS` |
| Validation | `assertRevisionId` → `INVALID_ID` |

## 4. Storage Addressing

| Key | Formula |
|-----|---------|
| CanonicalUnit revision | `persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}` |
| RevisionHead | `persist:RevisionHead:{unit_kind}:{identity}` |
| Legacy dual-read | Three-segment `persist:CanonicalUnit:{unit_kind}:{identity}` ≡ `rev:initial` |

New writes always use four-segment revision keys. Old rows remain readable without rewrite.

## 5. Lineage

- Authoritative field: `PersistenceEntity.predecessor_revision_id`
- Absent on `rev:initial`; required on later CanonicalUnit revisions
- `getClaimLineage` / `listRevisions` return rows sorted by `revision_id` codepoint order
- No Core/OPS lineage graph; no lineage journal

## 6. RevisionHead

- `entity_kind: RevisionHead`; **not** in `IMMUTABLE_KINDS`
- `content_version` = pointed `revision_id` (CAS token only)
- `ensureInitialHead` / `getHead` / `advanceHead(from, to)`
- Advancement: `replace` + `expected_version = from_revision_id`
- Stale head → `CONFLICT`
- Does not mutate scientific revision payloads

## 7. Claim Standing

`ResearchOperations.transitionClaimStanding`:

1. Load head-resolved ClaimUnit  
2. Decode Claim via OPS-local `claimFromClaimUnitPayload`  
3. `ClaimTransitionService.transition` (Core)  
4. ENC `assemble`  
5. Persistence `create` new revision (`predecessor_revision_id = expected_head_revision_id`)  
6. `advanceHead` CAS  
7. Optional `appendEvent` (`ops.claim_standing_revision`)  

Old revision remains immutable. Invalid Standing → Core typed error (e.g. `F_TRANSITION`).

## 8. Evidence Boundary

- Sprint 019 Evidence Operations preserved
- `registerEvidenceUnit` creates Model C **initial revision only** + RevisionHead
- **No** Evidence post-persist Record State OPS in EXEC-020

## 9. OPS Integration

Added/extended ResearchOperations surface:

- Initial: `registerClaimUnit`, `registerEvidenceUnit` (+ head)
- Transition: `transitionClaimStanding`
- Reads: `getClaimUnit` (head), `getClaimUnitRevision`, `getClaimHead`, `getClaimLineage`
- Export: `exportClaimUnit`, `exportClaimUnitRevision`
- Snapshots: existing ResearchSnapshot / WorkspaceSnapshot schemas unchanged; Persistence snapshot includes revisions + heads

## 10. Persistence Behavior

- `MemoryPersistenceRepository` + `RepositoryPersistencePort` updated for Model C
- Head-aware `get`/`exists` when `revision_id` omitted
- Dual-read for legacy keys
- Snapshot entity sort includes `revision_id` / `storage_key` for determinism
- Single event journal retained

## 11. Error Semantics

| Condition | Error |
|-----------|--------|
| Duplicate revision / create | `ALREADY_EXISTS` |
| Invalid revision id | `INVALID_ID` |
| Missing revision / head | `NOT_FOUND` |
| Stale head / CAS | `CONFLICT` |
| Immutable revision mutate | `IMMUTABLE_ENTITY` |
| Illegal Standing | Core `ClaimValidationError` (e.g. `F_TRANSITION`) |
| OPS misuse (e.g. non-initial register revision) | `OpsError` `INVALID_COMMAND_STATE` |

Lower-layer typed errors propagate; not wrapped into OPS errors.

## 12. Partial-Write Behavior

Honest, documented (no invented transactions):

| Step | On failure |
|------|------------|
| Core transition | Nothing persisted |
| ENC assemble | Nothing persisted |
| `create` revision | Head unchanged |
| `advanceHead` | **Partial:** revision row may exist; head remains prior; not silent current commit |
| `appendEvent` | Revision+head may exist without operational event |
| Membership | Caller-controlled; no Persistence rollback |

Tested: T020-020 / REF-OPS-045 (create without advance leaves head at `rev:initial`).

## 13. Serialization

- Existing `CanonicalEncoder` + `JsonEncoder` (SER-JSON-001)
- No duplicate serializers
- Revision/lineage on PersistenceEntity included in Persistence snapshots
- Head-resolved export uses entity payload only

## 14. Determinism

- Double-run Claim Standing export: identical (T020-014, smoke-020, REF-OPS-043)
- Caller-supplied `revision_id` + STE `event_id` required for deterministic Standing transitions (Core STE builder may use `randomUUID` if `event_id` omitted — observation, pre-existing Core behavior)
- Snapshot/list ordering stable with multi-revision rows

## 15. Snapshots

- ResearchSnapshot (Sprint 016) schema unchanged
- WorkspaceSnapshot (Sprint 018) additive contract unchanged
- Persistence snapshot includes all CanonicalUnit revision rows and `RevisionHead` entities

## 16. Tests

| Suite | Result |
|-------|--------|
| `scripts/test-020-model-c-revision.mjs` | 22/22 PASS |
| `scripts/smoke-020-model-c-revision.mjs` | PASS (`SMOKE_020_PASS`) |
| Coverage themes | initial/subsequent/duplicate revision; lineage; head create/get/advance/stale/CAS; immutable old; Standing valid/invalid; determinism; export; snapshot; missing revision; Evidence/Claim regression; partial-write; dual-read; invalid revision id |

## 17. Reference Tests

| Corpus | Result |
|--------|--------|
| SCI (`CONF-001@1.0.0`) | **44/44** (unchanged) |
| OPS | **46/46** (prior 36 + additive REF-OPS-037…046) |
| FULL | **90/90** |
| Historical fixtures | Unmodified; all prior OPS fixtures still PASS |

No fabricated ReferenceReports / certificates for Sprint 020 formal certification.

## 18. Regression

| Gate | Result |
|------|--------|
| test-016 | PASS |
| test-017 | PASS |
| test-018 | PASS |
| test-019 | PASS |
| smoke-015…020 | PASS |
| `pnpm test` (SCI) | 44/44 |

No regressions vs certified Sprint 015–019 behavior.

## 19. Typecheck / Lint / Build

| Gate | Result |
|------|--------|
| `pnpm run typecheck` | PASS |
| `pnpm run lint` | PASS |
| `pnpm run build` | PASS |

## 20. Smoke

| Smoke | Result |
|-------|--------|
| smoke-015 persistence | PASS |
| smoke-016 reference-app | PASS |
| smoke-017 OPS CONF/CERT | PASS |
| smoke-018 workspace | PASS |
| smoke-019 Evidence | PASS |
| smoke-020 Model C | PASS |

## 21. Known Limitations

1. Evidence post-persist Record State not implemented (out of slice).  
2. Grade / Contradiction / NR / Verification OPS not implemented.  
3. Dual-read only (optional legacy key rewrite not performed).  
4. STE `event_id` must be caller-supplied for deterministic Standing transitions (Core default may be nondeterministic).  
5. Orphan revisions after failed `advanceHead` are addressable but not auto-cleaned (delete forbidden).  
6. In-memory Persistence only; no durable DB.  
7. No distributed concurrency guarantees beyond local CAS semantics.

## 22. Non-Goals

Database, API/REST, backend/frontend, authentication, AI, knowledge graph, literature ingestion, DocumentArtifact ingestion, cloud/distributed infrastructure, Model A/B/D/E reopen, formal Sprint 020 certification, commit/push.

## 23. Files Changed

**Persistence**

- `packages/persistence/src/revision.ts` (new)
- `packages/persistence/src/entity.ts`
- `packages/persistence/src/types.ts`
- `packages/persistence/src/repository.ts`
- `packages/persistence/src/index.ts`
- `packages/persistence/src/memory/store.ts`
- `packages/persistence/src/memory/port.ts`

**OPS / reference-app**

- `apps/reference-app/src/operations/research-operations.ts`
- `apps/reference-app/src/operations/claim-from-unit.ts` (new)
- `apps/reference-app/src/index.ts`

**Reference tests / scripts**

- `packages/reference-tests/src/fixtures/ops.ts` (REF-OPS-037…046)
- `scripts/test-020-model-c-revision.mjs` (new)
- `scripts/smoke-020-model-c-revision.mjs` (new)
- `scripts/test-019-evidence-operations.mjs` (marker `sprint >= 19`)
- `SMOKE_020_PASS` (generated)
- `SMOKE_019_PASS` (regenerated corpus counts)

**Docs / audits**

- `IMPLEMENTATION.md`
- `audits/execution/EXEC-020_FINAL_REPORT.md` (this file)
- Prior design artifacts under `specs/architecture/*020*` and `audits/architecture/*020*` (unchanged contract)

## 24. Git State

```
branch: main
HEAD:        dbbc8c67b8c80feada2c6b29389b2a284a619e87
origin/main: dbbc8c67b8c80feada2c6b29389b2a284a619e87
```

Working tree dirty with EXEC-020 implementation + design artifacts. **No commit. No push.**

## 25. Final Verdict

**EXEC-020 — COMPLETE WITH OBSERVATIONS**

Implementation and required tests pass. Non-blocking observations: Core STE default `event_id` nondeterminism if omitted; dual-read without optional key rewrite; OPS corpus count increased by additive REF-OPS-037…046 (46/46, FULL 90/90) without breaking prior fixtures.

Not CERTIFIED. CODE-AUDIT-020 not started.

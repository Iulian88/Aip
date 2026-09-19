# SciROS Reference Implementation

**Sprint:** EXEC-SPRINT-020 · Model C Post-Persist Scientific Transition  
**Status:** **FORMALLY CERTIFIED AND CLOSED** (CODE-AUDIT-020: APPROVED WITH OBSERVATIONS; required patches: 0)

| Field | Value |
|-------|--------|
| Implementation | COMPLETE |
| Architecture Audit | SPEC-020 / FINAL-ARCHITECTURE-RE-AUDIT-020 APPROVED WITH OBSERVATIONS |
| Independent Code Audit | CODE-AUDIT-020 — APPROVED WITH OBSERVATIONS |
| Required Patches | NONE |
| Formal Certification | CERTIFIED |
| Closure | COMPLETE |
| Architecture | ADR-020 Model C · SPEC-020 v0.3.0-DRAFT · IMPLEMENTATION-DECISION-020 |
| SCI profile | `CONF-001@1.0.0` |
| OPS profile | `CONF-001@1.1.0-OPS` |
| Engine CertificationDecision (SCI) | `CERTIFIED` |
| Engine CertificationDecision (OPS) | `CERTIFIED` |
| Certification artifacts | `fixtures/cert/SPRINT-020_*.json`, `CERT_020_PASS` |
| Corpora | SCI 44/44 · OPS 46/46 · FULL 90/90 |

Non-blocking observations from CODE-AUDIT-020 (O-020-01…O-020-07) remain recorded; they were not eliminated.

Prior: Sprint 019 FORMALLY CERTIFIED AND CLOSED.

| Field | Value |
|-------|--------|
| SPEC | SPEC-020 v0.3.0-DRAFT |
| ADR | ADR-020 Model C |
| Slice | Persistence Model C + Claim Standing post-persist + Evidence initial revision |
| Revision model | Stable scientific identity + immutable revisions + RevisionHead |
| Initial revision | `rev:initial` |
| Later revisions | Caller-supplied `rev:…` |
| Lineage | `PersistenceEntity.predecessor_revision_id` |
| Head | `persist:RevisionHead:{unit_kind}:{identity}` · CAS via `replace` + `expected_version` |

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
```

## Evidence chain (unchanged)

```
OPS → REF-OPS → ReferenceRunner → ReferenceReport
    → ConformanceEngine(profile) → ConformanceReport(profile_id)
    → CertificationEngine → Certificate
```

## Sprint 020 — Model C

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

### Evidence boundary

- Sprint 019 Evidence Operations preserved
- Sprint 020: **initial revision only** (no Evidence post-persist Record State OPS)

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

### Limitations / non-goals

- No Evidence post-persist Record State
- No Grade / Contradiction / Negative Result / Verification OPS
- No DB / API / UI / AI / KG / DocumentArtifact ingestion
- No distributed concurrency claims
- ResearchSession / ResearchWorkspace remain memory-only

## Sprint 019 IN / OUT (closed)

**IN:** registerEvidenceUnit, getEvidenceUnit, exportEvidenceUnit, REF-OPS-022…036, tests, formal certification.  
**OUT:** Durable workspace, concurrency, Grade/Contradiction/NR/Verification OPS, literature, DocumentArtifact, AI, UI, DB, post-persist replace.

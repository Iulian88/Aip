# SciROS Reference Implementation

**Sprint:** EXEC-SPRINT-026 · Provenance Projection & Reproducibility Packaging  
**Status:** **IMPLEMENTATION COMPLETE** (pending CODE-AUDIT-026; not formally certified by this EXEC)

| Field | Value |
|-------|--------|
| Implementation | COMPLETE |
| Architecture | SPEC-026 · IMPLEMENTATION-DECISION-026 · FINAL-ARCHITECTURE-RE-AUDIT-026 — EXEC AUTHORIZED (exact scope) |
| SCI profile | `CONF-001@1.0.0` |
| OPS profile | `CONF-001@1.1.0-OPS` |
| Corpora (live) | SCI 44/44 · OPS 180/180 · FULL 224/224 |
| Prior certified baseline | Sprint 025 @ `8541b20` — FORMALLY CERTIFIED AND CLOSED |

| Field | Value |
|-------|--------|
| SPEC | SPEC-026 |
| Slice | Export-only ResearchRun packaging + provenance projection (Phase R2) |
| Representation | `aip.repro.pack@1.0.0` ReproducibilityPackage (derived) |
| Core | Untouched — packaging never authors scientific meaning |
| Revision model | Certified Model C (unchanged); package order = `revision_id` ASC |
| Head | Persistence-owned RevisionHead (read-only for packaging) |

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
node scripts/test-023-contradiction-ops.mjs
node scripts/smoke-023-contradiction-ops.mjs
node scripts/test-024-negative-result-ops.mjs
node scripts/smoke-024-negative-result-ops.mjs
node scripts/test-025-verification-ops.mjs
node scripts/smoke-025-verification-ops.mjs
node scripts/test-026-reproducibility-packaging.mjs
node scripts/smoke-026-reproducibility-packaging.mjs
```

## Evidence chain (unchanged)

```
OPS → REF-OPS → ReferenceRunner → ReferenceReport
    → ConformanceEngine(profile) → ConformanceReport(profile_id)
    → CertificationEngine → Certificate
```

## Sprint 026 — Provenance Projection & Reproducibility Packaging

### OPS

- `packageResearchRun(input)` → export-time ResearchRun projection → deterministic `ReproducibilityPackage` + `ser`
- Helpers in `operations/reproducibility-packaging.ts` (ordering, locators, axis declaration, SHA-256 digest, verify)
- Profiles: `minimal` \| `with_ops_events`
- Revision policies: `heads_only` \| `explicit_revisions` \| `full_lineage`
- Caller-supplied `package_id` (`rpkg:…`); `content_digest` = SHA-256 hex over `stableStringify(body without digest)`
- Optional organizational context: filtered `member_refs` + session/workspace ids (not scientific)
- `verifyReproducibilityPackage` recomputes digest — does **not** restore Persistence
- Marker sprint → **26**

### Determinism

- No `Date.now` / `randomUUID` / `Math.random` on certified packaging paths
- Double-run identical authoritative inputs → identical `ser`
- Collections sorted per Decision-026 (`revision_id` ASCENDING; identities/locators codepoint ASC)

### Authority

- Package is DERIVED export artifact — never scientific authority
- Seven provenance axes kept separate (no generic provenance graph)
- No second journal / graph / RevisionHead for ResearchRun

### Tests

- `scripts/test-026-reproducibility-packaging.mjs` (10 assertion tests)
- `scripts/smoke-026-reproducibility-packaging.mjs` → `SMOKE_026_PASS` only
- Additive REF-OPS-162…180
- Regression: Sprint 016–025 tests green; SCI 44; OPS 180; FULL 224

### Limitations / non-goals

- Export-only — no import / restore / rehydration / durable bundle store
- No Literature / DocumentArtifact / AI / KG / DB
- No Persistence / Core / ENC / SER / CONF / CERT redesign
- Packaging reproducibility ≠ computational reproducibility
- Formal certification is a later gate (CODE-AUDIT-026 → CERT)

## Sprint 025 — Verification OPS Under Model C

### OPS

- `registerVerificationUnit(input, options?)` → Core `VerificationFactory.createPlanned` → ENC VerificationUnit → `Persistence.create` (`rev:initial`) → `ensureInitialHead`
- `transitionVerificationRecordState` → decode → Core `VerificationTransitionService.transition` (leave-planned → `passed` \| `failed` \| `inconclusive`) → ENC → create successor → VerificationUnit RevisionHead CAS → optional `appendEvent`
- New OPS-local `verificationFromVerificationUnitPayload` (ENC lossy for `ai_assisted` / `human_sponsor` — OQ-025-001 deferred; `artifact_ref` content-only — O-025-04)
- Event type: `ops.verification_record_state_revision` (optional; non-authoritative; caller `vte:` `event_id` required on certified paths)
- Create-once does **not** emit events or auto-register membership
- Does **not** use `Persistence.Relationship` as scientific storage; does **not** reverse-sync `Claim.verified_via`

### Determinism

- Caller-supplied `revision_id` and VTE `event_id` (Core may `randomUUID` if VTE id omitted — callers must supply)
- Double-run exports match

### Concurrency / partial-write

- Same Model C honesty: create may succeed while CAS fails → orphan revision; head unchanged
- Stale CAS for Verification uses mismatched `expected_head_revision_id` while still `planned` (terminals have no second legal Core leave-planned edge)

### Tests

- `scripts/test-025-verification-ops.mjs` (7 assertion tests)
- `scripts/smoke-025-verification-ops.mjs` → `SMOKE_025_PASS` only (does not overwrite 019–024)
- Additive REF-OPS-134…161
- Regression: Sprint 016–024 tests green; SCI 44; OPS 161; FULL 205

### Limitations / non-goals

- No ENC AI-marker addition (OQ-025-001)
- No Claim Standing `verified_via` post-create reverse sync (OQ-025-007)
- No material Verification content OPS / VersionService wiring (OQ-025-004)
- No pre-persist leave-planned on create (OQ-025-005)
- No generic lifecycle engine; no DocumentArtifact OPS
- No DB / API / UI / AI / KG
- ResearchSession / ResearchWorkspace remain memory-only
- Formal certification is a later gate (CODE-AUDIT-025 → CERT)

## Sprint 024 — Negative Result OPS Under Model C

### OPS

- `registerNegativeResultUnit(input, registration, options?)` → Core `NegativeResultFactory.createRegistered` → ENC NegativeResultUnit → `Persistence.create` (`rev:initial`) → `ensureInitialHead`
- `transitionNegativeResultRecordState` → decode → Core `NegativeResultTransitionService.transition` (`registered → withdrawn`) → ENC → create successor → NegativeResultUnit RevisionHead CAS → optional `appendEvent`
- New OPS-local `negativeResultFromNegativeResultUnitPayload` (ENC lossy for `ai_assisted` / `human_sponsor` — OQ-024-001 deferred)
- Event type: `ops.negative_result_record_state_revision` (optional; non-authoritative; caller `nrte:` `event_id` required on certified paths)
- Create-once does **not** emit events or auto-register membership
- Does **not** use `Persistence.Relationship` as scientific storage; does **not** reverse-sync `Claim.qualified_by`

### Determinism

- Caller-supplied `revision_id` and NRTE `event_id` (Core may `randomUUID` if NRTE id omitted — callers must supply)
- Double-run exports match

### Concurrency / partial-write

- Same Model C honesty: create may succeed while CAS fails → orphan revision; head unchanged
- Stale CAS for NR uses mismatched `expected_head_revision_id` while still `registered` (terminals have no second legal Core edge)

### Tests

- `scripts/test-024-negative-result-ops.mjs` (7 assertion tests)
- `scripts/smoke-024-negative-result-ops.mjs` → `SMOKE_024_PASS` only (does not overwrite 019–023)
- Additive REF-OPS-106…133
- Regression: Sprint 016–023 tests green; SCI 44; OPS 133; FULL 177

### Limitations / non-goals

- No ENC AI-marker addition (OQ-024-001)
- No Claim Standing `qualified_by` post-create (OQ-024-007)
- No material Negative Result content OPS (OQ-024-004)
- No Verification OPS; no generic lifecycle engine
- No DB / API / UI / AI / KG / DocumentArtifact
- ResearchSession / ResearchWorkspace remain memory-only
- Formal certification is a later gate (CODE-AUDIT-024 → CERT)

## Sprint 023 — Contradiction OPS Under Model C

### OPS

- `registerContradictionUnit` → Core `ContradictionFactory.createOpen` → ENC ContradictionUnit → `Persistence.create` (`rev:initial`) → `ensureInitialHead`
- `transitionContradictionRecordState` → decode → Core `ContradictionTransitionService.transition` → ENC → create successor → ContradictionUnit RevisionHead CAS → optional `appendEvent`
- New OPS-local `contradictionFromContradictionUnitPayload` (ENC lossy for `ai_assisted` / `human_sponsor` — OQ-023-002 deferred)
- Event type: `ops.contradiction_record_state_revision` (optional; non-authoritative; caller `crte:` `event_id` required on certified paths)
- Create-once does **not** emit events or auto-register membership (Claim/Evidence parity)
- Does **not** use `Persistence.Relationship` as scientific storage; does **not** reverse-sync `Claim.contested_by`

### Determinism

- Caller-supplied `revision_id` and CRTE `event_id` (Core may `randomUUID` if CRTE id omitted — callers must supply)
- Double-run exports match

### Concurrency / partial-write

- Same Model C honesty: create may succeed while CAS fails → orphan revision; head unchanged
- Stale CAS for Contradiction uses mismatched `expected_head_revision_id` while still `open` (terminals have no second legal Core edge)

### Tests

- `scripts/test-023-contradiction-ops.mjs` (7 assertion tests)
- `scripts/smoke-023-contradiction-ops.mjs` → `SMOKE_023_PASS` only (does not overwrite 019–022)
- Additive REF-OPS-077…105
- Regression: Sprint 016–022 tests green; SCI 44; OPS 105; FULL 149

### Limitations / non-goals

- No ENC AI-marker addition (OQ-023-002)
- No Claim `qualified_by` / `verified_via` OPS (OQ-023-005)
- No material Contradiction content OPS (OQ-023-011)
- No NR / Verification OPS; no generic lifecycle engine
- No DB / API / UI / AI / KG / DocumentArtifact
- ResearchSession / ResearchWorkspace remain memory-only

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

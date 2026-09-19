# CODE-AUDIT-020

**Subject:** EXEC-SPRINT-020 — Model C Post-Persist Scientific Transition  
**Audit mode:** READ-ONLY (no source / test / SPEC / architecture patches; no commit; no push; no certification)  
**Contracts audited against:** SPEC-020 v0.3.0-DRAFT · ADR-020 · IMPLEMENTATION-DECISION-020 · FINAL-ARCHITECTURE-RE-AUDIT-020 · EXEC-020_FINAL_REPORT · certified Sprint 015–019 baseline  

**Independent re-verification (auditor-run):** typecheck PASS · lint PASS · build PASS · TEST-020 22/22 · SCI 44/44 · OPS 46/46 · FULL 90/90 · TEST-016…019 PASS · smoke 015–020 PASS  

---

## 1. Baseline

| Item | Verified |
|------|----------|
| `git rev-parse HEAD` | `dbbc8c67b8c80feada2c6b29389b2a284a619e87` |
| `git rev-parse origin/main` | `dbbc8c67b8c80feada2c6b29389b2a284a619e87` |
| Branch | `main` |
| Working tree | Intentionally dirty (EXEC-020 uncommitted) |
| Commit during audit | None |
| Diff base | `dbbc8c67b8c80feada2c6b29389b2a284a619e87` |

**Verdict on baseline:** VERIFIED

---

## 2. Actual Changed Files

### 2.1 Tracked modifications (`git diff` vs baseline)

| Path | Role |
|------|------|
| `packages/persistence/src/entity.ts` | Model C entity construction, revision metadata, IMMUTABLE_KINDS note |
| `packages/persistence/src/types.ts` | `RevisionHead` kind; `revision_id` / `predecessor_revision_id` |
| `packages/persistence/src/repository.ts` | Head / listRevisions / `IdentityOptions.revision_id` |
| `packages/persistence/src/index.ts` | Exports |
| `packages/persistence/src/memory/store.ts` | Dual-read resolveKey; head CAS; listRevisions; sort |
| `packages/persistence/src/memory/port.ts` | Initial revision + ensureInitialHead |
| `apps/reference-app/src/operations/research-operations.ts` | Standing transition + head-aware OPS |
| `apps/reference-app/src/index.ts` | Exports; marker sprint 20 |
| `packages/reference-tests/src/fixtures/ops.ts` | Additive REF-OPS-037…046 |
| `scripts/test-019-evidence-operations.mjs` | Marker assert `sprint >= 19` |
| `IMPLEMENTATION.md` | Sprint 020 facts |
| `SMOKE_019_PASS` | Regenerated corpus line `OPS=46 FULL=90` |

### 2.2 Untracked implementation / contract artifacts

| Path | Role |
|------|------|
| `packages/persistence/src/revision.ts` | Key helpers + revision grammar |
| `apps/reference-app/src/operations/claim-from-unit.ts` | ENC payload → Claim projection for OPS |
| `scripts/test-020-model-c-revision.mjs` | Assertion tests |
| `scripts/smoke-020-model-c-revision.mjs` | Smoke |
| `SMOKE_020_PASS` | Generated smoke marker |
| `specs/architecture/SPEC-020_*.md` | Contract |
| `specs/architecture/ADR-020_*.md` | Model C ADR |
| `specs/architecture/IMPLEMENTATION-DECISION-020.md` | RQ closures |
| `audits/architecture/*020*` | Architecture audits |
| `audits/execution/EXEC-020_*.md` | EXEC reports |
| `audits/code/CODE-AUDIT-020.md` | This audit |

### 2.3 Scope assessment

| Check | Result |
|-------|--------|
| Core / ENC / SER / CONF / CERT / processor packages in diff | **None** (verified empty name-only diff) |
| ResearchSnapshot / WorkspaceSnapshot view schemas | **Unchanged** (`views/timeline.ts` not in diff) |
| Unrelated feature churn | **Not observed** |
| Accidental noise | `SMOKE_019_PASS` corpus count refresh; smoke markers regenerated on re-run — **generated evidence noise**, not scientific logic |
| Sprint 020 scope | Persistence Model C + Claim Standing post-persist + Evidence initial revision + additive REF-OPS + docs/audits |

**Finding:** VERIFIED — change scope matches Sprint 020; no Core scientific package edits.

---

## 3. Model C Verification

| Normative rule | Evidence | Classification |
|----------------|----------|----------------|
| Stable scientific identity | `PersistenceEntity.identity` from envelope; Standing path reuses same `claim_id` / identity | VERIFIED |
| Storage key `persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}` | `makeCanonicalUnitRevisionStorageKey` + `entityFromCanonicalUnit` | VERIFIED |
| Initial `rev:initial` | `INITIAL_REVISION_ID`; register paths default to it | VERIFIED |
| Later caller-supplied `rev:…` | `transitionClaimStanding` requires caller `revision_id`; rejects `rev:initial` | VERIFIED |
| `revision_id` is Persistence metadata ≠ SemVer | Separate from `content_version`; Head uses `content_version` as CAS token only | VERIFIED |
| Not silently generated | No `randomUUID`/`Date.now`/`Math.random` in Persistence or OPS Sprint 020 paths | VERIFIED |
| Duplicate revision rejected | Same `storage_key` → `ALREADY_EXISTS` (T020-003, REF-OPS-040) | VERIFIED |
| Revision content immutable | `CanonicalUnit` in `IMMUTABLE_KINDS`; differing replace → `IMMUTABLE_ENTITY` (T020-010) | VERIFIED |
| Deterministic lookup | `get` with `revision_id` / head resolution / dual-read | VERIFIED |

**Finding:** VERIFIED — Model C contract implemented.

---

## 4. Revision Identity

| Check | Result | Classification |
|-------|--------|----------------|
| Grammar `^rev:[A-Za-z0-9._~-]{1,128}$` | `REVISION_ID` + `assertRevisionId` | VERIFIED |
| Default initial | `rev:initial` | VERIFIED |
| No Persistence/OPS revision auto-generation | Caller or default initial only | VERIFIED |
| Invalid id → typed error | `INVALID_ID` (T020-022) | VERIFIED |

**Finding:** VERIFIED

---

## 5. Lineage

| Check | Result | Classification |
|-------|--------|----------------|
| Authoritative field `PersistenceEntity.predecessor_revision_id` | Present on entity; required for non-initial at build time | VERIFIED |
| Absent on `rev:initial` | Enforced in `entityFromCanonicalUnit` | VERIFIED |
| Standing path sets predecessor = `expected_head_revision_id` | `transitionClaimStanding` | VERIFIED |
| No Core revision graph | Core packages untouched; Standing uses Core Standing only | VERIFIED |
| No OPS lineage graph | `getClaimLineage` reads Persistence rows only | VERIFIED |
| No auto scientific relationship sync | No bears_on↔supported_by sync introduced | VERIFIED |
| Predecessor **existence** of named prior row at `create` | Format/self-diff checks only; **no store.exists(predecessor)** | OBSERVATION |

**Observation O-020-01:** SPEC-020 §28 lists “Missing predecessor” as an error. Implementation requires the field and rejects self-predecessor / predecessor on `rev:initial`, but does not verify that the predecessor `revision_id` names an existing CanonicalUnit row before `create`. Normal Standing stale-head cases still point at an existing prior revision; a pathological never-created `expected_head_revision_id` can leave an orphan revision with dangling predecessor metadata after CAS `CONFLICT` (authorized partial-write). Not a second graph; not silent success.

**Finding:** VERIFIED with O-020-01

---

## 6. RevisionHead / CAS

| Check | Result | Classification |
|-------|--------|----------------|
| Kind `RevisionHead` | In `PERSISTENCE_ENTITY_KINDS` | VERIFIED |
| Key `persist:RevisionHead:{unit_kind}:{identity}` | `makeRevisionHeadStorageKey` | VERIFIED |
| Not in `IMMUTABLE_KINDS` | Explicit exclusion | VERIFIED |
| `content_version` = pointed revision_id | `entityFromRevisionHead` | VERIFIED |
| create / get / advance | `ensureInitialHead` / `getHead` / `advanceHead` | VERIFIED |
| CAS via `replace` + `expected_version` | `advanceHead` → `replace(next, { expected_version: from })` | VERIFIED |
| Stale → `CONFLICT` | Pre-check + replace path (T020-008/009, REF-OPS-039) | VERIFIED |
| Failed CAS does not advance head | Head unchanged; error thrown; no return success | VERIFIED |
| Head not scientific authority | Infrastructure pointer only; Core owns Standing | VERIFIED |

### Partial-write (revision vs head vs journal)

Ordered Standing path: Core → ENC → `create` → `advanceHead` → optional `appendEvent`.

| Failure point | State | Classification |
|---------------|-------|----------------|
| Before `create` | Nothing persisted | VERIFIED |
| After `create`, before/at `advanceHead` fail | Revision row may exist; head prior; event not appended; **not** silent current commit | VERIFIED (SPEC-020 §28; T020-020; REF-OPS-045) |
| After head success, event fail | Revision+head without ops event (journal non-authoritative) | VERIFIED by contract; optional path |

**Finding:** VERIFIED — partial-write is an intentional architectural limitation, honestly implemented and tested. No invented transaction layer.

---

## 7. Immutability

| Check | Result | Classification |
|-------|--------|----------------|
| Canonical revisions not overwritten | `IMMUTABLE_KINDS` includes `CanonicalUnit` | VERIFIED |
| Old revisions readable | `getClaimUnitRevision` / dual-read | VERIFIED |
| New revisions additive | New storage_key rows | VERIFIED |
| Sprint 015 immutability intact | smoke-015 + TEST-016 IMMUTABLE_ENTITY still PASS | VERIFIED |
| `expected_version` does not rewrite CanonicalUnits | Differing CanonicalUnit replace still `IMMUTABLE_ENTITY`; CAS only effective for mutable `RevisionHead` | VERIFIED |

**Finding:** VERIFIED

---

## 8. Legacy Dual-Read

| Check | Result | Classification |
|-------|--------|----------------|
| Three-segment key ≡ `rev:initial` | `resolveKey` tries four-segment then legacy | VERIFIED (T020-021) |
| New writes four-segment | `entityFromCanonicalUnit` always four-segment for CanonicalUnit | VERIFIED |
| No implicit rewrite/migration | Dual-read only; no key rewrite path | VERIFIED (authorized EXEC choice) |
| No second scientific authority via legacy | Same identity/payload; head bootstrap via `ensureInitialHead` | VERIFIED |

**Finding:** VERIFIED

---

## 9. Claim Standing

Audited path in `transitionClaimStanding`:

1. Head-resolved `getClaimUnit`  
2. `claimFromClaimUnitPayload` (OPS projection from ENC unit)  
3. `ClaimTransitionService.transition` (**Core** scientific authorization)  
4. `CanonicalEncoder.assemble`  
5. `repository.create` (new immutable revision + predecessor)  
6. `repository.advanceHead` CAS  
7. Optional `appendEvent`  

| Check | Result | Classification |
|-------|--------|----------------|
| Core authorizes Standing | Uses Core transition service; invalid → Core error (T020-012) | VERIFIED |
| OPS orchestrates only | No Standing rules in Persistence | VERIFIED |
| No second Standing authority | Head is not Standing | VERIFIED |
| Old revision immutable | T020-010 | VERIFIED |
| Predecessor + head update on success | T020-002/007/011 | VERIFIED |
| Stale head CONFLICT | T020-008 | VERIFIED |
| Failed transition does not report success | Throws; no success return after CAS failure | VERIFIED |

**Observation O-020-02:** `claimFromClaimUnitPayload` reconstructs Claim from ENC content + envelope events/references. This is OPS projection into Core, not a second scientific store. Optional Core fields not projected by ENC content (e.g. some terminal-only fields) may be incomplete; Standing slice paths exercised by tests remain valid.

**Finding:** VERIFIED with O-020-02

---

## 10. Evidence Boundary

| Check | Result | Classification |
|-------|--------|----------------|
| No Evidence post-persist Record State OPS API | No new Evidence transition method beyond pre-persist option | VERIFIED |
| Initial revision + head only | `registerEvidenceUnit` → `rev:initial` + `ensureInitialHead` | VERIFIED |
| Sprint 019 regression | TEST-019 PASS; REF-OPS-022…036 still present and green; REF-OPS-042 Evidence head | VERIFIED |
| No new Evidence scientific semantics in Core | Core package not modified | VERIFIED |

**Finding:** VERIFIED — no Evidence scope creep.

---

## 11. Scientific Authority

| Layer | Role in Sprint 020 | Classification |
|-------|--------------------|----------------|
| Scientific Core | Standing semantics / validation | VERIFIED |
| ENC | Canonical assemble / identity / intact | VERIFIED |
| Persistence | Storage, revision keys, head CAS, lineage metadata | VERIFIED |
| OPS | Orchestration / projection / optional ops events | VERIFIED |

| Anti-pattern | Result |
|--------------|--------|
| Second scientific relationship graph | Not introduced |
| Second event journal | Not introduced (single Persistence journal) |
| Scientific mutation in Persistence | Revisions immutable; head non-scientific |
| Scientific authority in RevisionHead | Absent |

**Finding:** VERIFIED

---

## 12. Determinism

### Independent search (Sprint 020 Persistence + OPS + TEST-020 + new REF-OPS)

| Pattern | Persistence / OPS Sprint 020 | Classification |
|---------|------------------------------|----------------|
| `Math.random` | Absent | VERIFIED |
| `Date.now` / `new Date()` | Absent | VERIFIED |
| `randomUUID` | Absent in Persistence/OPS Sprint 020 code | VERIFIED |
| Generated revision ids | None | VERIFIED |

### Core STE `randomUUID` (pre-existing, not introduced by EXEC-020)

`packages/core/src/claim/event-builder.ts` still defaults `event_id` via `randomUUID` when omitted.

| Question | Auditor determination |
|----------|----------------------|
| Violates Sprint 020 **revision_id** determinism contract? | **No** — revision/head ids are caller-supplied / `rev:initial` |
| Introduced by Sprint 020? | **No** — Core untouched; pre-Sprint-020 behavior |
| Tests | Standing tests/fixtures supply deterministic `event_id` |
| Classification | **OBSERVATION O-020-03** — non-blocking; **not** a required Sprint 020 patch |

Compliance choice: **B. non-blocking observation** (fully aligned with revision/head contract; callers must supply STE `event_id` for deterministic Standing payloads — same as prior Core usage).

Double-run export / REF-OPS-043 / smoke-020 determinism: PASS under auditor re-run.

**Finding:** VERIFIED with O-020-03

---

## 13. Snapshot / Serialization Compatibility

| Check | Result | Classification |
|-------|--------|----------------|
| ResearchSnapshot schema frozen | `views/timeline.ts` not modified; TEST-018/019 snapshot tests PASS | VERIFIED |
| WorkspaceSnapshot compatible | Unchanged schema; still wraps Persistence snapshot | VERIFIED |
| Membership not redefined by revision metadata | Membership remains scientific identity + `unit_kind` | VERIFIED |
| Persistence snapshot includes revisions + heads | REF-OPS-044 | VERIFIED |
| SER export payload-only | `jsonEncoder.encode(entity.payload)` | VERIFIED |
| Deterministic export | T020-014/015 | VERIFIED |

**Finding:** VERIFIED

---

## 14. Error Semantics

| Condition | Observed behavior | Classification |
|-----------|-------------------|----------------|
| Duplicate revision | `PersistenceError` `ALREADY_EXISTS` | VERIFIED |
| Invalid revision id | `INVALID_ID` | VERIFIED |
| Stale CAS | `CONFLICT` | VERIFIED |
| Missing revision | `NOT_FOUND` | VERIFIED |
| Immutable mutate | `IMMUTABLE_ENTITY` | VERIFIED |
| Illegal Standing | Core `ClaimValidationError` (e.g. `F_TRANSITION`) — not wrapped as OpsError | VERIFIED |
| OPS misuse | `OpsError` `INVALID_COMMAND_STATE` where applicable | VERIFIED |
| Generic catch destroying typed errors | Standing/register paths propagate lower-layer errors | VERIFIED |

**Observation O-020-04:** SPEC table “Same revision_id + identical fingerprint → Idempotent success” is not implemented on raw `create` (always `ALREADY_EXISTS`). Identical replace remains idempotent; Port hand-off uses exists→replace. Create-once tests intentionally expect `ALREADY_EXISTS`. Non-blocking relative to Standing/CAS correctness.

**Finding:** VERIFIED with O-020-04

---

## 15. Regression Results

Auditor-run (read-only; no code edits):

| Gate | Result |
|------|--------|
| `pnpm run typecheck` | PASS |
| `pnpm run lint` | PASS |
| `pnpm run build` | PASS |
| TEST-016 | PASS |
| TEST-017 | PASS |
| TEST-018 | PASS |
| TEST-019 | PASS |
| TEST-020 | 22/22 PASS |
| SCI corpus | 44/44 |
| OPS corpus | 46/46 |
| FULL corpus | 90/90 |
| smoke-015…020 | PASS |

Prior certified corpora remain green; OPS grew additively (+10 REF-OPS-037…046).

**Finding:** VERIFIED

---

## 16. Test Quality

| Theme | Proof | Quality |
|-------|-------|---------|
| Initial revision | T020-001, REF-OPS-037 | Assertion-based |
| Second revision | T020-002 | Assertion-based |
| Duplicate revision | T020-003, REF-OPS-040 | Assertion-based |
| Lineage | T020-004, REF-OPS-038 | Assertion-based |
| Head create/get/advance | T020-005…007 | Assertion-based |
| Stale CAS | T020-008/009, REF-OPS-039 | Assertion-based |
| Immutability | T020-010 | Assertion-based |
| Claim Standing | T020-011/012, REF-OPS-038/041 | Assertion-based |
| Deterministic export/snapshot | T020-014…016, REF-OPS-043/044 | Assertion-based |
| Legacy dual-read | T020-021 | Assertion-based |
| Partial-write | T020-020, REF-OPS-045 | Assertion-based |
| Evidence/Claim regression | T020-018/019, REF-OPS-042 | Assertion-based |
| Marker-only tests | Not used for Model C claims | VERIFIED |

**Finding:** VERIFIED — Sprint 020 tests are substantive; not marker-only.

---

## 17. Scope-Creep Check

| Forbidden in Sprint 020 | Present? |
|-------------------------|----------|
| Database | No |
| API / backend / frontend | No |
| AI / KG / literature / DocumentArtifact crawler | No |
| Distributed / multi-user concurrency model | No (local CAS only) |
| Durable workspace | No |
| Automatic relationship synchronization | No |
| Grade / Contradiction / NR / Verification OPS | No |
| Evidence post-persist transitions | No |

**Finding:** VERIFIED

---

## 18. Findings

| ID | Class | Summary |
|----|-------|---------|
| F-020-01 | VERIFIED | Model C keys, identity, immutability, head CAS, Standing path, Evidence boundary, authority separation |
| O-020-01 | OBSERVATION | No Persistence `create`-time existence check that `predecessor_revision_id` names an existing revision row |
| O-020-02 | OBSERVATION | OPS Claim reconstruction from ENC projection is lossy for fields not in ENC content; adequate for audited Standing slice |
| O-020-03 | OBSERVATION | Pre-existing Core STE `randomUUID` if `event_id` omitted; Sprint 020 revision/head ids remain deterministic; tests supply `event_id` |
| O-020-04 | OBSERVATION | Raw `create` rejects duplicate keys with `ALREADY_EXISTS` even if fingerprint identical (idempotency via replace/Port) |
| O-020-05 | OBSERVATION | Generated smoke markers (`SMOKE_019_PASS` corpus counts; `SMOKE_020_PASS`) are evidence noise, not architecture |
| O-020-06 | OBSERVATION | Dual-read without optional legacy key rewrite (explicitly allowed) |
| O-020-07 | OBSERVATION | Documented partial-write (revision without head) is intentional; tested; not a silent scientific commit |

**BLOCKER findings:** none  
**REQUIRED PATCH findings:** none  

---

## 19. Required Patches

**None.**

No material non-compliance requiring a patch cycle before formal certification pipeline entry. Observations above are non-blocking and/or pre-existing / explicitly authorized architectural limitations.

---

## 20. Final Verdict

**APPROVED WITH OBSERVATIONS**

- **Blockers:** 0  
- **Required patches:** 0  
- **Observations:** O-020-01 … O-020-07 (non-blocking)  

Sprint 020 implementation matches the Model C contract for Persistence revision infrastructure, RevisionHead CAS, Claim Standing post-persist orchestration, Evidence initial-revision boundary, determinism of revision/head identity, and regression against Sprint 015–019.

This audit does **not** certify Sprint 020. Formal certification remains a separate step after this code audit.

---

*End CODE-AUDIT-020 — STOP. No commit. No push. No certification.*

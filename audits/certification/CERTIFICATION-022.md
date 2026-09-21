# CERTIFICATION-022

## 1. Certification Identity

| Item | Value |
|------|--------|
| Sprint | EXEC-SPRINT-022 |
| Subject | Grade OPS |
| Scope | Post-persist Evidence Grade assignment via `ResearchOperations.assignEvidenceGrade` → Core `EvidenceGradeService.assign` → immutable EvidenceUnit revision → EvidenceUnit RevisionHead CAS → optional operational event |
| Selected architecture | **Option A** (EvidenceUnit + `grade_ref` authoritative) under **Model C** |
| Chain | Reference Tests → ReferenceReport → ConformanceEngine → ConformanceReport → CertificationEngine → CertificationReport |
| SCI profile | `CONF-001@1.0.0` |
| OPS profile | `CONF-001@1.1.0-OPS` |
| Engines | Single ConformanceEngine · single CertificationEngine (verified: one `class ConformanceEngine`, one `class CertificationEngine`; no `*OPSConformance*` / `*OPSCertification*` exports) |
| Evidence | Live corpora only — ReferenceReports produced by `ReferenceRunner` (`REF-TEST-001`); nothing fabricated or hand-constructed |

Preflight verified before emission (read-only inputs):

1. SPEC-022 — DRAFT audited; Option A CLOSED (§5); OQ-022-001…008 CLOSED  
2. ARCHITECTURE-AUDIT-022 — APPROVED WITH OBSERVATIONS (0 blockers · 0 required patches)  
3. IMPLEMENTATION-DECISION-022 — IMPLEMENTATION-READY (closed file budget)  
4. FINAL-ARCHITECTURE-RE-AUDIT-022 — EXEC-022 AUTHORIZED (0 blockers · 0 required patches)  
5. EXEC-022_REPORT — COMPLETE WITH OBSERVATIONS  
6. CODE-AUDIT-022 — VERIFIED WITH OBSERVATIONS · Blockers 0 · Required patches 0 · Readiness READY  
7. CERTIFICATION-020 / CERTIFICATION-021 artifact structure and identity scheme (followed; not modified)  
8. Current repository state (verified independently below)

## 2. Baseline

| Item | Value |
|------|--------|
| Pre-sprint certified HEAD | `d2eedef23a4193c40d3a3b4d2a73cf81c65795c7` |
| origin/main | `d2eedef23a4193c40d3a3b4d2a73cf81c65795c7` (HEAD == origin/main) |
| Sprint 020 | FORMALLY CERTIFIED AND CLOSED (Model C + Claim Standing) |
| Sprint 021 | FORMALLY CERTIFIED AND CLOSED (Evidence Record State OPS) |
| Sprint 022 working-tree delta | `research-operations.ts`, `index.ts`, additive `fixtures/ops.ts`, `IMPLEMENTATION.md`, `test-022` / `smoke-022` scripts, `SMOKE_022_PASS`, Sprint 022 design/audit docs |
| Diff in `packages/core`, `persistence`, `encoding`, `serialization`, `conformance`, `certification` | **NONE** (`git diff --stat` empty) |

## 3. Reference Test Results

| Corpus | Result |
|--------|--------|
| REF-CORPUS-SCI | **44/44** |
| REF-CORPUS-OPS | **76/76** |
| REF-CORPUS-FULL | **120/120** |
| Additive Sprint 022 fixtures | REF-OPS-062…076 (15) — all PASS in FULL ReferenceReport |
| Prior fixtures | REF-OPS-001…061 unchanged (hunk begins after REF-OPS-061); SCI fixtures unchanged |

REF-OPS-062…076 verified as deterministic (caller-supplied `evidence_id`, `revision_id`, `expected_head_revision_id`, `gae:` `event_id`, `at`, agents, `decision_ref`), assertion-based, additive, scoped to Grade OPS, evaluated under the existing OPS profile, and not redefining SCI semantics (`REF-GRADE-*` remain SCI-only; no SCI fixture edits).

## 4. SCI Conformance

| Item | Value |
|------|--------|
| Profile | `CONF-001@1.0.0` |
| Corpus | REF-CORPUS-SCI |
| Reference result | 44/44 |
| Authorities | 12/12 COMPLIANT · dimensions 7/7 |
| Conformance overall | **COMPLIANT** |
| Artifact | `fixtures/cert/SPRINT-022_SCI_ConformanceReport.json` |

## 5. OPS Conformance

| Item | Value |
|------|--------|
| Profile | `CONF-001@1.1.0-OPS` |
| Authoring corpus | REF-CORPUS-OPS (76) |
| Evaluation corpus | REF-CORPUS-FULL (120) |
| OPS reference result | 76/76 |
| `OPS-001` | COMPLIANT |
| Authorities | 13/13 COMPLIANT · dimensions 7/7 |
| Conformance overall | **COMPLIANT** |
| Artifact | `fixtures/cert/SPRINT-022_OPS_ConformanceReport.json` |

## 6. FULL Corpus

| Item | Value |
|------|--------|
| REF-CORPUS-FULL | **120/120** |
| Construction | SCI (44) + OPS (76) |

## 7. Certification Results

| Track | Decision | Artifact |
|-------|----------|----------|
| SCI | **CERTIFIED** | `fixtures/cert/SPRINT-022_SCI_CertificationReport.json` |
| OPS | **CERTIFIED** | `fixtures/cert/SPRINT-022_OPS_CertificationReport.json` |

Both certificates emitted by the single `CertificationEngine.certify(session_id, ConformanceReport)`; SCI scope excludes `OPS-001`, OPS scope includes `OPS-001` and is bound to `profile=CONF-001@1.1.0-OPS`.

## 8. Certificate Identities

| Track | Certificate ID |
|-------|----------------|
| SCI | `cert:sess-sprint-022-formal-sci:sciros-reference-test-suite:certified` |
| OPS | `cert:sess-sprint-022-formal-ops:sciros-full-reference-corpus:certified` |

Session ids: `sess-sprint-022-formal-sci` · `sess-sprint-022-formal-ops`  
Suites: SciROS Reference Test Suite · SciROS Full Reference Corpus

## 9. Grade OPS Semantics (verified against source)

| Check | Evidence | Result |
|-------|----------|--------|
| Grade remains Core-owned | `assignEvidenceGrade` calls `this.evidenceGrades.assign(priorEvidence, input.assignment)`; no Grade labels/ranks/eligibility/Human-gate logic in OPS | PASS |
| No second Grade vocabulary in OPS | grep of OPS for Grade rules: none; Core errors (`EvidenceGradeValidationError` F1/F5) propagate unwrapped (REF-OPS-065/074) | PASS |
| Option A | `encoder.assemble(evidence)` → EvidenceUnit only; no GradeDesignationUnit create/CAS in assign path (REF-OPS-072, T022-005, smoke-022 `option-a-no-grade-designation-unit`) | PASS |
| Delegation to existing Core `assign` | Core package diff NONE; same service used by SCI `REF-GRADE-*` | PASS |
| OPS not scientific authority | Orchestration only: head get → decode → Core → ENC → create → CAS → optional event | PASS |
| Canonicalized through existing ENC | `CanonicalEncoder.assemble`; encoding package diff NONE | PASS |
| Persisted through existing Persistence | `repository.create(entityFromCanonicalUnit(...))`; persistence package diff NONE | PASS |
| RevisionHead CAS (Model C) | `repository.advanceHead(identity, "EvidenceUnit", expected_head_revision_id, revision_id)`; stale → `CONFLICT` (REF-OPS-067, T022-004) | PASS |
| Previous revisions immutable | REF-OPS-073; REF-OPS-069 prior revision retains `deferred_sci003` | PASS |
| Scientific identity stable | `evidence_id` unchanged across assign; `grade_ref` is a string designation, not an identity | PASS |
| Revision identity ≠ scientific identity | `revision_id` (`rev:…`) vs `evidence_id`; `evidence_version` SemVer bumped by Core, distinct from both | PASS |
| `predecessor_revision_id` preserved | `= expected_head_revision_id` (REF-OPS-063, T022-002) | PASS |
| Deterministic caller-supplied revision IDs | `assertRevisionId`; rejects `rev:initial` and `revision_id === expected_head_revision_id` | PASS |
| No random/time-based identity introduced | grep `randomUUID|Math.random|Date.now|new Date()` across `apps/reference-app/src`, `fixtures/ops.ts`, `test-022`, `smoke-022`: **none** | PASS |
| Operational events operational only | `ops.evidence_grade_assignment_revision`, optional (`append_event === true`), appended only after successful CAS, sole Persistence journal, `to_grade_ref` from Core result | PASS |
| Membership distinct | Assign path does not call `registerMember`/workspace upsert (REF-OPS-075); membership ≠ `grade_ref` ≠ `bears_on` ≠ `supported_by` ≠ lineage ≠ authority | PASS |

## 10. Persistence Boundary

| Check | Result |
|-------|--------|
| Persistence infrastructure-only; stores authoritative EvidenceUnit revisions | PASS |
| Persistence does not interpret Grade semantics | PASS (no Grade code in `packages/persistence`; diff NONE) |
| Model C unchanged (keys, `rev:initial`, `predecessor_revision_id`, RevisionHead, CAS) | PASS |
| RevisionHead is the head mechanism; CAS intact; stale head → CONFLICT; duplicate → ALREADY_EXISTS | PASS (REF-OPS-067/068) |
| Immutable historical revisions intact | PASS (REF-OPS-073) |
| Partial-write honesty (create ok, CAS fail → orphan, head unchanged) | Preserved (T022-006) — authorized Model C behaviour |

## 11. ENC / SER Boundary

| Check | Result |
|-------|--------|
| `CanonicalEncoder` remains canonical encoding authority; assign path uses `assemble` | PASS |
| Grade assignment does not bypass canonical encoding | PASS |
| Serialization via existing SER-JSON `exportEvidenceUnit` / `exportEvidenceUnitRevision` | PASS (REF-OPS-069, T022-005) |
| No second canonical representation / serializer / profile | PASS (`encoding`, `serialization` diff NONE) |

## 12. Determinism

| Check | Result |
|-------|--------|
| Double-run Grade OPS export (REF-OPS-064 · T022-007 · smoke-022 `determinism`) | PASS |
| Caller-supplied `revision_id` + GAE `event_id` (`gae:…`) + `at` on certified paths | PASS |
| SCI / OPS ConformanceReport JSON identical across repeated evaluation and across re-run corpora | PASS |
| SCI / OPS CertificationReport JSON identical across repeated `certify` | PASS |
| Core GAE `randomUUID` fallback | Not exercised on certified paths; Core not modified (O-CA-022-03) |

## 13. Regression

Re-verified independently at formal certification:

| Gate | Result |
|------|--------|
| typecheck | PASS |
| lint | PASS |
| build | PASS |
| TEST-016 | 10/10 PASS |
| TEST-017 | 12/12 PASS |
| TEST-018 | 10/10 PASS |
| TEST-019 | 10/10 PASS |
| TEST-020 | 22/22 PASS — includes `T020-022 invalid revision identity rejected`; `TEST_020_PASS` (regression evidence) |
| TEST-021 | 15/15 PASS |
| TEST-022 | **7/7 PASS** |
| smoke-017 | PASS (marker regenerated byte-identical; git clean) |
| smoke-019 | PASS (see O-CERT-022-01) |
| smoke-020 | PASS (run from temp cwd; repo marker untouched) |
| smoke-021 | PASS (run from temp cwd; repo marker untouched) |
| smoke-022 | PASS → `SMOKE_022_PASS` (corpus SCI=44 OPS=76 FULL=120; conformance COMPLIANT) |
| SCI / OPS / FULL | 44 / 76 / 120 |
| Historical smoke markers `SMOKE_017/019/020/021_PASS` | `git status` clean — unmodified |

Sprint 019 Evidence create-once, Sprint 020 Model C / Claim Standing, and Sprint 021 Evidence Record State remain intact (TEST-019/020/021 + REF-OPS-076 Record State + Grade coexistence).

## 14. Typecheck / Lint / Build

| Gate | Result |
|------|--------|
| `pnpm run typecheck` | **PASS** |
| `pnpm run lint` | **PASS** |
| `pnpm run build` | **PASS** |

## 15. Observations

Non-blocking (not converted to patches; certification rules do not require it):

1. **O-CA-022-01** — `ResearchOperationsDeps` now requires `evidenceGrades`; legacy `smoke-016` manual construction is a pre-existing pattern; Grade path uses `createResearchOperations`  
2. **O-CA-022-02** — Partial-write orphan after `create` + CAS failure remains authorized Model C honesty (T022-006)  
3. **O-CA-022-03** — Core GAE `randomUUID` fallback when `event_id` omitted; certified paths supply `gae:` ids; Core not modified  
4. **O-CA-022-04** — Sprint 022 design/audit docs remain untracked alongside EXEC delta pending Git closure  
5. **O-CERT-022-01** — `smoke-019` writes `SMOKE_019_PASS` with current corpus counts (would change OPS=46→76 text); it was run for the PASS verdict and the marker was restored to HEAD content immediately (`git diff --quiet HEAD -- SMOKE_019_PASS` = clean). Historical artifact unchanged.

## 16. Blockers

**0**

## 17. Required Patches

**0**

## 18. Formal Artifacts

| Artifact | Path |
|----------|------|
| SCI ConformanceReport | `fixtures/cert/SPRINT-022_SCI_ConformanceReport.json` |
| OPS ConformanceReport | `fixtures/cert/SPRINT-022_OPS_ConformanceReport.json` |
| SCI CertificationReport | `fixtures/cert/SPRINT-022_SCI_CertificationReport.json` |
| OPS CertificationReport | `fixtures/cert/SPRINT-022_OPS_CertificationReport.json` |
| Formal certification summary | `fixtures/cert/SPRINT-022_FORMAL_CERTIFICATION.json` |
| Marker | `CERT_022_PASS` |
| Narrative | `audits/certification/CERTIFICATION-022.md` |

Historical `SPRINT-017…021` certification artifacts, `CERT_017…021_PASS`, and `CERTIFICATION-020/021.md` not modified.

## 19. Final Certification Verdict

**CERTIFIED**

| Track | Status |
|-------|--------|
| SCI | CERTIFIED |
| OPS | CERTIFIED |
| Model C | CONFIRMED — unchanged |
| Option A | CONFIRMED — EvidenceUnit + `grade_ref` authoritative; no GradeDesignationUnit dual-write |
| Sprint 022 | **FORMALLY CERTIFIED** |
| Git closure | **PENDING** (separate FINAL GIT CLOSURE step) |

No runtime/source/test/spec/architecture modifications during certification.  
No Git commit. No Git push.

*End CERTIFICATION-022.*

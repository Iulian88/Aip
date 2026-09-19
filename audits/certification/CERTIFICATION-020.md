# CERTIFICATION-020

## 1. Certification Basis

| Item | Value |
|------|--------|
| Sprint | EXEC-SPRINT-020 |
| Subject | Model C Post-Persist Scientific Transition |
| Chain | Reference Tests → ReferenceReport → ConformanceEngine → ConformanceReport → CertificationEngine → CertificationReport |
| SCI profile | `CONF-001@1.0.0` |
| OPS profile | `CONF-001@1.1.0-OPS` |
| Engines | Single ConformanceEngine · single CertificationEngine (no ad-hoc path) |
| Evidence | Live corpora only — ReferenceReports not fabricated |

Preflight verified before emission:

1. SPEC-020 / FINAL-ARCHITECTURE-RE-AUDIT-020 — APPROVED WITH OBSERVATIONS  
2. EXEC-020 — COMPLETE WITH OBSERVATIONS  
3. CODE-AUDIT-020 — APPROVED WITH OBSERVATIONS  
4. Required patches = 0  
5. Blockers = 0  
6. Test evidence present (TEST-016…020, smoke 015–020, corpora)  
7. Scope matches authorized Sprint 020 (Model C Persistence + Claim Standing post-persist + Evidence initial revision only)

## 2. Architecture Basis

| Item | Value |
|------|--------|
| ADR | ADR-020 — Model C |
| Model | Stable Scientific Identity + Immutable Revisions + RevisionHead |
| SPEC | SPEC-020 v0.3.0-DRAFT |
| Implementation decision | IMPLEMENTATION-DECISION-020 — IMPLEMENTATION-READY |
| Final architecture audit | FINAL-ARCHITECTURE-RE-AUDIT-020 — APPROVED WITH OBSERVATIONS; EXEC authorized |

Normative Model C facts recorded in formal certification artifact:

- Revision key: `persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}`
- Initial: `rev:initial`
- Later: caller-supplied `rev:…`
- Lineage: `PersistenceEntity.predecessor_revision_id`
- Head: `persist:RevisionHead:{unit_kind}:{identity}` via `replace` + `expected_version` CAS
- Evidence: initial revision + head only

## 3. EXEC Evidence

| Item | Value |
|------|--------|
| Report | `audits/execution/EXEC-020_FINAL_REPORT.md` |
| Status | COMPLETE WITH OBSERVATIONS |
| Implementation | Persistence Model C + `transitionClaimStanding` + Evidence initial revision |
| Determinism / gates | PASS (as recorded in EXEC and re-verified at certification) |

## 4. CODE-AUDIT Evidence

| Item | Value |
|------|--------|
| Report | `audits/code/CODE-AUDIT-020.md` |
| Verdict | APPROVED WITH OBSERVATIONS |
| Blockers | 0 |
| Required patches | 0 |

## 5. SCI Conformance

| Item | Value |
|------|--------|
| Profile | `CONF-001@1.0.0` |
| Corpus | REF-CORPUS-SCI |
| Reference result | 44/44 |
| Conformance overall | COMPLIANT |
| Artifact | `fixtures/cert/SPRINT-020_SCI_ConformanceReport.json` |
| Certification decision | CERTIFIED |
| Certificate id | `cert:sess-sprint-020-formal-sci:sciros-reference-test-suite:certified` |
| Artifact | `fixtures/cert/SPRINT-020_SCI_CertificationReport.json` |

## 6. OPS Conformance

| Item | Value |
|------|--------|
| Profile | `CONF-001@1.1.0-OPS` |
| Authoring corpus | REF-CORPUS-OPS (46) |
| Evaluation corpus | REF-CORPUS-FULL (90) |
| OPS reference result | 46/46 |
| Conformance overall | COMPLIANT |
| Artifact | `fixtures/cert/SPRINT-020_OPS_ConformanceReport.json` |
| Certification decision | CERTIFIED |
| Certificate id | `cert:sess-sprint-020-formal-ops:sciros-full-reference-corpus:certified` |
| Artifact | `fixtures/cert/SPRINT-020_OPS_CertificationReport.json` |

Additive Sprint 020 fixtures: REF-OPS-037…046. Prior Sprint 015–019 fixtures not rewritten for certification.

## 7. FULL Corpus

| Item | Value |
|------|--------|
| REF-CORPUS-FULL | 90/90 |
| Construction | SCI (44) + OPS (46) |

## 8. Regression Evidence

Re-verified at formal certification:

| Gate | Result |
|------|--------|
| typecheck | PASS |
| lint | PASS |
| build | PASS |
| TEST-016 | PASS |
| TEST-017 | PASS |
| TEST-018 | PASS |
| TEST-019 | PASS |
| TEST-020 | 22/22 PASS |
| smoke-020 | PASS |
| SCI / OPS / FULL | 44 / 46 / 90 |

## 9. Non-Blocking Observations

Recorded from CODE-AUDIT-020 (not converted to failures):

1. **O-020-01** — No Persistence `create`-time existence check that `predecessor_revision_id` names an existing revision row  
2. **O-020-02** — OPS Claim reconstruction from ENC projection is lossy for fields not in ENC content; adequate for Standing slice  
3. **O-020-03** — Pre-existing Core STE `randomUUID` if `event_id` omitted; Sprint 020 revision/head ids remain deterministic; tests supply `event_id`  
4. **O-020-04** — Raw `create` rejects duplicate keys with `ALREADY_EXISTS` even if fingerprint identical (idempotency via replace/Port)  
5. **O-020-05** — Generated smoke markers are evidence noise, not architecture  
6. **O-020-06** — Dual-read without optional legacy key rewrite (explicitly allowed)  
7. **O-020-07** — Documented partial-write (revision without head) is intentional; tested; not a silent scientific commit  

## 10. Certification Result

**CERTIFIED**

Formal closure artifact: `fixtures/cert/SPRINT-020_FORMAL_CERTIFICATION.json`  
Marker: `CERT_020_PASS`

No Git commit. No Git push.

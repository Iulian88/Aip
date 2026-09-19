# SciROS Reference Implementation

**Sprint:** EXEC-SPRINT-019 · Evidence Operations  
**Status:** **FORMALLY CERTIFIED AND CLOSED** (CODE-AUDIT-019: VERIFIED WITH OBSERVATIONS; required patches: 0)

| Field | Value |
|-------|--------|
| Implementation | COMPLETE |
| Architecture Audit | SPEC-019 APPROVED WITH OBSERVATIONS |
| Independent Code Audit | CODE-AUDIT-019 — VERIFIED WITH OBSERVATIONS |
| Required Patches | NONE |
| Formal Certification | CERTIFIED |
| Closure | COMPLETE |
| SCI profile | `CONF-001@1.0.0` |
| OPS profile | `CONF-001@1.1.0-OPS` |
| Engine CertificationDecision (SCI) | `CERTIFIED` |
| Engine CertificationDecision (OPS) | `CERTIFIED` |
| Certification artifacts | `fixtures/cert/SPRINT-019_*.json`, `CERT_019_PASS` |
| Corpora | SCI 44/44 · OPS 36/36 · FULL 80/80 |

Non-blocking observations from CODE-AUDIT-019 remain recorded; they were not eliminated.

Prior: Sprint 018 FORMALLY CERTIFIED AND CLOSED.

| Field | Value |
|-------|--------|
| SPEC | SPEC-019 v0.1.0-DRAFT |
| Slice | Evidence OPS orchestration |
| Evidence | Core SCI-002 via OPS; draft create-once; optional pre-persist transition |
| Membership | Same M1–M8; `unit_kind: EvidenceUnit` |
| Relationships | `bears_on` ≠ `supported_by` (SSR-5); membership ≠ either |

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
```

## Evidence chain (unchanged)

```
OPS → REF-OPS → ReferenceRunner → ReferenceReport
    → ConformanceEngine(profile) → ConformanceReport(profile_id)
    → CertificationEngine → Certificate
```

## Sprint 019 IN / OUT

**IN:** registerEvidenceUnit, getEvidenceUnit, exportEvidenceUnit, REF-OPS-022…036, tests, formal certification.  
**OUT:** Durable workspace, concurrency, Grade/Contradiction/NR/Verification OPS, literature, DocumentArtifact, AI, UI, DB, post-persist replace.

# SciROS Reference Implementation

**Sprint:** EXEC-SPRINT-018 · ResearchWorkspace Foundation  
**Status:** **IMPLEMENTED** — ResearchWorkspace Foundation (gates green)  

Prior: Sprint 017 FORMALLY CERTIFIED AND CLOSED.

| Field | Value |
|-------|--------|
| SPEC | SPEC-018 v0.2.0-PATCHED (CODE-AUDIT-019A APPROVED WITH OBSERVATIONS) |
| Slice | ResearchWorkspace Foundation |
| ResearchSession | Memory-only; orphan sessions preserved |
| ResearchWorkspace | Memory-only; optional session binding; WorkspaceSnapshot additive |

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
```

## Evidence chain (unchanged)

```
OPS → REF-OPS → ReferenceRunner → ReferenceReport
    → ConformanceEngine(profile) → ConformanceReport(profile_id)
    → CertificationEngine → Certificate
```

## Sprint 018 IN / OUT

**IN:** ResearchWorkspace, identity, lifecycle, optional session binding, membership, WorkspaceSnapshot, REF-OPS evidence, tests.  
**OUT:** Durable workspace index, multi-session concurrency, Evidence/literature/AI/UI/DB, post-persist replace.


# Epic E-P1-01 — Scientific Core Objects

| Field | Value |
|-------|--------|
| Epic ID | E-P1-01 |
| Phase | P1 |
| State | IN PROGRESS |
| Active Task | *(none executing — stop between tasks)* |
| Next READY | **SCI-001** |

## Tasks

| Task ID | Title | State |
|---------|-------|--------|
| SCI-000 | Core Scientific Ontology | **PROVISIONAL APPROVED** |
| SCI-001 | Claim Object Specification | **READY** |
| SCI-002 | Evidence Object Specification | BACKLOG |
| SCI-003 | Evidence Grade Specification | BACKLOG |
| SCI-004 | Contradiction Object Specification | BACKLOG |
| SCI-005 | Negative Result Object Specification | BACKLOG |
| SCI-006 | Verification Object Specification | BACKLOG |

## Dependency graph (updated)

```text
SCI-000 [PROVISIONAL APPROVED]
    └── SCI-001 [READY] ──► SCI-002 ──► SCI-003
              │
              ├── SCI-004
              ├── SCI-005
              └── (SCI-006 also needs Verification detail; after Claim/Evidence hooks)
```

SCI-001 MUST pin `ontology_ref: SCI-000@0.1.0` and complete FU-SCI000-001 alignment before its own Approval.

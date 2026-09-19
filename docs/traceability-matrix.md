# Requirements Traceability Matrix

**Status:** Reference  
**Purpose:** Map objectives → authoritative documents for implementers and reviewers.

| Obj | Topic | Primary document | Supporting documents |
|-----|-------|------------------|----------------------|
| 1 | Vision | [00-governance/vision.md](00-governance/vision.md) | mission, research-philosophy |
| 2 | Mission | [00-governance/mission.md](00-governance/mission.md) | vision |
| 3 | Scientific scope | [00-governance/scientific-scope.md](00-governance/scientific-scope.md) | molecular-mimicry-framework, methodology |
| 4 | Non-goals | [00-governance/non-goals.md](00-governance/non-goals.md) | ADR 0004 |
| 5 | Scientific limitations | [00-governance/scientific-limitations.md](00-governance/scientific-limitations.md) | validation, explainability |
| 6 | Ethics | [00-governance/ethics.md](00-governance/ethics.md) | compliance-checklist, agents |
| 7 | Medical disclaimer | [00-governance/medical-disclaimer.md](00-governance/medical-disclaimer.md) | api, compliance-checklist |
| 8 | Research philosophy | [00-governance/research-philosophy.md](00-governance/research-philosophy.md) | research-workflow |
| 9 | Expected users | [01-product/expected-users.md](01-product/expected-users.md) | use-cases |
| 10 | Use cases | [01-product/use-cases.md](01-product/use-cases.md) | functional-requirements |
| 11 | Success metrics | [01-product/success-metrics.md](01-product/success-metrics.md) | milestones, quality-gates |
| 12 | Functional requirements | [02-requirements/functional-requirements.md](02-requirements/functional-requirements.md) | api, pipelines |
| 13 | Non-functional requirements | [02-requirements/non-functional-requirements.md](02-requirements/non-functional-requirements.md) | security, performance-baselines |
| 14 | System architecture | [03-architecture/system-architecture.md](03-architecture/system-architecture.md) | deployment, ADRs |
| 15 | Module architecture | [03-architecture/module-architecture.md](03-architecture/module-architecture.md) | interfaces-and-contracts |
| 16 | Folder structure | [03-architecture/folder-structure.md](03-architecture/folder-structure.md) | repository-strategy |
| 17 | Repository strategy | [04-engineering/repository-strategy.md](04-engineering/repository-strategy.md) | ADR 0001 |
| 18 | Versioning | [04-engineering/versioning.md](04-engineering/versioning.md) | release-management |
| 19 | Documentation strategy | [04-engineering/documentation-strategy.md](04-engineering/documentation-strategy.md) | docs/README |
| 20 | Coding standards | [04-engineering/coding-standards.md](04-engineering/coding-standards.md) | contributing |
| 21 | Testing | [04-engineering/testing.md](04-engineering/testing.md) | quality-gates |
| 22 | Validation | [04-engineering/validation.md](04-engineering/validation.md) | scientific-methodology |
| 23 | Reproducibility | [05-science/scientific-reproducibility.md](05-science/scientific-reproducibility.md) | provenance |
| 24 | Security | [04-engineering/security.md](04-engineering/security.md) | SECURITY.md, incident-response |
| 25 | Dependency management | [04-engineering/dependency-management.md](04-engineering/dependency-management.md) | license-and-attribution |
| 26 | Configuration | [04-engineering/configuration-management.md](04-engineering/configuration-management.md) | pipelines |
| 27 | Data management | [05-science/data-management.md](05-science/data-management.md) | data-sources, ADR 0005 |
| 28 | Database | [03-architecture/database.md](03-architecture/database.md) | deployment |
| 29 | Pipelines | [03-architecture/pipelines.md](03-architecture/pipelines.md) | ADR 0003 |
| 30 | Roadmap | [06-process/roadmap.md](06-process/roadmap.md) | milestones |
| 31 | Milestones | [06-process/milestones.md](06-process/milestones.md) | deliverables |
| 32 | Deliverables | [06-process/deliverables.md](06-process/deliverables.md) | roadmap |
| 33 | AI agent responsibilities | [06-process/agents.md](06-process/agents.md) | development-workflow |
| 34 | Development workflow | [06-process/development-workflow.md](06-process/development-workflow.md) | contributing, quality-gates |
| 35 | Research workflow | [06-process/research-workflow.md](06-process/research-workflow.md) | methodology |
| 36 | Risk assessment | [07-risk-and-future/risk-analysis.md](07-risk-and-future/risk-analysis.md) | assumptions-register |
| 37 | Future expansion | [07-risk-and-future/future-expansion.md](07-risk-and-future/future-expansion.md) | module-architecture |

---

## Coverage statement

All 37 required objectives have a dedicated primary document in this foundation set. Implementation must not begin without completing Milestone **M0** review against this matrix.

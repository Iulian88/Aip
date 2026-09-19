# AIP Documentation Index

**Project codename:** AIP (Autoimmune Insight Platform)  
**Working title:** Open Molecular Mimicry Bioinformatics Platform  
**Document status:** Foundation design (pre-implementation)  
**Audience:** Scientific software engineers, bioinformaticians, research leads, AI coding agents, open-source contributors

---

## Purpose of this documentation set

This `/docs` tree is the **authoritative design foundation** for AIP. It exists so that an independent engineering and research team can implement the platform **without additional clarification**, while remaining scientifically honest, ethically constrained, and software-engineering rigorous.

**Implementation code is intentionally absent.** These documents define *what* must be built, *why*, *how quality is judged*, and *what must never be claimed*.

---

## Traceability

All 37 mandated foundation objectives are mapped in **[traceability-matrix.md](traceability-matrix.md)**.

---

## How to read this documentation

| If you are… | Start here |
|-------------|------------|
| New to the project | [vision.md](00-governance/vision.md) → [mission.md](00-governance/mission.md) → [scientific-scope.md](00-governance/scientific-scope.md) |
| Evaluating scientific legitimacy | [research-philosophy.md](00-governance/research-philosophy.md) → [scientific-limitations.md](00-governance/scientific-limitations.md) → [ethics.md](00-governance/ethics.md) → [medical-disclaimer.md](00-governance/medical-disclaimer.md) |
| Planning implementation | [system-architecture.md](03-architecture/system-architecture.md) → [module-architecture.md](03-architecture/module-architecture.md) → [folder-structure.md](03-architecture/folder-structure.md) |
| Defining quality bars | [functional-requirements.md](02-requirements/functional-requirements.md) → [testing.md](04-engineering/testing.md) → [validation.md](04-engineering/validation.md) |
| Running AI agents | [agents.md](06-process/agents.md) → [development-workflow.md](06-process/development-workflow.md) |
| Citing or expanding science | [scientific-methodology.md](05-science/scientific-methodology.md) → [references.md](08-reference/references.md) → [glossary.md](08-reference/glossary.md) |

---

## Document map (exhaustive)

### 00 — Governance & identity

| Document | Maps to objectives |
|----------|-------------------|
| [vision.md](00-governance/vision.md) | 1. Project Vision |
| [mission.md](00-governance/mission.md) | 2. Mission Statement |
| [scientific-scope.md](00-governance/scientific-scope.md) | 3. Scientific Scope |
| [non-goals.md](00-governance/non-goals.md) | 4. Non-goals |
| [scientific-limitations.md](00-governance/scientific-limitations.md) | 5. Scientific Limitations |
| [ethics.md](00-governance/ethics.md) | 6. Ethical Guidelines |
| [medical-disclaimer.md](00-governance/medical-disclaimer.md) | 7. Medical Disclaimer |
| [research-philosophy.md](00-governance/research-philosophy.md) | 8. Research Philosophy |

### 01 — Product & users

| Document | Maps to objectives |
|----------|-------------------|
| [expected-users.md](01-product/expected-users.md) | 9. Expected Users |
| [use-cases.md](01-product/use-cases.md) | 10. Use Cases |
| [success-metrics.md](01-product/success-metrics.md) | 11. Success Metrics |

### 02 — Requirements

| Document | Maps to objectives |
|----------|-------------------|
| [functional-requirements.md](02-requirements/functional-requirements.md) | 12. Functional Requirements |
| [non-functional-requirements.md](02-requirements/non-functional-requirements.md) | 13. Non-functional Requirements |

### 03 — Architecture

| Document | Maps to objectives |
|----------|-------------------|
| [system-architecture.md](03-architecture/system-architecture.md) | 14. System Architecture |
| [module-architecture.md](03-architecture/module-architecture.md) | 15. Module Architecture |
| [folder-structure.md](03-architecture/folder-structure.md) | 16. Folder Structure |
| [api.md](03-architecture/api.md) | API contracts (supports 12–15) |
| [database.md](03-architecture/database.md) | 28. Database Strategy |
| [pipelines.md](03-architecture/pipelines.md) | 29. Pipeline Strategy |
| [deployment.md](03-architecture/deployment.md) | Deployment topology |
| [interfaces-and-contracts.md](03-architecture/interfaces-and-contracts.md) | Cross-module contracts |

### 04 — Engineering practice

| Document | Maps to objectives |
|----------|-------------------|
| [repository-strategy.md](04-engineering/repository-strategy.md) | 17. Repository Strategy |
| [versioning.md](04-engineering/versioning.md) | 18. Versioning Strategy |
| [documentation-strategy.md](04-engineering/documentation-strategy.md) | 19. Documentation Strategy |
| [coding-standards.md](04-engineering/coding-standards.md) | 20. Coding Standards |
| [testing.md](04-engineering/testing.md) | 21. Testing Strategy |
| [validation.md](04-engineering/validation.md) | 22. Validation Strategy |
| [security.md](04-engineering/security.md) | 24. Security Strategy |
| [dependency-management.md](04-engineering/dependency-management.md) | 25. Dependency Management |
| [configuration-management.md](04-engineering/configuration-management.md) | 26. Configuration Management |

### 05 — Science & data

| Document | Maps to objectives |
|----------|-------------------|
| [scientific-methodology.md](05-science/scientific-methodology.md) | Scientific methods & assumptions |
| [scientific-reproducibility.md](05-science/scientific-reproducibility.md) | 23. Scientific Reproducibility Strategy |
| [data-management.md](05-science/data-management.md) | 27. Data Management |
| [molecular-mimicry-framework.md](05-science/molecular-mimicry-framework.md) | Domain-specific analysis model |
| [explainability.md](05-science/explainability.md) | Explainable hypothesis generation |
| [provenance.md](05-science/provenance.md) | Provenance & audit trails |

### 06 — Process & delivery

| Document | Maps to objectives |
|----------|-------------------|
| [roadmap.md](06-process/roadmap.md) | 30. Roadmap |
| [milestones.md](06-process/milestones.md) | 31. Milestones |
| [deliverables.md](06-process/deliverables.md) | 32. Deliverables |
| [agents.md](06-process/agents.md) | 33. AI Agent Responsibilities |
| [development-workflow.md](06-process/development-workflow.md) | 34. Development Workflow |
| [research-workflow.md](06-process/research-workflow.md) | 35. Research Workflow |
| [contributing.md](06-process/contributing.md) | Contribution model |
| [release-management.md](06-process/release-management.md) | Release governance |
| [quality-gates.md](06-process/quality-gates.md) | Merge & release gates |

### 07 — Risk & future

| Document | Maps to objectives |
|----------|-------------------|
| [risk-analysis.md](07-risk-and-future/risk-analysis.md) | 36. Risk Assessment |
| [future-expansion.md](07-risk-and-future/future-expansion.md) | 37. Future Expansion Strategy |
| [assumptions-register.md](07-risk-and-future/assumptions-register.md) | Explicit assumptions |
| [decision-log.md](07-risk-and-future/decision-log.md) | Index of ADRs |

### 08 — Reference

| Document | Purpose |
|----------|---------|
| [glossary.md](08-reference/glossary.md) | Shared vocabulary |
| [references.md](08-reference/references.md) | Scientific & engineering references |
| [data-sources.md](08-reference/data-sources.md) | Public data source catalog |
| [license-and-attribution.md](08-reference/license-and-attribution.md) | Licensing & citation |
| [compliance-checklist.md](08-reference/compliance-checklist.md) | Pre-release compliance |

### 09 — Operations

| Document | Purpose |
|----------|---------|
| [observability.md](09-operations/observability.md) | Logging, metrics, tracing |
| [incident-response.md](09-operations/incident-response.md) | Incident handling |
| [backup-and-recovery.md](09-operations/backup-and-recovery.md) | Recovery objectives |
| [performance-baselines.md](09-operations/performance-baselines.md) | Performance targets |

### Architecture Decision Records (ADRs)

| Document | Purpose |
|----------|---------|
| [adr/README.md](adr/README.md) | ADR process |
| [adr/0001-monorepo-with-modular-packages.md](adr/0001-monorepo-with-modular-packages.md) | Repo topology |
| [adr/0002-python-primary-runtime.md](adr/0002-python-primary-runtime.md) | Language choice |
| [adr/0003-workflow-engine-selection.md](adr/0003-workflow-engine-selection.md) | Pipeline orchestration |
| [adr/0004-hypothesis-not-diagnosis.md](adr/0004-hypothesis-not-diagnosis.md) | Scientific product boundary |
| [adr/0005-public-data-only-v1.md](adr/0005-public-data-only-v1.md) | Data boundary for v1 |

---

## Cross-cutting principles (binding)

1. **Hypothesis generation, not clinical assertion.** Outputs are computational hypotheses with uncertainty, provenance, and limitations.
2. **Public data first.** v1 integrates only publicly licensed biological data sources.
3. **Modularity over monoliths.** Every scientific capability is a replaceable module behind a contract.
4. **Reproducibility is a feature.** Runs must be reconstructible from config, data versions, and code versions.
5. **Explainability is mandatory.** Opaque scores without rationale are release-blocking defects.
6. **Ethics and disclaimers are product surface.** They appear in UI, API, reports, and docs—not only in `/docs`.

---

## Change control for documentation

- Documentation changes that alter scope, ethics, or scientific claims require **ADR + dual review** (engineering + scientific).
- Typo/clarity edits may proceed via ordinary PR.
- Version documentation with the platform using SemVer for software and **CalVer for data releases** (see [versioning.md](04-engineering/versioning.md)).

---

## Project root companions

| Path | Role |
|------|------|
| [`/README.md`](../README.md) | Public landing overview |
| [`/docs/`](.) | This authoritative design set |
| [`/ARCHITECTURE.md`](../ARCHITECTURE.md) | Short pointer to system architecture |
| [`/CONTRIBUTING.md`](../CONTRIBUTING.md) | Pointer to contributing guide |
| [`/CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) | Community conduct |
| [`/SECURITY.md`](../SECURITY.md) | Security disclosure pointer |
| [`/CITATION.cff`](../CITATION.cff) | Citation metadata (placeholder design) |
| [`/LICENSE`](../LICENSE) | License placeholder note |

---

*Document owner: Project Architect (rotating) · Last design pass: foundation v0.1*

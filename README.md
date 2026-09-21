# AIP — Autoimmune Insight Platform

**Open, modular, reproducible, explainable bioinformatics infrastructure for molecular mimicry analysis in autoimmune research.**

> **Research use only.** AIP is designed to generate **computational hypotheses**, not medical advice, diagnoses, prognoses, or treatment recommendations. See the [Medical Disclaimer](docs/00-governance/medical-disclaimer.md).

---

## Current status

**Certified scientific/research foundation through Sprint 020.**

This repository contains:

1. **Governance and product documentation** under [`docs/`](docs/README.md) (vision, ethics, requirements, planned AIP expansion).  
2. **Certified SciROS reference implementation** (TypeScript monorepo) through **Sprint 020 — Model C Post-Persist Scientific Transition**.

| Field | Value |
|-------|--------|
| Latest closed sprint | Sprint 020 — FORMALLY CERTIFIED AND CLOSED |
| Baseline commit | `6c0106c3e27685f549bc7c2b882a0365c6b511d6` |
| SCI corpus | 44/44 · profile `CONF-001@1.0.0` |
| OPS corpus | 46/46 · profile `CONF-001@1.1.0-OPS` |
| FULL corpus | 90/90 |
| Implementation status | [`IMPLEMENTATION.md`](IMPLEMENTATION.md) |

**What is implemented (certified kernel):** Scientific Core objects (Claim, Evidence, Grade, Contradiction, Negative Result, Verification), Canonical Encoding, Serialization, Persistence (including Model C immutable revisions + RevisionHead), Research Operations / ResearchSession / ResearchWorkspace, Reference Tests → Conformance → Certification.

**What is not implemented:** durable database, public API/backend, frontend UI, literature/DocumentArtifact ingestion, knowledge graph store, AI runtime, computational mimicry pipelines, clinical systems, simulation / human biology modeling platforms.

Research use only — computational hypotheses, not medical advice. See the [Medical Disclaimer](docs/00-governance/medical-disclaimer.md).

Start here for governance docs: **[docs/README.md](docs/README.md)** · Start here for implementation status: **[IMPLEMENTATION.md](IMPLEMENTATION.md)**

---

## What AIP aims to be

A platform that helps researchers:

1. Integrate **publicly available** biological data.  
2. Run **modular** molecular mimicry analysis pipelines.  
3. Produce **ranked, explainable** computational hypotheses.  
4. Export **reproducibility bundles** with provenance.  
5. Stay within clear **ethical and scientific limits**.  

AIP does **not** aim to prove medical hypotheses or act as a clinical system. See [Non-goals](docs/00-governance/non-goals.md).

---

## Documentation map (objectives)

| # | Topic | Document |
|---|-------|----------|
| 1 | Vision | [docs/00-governance/vision.md](docs/00-governance/vision.md) |
| 2 | Mission | [docs/00-governance/mission.md](docs/00-governance/mission.md) |
| 3 | Scientific scope | [docs/00-governance/scientific-scope.md](docs/00-governance/scientific-scope.md) |
| 4 | Non-goals | [docs/00-governance/non-goals.md](docs/00-governance/non-goals.md) |
| 5 | Scientific limitations | [docs/00-governance/scientific-limitations.md](docs/00-governance/scientific-limitations.md) |
| 6 | Ethics | [docs/00-governance/ethics.md](docs/00-governance/ethics.md) |
| 7 | Medical disclaimer | [docs/00-governance/medical-disclaimer.md](docs/00-governance/medical-disclaimer.md) |
| 8 | Research philosophy | [docs/00-governance/research-philosophy.md](docs/00-governance/research-philosophy.md) |
| 9 | Expected users | [docs/01-product/expected-users.md](docs/01-product/expected-users.md) |
| 10 | Use cases | [docs/01-product/use-cases.md](docs/01-product/use-cases.md) |
| 11 | Success metrics | [docs/01-product/success-metrics.md](docs/01-product/success-metrics.md) |
| 12 | Functional requirements | [docs/02-requirements/functional-requirements.md](docs/02-requirements/functional-requirements.md) |
| 13 | Non-functional requirements | [docs/02-requirements/non-functional-requirements.md](docs/02-requirements/non-functional-requirements.md) |
| 14 | System architecture | [docs/03-architecture/system-architecture.md](docs/03-architecture/system-architecture.md) |
| 15 | Module architecture | [docs/03-architecture/module-architecture.md](docs/03-architecture/module-architecture.md) |
| 16 | Folder structure | [docs/03-architecture/folder-structure.md](docs/03-architecture/folder-structure.md) |
| 17 | Repository strategy | [docs/04-engineering/repository-strategy.md](docs/04-engineering/repository-strategy.md) |
| 18 | Versioning | [docs/04-engineering/versioning.md](docs/04-engineering/versioning.md) |
| 19 | Documentation strategy | [docs/04-engineering/documentation-strategy.md](docs/04-engineering/documentation-strategy.md) |
| 20 | Coding standards | [docs/04-engineering/coding-standards.md](docs/04-engineering/coding-standards.md) |
| 21 | Testing | [docs/04-engineering/testing.md](docs/04-engineering/testing.md) |
| 22 | Validation | [docs/04-engineering/validation.md](docs/04-engineering/validation.md) |
| 23 | Reproducibility | [docs/05-science/scientific-reproducibility.md](docs/05-science/scientific-reproducibility.md) |
| 24 | Security | [docs/04-engineering/security.md](docs/04-engineering/security.md) |
| 25 | Dependencies | [docs/04-engineering/dependency-management.md](docs/04-engineering/dependency-management.md) |
| 26 | Configuration | [docs/04-engineering/configuration-management.md](docs/04-engineering/configuration-management.md) |
| 27 | Data management | [docs/05-science/data-management.md](docs/05-science/data-management.md) |
| 28 | Database | [docs/03-architecture/database.md](docs/03-architecture/database.md) |
| 29 | Pipelines | [docs/03-architecture/pipelines.md](docs/03-architecture/pipelines.md) |
| 30 | Roadmap | [docs/06-process/roadmap.md](docs/06-process/roadmap.md) |
| 31 | Milestones | [docs/06-process/milestones.md](docs/06-process/milestones.md) |
| 32 | Deliverables | [docs/06-process/deliverables.md](docs/06-process/deliverables.md) |
| 33 | AI agents | [docs/06-process/agents.md](docs/06-process/agents.md) |
| 34 | Development workflow | [docs/06-process/development-workflow.md](docs/06-process/development-workflow.md) |
| 35 | Research workflow | [docs/06-process/research-workflow.md](docs/06-process/research-workflow.md) |
| 36 | Risk | [docs/07-risk-and-future/risk-analysis.md](docs/07-risk-and-future/risk-analysis.md) |
| 37 | Future expansion | [docs/07-risk-and-future/future-expansion.md](docs/07-risk-and-future/future-expansion.md) |

---

## Repository layout

- **`docs/`** — AIP governance, product, and planned expansion documentation.  
- **`packages/`** — Certified SciROS packages (`core`, `encoding`, `serialization`, `persistence`, `processor`, `reference-tests`, `conformance`, `certification`, `shared`).  
- **`apps/reference-app/`** — Research Operations / OPS shell.  
- **`specs/`** — Scientific and architecture specifications.  
- **`fixtures/cert/`** — Formal certification artifacts.  
- **`audits/`** — Architecture, execution, code-audit, and certification records.

Planned broader AIP layout (data plane, pipelines, UI) remains described in [docs/03-architecture/folder-structure.md](docs/03-architecture/folder-structure.md); those planes are **not** part of the Sprint 020 certified kernel.

---

## Contributing

Documentation and ADR contributions are welcome. Read [docs/06-process/contributing.md](docs/06-process/contributing.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). Implementation changes must preserve certified SciROS authority boundaries (Scientific Core owns scientific meaning; OPS orchestrates only).

---

## License

License finalization is pending legal review. See [docs/08-reference/license-and-attribution.md](docs/08-reference/license-and-attribution.md).

---

## Citation

Cite this repository’s certified implementation baseline (Sprint 020 / commit above) and governance docs under `/docs` as appropriate for research use.

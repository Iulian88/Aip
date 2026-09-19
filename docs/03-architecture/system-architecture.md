# System Architecture

**Status:** Architectural baseline  
**Objective mapping:** 14 — System Architecture  
**Related:** [module-architecture.md](module-architecture.md), [pipelines.md](pipelines.md), [deployment.md](deployment.md)

---

## Architectural goals

1. Modular scientific capabilities behind stable contracts.
2. Reproducible runs as first-class objects.
3. Explainable hypothesis outputs.
4. Safe defaults and ethical guardrails in all interfaces.
5. Deployable as laptop CLI, lab server, or HPC/cloud batch.

---

## High-level context diagram

```text
                 ┌──────────────────────────────────────────┐
                 │                 Users                     │
                 │  CLI · Python API · (optional) Web · API  │
                 └───────────────────┬──────────────────────┘
                                     │
                 ┌───────────────────▼──────────────────────┐
                 │              AIP Control Plane            │
                 │  project/run mgmt · auth · config · QC    │
                 └───────────────────┬──────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
┌─────────▼─────────┐    ┌───────────▼──────────┐    ┌─────────▼─────────┐
│  Data Plane       │    │  Analysis Plane       │    │  Knowledge Plane  │
│  connectors       │    │  workflows/stages     │    │  context packs    │
│  mirrors/snapshots│    │  scorers/predictors   │    │  ontologies       │
│  ID mapping       │    │  hypothesis assembly  │    │  disclaimer/ethics│
└─────────┬─────────┘    └───────────┬──────────┘    └─────────┬─────────┘
          │                          │                          │
          └──────────────────────────┼──────────────────────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   Artifact Store     │
                          │ results·manifests·   │
                          │ explanations·exports │
                          └─────────────────────┘
```

---

## Logical layers

| Layer | Responsibility |
|-------|----------------|
| Interface layer | CLI, Python SDK, REST, future UI |
| Application services | Projects, runs, exports, plugin registry |
| Domain layer | Hypothesis, evidence, context pack domain models |
| Analysis layer | Pipeline stages and scientific tools wrappers |
| Data layer | Connectors, snapshots, databases, object storage |
| Platform layer | Auth, config, secrets, observability, containers |

---

## Core runtime patterns

### Run as immutable unit

An `AnalysisRun` freezes:

- git/software version (or release version)
- environment lock hash
- data snapshot IDs
- config YAML/JSON hash
- plugin versions

Mutating config always creates a new run.

### Hexagonal (ports & adapters) for science tools

Domain defines ports (`SimilaritySearchPort`, `EpitopePredictorPort`, `HlaBindingPort`).  
Adapters wrap concrete tools (BLAST+, MMSeqs2, IEDB tools, etc.).

### Workflow orchestration

Pipelines are DAGs of stages with explicit I/O schemas.  
**Assumption SA-A1:** Nextflow or Snakemake will be selected as primary orchestrator (see ADR 0003); a thin internal stage API remains orchestrator-agnostic where practical.

### Artifact-centric I/O

Stages read/write typed artifacts (Parquet/JSON + metadata sidecars), not hidden global state.

---

## Deployment topologies

| Topology | Description |
|----------|-------------|
| T1 Local CLI | Single-user container/conda; local artifact dir |
| T2 Lab server | Multi-user API + worker queue + shared storage |
| T3 HPC/cloud batch | Submit workflows to cluster/kubernetes |

Details: [deployment.md](deployment.md).

---

## Data flow (MVP happy path)

```text
Context Pack + Pathogen selectors
        │
        ▼
Snapshot Resolver → local mirror paths
        │
        ▼
ID Mapping / Normalization
        │
        ▼
Sequence Similarity Stage → features
        │
        ▼
Epitope Stage → features
        │
        ▼
HLA Context Stage (optional) → features
        │
        ▼
Hypothesis Assembly + Ranking
        │
        ▼
Explanation Builder + QC + Disclaimer stamp
        │
        ▼
Export / Reproducibility Bundle
```

---

## Cross-cutting architecture concerns

| Concern | Approach |
|---------|----------|
| Provenance | Manifest + artifact metadata + content hashes |
| Ethics | Disclaimer middleware / export stamp |
| Security | Least privilege; no PHI defaults |
| Extensibility | Plugin entry points + contract tests |
| Observability | Structured logs with run_id/stage |

---

## Technology direction (design choices, not yet implemented)

| Concern | Direction | Justification |
|---------|-----------|---------------|
| Primary language | Python 3.11+ | Bioinformatics ecosystem density |
| Packaging | Monorepo of packages | Shared contracts + atomic changes (ADR 0001) |
| Data frames | Arrow/Parquet | Analytics interoperability |
| Config | Strict schema (JSON Schema/Pydantic) | Fail-fast scientific configs |
| Containers | OCI images with digests | Reproducible runtime |
| Metadata DB | PostgreSQL (server) / SQLite (local) | Pragmatic dual mode |
| Object store | Filesystem abstraction → S3 API | Portability |

---

## Hard architectural constraints

1. Result artifacts without disclaimer metadata are invalid.
2. Predicted evidence must carry `evidence_origin=predicted`.
3. Scientific backends are replaceable; domain types are stable.
4. No hidden network calls during “offline re-run” mode.

---

## Open architecture questions (tracked)

| ID | Question | Resolution path |
|----|----------|-----------------|
| SA-Q1 | Nextflow vs Snakemake vs Prefect | ADR 0003 spike |
| SA-Q2 | gRPC vs REST for service mode | Prototype at M2 |
| SA-Q3 | Exact FAIR pack format | Evaluate RO-Crate at M3 |

These are documented uncertainties, not blockers for foundation design.

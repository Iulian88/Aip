# Pipeline Strategy

**Status:** Architectural baseline  
**Objective mapping:** 29 — Pipeline Strategy  
**Related:** [system-architecture.md](system-architecture.md), [scientific-methodology.md](../05-science/scientific-methodology.md)

---

## Goals

- Express analyses as **composable, typed stages**.
- Support local and HPC execution.
- Guarantee manifests and QC for every run.
- Enable ablation by toggling stages/layers without rewriting DAGs.

---

## Pipeline taxonomy

| Pipeline | Purpose | Priority |
|----------|---------|----------|
| `mimicry_mvp` | Sequence + epitope (± HLA) hypothesis generation | P0 |
| `epitope_only` | Epitope-centric short path | P1 |
| `ablation_matrix` | Systematic layer toggles | P1 |
| `decoy_calibration` | Negative controls | P1 |
| `benchmark_scorers` | Plugin comparisons | P2 |
| `data_mirror` | Fetch/validate snapshots | P0 |
| `structure_optional` | Add structural features | P2 |

---

## Stage contract

Each stage declares:

```text
stage_id: str
version: semver
inputs: [ArtifactType...]
outputs: [ArtifactType...]
params_schema: ref
resources: cpu/mem/disk hints
deterministic: bool
ethics_constraints: [...]
```

Stages MUST write artifacts atomically (temp + rename) and emit QC fragments.

---

## MVP DAG (`mimicry_mvp`)

```text
[resolve_snapshots] → [normalize_inputs] → [similarity] → [epitopes]
                                              ↓
                                         [hla_optional]
                                              ↓
                              [assemble_features] → [rank] → [explain]
                                                              ↓
                                                    [stamp_disclaimer]
                                                              ↓
                                                          [export]
```

Parallelism: similarity shardable by pathogen chunk; epitope stage may follow join.

---

## Configuration profiles

| Profile | Intent |
|---------|--------|
| `fast_draft` | Lower sensitivity; exploratory |
| `standard` | Default conservative |
| `high_sensitivity` | Broader recall; higher FDR risk—must warn |
| `offline_rerun` | No network; snapshots required |

High-sensitivity profiles MUST inject stronger limitation language in reports.

---

## Orchestration strategy

**Assumption P-A1:** Evaluate Nextflow and Snakemake in ADR 0003. Selection criteria:

1. Container-first execution
2. HPC + local support
3. Module packaging story
4. Community familiarity in bioinformatics
5. Provenance/reporting hooks

Internal `aip-pipeline` defines stage semantics; `aip-workflows` adapts to orchestrator.

---

## Failure & retry policy

| Failure class | Policy |
|---------------|--------|
| Transient network (mirroring) | Retry with backoff |
| Tool crash | Fail stage; mark run failed; keep logs |
| Schema validation | Fail fast; no retry |
| Explanation incomplete | Fail run (non-optional) |

---

## Caching

- Cache by `(stage_id, stage_version, params_hash, input_hashes)`.
- Cache MUST NOT skip disclaimer stamping.
- Offline re-run may use cache if hashes match.

---

## Resource management

- Stage resource hints documented.
- Large similarity searches SHOULD support sharding and merge.
- Memory ceilings enforced where orchestrator allows.

---

## Scientific guardrails in pipelines

1. Predicted vs curated flags propagate.
2. Empty inputs → explicit empty-success vs failure policy per stage (documented).
3. Rank stage rejects unknown evidence columns.
4. Export stage refuses bundles missing manifest fields.

---

## Testing pipelines

- Smoke e2e on `fixtures/`.
- Golden manifests for sample runs.
- Chaos tests: kill worker mid-stage → recoverable or clearly failed.

---

## Future pipeline expansions

See [future-expansion.md](../07-risk-and-future/future-expansion.md): immunopeptidomics adapters, pathway context, multi-pathogen cohort screens.

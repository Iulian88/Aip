# ADR 0003: Workflow Engine Selection

- Status: Proposed  
- Date: 2026-07-16  
- Decision makers: TBD at Phase 1 spike  

## Context

Pipelines must run locally and on HPC/cloud, with containers and stage-level reproducibility. Candidates commonly used in bioinformatics: Nextflow, Snakemake; also general engines (Prefect, Flyte).

## Decision

**Pending spike.** Evaluate Nextflow vs Snakemake against criteria in [pipelines.md](../03-architecture/pipelines.md). Keep `aip-pipeline` stage semantics orchestrator-agnostic where practical.

## Consequences

- Choosing either bioinformatics-native engine improves community adoption.  
- Delay is acceptable; fake/in-process runner can unblock schema development.  

## Alternatives considered

1. Pure Python DAG only — may hinder HPC portability.  
2. Cloud-only engine — conflicts with offline reproducibility goals.  

## Assumptions

SA-A1 / P-A1 remain open until spike completes.

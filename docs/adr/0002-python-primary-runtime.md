# ADR 0002: Python as Primary Runtime

- Status: Accepted  
- Date: 2026-07-16  
- Decision makers: Architecture foundation  

## Context

Bioinformatics tooling, ML/statistics libraries, and scientist familiarity converge on Python. Workflow engines integrate well with Python-centric ecosystems.

## Decision

**Python 3.11+** is the primary implementation language for SDK, CLI, connectors, and scientific adapters. Optional TypeScript UI later. Workflow DSLs as required by orchestrator.

## Consequences

- Pros: hiring/community fit; rich scientific libs.  
- Cons: packaging/binary wheel complexity; GIL limits (mitigate via subprocess tools & orchestration).  

## Alternatives considered

1. Rust core + Python bindings — deferred (complexity).  
2. JVM-centric — weaker fit for target users.  

## Assumptions

Sufficient performance achievable via external aligners and sharding.

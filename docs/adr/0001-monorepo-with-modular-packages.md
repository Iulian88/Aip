# ADR 0001: Monorepo with Modular Packages

- Status: Accepted  
- Date: 2026-07-16  
- Decision makers: Architecture foundation  

## Context

AIP needs many cooperating scientific modules, shared schemas, and atomic changes across contracts, tests, and docs. Multi-repo early would slow contract evolution.

## Decision

Use a **monorepo** containing versioned Python packages under `packages/`, shared fixtures, workflows, and `/docs`.

## Consequences

- Pros: atomic PRs; shared CI; easier refactor of contracts.  
- Cons: CI complexity growth; need clear package boundaries.  

## Alternatives considered

1. Multi-repo per module — rejected for v1 velocity.  
2. Single Python package monolith — rejected for modularity goals.  

## Assumptions

FS-A1: monorepo remains viable until split criteria met.

# Testing Strategy

**Status:** Engineering baseline  
**Objective mapping:** 21 — Testing Strategy  
**Related:** [validation.md](validation.md), [interfaces-and-contracts.md](../03-architecture/interfaces-and-contracts.md)

---

## Test pyramid

```text
        E2E / ethics / reproducibility bundles
              Integration (tools, DB, workflows)
         Contract tests (ports/plugins/schemas)
              Unit tests (pure transforms)
```

---

## Test categories

| Category | Purpose | Gate |
|----------|---------|------|
| Unit | Pure logic, ranking math, ID parsing | PR |
| Contract | Adapter conformance | PR |
| Integration | Tool wrappers, DB, storage | PR or nightly heavy |
| E2E smoke | MVP pipeline on fixtures | PR |
| Repro congruence | Bundle re-run | Nightly / release |
| Ethics | Disclaimer + lexicon | PR |
| Performance smoke | Runtime budgets | Nightly |
| Security | Dependency & SAST | PR |

---

## Scientific fixtures

`fixtures/` contains:

- Tiny FASTA sets with known planted overlaps.
- Decoy sequences.
- Expected feature ranges (not brittle exact floats unless deterministic).
- Golden explanation contribution structures.

**Assumption T-A1:** Fixtures are synthetic or clearly licensed public snippets.

---

## Flake policy

- Quarantine flaky tests within 24h.
- Nondeterministic tools tested with tolerance assertions, not exact byte equality.

---

## Coverage policy

- Core domain/ranking/explain: high coverage target (≥85%).
- Thin CLI wiring: lower acceptable with e2e coverage.
- Exclude generated code.

---

## Property-based testing

Use for:

- Config parsing invariants
- Score monotonicity properties where claimed
- ID mapping round-trips

---

## Mutation / chaos (later)

- Kill stage mid-write → incomplete artifacts not treated as success.

---

## CI matrix (planned)

| Job | When |
|-----|------|
| lint/type/unit | all PRs |
| e2e-smoke | all PRs |
| heavy-tools | nightly / labeled PRs |
| repro-bundle | release |

---

## Definition of done (testing)

A feature is not done without automated tests at the appropriate layer and updated fixtures if scientific behavior changes.

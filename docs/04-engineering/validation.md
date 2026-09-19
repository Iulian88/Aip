# Validation Strategy

**Status:** Scientific–engineering baseline  
**Objective mapping:** 22 — Validation Strategy  
**Related:** [testing.md](testing.md), [scientific-limitations.md](../00-governance/scientific-limitations.md)

---

## Distinction: testing vs validation

| Testing | Validation |
|---------|------------|
| Software behaves as specified | Methods are scientifically fit-for-purpose within declared limits |
| Bugs vs requirements | Credibility of hypotheses generation process |

AIP can be well-tested yet scientifically limited; validation makes limits explicit and empirically characterized.

---

## Validation levels

### V0 — Specification validation

Requirements and ethics docs reviewed; ADRs accepted.

### V1 — Analytical correctness

- Ranking formulas match documented equations.
- Feature computations match reference implementations on fixtures.
- Identifier mapping audited on sample crosswalks.

### V2 — Calibration / controls

- Decoy analyses quantify false-positive behavior under configs.
- Sensitivity analyses document rank volatility.

### V3 — External method concordance

- Compare overlapping outputs with published mimicry pipelines on shared public examples (**concordance ≠ biological truth**).

### V4 — Experimental corroboration (outside software)

- Wet-lab confirmation is **user/community territory**.
- AIP may provide export formats that ease experimental follow-up but does not claim validation therefrom.

---

## Validation datasets

| Set | Use |
|-----|-----|
| Synthetic planted mimics | Precision/recall under known truth |
| Scrambled decoys | Null behavior |
| Public literature-discussed pairs | Concordance case studies (carefully labeled) |
| Holdout autoantigen lists | Drift monitoring |

**Assumption V-A1:** No comprehensive gold-standard of true molecular mimicry causation exists; validation avoids pretending otherwise.

---

## Acceptance criteria examples

| Capability | Acceptance |
|------------|------------|
| Planted exact epitope identity | Recovered at rank ≤ k under standard profile |
| Random decoys | Score distribution separated per published metric |
| Explanation | 100% hypotheses with ≥1 grounded contribution |
| Disclaimer | Present on all exports |

---

## Continuous validation

- Nightly decoy jobs on main.
- Snapshot drift reports on data updates.
- Quarterly scientific review of defaults (ethics + methods).

---

## Reporting

Validation reports are first-class release artifacts: methods, configs, results, limitations, and non-claims.

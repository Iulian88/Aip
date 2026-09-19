# Success Metrics

**Status:** Product foundation  
**Objective mapping:** 11 — Success Metrics  
**Related:** [roadmap.md](../06-process/roadmap.md), [quality-gates.md](../06-process/quality-gates.md)

---

## Metric philosophy

AIP optimizes for **scientific usefulness, reproducibility, explainability, and engineering quality**—not for maximizing the number of “positive” mimicry hits.

---

## North-star metrics

| ID | Metric | Target (foundation era → v1) | Anti-gaming note |
|----|--------|------------------------------|------------------|
| NS1 | Reproducibility pass rate on reference bundles | ≥ 95% congruent within policy | Bundles curated independently of feature demos |
| NS2 | Explanation coverage | 100% of ranked hypotheses include layer rationales | Schema-enforced |
| NS3 | Disclaimer coverage | 100% of result surfaces | Automated tests |
| NS4 | Contract test pass rate across modules | 100% on main | Required CI gate |

---

## Scientific quality metrics

| ID | Metric | Description |
|----|--------|-------------|
| SQ1 | Benchmark completeness | # of fixtures with expected ranges |
| SQ2 | Decoy separation | Ability of scorers to separate planted mimics from decoys on synthetic sets |
| SQ3 | Rank stability | Jaccard/top-k stability under minor param perturbation |
| SQ4 | Provenance completeness | % runs with full manifest (code, data, config hashes) |
| SQ5 | Curated vs predicted labeling accuracy | Zero mislabel events in audits |

---

## Engineering metrics

| ID | Metric | Target |
|----|--------|--------|
| EN1 | Unit test coverage (core packages) | ≥ 85% lines (pragmatic exceptions documented) |
| EN2 | Integration tests for MVP pipeline | Mandatory green |
| EN3 | Mean time to set up dev environment | ≤ 60 minutes for new contributor on reference hardware |
| EN4 | Flaky test rate | \< 1% over 30 CI days |
| EN5 | Dependency freshness policy compliance | Critical CVEs patched within SLA |

---

## Product / adoption metrics (cautious)

| ID | Metric | Interpretation |
|----|--------|----------------|
| AD1 | External reproducible re-runs cited | Healthy scientific adoption |
| AD2 | Plugin contributions merged | Ecosystem health |
| AD3 | Documentation issue resolution time | Usability of foundation docs |
| AD4 | “Clinical misuse” reports | Should trend to zero; investigate UX failures |

**Non-metrics (do not optimize):**

- Number of hypotheses generated per run
- Clickbait media mentions
- Unverified accuracy claims vs clinical outcomes

---

## Milestone-linked KPIs

See [milestones.md](../06-process/milestones.md) for gate criteria. Example:

- **M0:** Documentation completeness checklist 100%.
- **M1:** Data connectors for ≥ 3 primary sources with provenance.
- **M2:** MVP pipeline UC-01 green on reference dataset.
- **M3:** External researcher re-run success on published bundle.

---

## Measurement process

1. Metrics defined in this doc.
2. Collected via CI, release scripts, and quarterly research quality review.
3. Reported in public project status notes (no hype framing).

---

## Assumptions

| ID | Assumption |
|----|------------|
| SM-A1 | Reference hardware profiles will be published for timing metrics |
| SM-A2 | Community will report misuse patterns if they appear |

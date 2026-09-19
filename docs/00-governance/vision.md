# Project Vision

**Status:** Binding foundation document  
**Objective mapping:** 1 — Project Vision  
**Related:** [mission.md](mission.md), [scientific-scope.md](scientific-scope.md), [non-goals.md](non-goals.md)

---

## Vision statement

Build a **world-class, open, modular, reproducible, and explainable bioinformatics platform** that enables researchers to integrate publicly available biological data and generate **transparent computational hypotheses** about autoimmune disease mechanisms via **molecular mimicry analysis**—without claiming medical truth, diagnosis, or treatment efficacy.

---

## Vision in one paragraph

AIP aspires to become the reference open-source infrastructure for molecular-mimicry-centered computational exploration of autoimmunity: a platform where every similarity score, epitope overlap, HLA context, and ranked hypothesis is **versioned, provenance-backed, explainable, and scientifically bounded**. Success means accelerating *research question formation* and *methodological comparison*, not replacing wet-lab validation or clinical judgment.

---

## Long-term north star (10-year)

By the end of a sustained open-science program, AIP should be:

1. **Scientifically trusted** — cited in methods sections as a reproducible analysis framework, not as a black-box “AI diagnosis” tool.
2. **Engineering exemplary** — modular packages, contract tests, reproducible pipelines, and clear ADRs that other labs can fork and extend.
3. **Community-owned** — governed with transparent contribution paths, data attribution, and ethical guardrails enforced in product surfaces.
4. **Hypothesis-generating at scale** — capable of systematically exploring pathogen–host molecular relationships across many autoimmune contexts while exposing uncertainty.
5. **Interoperable** — exporting results in FAIR-compatible formats and integrating with community standards (e.g., sequence identifiers, ontology terms, workflow provenance).

---

## Problem statement

Molecular mimicry is a longstanding, contested, and methodologically heterogeneous hypothesis space in autoimmunity research. Existing practice often suffers from:

| Pain | Consequence |
|------|-------------|
| Ad-hoc scripts per paper | Irreproducible “one-off” findings |
| Opaque similarity thresholds | Non-comparable results across groups |
| Mixed clinical language with computational outputs | Risk of overclaiming |
| Fragmented public data access | High integration cost for each study |
| Weak provenance | Inability to audit how a hit was produced |
| Limited explainability | Reviewers cannot reconstruct rationale |

AIP exists to convert this fragmented practice into a **shared computational laboratory** with engineering discipline.

---

## Design intent (what “good” looks like)

### For science

- Explicit molecular mimicry analysis frameworks with configurable evidence layers (sequence, epitope, structure, HLA, literature context).
- Ranked **computational hypotheses** with uncertainty, sensitivity analysis, and negative controls.
- Clear separation between *evidence objects*, *scoring models*, and *narrative interpretation*.

### For engineering

- Package boundaries that allow replacing BLAST backends, epitope predictors, or ranking models without rewriting the platform.
- Deterministic or seed-controlled runs; full run manifests; containerized execution.
- Test pyramids that include scientific regression fixtures (known positives/negatives).

### For community

- Open licensing compatible with academic and non-profit use.
- Documentation that another international team can implement from scratch.
- Ethical and medical boundaries present in CLI, API, UI, and publications templates.

---

## Strategic pillars

```text
┌─────────────────────────────────────────────────────────────┐
│                         AIP VISION                          │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  Openness    │  Modularity  │ Reproducibility│ Explainability│
├──────────────┼──────────────┼──────────────┼────────────────┤
│ Public data  │ Swappable    │ Pin versions  │ Rationale for │
│ Open methods │ modules &    │ Capture       │ every ranked  │
│ Open review  │ contracts    │ provenance    │ hypothesis    │
└──────────────┴──────────────┴──────────────┴────────────────┘
                              │
                              ▼
              Computational hypotheses (not medical claims)
```

---

## Positioning (what AIP is / is not)

| AIP is | AIP is not |
|--------|------------|
| A research bioinformatics platform | A medical device |
| A hypothesis generation & comparison engine | A diagnostic service |
| An integration layer over public biological data | A proprietary data warehouse of patient PHI |
| An explainable analysis framework | An opaque “AI doctor” |
| Infrastructure for molecular mimicry methods | Proof of any specific autoimmune etiology |

---

## Success vision narrative

A postdoctoral researcher in immunology should be able to:

1. Declare an autoimmune context and pathogen set.
2. Run a versioned pipeline with pinned databases.
3. Obtain a ranked list of mimicry hypotheses with epitope/HLA context.
4. Export a full reproducibility bundle (config, hashes, software versions).
5. Share results with collaborators who can re-run and obtain congruent outputs.
6. See, in every report, that results are **computational hypotheses requiring experimental validation**.

If that story is true in production, the vision is being realized.

---

## Assumptions (explicit)

| ID | Assumption | If false |
|----|------------|----------|
| V-A1 | Molecular mimicry remains a scientifically relevant exploratory framework for autoimmunity research | Scope pivots toward broader antigen/epitope analytics without mimicry branding |
| V-A2 | Sufficient high-quality public sequence/epitope/HLA data exists to support non-trivial analysis | Roadmap shifts to method benchmarking on synthetic fixtures before broad claims |
| V-A3 | An international open-source community will value transparent methods over flashy opaque scores | Product emphasis stays on explainability even if growth is slower |
| V-A4 | Contributors will accept strong medical/ethical constraints on language and UI | Governance enforces constraints regardless of marketing pressure |

---

## Vision risks (summary)

Overclaiming medical significance, under-investing in reproducibility, or building a monolith that cannot evolve methods are the primary vision threats. Detailed treatment: [risk-analysis.md](../07-risk-and-future/risk-analysis.md).

---

## Approval

Foundation vision is **approved for documentation phase**. Implementation begins only after Milestone M0 documentation gate (see [milestones.md](../06-process/milestones.md)).

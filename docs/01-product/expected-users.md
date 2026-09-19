# Expected Users

**Status:** Product foundation  
**Objective mapping:** 9 — Expected Users  
**Related:** [use-cases.md](use-cases.md), [success-metrics.md](success-metrics.md)

---

## Primary user personas

### U1 — Computational immunologist / bioinformatician

- Needs reproducible pipelines, batch runs, API/CLI, exports.
- Comfortable with containers, configs, and statistics.
- Success: comparable runs across pathogens/diseases with provenance.

### U2 — Experimental immunologist (methods collaborator)

- Needs interpretable reports, ranked candidates, clear limitations.
- Less interested in orchestration internals.
- Success: a shortlist worth testing in vitro / in vivo.

### U3 — Methods researcher / algorithm developer

- Needs module contracts, benchmarks, fixtures, ablation hooks.
- Success: plug in a new scorer and publish a fair comparison.

### U4 — Scientific software engineer

- Needs architecture docs, ADRs, testing gates, packaging.
- Success: extend platform without breaking contracts.

### U5 — Lab PI / consortium lead

- Needs governance, citation, reproducibility bundles for grants/papers.
- Success: defensible methods section and shared lab standard.

---

## Secondary users

| Persona | Interest | Support level (v1) |
|---------|----------|--------------------|
| Graduate students / course instructors | Teaching mimicry analytics | Templates + docs |
| Data curators | Improving autoantigen lists | Contribution guidelines |
| Open-source contributors | Fixes/features | Standard contribution flow |
| Reviewers / journal editors | Auditability | Reproducibility bundles |
| Clinicians | Curiosity only | Explicitly non-target; disclaimer-heavy |
| Patients / public | Should not use for health decisions | Not supported as audience |

---

## Anti-personas (explicitly not designed for)

1. Patients seeking self-diagnosis.
2. DTC wellness companies seeking medical-sounding scores.
3. Clinical OPS teams needing EHR-integrated CDS.
4. Actors seeking pathogen design assistance.

---

## User capability assumptions

| ID | Assumption |
|----|------------|
| U-A1 | Users can interpret multiple testing and FDR concepts at a basic level, or collaborate with someone who can |
| U-A2 | Users can run Docker/Podman or equivalent in research environments |
| U-A3 | English is the initial documentation language; translation is future work |
| U-A4 | Users will cite upstream data sources when publishing |

---

## Accessibility & inclusion (product)

- Prefer textual explainability over color-only encodings.
- Document hardware minimums honestly.
- Avoid assuming high-end GPU availability for core v1 pipelines.

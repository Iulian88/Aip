# Scientific Scope

**Status:** Binding foundation document  
**Objective mapping:** 3 — Scientific Scope  
**Related:** [non-goals.md](non-goals.md), [scientific-limitations.md](scientific-limitations.md), [molecular-mimicry-framework.md](../05-science/molecular-mimicry-framework.md)

---

## Scope statement

AIP’s scientific scope is **computational exploration of molecular mimicry as a candidate mechanism linking microbial/viral/parasitic molecular features to host autoimmune-relevant molecular features**, using **publicly available biological data**, with outputs framed exclusively as **ranked, explainable computational hypotheses**.

---

## In-scope scientific domains

### Core domain

1. **Sequence-level similarity** between pathogen-derived and host-derived proteins/peptides.
2. **Epitope-centric analysis** using curated immune epitope resources and predicted epitopes (clearly labeled as predicted).
3. **HLA / MHC context** (binding prediction or curated binding data) as a contextual evidence layer—not as clinical genotyping advice.
4. **Optional structural similarity** where public structures or models exist, with explicit uncertainty.
5. **Multi-evidence hypothesis assembly** combining layers with transparent weights and sensitivity analysis.
6. **Comparative autoimmune contexts** (e.g., disease-associated autoantigen catalogs from public literature-curated sets), without asserting causality.
7. **Negative controls and decoy analyses** to estimate false discovery behavior of scoring schemes.
8. **Literature-linked provenance** (optional) connecting computational hits to public publications via identifiers—not automated claim extraction presented as truth.

### Supporting domains (instrumental)

- Identifier mapping (UniProt, RefSeq, IEDB, PDB, ontology IDs).
- FAIR export of analysis results.
- Benchmarking of alternative mimicry scoring methods on shared fixtures.
- Visualization of evidence graphs for explanation (not for sensational presentation).

---

## Organisms & molecular entities (v1 target)

| Category | v1 inclusion | Notes |
|----------|--------------|-------|
| Human host proteins | Yes | Focus on publicly annotated autoantigen-related sets + configurable custom sets |
| Viral proteomes | Yes | Public reference proteomes |
| Bacterial proteomes | Yes | Public reference proteomes; start with curated priority lists |
| Parasitic proteomes | Optional / later | May enter after connector maturity |
| Peptides / epitopes | Yes | Curated + predicted (labeled) |
| HLA alleles | Yes | Common alleles first; expandable |
| 3D structures | Optional module | Not required for v1 MVP pipeline |
| Transcriptomics / scRNA | Out of v1 core | Future expansion |
| Patient-derived private sequences | Out of scope for v1 | See ADR 0005 |

---

## Evidence layers (scientific object model)

AIP models molecular mimicry evidence as layered objects:

```text
Layer 0  Identifiers & provenance
Layer 1  Sequence similarity / alignment features
Layer 2  Epitope overlap / epitope identity features
Layer 3  HLA binding / presentation context features
Layer 4  Structural similarity features (optional)
Layer 5  Network / pathway context (optional, later)
Layer 6  Literature link features (optional, non-authoritative)
        ↓
Hypothesis object = scored assembly + explanation + uncertainty + limitations
```

Each layer must be independently disableable for ablation studies.

---

## Autoimmune contexts (v1)

v1 supports **configurable disease contexts** rather than hard-coding a single disease narrative.

**Assumption S-A1:** Starting reference contexts will include a small set of well-studied autoimmune diseases commonly discussed in mimicry literature (e.g., type 1 diabetes, multiple sclerosis, rheumatoid arthritis, celiac disease–related frameworks, systemic lupus erythematosus), using **public autoantigen lists** and clearly marking curation provenance.

This does **not** imply AIP endorses mimicry as established etiology for these diseases.

---

## Analytical outputs in scope

| Output type | Description |
|-------------|-------------|
| Candidate pair records | Pathogen molecule ↔ host molecule relationships |
| Feature vectors | Layer-wise evidence features |
| Ranked hypothesis lists | Ordered candidates with scores + explanations |
| Ablation reports | Effect of removing evidence layers |
| Reproducibility manifests | Exact versions and hashes |
| Benchmark reports | Method comparison on fixtures |
| Export packages | JSON/Parquet/RO-Crate-style bundles (design target) |

---

## Methods classes in scope

1. Classical sequence similarity (local/global alignment; k-mer heuristics where justified).
2. Epitope matching and sliding-window peptide identity/similarity.
3. Statistical enrichment / FDR estimation strategies appropriate to the search space.
4. HLA binding predictors (third-party tools wrapped behind contracts; versions pinned).
5. Optional structure comparison metrics (RMSD/TM-score class methods) behind optional modules.
6. Transparent ranking models (weighted linear / constrained models first; ML only with explainability requirements).

**Assumption S-A2:** For v1, interpretable ranking is preferred over deep black-box models. Learned models may be introduced later under [explainability.md](../05-science/explainability.md) gates.

---

## Explicit scientific inclusions vs exclusions (summary table)

| Topic | In scope? | Rationale |
|-------|-----------|-----------|
| Molecular mimicry hypothesis generation | Yes | Core mission |
| Causal proof of disease mechanisms | No | Non-goal |
| Clinical diagnosis | No | Ethical/medical boundary |
| Drug recommendation | No | Ethical/medical boundary |
| Public data integration | Yes | Core mission |
| Private EHR analysis | No (v1) | Privacy/security boundary |
| Method benchmarking | Yes | Scientific quality |
| Wet-lab protocol generation as validated SOP | No | Out of software scope |
| Epidemiological causal inference | No | Different scientific frame |

---

## Scope evolution rules

Scope expansion requires:

1. Updated scientific-scope document.
2. ADR when architectural or ethical boundaries change.
3. Validation plan for new evidence layers.
4. Disclaimer/UX review if user-facing claims language might drift.

---

## Boundary with adjacent fields

AIP may **consume** outputs from immunopeptidomics, structural biology, or GWAS catalogs when public and relevant, but does not attempt to become a general multi-omics platform in v1. Adjacent fields enter only as **optional evidence adapters**.

# Scientific Methodology

**Status:** Science baseline  
**Related objectives:** supports 3, 5, 22, 23  
**Related:** [molecular-mimicry-framework.md](molecular-mimicry-framework.md), [validation.md](../04-engineering/validation.md)

---

## Methodological stance

AIP implements **transparent, layered computational procedures** to generate molecular mimicry *hypotheses*. Methods are configurable and ablatable. No method is privileged as biological truth.

---

## Analysis workflow (scientific)

1. **Define scope** — disease context pack, pathogen set, allele set.
2. **Pin evidence sources** — snapshots of proteins/epitopes/structures.
3. **Compute layer features** — sequence, epitope, HLA, optional structure.
4. **Assemble candidates** — join features onto pairs.
5. **Rank with declared model** — weights/rules documented.
6. **Explain** — contributions grounded in features.
7. **Calibrate** — decoys/sensitivity as needed.
8. **Export** — reproducibility bundle + limitations.

---

## Sequence similarity methodology

- Primary: local alignment / sensitive homology search against host targets.
- Report identity, similarity, coverage, alignment length, statistical score.
- Prefer host autoantigen sets as targets to reduce combinatorial explosion; whole-proteome screens allowed with stronger multiple-testing caveats.

**Assumption M-A1:** For many autoimmune contexts, curated autoantigen lists are a pragmatic v1 target space; users may expand.

---

## Epitope methodology

- Curated epitopes from public immune epitope resources when available.
- Predicted epitopes optional and labeled.
- Overlap metrics: exact match, mismatch-tolerant identity over window lengths typical of T/B cell epitopes (configurable).
- Cross-reactivity is **not inferred** from overlap alone.

---

## HLA methodology

- User-selected alleles.
- Binding predictors wrapped with version pins.
- Output = contextual annotation features.
- No clinical interpretation engine.

---

## Ranking methodology (v1 preference)

Interpretable weighted models:

\[
S = \sum_i w_i \cdot f_i(\text{features}_i)
\]

with \(\sum w_i = 1\), each \(f_i\) normalized by documented transforms.

ML rankers deferred until explainability gates pass.

---

## Multiple testing & FDR

Document search space size. Provide optional Benjamini–Hochberg or permutation-based estimates **with assumption disclosure**. Background choice is user-configurable because it is scientifically consequential.

---

## Negative controls

- Amino-acid shuffled peptides preserving length/composition.
- Taxonomically distant non-relevant proteomes.
- Random host proteins outside context pack.

---

## Reporting methodology

Every report includes methods parameters, versions, limitations, and non-claims language from governance docs.

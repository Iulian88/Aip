# Scientific Limitations

**Status:** Binding foundation document  
**Objective mapping:** 5 — Scientific Limitations  
**Related:** [scientific-methodology.md](../05-science/scientific-methodology.md), [validation.md](../04-engineering/validation.md)

---

## Purpose

This document enumerates inherent limitations of AIP’s scientific approach. Limitations must appear in user-facing reports and academic output templates.

---

## Fundamental limitations

### L1 — Similarity ≠ cross-reactivity

Sequence or structural similarity between pathogen and host molecules does **not** establish immune cross-reactivity, pathogenic relevance, or disease causation.

### L2 — Epitope prediction error

Predicted epitopes and HLA binders carry model error, allele coverage bias, and training-set bias. Curated epitopes are incomplete and study-biased.

### L3 — Database bias

Public databases over-represent well-studied organisms, diseases, and epitopes. Absence of evidence is not evidence of absence.

### L4 — Threshold arbitrariness

Similarity thresholds and scoring weights are analysis choices. Different reasonable choices can reorder hypotheses.

### L5 — Confounding biology

Autoimmunity is multifactorial (genetics, environment, immune dysregulation, tissue context). Mimicry-focused analysis ignores many causal pathways by design.

### L6 — Structural uncertainty

Where experimental structures are missing, models introduce additional error. Even experimental structures may not reflect immunological synapse conditions.

### L7 — HLA context incompleteness

HLA binding is necessary but not sufficient for T-cell response; TCR repertoire, processing, and tolerance mechanisms are largely outside v1.

### L8 — Literature association ≠ mechanism

Co-occurrence of a pathogen and a disease in literature does not validate a mimicry mechanism.

### L9 — Multiple testing

Large search spaces inflate false positives. FDR procedures depend on assumptions that may be violated.

### L10 — Temporal & strain variation

Pathogen strain differences and host polymorphism can invalidate generalizations from reference sequences.

---

## Methodological limitations (platform-imposed)

| Limitation | Implication |
|------------|-------------|
| Public data only (v1) | May miss unpublished antigens |
| Interpretable ranking preference | May underfit complex patterns |
| Module heterogeneity | Different tools ≠ perfectly calibrated scores |
| Batch effects in data mirrors | Snapshot differences change results |
| Incomplete ontology mapping | Identifier loss / duplication risk |

---

## Statistical limitations

- Enrichment tests require carefully defined backgrounds; wrong backgrounds yield spurious significance.
- Machine-learned rankers (future) may leak dataset biases.
- Cross-validation on mimicry “gold standards” is circular if standards were defined by similarity methods.

---

## Interpretive limitations (language)

Allowed:

- “computational hypothesis”
- “candidate molecular mimicry relationship”
- “evidence layer support under configuration X”
- “rank is sensitive to threshold T”

Disallowed in product outputs:

- “causes”
- “diagnoses”
- “confirms autoimmune disease”
- “patient should”
- “clinically validated biomarker” (unless referring to external certified sources, not AIP outputs)

---

## Limitation disclosure requirement

Every exported report MUST include:

1. A limitations section referencing this document’s version.
2. Configuration summary (thresholds, layers enabled).
3. Data snapshot identifiers.
4. Statement that experimental validation is required.

---

## Assumptions about limitation handling

| ID | Assumption |
|----|------------|
| L-A1 | Users are researchers capable of interpreting computational caveats |
| L-A2 | Downstream publications remain responsible for scientific claims |
| L-A3 | Platform can enforce language constraints in generated text, not in user free-text notes |

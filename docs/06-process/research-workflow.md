# Research Workflow

**Status:** Process baseline  
**Objective mapping:** 35 — Research Workflow  

---

## Goal

Define how scientific questions move from idea → computational experiment → documented hypothesis → (optional) experimental handoff—without medical overclaim.

---

## Research lifecycle

```text
Question → Context pack / pathogen selection → Pin snapshots
    → Configure layers → Run (+ decoys/ablation)
    → Interpret explanations → Document limitations
    → Export bundle → Share / publish methods
    → (External) experimental validation
```

---

## Research question template

1. Biological motivation (non-causal language)  
2. Computational question (precise)  
3. Inclusion/exclusion of entities  
4. Pre-registered config profile (encouraged)  
5. Success criteria for the *computational* study  
6. Explicit non-claims  

---

## Pre-registration (lightweight)

Labs SHOULD save configs before viewing ranked lists when performing confirmatory computational analyses. AIP SHOULD support “sealed config” hashes.

---

## Interpretation rules

- Rank ≠ probability of disease mechanism.  
- Multi-layer support = higher investigative priority.  
- Disagreement across methods is scientifically valuable—report it.  

---

## Publication workflow

1. Deposit reproducibility bundle.  
2. Cite AIP version + snapshots + upstream DBs.  
3. Include limitations & disclaimer.  
4. Separate computational hypotheses from biological conclusions.  

---

## Collaboration between wet and dry labs

Dry lab delivers prioritized candidates with peptides, accessions, HLA context, and uncertainty.  
Wet lab designs assays independently; AIP does not dictate clinical endpoints.

# Explainability Strategy

**Status:** Science–engineering baseline  
**Related:** [interfaces-and-contracts.md](../03-architecture/interfaces-and-contracts.md), [research-philosophy.md](../00-governance/research-philosophy.md)

---

## Requirement

Every ranked hypothesis MUST have a machine-readable explanation trace and a human-readable summary **grounded exclusively in that trace**.

---

## Explanation layers

1. **Feature contributions** — which features increased/decreased score  
2. **Method parameters** — thresholds that gated inclusion  
3. **Data provenance** — accessions and snapshot IDs  
4. **Uncertainty flags** — predicted evidence, low coverage, weak stats  
5. **Limitations pointers** — links to governance limitation IDs  

---

## Grounding rule

If a narrative sentence cannot be mapped to a contribution record, it is a defect.  
LLM-assisted wording MAY rephrase but MUST NOT invent features.

---

## UI/CLI presentation rules

- Show curated vs predicted badges.  
- Show top contributors first.  
- Do not use clinical color semantics (e.g., red = diseased).  

---

## Explainability gates for ML (future)

ML rankers allowed only if:

1. Feature attributions available per hypothesis.  
2. Faithfulness checks on fixtures.  
3. Ablation consistency reports.  
4. Ethics review of narrative templates.  

---

## Auditability

Explanation artifacts stored alongside hypotheses with hashes in manifests.

# Molecular Mimicry Analysis Framework

**Status:** Science baseline  
**Related:** [scientific-methodology.md](scientific-methodology.md), [scientific-scope.md](../00-governance/scientific-scope.md)

---

## Conceptual definition (operational)

For AIP, a **molecular mimicry candidate** is a pathogen-derived molecular entity and a host-derived molecular entity that share one or more **declared computational evidence features** under a pinned configuration, packaged as a **hypothesis object**—not as a proven immunological event.

---

## Biological background (non-authoritative)

Molecular mimicry hypotheses propose that immune responses initially directed at microbial antigens may recognize similar host antigens. This idea is historically important and scientifically contested in many disease settings. AIP does not adjudicate debates; it standardizes computational exploration.

---

## Evidence layer taxonomy

| Layer | Question it partially addresses | Cannot answer alone |
|-------|----------------------------------|---------------------|
| Sequence | Are molecules similar? | Is there cross-reactivity? |
| Epitope | Do immune epitopes overlap? | Will lymphocytes respond? |
| HLA | Could peptides bind selected MHC? | Is antigen processed/presented in vivo? |
| Structure | Are 3D surfaces similar? | Is similarity immunologically relevant? |
| Literature | Have entities been co-mentioned? | Is co-mention mechanistic? |

---

## Candidate generation strategies

1. **Targeted:** pathogen proteome × curated autoantigens  
2. **Epitope-first:** start from curated epitopes, search pathogen space  
3. **Seed-pair expansion:** expand around known public discussion pairs for sensitivity tests  

---

## Hypothesis object semantics

A hypothesis asserts:

> Under configuration C and snapshots S, entities P and H share evidence features F with aggregated score R and uncertainty U.

It does **not** assert disease causation.

---

## Ranking philosophy

Ranks are **priority for investigation**, not probability of truth. Documentation and UI must use “rank/priority” language carefully—avoid “probability of autoimmunity.”

---

## Required ablations for serious claims (user guidance)

Before strong scientific discussion of a hit, users SHOULD:

1. Disable predicted epitopes and re-rank.  
2. Run decoys.  
3. Perturb thresholds.  
4. Check identifier correctness.  
5. Inspect explanations.

AIP SHOULD automate (1)–(3) via helper pipelines.

---

## Disease context packs

Each pack includes:

- disease ontology IDs (e.g., DOID/MONDO if available)
- autoantigen protein accessions
- optional default HLA alleles for research
- curation notes & citations
- license
- explicit statement of non-endorsement of etiology

---

## Assumptions

| ID | Assumption |
|----|------------|
| MM-A1 | Peptide window lengths commonly used in literature are acceptable defaults but must be configurable |
| MM-A2 | Users understand HLA selection is a research parameter |
| MM-A3 | Multi-layer agreement increases investigative interest, not proof |

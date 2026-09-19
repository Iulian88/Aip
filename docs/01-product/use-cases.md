# Use Cases

**Status:** Product foundation  
**Objective mapping:** 10 — Use Cases  
**Related:** [expected-users.md](expected-users.md), [functional-requirements.md](../02-requirements/functional-requirements.md)

---

## Use case format

Each use case includes: actor, goal, preconditions, main flow, outputs, failure modes, ethical notes.

---

## UC-01 — End-to-end mimicry screen (reference proteome vs autoantigen set)

**Actor:** U1 bioinformatician  
**Goal:** Generate ranked pathogen–host candidate pairs for a disease context.  
**Preconditions:** Public proteome snapshot available; autoantigen set configured; pipeline version pinned.  
**Main flow:**

1. Select autoimmune context pack.
2. Select pathogen taxonomy IDs / proteome accessions.
3. Choose evidence layers (sequence ± epitope ± HLA).
4. Run pipeline; produce hypothesis set + manifest.
5. Export reproducibility bundle.

**Outputs:** Ranked hypotheses, explanations, QC metrics, disclaimer.  
**Failure modes:** Missing identifiers; empty proteome; tool wrapper timeout.  
**Ethical notes:** Report must include limitations; no diagnostic language.

---

## UC-02 — Epitope-centric overlap analysis

**Actor:** U2 experimental immunologist  
**Goal:** Find pathogen peptides overlapping curated/predicted host epitopes.  
**Flow:** Configure epitope source → run overlap module → filter by length/identity → review explanations.  
**Outputs:** Epitope pair table with source labels (curated vs predicted).

---

## UC-03 — HLA context overlay

**Actor:** U1 / U2  
**Goal:** Annotate candidates with computational HLA binding context for selected alleles.  
**Note:** Not a genotyping service; alleles are user-selected research parameters.

---

## UC-04 — Ablation & sensitivity study

**Actor:** U3 methods researcher  
**Goal:** Measure how ranking changes when layers/thresholds change.  
**Outputs:** Ablation report, rank stability metrics.

---

## UC-05 — Method plugin benchmark

**Actor:** U3  
**Goal:** Compare new similarity scorer against reference scorers on shared fixtures.  
**Outputs:** Benchmark tables, disagreement cases, runtime metrics.

---

## UC-06 — Reproducibility re-run

**Actor:** U5 PI / reviewer  
**Goal:** Re-execute a published bundle and confirm congruence within policy tolerances.  
**Outputs:** Diff report of results vs expected hashes/metrics.

---

## UC-07 — Custom autoantigen list analysis

**Actor:** U1  
**Goal:** Supply a lab-curated public autoantigen protein list and run standard pipelines.  
**Preconditions:** User affirms license/rights for redistribution if contributing upstream.

---

## UC-08 — Negative control / decoy screen

**Actor:** U1 / U3  
**Goal:** Estimate false-positive behavior using shuffled peptides or non-relevant proteomes.  
**Outputs:** Null distribution summaries; calibration plots (design target).

---

## UC-09 — Teaching lab module

**Actor:** Instructor  
**Goal:** Run a small didactic dataset demonstrating explainable outputs and limitations.  
**Outputs:** Student notebook + quiz-ready explanation traces.

---

## UC-10 — Data snapshot refresh impact audit

**Actor:** U4 engineer / U1  
**Goal:** Compare results before/after database mirror update.  
**Outputs:** Drift report; changed candidates list.

---

## UC-11 — API-driven integration into lab LIMS/light workflow

**Actor:** U4  
**Goal:** Submit jobs and fetch results programmatically for internal research tooling.  
**Constraints:** Research environments only; authN/Z for multi-user servers.

---

## UC-12 — Export for publication supplement

**Actor:** U5  
**Goal:** Produce methods-ready export: software versions, parameters, top hypotheses, limitations.  
**Outputs:** Supplement package + CITATION guidance.

---

## Out-of-scope use cases (rejected)

| ID | Request | Reason |
|----|---------|--------|
| UC-X1 | “Tell me if I have autoimmune disease from sequences” | Medical non-goal |
| UC-X2 | “Recommend immunosuppressive therapy” | Medical non-goal |
| UC-X3 | “Design a more immune-evasive virus” | Dual-use / ethics |
| UC-X4 | “Ingest hospital EHR autoimmunity notes” | Privacy / v1 non-goal |

---

## Use case priority for MVP

P0: UC-01, UC-02, UC-06, UC-12  
P1: UC-03, UC-04, UC-08  
P2: UC-05, UC-07, UC-09, UC-10, UC-11

# Non-goals

**Status:** Binding foundation document  
**Objective mapping:** 4 — Non-goals  
**Related:** [scientific-scope.md](scientific-scope.md), [medical-disclaimer.md](medical-disclaimer.md), [adr/0004-hypothesis-not-diagnosis.md](../adr/0004-hypothesis-not-diagnosis.md)

---

## Purpose

Non-goals prevent scope creep, ethical drift, and scientific overclaim. Anything listed here is **intentionally out of scope** unless a future ADR explicitly reverses it.

---

## Scientific non-goals

1. **Prove molecular mimicry as the cause of any autoimmune disease.**
2. **Validate clinical biomarkers for diagnosis or prognosis.**
3. **Establish treatment efficacy or recommend therapies.**
4. **Replace experimental immunology** (T-cell assays, animal models, clinical trials).
5. **Assert pathogen causation** from computational similarity alone.
6. **Provide personalized medical risk scores** for individuals.
7. **Claim that high computational rank equals biological cross-reactivity.**
8. **Automate systematic reviews as authoritative scientific conclusions** (literature features are aids, not truth).

---

## Product non-goals (v1 and near-term)

1. **Medical device certification pathway** (FDA/CE) as a project objective.
2. **Direct-to-consumer health application.**
3. **Hospital EHR integration** processing protected health information (PHI).
4. **Real-time clinical decision support (CDS) interfaces.**
5. **Patient-facing chatbot medical advice.**
6. **Closed proprietary “accuracy guarantees” marketing.**

---

## Engineering non-goals (v1)

1. **Single opaque end-to-end neural model** without explainability contracts.
2. **Maximizing novelty at the expense of reproducibility.**
3. **Supporting every omics modality on day one.**
4. **Building a general bioinformatics OS** unrelated to mimicry/autoimmunity exploration.
5. **Guaranteeing bit-identical results across all hardware** when using non-deterministic third-party binaries (mitigate via pinning + tolerance policies instead).

---

## Community / business non-goals

1. **Monetizing user biological data.**
2. **Dark-pattern UX that implies clinical certainty.**
3. **Silent redefinition of disclaimer language for growth metrics.**

---

## “Not yet” vs “never”

| Item | Classification | Notes |
|------|----------------|-------|
| Structural modules | Not yet (planned optional) | In future expansion |
| Private cohort plugins (local-only) | Not yet / carefully gated | Requires security ADR |
| Causal ML for disease | Never (as product claim) | May exist as research sandbox clearly labeled |
| Diagnosis outputs | Never | Ethical boundary |
| DTC genetic interpretation | Never | Ethical boundary |

---

## Enforcement

- PR templates include a non-goals checklist.
- UI/API copy review rejects diagnostic phrasing.
- Release managers may block releases that violate non-goals even if tests pass.

Violations are treated as **product defects**, not documentation nits.

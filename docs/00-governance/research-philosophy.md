# Research Philosophy

**Status:** Binding foundation document  
**Objective mapping:** 8 — Research Philosophy  
**Related:** [vision.md](vision.md), [scientific-reproducibility.md](../05-science/scientific-reproducibility.md)

---

## Philosophical stance

AIP treats molecular mimicry analysis as a **methodologically plural, uncertainty-rich, hypothesis-generating research practice**. The platform’s job is to make that practice **comparable, auditable, and improvable**—not to crown a single narrative as truth.

---

## Tenets

### T1 — Mechanisms are models, not idols

Molecular mimicry is one explanatory model among many for autoimmunity. The software must allow users to stress-test the model, not evangelize it.

### T2 — Computation proposes; experiment disposes

Software can prioritize candidates. Biology and clinical research decide validity.

### T3 — Explainability is epistemic hygiene

If a result cannot be explained in terms of evidence layers and configuration, it is not ready for scientific communication.

### T4 — Reproducibility is a moral duty to peers

Irreproducible “interesting hits” waste community attention and can mislead.

### T5 — Negative and null results are first-class

Pipelines should make it easy to report that a search failed to find strong candidates under declared assumptions.

### T6 — Methods before stories

Narrative generation is subordinate to structured evidence objects. Stories that cannot be grounded in objects are bugs.

### T7 — Calibration over theatrical confidence

Prefer conservative defaults, explicit sensitivity analyses, and calibrated language over impressive leaderboards.

### T8 — Open critique is a feature

Benchmarks, decoys, and adversarial test sets are welcomed. The platform should make criticism easy.

### T9 — Separation of concerns between science and product growth

Growth metrics must never incentivize more “positive hits.”

### T10 — Humility in AI assistance

AI systems (including coding agents and future ML rankers) are assistants under human scientific responsibility.

---

## Epistemic output levels

| Level | Meaning | Allowed in AIP? |
|-------|---------|-----------------|
| L0 Observation | Raw data records | Yes |
| L1 Feature | Derived measurements | Yes |
| L2 Computational hypothesis | Ranked candidate with explanation | Yes (primary product) |
| L3 Scientific claim | Peer-reviewed biological assertion | Outside software (user responsibility) |
| L4 Clinical claim | Medical decision statement | Forbidden as product output |

---

## Method preference order (default)

1. Transparent classical methods with known failure modes.
2. Constrained statistical models.
3. Interpretable ML with feature attributions.
4. Complex deep models only with strong explainability + validation gates.

---

## Philosophy applied to conflicts

When engineering convenience conflicts with scientific honesty, **scientific honesty wins**.  
When product ambition conflicts with ethical boundaries, **ethical boundaries win**.  
When novelty conflicts with reproducibility, **reproducibility wins** for releases.

---

## Assumption

| ID | Assumption |
|----|------------|
| RP-A1 | The research community values transparent infrastructure even when results are less “flashy” |

# Ethical Guidelines

**Status:** Binding foundation document  
**Objective mapping:** 6 — Ethical Guidelines  
**Related:** [medical-disclaimer.md](medical-disclaimer.md), [security.md](../04-engineering/security.md), [license-and-attribution.md](../08-reference/license-and-attribution.md)

---

## Ethical charter (summary)

AIP shall advance open scientific tooling for autoimmune-related computational research while **minimizing harm from overclaim, misuse, privacy violations, inequitable representation, and disrespect of data provenance**.

---

## Core ethical principles

### E1 — Non-maleficence in scientific communication

Do not present computational outputs in ways likely to be interpreted as medical advice, diagnosis, or certainty about disease causation.

### E2 — Honesty about uncertainty

Expose uncertainty, limitations, and negative results. Do not hide ablations that weaken a hypothesis.

### E3 — Respect for persons & privacy

v1 processes public biological data. Any future support for sensitive human data must be local-first, consented, minimized, and governed by a dedicated ADR and security review.

### E4 — Justice & representation

Document biases in datasets (allele frequencies, organism coverage, disease research funding bias). Avoid implying global applicability of Eurocentric HLA or disease cohorts without caveats.

### E5 — Stewardship of open science

Prefer open methods, open benchmarks, and clear attribution to upstream data providers and tool authors.

### E6 — Accountability

Maintain provenance so claims about what the software did can be audited. AI-generated contributions must be reviewable and attributable to humans who merge them.

### E7 — Dual-use awareness

Sequence analysis tools can be misused. AIP shall not provide guidance for engineering harmful pathogens. Refuse features whose primary purpose is weaponization or illicit enhancement of pathogen virulence.

---

## Operational ethical rules

| Rule | Enforcement |
|------|-------------|
| Disclaimer on all user-facing surfaces | Release checklist |
| No diagnostic UX patterns (red/green “disease detected”) | Design review |
| No patient re-identification features | Security + ethics review |
| Attribute data sources in exports | Automated export schema fields |
| Label predicted vs curated evidence | Schema enums + UI badges |
| Prohibit secretly changing scientific defaults to inflate “hits” | Config governance + tests |
| Research on sensitive topics requires public methods | Publication policy |

---

## Human subjects & clinical data

- **v1:** No intentional processing of identifiable human subject data.
- Reference genomes / public protein sequences are not treated as personal data.
- If contributors propose clinical plugins: require ethics ADR, DPIA-like assessment, and default deny in main distribution.

---

## AI ethics within the project

1. AI coding agents may draft code/docs; humans remain responsible for merges.
2. Generative models must not fabricate citations; references require verification.
3. Model-assisted hypothesis narrative text must be marked as model-assisted if used.
4. Training of project-specific ML models must document data leakage controls.

---

## Community ethics

- Follow [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md).
- Harassment, discriminatory language, or bad-faith scientific sabotage are removal grounds.
- Do not pressure maintainers to weaken disclaimers for “impact.”

---

## Ethical review triggers

An ethics review is mandatory when a change:

- Alters medical language in outputs.
- Adds private data pathways.
- Adds pathogen engineering adjacent capabilities.
- Introduces opaque scoring without explanation.
- Targets DTC or clinical deployment.

---

## Assumptions

| ID | Assumption |
|----|------------|
| E-A1 | Primary users are researchers, not patients seeking self-diagnosis |
| E-A2 | Open-source distribution cannot fully prevent misuse; mitigation is design + policy + refusal of harmful features |
| E-A3 | Public data licenses will be respected via automated license metadata where feasible |

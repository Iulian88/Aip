# Risk Analysis

**Status:** Process baseline  
**Objective mapping:** 36 — Risk Assessment  

---

## Risk rating scale

| Score | Meaning |
|-------|---------|
| L/M/H likelihood | Low / Medium / High |
| L/M/H impact | Low / Medium / High |
| Priority | Likelihood × Impact qualitative |

---

## Top risks

| ID | Risk | L | I | Mitigation | Owner |
|----|------|---|---|------------|-------|
| R1 | Medical overclaim / misuse by end users | M | H | Disclaimers, lexicon gates, UX constraints, non-goals enforcement | Ethics + PM |
| R2 | Irreproducible results from floating deps/data | H | H | Pinning, manifests, congruence tests | Eng lead |
| R3 | Scientific false positives misinterpreted as truth | H | H | Decoys, limitations, conservative defaults | Science lead |
| R4 | Database licensing violations | M | H | License metadata, legal review, attribution | Data lead |
| R5 | Scope creep into multi-omics mega-platform | H | M | Non-goals, ADR discipline | Architect |
| R6 | Opaque ML ranking erodes trust | M | H | Explainability gates | Science + Eng |
| R7 | Supply-chain compromise | M | H | Lockfiles, image digests, scanning | Security |
| R8 | Dual-use concerns / reputational harm | L | H | Feature refusal policy, review triggers | Ethics |
| R9 | Underfunded maintenance of connectors | H | M | Minimal connector set, community plugins | PM |
| R10 | HLA predictor license/runtime friction | M | M | Adapter abstraction; optional layer | Eng |
| R11 | Contributor burnout / bus factor | M | H | Docs excellence, modular ownership | PM |
| R12 | Institutional legal blocks on open release | L | H | Clear research-only positioning; license choice | PM + legal |
| R13 | Performance infeasibility on large proteomes | M | M | Sharding, targeted screens, profiles | Eng |
| R14 | Contested science leading to hostile scrutiny | M | M | Humility in claims, open methods, invite critique | Science |
| R15 | AI agents introducing subtle ethics regressions | M | H | Automated ethics tests; human review | All leads |

---

## Risk monitoring

- Review top risks each quarterly roadmap meeting.  
- New high-impact risks get issues with mitigation tasks.  

---

## Residual risk statement

Even with mitigations, AIP cannot prevent all misuse or all scientific misinterpretation. The project accepts residual risk inherent to open bioinformatics tooling while actively reducing foreseeable harm.

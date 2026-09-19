# Future Expansion Strategy

**Status:** Process baseline  
**Objective mapping:** 37 — Future Expansion Strategy  

---

## Expansion principles

1. Expand by **new evidence adapters**, not by rewriting the core.  
2. Each expansion needs validation plan + ethics check.  
3. Prefer community plugins for specialized methods.  
4. Never expand into clinical CDS without a fundamental project charter change (unlikely and discouraged).  

---

## Candidate expansions (ordered)

| Priority | Expansion | Dependencies |
|----------|-----------|--------------|
| A | Structural similarity module | PDB/AlphaFold public access patterns |
| B | Broader pathogen libraries & automated taxonomy walks | Compute scaling |
| C | Immunopeptidomics public dataset adapters | Schema mapping |
| D | Pathway/network context layer | Ontology quality |
| E | Educational web UI | API stability |
| F | Interpretable ML rankers | Explainability gates |
| G | RO-Crate / Zenodo deposit helpers | Export maturity |
| H | Local-only private cohort plugin (air-gapped) | Security ADR + ethics |
| I | Multi-language docs | Community translators |
| J | Cloud reference deployment templates | Security review |

---

## Explicit non-expansions

- DTC genetic risk apps  
- Automated diagnosis  
- Treatment recommendation engines  
- Pathogen enhancement design assistants  

---

## Expansion decision checklist

1. Fits mission?  
2. Violates non-goals?  
3. Data licenses OK?  
4. Reproducibility plan?  
5. Explainability plan?  
6. Maintenance owner?  
7. ADR needed?  

---

## Long-term architectural flexibility

Keep ports stable so expansions remain additive. If a paradigm shift occurs (e.g., new immunology consensus abandoning mimicry framing), platform can rebrand evidence layers toward general antigen similarity analytics without discarding engineering investment.

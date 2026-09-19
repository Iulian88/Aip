# Roadmap

**Status:** Process baseline  
**Objective mapping:** 30 — Roadmap  
**Related:** [milestones.md](milestones.md), [deliverables.md](deliverables.md)

---

## Roadmap principles

- Documentation and ethics precede code.  
- MVP prioritizes reproducible sequence+epitope hypotheses.  
- Expansion is evidence-layer modular, not monolithic rewrites.  
- Dates are indicative planning horizons, not contractual promises.

**Assumption R-A1:** Calendar assumes a small core team + AI-assisted engineering; actual dates shift with staffing.

---

## Phases

### Phase 0 — Foundation (now)

- Complete `/docs` governance and architecture.  
- ADR set for critical decisions.  
- Repository skeleton design (no scientific implementation required).  
- Gate: documentation review checklist complete.

### Phase 1 — Platform skeleton

- Monorepo bootstrap, packaging, CI, schemas, provenance types.  
- CLI `about`, config validation, disclaimer stamp utilities.  
- Fixture pipeline dry-run with fake adapters.

### Phase 2 — Data plane

- Connectors for initial public sources.  
- Snapshot mirroring + READY manifests.  
- Context pack format + 1–2 example packs.

### Phase 3 — MVP scientific pipeline

- Similarity + epitope stages with real pinned tools.  
- Ranking + explanations.  
- Reproducibility bundle export.  
- UC-01/02/06/12 green on fixtures and one public demo dataset.

### Phase 4 — Hardening & validation

- Decoy pipelines, congruence reports, performance baselines.  
- Service mode optional.  
- External researcher alpha.

### Phase 5 — Extensibility & community

- Plugin docs, benchmark harness, additional context packs.  
- Optional structure module.  
- Public beta release `v0.1` / `v1.0-rc` as appropriate.

### Phase 6 — Ecosystem

- FAIR packaging polish, educational kits, multi-omics adapters (selective).  
- Governance maturation (steering, reviews).  

---

## Explicitly deferred

- Clinical integrations  
- DTC apps  
- Opaque deep models as default rankers  
- Private PHI pipelines  

---

## Roadmap review cadence

Quarterly roadmap review; ethics review if claim surfaces change.

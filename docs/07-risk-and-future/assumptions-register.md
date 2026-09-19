# Assumptions Register

**Status:** Living register  
**Related:** All foundation docs  

---

## Purpose

Centralize explicit assumptions so implementers know what was believed during design. When an assumption fails, update this register and impacted docs.

---

## Active assumptions

| ID | Statement | Source doc | Status | Impact if false |
|----|-----------|------------|--------|-----------------|
| V-A1 | Mimicry remains relevant exploratory frame | vision | Active | Rebrand evidence analytics |
| V-A2 | Public data sufficiency for non-trivial demos | vision | Active | Synthetic-first roadmap |
| V-A3 | Community values transparency over opaque scores | vision | Active | Slower adoption acceptable |
| V-A4 | Contributors accept ethics constraints | vision | Active | Governance enforcement |
| S-A1 | Starting disease contexts from well-studied sets | scientific-scope | Active | Fewer packs initially |
| S-A2 | Interpretable ranking preferred in v1 | scientific-scope | Active | Delay ML |
| L-A1 | Users can interpret caveats | limitations | Active | More conservative UX |
| E-A1 | Primary users are researchers | ethics | Active | Stronger anti-DTC measures |
| U-A2 | Containers available to users | users | Active | Expand native installs |
| NFR-A1 | 16 vCPU / 64GB reference profile | NFR | Active | Retune budgets |
| SA-A1 | Nextflow or Snakemake selectable | architecture | Open | ADR 0003 |
| FS-A1 | Monorepo viable initially | folder-structure | Active | Split repos |
| P-A1 | Orchestrator evaluation criteria hold | pipelines | Open | ADR 0003 |
| DB-A1 | Artifact immutability preferred | database | Active | Different storage model |
| DEP-A1 | uv/poetry acceptable | dependencies | Open | Bootstrap ADR |
| T-A1 | Fixtures synthetic/public | testing | Active | Licensing work |
| V-A1-val | No true causal gold standard | validation | Active | Concordance ≠ truth |
| M-A1 | Autoantigen-targeted screens pragmatic | methodology | Active | Costlier proteome-wide defaults |
| MM-A3 | Multi-layer agreement ≠ proof | mimicry framework | Active | Messaging discipline |
| R-A1 | Small team + AI assistance | roadmap | Active | Timeline shifts |
| SEC-A1 | Institutions handle perimeter security | security | Active | More opinionated defaults |
| SM-A1 | Reference hardware published at M2 | success metrics | Pending | Delay perf KPIs |

---

## Change protocol

1. Open PR editing this table.  
2. Link impacted documents.  
3. If architectural, add/amend ADR.  

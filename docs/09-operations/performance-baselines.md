# Performance Baselines

**Status:** Operations baseline (targets; measure at M2–M4)  

---

## Reference hardware profile (assumed)

- 16 vCPU, 64 GB RAM, Linux x86_64  
- SSD storage  
- No GPU required for core MVP  

---

## Target budgets (to be empirically set)

| Workload | Initial planning budget |
|----------|-------------------------|
| Fixture e2e MVP | ≤ 10 minutes |
| Demo targeted screen (documented size) | ≤ 4 hours |
| Snapshot mirror (depends on source) | documented per connector |

Exact numbers replaced with measured values in M4 validation report.

---

## Scaling levers

- Shard similarity search  
- Reduce target set to context pack antigens  
- Lower sensitivity profile  
- Cache stages  

---

## Reporting

Publish performance appendix with each beta/major release.

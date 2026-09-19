# Release Management

**Status:** Process baseline  

---

## Release trains

- **Docs tags:** `docs-vX.Y`  
- **Software tags:** `vMAJOR.MINOR.PATCH`  
- **Data tags:** `data/<source>-<calver>`  

---

## Release checklist (software)

1. CI green on release commit  
2. Compatibility matrix updated  
3. CHANGELOG entries curated  
4. SBOM generated  
5. Disclaimer surfaces smoke-tested  
6. Validation report attached (from M4 onward)  
7. Security issues addressed per SLA  
8. Citation metadata updated  

---

## Hotfix policy

PATCH releases for defects; ethics defects may warrant urgent patch even without “crash” severity.

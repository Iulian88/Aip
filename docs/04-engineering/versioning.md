# Versioning Strategy

**Status:** Engineering baseline  
**Objective mapping:** 18 — Versioning Strategy  

---

## Triple versioning model

AIP versions three planes separately:

| Plane | Scheme | Example |
|-------|--------|---------|
| Software | SemVer | `aip 1.4.2` |
| Data snapshots | CalVer + source label | `uniprot-2026.07.01` |
| Context packs | SemVer | `ms-context 1.2.0` |
| Artifact schemas | Integer or SemVer | `hypotheses schema 3` |

Runs record **all** relevant versions in manifests.

---

## SemVer rules (software)

- **MAJOR:** breaking API/contracts/config stable keys / ethics-incompatible output changes
- **MINOR:** new compatible features, new experimental config keys
- **PATCH:** bugfixes, docs, non-breaking dependency patches

Removing disclaimer fields is always **MAJOR** (and ethically discouraged).

---

## Pre-release tags

- `0.x` — pre-stability foundation/implementation era
- `-alpha`, `-beta`, `-rc` for release candidates

---

## Data snapshot compatibility

Software SHOULD declare tested snapshot ranges.  
Newer snapshots may change scientific results; this is expected and must be surfaced in drift reports—not treated as silent software regression.

---

## Compatibility matrix (published each release)

| Software | Min schema | Tested snapshots | Orchestrator |
|----------|------------|------------------|--------------|
| 1.0.0 | hypotheses≥2 | uniprot-2026.07… | TBD |

---

## Deprecation policy

1. Announce in CHANGELOG + docs.
2. Warn in runtime for ≥ 1 MINOR when feasible.
3. Remove in next MAJOR.

---

## Git tags

- Software: `v1.4.2`
- Data release manifests (if any): `data/uniprot-2026.07.01`

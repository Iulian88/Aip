# Public Data Sources Catalog

**Status:** Reference  
**Related:** [data-management.md](../05-science/data-management.md), [adr/0005-public-data-only-v1.md](../adr/0005-public-data-only-v1.md)

---

## Inclusion criteria

A source may be integrated in v1 if:

1. Publicly accessible for research use under clear terms.  
2. Provides stable identifiers or mappable accessions.  
3. License compatible with project distribution model.  
4. Connector can capture version/snapshot metadata.  

---

## Priority sources (phased)

| Priority | Source | Entities | Phase |
|----------|--------|----------|-------|
| P0 | UniProt | Proteins | M2 |
| P0 | NCBI Taxonomy | Organisms | M2 |
| P0 | IEDB (as permitted) | Epitopes | M2–M3 |
| P1 | RefSeq viral/bacterial proteomes | Pathogen proteins | M3 |
| P1 | PDB / PDBe | Structures | M5+ |
| P1 | HLA allele catalogs | Alleles | M3 |
| P2 | Mondo/DOID | Disease terms | M2 |
| P2 | PubMed/EuropePMC APIs | Literature links (non-authoritative) | M5+ |
| P2 | AlphaFold DB (public) | Models | optional structure |

Exact endpoint choices and rate limits documented per connector README at implementation time.

---

## Snapshot metadata required

For each mirrored source:

- source name  
- snapshot_id  
- retrieval timestamp (UTC)  
- license SPDX or URL  
- file inventory + SHA-256  
- schema/parser version  

---

## Attribution

Exports MUST list used sources. See [license-and-attribution.md](license-and-attribution.md).

---

## Assumptions

| ID | Assumption |
|----|------------|
| DS-A1 | Upstream APIs remain stably available or bulk downloads exist |
| DS-A2 | License terms allow local hashing mirrors for research compute |

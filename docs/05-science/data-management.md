# Data Management

**Status:** Science–engineering baseline  
**Objective mapping:** 27 — Data Management  
**Related:** [data-sources.md](../08-reference/data-sources.md), [database.md](../03-architecture/database.md)

---

## FAIR alignment

| Principle | AIP approach |
|-----------|--------------|
| Findable | Snapshot catalogs + stable IDs |
| Accessible | Public sources; local mirrors; offline mode |
| Interoperable | Cross-refs, ontologies, Parquet/JSON schemas |
| Reusable | License metadata, provenance, limitations |

---

## Data classes

1. **Reference mirrors** — bulk public DBs  
2. **Context packs** — curated disease packs  
3. **Run artifacts** — generated analyses  
4. **Fixtures** — tiny test data  
5. **User custom lists** — local inputs (license user’s responsibility)

---

## Mirror layout

```text
$AIP_DATA/mirrors/<source>/<snapshot_id>/
  READY.json          # manifest of files + hashes + license
  ...payload files...
```

`READY.json` required before pipelines resolve snapshot.

---

## Lifecycle

```text
discover → fetch → checksum → schema validate → publish snapshot_id → consume → (optional) retire
```

---

## Retention & deletion

- Mirrors retained per lab policy.  
- Artifacts deletable by user; manifests may be retained for audit.  
- No soft guarantee of cloud backup unless deployer configures it.

---

## Quality controls on ingest

- Format validation  
- Duplicate accession detection  
- Taxonomy ID presence checks  
- License field presence  

Quarantine bucket for failed records with reason codes.

---

## Privacy

v1 public data only (ADR 0005). Custom user sequences treated as sensitive operational data in shared servers (access-controlled), even if not PHI.

---

## Contribution of curated lists

Accepted only with:

- provenance
- license
- curator contact
- version notes
- explicit non-clinical labeling

# Database Strategy

**Status:** Architectural baseline  
**Objective mapping:** 28 — Database Strategy  
**Related:** [data-management.md](../05-science/data-management.md), [system-architecture.md](system-architecture.md)

---

## Strategic split

AIP separates:

1. **Operational metadata DB** — projects, runs, statuses, users (service mode).
2. **Scientific artifact store** — Parquet/JSON files / object storage for large results.
3. **Reference data mirrors** — versioned bulk biological datasets on filesystem/object store.
4. **Optional analytical warehouse** — later, for cross-run exploration.

Do **not** force large sequence corpora exclusively into OLTP rows.

---

## Local mode (T1)

| Store | Technology | Purpose |
|-------|------------|---------|
| Metadata | SQLite | Runs/projects for single user |
| Artifacts | Local directory layout | Results & manifests |
| Mirrors | Local `data/mirrors/<source>/<snapshot>/` | Public data |

---

## Lab server mode (T2)

| Store | Technology | Purpose |
|-------|------------|---------|
| Metadata | PostgreSQL | Multi-user concurrency |
| Artifacts | S3-compatible or NFS | Shared results |
| Queue | Redis/Rabbit/NATS (TBD) | Workers |
| Mirrors | Shared POSIX or object store | Snapshots |

---

## Conceptual relational schema (metadata)

### `projects`

- `id`, `name`, `description`, `created_at`, `created_by`, `context_pack_id`, `tags`

### `runs`

- `id`, `project_id`, `status`, `created_at`, `started_at`, `finished_at`
- `software_version`, `env_lock_hash`, `config_hash`, `config_blob`
- `client_request_id` (unique per user/tenant)

### `run_snapshots`

- `run_id`, `source_name`, `snapshot_id`, `content_hash`

### `artifacts`

- `id`, `run_id`, `stage_id`, `artifact_type`, `uri`, `media_type`, `sha256`, `schema_version`

### `hypotheses_index` (optional denormalized)

- Small index for API queries; full features remain in artifacts.

### `users` / `api_tokens` (service mode)

- Standard auth tables; no health data fields.

---

## Artifact naming & layout

```text
artifacts/runs/<run_id>/
  manifest.json
  qc.json
  stage=similarity/features.parquet
  stage=epitopes/features.parquet
  stage=rank/hypotheses.parquet
  stage=explain/explanations.jsonl
  export/bundle/...
```

---

## Identifier strategy

- Internal ULIDs/UUIDs for ops entities.
- Stable scientific IDs preserved as cross-references (`uniprot:P12345`).
- Never invent colliding “pretty” IDs for external accessions.

---

## Migration strategy

- Metadata schema migrations via versioned migration tool (Alembic or equivalent).
- Artifact **schema versions** embedded in filenames/metadata; readers must handle N-1.

---

## Retention

| Class | Default retention |
|-------|-------------------|
| Successful run artifacts | User/policy defined |
| Failed run logs | ≥ 30 days in server mode |
| Mirrored public data | Snapshot policy; keep last N |
| Secrets | Never in DB plaintext |

---

## Analytical queries

v1: query via SDK on Parquet.  
Later: optional DuckDB/Warehouse projections for multi-run meta-analyses—**research only**.

---

## Assumptions

| ID | Assumption |
|----|------------|
| DB-A1 | Artifact immutability is preferred over in-place updates |
| DB-A2 | PostgreSQL availability is acceptable for lab deployments; SQLite suffices for CLI |
| DB-A3 | Biological bulk data licenses allow local mirroring under documented terms |

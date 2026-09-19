# API Design

**Status:** Architectural baseline  
**Related objectives:** supports 12–15, interfaces for UC-11  
**Related:** [interfaces-and-contracts.md](interfaces-and-contracts.md), [medical-disclaimer.md](../00-governance/medical-disclaimer.md)

---

## API surfaces

1. **Python SDK** (`aip-sdk`) — primary programmatic API  
2. **CLI** (`aip-cli`) — thin layer over SDK  
3. **HTTP API** (`aip-service`) — optional lab-server mode  
4. **Artifact schemas** — language-agnostic contracts on disk

---

## Design principles

- Explicit run immutability.
- Disclaimer on every result payload.
- Schema-first request/response validation.
- Idempotent create-run where feasible (`client_request_id`).
- No diagnostic semantics in resource names (`/hypotheses`, not `/diagnoses`).

---

## Python SDK (conceptual)

```text
from aip_sdk import Client

client = Client.from_profile("local")
project = client.projects.create(name="ms-mimicry-explore", context_pack="ms@1.2.0")
run = client.runs.create(
    project_id=project.id,
    config_path="configs/mvp.sequence_epitope.yaml",
    data_snapshots={"uniprot": "2026.07", "iedb": "2026.06"},
)
client.runs.wait(run.id)
hyps = client.runs.hypotheses(run.id, top_k=50)
bundle = client.export.reproducibility_bundle(run.id, dest="./bundle")
```

SDK MUST raise typed errors and never print medical advice.

---

## CLI command map (planned)

| Command | Purpose |
|---------|---------|
| `aip about` | Version, citation, disclaimer |
| `aip contextpacks list` | List packs |
| `aip data mirror ...` | Mirror public snapshots |
| `aip run create -c config.yaml` | Create & optionally start run |
| `aip run status <id>` | Status |
| `aip run explain <id> --rank 1` | Show explanation |
| `aip export bundle <id>` | Reproducibility bundle |
| `aip bench ...` | Plugin benchmarks |

---

## HTTP API (REST sketch)

Base: `/api/v1`

### Meta

- `GET /about` → version, disclaimer, citation
- `GET /health`

### Projects

- `POST /projects`
- `GET /projects/{id}`

### Runs

- `POST /runs` body: project_id, config, snapshots, client_request_id
- `GET /runs/{id}`
- `POST /runs/{id}/cancel`
- `GET /runs/{id}/manifest`
- `GET /runs/{id}/hypotheses?top_k=`
- `GET /runs/{id}/explanations/{hypothesis_id}`
- `GET /runs/{id}/qc`
- `POST /runs/{id}/export:bundle`

### Auth

Service mode MUST support token/OIDC. Local CLI mode MAY use no auth.

---

## Result payload envelope (normative sketch)

```json
{
  "api_version": "1.0.0",
  "run_id": "run_...",
  "disclaimer": {
    "code": "AIP_RESEARCH_ONLY",
    "version": "1.0",
    "text": "Research use only. Computational hypotheses, not medical advice or diagnosis."
  },
  "limitations_ref": "docs/00-governance/scientific-limitations.md@<gitsha>",
  "data": {}
}
```

Missing `disclaimer` ⇒ response invalid (contract test failure).

---

## Hypothesis resource fields (minimum)

| Field | Type | Notes |
|-------|------|-------|
| `hypothesis_id` | string | Stable within run |
| `rank` | int | 1-best |
| `score` | number | Method-specific |
| `uncertainty` | object | e.g., intervals / flags |
| `pair` | object | pathogen & host refs |
| `layers_present` | string[] | evidence layers |
| `explanation_ref` | string | link/id |
| `evidence_origins` | string[] | curated/predicted/mixed |

---

## Error response

```json
{
  "error": {
    "code": "AIP_CONFIG_INVALID",
    "message": "rank.weights must sum to 1.0",
    "details": {},
    "retriable": false
  },
  "disclaimer": { "code": "AIP_RESEARCH_ONLY", "version": "1.0", "text": "..." }
}
```

Even errors SHOULD carry disclaimer in service mode to avoid stripped middleware mistakes on partial clients.

---

## Versioning policy

- URL version `/api/v1` for breaking HTTP changes.
- SDK SemVer aligned with release train.
- Deprecations announced with migration notes ≥ 1 minor release when practical.

---

## Non-goals for API

- Patient identity resources
- Clinical order APIs
- “Diagnosis” endpoints

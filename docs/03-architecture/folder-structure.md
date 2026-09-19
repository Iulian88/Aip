# Repository Folder Structure

**Status:** Architectural baseline  
**Objective mapping:** 16 — Folder Structure  
**Related:** [repository-strategy.md](../04-engineering/repository-strategy.md), [module-architecture.md](module-architecture.md)

---

## Design intent

This structure is a **design specification** for the future monorepo. No implementation code is included in the foundation phase. Directories marked `(planned)` are reserved names.

---

## Root layout (planned)

```text
AIP/
├── README.md
├── ARCHITECTURE.md                 # pointer to docs/03-architecture
├── CONTRIBUTING.md                 # pointer to docs/06-process/contributing.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md                     # pointer to docs/04-engineering/security.md
├── LICENSE                         # chosen at legal review; see license doc
├── CITATION.cff
├── pyproject.toml                  # workspace root (planned)
├── uv.lock / poetry.lock           # lockfile (tool decision in deps doc)
├── Makefile / Taskfile.yml         # developer UX
├── .gitignore
├── .gitattributes
├── .pre-commit-config.yaml
├── .env.example                    # no secrets
├── docker/
│   ├── Dockerfile.runtime
│   ├── Dockerfile.dev
│   └── compose/
│       ├── local.yml
│       └── lab-server.yml
├── docs/                           # THIS foundation (authoritative)
├── adrs -> docs/adr                # optional alias
├── packages/                       # python packages (planned)
│   ├── aip-core/
│   ├── aip-schemas/
│   ├── aip-provenance/
│   ├── aip-config/
│   ├── aip-connectors/
│   ├── aip-idmap/
│   ├── aip-contextpacks/
│   ├── aip-similarity/
│   ├── aip-epitopes/
│   ├── aip-hla/
│   ├── aip-structure/
│   ├── aip-rank/
│   ├── aip-explain/
│   ├── aip-controls/
│   ├── aip-benchmark/
│   ├── aip-pipeline/
│   ├── aip-workflows/
│   ├── aip-sdk/
│   ├── aip-cli/
│   ├── aip-service/
│   ├── aip-export/
│   ├── aip-qc/
│   ├── aip-plugins/
│   └── aip-testkit/
├── apps/                           # (planned)
│   └── web/                        # optional researcher UI
├── workflows/                      # orchestrator entry workflows (planned)
│   ├── mimicry_mvp.nf | Snakefile
│   └── profiles/
├── configs/                        # example configs (planned)
│   ├── profiles/
│   ├── rankers/
│   └── contexts/
├── contextpacks/                   # versioned disease packs (planned)
│   └── README.md
├── data/                           # LOCAL ONLY; not committed large blobs
│   ├── README.md                   # explains mirror layout
│   └── .gitkeep
├── fixtures/                       # small committed scientific fixtures
│   ├── sequences/
│   ├── epitopes/
│   └── expected/
├── scripts/                        # maintainer scripts (planned)
│   ├── bootstrap_dev.sh
│   ├── mirror_data.py
│   └── check_disclaimer.py
├── tests/                          # cross-package e2e tests (planned)
│   ├── contract/
│   ├── integration/
│   ├── e2e/
│   └── ethics/
├── reports/                        # generated locally; gitignored
└── .github/                        # or GitLab CI equivalent
    ├── workflows/
    ├── ISSUE_TEMPLATE/
    └── PULL_REQUEST_TEMPLATE.md
```

---

## Package internal layout (standard)

```text
packages/aip-<name>/
├── pyproject.toml
├── README.md
├── src/aip_<name>/
│   ├── __init__.py
│   ├── api.py              # public surface
│   ├── domain/             # if needed
│   ├── adapters/           # if ports/adapters
│   └── py.typed
├── tests/
│   ├── unit/
│   └── contract/
└── docs/                   # package-local notes (optional)
```

---

## Docs folder (current / authoritative)

```text
docs/
├── README.md
├── 00-governance/
├── 01-product/
├── 02-requirements/
├── 03-architecture/
├── 04-engineering/
├── 05-science/
├── 06-process/
├── 07-risk-and-future/
├── 08-reference/
├── 09-operations/
└── adr/
```

---

## What is committed vs not

| Path | Commit? | Reason |
|------|---------|--------|
| `docs/` | Yes | Foundation |
| `fixtures/` small | Yes | Tests/repro |
| `data/mirrors/**` | No | Size/license variability |
| `reports/` | No | Generated |
| secrets | Never | Security |

---

## Naming conventions

- Packages: `aip-<kebab>` distribution name; `aip_<snake>` import path.
- Config files: `<purpose>.<profile>.yaml`.
- Artifacts: `<stage>__<artifact_type>__v<schema>.parquet`.

---

## Assumption

| ID | Assumption |
|----|------------|
| FS-A1 | Monorepo remains viable until plugin ecosystem demands separate repos; split criteria in repository strategy |

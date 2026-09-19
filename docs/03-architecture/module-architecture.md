# Module Architecture

**Status:** Architectural baseline  
**Objective mapping:** 15 — Module Architecture  
**Related:** [folder-structure.md](folder-structure.md), [interfaces-and-contracts.md](interfaces-and-contracts.md)

---

## Design principle

Modules are **bounded packages** with explicit inputs/outputs, versioned contracts, and independent test suites. Circumventing contracts via cross-imports of internals is forbidden.

---

## Package map (planned monorepo packages)

| Package | Responsibility |
|---------|----------------|
| `aip-core` | Domain models, errors, IDs, disclaimer types |
| `aip-schemas` | JSON schemas / pydantic models for configs & artifacts |
| `aip-provenance` | Manifests, hashing, run identity |
| `aip-config` | Config loading, validation, profiles |
| `aip-connectors` | Public data source adapters |
| `aip-idmap` | Identifier mapping services |
| `aip-contextpacks` | Disease context pack loading/validation |
| `aip-similarity` | Sequence similarity ports + reference adapters |
| `aip-epitopes` | Epitope features + predictors wrappers |
| `aip-hla` | HLA context ports + adapters |
| `aip-structure` | Optional structural modules |
| `aip-rank` | Hypothesis assembly & ranking |
| `aip-explain` | Explanation traces & narrative rendering |
| `aip-controls` | Decoys, null models, calibration helpers |
| `aip-benchmark` | Plugin benchmark harness |
| `aip-pipeline` | Stage definitions, DAG wiring helpers |
| `aip-workflows` | Orchestrator-specific workflow definitions |
| `aip-sdk` | Python API façade for users |
| `aip-cli` | Command-line entry points |
| `aip-service` | Optional API service |
| `aip-export` | Exporters & reproducibility bundles |
| `aip-qc` | QC metrics computation |
| `aip-plugins` | Plugin discovery & registry |
| `aip-testkit` | Fixtures, fakes, contract test utilities |

UI (if any) lives in `apps/web` and depends only on `aip-sdk` / service API—not on scientific internals.

---

## Module dependency rules

```text
aip-cli / aip-service / apps/web
        │
        ▼
     aip-sdk
        │
        ├──────────────► aip-pipeline ► (analysis packages)
        │
        └──────────────► aip-export / aip-provenance / aip-qc

analysis packages may depend on:
  aip-core, aip-schemas, aip-provenance, ports in-domain

connectors must NOT depend on ranking or explain.
rank may depend on feature schemas, not on connector internals.
```

**Forbidden:** `aip-connectors` importing `aip-rank`; UI importing `aip-similarity` internals.

---

## Domain objects (core)

| Object | Description |
|--------|-------------|
| `MoleculeRef` | Canonical molecule identity + cross-refs |
| `EvidenceFeature` | Typed feature with layer, method, params, origin |
| `CandidatePair` | Pathogen↔host pair linkage |
| `Hypothesis` | Scored candidate + explanation + uncertainty |
| `ContextPack` | Versioned disease context |
| `DataSnapshot` | Immutable pointer to mirrored data |
| `RunManifest` | Full reproducibility descriptor |
| `DisclaimerStamp` | Mandatory ethics metadata |

---

## Port interfaces (illustrative contracts)

### SimilaritySearchPort

- `search(query_set, target_set, params) -> SimilarityResultArtifact`

### EpitopeFeaturePort

- `build_features(pairs, epitope_snapshot, params) -> EpitopeFeatureArtifact`

### HlaBindingPort

- `annotate(peptides, alleles, params) -> HlaFeatureArtifact`

### RankerPort

- `rank(feature_table, rank_config) -> HypothesisSetArtifact`

### ExplainerPort

- `explain(hypothesis_set, feature_table) -> ExplanationArtifact`

Exact fields: [interfaces-and-contracts.md](interfaces-and-contracts.md).

---

## Plugin model

Plugins register via entry points:

```text
[project.entry-points."aip.plugins.similarity"]
mmseqs = "aip_similarity.adapters.mmseqs:MmseqsAdapter"
```

Plugin manifest MUST declare:

- name, version, license
- deterministic? (yes/no/partial)
- required binaries
- capability tags
- config schema ref

---

## Stage module pattern

Each pipeline stage package exposes:

1. `STAGE_ID`
2. input schema
3. output schema
4. `run(context) -> ArtifactRef`
5. QC hooks
6. contract tests

---

## Error model

Typed errors with stable codes:

| Code | Meaning |
|------|---------|
| `AIP_CONFIG_INVALID` | Schema validation failed |
| `AIP_SNAPSHOT_MISSING` | Data snapshot not found |
| `AIP_TOOL_FAILED` | Backend tool non-zero exit |
| `AIP_EXPLAIN_INCOMPLETE` | Missing explanation (release-blocking) |
| `AIP_ETHICS_VIOLATION` | Disallowed claim language detected in generator |

---

## Versioning of modules

Packages follow SemVer. Breaking contract changes bump MAJOR and require ADR if cross-cutting.

---

## Testing expectations per module

| Module type | Minimum |
|-------------|---------|
| Core/schemas | Unit + property tests |
| Adapters | Integration tests with pinned tool versions (CI optional heavy jobs) |
| Ports | Contract tests with fakes |
| Pipeline | End-to-end smoke on sample data |

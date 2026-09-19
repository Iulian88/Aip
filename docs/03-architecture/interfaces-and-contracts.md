# Interfaces and Contracts

**Status:** Architectural baseline  
**Related:** [module-architecture.md](module-architecture.md), [api.md](api.md), [testing.md](../04-engineering/testing.md)

---

## Purpose

Define **normative contracts** between modules so independent teams can implement adapters without breaking the system.

---

## Contract layers

1. **Schema contracts** — JSON Schema / Pydantic models for configs & artifacts  
2. **Port contracts** — Python Protocols / ABCs  
3. **Plugin manifest contracts** — discovery metadata  
4. **Ethics contracts** — mandatory fields and language constraints  
5. **Congruence contracts** — reproducibility comparison rules  

---

## Artifact schema versioning

Artifact types use `schema_version` integers or semver strings.  
Readers MUST support current and previous major schema for at least one release cycle.

Minimum shared metadata on all artifacts:

| Field | Required |
|-------|----------|
| `artifact_type` | yes |
| `schema_version` | yes |
| `produced_by_stage` | yes |
| `produced_at` | yes |
| `run_id` | yes |
| `sha256` | yes |
| `disclaimer` | yes for user-exportable artifacts |

---

## EvidenceFeature contract (logical)

| Field | Description |
|-------|-------------|
| `feature_id` | Unique in run |
| `layer` | `sequence` \| `epitope` \| `hla` \| `structure` \| ... |
| `method_id` | Tool/method identifier |
| `method_version` | Pinned version |
| `params_hash` | Hash of method params |
| `origin` | `curated` \| `predicted` \| `computed` |
| `pair_id` | Candidate pair reference |
| `values` | Typed payload |
| `qc_flags` | Optional warnings |

---

## Hypothesis contract (logical)

Must include: identity, rank, score, pair refs, layers, explanation_id, uncertainty, origins, limitations_ref, disclaimer.

---

## Explanation trace contract

Machine-readable list of contributors:

```text
Contribution {
  layer, feature_ids[], weight_or_rule, human_key, human_detail
}
```

Human summary MUST be generated only from these fields (no free-form model invention without grounding)—see [explainability.md](../05-science/explainability.md).

---

## Port test contracts

Each port ships with `aip-testkit` suites:

- Happy path fixture
- Empty input behavior
- Invalid param rejection
- Nondeterminism flag respected
- Provenance fields populated

Adapters MUST pass contract suite to be marked “supported.”

---

## Congruence policy contract

When comparing two re-runs:

| Element | Policy |
|---------|--------|
| Manifest software/data hashes | Exact match required for “bit-repro mode” |
| Hypothesis IDs | May differ; compare on pair keys |
| Scores | Absolute/relative tolerance per method |
| Ranks | Top-k Jaccard threshold |
| Explanations | Semantic field equality on contributions |

Exact numeric tolerances defined per method in validation docs.

---

## Ethics language contract

A static checker scans generated narratives for blacklisted medical phrases. Failures raise `AIP_ETHICS_VIOLATION`.

---

## Compatibility guarantees

- Within a MAJOR SDK version, port method names do not break without deprecation window when practical.
- Config keys marked `stable` follow SemVer; `experimental` keys may change in MINOR.

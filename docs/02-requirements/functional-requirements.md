# Functional Requirements

**Status:** Requirements baseline (pre-implementation)  
**Objective mapping:** 12 — Functional Requirements  
**Related:** [use-cases.md](../01-product/use-cases.md), [non-functional-requirements.md](non-functional-requirements.md)

---

## Requirement language

- **MUST / SHALL** — mandatory for claimed version
- **SHOULD** — default expectation; exceptions need ADR
- **MAY** — optional

IDs are stable; do not reuse removed IDs.

---

## FR-1 Project & run management

| ID | Requirement |
|----|-------------|
| FR-1.1 | System SHALL allow users to create an **Analysis Project** with name, description, autoimmune context, and tags. |
| FR-1.2 | System SHALL create an **Analysis Run** bound to immutable config snapshot + software version + data snapshot IDs. |
| FR-1.3 | System SHALL record run status: `queued`, `running`, `succeeded`, `failed`, `cancelled`. |
| FR-1.4 | System SHALL support cancelling non-finished runs. |
| FR-1.5 | System SHALL produce a **Run Manifest** artifact on terminal states. |

---

## FR-2 Data integration

| ID | Requirement |
|----|-------------|
| FR-2.1 | System SHALL provide connectors for primary public sources defined in [data-sources.md](../08-reference/data-sources.md) (phased). |
| FR-2.2 | Each connector SHALL capture source version/date, retrieval timestamp, license metadata, and content hashes. |
| FR-2.3 | System SHALL map external identifiers into a canonical internal ID scheme with lossless cross-references where possible. |
| FR-2.4 | System SHALL label molecular records with organism taxonomy IDs when available. |
| FR-2.5 | System SHALL support offline use of previously mirrored snapshots. |
| FR-2.6 | System SHOULD validate schema of ingested records and quarantine invalid rows. |

---

## FR-3 Context packs

| ID | Requirement |
|----|-------------|
| FR-3.1 | System SHALL support versioned **Disease Context Packs** (autoantigen lists, default alleles, notes, provenance). |
| FR-3.2 | Users SHALL be able to supply custom context packs conforming to schema. |
| FR-3.3 | Context packs SHALL include curation provenance and license fields. |

---

## FR-4 Sequence similarity analysis

| ID | Requirement |
|----|-------------|
| FR-4.1 | System SHALL compute sequence similarity features between pathogen and host protein/peptide sets. |
| FR-4.2 | System SHALL record alignment parameters and tool versions. |
| FR-4.3 | System SHALL store sufficient alignment summary features for explanation (scores, identity, coverage, start/end). |
| FR-4.4 | System SHOULD support configurable sensitivity/speed profiles. |

---

## FR-5 Epitope analysis

| ID | Requirement |
|----|-------------|
| FR-5.1 | System SHALL distinguish `curated` vs `predicted` epitopes in all outputs. |
| FR-5.2 | System SHALL compute epitope overlap/similarity features for candidate pairs. |
| FR-5.3 | System SHALL expose prediction tool wrappers behind interfaces with pinned versions. |
| FR-5.4 | System MUST NOT present predicted epitopes as experimentally validated. |

---

## FR-6 HLA / MHC context

| ID | Requirement |
|----|-------------|
| FR-6.1 | System SHALL allow users to select HLA alleles for contextual annotation. |
| FR-6.2 | System SHALL attach binding prediction/curated binding features to candidates when enabled. |
| FR-6.3 | System MUST frame HLA outputs as computational context, not clinical genotype interpretation. |

---

## FR-7 Optional structural analysis

| ID | Requirement |
|----|-------------|
| FR-7.1 | System MAY provide structural similarity modules when structures exist. |
| FR-7.2 | If enabled, system SHALL record structure source (experimental vs modeled) and method versions. |

---

## FR-8 Hypothesis assembly & ranking

| ID | Requirement |
|----|-------------|
| FR-8.1 | System SHALL assemble **Hypothesis Objects** from enabled evidence layers. |
| FR-8.2 | Each hypothesis SHALL include score, rank, uncertainty summary, explanation structure, and limitations pointer. |
| FR-8.3 | Ranking configuration SHALL be versioned and dumpable. |
| FR-8.4 | System SHALL support ablation runs that disable layers. |
| FR-8.5 | System SHOULD provide sensitivity analysis utilities for key thresholds. |

---

## FR-9 Explainability

| ID | Requirement |
|----|-------------|
| FR-9.1 | System SHALL generate machine-readable explanation traces per hypothesis. |
| FR-9.2 | System SHALL generate human-readable explanation summaries grounded only in trace fields. |
| FR-9.3 | System SHALL fail validation if a ranked item lacks explanation coverage. |

---

## FR-10 Controls & benchmarking

| ID | Requirement |
|----|-------------|
| FR-10.1 | System SHALL support decoy/negative control workflows. |
| FR-10.2 | System SHALL provide a benchmark harness for scorer plugins. |
| FR-10.3 | System SHOULD ship reference fixtures with expected ranges. |

---

## FR-11 Export & reproducibility

| ID | Requirement |
|----|-------------|
| FR-11.1 | System SHALL export results as structured tables (e.g., Parquet/JSON) plus manifest. |
| FR-11.2 | System SHALL export a reproducibility bundle sufficient for re-run attempts. |
| FR-11.3 | Exports SHALL embed disclaimer metadata. |
| FR-11.4 | System SHOULD support RO-Crate or equivalent FAIR packaging (phased). |

---

## FR-12 Interfaces

| ID | Requirement |
|----|-------------|
| FR-12.1 | System SHALL provide a CLI for UC-01 and export. |
| FR-12.2 | System SHALL provide a Python API for programmatic use. |
| FR-12.3 | System SHOULD provide a REST/gRPC service mode for multi-user research servers. |
| FR-12.4 | System MAY provide a web UI for exploration (post-MVP acceptable). |

---

## FR-13 Governance surfaces

| ID | Requirement |
|----|-------------|
| FR-13.1 | All result-returning interfaces SHALL display/include the medical disclaimer. |
| FR-13.2 | System SHALL expose software version, data snapshot IDs, and config hash to users. |
| FR-13.3 | System SHALL provide an `about`/`citation` command or endpoint. |

---

## FR-14 Extensibility

| ID | Requirement |
|----|-------------|
| FR-14.1 | Scorers, predictors, and connectors SHALL be loadable as plugins conforming to contracts. |
| FR-14.2 | Plugin metadata SHALL declare capabilities, licenses, and nondeterminism flags. |

---

## FR-15 Quality & QC

| ID | Requirement |
|----|-------------|
| FR-15.1 | Each run SHALL emit QC metrics (input counts, filtered counts, error counts, runtime). |
| FR-15.2 | System SHALL fail fast on missing mandatory inputs with actionable errors. |

---

## Out-of-scope functional asks

Any requirement implying diagnosis, treatment, PHI EHR ingest, or dual-use pathogen design is rejected per [non-goals.md](../00-governance/non-goals.md).

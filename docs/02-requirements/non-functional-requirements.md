# Non-functional Requirements

**Status:** Requirements baseline  
**Objective mapping:** 13 — Non-functional Requirements  
**Related:** [security.md](../04-engineering/security.md), [performance-baselines.md](../09-operations/performance-baselines.md)

---

## NFR-1 Reproducibility

| ID | Requirement |
|----|-------------|
| NFR-1.1 | Given identical bundle inputs on supported platform profile, results SHALL match within documented congruence policy. |
| NFR-1.2 | All third-party scientific tools SHALL be version-pinned in environments. |
| NFR-1.3 | Randomness SHALL be seedable where applicable; nondeterministic tools MUST be flagged. |

---

## NFR-2 Performance & scalability

| ID | Requirement |
|----|-------------|
| NFR-2.1 | MVP reference screen (documented dataset size) SHALL complete on reference CPU profile within published budget. |
| NFR-2.2 | System SHOULD scale to multi-proteome batches via workflow parallelism. |
| NFR-2.3 | Memory usage SHALL be documented per profile; OOM failures MUST be actionable. |
| NFR-2.4 | GPU MAY be used for optional modules but MUST NOT be required for core v1 sequence/epitope pipelines. |

**Assumption NFR-A1:** Initial reference profile is a 16-vCPU / 64GB RAM Linux x86_64 machine (exact baseline published at M2).

---

## NFR-3 Reliability

| ID | Requirement |
|----|-------------|
| NFR-3.1 | Pipeline stages SHALL be retryable for transient network failures during data fetch. |
| NFR-3.2 | Partial failures SHALL not silently mark overall success. |
| NFR-3.3 | Critical operations SHOULD be idempotent when re-run with same run ID semantics. |

---

## NFR-4 Usability

| ID | Requirement |
|----|-------------|
| NFR-4.1 | CLI help and error messages SHALL be understandable to U1 users without reading source. |
| NFR-4.2 | Default configs SHOULD be conservative (fewer false-confidence hits). |
| NFR-4.3 | Docs SHALL include a “first successful run” tutorial under 30 minutes for sample data. |

---

## NFR-5 Security & privacy

| ID | Requirement |
|----|-------------|
| NFR-5.1 | No PHI storage in default distributions. |
| NFR-5.2 | Secrets SHALL NOT be committed; config SHALL support secret injection. |
| NFR-5.3 | Service mode SHALL support authentication and authorization. |
| NFR-5.4 | Dependencies SHALL be scanned for known vulnerabilities in CI. |
| NFR-5.5 | Supply chain pinning SHALL be used for releases (lockfiles, image digests). |

---

## NFR-6 Maintainability

| ID | Requirement |
|----|-------------|
| NFR-6.1 | Module boundaries SHALL allow replacing a backend without rewriting callers. |
| NFR-6.2 | Public APIs SHALL be semantically versioned. |
| NFR-6.3 | Architecture docs SHALL be updated in the same PR as structural changes. |

---

## NFR-7 Observability

| ID | Requirement |
|----|-------------|
| NFR-7.1 | Structured logs SHALL include run_id, stage, and error taxonomy codes. |
| NFR-7.2 | Metrics SHOULD include stage durations and record counts. |
| NFR-7.3 | Traces MAY be provided in service mode. |

---

## NFR-8 Portability

| ID | Requirement |
|----|-------------|
| NFR-8.1 | Primary supported runtime: Linux x86_64 via containers. |
| NFR-8.2 | macOS/Windows SHOULD be supported via containers or documented limitations. |
| NFR-8.3 | Cloud object storage backends SHOULD be abstractable. |

---

## NFR-9 Compliance & ethics surfacing

| ID | Requirement |
|----|-------------|
| NFR-9.1 | Disclaimer and limitation references SHALL be impossible to disable in released result artifacts. |
| NFR-9.2 | License/attribution fields SHALL be present in exports. |

---

## NFR-10 Documentation quality

| ID | Requirement |
|----|-------------|
| NFR-10.1 | A new implementing team SHALL be able to build from `/docs` without private tribal knowledge. |
| NFR-10.2 | Ambiguities SHALL be recorded in the assumptions register, not left implicit. |

---

## NFR-11 Internationalization

| ID | Requirement |
|----|-------------|
| NFR-11.1 | v1 UI/docs MAY be English-only. |
| NFR-11.2 | Message catalogs SHOULD be designed to allow later i18n. |

---

## NFR-12 Accessibility

| ID | Requirement |
|----|-------------|
| NFR-12.1 | Web UI (when present) SHOULD meet WCAG 2.2 AA for core workflows. |
| NFR-12.2 | Color SHALL NOT be the only channel for evidence strength. |

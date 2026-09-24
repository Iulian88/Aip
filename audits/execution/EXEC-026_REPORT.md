# EXEC-026

## Baseline

| Item | Value |
|------|--------|
| Certified HEAD | `8541b20f2fbda7f1035f603bad3248bc10c8601f` |
| Commit | `cert(sprint-025): certify Verification OPS under Model C` |
| Authorization | FINAL-ARCHITECTURE-RE-AUDIT-026 — **EXEC AUTHORIZED: YES** |
| Input chain | DISCOVERY-026 · SPEC-026 · ARCHITECTURE-AUDIT-026 · IMPLEMENTATION-DECISION-026 · FINAL-ARCHITECTURE-RE-AUDIT-026 |
| Mode | EXEC implementation — **no commit / no push / no formal certification** |

Working tree left dirty for CODE-AUDIT-026.

## Scope

Provenance Projection + Reproducibility Packaging (Phase R2) only:

- `ResearchOperations.packageResearchRun`
- OPS-local helpers in `operations/reproducibility-packaging.ts`
- Export-only `ReproducibilityPackage` (`aip.repro.pack@1.0.0`)
- Additive `REF-OPS-162…180`
- TEST-026 / SMOKE-026

**Out of scope (not implemented):** import/restore; Literature; DocumentArtifact; AI; KG; databases; durable bundle storage; Core/Persistence/ENC/SER/CONF/CERT redesign; second graph/journal; generic lifecycle.

## Implementation Summary

| Symbol | Kind |
|--------|------|
| `packageResearchRun(input)` | Export/package orchestration |
| `reproducibility-packaging.ts` | Pure projection / ordering / digest / verify helpers |
| `verifyReproducibilityPackage` | Integrity check only (no Persistence restore) |
| Marker | `referenceAppMarker.sprint = 26` |

Files touched (change budget only):

- `apps/reference-app/src/operations/reproducibility-packaging.ts` *(new)*
- `apps/reference-app/src/operations/research-operations.ts`
- `apps/reference-app/src/index.ts`
- `packages/reference-tests/src/fixtures/ops.ts` (additive only)
- `scripts/test-026-reproducibility-packaging.mjs` *(new)*
- `scripts/smoke-026-reproducibility-packaging.mjs` *(new)*
- `SMOKE_026_PASS` *(new)*
- `IMPLEMENTATION.md`
- `audits/execution/EXEC-026_REPORT.md` (this file)

No Core / ENC / SER / Persistence / ConformanceEngine / CertificationEngine source edits.

## ResearchRun

| Rule | Result |
|------|--------|
| Export-time projection only | **PASS** |
| Not a ScientificUnit / PersistenceEntity | **PASS** |
| No RevisionHead for ResearchRun | **PASS** |
| No scientific relationships / second journal | **PASS** |
| Lifetime = duration of `packageResearchRun` | **PASS** |

## Provenance Projection

Seven axes remain separate via `axis_declaration` boolean map:

1. scientific_provenance  
2. operational_audit_history  
3. source_locator  
4. persistence_history  
5. revision_lineage  
6. research_session_context  
7. research_workspace_context  

No generic provenance field. No provenance graph.

## Bundle

Schema: `aip.repro.pack@1.0.0`  
Identity: caller `rpkg:…`  
Profiles: `minimal` \| `with_ops_events`  
Revision policies: `heads_only` \| `explicit_revisions` \| `full_lineage`  
Authority: **derived packaging artifact** — never scientific authority.

## Manifest

Required fields present: `schema_id`, `package_id`, `packaging_profile`, `included_identities`, `revision_policy`, `artifact_entries`, `source_locators`, `axis_declaration`, `content_digest`.  
Optional: `session_id`, `workspace_id`, `member_refs`, `ops_events`, `generated_at` (caller-supplied only; omitted on certified minimal paths).

## Determinism

| Check | Result |
|-------|--------|
| Double export identical SER (TEST-026 / REF-OPS-163 / SMOKE-026) | **PASS** |
| `revision_id` ASCENDING | **PASS** |
| Identities / locators / members / events ordered per Decision-026 | **PASS** |
| No `Date.now` / `randomUUID` / `Math.random` on packaging paths | **PASS** |

## Integrity

Mechanism: SHA-256 hex over `stableStringify(package without content_digest)` via `node:crypto`.  
`verifyReproducibilityPackage` recomputes and compares. Digest mismatch → `OpsError INVALID_COMMAND_STATE`.  
Integrity metadata ≠ scientific authority. **PASS**

## Source Locators

Evidence → `envelope.content.source.source_locator`  
Verification → `envelope.content.artifact_ref`  
Unique + codepoint ASC. No fetch. No DocumentArtifact. **PASS**

## Events

`minimal`: `ops_events` absent.  
`with_ops_events`: `getEvents` per included identity; order `(parent_identity, ordinal, event_id)`.  
No second journal. Events ≠ scientific provenance. **PASS**

## Membership

Optional organizational projection when `include_organizational_context === true`.  
Inclusion-filtered to `included_identities` (O-026-01). Sorted `(entity_kind, unit_kind||'', identity)`.  
Membership ≠ scientific relationship. **PASS**

## Snapshots

ResearchSnapshot / WorkspaceSnapshot schemas unchanged. Packaging does not embed full snapshots; optional ids + filtered member_refs only. REF-OPS-172 asserts snapshot keys unchanged. **PASS**

## Security

Certified fixtures/tests assert absence of password/api_key/access_token/private_key/Authorization/process.env patterns in package SER. No secrets ingested. **PASS**

## Error Model

| Condition | Error |
|-----------|--------|
| Invalid `package_id` / empty inclusion / bad policy | `OpsError INVALID_COMMAND_STATE` |
| Missing identity / revision | `PersistenceError` unchanged |
| Non-intact unit | `OpsError INVALID_COMMAND_STATE` |
| Digest mismatch / unsupported schema | `OpsError INVALID_COMMAND_STATE` |

No `PackagingError` / `ReproducibilityError` / `ProvenanceError`. **PASS**

## Reference Fixtures

| Range | Count |
|-------|-------|
| New REF-OPS-162…180 | **19** |
| Total OPS | **180** |
| Total FULL (SCI 44 + OPS 180) | **224** |
| SCI (unchanged) | **44** |

Themes covered: minimal package; double-run determinism; digest verify; axis separation; opt-in events; full_lineage + predecessor; missing identity; invalid package_id; non-intact guard; no Relationship; ResearchSnapshot unchanged; source locators; wall-clock absent; membership filter; empty inclusion; digest mismatch; export-only; security exclusions; explicit_revisions.

## Tests

| Suite | Result |
|-------|--------|
| TEST-026 | **10/10 PASS** |
| TEST-016 | PASS |
| TEST-017 | PASS |
| TEST-018 | PASS |
| TEST-019 | PASS |
| TEST-020 | PASS |
| TEST-021 | PASS |
| TEST-022 | PASS |
| TEST-023 | PASS |
| TEST-024 | PASS |
| TEST-025 | PASS |

## Regression

Regression 016–025: **PASS** (all historical tests green; no historical fixture rewrites).

## Smoke

SMOKE-026: **PASS** — wrote `SMOKE_026_PASS`  
Live corpus inside smoke: SCI=44 OPS=180 FULL=224 · CONF SCI+OPS COMPLIANT

## Typecheck

`pnpm run typecheck` → **PASS**

## Lint

`pnpm run lint` → **PASS**

## Build

`pnpm run build` → **PASS**

## Conformance

| Corpus | Result |
|--------|--------|
| SCI | **44/44** |
| OPS | **180/180** |
| FULL | **224/224** |
| Profile SCI `CONF-001@1.0.0` | COMPLIANT |
| Profile OPS `CONF-001@1.1.0-OPS` | COMPLIANT |

Additive fixtures only. No second ConformanceEngine / CertificationEngine. No fabricated ReferenceReport.

## Security Scan

| Check | Result |
|-------|--------|
| No Date.now / randomUUID / Math.random in packaging implementation | PASS |
| No PackagingError / parallel error classes | PASS |
| No importResearchRun / restore API | PASS |
| No PostgreSQL / Redis / Kafka / Neo4j / OpenSearch | PASS |
| No second journal / second identity system markers | PASS (`false`) |
| Secrets patterns absent from packaging SER (fixture assertions) | PASS |
| No external network requirement for packaging | PASS |

## Determinism Verification

Identical authoritative inputs packaged twice → identical `ser` (TEST-026 T026-002, REF-OPS-163, SMOKE-026). No normalization applied. **PASS**

## Blockers

**0**

## Required Patches

**0**

## Certification Status

**NOT PERFORMED**

## Git Status

| Item | Value |
|------|--------|
| HEAD | `8541b20f2fbda7f1035f603bad3248bc10c8601f` (unchanged) |
| Commit | **NONE** |
| Push | **NONE** |
| History rewrite | **NONE** |
| Working tree | Dirty — implementation + Sprint 026 design docs uncommitted for CODE-AUDIT-026 |

---

**EXEC-026 — COMPLETE**

Next gate: **CODE-AUDIT-026**

*End EXEC-026.*

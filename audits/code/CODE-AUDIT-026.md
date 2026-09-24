# CODE-AUDIT-026

| Field | Value |
|-------|--------|
| Audit ID | CODE-AUDIT-026 |
| Subject | Provenance Projection & Reproducibility Packaging — post-EXEC code audit |
| Mode | **READ-ONLY** |
| Baseline HEAD | `8541b20f2fbda7f1035f603bad3248bc10c8601f` |
| Does not authorize | Source edits, patches, fixture edits, commits, pushes, formal certification |

**Verdict: APPROVED WITH OBSERVATIONS**

---

## Baseline

| Check | Result |
|-------|--------|
| `git rev-parse HEAD` | `8541b20f2fbda7f1035f603bad3248bc10c8601f` |
| Sprint 025 | FORMALLY CERTIFIED AND CLOSED — Verification OPS under Model C |
| Pre-026 certified corpus | SCI 44/44 · OPS 161/161 · FULL 205/205 |
| EXEC-026 report | `audits/execution/EXEC-026_REPORT.md` — COMPLETE · 0 blockers · 0 patches · certification NOT PERFORMED |
| History rewrite | **NONE** |

---

## Inputs Reviewed

1. `specs/architecture/SPEC-026_provenance_reproducibility_packaging.md`
2. `specs/architecture/IMPLEMENTATION-DECISION-026_provenance_reproducibility_packaging.md`
3. `audits/architecture/ARCHITECTURE-AUDIT-026_SPEC-026.md`
4. `audits/architecture/FINAL-ARCHITECTURE-RE-AUDIT-026.md`
5. `audits/execution/EXEC-026_REPORT.md`
6. Working-tree diff vs `8541b20…` (tracked + untracked Sprint 026 artifacts)
7. Implementation: `reproducibility-packaging.ts`, `research-operations.ts` (`packageResearchRun`), `index.ts`
8. Fixtures REF-OPS-162…180; TEST-026; SMOKE-026

---

## Diff Scope

### Tracked modifications vs certified HEAD

| Path | Classification |
|------|----------------|
| `apps/reference-app/src/operations/research-operations.ts` | **EXPECTED** — `packageResearchRun` + types/re-exports |
| `apps/reference-app/src/index.ts` | **EXPECTED** — public exports; marker sprint 26 |
| `packages/reference-tests/src/fixtures/ops.ts` | **EXPECTED** — additive REF-OPS-162…180 only (no historical fixture deletions) |
| `IMPLEMENTATION.md` | **EXPECTED** — Sprint 026 documentation |

### Untracked Sprint 026 artifacts

| Path | Classification |
|------|----------------|
| `apps/reference-app/src/operations/reproducibility-packaging.ts` | **EXPECTED** — Decision helper module |
| `scripts/test-026-reproducibility-packaging.mjs` | **EXPECTED** |
| `scripts/smoke-026-reproducibility-packaging.mjs` | **EXPECTED** |
| `SMOKE_026_PASS` | **EXPECTED** |
| `audits/execution/EXEC-026_REPORT.md` | **EXPECTED** |
| Design chain docs (DISCOVERY / SPEC / ARCHITECTURE-AUDIT / IMPLEMENTATION-DECISION / FINAL-RE-AUDIT) | **EXPECTED** — Sprint 026 design artifacts |

### Foundation packages

| Package | Diff vs HEAD |
|---------|--------------|
| `packages/core` | **NONE** |
| `packages/persistence` | **NONE** |
| `packages/encoding` | **NONE** |
| `packages/serialization` | **NONE** |
| `packages/conformance` | **NONE** |
| `packages/certification` | **NONE** |
| Historical TEST-016…025 scripts | **NONE** |

**No unexplained unrelated source modifications.**

---

## ResearchRun Audit

| Check | Result |
|-------|--------|
| API | `ResearchOperations.packageResearchRun` — OPS-owned |
| Nature | Export-time inclusion/projection only (no ResearchRun type/entity persisted) |
| Persistence.create / advanceHead / appendEvent / ensureInitialHead in packaging path | **ABSENT** |
| ScientificUnit / Core factory / transition invocation in packaging path | **ABSENT** |
| RevisionHead creation for ResearchRun | **ABSENT** (reads existing head via `getHead`) |
| Scientific relationships | **ABSENT** (REF-OPS-171 asserts Relationship total = 0) |
| `Date.now` / `randomUUID` / `Math.random` in packaging path | **ABSENT** |

**PASS.**

---

## Provenance Audit

`axis_declaration` exposes seven explicit boolean axes:

1. scientific_provenance  
2. operational_audit_history  
3. source_locator  
4. persistence_history  
5. revision_lineage  
6. research_session_context  
7. research_workspace_context  

No collapsed generic provenance field. No provenance graph type. Axes toggled by profile/org-context flags; scientific content remains inside CanonicalUnit SER projections.

**PASS.**

---

## Bundle Authority

| Layer | Role preserved |
|-------|----------------|
| Scientific Core | Untouched; packaging does not mutate |
| Persistence | Read-only for packaging (`get` / `getHead` / `listRevisions` / `getEvents`) |
| ENC | Prior assemble stored in Persistence payloads; packaging does not re-encode scientifically |
| SER | Existing `JsonEncoder` + `stableStringify` |
| OPS | Projection/orchestration |
| Bundle | Derived `aip.repro.pack@1.0.0` + packaging-level `content_digest` |

No packaging → Core transition. No packaging → Persistence write. No packaging → revision creation.

**PASS.**

---

## Persistence Audit

No Persistence redesign. No new repository/adapter/database/durable bundle store. No second event journal. No second revision graph. Packaging consumes existing APIs only.

**PASS.**

---

## Model C Audit

| Concern | Result |
|---------|--------|
| Scientific identity | Unchanged; package cites existing identities |
| `revision_id` | Carried per revision entry from Persistence entity |
| `predecessor_revision_id` | Preserved on successor entries (REF-OPS-167 / T026-003) |
| RevisionHead | Authoritative current pointer via `headPtr.content_version` → `head_revision_id` |
| Second revision graph | **ABSENT** |

**PASS.**

---

## Lineage Ordering

Implementation sorts each artifact’s `revisions[]` by `revision_id` codepoint ascending after projection. `predecessor_revision_id` remains the semantic lineage relation and is not inferred from sort order. `listRevisions` used for `full_lineage` (Persistence already sorts ascending). Matches OQ-026-007 / Decision-026.

**PASS.**

---

## Determinism

Independent inspection:

- Collections explicitly sorted (`included_identities`, `artifact_entries`, revisions, locators, members, events).
- Package container via SER `stableStringify`.
- Digest over `stableStringify(body without content_digest)`.
- No wall-clock on certified packaging paths; `generated_at` only if caller-supplied.
- No Map/Set iteration as final order (Set → sorted array for locators/identities).

Independent auditor double-export: **IDENTICAL** (`INDEPENDENT_DETERMINISM_PASS`).  
TEST-026 T026-002 / REF-OPS-163 / SMOKE-026: **PASS**.

**PASS.**

---

## Timestamp Handling

| Kind | Handling |
|------|----------|
| Scientific / source timestamps inside unit SER | Preserved unchanged |
| Ops event `at` | Included only under `with_ops_events` |
| `generated_at` | Optional caller field; omitted on certified minimal fixtures (REF-OPS-174) |
| Export-time `Date.now` | **FORBIDDEN / ABSENT** on packaging paths |

When present, `generated_at` is inside the digested body (caller-stable), matching Decision.

**PASS.**

---

## Bundle Identity

Caller-supplied `package_id` matching `^rpkg:[A-Za-z0-9._~-]{1,128}$`. Content binding via SHA-256 hex `content_digest`. Packaging-level only; not a scientific ref target. No random/wall-clock identity.

**PASS.**

---

## Manifest

Required Decision fields present: `schema_id`, `package_id`, `packaging_profile`, `included_identities`, `revision_policy`, `artifact_entries`, `source_locators`, `axis_declaration`, `content_digest`. Optional org/events/`generated_at` only when requested. Key ordering delegated to `stableStringify`. No unspecified speculative fields observed.

**PASS.**

---

## Integrity

Seal: `sha256_hex(utf8(stableStringify(packageWithoutDigest)))` via `node:crypto`.  
Verify: strip `content_digest`, recompute, compare; mismatch → `OpsError INVALID_COMMAND_STATE` (REF-OPS-177). Digest is INTEGRITY_METADATA, not scientific authority.

**PASS.**

---

## ENC / SER

No competing canonical encoder. No competing scientific serializer. Packaging uses existing `JsonEncoder.encode(entity.payload)` for unit SER and `stableStringify` for package container. Imports from `@sciros/encoding` / `@sciros/serialization` only for pre-existing OPS deps; helpers import `stableStringify` only.

**PASS** (ENC) · **PASS** (SER)

---

## Source Locators

Evidence: `envelope.content.source.source_locator`.  
Verification: `envelope.content.artifact_ref`.  
Unique + codepoint sort. No fetch, DocumentArtifact, crawler, or literature path.

**PASS.**

---

## Event Journal

Packaging path: `repository.getEvents` read + `projectOpsEvents` only. No `appendEvent` in packaging. Marker `secondEventJournal: false` consistent with code. Events remain OPERATIONAL; not reinterpreted as scientific relationships.

**Second Event Journal: ABSENT**

---

## Identity System

No new UUID/scientific ID generator in packaging. Bundle id is caller packaging grammar `rpkg:…`. Marker `secondIdentitySystem: false` consistent. Prefix→`unit_kind` helper is OPS packaging resolution over certified Core identity grammars (see Observations) — not a second identity allocator.

**Second Identity System: ABSENT**

---

## Membership

Optional organizational projection when `include_organizational_context === true`. Inclusion-filtered to `included_identities` (O-026-01). Sorted `(entity_kind, unit_kind||'', identity)`. Does not create Persistence.Relationship.

**PASS.**

---

## Snapshots

ResearchSnapshot / WorkspaceSnapshot schemas unchanged (no timeline.ts edits). Packaging does not embed full snapshots. REF-OPS-172 asserts snapshot key set unchanged after packaging.

**PASS.**

---

## Security

No `process.env` access in packaging implementation. Certified fixtures/tests assert absence of password/api_key/access_token/private_key/Authorization/process.env substrings in package SER for synthetic inputs. Packaging does not redact Core scientific fields (matches Decision caller/fixture discipline).

**PASS.**

---

## Error Model

OPS validation → `OpsError INVALID_COMMAND_STATE`.  
Persistence NOT_FOUND/CONFLICT propagate unchanged.  
No `PackagingError` / `ReproducibilityError` / `ProvenanceError` classes.

**PASS.**

---

## Export-only Boundary

No `importResearchRun` / restore / rehydrate / overwrite / durable package store. `verifyReproducibilityPackage` recomputes digest only; REF-OPS-178 / T026-008 confirm empty Persistence in a fresh session after verify.

**PASS.**

---

## Reference Fixtures

| Metric | Actual |
|--------|--------|
| New fixtures | **19** (REF-OPS-162…180) |
| Total OPS | **180** |
| Total FULL | **224** (44 + 180) |
| Historical fixture deletions | **NONE** (diff shows only `+` fixture_id lines for 162–180) |

Each new fixture asserts behavior (schema/digest/ordering/axes/events/lineage/failures/security/export-only/membership/snapshots/explicit revisions). Failure fixtures use expectation `failure` + code. Not pass-through executors.

**PASS.**

---

## TEST-026

Independently re-run: **10/10 PASS**.

Coverage maps to architecture: package generation; determinism; revision ASC + predecessor; manifest digest seal; OpsError; Persistence NOT_FOUND; security exclusions; export-only; ops_events + axis separation; marker / no second identity-system.

**PASS.**

---

## Regression

Historical TEST-016…025 scripts unmodified. EXEC + this audit reconfirm green. Historical fixture semantics not weakened.

**PASS.**

---

## Conformance

Independently via SMOKE-026 / ReferenceRunner:

| Corpus | Result |
|--------|--------|
| SCI | **44/44** |
| OPS | **180/180** |
| FULL | **224/224** |
| CONF SCI | COMPLIANT |
| CONF OPS (`CONF-001@1.1.0-OPS`) | COMPLIANT |

Additive only. Single ConformanceEngine / CertificationEngine. No fabricated ReferenceReport.

**PASS.**

---

## Engineering Gates

Independently re-verified this audit:

| Gate | Result |
|------|--------|
| typecheck | **PASS** |
| lint | **PASS** |
| build | **PASS** |
| TEST-026 | **10/10 PASS** |
| SMOKE-026 | **PASS** |
| Independent double-export | **IDENTICAL** |

---

## Scope Creep

Searched packaging surface and Sprint 026 diffs for Literature, DocumentArtifact, AI/RAG/KG, PostgreSQL/OpenSearch/Neo4j/Redis/Kafka/vector/cloud durable storage, computational biology, simulation, frontend, REST/GraphQL, generic lifecycle, second graph/journal.

**NONE found.**

---

## Diff Integrity

All changed/untracked files classify as **EXPECTED** Sprint 026 implementation, tests, smoke, documentation, or prior design-chain artifacts. No unexplained unrelated edits.

**PASS.**

---

## Blockers

**0**

---

## Required Patches

**0**

---

## Observations

| ID | Observation | Blocker? |
|----|-------------|----------|
| **O-CA-026-01** | `unit_kind` for Persistence lookup / artifact_entries is resolved via certified identity-prefix grammar (`unitKindFromIdentity`) rather than reading CanonicalUnit envelope after fetch. `unitKindFromEntity` exists but is unused. Aligns with Core ID prefixes and does **not** allocate a second identity system; O-FAR-026-01 preferred envelope-first discipline remains a non-blocking hardening note for future packaging of non-prefix identities. | **NO** |
| **O-CA-026-02** | Non-intact rejection (REF-OPS-170) is asserted through `revisionEntryFromEntity` helper because Persistence refuses non-intact create. Guard is correct; full `packageResearchRun` path is not reachable with a stored non-intact unit under current Persistence integrity rules. | **NO** |
| **O-CA-026-03** | When both session and workspace contribute members, `member_refs` are pooled then inclusion-filtered/sorted without explicit identity dedupe. Decision requires inclusion filter only; duplicate organizational refs are possible if the same member appears in both contexts. | **NO** |

Observations: **3**

---

## Verdict

**APPROVED WITH OBSERVATIONS**

Faithful to SPEC-026 + IMPLEMENTATION-DECISION-026. No scientific authority leakage. No second graph/journal/identity/revision system. Deterministic packaging independently verified. Regression and conformance preserved additively.

---

## Certification Readiness

**READY** for FORMAL-CERTIFICATION-026

(Observations are non-blocking; no required patches before certification.)

---

## Next Gate

**FORMAL-CERTIFICATION-026**

---

*End CODE-AUDIT-026. No source modifications. No commit. No push. No certification performed.*

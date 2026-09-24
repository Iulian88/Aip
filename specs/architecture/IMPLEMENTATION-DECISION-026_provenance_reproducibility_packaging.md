# IMPLEMENTATION-DECISION-026 — Provenance Projection & Reproducibility Packaging

| Field | Value |
|-------|-------|
| Decision ID | IMPLEMENTATION-DECISION-026 |
| Title | Provenance Projection & Reproducibility Packaging — Implementation Contract |
| Version | **0.1.0** |
| Status | **IMPLEMENTATION-READY** (EXEC-026 authorization pending FINAL-ARCHITECTURE-RE-AUDIT-026) |
| Baseline | `8541b20f2fbda7f1035f603bad3248bc10c8601f` |
| SPEC | SPEC-026 (DRAFT — audited) |
| Architecture audit | ARCHITECTURE-AUDIT-026 — **APPROVED WITH OBSERVATIONS** (0 blockers · 0 required patches · 6 observations) |
| Discovery | DISCOVERY-026 — Provenance Projection & Reproducibility Packaging (Phase R2) |
| Mode | Design-only — **NO RUNTIME IMPLEMENTATION** |
| Does not authorize | EXEC-026 coding until FINAL-ARCHITECTURE-RE-AUDIT-026 separately authorizes; certification; commit; push |

---

## Baseline

| Item | Value |
|------|-------|
| Certified HEAD / origin/main | `8541b20f2fbda7f1035f603bad3248bc10c8601f` |
| Sprint 025 | FORMALLY CERTIFIED AND CLOSED — Verification OPS under Model C |
| SCI / OPS / FULL | **44/44 · 161/161 · 205/205** |
| Profiles | SCI `CONF-001@1.0.0` · OPS `CONF-001@1.1.0-OPS` |
| Highest OPS fixture today | `REF-OPS-161` → next free additive id **`REF-OPS-162`** |
| Architecture audit | 0 blockers · 0 required patches · READY FOR IMPLEMENTATION DECISION |

Working tree may contain documentation-only untracked files (DISCOVERY-026, SPEC-026, ARCHITECTURE-AUDIT-026, this decision). Those do not alter the certified runtime baseline.

### Frozen contracts (must not be redesigned)

- Scientific Core SCI-000…006 (including object-local provenance)
- Model C / RevisionHead / CAS
- ENC CanonicalUnit + SER-JSON-001
- Persistence in-memory APIs (including `listRevisions` sort)
- ResearchSession / ResearchWorkspace / ResearchSnapshot / WorkspaceSnapshot shapes
- REF → CONF → CERT single-engine pipeline
- Sprint 015–025 certified OPS unit paths

---

## Input Documents

1. `audits/roadmap/DISCOVERY-026_NEXT_RESEARCH_FRONTIER.md`
2. `specs/architecture/SPEC-026_provenance_reproducibility_packaging.md`
3. `audits/architecture/ARCHITECTURE-AUDIT-026_SPEC-026.md`

Repository evidence inspected: `research-operations.ts` export/lineage APIs; `timeline.ts` snapshots; `ops-error.ts`; `persistence` `listRevisions` / types; ENC/SER; Evidence `source.source_locator`; Verification `artifact_ref`.

---

## Architecture Audit Result

| Metric | Value |
|--------|-------|
| Verdict | APPROVED WITH OBSERVATIONS |
| Blockers | 0 |
| Required patches | 0 |
| Observations | 6 (O-026-01…06) — **ABSORBED** below |
| OQ-026-006/007/008 | IMPLEMENTATION-DECISION ITEMS — **CLOSED** herein |

---

## OQ-026-006 Decision

**CLOSED.**

| Concern | Decision |
|---------|----------|
| Public API | `ResearchOperations.packageResearchRun(input): Promise<PackageResearchRunResult>` |
| Module (class) | `apps/reference-app/src/operations/research-operations.ts` |
| Helper module *(new)* | `apps/reference-app/src/operations/reproducibility-packaging.ts` — pure projection/digest/ordering helpers (non-scientific) |
| Public exports | `apps/reference-app/src/index.ts` — export method types + any pure verify helper if Decision/EXEC adds `verifyReproducibilityPackage` |
| Naming rationale | Matches `export*Unit` family as export/packaging; `packageResearchRun` names packaging concept without implying a persisted ResearchRun entity |
| Forbidden names | `lifecycle`, generic `process`, Persistence-owned exporters, Core factory names |

### Input type *(conceptual — exact TS frozen for EXEC)*

```
PackageResearchRunInput {
  package_id: string;                    // rpkg:…
  included_identities: readonly string[];
  revision_policy: "heads_only" | "explicit_revisions" | "full_lineage";
  packaging_profile: "minimal" | "with_ops_events";
  explicit_revisions?: readonly { identity: string; revision_id: string }[]; // required iff explicit_revisions
  session?: ResearchSession;             // optional organizational context
  workspace?: ResearchWorkspace;         // optional
  generated_at?: string;                 // optional caller UTC seconds; omit in certified minimal fixtures
  include_organizational_context?: boolean; // default false; when true + session/workspace provided, project member_refs
}
```

### Result type

```
PackageResearchRunResult {
  package: ReproducibilityPackage;  // structured object
  ser: string;                      // stableStringify(package) including content_digest
}
```

Optional companion *(same helper module)*:

`verifyReproducibilityPackage(serOrPackage): { ok: true } | throws OpsError` — recomputes digest; does **not** restore Persistence.

Marker: `referenceAppMarker.sprint` → **26**.

---

## OQ-026-007 Decision

**CLOSED — `revision_id` ASCENDING.**

| Concern | Decision |
|---------|----------|
| Revision array order in package | **Ascending by `revision_id` codepoint** |
| Repository precedent | `Persistence.listRevisions` sorts via `compareIdentity(revisionIdOf(a), revisionIdOf(b))` |
| OPS precedent | `get*Lineage` returns `listRevisions` order |
| Scientific lineage semantics | **Unchanged** — carried only by each entry’s `predecessor_revision_id` |
| Forbidden | Treating sort order as predecessor graph; inventing a second lineage graph |

For `full_lineage`: use `listRevisions(identity, unit_kind)` as-is (already sorted).  
For `heads_only` / `explicit_revisions`: still emit selected revisions sorted by `revision_id` ascending within each identity’s entry list; `artifact_entries` sorted by `(identity, revision_id)` per SPEC.

---

## OQ-026-008 Decision

**CLOSED — existing OpsError + unwrapped lower-layer propagation.**

| Concern | Decision |
|---------|----------|
| New error classes | **FORBIDDEN** — no `PackagingError` / `ReproducibilityError` / `ProvenanceError` |
| OPS-owned packaging validation | `OpsError` with code **`INVALID_COMMAND_STATE`** (existing) |
| Persistence failures | Propagate `PersistenceError` **unchanged** |
| ENC failures | Propagate ENC errors **unchanged** |
| SER failures | Propagate SER errors **unchanged** |
| Scientific Core | Packaging MUST NOT invoke Core validators/transitions; no Core errors invented by packaging |

OpsError uses include: invalid `package_id` grammar; empty inclusion set; `explicit_revisions` policy without list; unknown `packaging_profile` / `revision_policy`; digest mismatch on verify; non-intact unit encountered when packaging refuses non-intact.

---

## Observation Absorption (O-026-01…06)

| ID | Disposition | EXEC MUST |
|----|-------------|-----------|
| O-026-01 | **ABSORBED** | `member_refs` when organizational context included: **only members whose `identity` is in `included_identities`** (inclusion-filtered) |
| O-026-02 | **ABSORBED** | TS shapes live in `reproducibility-packaging.ts` + ResearchOperations method as above |
| O-026-03 | **ABSORBED** | Fixtures use synthetic non-sensitive locators only |
| O-026-04 | **ABSORBED** | Lineage order = revision_id ascending (OQ-026-007) |
| O-026-05 | **ABSORBED** | Locator extraction: Evidence → `content.source.source_locator` (from SER/decoded payload path as stored); Verification → `content.artifact_ref` when string non-empty; unique + sort ascending |
| O-026-06 | **ABSORBED** | Digest via `node:crypto` `createHash("sha256").update(utf8).digest("hex")` |

---

## ResearchRun Boundary

| Rule | Decision |
|------|----------|
| Nature | Export-time packaging selection only |
| Persistence entity | **NONE** |
| Core type | **NONE** |
| RevisionHead | **NONE** for ResearchRun |
| Lifetime | Memory-only for duration of `packageResearchRun` call |
| Scientific relationships | Package id MUST NOT be a scientific ref target |

---

## Bundle Ownership

| Concern | Owner |
|---------|-------|
| Bundle generation API | Research Operations |
| Projection / ordering / digest helpers | OPS-local `reproducibility-packaging.ts` |
| Canonical unit bytes | ENC (already in Persistence payload) + SER encode |
| Package container serialization | SER `stableStringify` discipline |
| Scientific meaning | Core (untouched) |
| Stored revisions / journal | Persistence (read-only for packaging) |

Smallest coherent split: OPS orchestration + OPS-local pure helpers; no new package/app.

---

## Export API

See OQ-026-006.

Deterministic behavior: identical inputs → identical `ser`.  
Error behavior: OQ-026-008 matrix.

Does **not** create/update Persistence entities as a side effect of packaging.

---

## Manifest Decisions

Schema: `aip.repro.pack@1.0.0`.

Required fields (minimal profile): `schema_id`, `package_id`, `packaging_profile`, `included_identities`, `revision_policy`, `artifact_entries`, `source_locators` (array, may be empty), `axis_declaration`, `content_digest`.

Optional: `session_id`, `workspace_id`, `member_refs`, `ops_events`, `generated_at`.

`axis_declaration`: fixed labels listing axes present for the profile (SPEC axes 1–7; mark ops/session/workspace as included/excluded boolean map) — exact object shape in helper module; must be deterministic.

`artifact_entries` each contain: `identity`, `unit_kind`, `head_revision_id`, `revisions[]` with `{ revision_id, predecessor_revision_id?, storage_key, intact, ser }`.

---

## Deterministic Ordering

| Collection | Order |
|------------|-------|
| Object keys | Lexicographic (stableStringify) |
| `included_identities` | Ascending codepoint |
| `artifact_entries` | `(identity, then revision_id)` ascending |
| Revisions within entry | **`revision_id` ascending** |
| `ops_events` | `(parent_identity, ordinal, event_id)` — match `projectTimeline` |
| `member_refs` | `(entity_kind, unit_kind\|\|'',' identity)` |
| `source_locators` | Ascending codepoint; unique |

---

## Timestamp Handling

| Timestamp | Behavior |
|-----------|----------|
| Scientific timestamps inside unit SER | Included unchanged |
| Ops event `at` | Included only in `with_ops_events` |
| `generated_at` | OPTIONAL caller-supplied; **omit** in certified minimal fixtures |
| Wall-clock | **FORBIDDEN** on certified paths |

`generated_at`, when present, is inside the digest body (caller-stable). Omitting it is preferred for equality demos.

---

## Bundle Identity

| Concern | Decision |
|---------|----------|
| Identity | Caller-supplied `package_id` matching `^rpkg:[A-Za-z0-9._~-]{1,128}$` |
| Content binding | `content_digest` SHA-256 hex |
| randomUUID / Date.now | **FORBIDDEN** |
| Scientific | **NO** |

---

## Versioning

| Concept | Value |
|---------|-------|
| Packaging schema | `aip.repro.pack@1.0.0` |
| Profiles | `minimal` \| `with_ops_events` |
| CONF | Unchanged `CONF-001@1.1.0-OPS` |
| CERT | Unchanged engines |
| Scientific / Model C revisions | Unchanged by packaging |

---

## Integrity

1. Build package object with `content_digest` omitted.  
2. `bodySer = stableStringify(packageWithoutDigest)`.  
3. `content_digest = sha256_hex(utf8(bodySer))`.  
4. Attach digest; final `ser = stableStringify(fullPackage)`.  
5. Verify: recompute from attached package with digest stripped; compare.

Non-intact CanonicalUnit (`intact !== true`): **OpsError INVALID_COMMAND_STATE** (refuse packaging).

---

## Source Locator Handling

Extract unique strings:

1. From each included EvidenceUnit payload: `envelope.content.source.source_locator` when present/non-empty.  
2. From each included VerificationUnit payload: `envelope.content.artifact_ref` when present/non-empty.  

No fetch. No DocumentArtifact. Sort + unique.

---

## Event Projection

| Profile | Behavior |
|---------|----------|
| `minimal` | `ops_events` absent or empty — certified fixtures assert **absent/empty** |
| `with_ops_events` | `getEvents(parent)` for each included identity; filter/sort; OPERATIONAL only |

No second journal. Events do not redefine scientific provenance.

---

## Snapshot Projection

| Snapshot | Decision |
|----------|----------|
| ResearchSnapshot / WorkspaceSnapshot schemas | **Unchanged** — do not call schema changes |
| Package inclusion | Does **not** embed full snapshots |
| Organizational context | Optional filtered `member_refs` + ids only |
| Authority | Organizational / derived — not scientific |

---

## Security Boundary

MUST NOT appear in certified fixtures or packaging inputs controlled by EXEC tests:

- secrets, tokens, passwords, private keys, env vars, auth headers  
- absolute local filesystem paths  
- URLs with embedded credentials  

Packaging does not redact Core scientific content fields (would mutate AUTHORITATIVE_SCI). Caller/fixture discipline applies.

---

## Conformance Strategy

| Item | Decision |
|------|----------|
| Additive fixtures | `REF-OPS-162+` |
| Themes | Per SPEC-026 proposed themes (minimal package, determinism, digest, axis separation, opt-in events, lineage order, failures, no Relationship, snapshots unchanged, locator projection) |
| Exact count | EXEC determines; themes mandatory |
| Fabricated ReferenceReport | Forbidden |

---

## Profile Decision

**`CONF-001@1.1.0-OPS` is sufficient.**  
No new conformance profile. SCI profile unchanged.

---

## Persistence Decision

**NO Persistence redesign.**  
Read-only use of: `get`, `getHead`, `listRevisions`, `getEvents`.  
No package entity_kind. No durable bundle store. No database.

---

## Error Decision Matrix

| Failure condition | Owning layer | Error type | Propagation |
|-------------------|--------------|------------|-------------|
| Invalid `package_id` / empty inclusion / bad policy | OPS | `OpsError INVALID_COMMAND_STATE` | Throw |
| `explicit_revisions` missing list | OPS | `OpsError INVALID_COMMAND_STATE` | Throw |
| Identity not found | Persistence | `PersistenceError NOT_FOUND` | Unchanged |
| Revision not found | Persistence | `PersistenceError NOT_FOUND` | Unchanged |
| Non-intact unit | OPS (guard) | `OpsError INVALID_COMMAND_STATE` | Throw (do not package) |
| SER failure | SER | SER error | Unchanged |
| Digest mismatch on verify | OPS | `OpsError INVALID_COMMAND_STATE` | Throw |
| Unsupported schema on verify | OPS | `OpsError INVALID_COMMAND_STATE` | Throw |
| Core validation | N/A | — | Packaging does not run Core transitions |

---

## Compatibility

Preserves certified Sprint 015–025 behavior. No Core/Persistence/ENC/SER/CONF/CERT foundation edits. No historical fixture rewrites. Additive OPS fixtures only.

---

## EXEC Scope

When FINAL-ARCHITECTURE-RE-AUDIT-026 authorizes EXEC-026:

- `packageResearchRun` + helpers module
- Deterministic ReproducibilityPackage + digest
- Optional `verifyReproducibilityPackage`
- index exports + marker sprint 26
- Additive REF-OPS-162+
- TEST-026 / SMOKE-026
- IMPLEMENTATION.md update
- EXEC-026 report + SMOKE_026_PASS

---

## EXEC Exclusions

Database; durable bundle storage; import/restore; Literature; DocumentArtifact; AI; KG; computational biology; simulation; frontend; second graph/journal; generic lifecycle; Material VersionService OPS; Claim Standing Core redesign; PROV/RO-Crate Core import; new CONF profile.

---

## EXEC Preconditions

1. FINAL-ARCHITECTURE-RE-AUDIT-026 = EXEC AUTHORIZED  
2. OQ-026-006/007/008 closed (this document)  
3. Observations O-026-01…06 absorbed  
4. No Persistence redesign  
5. Export-only boundary intact  
6. Additive fixtures from REF-OPS-162  

---

## Acceptance Criteria

Match SPEC-026 acceptance criteria 1–22, plus:

- Double-run `packageResearchRun` SER equality  
- Lineage arrays revision_id ascending with predecessor fields preserved  
- Minimal profile has no ops_events  
- OpsError-only for OPS packaging validation; Persistence errors unwrapped  

---

## Final Decision

IMPLEMENTATION-DECISION-026

Status:
IMPLEMENTATION-READY

Blockers:
0

Required patches:
0

OQ-026-006:
CLOSED — `ResearchOperations.packageResearchRun` + `operations/reproducibility-packaging.ts`

OQ-026-007:
CLOSED — revision_id ASCENDING

OQ-026-008:
CLOSED — existing OpsError (`INVALID_COMMAND_STATE`) + lower-layer propagation unchanged

EXEC authorization:
PENDING FINAL ARCHITECTURE RE-AUDIT

Next gate:
FINAL-ARCHITECTURE-RE-AUDIT-026

*End IMPLEMENTATION-DECISION-026.*

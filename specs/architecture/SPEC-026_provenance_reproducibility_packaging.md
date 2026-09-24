# SPEC-026 — Provenance Projection & Reproducibility Packaging

| Field | Value |
|-------|-------|
| **Spec ID** | SPEC-026 |
| **Artifact** | `specs/architecture/SPEC-026_provenance_reproducibility_packaging.md` |
| **Status** | DRAFT — READY FOR ARCHITECTURE AUDIT |
| **Version** | 0.1.0-DRAFT |
| **Baseline commit** | `8541b20f2fbda7f1035f603bad3248bc10c8601f` (Sprint 025 certified + closed) |
| **Depends on** | DISCOVERY-026 · SCI-000…006 · ADR-0006 · ADR-020 / SPEC-020 (Model C) · SPEC-016A…025 · ENC-001 · SER-JSON-001 · CONF-001 · CERT-001 |
| **Implementation authorization** | **NO** |

Normative language: RFC 2119 SHALL / MUST / SHOULD / MAY.  
This SPEC defines **packaging contracts and projections only**. It does **not** invent scientific units, Persistence primitives, ENC/SER replacements, or computational execution semantics.

**Authority notice:** Scientific Core remains the sole scientific authority. A reproducibility package is a **derived, non-authoritative projection**.

---

## Status

**DRAFT — READY FOR ARCHITECTURE AUDIT**

Design-only. No source, test, fixture, runtime API, certification, or prior-sprint documentation changes accompany this SPEC.

Implementation authorization: **NO**.  
Audit readiness: confirmed in §EXEC Preconditions.

---

## Version

`0.1.0-DRAFT`

Bundle schema identity (when implemented): `aip.repro.pack@1.0.0` *(new — Sprint 026 naming; packaging-level only)*.

---

## Baseline

| Item | Value |
|------|-------|
| Sprint | 025 — Verification OPS Under Model C — FORMALLY CERTIFIED AND CLOSED |
| Commit | `8541b20f2fbda7f1035f603bad3248bc10c8601f` |
| HEAD == origin/main | YES (at SPEC writing; Discovery-026 artifact may be untracked) |
| SCI corpus | 44/44 under `CONF-001@1.0.0` |
| OPS corpus | 161/161 (`REF-OPS-001…161`) |
| FULL corpus | 205/205 under `CONF-001@1.1.0-OPS` |
| Highest OPS fixture | `REF-OPS-161` → next free additive id **`REF-OPS-162`** |
| Discovery pin | `audits/roadmap/DISCOVERY-026_NEXT_RESEARCH_FRONTIER.md` — Selected = Provenance Projection & Reproducibility Packaging (Phase R2) |
| Phase R1 | COMPLETE — Claim / Evidence / Grade / Contradiction / Negative Result / Verification OPS under Model C |

---

## Motivation

Phase R1 closed research-semantics OPS for all six SCI units. Object-local scientific provenance, ENC scientific transition logs, Persistence event journal, Model C revision lineage, ResearchSession/Workspace membership, and snapshots **already exist and are architecturally separated**.

What is missing is a **formal packaging/export contract** that:

1. projects those axes into a deterministic, verifiable research-run package;
2. does not conflate scientific provenance with operational audit;
3. does not invent a second scientific authority;
4. prepares a stable attach point for future Literature / DocumentArtifact without implementing them now;
5. advances product reproducibility intent (FR-11 / docs provenance strategy) without claiming computational biology execution reproducibility.

---

## Problem Statement

1. Unit-level SER exports (`exportClaimUnit`, `exportEvidenceUnit`, …) exist but do not define a multi-artifact **research-run package**.
2. `ResearchSnapshot` / `WorkspaceSnapshot` / `projectTimeline` are OPS projections — frozen shapes — but are not a reproducibility packaging profile.
3. Product docs describe reproducibility bundles and PROV-inspired concepts; SciROS has no certified packaging schema binding those docs to Core/Persistence/ENC/SER.
4. Without explicit axis separation in packaging, consumers may treat operational events, membership, or package digests as scientific truth.
5. Without deterministic packaging, double-run equality cannot be certified under REF → CONF → CERT.

**Sprint 026 objective (when authorized):** define and later implement **export-only** Provenance Projection + Reproducibility Packaging as a non-authoritative OPS packaging surface over existing certified authorities.

---

## Goals

1. Define provenance **axes**, owners, and inclusion rules for packaging.
2. Define **ResearchRun** as an export-time packaging concept (not a new scientific entity).
3. Define **packaging reproducibility** distinctly from computational/scientific result reproducibility.
4. Define deterministic bundle identity, schema versioning, manifest, contents, ordering, timestamps, integrity.
5. Preserve Model C, ENC, SER, Persistence, REF → CONF → CERT unchanged in scientific authority.
6. Enable additive `REF-OPS-162+` under existing OPS profile.
7. Provide a future-compatible Literature attach point via source locators / external refs only.
8. Keep export-only for Sprint 026 (verification of package integrity ≠ Persistence restore).

---

## Non-Goals

See §Scope Exclusions and the following explicit non-goals:

- Material content OPS / VersionService wiring
- Claim Standing post-create `qualified_by` / `verified_via` Core redesign
- DocumentArtifact implementation / literature crawlers / full-text ingestion
- Import / restore / Persistence rewrite from package
- Computational biology execution / workflow engines / simulation
- AI / LLM / RAG
- Durable Persistence / databases / object storage / cloud
- Knowledge Graph store / search index
- Generic lifecycle engine
- Second scientific graph or second event journal
- W3C PROV / RO-Crate as Core ontology (optional future *transform* only — out of certified Sprint 026 path)
- Claiming bit-identical computational result reproducibility

---

## Architectural Context

```
Scientific Core          (scientific authority)
        │
ENC assemble             (canonical scientific representation)
        │
Persistence Model C      (infrastructure authority for stored revisions / heads / journal)
        │
SER-JSON                 (serialization authority for canonical units)
        │
Research Operations      (orchestration + non-authoritative projections)
        │
Provenance Projection    (Sprint 026 — derived)
        │
Reproducibility Package  (Sprint 026 — derived packaging artifact)
```

Forbidden:

```
Scientific Core ↔ Reproducibility Package   (bidirectional authority)
Persistence ← restore(Package) as Sprint 026 default path
Package as second journal / second graph / scientific DB
```

Certified subsystems reused as-is: Core, Processor, ENC, SER, Persistence (in-memory), ResearchSession, ResearchWorkspace, Model C, RevisionHead, CAS, unit exports, membership, snapshots, timeline, REF → CONF → CERT.

---

## Authority Model

| Layer | Authority |
|-------|-----------|
| Scientific meaning, validation, transitions | **Scientific Core** |
| Canonical scientific bytes/envelope | **ENC** |
| Serialization of canonical units | **SER** |
| Stored revisions, heads, event journal | **Persistence** (infrastructure) |
| Orchestration, membership, snapshots, packaging | **Research Operations** (non-scientific) |
| Reproducibility Package | **DERIVED projection** — never scientific authority |

### Authority classification vocabulary (packaging)

| Class | Meaning |
|-------|---------|
| `AUTHORITATIVE_SCI` | Core/ENC scientific content projected from intact CanonicalUnits |
| `AUTHORITATIVE_PERSIST` | Persistence revision metadata (revision_id, predecessor, head pointer, storage_key) |
| `OPERATIONAL` | Persistence event journal / timeline-derived records |
| `ORGANIZATIONAL` | Session/workspace membership projections |
| `DESCRIPTIVE` | Packaging schema labels, human-readable section titles |
| `INTEGRITY_METADATA` | Digests / intact flags computed over deterministic content |
| `EXTERNAL_REFERENCE` | Source locators / URIs / DOIs — pointers, not content |
| `CALLER_SUPPLIED` | Packaging ids, inclusion lists, optional descriptive timestamps |

---

## Provenance Axes

| # | Axis | Owner | Authority | Scientific? | Operational? | Persisted? | Projected into package? | Affects packaging determinism? |
|---|------|-------|-----------|-------------|--------------|------------|-------------------------|--------------------------------|
| 1 | **Scientific provenance** | Core object `provenance` fields + scientific transition events in ENC envelope | Core / ENC | YES | NO | Via CanonicalUnit payload | **YES** (as part of included CanonicalUnit payloads) | YES |
| 2 | **Operational audit history** | Persistence event journal (`ops.*` and other PersistenceEvents) | Persistence (infra) | NO | YES | YES | **OPT-IN** (default OFF for minimal certified package) | YES when included |
| 3 | **Source locator** | Evidence `source` / `source_locator` / `source_class`; Verification `artifact_ref` | Core content fields | Locator is scientific *field*; target content is external | NO | Via unit payload | **YES** (string projection; no fetch) | YES |
| 4 | **Persistence history** | Immutable CanonicalUnit revision rows | Persistence | Payload scientific; row metadata infra | Infra | YES | **YES** for included revisions | YES |
| 5 | **Revision lineage** | `revision_id` + `predecessor_revision_id` + RevisionHead | Persistence Model C | Identity scientific; revision ids packaging/persist metadata | Infra | YES | **YES** | YES |
| 6 | **ResearchSession context** | `ResearchSession` (memory) | OPS organizational | NO | Organizational | NO (session not persisted) | **YES** as DESCRIPTIVE/ORGANIZATIONAL ids + member refs when packaging from a session | YES (caller-stable ids) |
| 7 | **ResearchWorkspace context** | `ResearchWorkspace` (memory) | OPS organizational | NO | Organizational | NO | **OPTIONAL** when packaging from a workspace | YES |

**Conflation forbidden:** Packaging consumers MUST NOT treat axis 2, 6, or 7 as scientific provenance (axis 1). Digests (INTEGRITY_METADATA) MUST NOT be treated as scientific grades or Standing.

---

## Research Run Semantics

### Decision (CLOSED)

**ResearchRun is an export-time packaging concept (option D), not a scientific entity and not a persisted OPS entity.**

| Option | Verdict |
|--------|---------|
| A. New scientific entity | **REJECTED** — would create scientific authority outside Core |
| B. New persisted OPS entity | **REJECTED** — unnecessary Persistence kind; session/workspace already organizational |
| C. Derived projection | **PARTIAL** — the *package* is derived; the *run* is the packaging selection |
| D. Export-time concept | **SELECTED** |
| E. Other | N/A |

### Definitions

**ResearchRun (packaging concept):** A caller-defined inclusion set of scientific identities (and optional revision selection policy) plus optional session/workspace context, used as input to packaging.

**ReproducibilityPackage (artifact):** The deterministic derived packaging object produced from authoritative Persistence/ENC/SER inputs for a ResearchRun selection at packaging time.

**ResearchSession ≠ ResearchRun:** Sessions are live organizational contexts. A package MAY cite a session id for organizational context but does not equal the session and does not persist the session.

**ResearchWorkspace ≠ ResearchRun:** Same rule.

No `ResearchRun` Persistence kind. No Core `ResearchRun` type. No scientific relationships whose target is a package id.

---

## Reproducibility Definition

| Kind | Definition | Sprint 026 claim? |
|------|------------|-------------------|
| **A. Artifact reproducibility** | Same persisted CanonicalUnit revision exports identically via existing SER | YES (reuse) |
| **B. Projection reproducibility** | Same packaging inputs → same Provenance Projection sections | YES |
| **C. Bundle reproducibility** | Same packaging profile + inputs → byte-identical package SER (excluding forbidden wall-clock fields) | YES — **primary claim** |
| **D. Scientific / computational result reproducibility** | Re-running analyses yields congruent scientific outputs | **NO** — not claimed |

**PACKAGING REPRODUCIBILITY** (this sprint) ≠ **COMPUTATIONAL REPRODUCIBILITY** (future analysis plane).

A package proves: *what was selected and how it was projected from authoritative stores at packaging time*, not that a biology pipeline was re-executed.

---

## Bundle Concept

Name: **ReproducibilityPackage** *(packaging-level)*.

Schema id: `aip.repro.pack@1.0.0`.

Nature: immutable derived JSON-serializable object (via SER stable stringify rules), produced by OPS packaging API.

Directionality: **EXPORT ONLY** in Sprint 026.

Verification of a package: structural validation + integrity digest match over deterministic content. Verification ≠ scientific re-validation of Core rules (Core already validated before persist). Verification ≠ Persistence restore.

---

## Bundle Identity

### Decision (CLOSED)

| Concern | Decision |
|---------|----------|
| Needs identity? | **YES** — packaging-level only |
| Grammar | Caller-supplied `package_id` matching `^rpkg:[A-Za-z0-9._~-]{1,128}$` *(new)* |
| Scientific? | **NO** — MUST NOT appear as Core scientific identity |
| Relationships | MUST NOT be target of scientific refs |
| Determinism | Caller-supplied; no `randomUUID`, no `Date.now` |
| Content binding | Separate `content_digest` (INTEGRITY_METADATA) over deterministic package body |

Identity is **not** content-hash-as-id (avoids circularity). Digest certifies content; `package_id` names the packaging act/selection under caller control (same pattern as `research_session_id`, `event_id`).

---

## Bundle Versioning

| Version concept | Owner | Notes |
|-----------------|-------|-------|
| `schema_id` / packaging schema | This SPEC | `aip.repro.pack@1.0.0` |
| AIP / SciROS package versions | monorepo package.json / markers | DESCRIPTIVE when included |
| Scientific artifact SemVer / content_version | Core / ENC | AUTHORITATIVE_SCI — unchanged by packaging |
| Model C `revision_id` | Persistence | AUTHORITATIVE_PERSIST — unchanged by packaging |
| SER profile | SER-JSON-001 | Unchanged |
| CONF / CERT profiles | Conformance / Certification | Unchanged; OPS profile reused |

**Principle:** Packaging schema evolution MUST NOT mutate scientific identity or Model C revision identity. A new packaging schema version produces a new package representation, not new scientific revisions.

---

## Manifest

### Decision (CLOSED)

A **manifest** is REQUIRED as the package root object.

Conceptual fields (normative categories; exact TypeScript shapes deferred to IMPLEMENTATION-DECISION):

| Field | Class | Required | Notes |
|-------|-------|----------|-------|
| `schema_id` | DESCRIPTIVE | YES | `aip.repro.pack@1.0.0` |
| `package_id` | CALLER_SUPPLIED | YES | `rpkg:…` |
| `packaging_profile` | DESCRIPTIVE | YES | e.g. `minimal` \| `with_ops_events` |
| `included_identities` | CALLER_SUPPLIED | YES | Sorted list of scientific identities |
| `revision_policy` | CALLER_SUPPLIED | YES | `heads_only` \| `explicit_revisions` \| `full_lineage` |
| `session_id` | ORGANIZATIONAL | OPTIONAL | ResearchSession id if packaging in session context |
| `workspace_id` | ORGANIZATIONAL | OPTIONAL | ResearchWorkspace id if applicable |
| `artifact_entries` | mixed | YES | Per included identity: unit_kind, revisions, heads, SER projections |
| `ops_events` | OPERATIONAL | OPTIONAL | Only if profile requests |
| `member_refs` | ORGANIZATIONAL | OPTIONAL | Session/workspace members relevant to inclusion |
| `source_locators` | EXTERNAL_REFERENCE | YES (may be empty array) | Extracted locator strings from included units |
| `axis_declaration` | DESCRIPTIVE | YES | Explicit axis labels present in package |
| `content_digest` | INTEGRITY_METADATA | YES | Digest of deterministic body excluding the digest field itself |
| `generated_at` | CALLER_SUPPLIED DESCRIPTIVE | OPTIONAL | If present MUST be caller-supplied UTC seconds; MUST NOT use wall-clock indoors |

Manifest MUST be deterministically ordered (see Deterministic Ordering).

---

## Bundle Contents

### Included by default (`packaging_profile = minimal`)

1. Manifest metadata (`schema_id`, `package_id`, profile, policies, axis_declaration)
2. For each included scientific identity:
   - `unit_kind`
   - RevisionHead pointer (current)
   - Selected CanonicalUnit revision(s) per `revision_policy`
   - For each selected revision: `revision_id`, optional `predecessor_revision_id`, `storage_key`, `intact`, SER-JSON string of CanonicalUnit payload (existing encoder)
3. Source locator projections extracted from included payloads (strings only)
4. `content_digest`

### Opt-in (`packaging_profile = with_ops_events`)

5. Persistence events whose `parent_identity` is in the inclusion set (OPERATIONAL), deterministically ordered

### Optional organizational context

6. Session and/or workspace ids + member_refs (ORGANIZATIONAL) when caller requests session/workspace packaging context

### Explicitly NOT included (Sprint 026)

| Item | Why omitted |
|------|-------------|
| Full PersistenceSnapshot of entire store | Over-broad; may leak unrelated identities |
| Secrets / env vars / credentials | Security |
| Node/OS/CPU/locale/timezone | Unstable diagnostic; not packaging-determinism inputs |
| Live DocumentArtifact / fetched source bytes | Literature out of scope |
| Conformance/Certification report blobs | External references MAY be listed later; not required for packaging reproducibility of scientific artifacts |
| Git commit / working tree | DESCRIPTIVE optional future; not required for in-memory Persistence packaging equality |
| Computational workflows / datasets / pipelines | No execution model |
| `Persistence.Relationship` rows | Not scientific authority; unused |

### Revision policy semantics

| Policy | Meaning |
|--------|---------|
| `heads_only` | Include only RevisionHead-resolved current revision per identity |
| `explicit_revisions` | Caller supplies `(identity, revision_id)[]` |
| `full_lineage` | Include all revisions returned by `listRevisions` for each identity, ordered |

---

## Authority Classification

Every package section SHALL carry an implicit class from §Authority Model.  
CERTIFIED fixtures MUST assert:

- CanonicalUnit payload sections are not reinterpreted by packaging;
- `ops_events` are OPERATIONAL;
- `member_refs` are ORGANIZATIONAL;
- `content_digest` is INTEGRITY_METADATA only;
- `source_locators` are EXTERNAL_REFERENCE strings.

---

## Deterministic Ordering

Normative ordering (codepoint / specified key order):

1. Manifest object keys: lexicographic by key name (same discipline as SER `stableStringify`).
2. `included_identities`: ascending codepoint.
3. `artifact_entries`: ascending by `identity`, then by `revision_id`.
4. Lineage lists: ascending by `revision_id` (consistent with existing OPS lineage sorting discipline) unless IMPLEMENTATION-DECISION pins predecessor-walk order — **MUST be one rule, fixed in Decision**.
5. `ops_events` (when present): by `(parent_identity, ordinal, event_id)` — same as `projectTimeline` comparator.
6. `member_refs`: by `(entity_kind, unit_kind|'', identity)`.
7. `source_locators`: ascending codepoint of locator string, unique.
8. Arrays MUST NOT rely on insertion-order accidents; packaging SHALL sort before encode.

SER for each CanonicalUnit payload: existing `JsonEncoder` / `stableStringify` (SER-JSON-001) — **no second serializer**.

---

## Timestamp Policy

| Timestamp kind | Source | In deterministic digest body? |
|----------------|--------|-------------------------------|
| Scientific timestamps inside Core content (`created_at`, provenance `recorded_at`, VTE `at`, …) | Authoritative inputs | YES — already in CanonicalUnit payloads |
| Persistence event `at` | Operational journal | YES when ops_events included |
| Bundle `generated_at` | Caller-supplied OPTIONAL | If present, YES (caller-stable); if omitted, preferred for minimal profile |
| Wall-clock at export | Forbidden | MUST NOT |

**Rule:** Packaging MUST NOT call `Date.now()`, `new Date()`, or `randomUUID()` on certified paths.

---

## Environment Metadata

| Metadata | Classification | Sprint 026 |
|----------|----------------|------------|
| Node version / OS / CPU / locale / timezone | DIAGNOSTIC | **EXCLUDED** from certified package |
| Dependency lock hashes | REPRODUCTION-RELEVANT for *computational* re-runs | **EXCLUDED** (no compute plane) |
| Git commit | DESCRIPTIVE | **EXCLUDED** from minimal certified package (MAY be future optional descriptive field under separate profile) |
| Packaging schema id | Required | INCLUDED |

Environment instability MUST NOT break packaging equality for identical Persistence contents.

---

## Source Locator Boundary

| Concept | Definition |
|---------|------------|
| **Source locator** | Opaque or structured string already present in Core Evidence/Verification fields (e.g. URL, DOI-like string, `artifact_ref`) |
| **Source content** | Bytes/full text of external documents — **out of scope** |

Packaging projects locator strings only (EXTERNAL_REFERENCE).  
No network fetch. No PDF store. No DocumentArtifact type.

Future DocumentArtifact MAY be referenced by identity string in a later schema version without changing scientific authority.

---

## Literature Boundary

Sprint 026 is **not** Literature implementation.

Future attach points (non-normative forward compatibility):

1. Locators already in package `source_locators`.
2. Future optional section `document_refs: [{ document_id, locator }]` under a later schema — DocumentArtifact remains non-authoritative input feeding Evidence.
3. Packaging schema version bump — not scientific revision.

No crawler, no full-text, no systematic-review automation.

---

## Revision Lineage

Model C unchanged:

- Keys: `persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}`
- Heads: `persist:RevisionHead:{unit_kind}:{identity}`
- `predecessor_revision_id` preserved in package entries
- Package MUST NOT invent alternate revision graphs
- Persistence remains authoritative for stored revision state

Packaging reads heads/revisions; it does not `advanceHead` or create revisions as part of packaging.

---

## Event History

| Event class | In package? |
|-------------|-------------|
| Scientific transition events inside ENC envelope | YES — already inside CanonicalUnit payload |
| Persistence operational events (`ops.*`) | OPT-IN profile only |

Operational events MUST NOT redefine scientific relationships or Standing/Record State.  
No second journal. Packaging copies selected journal rows into the package projection.

---

## Snapshot Relationship

| Snapshot | Relationship to package |
|----------|-------------------------|
| `ResearchSnapshot` | Frozen; MUST NOT change shape. Packaging MAY use session member_refs + Persistence reads independently |
| `WorkspaceSnapshot` | Additive frozen contract; MUST NOT change shape |
| `PersistenceSnapshot` | Infrastructure complete-store snapshot; package MUST NOT require dumping entire store |

Prefer packaging projection over modifying snapshot contracts.  
**Decision:** Sprint 026 does **not** alter ResearchSnapshot / WorkspaceSnapshot schemas.

---

## ENC / SER Integration

| Concern | Rule |
|---------|------|
| Canonical scientific representation | ENC CanonicalUnit payloads already stored |
| Unit serialization inside package | Existing `JsonEncoder.encode` / SER-JSON-001 |
| Package serialization | SER `stableStringify` discipline over packaging object (same stable key sort) — packaging layer **above** SER, not competing ENC |
| New encoder for science? | **FORBIDDEN** |

ENC remains authoritative for scientific canonical integrity (`intact`).  
SER remains authoritative for unit JSON form.

---

## Integrity Model

| Mechanism | Role |
|-----------|------|
| ENC `intact: true` on included units | Projection integrity expectation |
| Per-revision SER string equality | Artifact reproducibility |
| Package `content_digest` | INTEGRITY_METADATA over deterministic package body |

**Digest algorithm (CLOSED for EXEC):** SHA-256 hex digest of UTF-8 bytes of the deterministic package serialization **with `content_digest` field omitted/blank during hashing**.  
Digest is not a scientific grade, Standing, or Verification outcome.

No additional PKI / signatures required in Sprint 026.

---

## Export / Import Boundary

### Decision (CLOSED)

**EXPORT ONLY** for Sprint 026.

| Mode | Status |
|------|--------|
| Export package | IN SCOPE |
| Verify package structure + digest | IN SCOPE |
| Import / restore into Persistence | **OUT OF SCOPE** |
| Destructive overwrite from package | **FORBIDDEN** |

Rationale: Persistence already has `snapshot()` / `restore()` for infrastructure complete-state; packaging reproducibility does not require a second restore channel. A package can be verified as a projection without being authoritative input to Persistence.

Future import would need a separate SPEC with explicit trust boundaries.

---

## Failure Model

| Failure | Class | Typical cause |
|---------|-------|---------------|
| Unknown / missing identity | operational / validation | Inclusion set not in Persistence |
| Missing revision | operational | Explicit revision not found |
| Broken predecessor chain | integrity / validation | Orphan lineage under `full_lineage` expectations |
| Non-intact CanonicalUnit | integrity | `intact !== true` |
| SER mismatch / unstable ordering | integrity / determinism | Implementation bug |
| Digest mismatch | integrity | Tamper or nondeterminism |
| Unsupported `schema_id` | validation | Future/unknown package |
| Invalid `package_id` grammar | validation | Caller error |
| OpsError / PersistenceError propagation | operational | Existing codes unchanged |
| Scientific Core validation errors | scientific | MUST NOT be invented by packaging; packaging does not re-run Core transitions |

Packaging MUST NOT collapse these into a single generic error type without codes. Exact OPS error code set pinned in IMPLEMENTATION-DECISION (MAY reuse `OpsError` with packaging-specific messages or a narrow packaging error enum — **MUST CLOSE in Decision**, not left to EXEC improvisation).

---

## Security / Sensitivity

| Rule | Norm |
|------|------|
| Secrets / credentials / API keys / private keys | MUST NOT appear |
| Environment variables | MUST NOT appear |
| Absolute local filesystem paths | MUST NOT appear in certified fixtures |
| Private URLs with embedded credentials | MUST NOT appear |
| Redaction subsystem | NOT REQUIRED as a product privacy framework; exclusion rules above suffice |

Caller-supplied locators in scientific content remain caller responsibility; packaging does not strip Core content (would mutate AUTHORITATIVE_SCI). Fixtures MUST use non-sensitive synthetic locators.

---

## Determinism Contract

```
Same Persistence contents for inclusion set
+ Same packaging_profile / schema_id / revision_policy
+ Same caller-supplied package_id / optional generated_at / optional context ids
+ Same SER implementation
=
Same package SER bytes (including content_digest)
```

Forbidden on certified paths: `Date.now`, `Math.random`, `randomUUID`, unspecified map iteration, unstable locale sorting.

Double-run packaging equality is a required acceptance test.

---

## REF → CONF → CERT Integration

| Concern | Decision |
|---------|----------|
| New CertificationEngine? | **NO** |
| New ConformanceEngine? | **NO** |
| SCI profile change? | **NO** — packaging is OPS |
| OPS profile | Existing `CONF-001@1.1.0-OPS` on FULL |
| Fixtures | Additive `REF-OPS-162+` only |
| Evidence path | ReferenceRunner → ReferenceReport → ConformanceEngine(OPS) → CertificationEngine |

Proposed fixture themes (not implemented now): successful minimal package; ordering determinism double-run; digest stability; axis separation assertions; opt-in ops_events; missing identity failure; heads_only vs lineage; no Relationship rows created; snapshots unchanged; forbidden wall-clock absence.

---

## Persistence Impact

### Decision (CLOSED)

**NO Persistence redesign.**

Packaging uses existing: `get`, `getHead`, `listRevisions`, `getEvents`, `snapshot` (optional read), create paths unchanged.

No database adapter. No new entity_kind for packages. Packages are not Persistence entities.

---

## Research Operations Impact

### Decision (CLOSED)

Ownership: **Research Operations packaging surface** (smallest coherent model).

Conceptual API *(new — names finalizable in IMPLEMENTATION-DECISION)*:

- `packageResearchRun(input) → { package, ser }`  
  where `input` includes `package_id`, inclusion set, `revision_policy`, `packaging_profile`, optional session/workspace context, optional caller `generated_at`.

Implementation MAY place pure projection helpers under `apps/reference-app/src/views/` or `operations/` — Decision pins paths.  
MUST NOT create a second scientific service package outside OPS orchestration.

Marker sprint bump to 26 when EXEC authorized.

---

## Future Computational Biology Compatibility

Future analysis artifacts (datasets, workflows, parameters, results) MAY appear as:

- Evidence/Claim content recorded under Core, or
- later packaging schema sections for non-authoritative computational descriptors

Sprint 026 package architecture remains valid if computational artifacts are first recorded as Core/Persistence units and then included by identity.  
No workflow engine is introduced now.

---

## Future AI Compatibility

AI MAY later consume packages for context reconstruction, tracing, and proposal drafting.

AI MUST NOT:

- own provenance;
- mutate packages as scientific truth;
- bypass Evidence / Core / CONF / CERT;
- auto-elevate Standing or Record State.

No AI implementation in Sprint 026.

---

## Migration / Compatibility

| Prior sprint | Compatibility rule |
|--------------|-------------------|
| 015 Persistence | Unchanged; package reads only |
| 016–018 OPS session/workspace/snapshots | Frozen shapes preserved |
| 019–025 unit OPS | Unchanged create/transition semantics |
| Model C | Unchanged |
| ENC / SER | Unchanged |
| Historical REF-OPS-001…161 / SCI | Unchanged |
| CERT_015…025 artifacts | Unchanged |

Existing scientific identities and revisions remain valid. Packaging adds export capability only.

---

## Scope Exclusions

MUST NOT introduce in Sprint 026:

PostgreSQL, Redis, Kafka, Neo4j, OpenSearch, vector DBs, cloud/object storage, Kubernetes, distributed systems, multi-user concurrency, Literature crawler, DocumentArtifact implementation, full-text ingestion, AI/LLM/RAG, computational biology execution, workflow engines, simulation, frontend, new REST/GraphQL surface, generic lifecycle abstraction, second scientific graph, second event journal, PROV-as-Core, package→Persistence restore, Material VersionService OPS.

---

## Open Questions

| ID | Question | Classification | Resolution in this SPEC |
|----|----------|----------------|-------------------------|
| OQ-026-001 | Package shape (run vs session vs workspace) | MUST CLOSE BEFORE EXEC | **CLOSED** — export-time ResearchRun packaging concept; optional session/workspace context fields |
| OQ-026-002 | Ops events default | MUST CLOSE BEFORE EXEC | **CLOSED** — default OFF (`minimal`); opt-in `with_ops_events` |
| OQ-026-003 | PROV/RO-Crate transforms | OUT OF SCOPE | **CLOSED** — not in Sprint 026 certified path |
| OQ-026-004 | Material OPS sequencing | CAN REMAIN OPEN | Deferred to DISCOVERY-027 |
| OQ-026-005 | Claim Standing post-create refs | OUT OF SCOPE | Deferred to SCI-001 discovery |
| OQ-026-006 | Exact OPS method name / module path | MUST CLOSE BEFORE EXEC | **OPEN → IMPLEMENTATION-DECISION-026** (API naming only; semantics closed here) |
| OQ-026-007 | Lineage list order (revision_id sort vs predecessor walk) | MUST CLOSE BEFORE EXEC | **OPEN → IMPLEMENTATION-DECISION-026** (must pick one; both valid) |
| OQ-026-008 | Packaging error code taxonomy | MUST CLOSE BEFORE EXEC | **OPEN → IMPLEMENTATION-DECISION-026** (OpsError reuse vs narrow enum) |
| OQ-026-009 | Whether `generated_at` allowed in minimal profile | MUST CLOSE BEFORE EXEC | **CLOSED** — OPTIONAL caller-supplied; omitted preferred in certified minimal fixtures |
| OQ-026-010 | Import/restore | MUST CLOSE BEFORE EXEC | **CLOSED** — export-only |
| OQ-026-011 | Digest algorithm | MUST CLOSE BEFORE EXEC | **CLOSED** — SHA-256 hex over UTF-8 stable SER without digest field |
| OQ-026-012 | Bundle identity grammar | MUST CLOSE BEFORE EXEC | **CLOSED** — caller `rpkg:…` |

**EXEC-blocking remaining after SPEC:** OQ-026-006, OQ-026-007, OQ-026-008 — naming/ordering/error taxonomy only; **no unresolved scientific authority, ResearchRun ontology, determinism, or ownership ambiguity**. These MUST be closed by IMPLEMENTATION-DECISION-026 before EXEC.

---

## EXEC Preconditions

EXEC-026 MAY proceed only when:

1. ARCHITECTURE-AUDIT-026 passed (0 blockers / 0 required patches or absorbed observations).
2. IMPLEMENTATION-DECISION-026 completed and closes OQ-026-006/007/008.
3. FINAL-ARCHITECTURE-RE-AUDIT-026 authorizes EXEC.
4. No Persistence redesign introduced.
5. No scientific Core/ENC/SER semantic changes required.
6. Export-only boundary unchanged.
7. Determinism contract unchanged.
8. Authority model unchanged (package remains derived).
9. Additive fixtures start at REF-OPS-162.
10. No DocumentArtifact / AI / durable infra / Material OPS conflation.

---

## Acceptance Criteria

Future implementation MUST demonstrate:

1. No new scientific authority.  
2. No second scientific graph.  
3. No second event journal.  
4. No modification of certified Model C semantics.  
5. Existing scientific artifacts remain valid.  
6. Existing ENC remains authoritative.  
7. Existing SER remains authoritative.  
8. Provenance axes remain explicitly separated in package/axis_declaration.  
9. Bundle projection is deterministic (double-run equality).  
10. Bundle contents match this SPEC’s inclusion rules.  
11. Bundle integrity verifiable via `content_digest`.  
12. Scientific revisions preserved exactly in projections.  
13. Operational history not confused with scientific provenance (default profile excludes ops events).  
14. Source locators not confused with source content.  
15. Literature outside implementation scope.  
16. Computational reproducibility not claimed.  
17. AI remains non-authoritative / unimplemented.  
18. REF → CONF → CERT remains sole formal validation pipeline.  
19. Historical Sprint 015–025 behavior intact.  
20. No durable infrastructure required.  
21. ResearchSnapshot / WorkspaceSnapshot schemas unchanged.  
22. No `randomUUID` / `Date.now` / `Math.random` on certified packaging paths.

---

## Proposed Reference Fixtures

Additive range: **`REF-OPS-162+`** (exact count is EXEC; themes mandatory):

| Theme | Expectation |
|-------|-------------|
| Minimal package over Claim+Evidence heads | success; schema_id; digest present |
| Double-run identical SER | success |
| Digests match | success |
| Axis declaration present; ops_events absent in minimal | success |
| `with_ops_events` includes only selected parents | success |
| `full_lineage` includes predecessor chain | success |
| Missing identity → structured failure | failure |
| Invalid package_id grammar → failure | failure |
| Non-intact rejection if forced | failure |
| No Persistence.Relationship created | success |
| ResearchSnapshot shape unchanged after packaging | success |
| Source locator projection without fetch | success |
| Forbidden nondeterminism absent | success |

No SCI fixture edits. No fabricated ReferenceReport.

---

## Proposed Test Matrix

| Suite | Focus |
|-------|-------|
| TEST-026 | packageResearchRun happy path; determinism; digest; axis separation; opt-in events; failures |
| SMOKE-026 | End-to-end package + corpus CONF |
| Regression TEST-016…025 | Unchanged PASS |
| typecheck / lint / build | PASS |

---

## Decision Summary

| Decision | Choice |
|----------|--------|
| Frontier | Provenance Projection & Reproducibility Packaging (Phase R2) |
| ResearchRun | Export-time packaging concept — not scientific, not persisted |
| Reproducibility claim | Packaging reproducibility only |
| Bundle | Derived ReproducibilityPackage `aip.repro.pack@1.0.0` |
| Identity | Caller `rpkg:…` + content digest |
| Events | Opt-in; default minimal excludes Persistence ops events |
| Snapshots | Unchanged |
| ENC/SER | Reused; no second encoder |
| Persistence | No redesign |
| Ownership | Research Operations packaging surface |
| Import/restore | Out of scope |
| Literature / DocumentArtifact | Out of scope; locator attach point only |
| Profile | Additive OPS fixtures; SCI unchanged |
| Remaining before EXEC | Decision closes API name, lineage sort rule, error codes |

---

## Internal Consistency Check

| Check | Result |
|-------|--------|
| Aligns with DISCOVERY-026 selection | YES |
| No new Core scientific unit | YES |
| No second graph/journal | YES |
| Model C preserved | YES |
| Export-only clear | YES |
| Determinism/timestamps closed | YES |
| Authority classes explicit | YES |
| EXEC-blocking scientific questions | **0** |
| EXEC-blocking Decision-level questions | **3** (006/007/008) |

*End SPEC-026.*

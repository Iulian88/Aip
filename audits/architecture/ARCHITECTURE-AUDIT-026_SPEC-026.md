# ARCHITECTURE-AUDIT-026

| Field | Value |
|-------|-------|
| Audit ID | ARCHITECTURE-AUDIT-026 |
| Subject | `specs/architecture/SPEC-026_provenance_reproducibility_packaging.md` |
| Spec status at audit | DRAFT — READY FOR ARCHITECTURE AUDIT |
| Baseline | `8541b20f2fbda7f1035f603bad3248bc10c8601f` (Sprint 025 certified + closed) |
| Mode | **READ-ONLY** |
| Discovery | `audits/roadmap/DISCOVERY-026_NEXT_RESEARCH_FRONTIER.md` |
| Does not authorize | EXEC, source/test changes, SPEC patches, certification, commit, push |

**Classification legend:** BLOCKER | REQUIRED PATCH | OBSERVATION | DEFERRED | NOT APPLICABLE | IMPLEMENTATION-DECISION ITEM

**Primary question:** Does SPEC-026 define a coherent Provenance Projection → Reproducibility Packaging architecture over certified Phase R1 authorities without creating a second scientific authority, graph, journal, revision model, or premature Literature/durable/AI scope?

**Answer: YES** — with non-blocking observations only. Remaining open items are Implementation-Decision closures, not architecture blockers.

---

## Baseline

| Check | Result |
|-------|--------|
| `git rev-parse HEAD` | `8541b20f2fbda7f1035f603bad3248bc10c8601f` |
| Certified commit | `cert(sprint-025): certify Verification OPS under Model C` |
| Sprint 025 | FORMALLY CLOSED |
| Working tree | Docs-only untracked: DISCOVERY-026, SPEC-026 (+ this audit after write) |
| Unexpected source / test / cert modifications | **NONE** |

### Current Certified State

| Corpus | SPEC claim | Repository evidence | Verdict |
|--------|------------|---------------------|---------|
| SCI | 44/44 | CERT_025_PASS / fixtures | **Verified** |
| OPS | 161/161 | `REF-OPS-001…161` | **Verified** |
| FULL | 205/205 | SCI ∪ OPS | **Verified** |
| Profiles | `CONF-001@1.0.0`, `CONF-001@1.1.0-OPS` | `packages/conformance` | **Verified** |
| Next free OPS id | `REF-OPS-162` | no `REF-OPS-162+` | **Verified** |
| Phase R1 | Complete (six units + Grade OPS) | Sprint 020–025 certification | **Verified** |

---

## Inputs Reviewed

| Artifact | Role |
|----------|------|
| `specs/architecture/SPEC-026_provenance_reproducibility_packaging.md` | Subject |
| `audits/roadmap/DISCOVERY-026_NEXT_RESEARCH_FRONTIER.md` | Discovery input |
| `apps/reference-app/src/operations/research-operations.ts` | OPS exports / lineage |
| `apps/reference-app/src/views/timeline.ts` | ResearchSnapshot / WorkspaceSnapshot / timeline |
| `apps/reference-app/src/errors/ops-error.ts` | OpsError taxonomy |
| `packages/persistence/src/{types,repository,memory/store}.ts` | Model C, listRevisions sort, journal, PersistenceSnapshot |
| `packages/encoding/src/**` | CanonicalUnit / intact |
| `packages/serialization/src/json/encoder.ts` | JsonEncoder / stableStringify |
| `packages/core/src/**` (provenance fields, units) | Scientific provenance owners |
| `packages/conformance`, `packages/certification`, `packages/reference-tests` | REF → CONF → CERT |

---

## Authority Audit

| Concern | SPEC | Repository | Verdict |
|---------|------|------------|---------|
| Sole scientific authority = Core | Explicit | Unchanged at HEAD | **PASS** |
| Persistence = infrastructure | Explicit; no redesign | In-memory Model C | **PASS** |
| ENC = canonical scientific encoding | Reuse; no second encoder | ENC-001 | **PASS** |
| SER = serialization | Reuse JsonEncoder / stableStringify | SER-JSON-001 | **PASS** |
| OPS = orchestration / packaging | Packaging surface owned by OPS | Matches existing projection pattern | **PASS** |
| Bundle = derived / non-authoritative | Explicit forbidden Core↔Package | — | **PASS** |
| Bundle not authority over units / relations / revisions | Explicit classes + fixtures themes | — | **PASS** |

No section audited promotes the package to scientific authority. Digests classified as `INTEGRITY_METADATA` only.

**PASS.**

---

## ResearchRun Audit

| Check | Result |
|-------|--------|
| ResearchRun = export-time concept (option D) | **CLOSED correctly** |
| No ResearchRun Persistence kind | Required / consistent |
| No Core ResearchRun type | Required / consistent |
| No second session/workspace model | Session/workspace optional context only |
| No second event journal | Events opt-in projection only |
| Sufficient for packaging? | **YES** — inclusion set + revision_policy + profile |

ResearchSession ≠ ResearchRun and ResearchWorkspace ≠ ResearchRun are correctly enforced.

**PASS** — architecture complete for Sprint 026.

---

## Provenance Axes Audit

| Axis | Owner clear? | Inclusion clear? | Conflation risk |
|------|--------------|------------------|-----------------|
| 1 Scientific provenance | YES (Core/ENC) | Via CanonicalUnit payloads | Controlled |
| 2 Operational audit | YES (Persistence journal) | Opt-in; default OFF | Controlled |
| 3 Source locator | YES (Core fields) | String projection; no fetch | Controlled |
| 4 Persistence history | YES | Selected revisions | Controlled |
| 5 Revision lineage | YES (Model C) | Policies defined | Controlled |
| 6 Session context | YES (OPS) | Optional organizational | Controlled |
| 7 Workspace context | YES (OPS) | Optional | Controlled |

Explicit anti-conflation rule present (axes 2/6/7 ≠ scientific provenance; digests ≠ Standing/Grade).

**PASS.**

---

## Reproducibility Audit

| Kind | Sprint 026 claim | Audit |
|------|------------------|-------|
| A Artifact | YES | Consistent with existing unit exports |
| B Projection | YES | Packaging sections |
| C Bundle | YES — primary | Determinism contract present |
| D Computational / scientific result | **NO** | Explicitly not claimed |

Packaging ≠ computational reproducibility boundary is **clear**.

**PASS.**

---

## Bundle Boundary Audit

Contents are enumerated for:

- mandatory minimal profile;
- opt-in `with_ops_events`;
- optional organizational context;
- explicit exclusions.

Inclusion reasons and authority classes are stated. Vague “relevant metadata” is largely avoided.

**OBSERVATION (O-026-01):** Phrase “member_refs … relevant to inclusion” needs an Implementation-Decision pin: **all session/workspace members** vs **only members whose `identity` ∈ included_identities**. Not an architecture blocker — both are organizational and non-scientific.

**OBSERVATION (O-026-02):** Exact TypeScript field shapes deferred to Decision — acceptable; categories are normative enough for audit.

**PASS** with observations.

---

## Determinism Audit

Defined:

- manifest key lexicographic order (SER discipline);
- identities, artifact_entries, ops_events, member_refs, source_locators sorts;
- SER-JSON for unit payloads;
- forbidden wall-clock / randomUUID / Math.random;
- double-run equality acceptance;
- SHA-256 content_digest algorithm closed.

### OQ-026-007 — Lineage list ordering

| Aspect | Assessment |
|--------|------------|
| Scientific semantics of lineage | Carried by `predecessor_revision_id` fields on each revision entry — **not** by array order |
| Packaging determinism | Array order MUST be fixed for byte-identical packages |
| Repository precedent | `Persistence.listRevisions` **already sorts by `revision_id`**; OPS `get*Lineage` uses that list |
| Predecessor-walk order | Alternative packaging order; semantically equivalent if predecessor fields retained |

**Classification:** **IMPLEMENTATION-DECISION ITEM** (not architecture blocker).

**Audit recommendation for Decision (non-binding on SPEC):** pin **`revision_id` ascending** to match `listRevisions` / existing OPS lineage — avoid inventing predecessor-walk ordering unless required.

SPEC already requires Decision to fix exactly one rule before EXEC — deterministic contract is architecturally closed; choice of rule is Decision-level.

**PASS.**

---

## Timestamp Audit

| Kind | Treatment | Verdict |
|------|-----------|---------|
| Scientific timestamps in payloads | Included as AUTHORITATIVE_SCI | **PASS** |
| Ops event `at` | Included only when ops_events profile on | **PASS** |
| `generated_at` | Optional caller-supplied; no wall-clock | **PASS** |
| Export wall-clock | Forbidden | **PASS** |

Byte-identical packaging is preserved when callers omit `generated_at` or supply stable values.

**PASS.**

---

## Identity / Version Audit

Separated correctly:

- scientific identity / SemVer content_version / Model C `revision_id`;
- packaging `package_id` (`rpkg:…`) / `schema_id` `aip.repro.pack@1.0.0`;
- SER / CONF / CERT profiles unchanged.

Packaging MUST NOT mutate scientific identity or revisions — explicit.

**PASS.**

---

## ENC / SER Audit

Expected direction satisfied:

CanonicalUnit → ENC (already stored) → SER JsonEncoder → packaging container via stableStringify discipline.

No competing scientific canonicalization. Package is a layer **above** SER.

**PASS.**

---

## Model C Audit

Compatible with stable identity, immutable revisions, predecessor_revision_id, RevisionHead, CAS.

Package reads heads/revisions; does not create a second revision graph; does not advanceHead during packaging.

Revision policies (`heads_only` / `explicit_revisions` / `full_lineage`) are coherent with Persistence APIs.

**PASS.**

---

## Event Journal Audit

Scientific ENC envelope events travel inside payloads.  
Persistence `ops.*` events are opt-in projections only.  
No second journal. Events ≠ scientific provenance / relationships.

**PASS.**

---

## Snapshot Audit

ResearchSnapshot / WorkspaceSnapshot schemas explicitly frozen / unchanged.  
Full PersistenceSnapshot dump excluded (correct — avoids unrelated identity leakage).

**PASS.**

---

## Literature Boundary Audit

source locator ≠ source content — explicit.  
No DocumentArtifact, crawler, or full-text.  
Future attach points are non-normative forward-compat only.

**PASS.**

---

## Import / Restore Audit

EXPORT ONLY closed intentionally.  
Package verify ≠ Persistence restore.  
Persistence already has infrastructure `snapshot`/`restore` — packaging correctly refuses a second restore channel in Sprint 026.

**PASS** — export-only is architecturally sufficient.

---

## Security Audit

Forbids secrets, credentials, keys, env vars; fixtures must use synthetic locators; packaging does not strip Core content (correct — would mutate AUTHORITATIVE_SCI).

**OBSERVATION (O-026-03):** “Private URLs with embedded credentials MUST NOT appear” is a fixture/caller discipline rule, not an automated redactor — acceptable for Sprint 026; Decision should restate fixture obligation.

**PASS** with observation.

---

## Persistence Audit

**NO Persistence redesign** — preferred and correctly chosen.  
Uses existing get / getHead / listRevisions / getEvents.  
No package Persistence kind. No database.

**PASS.**

---

## OPS Ownership Audit

Ownership closed: **Research Operations packaging surface**.  
Conceptual `packageResearchRun(input)` named; exact symbol/path deferred to Decision (OQ-026-006).

Not owned by Persistence, ENC, or SER — correct separation.

**PASS.**

---

## REF → CONF → CERT Audit

| Concern | Verdict |
|---------|---------|
| Single ConformanceEngine / CertificationEngine | Preserved |
| SCI profile unchanged | Correct (OPS packaging) |
| OPS profile `CONF-001@1.1.0-OPS` | Sufficient |
| Additive `REF-OPS-162+` | Correct |
| No second certification path | Correct |

**PASS.**

---

## Future Compatibility Audit

SPEC explains later Literature, computational biology, KG, AI consuming packages without making packages authoritative. No premature implementation.

**PASS.**

---

## Open Questions Assessment

### OQ-026-006 — Exact OPS method name / module path

| Item | Value |
|------|-------|
| Classification | **IMPLEMENTATION-DECISION ITEM** |
| Architecture blocker? | **NO** |
| Rationale | Semantics and ownership closed; naming/path are implementation conventions (same class as prior sprint Decision naming pins) |

### OQ-026-007 — Lineage list ordering

| Item | Value |
|------|-------|
| Classification | **IMPLEMENTATION-DECISION ITEM** |
| Architecture blocker? | **NO** |
| Resolution direction | List order is packaging/determinism representation; lineage **semantics** live in `predecessor_revision_id`. Decision MUST pin one total order. **Recommended:** `revision_id` ascending (matches `Persistence.listRevisions`) |
| SPEC patch required? | **NO** — SPEC already requires Decision to fix one rule |

### OQ-026-008 — Packaging error code taxonomy

| Item | Value |
|------|-------|
| Classification | **IMPLEMENTATION-DECISION ITEM** |
| Architecture blocker? | **NO** |
| Resolution direction | Prefer existing `OpsError` (`INVALID_COMMAND_STATE` for grammar/command misuse) + propagate Persistence/ENC errors unwrapped. Avoid a parallel error framework unless Decision proves a distinct packaging code is necessary for fixture `failure_code` clarity |
| SPEC patch required? | **NO** |

---

## Blockers

**0**

---

## Required Patches

**0** — do not patch SPEC in this gate.

---

## Observations

| ID | Observation |
|----|-------------|
| **O-026-01** | Pin member_refs inclusion rule in IMPLEMENTATION-DECISION (all members vs inclusion-filtered). |
| **O-026-02** | Exact TS shapes / helper module path deferred — Decision must enumerate. |
| **O-026-03** | Security exclusions are caller/fixture discipline; no automated redactor — acceptable. |
| **O-026-04** | Recommend Decision pin lineage array order = `revision_id` ascending (Persistence precedent). |
| **O-026-05** | Decision should enumerate exact source-locator extraction fields (Evidence `source_locator` / nested source; Verification `artifact_ref`) to avoid EXEC ambiguity. |
| **O-026-06** | SHA-256 via platform crypto is integrity metadata only — Decision should name the API (`node:crypto` createHash) without introducing scientific crypto semantics. |

None of the observations conceal blockers. None require SPEC correction before Implementation Decision.

---

## Verdict

## ARCHITECTURE-AUDIT-026 — APPROVED WITH OBSERVATIONS

SPEC-026 is architecturally sound and aligned with DISCOVERY-026 and the certified Phase R1 / Model C / ENC / SER / OPS / REF→CONF→CERT stack. Authority boundaries, ResearchRun semantics, packaging reproducibility (not computational), export-only scope, determinism contract, and Persistence non-impact are closed. Remaining OQ-026-006/007/008 are Implementation-Decision items.

| Metric | Value |
|--------|-------|
| BLOCKERS | 0 |
| REQUIRED PATCHES | 0 |
| OBSERVATIONS | 6 |
| EXEC-blocking architecture questions | 0 |

---

## Implementation Readiness

**READY** for IMPLEMENTATION-DECISION-026.

Not READY for EXEC until Decision closes OQ-026-006/007/008 and absorbs O-026-01…06 as EXEC discipline.

---

## Next Gate

**IMPLEMENTATION-DECISION-026**

Then FINAL-ARCHITECTURE-RE-AUDIT-026 → EXEC-026 (when separately commanded).

This audit does **not** create IMPLEMENTATION-DECISION, EXEC, fixtures, or source changes.

*End ARCHITECTURE-AUDIT-026.*

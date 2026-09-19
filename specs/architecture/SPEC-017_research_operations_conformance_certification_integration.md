# SPEC-017
## Research Operations Conformance & Certification Integration

| Field | Value |
|-------|--------|
| Spec ID | SPEC-017 |
| Title | Research Operations Conformance & Certification Integration |
| Version | 0.2.0-PATCHED |
| Status | **SPEC-017 PATCHED — PENDING ARCHITECTURE RE-AUDIT** |
| Mode | Design / architecture only — **NO IMPLEMENTATION** |
| Inputs | SPEC-016A, CODE-AUDIT-014A, CODE-AUDIT-015, CODE-AUDIT-016, CODE-AUDIT-017 |
| Patch input | CODE-AUDIT-017 (P-017-001…P-017-004) |
| Intended future execution | EXEC-SPRINT-017… (not authorized by this document) |
| Does not claim | Approval, implementation, execution readiness, or certification |

---

## Status

**SPEC-017 PATCHED — PENDING ARCHITECTURE RE-AUDIT**

This document is design-only. It does not authorize code changes, fixture creation, CONF/CERT modifications, or certification of Sprint 016.

Patched to close CODE-AUDIT-017 findings P-017-001 through P-017-004. Not approved.

---

## CODE-AUDIT-017 Patch Closure

| Patch | Problem | Resolution | Status |
|-------|---------|------------|--------|
| P-017-001 | CONF profile ambiguity | Explicit same-engine profile selection; SCI REQUIRED_* never expanded globally | **CLOSED** |
| P-017-002 | PERSIST-001 contradiction | OPS v1 requires OPS-001 only; PERSIST-001 not in REQUIRED_AUTHORITIES_OPS | **CLOSED** |
| P-017-003 | CERT profile ambiguity | Certification binds to ConformanceReport profile; additive future CERT contract | **CLOSED** |
| P-017-004 | OPS-only corpus incomplete | FULL corpus required for OPS CONF/CERT; OPS subset is authoring-only | **CLOSED** |

---

## Objective

Close the **CONFORMANCE CONTRACT GAP** identified by CODE-AUDIT-016 by defining a legitimate, auditable architecture that brings Research Operations (Sprint 016) into the existing evidence chain:

```
OPS implementation
  → OPS Reference Fixtures (REF-TEST owned)
  → ReferenceRunner
  → ReferenceReport
  → ConformanceEngine.evaluate(report, profile)
  → ConformanceReport (carries profile id)
  → CertificationEngine (same profile binding)
  → CertificationReport / Certificate
```

without fabricating evidence, creating a second Conformance or Certification authority, or weakening the scientific evidence chain.

---

## Background

Sprint 016 delivered a FULLY VERIFIED OPS orchestration layer (CODE-AUDIT-015). Formal certification is blocked because CONF-001 evaluates **only** `ReferenceReport` evidence produced by REF-TEST-001 against a closed set of REF-* fixture families and scientific/processor authorities. Sprint 016 OPS evidence (`test-016`, `smoke-016`) is verification artifact, not `ReferenceReport`.

CODE-AUDIT-016 verdict: **CONFORMANCE CONTRACT GAP**.  
CODE-AUDIT-017 verdict: **SPEC-017 REQUIRES PATCHES** (closed herein).

Sprint 016 implementation is not defective. The gap is architectural.

---

## Current Architecture

```
Scientific Core
        ↓
Reference Processor (RPR-001)
        ↓
Canonical Encoding (ENC-001)
        ↓
Serialization (SER-001 / SER-JSON-001)
        ↓
Reference Tests (REF-TEST-001/002/003) ──► ReferenceReport
        ↓
Conformance (CONF-001) ──► ConformanceReport
        ↓
Certification (CERT-001/002) ──► Certificate
        ↓
Persistence (Sprint 015 infrastructure)
        ↓
Reference Application / OPS (Sprint 016 — verified, not certified)
```

**Current repository CONF API (frozen today):** `ConformanceEngine.evaluate(report)` with a single SCI `REQUIRED_*` set.  
**Proposed future CONF API (PROPOSED):** `ConformanceEngine.evaluate(report, profile)` — same engine; profile-selected requirement sets.  
**CERT public contract:** `CertificationEngine.certify(sessionId, ConformanceReport)` — does not consume OPS/smoke/raw code.  
**ReferenceReport producer:** `ReferenceRunner` / `buildReferenceReport` only.

---

## CODE-AUDIT-016 Finding

| Finding | Detail |
|---------|--------|
| Sole CONF input | `ReferenceReport` with `engine: REF-TEST-001` |
| Closed prefixes | `REQUIRED_FIXTURE_PREFIXES` (REF-CLAIM…REF-AUTH) — no REF-OPS |
| Closed authorities | SCI/ENC/SER/RPR/ADR — no OPS-001 |
| Closed scenarios | REF-TEST-002 nine scenarios — no OPS-specific class required if mapped |
| Architecture boundary pin | Requires `source=ReferenceReport` and `engine=REF-TEST-001` |
| Forbidden | Fabricating REF-* results from smoke-016; second CONF/CERT engines |

---

## Problem Statement

How can OPS become a **first-class subject** of the existing Conformance → Certification pipeline while:

1. preserving REF-TEST ownership of evidence production,
2. preserving CONF ownership of evaluation,
3. preserving CERT ownership of certification,
4. keeping ResearchSession memory-only,
5. keeping Persistence infrastructure-only,
6. not invalidating the existing 44-fixture scientific corpus or prior certificates,
7. remaining deterministic and auditable?

---

## Design Principles

1. **One evidence producer:** Reference Tests alone produce `ReferenceReport`.  
2. **One ConformanceEngine:** CONF-001 with explicit versioned **profiles** (not parallel engines).  
3. **One CertificationEngine:** CERT-001/002 consume `ConformanceReport` only; bind to the report’s profile.  
4. **No fabrication:** OPS smoke/tests are verification aids only — **not** Conformance evidence.  
5. **OPS is not scientific:** Fixtures exercise orchestration; Core/ENC/SER/Persistence retain semantics.  
6. **Additive, not replacement:** Scientific 44-fixture corpus remains valid.  
7. **GLOBAL SCI REQUIRED_* MUST NOT be expanded** to include OPS requirements.  
8. **Determinism mandatory.**  
9. **Traceability:** implementation → fixture → report → observation → certificate.  
10. **No hidden channels.**

---

## Ownership Model

| Concern | Owner | Must not |
|---------|-------|----------|
| Scientific semantics | Core (SCI-*) | OPS reinterpret |
| Processor stages | RPR-001 | OPS duplicate |
| Canonical encoding | ENC-001 | OPS re-encode semantics |
| Serialization | SER / SER-JSON | OPS alternate profile |
| Persistence mechanics | Persistence | OPS redefine storage; Persistence must not become scientific CONF authority via PERSIST-001 in v1 |
| Research session / membership / views | OPS | Persist session; invent science |
| Fixture execution & ReferenceReport | REF-TEST-001/002/003 | OPS / CONF fabricate |
| Conformance evaluation | CONF-001 (profile-selected) | OPS / CERT re-evaluate; second engine |
| Certification | CERT-001/002 (profile-bound) | Parallel cert path |

---

## Frozen Contracts vs Proposed Extensions

| Layer | CURRENT FROZEN | PROPOSED FUTURE | IMPLEMENTATION SPRINT |
|-------|----------------|-----------------|------------------------|
| CONF-001@1.0.0 | **Frozen** — current SCI behavior / REQUIRED_* | Unchanged meaning | Must not mutate @1.0.0 |
| CONF-001@1.1.0-OPS | Does **not** exist as active implementation | Additive profile of **same** CONF-001 | Future EXEC after re-audit |
| REF-TEST-001 | Frozen engine authority | Unchanged | — |
| REF-TEST-002 | Frozen SCI 44 corpus baseline | Additive REF-OPS fixtures | Future EXEC |
| CERT-001/002 | Frozen single CertificationEngine | Additive **profile binding** to ConformanceReport | Future EXEC (minimal additive) |
| Persistence contract | Frozen Sprint 015 | No PERSIST-001 required for OPS v1 | — |
| Sprint 016 OPS | Verified; not redesigned by SPEC-017 | Subject of REF-OPS | — |

**CONF-001@1.1.0-OPS is NOT a second Conformance system.** It is an additive profile of the same Conformance authority.

---

## OPS Evidence Model

**DECIDED:** Sprint 016 OPS behaviors enter the pipeline exclusively as **executable Reference Fixtures** (`ReferenceFixture`) whose results appear in `ReferenceReport.fixtures[]`.

**Not evidence for CONF/CERT:**

- `SMOKE_016_PASS` / `TEST_016_PASS` labels alone  
- Informal console output  
- Fabricated `ReferenceResult` objects outside `ReferenceRunner`  
- Direct OPS → ConformanceEngine calls with non-ReferenceReport payloads  

**Smoke-016 / test-016:** Remain allowed as **implementation verification** artifacts. They do **not** substitute for REF-OPS fixtures.

---

## Reference Test Integration

**DECIDED:**

1. New OPS fixtures required — additive to the official corpus.  
2. Fixture prefix: `REF-OPS-`.  
3. No new scenario class for v1 — map onto existing REF-TEST-002 scenarios.  
4. Fixtures call public OPS APIs plus certified Core/ENC/Persistence/SER APIs.  
5. Fixtures assert orchestration and boundaries; they do not redefine Persistence or Core.

---

## Corpus Model (P-017-004)

| Corpus ID | Contents | Role |
|-----------|----------|------|
| `REF-CORPUS-SCI` | Existing **44** scientific fixtures | Sole target for CONF-001@1.0.0 |
| `REF-CORPUS-OPS` | REF-OPS-* fixtures only | **Authoring / subset only** — NOT a CONF/CERT target |
| `REF-CORPUS-FULL` | `REF-CORPUS-SCI ∪ REF-CORPUS-OPS` | **Sole** valid target for CONF-001@1.1.0-OPS and OPS certification |

**DECIDED (P-017-004):**

- For `CONF-001@1.1.0-OPS`, **ONLY `REF-CORPUS-FULL`** may be submitted to Conformance / Certification.  
- `REF-CORPUS-OPS` MUST NOT be submitted alone for OPS certification.  
- Existing SCI 44-fixture corpus MUST NOT be modified.

### Deterministic FULL construction

`REF-CORPUS-FULL` SHALL be constructed as:

1. Deterministic SCI ordering (existing stable fixture_id ascending within SCI).  
2. Deterministic OPS ordering (stable fixture_id ascending within OPS).  
3. Deterministic concatenation: **SCI then OPS** (or equivalent documented fixed rule that yields unique total order).  
4. Unique fixture IDs across the union (no ID collision).  
5. Runner applies its existing stable fixture_id sort on the combined list (final order deterministic).

---

## Fixture Taxonomy

**DECIDED grammar:** `REF-<AREA>-<NNN>` (`/^REF-[A-Z]+-[0-9]{3}$/`).

**DECIDED OPS prefix:** `REF-OPS-001` … `REF-OPS-NNN`.

| Property | Decision |
|----------|----------|
| Ownership | REF-TEST-002 corpus; fixtures evidence **OPS-001** (+ Core/ENC/SER as exercised; Persistence exercised as orchestration, not as CONF-required Persistence authority) |
| Ordering | Runner stable `fixture_id` ascending |
| Completeness | Under OPS profile only: require prefix `REF-OPS-` **in addition to** SCI prefixes |

**Do not** create `REF-PERSIST-*` for v1.  
**DEFERRED:** `REF-PERSIST-*` for a future Persistence-conformance sprint.

---

## Scenario Model

**DECIDED for v1:** Use existing `REFERENCE_SCENARIOS` only.

Scenario completeness for OPS-integrated evaluation is satisfied because **FULL** includes SCI fixtures covering all scenarios; OPS fixtures contribute additional rows without replacing SCI coverage.

**DEFERRED:** New scenario value `operations` — only if a future audit finds existing classes insufficient.

| Candidate behavior | Existing scenario | Test owner |
|--------------------|-------------------|------------|
| Session lifecycle | `valid` / `invalid` | REF-OPS |
| Claim registration | `valid` | REF-OPS |
| Persistence create/get via OPS | `valid` | REF-OPS |
| Explicit event append | `event` | REF-OPS |
| Membership | `valid` / `invalid` | REF-OPS |
| Timeline | `event` | REF-OPS |
| Persistence snapshot via OPS | `valid` | REF-OPS |
| ResearchSnapshot | `valid` | REF-OPS |
| Serialization via OPS | `serialization` | REF-OPS |
| Deterministic rerun | `valid` | REF-OPS |
| Error propagation | `invalid` | REF-OPS |
| Architecture boundaries | `authority` | REF-OPS |

---

## ReferenceReport Evolution

**DECIDED: OPTION A** — `ReferenceReport` **structural shape remains unchanged**.

| Field | Change |
|-------|--------|
| `engine` | Remains `REF-TEST-001` |
| `suite` | MAY include corpus id for human readability |
| `fixtures[]` | Includes REF-OPS-* when FULL corpus used |
| `scenarios[]` / `compliance[]` / `summary` | Unchanged aggregation rules |

**No** new OPS evidence section. **No** parallel report type.

Profile identity for CONF/CERT is carried on **ConformanceReport** (see Certification Profile Binding), not by inventing a second ReferenceReport type.

---

## Conformance Integration & Profile Selection (P-017-001)

### Design Decision

**DECIDED:** Extend the **same** `ConformanceEngine` with explicit profile selection.

**Conceptual future API (PROPOSED — not implemented by this spec):**

```
ConformanceEngine.evaluate(report: ReferenceReport, profile: ConformanceProfileId = "CONF-001@1.0.0")
  → ConformanceReport
```

Equivalent: pass a registered profile object resolving to the same identifiers and requirement sets.

**FORBIDDEN:**

- `OPSConformanceEngine`
- `OPSConformanceReport` as a parallel authority product
- Parallel Conformance authority
- Mutating global SCI `REQUIRED_*` constants to include OPS requirements

**Default profile:** `CONF-001@1.0.0` unless explicitly requested otherwise.

### Profile Semantics Table

| Profile | Purpose | Corpus | Required authorities | Architecture families | Status |
|---------|---------|--------|----------------------|----------------------|--------|
| `CONF-001@1.0.0` | Existing scientific conformance | `REF-CORPUS-SCI` only | Current SCI `REQUIRED_AUTHORITIES` (unchanged) | Current families (CANON/SER/PROC/CLAIM + engine pin) | **FROZEN** |
| `CONF-001@1.1.0-OPS` | Integrated scientific + OPS conformance | **`REF-CORPUS-FULL` only** | SCI `REQUIRED_AUTHORITIES` **∪ { OPS-001 }** | Current families **+ `REF-OPS-`** | **PROPOSED** |

### OPS profile requirement sets (PROPOSED — profile-local, not global)

```
REQUIRED_FIXTURE_PREFIXES_OPS =
  REQUIRED_FIXTURE_PREFIXES_SCI ∪ { "REF-OPS-" }

REQUIRED_AUTHORITIES_OPS =
  REQUIRED_AUTHORITIES_SCI ∪ { "OPS-001" }
  // PERSIST-001 is NOT included in v1

architecture_boundaries families_OPS =
  families_SCI ∪ { prefix: "REF-OPS-", label: "operations evidence" }
```

**GLOBAL SCI REQUIRED_* constants MUST NOT be expanded to include OPS requirements.**  
Otherwise existing SCI conformance may change silently.

`CONF-001@1.1.0-OPS` does **not** yet exist as an active implementation. Future EXEC must not mutate the meaning of `@1.0.0`.

---

## Conformance Dimensions

Seven dimension IDs remain unchanged.

| Dimension | Remains? | OPS profile (`@1.1.0-OPS`) |
|-----------|----------|----------------------------|
| `authority_compliance` | Yes | Require SCI authorities **+ OPS-001** (from profile-local set) |
| `fixture_completeness` | Yes | SCI prefixes **+ `REF-OPS-`** |
| `scenario_completeness` | Yes | Unchanged enum; FULL corpus supplies SCI coverage |
| `determinism` | Yes | Unchanged semantics; OPS double-run = fixture assertions |
| `round_trip_integrity` | Yes | Keep REF-RT-*; do not redefine as OPS-SER |
| `stage_ownership` | Yes | Remains REF-PROC-* (RPR); OPS ≠ processor stage |
| `architecture_boundaries` | Yes | SCI families **+ REF-OPS-*** all PASS; engine `REF-TEST-001` |

**DECIDED:** No new dimensions for v1.

---

## Authority Model (P-017-002)

| Authority ID | Status | In OPS profile REQUIRED set (v1)? | Notes |
|--------------|--------|-----------------------------------|-------|
| OPS-001 | Pin exists (`FROZEN_APPROVED`, filing pending); **PROPOSED for CONF use** | **Yes** | Application/architectural; non-scientific |
| PERSIST-001 | **NOT required for SPEC-017 / OPS profile v1** | **No** | Optional future authority; **not** a prerequisite for SPEC-017 approval; **not** in `REQUIRED_AUTHORITIES_OPS` |
| SCI/ENC/SER/RPR/ADR | Frozen | Yes (via SCI set) | Unchanged |
| SPEC-016A | Design doc | No | Not an authority pin |
| REF-OPS-001 | Optional meta | No | Prefer cite OPS-001 on fixtures |

**DECIDED (P-017-002 / OPTION A):**

- `CONF-001@1.1.0-OPS` requires existing SCI authorities **+ OPS-001**.  
- **PERSIST-001 MUST NOT** be required by the OPS profile in v1.  
- Persistence remains infrastructure-only.  
- PERSIST-001 may be proposed in a **later** architecture sprint if needed.  
- Do **not** file PERSIST-001 as part of SPEC-017.  
- Do **not** modify `authorities/pins.json` as part of SPEC-017.

Fixtures may still **exercise** Persistence APIs and may list Persistence-related authority strings in fixture metadata for documentation, but Persistence is **not** a CONF-required authority pin for OPS v1.

**PROHIBITED:** Treating SPEC-016A as a CONF authority id.

---

## Persistence Evidence Boundary

| Behavior | Tested where | CONF (OPS profile) |
|----------|--------------|--------------------|
| Persistence contract semantics | Persistence Sprint 015 tests/smoke | Not via PERSIST-001 requirement |
| OPS→Persistence orchestration | REF-OPS fixtures | Yes (orchestration evidence under OPS-001 / architecture_boundaries) |
| ResearchSession durability | Forbidden | Boundary fixtures assert absence |

---

## ResearchSession / ResearchSnapshot / Timeline Evidence

Unchanged from prior SPEC-017 intent:

- ResearchSession remains **MEMORY-ONLY**.  
- ResearchSnapshot = in-memory view wrapping PersistenceSnapshot.  
- Timeline derives from Persistence journal; explicit appendEvent; caller-supplied event ids.

---

## Determinism

Same inputs → same fixture results → same ReferenceReport → same ConformanceReport (for same profile) → same Certification decision (for same profile/session rules).

No `Date.now` / `randomUUID` / `Math.random` for scientific/session/event identities in OPS fixtures.

---

## Certification Profile Binding (P-017-003)

### Design Decision — Choose A

**DECIDED:** Architecture **A** — a **profile identifier is explicitly associated with the ConformanceReport**, and Certification resolves authority coverage from the **same profile definition** rather than a conflicting global SCI-only constant.

Conceptual future chain:

```
ReferenceRunner
  → ReferenceReport
  → ConformanceEngine.evaluate(report, profile)
  → ConformanceReport(profile_id = profile)
  → CertificationEngine.certify(sessionId, report)
       // uses profile_id on report to select authority coverage rules
  → CertificationReport / Certificate
```

### Invariants (future implementation contract — NOT implemented by this patch)

1. Certification consumes **ConformanceReport only**.  
2. ConformanceReport **identifies** its conformance profile (`profile_id`, e.g. `CONF-001@1.0.0` or `CONF-001@1.1.0-OPS`).  
   - **MINIMUM contract extension:** add an explicit profile identifier field (or equivalent frozen association) on ConformanceReport — **not** a wholesale redesign.  
3. Certification uses the **same profile** for authority coverage as produced the report.  
4. SCI certification continues to use SCI profile.  
5. OPS certification uses OPS profile.  
6. **Global SCI `REQUIRED_AUTHORITIES` must not be expanded.**  
7. **One** CertificationEngine remains.  
8. Existing SCI certificates remain valid.  
9. **No historical SCI certificate is retroactively re-evaluated against OPS authorities.**  
10. ConformanceReport remains the sole Certification input.

**This is a FUTURE additive CERT/CONF contract extension**, not “prefer no changes,” and not a rewrite of historical certification.

**FORBIDDEN:** Second CertificationEngine; CERT consuming Reference App / smoke / raw code.

---

## Versioning

| Artifact | Strategy |
|----------|----------|
| REF-TEST-001 | Frozen engine |
| REF-TEST-002 | Additive REF-OPS; SCI 44 frozen baseline |
| CONF-001@1.0.0 | Frozen meaning |
| CONF-001@1.1.0-OPS | PROPOSED profile |
| CERT-001/002 | Single engine; additive profile binding |
| Sprint 016 OPS APIs | Unchanged by SPEC-017 |

---

## Backward Compatibility

| Item | Decision |
|------|----------|
| 44-fixture corpus | Remains valid; sole SCI CONF target |
| SCI profile requirements | Original REQUIRED_*; OPS must not leak into SCI |
| Old ReferenceReports | Remain readable |
| Old ConformanceReports | Remain meaningful under SCI semantics |
| Old SCI certificates | **Not invalidated**; never re-scored against OPS authorities |
| New OPS certificates | New sessions under `@1.1.0-OPS` + FULL corpus |

---

## Migration / Execution Phases

| Phase | Name | Changes | Remains frozen | Tests | Audit |
|-------|------|---------|----------------|-------|-------|
| 1 | Add REF-OPS fixtures | Additive fixtures; SCI 44 untouched | REF-TEST engine; SCI corpus content | Runner executes FULL construction | CODE-AUDIT fixtures |
| 2 | Register OPS profile in **same** ConformanceEngine | Profile registry / `evaluate(report, profile)`; profile-local REQUIRED_* | SCI `@1.0.0` semantics; global SCI REQUIRED_* | SCI default vs OPS explicit | CODE-AUDIT CONF profile |
| 3 | Profile binding on ConformanceReport | Minimum profile_id (or equivalent) on report | Report shape otherwise | Round-trip report JSON | CODE-AUDIT report field |
| 4 | CERT same-profile binding | Criteria use report profile, not expanded global SCI list | One CertificationEngine; SCI cert path | SCI + OPS cert sessions | CODE-AUDIT CERT binding |
| 5 | Run REF-CORPUS-FULL | Deterministic SCI∪OPS | SCI 44 | FULL run | — |
| 6 | OPS-aware ConformanceReport | `evaluate(FULL, CONF-001@1.1.0-OPS)` | — | Deterministic re-evaluate | — |
| 7 | CERT on profile-bound report | Existing CertificationEngine | — | Decision + certificate | — |
| 8 | Independent audit | — | — | — | CODE-AUDIT |
| 9 | Certification | Formal CERT session | — | — | Final gate |

**SPEC-017 implements none of these phases.**

---

## Architecture Diagram

```
Scientific Core → Processor → ENC → SER
                                    ↓
Research Ops ──→ Reference Tests (SCI + REF-OPS) ──→ ReferenceReport
     │                                                      │
     ↓                                                      │
Persistence (infra only)                                    │
                                                            ↓
                              ┌─ CONF-001@1.0.0 ──→ SCI Certification
                              │   (default; REF-CORPUS-SCI)
            ReferenceReport ──┤
                              │
                              └─ CONF-001@1.1.0-OPS ──→ OPS Certification
                                  (explicit; REF-CORPUS-FULL only)
                                  │
                                  ├─ same ConformanceEngine
                                  └─ same CertificationEngine
                                     (profile_id on ConformanceReport)

FORBIDDEN:
  OPS ──✗──► Conformance / Certification (bypass)
  Persistence ──✗──► Certification authority
  smoke-016 ──✗──► fabricated ReferenceReport
  OPSConformanceEngine / parallel CERT
```

Both paths are **profiles of the same CONF-001 and CERT-001/002 authorities**, not separate systems.

---

## Evidence Chain

| Hop | Producer | Consumer | Authority | Evidence | Determinism |
|-----|----------|----------|-----------|----------|-------------|
| 1 | Sprint 016 OPS | REF-OPS fixtures | OPS-001 | Runtime API | Caller-supplied ids |
| 2 | Fixtures | ReferenceRunner | REF-TEST-001/002/003 | ReferenceResult | Stable order |
| 3 | Runner | — | REF-TEST-003 | ReferenceReport | Stable report |
| 4 | Report + **profile** | ConformanceEngine | CONF-001 | ConformanceEvidence | Profile-selected rules |
| 5 | Engine | — | CONF-001 | ConformanceReport(**profile_id**) | Stable JSON |
| 6 | Report | CertificationEngine | CERT-001/002 | CertificationEvidence | Same profile binding |
| 7 | Engine | — | CERT | Certificate | Deterministic |

---

## Future AI Compatibility

Non-implementing only: future AI may use OPS APIs but MUST remain subject to fixtures → report → CONF(profile) → CERT(profile). No parallel CONF/CERT. No nondeterministic certified identities.

---

## Non-Goals

AI / LLM / literature / crawlers / semantic search / embeddings / vector DB / RAG / UI / authN/Z / multi-user / durable ResearchSessions / cloud / CQRS / event sourcing / Kafka / Redis / Elasticsearch / REST/GraphQL redesign / DB redesign / fabricated REF results / second CONF or CERT / expanding global SCI REQUIRED_* / implementing code in this sprint / filing PERSIST-001.

---

## Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-001 | OPS has a legitimate path into Reference Tests via REF-OPS fixtures |
| AC-002 | OPS evidence cannot bypass Reference Tests |
| AC-003 | Fabricated ReferenceReport evidence is prohibited |
| AC-004 | ResearchSession remains memory-only |
| AC-005 | Persistence remains infrastructure-only |
| AC-006 | Existing scientific authorities remain valid |
| AC-007 | Certification remains centralized (CERT-001/002) |
| AC-008 | **No second Conformance:** one ConformanceEngine; explicit profile selection; no parallel OPS Conformance; SCI profile remains default |
| AC-009 | No second Certification system |
| AC-010 | Determinism explicitly defined |
| AC-011 | Fixture ownership explicit (REF-TEST) |
| AC-012 | Scenario ownership explicit (existing REF-TEST-002 classes) |
| AC-013 | **Authority ownership:** OPS-001 required for OPS v1; **PERSIST-001 not required**; Persistence remains infrastructure |
| AC-014 | ReferenceReport remains structurally unchanged (OPTION A) |
| AC-015 | **Backward compatibility:** SCI profile uses original requirements; OPS requirements cannot leak into SCI profile; existing ReferenceReports, ConformanceReports, and certificates remain valid |
| AC-016 | 44-fixture corpus remains valid |
| AC-017 | **Certificates not invalidated:** historical SCI certificates are **not** evaluated against OPS authority requirements |
| AC-018 | Persistence evidence boundaries explicit |
| AC-019 | OPS error evidence via REF-OPS fixtures |
| AC-020 | ResearchSnapshot evidence via REF-OPS fixtures |
| AC-021 | Timeline/event evidence via REF-OPS fixtures |
| AC-022 | **CERT consumes ConformanceReport** and **uses the profile associated with that ConformanceReport** |
| AC-023 | Future AI compatibility preserved without implementing AI |
| AC-024 | Implementation phases have explicit audit/rollback boundaries |
| AC-025 | **Conformance profile binding is explicit and deterministic** (`evaluate(report, profile)`; default `@1.0.0`; OPS profile explicit) |
| AC-026 | **OPS CONF/CERT targets ONLY `REF-CORPUS-FULL`**; `REF-CORPUS-OPS` is authoring-only |

---

## Authority Impact Matrix

| Authority | Current status | SPEC-017 impact | Must remain frozen? | Future change required? |
|-----------|----------------|-----------------|---------------------|-------------------------|
| SCI-000…006 | FROZEN | None | **Yes** | No |
| ENC / SER / RPR | FROZEN | None | **Yes** | No |
| REF-TEST-001 | FROZEN | Engine unchanged | **Yes** | No |
| REF-TEST-002 | FROZEN SCI 44 | Additive REF-OPS | SCI baseline **Yes** | Additive fixtures |
| CONF-001@1.0.0 | FROZEN | Unchanged meaning | **Yes** | No |
| CONF-001@1.1.0-OPS | Does not exist | PROPOSED profile | N/A | Future EXEC |
| CERT-001/002 | FROZEN engine | Additive profile binding | Engine **Yes** | Minimal additive binding |
| Persistence | Certified Sprint 015 | Infra-only; no PERSIST-001 in OPS v1 | Contract **Yes** | Optional future PERSIST-001 |
| OPS-001 | Pin exists; filing pending | Required under OPS profile | Consume | CONF use PROPOSED |
| ADR-0006 | FROZEN | None | **Yes** | No |

---

## Open Decisions

| Topic | Status | Notes |
|-------|--------|-------|
| ReferenceReport shape | **DECIDED** — OPTION A | |
| CONF profile API | **DECIDED** — `evaluate(report, profile)`; default SCI | Exact registration code = EXEC detail |
| CERT profile binding | **DECIDED** — Architecture A (profile_id on ConformanceReport) | Exact field name = EXEC detail within invariant |
| PERSIST-001 | **DEFERRED** | Optional future authority — **not** required for OPS profile v1; **not** a SPEC-017 blocker |
| REF-PERSIST-* | **DEFERRED** | |
| Exact REF-OPS fixture IDs/count | **DEFERRED** | EXEC authoring |
| New scenario `operations` | **DEFERRED** | |
| AI | **DEFERRED** | Compatibility only |

---

## Final Architectural Decision

1. OPS enters CONF/CERT only via additive **REF-OPS** fixtures + **REF-CORPUS-FULL**.  
2. ReferenceReport shape unchanged (OPTION A).  
3. **One** ConformanceEngine with explicit profiles; default SCI; OPS profile additive and PROPOSED.  
4. **Global SCI REQUIRED_* never expanded** for OPS.  
5. OPS v1 required authority addition: **OPS-001 only** (no PERSIST-001).  
6. ConformanceReport carries **profile_id**; Certification binds to that profile (Architecture A).  
7. One CertificationEngine; historical SCI certificates untouched.  
8. ResearchSession memory-only; Persistence infrastructure-only; no fabricated evidence.

**Authorized path:**

```
OPS → Reference Tests → ReferenceReport → ConformanceEngine(profile) → ConformanceReport(profile_id) → CertificationEngine → Certificate
```

---

## SPEC-017 STATUS

**SPEC-017 PATCHED — PENDING ARCHITECTURE RE-AUDIT**

Not approved. Not ready for execution. Not certified.

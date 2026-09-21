# ARCHITECTURE-AUDIT-021

## 1. Audit Identity

| Field | Value |
|-------|--------|
| Sprint | 021 — Evidence Post-Persist Record State OPS |
| Specification | `specs/architecture/SPEC-021_evidence_post_persist_record_state.md` |
| Version audited | **0.1.0-DRAFT** |
| Spec status at audit | DRAFT — READY FOR ARCHITECTURE AUDIT |
| Baseline commit | `6c0106c3e27685f549bc7c2b882a0365c6b511d6` |
| Auditor role | AIP Architecture Auditor (independent of implementer) |
| Audit mode | **READ-ONLY** |
| Discovery input | `audits/roadmap/DISCOVERY-021_EVIDENCE_RECORD_STATE.md` |
| Naming | Follows established `ARCHITECTURE-AUDIT-0NN_SPEC-0NN.md` convention |
| Does not authorize | EXEC-021, source/test changes, certification, commit, push |

---

## 2. Executive Verdict

**APPROVED WITH OBSERVATIONS**

SPEC-021 correctly extends certified Model C / Claim Standing orchestration to Evidence Record State post-persist transitions without creating a second scientific authority, second journal, or second relationship graph. Core remains the sole Record State authority. Remaining open questions OQ-021-004…007 are independently assessed as **non-blocking**. Required architecture patches: **0**. Architecture blockers: **0**.

---

## 3. Baseline Verification

| Check | Result | Evidence |
|-------|--------|----------|
| HEAD | `6c0106c3e27685f549bc7c2b882a0365c6b511d6` | `git rev-parse HEAD` |
| Sprint 020 certified / closed | **Verified** | Commit subject `cert(sprint-020): certify Model C…`; `audits/certification/CERTIFICATION-020.md` |
| Model C certified | **Verified** | CERTIFICATION-020 §2; Persistence revision keys + `RevisionHead` + CAS |
| Sprint 019 Evidence OPS certified | **Verified** | Prior commit `dbbc8c6 cert(sprint-019)`; Evidence create-once retained in OPS |
| SCI / OPS / FULL at Sprint 020 | 44/44 · 46/46 · 90/90 | CERTIFICATION-020 |
| Working tree (audit start) | Dirty **docs only** | `M README.md`; `?? audits/roadmap/`; `?? specs/architecture/SPEC-021_…` |
| Runtime / test packages modified by SPEC-021 | **None** | No `packages/**` or test tree changes attributable to this SPEC phase |
| Relevant prior architecture docs | Inspected | SPEC-019, SPEC-020, ADR-020 path via CERTIFICATION-020, ARCHITECTURE-AUDIT-020 / FINAL-RE-AUDIT-020, DISCOVERY-021, CODE-AUDIT-020 |

This audit adds: `audits/architecture/ARCHITECTURE-AUDIT-021_SPEC-021.md` only.

---

## 4. Authority Boundary Verification

| Layer | Required role | SPEC-021 treatment | Verdict |
|-------|---------------|--------------------|---------|
| **Scientific Core** | Sole Record State vocabulary + transition legality + resulting Evidence content | Imports `draft\|registered\|withdrawn`; delegates to `EvidenceTransitionService.transition`; forbids invented states/edges | **PASS** |
| **ENC** | Canonical EvidenceUnit projection / integrity | `CanonicalEncoder.assemble` after Core; no ENC redesign | **PASS** |
| **Persistence** | Immutable revisions, lineage metadata, RevisionHead, CAS, sole journal | Model C keys; `create` + `advanceHead`; journal optional citation | **PASS** |
| **OPS** | Orchestration / session / workspace / optional event / projection | `transitionEvidenceRecordState`; OPS-local decode; no membership mutation | **PASS** |
| **SER** | Deterministic export bytes | Head export retained; additive revision export authorized | **PASS** |
| **Conformance** | Evaluate Reference evidence under existing profiles | Additive REF-OPS under `CONF-001@1.1.0-OPS` preferred; single engine | **PASS** |
| **Certification** | Formal certification from ConformanceReports | Single CertificationEngine; SPEC does not certify | **PASS** |

**Central question:** Does SPEC-021 extend Model C / Claim Standing to Evidence Record State **without** creating a new scientific authority?

**Answer: Yes.** Normative sequence (§10) is load → OPS projection → **Core transition** → ENC → Persistence create → CAS → optional ops event. OPS does not decide scientific legality; Core errors (`EvidenceValidationError`) propagate unchanged.

No wording audited elevates OPS, Persistence, or journal events to scientific Record State authority.

---

## 5. Model C Verification

| Requirement | SPEC-021 | Repository fact | Verdict |
|-------------|----------|-----------------|---------|
| Stable scientific identity | `evidence_id` unchanged | Core transition preserves `evidence_id` | **PASS** |
| New immutable revision per transition | Caller `revision_id`; prior row untouched | Matches Claim Standing + `IMMUTABLE_KINDS` | **PASS** |
| Storage key | `persist:CanonicalUnit:EvidenceUnit:{evidence_id}:{revision_id}` | `makeCanonicalUnitRevisionStorageKey` / Model C | **PASS** |
| No normative revert to 3-segment key | Explicit four-segment; dual-read legacy ≡ `rev:initial` | Memory store dual-read retained | **PASS** |
| Initial revision | `rev:initial` | `INITIAL_REVISION_ID` on Evidence register | **PASS** |
| Subsequent IDs caller-supplied | Grammar `^rev:[A-Za-z0-9._~-]{1,128}$`; ≠ `rev:initial` | Persistence `assertRevisionId` | **PASS** |
| No random/time revision IDs | Forbidden generators listed | Claim Standing pattern | **PASS** |
| Lineage | `predecessor_revision_id` = `expected_head_revision_id` | `entityFromCanonicalUnit` options | **PASS** |
| Lineage ≠ scientific graph | Explicit §13 / §17 | Persistence metadata only | **PASS** |
| RevisionHead | `persist:RevisionHead:EvidenceUnit:{evidence_id}` | `makeRevisionHeadStorageKey` | **PASS** |
| CAS | `advanceHead` / `replace` + `expected_version` | Store `advanceHead` | **PASS** |
| Stale head → CONFLICT | Explicit §15 | Persistence `CONFLICT` | **PASS** |
| Immutability / no update-in-place | Explicit; no in-place Record State mutate | CanonicalUnit immutable | **PASS** |
| Partial write | Create may succeed; CAS fail → orphan; no new transactions | SPEC-020 §28 / CODE-AUDIT-020 O-020-07 | **PASS** |
| SemVer trichotomy | `evidence_version` ≠ `revision_id` ≠ head CAS token | Core preserves `evidence_version` on Record State transition | **PASS** |

**Finding:** Model C application is structurally isomorphic to certified Claim Standing and does not invent Persistence semantics.

---

## 6. Evidence Record State Verification

### 6.1 Core vocabulary (repository-authoritative)

From `packages/core/src/evidence/types.ts` and `transition-service.ts`:

```
EVIDENCE_RECORD_STATES = draft | registered | withdrawn

ALLOWED:
  draft → registered | withdrawn
  registered → withdrawn
  withdrawn → ∅
```

SPEC §4 imports this closed set and marks restore / registered→draft / invented states as **not currently authorized by Core**. **PASS — no invented vocabulary or edges.**

### 6.2 Human gates (repository-authoritative)

| Transition | Core gate | SPEC §11 |
|------------|-----------|----------|
| → `registered` | Human Reviewer + non-empty `decision_ref` | Matches |
| → `withdrawn` when `ai_assisted` | Human Reviewer | Matches (“Human if ai_assisted”) |
| → `withdrawn` when not `ai_assisted` | Not forced by `requiresHumanReviewer` | Matches |

### 6.3 OPS orchestration vs authority

Proposed API `transitionEvidenceRecordState(...)` mirrors `transitionClaimStanding` structurally while naming the **Record State** axis (correct scientific difference). Input carries Core `EvidenceRecordTransitionInput`; Core performs `transition`; OPS persists result. **Not a second state machine.**

### 6.4 Decoder `evidenceFromEvidenceUnitPayload`

| Check | Verdict |
|-------|---------|
| Why needed | ENC EvidenceUnit payload must be projected to Core `Evidence` for `EvidenceTransitionService` (Claim already has `claimFromClaimUnitPayload`; Evidence analogue absent — DISCOVERY-021) |
| OPS-local | Explicit §9.1 |
| Not second Evidence model | Explicit; post-transition Core+ENC+persist is authority (§9.5) |
| Field classes | Canonical reconstruct vs Persistence exclude vs OPS exclude — aligned with ENC `buildEvidence` content + envelope events/refs |
| Lossiness | Acknowledged; Core validates **output** Evidence | **PASS** |

**Observation O-021-01 (non-blocking):** ENC concatenates ERTE and GAE into `envelope.events` (`builder.ts`). SPEC §9.3 says SHALL NOT drop reconstructible grade history but also says projection **MAY** map GAE. Intent is clear for architecture: discriminate ERTE by `to_state ∈ EVIDENCE_RECORD_STATES` (Claim filters by `CLAIM_STANDINGS`); when GAE are discriminable, EXEC must reconstruct `grade_assignment_log` so Record State revisions do not silently erase Grade history. Wording tension is editorial/EXEC discipline, not an authority or Model C defect.

### 6.5 Duplicate state machine?

**No.** SPEC forbids inventing transitions absent from Core and surfaces illegal edges as Core `F_TRANSITION` / related codes.

---

## 7. Claim Standing Pattern Comparison

| Reused (correct) | Evidence-specific (must remain distinct) |
|------------------|------------------------------------------|
| Head-resolved load → decode → Core transition → ENC → create → `advanceHead` → optional `appendEvent` | Vocabulary: Record State ≠ Standing |
| Caller `revision_id` + `expected_head_revision_id` | API name `transitionEvidenceRecordState` |
| Partial-write honesty | Event type `ops.evidence_record_state_revision` + `to_record_state` |
| Error propagation (no wrap) | Human/registration gates from Evidence Core |
| Optional ops journal citation non-authoritative | ERTE (not STE) in scientific envelope |
| No session/workspace requirement; no membership mutate | Pre-persist `registerEvidenceUnit({ transition })` preserved |

**Finding:** Structural reuse without vocabulary merge or generic multi-class state machine. **PASS.**

---

## 8. Snapshot / Membership / Export Verification

| Concern | SPEC | Verdict |
|---------|------|---------|
| ResearchSnapshot schema | Frozen `{ research_session_id, member_refs, persistence_snapshot }` — no new fields | **PASS** |
| WorkspaceSnapshot | Additive schema unbroken; reflection via persistence + membership | **PASS** |
| Membership ≠ Record State / bears_on / supported_by / lineage | Explicit §17; transition does not change membership | **PASS** |
| Auto relationship sync | Forbidden | **PASS** |
| `exportEvidenceUnit` | Head-resolved SER-JSON (existing) | **PASS** |
| Revision export / get-by-revision / head / lineage | Additive; Claim already has revision export helpers | **PASS** (see OQ-021-006) |
| Snapshots as views only | Persistence snapshot carries revision rows + head; not new scientific store | **PASS** |

---

## 9. Determinism Verification

| Identifier | Rule | Verdict |
|------------|------|---------|
| `revision_id` | Caller-only; no `randomUUID` / `Date.now` / `Math.random` | **PASS** |
| ERTE `event_id` / `at` | Caller-supplied on certified paths | **PASS** |
| Head CAS | Explicit expected head | **PASS** |
| Scientific identity | Stable; not generated by OPS | **PASS** |

**Observation O-021-02 (non-blocking, inherited):** Core `EvidenceEventBuilder` may `randomUUID` if ERTE `event_id` omitted (`event-builder.ts`). SPEC correctly requires caller-supplied `event_id` for deterministic EXEC/REF and does **not** change Core STE/ERTE builder behavior (parallel to CODE-AUDIT-020 O-020-03 for Claim STE).

---

## 10. Concurrency Verification

SPEC §15 concurrent A/B from same head: one CAS succeeds; stale → `CONFLICT`; no last-write-wins; orphan possible. Matches certified Persistence `advanceHead` and Claim Standing. **PASS.**

---

## 11. Error / Failure Semantics

| Condition | SPEC reuse | Layer match | Verdict |
|-----------|------------|-------------|---------|
| Illegal Record State | `EvidenceValidationError` (`F_TRANSITION`, `F4`, `F5`, …) | Core | **PASS** |
| Invalid revision grammar | `INVALID_ID` | Persistence | **PASS** |
| Duplicate revision | `ALREADY_EXISTS` | Persistence | **PASS** |
| Stale head | `CONFLICT` | Persistence | **PASS** |
| Missing entity/revision | `NOT_FOUND` | Persistence | **PASS** |
| Mutate immutable | `IMMUTABLE_ENTITY` | Persistence | **PASS** |
| Bad predecessor on build | `INVALID_STATE` | Persistence entity builder | **PASS** |
| OPS misuse / decode failure | `OpsError` `INVALID_COMMAND_STATE` | OPS | **PASS** |
| No wrap of lower-layer errors | Explicit | Matches OPS convention | **PASS** |

No unjustified new error taxonomy. **PASS.**

**Observation O-021-03 (non-blocking, inherited):** Like Claim Standing / CODE-AUDIT-020 O-020-01, SPEC does not require Persistence `create`-time existence proof that `predecessor_revision_id` names an existing row. Pathological orphan with dangling predecessor remains an authorized partial-write edge. SPEC-021 §32 correctly defers stronger checks to a future Persistence enhancement.

---

## 12. Regression Analysis

| Certified surface | SPEC obligation | Risk if EXEC follows SPEC |
|-------------------|-----------------|---------------------------|
| Sprint 019 Evidence register + optional **pre-persist** transition | Explicitly preserved (§6.2, §24) | Low |
| Evidence get / export / membership / events patterns | Preserved; transition does not require session | Low |
| ResearchSnapshot / WorkspaceSnapshot | No schema break | Low |
| Sprint 020 Model C keys / head / CAS / immutability | Reused | Low |
| Claim Standing | Explicit regression requirement | Low |
| SCI 44/44 | No SCI fixture rewrite required | Low |
| OPS corpus | Additive fixtures only | Low |

**No certified contract must change** for SPEC-021 to be implementable. Contract modifications would be additive API helpers only. **PASS.**

---

## 13. Scope-Creep Analysis

| Prohibited surface | In SPEC-021? | Result |
|--------------------|--------------|--------|
| Grade OPS | Explicit non-goal | **PASS** |
| Contradiction OPS | Explicit non-goal | **PASS** |
| Negative Result OPS | Explicit non-goal | **PASS** |
| Verification OPS | Explicit non-goal | **PASS** |
| Literature / DocumentArtifact / crawler | Explicit non-goal | **PASS** |
| AI research agent / AI scientific authority | Explicit non-goal; Core AI registration ban retained | **PASS** |
| Knowledge Graph | Explicit non-goal | **PASS** |
| Database / PostgreSQL | Explicit non-goal | **PASS** |
| Durable workspace | Explicit non-goal | **PASS** |
| Distributed infrastructure | Explicit non-goal | **PASS** |
| Frontend / public REST / GraphQL / microservices | Explicit non-goal | **PASS** |
| Second scientific graph | Forbidden | **PASS** |
| Second event journal | Forbidden | **PASS** |
| Automatic relationship synchronization | Forbidden | **PASS** |
| Automatic evidence discovery / scientific decisions | Not introduced | **PASS** |
| New Record State vocabulary | Forbidden | **PASS** |
| Material Evidence content OPS (`EvidenceVersionService`) | Out of EXEC slice | **PASS** |

**Scope-creep overall: PASS.**

---

## 14. Open Questions

### OQ-021-001 — Evidence decode-from-unit fields

**STATUS:** CLOSED (SPEC) — **Auditor confirms CLOSED**  
**REASON:** Minimum field classes align with ENC `buildEvidence` + Claim decode precedent; projection explicitly non-authoritative.  
**REQUIRED ACTION:** None for architecture. EXEC implements OPS-local helper with ERTE/GAE discrimination (see O-021-01).

### OQ-021-002 — Sprint scope = Record State post-persist only

**STATUS:** CLOSED (SPEC) — **Auditor confirms CLOSED**  
**REASON:** Scope table and non-goals match DISCOVERY-021 and certified gap (Evidence post-persist absent after Sprint 020).  
**REQUIRED ACTION:** None.

### OQ-021-003 — OPS API naming

**STATUS:** CLOSED (SPEC) — **Auditor confirms CLOSED**  
**REASON:** `transitionEvidenceRecordState` correctly reflects Record State semantics; Claim Standing naming not blindly copied. Input/output/sequence/determinism/error/concurrency contracted.  
**REQUIRED ACTION:** None.

### OQ-021-004 — REF-OPS fixture id range / titles

| Attribute | Auditor determination |
|-----------|------------------------|
| STATUS | **NON-BLOCKING** |
| Affects implementation safety? | No |
| Affects scientific authority? | No |
| Affects determinism / Model C / certified behavior? | No |
| Safe until EXEC? | **Yes** |
| REASON | Themes fixed in SPEC §25; `CONF-001@1.1.0-OPS` requires only `REF-OPS-` family presence, not specific id numbers (`packages/conformance/src/profiles.ts`). |
| REQUIRED ACTION | Assign concrete fixture ids at EXEC packaging. |

### OQ-021-005 — CONF OPS profile bump?

| Attribute | Auditor determination |
|-----------|------------------------|
| STATUS | **NON-BLOCKING** |
| Affects implementation safety? | No |
| Affects scientific authority? | No |
| Affects Model C? | No |
| Affects certified behavior? | Only if EXEC incorrectly rewrites SCI fixtures or breaks prior OPS fixtures |
| Safe until EXEC? | **Yes** |
| REASON | Profile already recognizes additive `REF-OPS-*`. Historical Sprint 020 added fixtures without profile bump. No architecture evidence that existing OPS profile hard-fails new themes. |
| REQUIRED ACTION | Prefer additive under `CONF-001@1.1.0-OPS`; revisit only if EXEC measurement proves otherwise. |

### OQ-021-006 — Evidence head / lineage / revision export mandatory vs recommended

| Attribute | Auditor determination |
|-----------|------------------------|
| STATUS | **NON-BLOCKING** |
| Affects scientific authority? | No |
| Affects Model C correctness? | No (transition + head-resolved get/export suffice for scientific commit path) |
| Affects certified Claim helpers? | No |
| Safe until EXEC? | **Yes** |
| REASON | Mandatory minimum correctly stated: transition + head-resolved get/export. Thin wrappers improve REF parity with Claim (`getClaimHead` / `getClaimLineage` / `exportClaimUnitRevision` already exist) but are not architecture blockers. |
| REQUIRED ACTION | EXEC may implement recommended helpers; SPEC patch not required. |

### OQ-021-007 — Optional `items` / `bears_on` overrides on post-persist transition in tests

| Attribute | Auditor determination |
|-----------|------------------------|
| STATUS | **NON-BLOCKING** |
| Affects scientific authority? | No — Core already accepts optional `items` / `bears_on` on `EvidenceRecordTransitionInput` |
| Affects Model C? | No |
| Safe until EXEC? | **Yes** |
| REASON | Passthrough of Core optional inputs is correct; REF may omit overrides and still prove Record State revision. Material Item change without version bump remains Core-rejected (`F6`). |
| REQUIRED ACTION | Allow passthrough; do not expand Sprint scope into material-update OPS. |

**Architecture blockers among OQ-021-004…007: 0**

---

## 15. Required Patches

**REQUIRED PATCHES: 0**

No architecture-blocking defect requiring a SPEC patch before an implementation decision. Observations below are non-blocking (EXEC discipline / inherited Model C honesty / editorial clarity).

---

## 16. Observations

| ID | Severity | Observation |
|----|----------|-------------|
| **O-021-01** | Non-blocking | ERTE vs GAE discrimination / `MAY` vs “SHALL NOT drop” grade history — EXEC must reconstruct discriminable GAE; optional future editorial SPEC tighten |
| **O-021-02** | Non-blocking | Inherited Core ERTE `randomUUID` if `event_id` omitted — callers must supply ids on certified paths |
| **O-021-03** | Non-blocking | Inherited: no `create`-time predecessor row existence check (CODE-AUDIT-020 O-020-01); partial-write orphans possible |
| **O-021-04** | Non-blocking | Same as Claim Standing: OPS loads **head** content then uses caller `expected_head_revision_id` for lineage/CAS; stale expected yields CAS `CONFLICT` (and possible orphan). No silent scientific overwrite |
| **O-021-05** | Non-blocking | Recommended Evidence head/lineage/revision-export helpers (OQ-021-006) for REF parity — not required for scientific correctness of the transition path |
| **O-021-06** | Non-blocking | Future REF-OPS themes (§25) are adequate for EXEC planning; exact numbering deferred (OQ-021-004) |

---

## 17. EXEC Readiness

**READY FOR IMPLEMENTATION DECISION**

Rationale (process-aligned with Sprint 020):

- Architecture audit finds SPEC-021 sound against certified contracts.
- This audit does **not** itself authorize EXEC-021 coding.
- Next established step: project **implementation decision** (and any process-required final architecture gate) before EXEC.

Not selected: NOT READY FOR EXEC · READY FOR PATCH / RE-AUDIT · READY FOR FINAL ARCHITECTURE RE-AUDIT  
(Final re-audit only if the project’s Sprint 021 process requires it after an implementation decision — not mandated by defects found here.)

---

## 18. Final Verdict

**APPROVED WITH OBSERVATIONS**

| Metric | Count |
|--------|-------|
| Required patches | **0** |
| Architecture blockers | **0** |
| Observations | **6** (O-021-01…006) |
| Closed normative OQs | **3** (001–003) confirmed |
| Remaining OQs | **4** (004–007) all **NON-BLOCKING** |

**Source/test changes by this audit:** NONE  
**Commit/push by this audit:** NONE  

---

## Appendix A — Contracts Inspected (evidence)

| Area | Paths / artifacts |
|------|-------------------|
| SPEC subject | `specs/architecture/SPEC-021_evidence_post_persist_record_state.md` |
| Discovery | `audits/roadmap/DISCOVERY-021_EVIDENCE_RECORD_STATE.md` |
| Evidence Core | `packages/core/src/evidence/{types,transition-service,event-builder,validator}.ts` |
| ENC Evidence | `packages/encoding/src/builder.ts` (`buildEvidence`) |
| Persistence Model C | `packages/persistence/src/{entity,revision,memory/store,repository,types,errors}.ts` |
| OPS Claim Standing precedent | `apps/reference-app/src/operations/{research-operations,claim-from-unit}.ts` |
| Conformance OPS profile | `packages/conformance/src/profiles.ts` |
| Certification baseline | `audits/certification/CERTIFICATION-020.md` |
| Prior Model C audits | `ARCHITECTURE-AUDIT-020_SPEC-020.md`, `FINAL-ARCHITECTURE-RE-AUDIT-020_SPEC-020.md`, `CODE-AUDIT-020.md` |
| SPEC-020 partial-write | `specs/architecture/SPEC-020_post_persist_scientific_transition.md` §28 |

## Appendix B — Future REF / CONF / CERT impact (not implemented)

Expected future additive REF-OPS themes (architecture guidance only):

- Persisted draft → registered (new revision + head + Human gates)
- Registered → withdrawn (terminal Record State)
- Invalid transition (Core error; head unchanged)
- Stale head CONFLICT; duplicate revision ALREADY_EXISTS
- Lineage / immutability / head advancement
- Snapshot contains prior+new revisions + RevisionHead
- Head export vs revision export diverge on `record_state`
- Deterministic double-run with caller ids
- Optional operational event citation
- Regression: Sprint 019 Evidence pre-persist path; Sprint 020 Claim Standing / Model C

Path remains: REF → ConformanceEngine(`CONF-001@1.1.0-OPS` preferred) → CertificationEngine. No second engines. No fixtures created by this audit.

---

*End ARCHITECTURE-AUDIT-021.*

# FINAL-ARCHITECTURE-RE-AUDIT-023
## Contradiction OPS Under Model C

| Field | Value |
|-------|--------|
| Audit ID | FINAL-ARCHITECTURE-RE-AUDIT-023 |
| Subject | Sprint 023 Contradiction OPS — complete architecture gate |
| Baseline | `662d7f7881337809c7973a39b683053ae3c45a87` |
| Mode | **READ-ONLY** |
| Prior gate | IMPLEMENTATION-DECISION-023 — IMPLEMENTATION-READY — PENDING FINAL ARCHITECTURE RE-AUDIT |
| Does not itself | Implement, certify, commit, or push |

**Central question:** Can EXEC-023 implement exactly what has been architecturally specified, without inventing requirements, changing certified architecture, or expanding scope?

**Classification legend:** BLOCKER | REQUIRED PATCH | OBSERVATION | DEFERRED | NOT APPLICABLE

---

## 1. Baseline

| Check | Result |
|-------|--------|
| HEAD | `662d7f7881337809c7973a39b683053ae3c45a87` |
| origin/main | `662d7f7881337809c7973a39b683053ae3c45a87` |
| HEAD == origin/main | YES |
| Sprint 022 | FORMALLY CERTIFIED AND CLOSED — Grade OPS |
| SCI / OPS / FULL | **44/44 · 76/76 · 120/120** (verified) |
| Profiles | SCI `CONF-001@1.0.0` · OPS `CONF-001@1.1.0-OPS` |
| Highest OPS fixture | `REF-OPS-076` → next free **`REF-OPS-077`** |
| Runtime / tests / fixtures / cert / smoke markers changed by this audit | **NONE** |
| Source implementation of Sprint 023 | **NONE** (design-only chain intact) |

Working tree contains documentation-only untracked Sprint 023 chain artifacts (DISCOVERY, SPEC, ARCHITECTURE-AUDIT, IMPLEMENTATION-DECISION, this re-audit). Those do not alter the certified runtime baseline.

---

## 2. Document Chain

| Document | Role | Status |
|----------|------|--------|
| `audits/roadmap/DISCOVERY-023_NEXT_RESEARCH_FRONTIER.md` | Frontier pin: Contradiction OPS under Model C | READY FOR SPEC-023 |
| `specs/architecture/SPEC-023_contradiction_ops.md` | Normative create + transition contract | DRAFT — audited |
| `audits/architecture/ARCHITECTURE-AUDIT-023_SPEC-023.md` | First architecture gate | APPROVED WITH OBSERVATIONS (0 blockers · 0 patches) |
| `specs/architecture/IMPLEMENTATION-DECISION-023_contradiction_ops.md` | Closed EXEC contract + file budget | IMPLEMENTATION-READY — pending this gate |
| SPEC-020 / ADR-020 / ID-020 | Model C | Certified |
| SPEC-021 / ID-021 / FINAL-RE-AUDIT-021 | Record State OPS + decode precedent | Certified |
| SPEC-022 / ID-022 / FINAL-RE-AUDIT-022 | Grade OPS isomorphic path | Certified |
| Actual Core / OPS / Persistence / ENC / SER / CONF / CERT | Repository authority | Verified at HEAD |

### Cross-document consistency

| Decision | Discovery | SPEC | Arch Audit | Impl Decision | Agreement |
|----------|-----------|------|------------|---------------|-----------|
| Next frontier = Contradiction OPS under Model C | Yes | Yes | Affirmed | Binding | **CONSISTENT** |
| Core = `createOpen` + `transition` | Yes | Normative | Affirmed | Normative | **CONSISTENT** |
| No `createDraft` / no draft state | Yes | Normative | Affirmed | Binding | **CONSISTENT** |
| OPS APIs `registerContradictionUnit` + `transitionContradictionRecordState` | Candidate | Normative | Affirmed | Normative | **CONSISTENT** |
| Decode helper OPS-local | Pattern | Normative | Affirmed | New file authorized | **CONSISTENT** |
| Model C `ContradictionUnit` head | Preferred | Normative | Compatible | Normative | **CONSISTENT** |
| Persistence redesign | Not required | NONE | UNCHANGED | UNCHANGED | **CONSISTENT** |
| Generic lifecycle | Rejected | Rejected | NOT JUSTIFIED | NOT AUTHORIZED | **CONSISTENT** |
| `Persistence.Relationship` scientific store | Forbidden | Forbidden | Forbidden + O-023-01 | Forbidden + O-023-01 | **CONSISTENT** |
| Claim.contested_by coexistence only | Yes | Normative | Affirmed | Binding | **CONSISTENT** |
| OQ-023-002 ENC AI markers | Deferred | Deferred | D-023-01 | Deferred | **CONSISTENT** |
| OQ-023-005 / OQ-023-011 | Deferred | Deferred | D-023-02/03 | Deferred | **CONSISTENT** |
| Fixtures `REF-OPS-077+` | Additive | Themes | Themes | Numbering closed | **CONSISTENT** |
| Event type | Naming OQ closed | `ops.contradiction_record_state_revision` | PASS | Same string | **CONSISTENT** |
| Create-once: no event / no auto-membership | Claim/Evidence parity | Explicit | Affirmed | Explicit §7.2 | **CONSISTENT** |
| CONF/CERT unchanged engines | — | Yes | Affirmed | Yes | **CONSISTENT** |

### Architecture-Audit-023 observation accounting

| ID | Disposition in ID-023 | Silent disappearance? |
|----|----------------------|------------------------|
| O-023-01 Relationship query filter | Explicitly absorbed (§4 table + §14 + fixture #24) | **No** |
| O-023-02 Unreachable decode `<2` path | Explicitly absorbed (§4 + §13 + fixture guidance) | **No** |
| O-023-03 Assert ENC payload not `entity.references` | Explicitly absorbed (§4 + §13 + fixtures #14–15) | **No** |
| O-023-04 Caller-supplied `event_id` | Explicitly absorbed (§4 + §12 + §18) | **No** |
| O-023-05 Non-Contradiction source limit | Explicitly absorbed (§4 + §21 change budget) | **No** |

**Document chain:** **CONSISTENT**.

No contradiction requiring BLOCKER or REQUIRED PATCH.

---

## 3. Scientific Authority

| Concern | Verified |
|---------|----------|
| Creation authority | `ContradictionFactory.createOpen` — **present** (`packages/core/src/contradiction/factory.ts`) |
| Transition authority | `ContradictionTransitionService.transition` — **present** (`transition-service.ts`) |
| OPS role | Orchestration only — ENC → Persistence Model C → optional journal |
| New vocabulary | **Forbidden** — ID + SPEC forbid; Core states unchanged |
| Duplicated Core transition logic | **Forbidden** |
| Generic lifecycle / `postPersistTransition()` | **NOT AUTHORIZED** |

**Scientific authority:** **PRESERVED**.

EXEC does not need to invent Contradiction semantics.

---

## 4. Creation Contract

Normative sequence (SPEC §7 / ID §7) verified against Claim/Evidence create-once precedent:

```
ContradictionFactory.createOpen(input)
  → CanonicalEncoder.assemble(contradiction)
  → entityFromCanonicalUnit(unit, { revision_id: "rev:initial" })
  → repository.create(entity)
  → repository.ensureInitialHead(id, "ContradictionUnit", "rev:initial")
  → return { contradiction, unit, entity }
```

| Concern | Final rule | Status |
|---------|------------|--------|
| Event emission inside create | **None** (parity with `registerClaimUnit` / `registerEvidenceUnit`) | **PASS** |
| Membership inside create | **Caller-explicit** only | **PASS** |
| Snapshot/export inside create | **Caller-explicit** only | **PASS** |
| `options.transition` pre-persist | **Not offered** (OQ-023-012 CLOSED) | **PASS** |
| Non-initial `options.revision_id` | `OpsError INVALID_COMMAND_STATE` | **PASS** |

**Clarification (non-blocking):** External prompt wording that lists “optional event → membership → snapshots” after create is **caller orchestration**, not method body. ID-023 §7.2 correctly closes this against certified Claim/Evidence OPS. No REQUIRED PATCH.

**Creation contract:** **SAFE FOR EXEC**.

---

## 5. Transition Contract

Normative sequence (SPEC §8 / ID §8) verified against Standing / Record State / Grade OPS:

```
getContradictionUnit(identity)
  → contradictionFromContradictionUnitPayload
  → ContradictionTransitionService.transition
  → CanonicalEncoder.assemble
  → entityFromCanonicalUnit(+ predecessor_revision_id)
  → repository.create
  → repository.advanceHead CAS
  → optional appendEvent
```

| Concern | Final rule | Status |
|---------|------------|--------|
| New immutable revision | Yes — never replace prior row | **PASS** |
| `predecessor_revision_id` | = `expected_head_revision_id` | **PASS** |
| Stable scientific identity | `contradiction_id` unchanged | **PASS** |
| Caller-supplied `revision_id` | Required; ≠ `rev:initial`; ≠ expected head | **PASS** |
| Stale head | Persistence `CONFLICT` | **PASS** |
| Old revision immutable | CanonicalUnit not replaceable | **PASS** |
| Partial write honesty | create may succeed / CAS fail → orphan row, head unchanged | **PASS** |

**Transition contract:** **SAFE FOR EXEC**.

---

## 6. Model C

Verified against Persistence source (`revision.ts`, `entity.ts` kind map `ContradictionUnit → CanonicalUnit`, `store.ts` CAS):

| Element | Contract | Repository |
|---------|----------|------------|
| Revision key | `persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}` | `makeCanonicalUnitRevisionStorageKey` |
| Head key | `persist:RevisionHead:{unit_kind}:{scientific_identity}` | `makeRevisionHeadStorageKey` |
| `unit_kind` | `"ContradictionUnit"` | Kind map present |
| Initial | `rev:initial` (`INITIAL_REVISION_ID`) | Present |
| Later | Caller `rev:*` via `assertRevisionId` | Present |
| CAS | `advanceHead(from → to)` | Stale → `CONFLICT` |
| Alternative model | **None** | — |

**Model C:** **PRESERVED** — no alternative, no redesign.

---

## 7. Identity / Lineage

| Kind | Rule | Status |
|------|------|--------|
| Scientific identity | `contradiction_id` stable | **PASS** |
| Content SemVer | `contradiction_version` unchanged by Record State transition | **PASS** |
| Model C revision | Caller `revision_id`; ≠ SemVer | **PASS** |
| Lineage authority | `predecessor_revision_id` | **PASS** |
| Listing | `listRevisions` / `getContradictionLineage` | **PASS** |
| Predecessor existence check at create | Inherited deferred (O-020-01) | **DEFERRED** (inherited) |

**Identity / lineage:** **FULLY SPECIFIED**.

---

## 8. Record State

Verified Core `CONTRADICTION_RECORD_STATES` and `ALLOWED` table:

| State | Present |
|-------|---------|
| `open` | Yes |
| `resolved_by_supersession` | Yes |
| `resolved_by_scope_split` | Yes |
| `resolved_by_retraction` | Yes |
| `unresolved_archived` | Yes |

| Rule | Status |
|------|--------|
| No added / renamed states | **PASS** |
| `draft` forbidden | **PASS** (`FORBIDDEN_CONTRADICTION_RECORD_STATES`) |
| Edges only `open → resolved_* \| unresolved_archived` | **PASS** |
| Terminals have empty ALLOWED | **PASS** |
| Core semantics unchanged by Sprint 023 | **PASS** |

**Record State:** **PRESERVED**.

---

## 9. Human Gates

| Gate | Core mechanism | Final contract |
|------|----------------|----------------|
| F6 Human Reviewer | `assertHumanReviewerGate` / leaves-open | Preserved — OPS does not reimplement |
| `decision_ref` | Required leaving `open` | Preserved |
| `resolution_note` for `resolved_*` | Core `F7` | Preserved |
| F8 note-change | Core transition | Preserved |
| OPS alternative semantics | Forbidden | Binding in ID |

**Human gates:** **PRESERVED**.

---

## 10. References

| Concern | Verified |
|---------|----------|
| Scientific fields | Core `involved_claims` / `evidence_refs` |
| ENC roles | `involves` (Claim) · `cites_evidence` (Evidence) — `builder.ts` `buildContradiction` |
| Persistence dereference | **Not introduced** (OQ-023-001 CLOSED) |
| Grammar-only Core/ENC | Affirmed |
| Fixture assertion surface | ENC payload / decoded object (O-023-03) | 

**References:** **SAFE**.

---

## 11. Claim.contested_by

| Concern | Status |
|---------|---------|
| Claim Standing frozen | **PASS** |
| Sprint 023 effect | Contradiction identity becomes persistable | **PASS** |
| Reverse sync | **Forbidden** | **PASS** |
| Second graph | **Forbidden** | **PASS** |
| Coexistence fixture required | Yes (ID fixture #16 / SPEC T-13) | **PASS** |
| Certified `REF-OPS-039` dangling edge | Remains valid; Sprint 023 enables resolvable identities without redesign | **PASS** |

**Claim.contested_by:** **COMPATIBLE — coexistence only**.

---

## 12. Relationship Boundary

| Concern | Status |
|---------|--------|
| `Persistence.Relationship` as scientific store | **NOT AUTHORIZED** |
| Create Relationship entities for Contradiction edges | **Forbidden** |
| `queryRelationships` scientific truth | **Forbidden** — also returns CanonicalUnit rows with mirrored refs (store.ts ~554) |
| Fixture discipline (O-023-01) | Assert `list({ filter: { entity_kind: "Relationship" } }).total === 0` | **BINDING** |

**Relationship boundary:** **PASS** (with O-023-01 discipline).

---

## 13. ENC / SER

| Concern | Status |
|---------|--------|
| `buildContradiction` | **UNCHANGED** — Sprint 023 must not modify |
| Content omits `ai_assisted` / `human_sponsor` | FACT at HEAD; OQ-023-002 **DEFERRED** |
| `REF-CANON` redesign | **Forbidden** |
| SER | Existing `JsonEncoder.encode` of ContradictionUnit payload |
| New SER profile | **Forbidden** |
| Decode lossiness | Accepted per SPEC-021 precedent; Human gate still applies on leave-open | **PASS** |

**ENC / SER:** **UNCHANGED** — AI markers correctly deferred.

---

## 14. Persistence

| Concern | Status |
|---------|--------|
| Infrastructure-only | **PASS** |
| APIs reused | `create` / `get` / `getHead` / `ensureInitialHead` / `advanceHead` / `listRevisions` / `appendEvent` / `snapshot` |
| Database | **NOT AUTHORIZED** |
| Second journal | **NOT AUTHORIZED** |
| Second graph / CQRS / event sourcing | **NOT AUTHORIZED** |
| Durable / distributed workspace | **NOT AUTHORIZED** |
| Relationship scientific store | **NOT AUTHORIZED** |

**Persistence:** **UNCHANGED**.

---

## 15. Snapshots / Export

| Surface | Rule | Status |
|---------|------|--------|
| ResearchSnapshot | Frozen shape | **PASS** |
| WorkspaceSnapshot | Additive shape unchanged | **PASS** |
| Participation | Additive Persistence rows only | **PASS** |
| Export | Existing serialization of payload | **PASS** |
| Timeline | Operational over member identities | **PASS** |
| Scientific semantics in snapshot/timeline | **Forbidden** | **PASS** |

**Snapshots / export:** **PASS**.

---

## 16. Membership

| Rule | Status |
|------|--------|
| Member ref shape already supports `unit_kind: "ContradictionUnit"` | **PASS** |
| Create / transition do **not** auto-register | Binding in ID §7.2 / §16 | **PASS** |
| Caller-explicit `registerMember` / `registerWorkspaceMember` | Matches Claim/Evidence | **PASS** |
| Distinct from scientific refs / lineage | **PASS** |

**Membership:** **CALLER-EXPLICIT**.

---

## 17. Events / Determinism

### Scientific history

CRTE on Contradiction / ContradictionUnit envelope — authoritative.

### Operational citation (transition only)

| Field | Normative |
|-------|-----------|
| `event_type` | `ops.contradiction_record_state_revision` |
| Create-once event | **None** |
| Journal | Sole Persistence journal |

### Determinism

| Rule | Status |
|------|--------|
| Caller-supplied `revision_id` | Required | **PASS** |
| Caller-supplied CRTE `event_id` on certified paths | Required (O-023-04) | **PASS** |
| Core `randomUUID` fallback when `event_id` omitted | Exists (`event-builder.ts`) — **outside** certified OPS path | **PASS** (discipline) |
| `Math.random` / `Date.now` for identity minting on certified paths | **Forbidden** | **PASS** |

**Events / determinism:** **PASS**.

---

## 18. Error Semantics

| Layer | Codes | New categories invented? |
|-------|-------|--------------------------|
| Core | `F*` / `F_AI` / `F_TRANSITION` / `F6` / `F7` / `F8` | **No** |
| ENC | `CanonicalEncodingError` | **No** |
| Persistence | `INVALID_ID` / `NOT_FOUND` / `ALREADY_EXISTS` / `CONFLICT` / `IMMUTABLE_ENTITY` | **No** |
| OPS | `OpsError INVALID_COMMAND_STATE` | **No** |

Propagation pattern matches Standing / Record State / Grade OPS.

**Error semantics:** **COMPLETE** — no invention.

---

## 19. Reference Tests

| Concern | Status |
|---------|--------|
| Next free id | **`REF-OPS-077`** (HEAD highest = `REF-OPS-076`) |
| Additive only | **PASS** |
| Reuse of prior fixture ids | **Forbidden** |
| Risk surface | ID §20 covers creation through Relationship non-use (24 themes) | **PASS** |
| O-023-01 / O-023-02 / O-023-03 / O-023-04 fixture discipline | Binding | **PASS** |
| Profile authority | `OPS-001` (+ SCI/ENC where asserting lower layers) | **PASS** |
| Scripts | `test-023-*` / `smoke-023-*` authorized; `SMOKE_023_PASS` only | **PASS** |

**Reference tests:** **READY**.

---

## 20. CONF / CERT

| Concern | Status |
|---------|--------|
| Profile | `CONF-001@1.1.0-OPS` sufficient | **PASS** |
| ConformanceEngine | ONE — unchanged | **PASS** |
| CertificationEngine | ONE — unchanged | **PASS** |
| New profile / engine | **NOT AUTHORIZED** | **PASS** |
| Evidence | Additive OPS fixtures only | **PASS** |

**CONF / CERT:** **READY**.

---

## 21. Change Budget

### Authorized (exact)

- `apps/reference-app/src/operations/research-operations.ts`
- `apps/reference-app/src/operations/contradiction-from-unit.ts` (**new**)
- `apps/reference-app/src/index.ts` (exports + marker sprint → 23)
- Additive `REF-OPS-077+` in OPS fixtures (+ minimal ops-support if needed)
- `scripts/test-023-contradiction-ops.mjs` / `scripts/smoke-023-contradiction-ops.mjs`
- EXEC docs (`IMPLEMENTATION.md`, `EXEC-023_REPORT`)
- Certification artifacts **only** in later certification phase; `SMOKE_023_PASS` only

### Forbidden (closed)

Core / Persistence / ENC / SER / CONF / CERT redesign; generic lifecycle; second graph/journal; Relationship scientific store; database; API; frontend; AI; literature; search; multi-user; durable infrastructure; material content OPS; Claim/Evidence/Grade/NR/Verification redesign; unrelated refactoring; historical smoke/cert overwrite.

**File change budget:** **CLOSED**.

---

## 22. Deferred Questions

| ID | Item | Converted to Sprint 023 scope? |
|----|------|--------------------------------|
| OQ-023-002 | ENC AI markers (`ai_assisted` / `human_sponsor`) | **No** — DEFERRED |
| OQ-023-005 | Claim `qualified_by` / `verified_via` | **No** — DEFERRED |
| OQ-023-011 | Material content OPS | **No** — DEFERRED |
| O-020-01 | Predecessor existence check | **No** — inherited DEFERRED |

No deferred question silently entered the change budget.

---

## 23. Findings

| ID | Class | Statement |
|----|-------|-----------|
| — | **BLOCKER** | **None** |
| — | **REQUIRED PATCH** | **None** (SPEC / ID need no rewrite for EXEC) |
| F-023-RA-01 | OBSERVATION | Create-path prompt wording vs Claim/Evidence parity is correctly closed by ID-023 §7.2 (caller-explicit membership/event/snapshot). Non-blocking. |
| F-023-RA-02 | OBSERVATION | O-023-01…05 remain binding EXEC discipline; none disappeared. |
| F-023-RA-03 | DEFERRED | OQ-023-002 / OQ-023-005 / OQ-023-011 / O-020-01 remain outside Sprint 023. |
| — | NOT APPLICABLE | Persistence dual-read legacy (OQ-023-013) — inherited generic; no Sprint 023 action. |

**Counts:** Blockers **0** · Required patches **0** · Observations **2** (re-audit) + prior O-023-01…05 accounted · Deferred **4** items.

---

## 24. Final Decision

The Sprint 023 architecture chain is internally consistent and repository-faithful. Discovery → SPEC → Architecture Audit → Implementation Decision agree on Core delegation, Model C ContradictionUnit sequencing, Record State / Human gates, reference and Relationship boundaries, Claim.contested_by coexistence, determinism, errors, events, fixtures, conformance, certification, scope, and file budget.

All Architecture-Audit-023 observations are explicitly incorporated into IMPLEMENTATION-DECISION-023. Deferred questions remain deferred. No architectural invention is required for EXEC.

| Statement | Value |
|-----------|--------|
| Verdict | **APPROVED** |
| Blockers | **0** |
| Required patches | **0** |
| Implementation Authorization | **YES — EXACT SCOPE ONLY** |
| EXEC-023 | **AUTHORIZED** |
| Runtime implementation by this document? | **NO** — EXEC is a separate command |
| Commit / push by this document? | **NO** |

**READY FOR EXEC-023** under a separate EXEC command, exact authorized scope only.

This gate does **not** itself implement, certify, commit, or push.

---

FINAL-ARCHITECTURE-RE-AUDIT-023 VERDICT
========================================

Document chain:
CONSISTENT

Core authority:
PRESERVED

Creation contract:
SAFE — caller-explicit membership / no create-once event

Transition contract:
SAFE — immutable successor + CAS

Record State:
PRESERVED

Human gates:
PRESERVED

References:
SAFE — ENC involves / cites_evidence; no dereference

Claim.contested_by:
COMPATIBLE — coexistence only; no reverse sync

Relationship boundary:
PASS — Persistence.Relationship NOT scientific storage

Model C:
PRESERVED — ContradictionUnit

Identity / lineage:
FULLY SPECIFIED

Persistence:
UNCHANGED

ENC:
UNCHANGED — OQ-023-002 DEFERRED

SER:
UNCHANGED

Determinism:
PASS — caller event_id / revision_id

Events:
PASS

Snapshots / membership / export:
PASS

Errors:
COMPLETE — no new categories

Reference fixtures:
READY — REF-OPS-077+

Conformance:
READY — CONF-001@1.1.0-OPS

Certification:
READY — single engines

File change budget:
CLOSED

Scope:
CLOSED

Deferred questions:
ACCOUNTABLE — none silently in scope

Observations O-023-01…05:
ACCOUNTABLE

Implementation invention:
NONE

Certified behavior protection:
PASS

Blockers:
0

Required patches:
0

Implementation Authorization:
YES — EXACT SCOPE ONLY

EXEC-023:
AUTHORIZED

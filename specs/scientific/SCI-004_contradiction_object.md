# SCI-004 Scientific Contradiction Object Specification v0.1.0

| Field | Value |
|-------|--------|
| **Spec ID** | SCI-004 |
| **Artifact ID** | SPEC-OBJ-CONTRADICTION-001 |
| **Version** | **0.1.0** |
| **Status** | READY FOR REVIEW |
| **Ontology pin** | SCI-000 Core Scientific Ontology **v0.1.0** (PROVISIONAL APPROVED) |
| **Claim pin** | SCI-001@0.1.2 (Claim identity + Standing non-interference) |
| **Evidence pin** | SCI-002@0.1.0 (Evidence identity by reference only) |
| **Grade pin** | SCI-003@0.1.0 (non-interference; Grade not assigned here) |
| **Architecture pin** | ADR-0006 (ACCEPTED) — Contradiction Record State ≠ Workflow ≠ Claim Standing |
| **Normative language** | RFC 2119: SHALL / SHALL NOT / MUST / MUST NOT / SHOULD / MAY |

---

## 0. Normative Changelog (initial)

| ID | Change |
|----|--------|
| N1 | Initial Contradiction object normative structure |
| N2 | Contradiction-local Identifier, Version, and pin rules |
| N3 | Record State machine using SCI-000 Contradiction Allowed States only |
| N4 | Involved Claims (≥2) and optional Evidence references by id |
| N5 | Admissibility, provenance minimum, immutability / material change |
| N6 | Interpretation: no auto Standing change; no Evidence invalidation; no Grade; no Verification |
| N7 | Machine-testable invariants, examples, conformance checklist |

**Not in this specification:** Claim Standing transitions; Evidence/Grade internals; Verification; Negative Result; Workflow; shared Identifier/Version frameworks; APIs/schemas/code.

---

## 1. Purpose

This document is the **constitutional normative specification** of the SciROS **Contradiction** object.

It defines Contradiction structure, Record State, identity, provenance, admissibility, Claim/Evidence linkage by id, invariants, and interpretation—without owning Claim Standing, Evidence, Evidence Grade, or Verification.

Contradiction records **epistemic disagreement** (propositional incompatibility under overlapping Scope). It makes conflict **visible and auditable**. It does **not** by itself rewrite Standing, delete Evidence, or certify resolution truth.

---

## 2. Scope

1. Normative structure and invariants of Contradiction (Knowledge Object per SCI-000).  
2. Contradiction Record State machine (SCI-000 Allowed States only).  
3. Contradiction-local Identifier, Version, and pin rules.  
4. Relationships to Claims (≥2) and optional Evidence references by id.  
5. Admissibility and provenance minimum constituents.  
6. Interpretation rules (non-escalation).  
7. Conformance requirements for Contradiction encodings.

---

## 3. Out of Scope

1. Claim object internals or Standing transitions (SCI-001).  
2. Evidence structure, Record State, or invalidation (SCI-002).  
3. Evidence Grade labels or assignment (SCI-003).  
4. Negative Result (SCI-005), Verification (SCI-006).  
5. Process “Conflict” disputes (SCI-000 reserved; not Contradiction).  
6. Workflow State (ADR-0006; Program Execution).  
7. Global Identifier / Version / ethics frameworks.  
8. APIs, JSON Schema, databases, classes, UI, storage.  
9. Agent reasoning / automated contradiction detection algorithms.

---

## 4. Normative References

| Reference | Role |
|-----------|------|
| **SCI-000 v0.1.0** | Vocabulary authority (Contradiction term + Allowed States) |
| **SCI-001 v0.1.2** | Claim Identifier pattern; Standing owned elsewhere |
| **SCI-002 v0.1.0** | Evidence Identifier pattern for optional refs |
| **SCI-003 v0.1.0** | Grade non-interference |
| **ADR-0006** | Record State ≠ Workflow State |

This specification **SHALL NOT** redefine Canonical Names owned by SCI-000.  
This specification **SHALL NOT** set or modify Claim Standing.  
This specification **SHALL NOT** redefine Evidence or Grade semantics.

---

## 5. Dependencies

| Dependency | Requirement |
|------------|-------------|
| SCI-000@0.1.0 | MUST be provisionally approved or approved |
| SCI-001@0.1.2 | MUST exist for Claim id pattern |
| SCI-002@0.1.0 | MUST exist if `evidence_refs` used; otherwise MAY be unused |
| SCI-003@0.1.0 | NOT required for Contradiction issuance; Grade not assigned here |

---

## 6. Concept Ownership

| Concept | Vocabulary | Detail |
|---------|------------|--------|
| Contradiction | SCI-000 | **SCI-004** |
| Claim / Standing | SCI-000 | **SCI-001** |
| Evidence | SCI-000 | **SCI-002** |
| Evidence Grade | SCI-000 | **SCI-003** |
| Verification / Negative Result | SCI-000 | SCI-006 / SCI-005 |
| Workflow State | — | Program Execution; **not** SCI-004 |

---

## 7. Definition

Per SCI-000:

> **Contradiction** — A first-class object recording that two or more Claims have incompatible propositional content under overlapping Scope.

**SCI-004 refinement (non-redefining):**  
A Contradiction is an independent Knowledge Object that cites ≥2 Claim identities and states the asserted incompatibility. SCI-001 may reference a Contradiction via `contested_by`. Contradiction **may motivate** a Standing transition to `contested` but **SHALL NOT** perform that transition.

### 7.1 Mandatory logical constituents

A Contradiction **SHALL** include all of:

| Constituent | Normative rule |
|-------------|----------------|
| `contradiction_id` | §7.3 |
| `ontology_ref` | §7.5 |
| `spec_ref` | §7.5 |
| `contradiction_version` | §7.5 |
| `record_state` | Exactly one SCI-000 Contradiction Allowed State (§9.1) |
| `summary` | Non-empty Unicode string after NFC; length ≥ 1 after trim |
| `involved_claims` | §8.1 |
| `overlap_statement` | Non-empty string after NFC + trim (asserts Scope overlap; not a Scope object) |
| `incompatibility_statement` | Non-empty string after NFC + trim (asserts propositional clash) |
| `ethics_constraint_marker` | §7.4 |
| `provenance` | §10 |
| `created_by` | Non-empty Agent identifier string |
| `created_at` | UTC `YYYY-MM-DDThh:mm:ssZ` |

Optional (MAY): `evidence_refs[]` (§8.2), `resolution_note`, `ai_assisted` (§7.6), `human_sponsor` (§7.6), `record_transition_log[]` (§9.3).

### 7.2 Forbidden Record States

`record_state` **SHALL NOT** be `ignored` (SCI-000 Forbidden).  
`record_state` **SHALL NOT** be any Claim Standing value.  
`record_state` **SHALL NOT** be any Workflow State value (ADR-0006).  
`record_state` **SHALL NOT** be any Evidence Record State value.

### 7.3 Contradiction Identifier — Contradiction-local rules

1. `contradiction_id` **SHALL** match: `^contradiction:[A-Za-z0-9._~-]{1,128}$`  
2. Within one implementing system’s Contradiction store, `contradiction_id` **SHALL** be unique.  
3. `contradiction_id` **SHALL NOT** change across Record State transitions.  
4. `contradiction_id` **SHALL NOT** change across `contradiction_version` increments on the same identity lineage.  
5. These rules are **Contradiction-local**. This document **SHALL NOT** define a global SciROS Identifier standard.

**Test:** Reject any Contradiction whose `contradiction_id` fails the regex or collides within the store.

**Claim-side note (informative to ownership):** SCI-001 `contested_by` entries that reference Contradictions are expected to use this Identifier. SCI-001 owns `contested_by` rules; SCI-004 owns Contradiction Identifier semantics.

### 7.4 Ethics Constraint marker (Contradiction-local only)

1. `ethics_constraint_marker` **SHALL** be exactly the string `non_clinical`.  
2. This specification **SHALL NOT** define an ethics vocabulary or lexicon.

### 7.5 Pins and Contradiction Version strings (Contradiction-local only)

| Field | Pattern | Example |
|-------|---------|---------|
| `ontology_ref` | `^SCI-000@0\.1\.[0-9]+$` | `SCI-000@0.1.0` |
| `spec_ref` | `^SCI-004@0\.1\.[0-9]+$` | `SCI-004@0.1.0` |
| `contradiction_version` | `^[0-9]+\.[0-9]+\.[0-9]+$` | `1.0.0` |

1. On issuance, `contradiction_version` **SHALL** be set.  
2. First issued Version **SHALL** use `1.0.0` unless a documented migration Decision states otherwise.  
3. Pin/version rules are **Contradiction-local** (no shared Version framework).

### 7.6 AI authorship markers (Contradiction-local)

1. `ai_assisted` **SHALL** be boolean when present.  
2. If `ai_assisted` is `true`, `human_sponsor` **SHALL** be a non-empty Agent identifier string.  
3. If `ai_assisted` is `true`, `record_state` **SHALL** remain `open` until a Human Reviewer enacts a Record Transition Event to a resolved_* or `unresolved_archived` state—or a Human Reviewer confirms continued `open` via Assignment Event (§9.4) before the Contradiction is cited in a Claim Standing transition.  
4. An AI Agent **SHALL NOT** be sole `authority_agent` on transitions that leave `open` toward resolved_* or `unresolved_archived` (§9.4).

---

## 8. Relationships

### 8.1 Involved Claims (mandatory)

`involved_claims` **SHALL** be an array of Claim id strings such that:

1. Length **SHALL** be ≥ 2.  
2. Every entry **SHALL** match the SCI-001 Claim Identifier pattern by reference: apply **SCI-001@0.1.2 §7.3** verbatim; SCI-004 **SHALL NOT** redefine Claim Identifier grammar.  
3. All entries **SHALL** be pairwise distinct after NFC + trim.  
4. Contradiction **SHALL NOT** modify any Claim’s Standing, proposition, or scope.

**Test:** Reject arrays with fewer than 2 ids, duplicate ids, or ids failing SCI-001 §7.3.

### 8.2 Evidence references (optional)

If `evidence_refs` is present:

1. It **SHALL** be an array of Evidence id strings.  
2. Every entry **SHALL** match SCI-002@0.1.0 §7.3 Evidence Identifier by reference (not redefined here).  
3. Presence of an Evidence id in `evidence_refs` **SHALL NOT** invalidate, withdraw, or re-grade that Evidence.  
4. Evidence Grade **SHALL NOT** be assigned, raised, or lowered by SCI-004.  
5. SCI-003 Grade values **SHALL NOT** be required for Contradiction admissibility.

### 8.3 Relationship to Claim Standing (SCI-001)

1. A Claim **MAY** list this Contradiction in `contested_by` (SCI-001).  
2. Standing transition to `contested` **SHALL** remain owned by SCI-001 (Human Reviewer STE).  
3. Creation or `open` state of a Contradiction **SHALL NOT** by itself change any Claim Standing.

### 8.4 Permitted relationship summary

| Name | To | Cardinality | Rule |
|------|-----|-------------|------|
| `involves` | Claim id | 2..* | §8.1 |
| `cites_evidence` | Evidence id | 0..* | §8.2 |
| `resolved_via_note` | `resolution_note` string | 0..1 | Required when `record_state` is any `resolved_*` (§9.2) |

---

## 9. Contradiction Record State Machine (object-local)

### 9.0 Naming rule (ADR-0006)

1. **Contradiction Record State** is the only object-local state enum here.  
2. Workflow State **SHALL NOT** appear as Record State.  
3. Claim Standing **SHALL NOT** appear as Record State.  
4. The word **Lifecycle**, if used informatively, **SHALL NOT** name a third Contradiction enum.

### 9.1 Allowed States (SCI-000 import)

| State | Meaning |
|-------|---------|
| `open` | Conflict recorded; not resolved |
| `resolved_by_supersession` | Resolved via Claim supersession path (recorded; Standing changes remain SCI-001) |
| `resolved_by_scope_split` | Resolved by recognizing non-overlapping Scope (statement in `resolution_note`) |
| `resolved_by_retraction` | Resolved via Claim retraction path (Standing changes remain SCI-001) |
| `unresolved_archived` | Conflict retained without resolution |

**SCI-004 SHALL NOT** introduce additional Record States.

### 9.2 Allowed transitions

| From | To |
|------|-----|
| (new) | `open` |
| `open` | `resolved_by_supersession`, `resolved_by_scope_split`, `resolved_by_retraction`, `unresolved_archived` |

### 9.3 Forbidden transitions

| Forbidden | Reason |
|-----------|--------|
| Any `resolved_*` → `open` | Audit integrity; mint new Contradiction if reopened |
| `unresolved_archived` → `open` / `resolved_*` | Terminal archive for this id |
| Any → `ignored` | SCI-000 Forbidden |
| Any → Standing / Workflow / Evidence states | Orthogonality |
| AI-only transition out of `open` | §9.4 |

### 9.4 Record Transition Event — minimum fields (Contradiction-local)

Every Record State change except initial creation at `open` **SHALL** append an event with:

| Field | Rule |
|-------|------|
| `event_id` | Match `^crte:[A-Za-z0-9._~-]{1,128}$`; unique within the Contradiction |
| `at` | UTC `YYYY-MM-DDThh:mm:ssZ` |
| `from_state` | SCI-000 Contradiction Allowed State or exact `null` |
| `to_state` | SCI-000 Contradiction Allowed State |
| `authority_agent` | When leaving `open`, **SHALL** match `^human:[A-Za-z0-9._~-]{1,128}$` |
| `reason` | Non-empty string (length ≥ 1 after trim) |
| `decision_ref` | Non-empty when `to_state` ∈ resolved_* ∪ {`unresolved_archived`} |

Always mandatory: `event_id`, `at`, `from_state`, `to_state`, `authority_agent`, `reason`.

**Human Reviewer pattern (Contradiction-local):** `^human:[A-Za-z0-9._~-]{1,128}$`

**CRR-1:** If `record_state` ∈ resolved_*, `resolution_note` **SHALL** be a non-empty string after NFC + trim.  
**CRR-2:** Contradiction Record State changes **SHALL NOT** mutate Claim Standing fields.

**SHALL NOT** define a generic platform Event framework.

---

## 10. Provenance — minimum constituents

`provenance` **SHALL** be a structured object with:

| Field | Rule |
|-------|------|
| `completeness` | Exactly one of `complete`, `partial`, `missing` |
| `recorded_at` | UTC `YYYY-MM-DDThh:mm:ssZ` |
| `custody_agent` | Non-empty Agent identifier string |
| `method_summary` | Non-empty string after NFC + trim; if none, exact string `none` |

**SHALL NOT** define a platform-wide ProvenanceEnvelope standard here.

---

## 11. Admissibility Rules (machine-checkable)

**ADM-1:** `involved_claims` satisfies §8.1.  
**ADM-2:** `overlap_statement` and `incompatibility_statement` each length ≥ 1 after NFC + trim.  
**ADM-3:** `record_state` ∈ SCI-000 Contradiction Allowed States and not Forbidden.  
**ADM-4:** Preference-only or editorial disputes **without** propositional incompatibility **SHALL NOT** be encoded as conformant Contradiction *(test: `incompatibility_statement` after trim **SHALL NOT** equal the exact string `none` or `n/a`)*.  
**ADM-5:** Process disputes labeled only as “Conflict” without Claim ids **SHALL** be rejected (SCI-000: use Contradiction only for propositional clash).  
**ADM-6:** Evidence Grade **SHALL NOT** be an admissibility input.

---

## 12. Interpretation Rules

**IR-1:** Contradiction **SHALL NOT** automatically change Claim Standing.  
**IR-2:** Contradiction **SHALL NOT** invalidate, withdraw, or delete Evidence.  
**IR-3:** Contradiction **SHALL NOT** assign, raise, or lower Evidence Grade.  
**IR-4:** Contradiction **SHALL NOT** perform or imply Verification success/failure.  
**IR-5:** Contradiction **SHALL NOT** mean Workflow rejection or pipeline blockage.  
**IR-6:** Resolution Record States record **how the conflict object was closed**; they do **not** by themselves rewrite Claim Standing (SCI-001 remains owner).  
**IR-7:** Contradiction is not a Claim and not Evidence.

---

## 13. Immutability and material change

1. After a Contradiction Version is issued with `record_state=open` or any later state, the tuple  
   `(summary, involved_claims, overlap_statement, incompatibility_statement, evidence_refs, provenance)`  
   for that `contradiction_version` **SHALL** be immutable.  
2. Record State transitions **SHALL NOT** alter that tuple; they append Transition Events and MAY set `resolution_note` only when entering resolved_* (if `resolution_note` was empty). Changing an existing non-empty `resolution_note` **SHALL** be a material change.  
3. **Material change (deterministic):** NFC+trim inequality on any string field of the immutable tuple, or change to the ordered set of `involved_claims` / `evidence_refs` ids, **SHALL** be material.  
4. On material change, implementation **SHALL** mint a new `contradiction_version` (string **MUST** change) or a new `contradiction_id`.  
5. In-place overwrite of the immutable tuple **SHALL** be non-conformant.

---

## 14. Forbidden Behaviours

**SHALL NOT:**

1. Own or execute Claim Standing transitions.  
2. Own Evidence or Grade semantics.  
3. Use Record State `ignored`.  
4. Encode ClinicalDecision / Diagnosis / TreatmentRecommendation.  
5. Treat Contradiction as Verification.  
6. Merge Workflow State into Record State.  
7. Involve fewer than two distinct Claims.

---

## 15. Normative Invariants (summary)

1. `contradiction_id` satisfies §7.3.  
2. Pins / version satisfy §7.5.  
3. ADM-1…ADM-6 hold.  
4. IR-1…IR-7 hold.  
5. CRR-1/CRR-2 hold when applicable.  
6. Human Reviewer required to leave `open` (§9.4).  
7. Material immutability §13 holds.

---

## 16. Failure Modes

| ID | Failure | Detection |
|----|---------|-----------|
| F1 | Bad `contradiction_id` / pin / version | §7.3, §7.5 |
| F2 | Fewer than 2 Claims or duplicate Claim ids | §8.1 |
| F3 | Claim id fails SCI-001 pattern | §8.1 |
| F4 | Evidence ref fails SCI-002 pattern | §8.2 |
| F5 | Forbidden / foreign Record State | §7.2, §9.1 |
| F6 | Non-`human:` authority leaving `open` | §9.4 |
| F7 | `resolved_*` without `resolution_note` | §9.4 CRR-1 |
| F8 | In-place material overwrite | §13 |
| F9 | Empty overlap/incompatibility / `none` clash text | §11 |
| F10 | Auto Standing mutation by Contradiction write | §12 IR-1 |

---

## 17. Normative Examples

### Example A — Open Claim–Claim clash

| Field | Value |
|-------|--------|
| `contradiction_id` | `contradiction:dir-clash-001` |
| `ontology_ref` | `SCI-000@0.1.0` |
| `spec_ref` | `SCI-004@0.1.0` |
| `contradiction_version` | `1.0.0` |
| `record_state` | `open` |
| `summary` | Opposite direction claims under shared assay Scope |
| `involved_claims` | [`claim:alpha-001`, `claim:beta-002`] |
| `overlap_statement` | Both Claims assert applicability to protocol P-9 cohort C under identical bounds |
| `incompatibility_statement` | claim:alpha-001 asserts increase; claim:beta-002 asserts decrease of the same endpoint |
| `ethics_constraint_marker` | `non_clinical` |
| `provenance.completeness` | `complete` |
| `provenance.method_summary` | `manual_curation` |
| `evidence_refs` | [`evidence:snap-01`, `evidence:snap-02`] |

**Standing note:** Claims remain at whatever Standing SCI-001 currently holds until a Human Reviewer STE references `contradiction:dir-clash-001` in `contested_by`.

### Example B — Resolved by scope split

| Field | Value |
|-------|--------|
| `contradiction_id` | `contradiction:scope-split-014` |
| `record_state` | `resolved_by_scope_split` |
| `involved_claims` | [`claim:x-1`, `claim:x-2`] |
| `resolution_note` | Overlap withdrawn: claim:x-2 bounds exclude cohort C |
| Transition | `authority_agent=human:reviewer-03`, `decision_ref=dec:ctr-014` |

### Non-examples (non-conformant)

- Single Claim in `involved_claims`  
- `record_state=ignored`  
- Contradiction write that sets Claim `standing=contested` without SCI-001 STE  
- `grade_ref` assignment by Contradiction  
- `incompatibility_statement=none`

---

## 18. Acceptance Criteria (0.1.0)

1. SCI-000 Contradiction imported; Allowed States not extended; `ignored` forbidden.  
2. SCI-004 owns only Contradiction detail.  
3. ≥2 distinct Claim ids required; Claim id pattern imported from SCI-001 by reference.  
4. Optional Evidence refs import SCI-002 id pattern by reference; no Evidence invalidation.  
5. Grade not assigned; SCI-003 not required for admissibility.  
6. Record State ≠ Standing ≠ Workflow (ADR-0006).  
7. IR-1…IR-7: no auto Standing / no Evidence kill / no Grade / no Verification.  
8. Human Reviewer required to leave `open`.  
9. Material change deterministic; Contradiction-local ID/version/pins only.  
10. Normative examples + failure modes + conformance checklist present.  
11. No new specs, ADRs, ontology terms, shared frameworks, or AEB extraction.  
12. Self-review (§21) completed.

---

## 19. Conformance Checklist

A Contradiction encoding is conformant to **SCI-004@0.1.0** iff:

- [ ] §§7–15 invariants hold  
- [ ] `record_state` ∈ SCI-000 Contradiction Allowed States  
- [ ] `involved_claims` ≥ 2 distinct SCI-001-conformant Claim ids  
- [ ] ADM-1…ADM-6 hold  
- [ ] IR-1…IR-7 not violated  
- [ ] CRR-1/CRR-2 hold when applicable  
- [ ] No Standing mutation by this object alone  
- [ ] No Grade assignment  
- [ ] No API/schema/code required by this text  

---

## 20. Definition of Done

SCI-004 **0.1.0** text is complete when §18 Acceptance Criteria 1–12 hold for this document.

SCI-004 is **program DONE** only when review/approval gates pass under program rules.

**Current status:** Spec text complete → **READY FOR REVIEW** (SQR-ready).

---

## 21. Self-review

| Check | Result |
|-------|--------|
| Ownership respected (Contradiction only) | **PASS** |
| No ontology changes | **PASS** |
| No governance changes | **PASS** |
| No architectural changes | **PASS** |
| KEEP LOCAL (id/version/pins/events/human/AI/material-change) | **PASS** |
| No new shared standards / ADR / framework extraction | **PASS** |
| Deterministic + machine-testable SHALLs | **PASS** |
| Clean integration with SCI-001/002/003 (by reference; non-interference) | **PASS** |
| ADR-0006 orthogonality | **PASS** |
| No AEB required to publish this spec | **PASS** |

### Known Limitations

1. Overlap/incompatibility are free-text statements (semantic equivalence undecidable beyond NFC+trim).  
2. Does not auto-sync Claim `contested_by` or Standing (SCI-001 owns those).  
3. Does not detect contradictions algorithmically.  
4. Resolution states do not themselves mutate Claims.  
5. SCI-001 may still accept non-prefixed Contradiction ids until a future Claim-local interoperability patch (out of scope here).  
6. Duplicated local patterns (`human:`, pins, SemVer) retained pending future AEB after demonstrated reuse.

### Conflicts

**None requiring STOP.** SCI-000 ownership matrix respected; Standing/Evidence/Grade untouched; EDR Option A (Supported meaning) unaffected.

---

*End of SCI-004 Scientific Contradiction Object Specification v0.1.0*

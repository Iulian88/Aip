# SCI-005 Scientific Negative Result Object Specification v0.1.0

| Field | Value |
|-------|--------|
| **Spec ID** | SCI-005 |
| **Artifact ID** | SPEC-OBJ-NEGATIVE-RESULT-001 |
| **Version** | **0.1.0** |
| **Status** | READY FOR REVIEW |
| **Ontology pin** | SCI-000 Core Scientific Ontology **v0.1.0** (PROVISIONAL APPROVED) |
| **Claim pin** | SCI-001@0.1.3 (Claim Identifier by reference) |
| **Evidence pin** | SCI-002@0.1.0 (Evidence Identifier by reference) |
| **Grade pin** | SCI-003@0.1.0 (non-interference only) |
| **Contradiction pin** | SCI-004@0.1.0 (Contradiction Identifier by reference; optional refs) |
| **Architecture pin** | ADR-0006 (ACCEPTED) — Negative Result Record State ≠ Workflow ≠ Claim Standing |
| **Normative language** | RFC 2119: SHALL / SHALL NOT / MUST / MUST NOT / SHOULD / MAY |

---

## 0. Normative Changelog (initial)

| ID | Change |
|----|--------|
| N1 | Initial Negative Result object normative structure |
| N2 | Negative Result-local Identifier, Version, and pin rules |
| N3 | Record State machine using SCI-000 Allowed States only (`registered`, `withdrawn`) |
| N4 | Expectation / absence / Scope / Protocol / provenance minimum constituents |
| N5 | Relationships to Claim, Evidence, optional Contradiction; Verification refs deferred-safe |
| N6 | Interpretation: null/non-detection ≠ false/refuted/unsupported Standing |
| N7 | Transition events; Human Reviewer for epistemic promotion; AI shall not promote |
| N8 | Machine-testable invariants, failure modes, examples, conformance checklist |

**Not in this specification:** Claim Standing; Evidence/Grade/Contradiction/Verification internals; Workflow; shared Identifier/Version frameworks; APIs/schemas/code; SCI-006.

---

## 1. Purpose

This document is the **constitutional normative specification** of the SciROS **Negative Result** object.

It defines Negative Result structure, Record State, identity, metadata, provenance, relationships, invariants, transitions, and interpretation—without owning Claim, Standing, Evidence, Evidence Grade, Contradiction, or Verification.

A Negative Result documents that an **expected** observation, relationship, hypothesis prediction, detection, or effect was **not obtained** under a declared Protocol and Scope context.

Negative Result preserves scientifically meaningful **nulls and non-detections** as archival citizens. It does **not** by itself refute Claims, invalidate Evidence, assign Grades, or change Standing.

---

## 2. Scope

1. Normative structure and invariants of Negative Result (Knowledge Object per SCI-000).  
2. Negative Result Record State machine (SCI-000 Allowed States only).  
3. Negative Result-local Identifier, Version, and pin rules.  
4. Expectation, absence, Scope, Protocol, and provenance constituents.  
5. Relationships to Claim / Evidence / optional Contradiction (and Verification refs without owning Verification).  
6. Interpretation rules (non-escalation / non-laundering).  
7. Conformance requirements for Negative Result encodings.

---

## 3. Out of Scope

1. Claim object internals or Standing transitions (SCI-001).  
2. Evidence structure, invalidation, or Record State (SCI-002).  
3. Evidence Grade assignment (SCI-003).  
4. Contradiction internals (SCI-004).  
5. Verification object (SCI-006 — not defined here).  
6. Workflow State (ADR-0006; Program Execution).  
7. Confidence scores; clinical diagnosis / treatment / patient risk.  
8. Global Identifier / Version / ethics frameworks.  
9. Absence of evidence without Protocol (“we didn’t look”) — non-admissible.  
10. APIs, JSON Schema, databases, classes, UI, storage, source code.

---

## 4. Normative References

| Reference | Role |
|-----------|------|
| **SCI-000 v0.1.0** | Vocabulary authority (Negative Result term + Allowed States) |
| **SCI-001 v0.1.3** | Claim Identifier (by reference) |
| **SCI-002 v0.1.0** | Evidence Identifier (by reference) |
| **SCI-003 v0.1.0** | Grade non-interference |
| **SCI-004 v0.1.0** | Contradiction Identifier (by reference; optional) |
| **ADR-0006** | Record State ≠ Workflow State |

This specification **SHALL NOT** redefine Canonical Names owned by SCI-000.  
This specification **SHALL NOT** set or modify Claim Standing, Evidence Grade, Evidence validity, Contradiction Record State, or Verification outcomes.  
This specification **SHALL NOT** redefine Identifier grammars owned by SCI-001, SCI-002, or SCI-004.

---

## 5. Dependencies

| Dependency | Requirement |
|------------|-------------|
| SCI-000@0.1.0 | MUST be provisionally approved or approved |
| SCI-001@0.1.3 | MUST exist for Claim id pattern when `claim_refs` used |
| SCI-002@0.1.0 | MUST exist for Evidence id pattern when `evidence_refs` used |
| SCI-004@0.1.0 | MUST exist when `contradiction_refs` used |
| SCI-003@0.1.0 | NOT required for Negative Result issuance |
| SCI-006 | NOT required; Verification Identifier not owned here |

---

## 6. Concept Ownership

| Concept | Vocabulary | Detail |
|---------|------------|--------|
| Negative Result | SCI-000 | **SCI-005** |
| Claim / Standing | SCI-000 | **SCI-001** |
| Evidence | SCI-000 | **SCI-002** |
| Evidence Grade | SCI-000 | **SCI-003** |
| Contradiction | SCI-000 | **SCI-004** |
| Verification | SCI-000 | **SCI-006** (absent; refs only) |
| Workflow State | — | Program Execution; **not** SCI-005 |

---

## 7. Definition

Per SCI-000:

> **Negative Result** — A first-class report that a predicted effect, difference, detection, or Claim support was not obtained under a declared Protocol, search space, and power/sensitivity context.

**SCI-005 refinement (non-redefining):**  
A Negative Result is an independent Knowledge Object stating an **expected observation** and the **observed absence** under explicit Scope and Protocol context. It may qualify or challenge Claims by reference only. It **SHALL NOT** mean the Claim is false, refuted, invalid, wrong, unsupported, or withdrawn.

### 7.1 Mandatory logical constituents

A Negative Result **SHALL** include all of:

| Constituent | Normative rule |
|-------------|----------------|
| `negative_result_id` | §7.3 |
| `ontology_ref` | §7.5 |
| `spec_ref` | §7.5 |
| `negative_result_version` | §7.5 |
| `record_state` | Exactly one SCI-000 Negative Result Allowed State (§9.1) |
| `summary` | Non-empty Unicode string after NFC; length ≥ 1 after trim |
| `description` | Non-empty Unicode string after NFC; length ≥ 1 after trim |
| `expected_observation` | Non-empty string after NFC + trim (what was predicted / sought) |
| `observed_absence` | Non-empty string after NFC + trim (what was not obtained) |
| `scope` | §8 |
| `protocol_ref` | Non-empty string after NFC + trim (declared Protocol / search-space anchor) |
| `sensitivity_context` | Non-empty string after NFC + trim (power/sensitivity/threshold context; if none quantified, **SHALL** be exact `undeclared_sensitivity`) |
| `provenance` | §10 |
| `ethics_constraint_marker` | §7.4 |
| `created_by` | Non-empty Agent identifier string |
| `created_at` | UTC `YYYY-MM-DDThh:mm:ssZ` |

Optional (MAY): `claim_refs[]` (§11.1), `evidence_refs[]` (§11.2), `contradiction_refs[]` (§11.3), `verification_refs[]` (§11.4), `ai_assisted` (§7.6), `human_sponsor` (§7.6), `record_transition_log[]` (§9.4), `withdrawal_reason` (§9.2).

### 7.2 Forbidden Record States and meanings

`record_state` **SHALL NOT** be any Claim Standing value.  
`record_state` **SHALL NOT** be any Workflow State value (ADR-0006).  
`record_state` **SHALL NOT** be any Evidence, Contradiction, or Grade label value.  
Encodings **SHALL NOT** use `unpublished_because_boring` as a normative loss/state (SCI-000 Forbidden normative loss).

### 7.3 Negative Result Identifier — object-local rules

1. `negative_result_id` **SHALL** match: `^negresult:[A-Za-z0-9._~-]{1,128}$`  
2. Within one implementing system’s Negative Result store, `negative_result_id` **SHALL** be unique.  
3. `negative_result_id` **SHALL NOT** change across Record State transitions.  
4. `negative_result_id` **SHALL NOT** change across `negative_result_version` increments on the same identity lineage.  
5. These rules are **Negative Result-local**. This document **SHALL NOT** define a global SciROS Identifier standard.

**Test:** Reject any Negative Result whose `negative_result_id` fails the regex or collides within the store.

### 7.4 Ethics Constraint marker (Negative Result-local only)

1. `ethics_constraint_marker` **SHALL** be exactly the string `non_clinical`.  
2. This specification **SHALL NOT** define an ethics vocabulary or lexicon.

### 7.5 Pins and Version strings (Negative Result-local only)

| Field | Pattern | Example |
|-------|---------|---------|
| `ontology_ref` | `^SCI-000@0\.1\.[0-9]+$` | `SCI-000@0.1.0` |
| `spec_ref` | `^SCI-005@0\.1\.[0-9]+$` | `SCI-005@0.1.0` |
| `negative_result_version` | `^[0-9]+\.[0-9]+\.[0-9]+$` | `1.0.0` |

1. On issuance, `negative_result_version` **SHALL** be set.  
2. First issued Version **SHALL** use `1.0.0` unless a documented migration Decision states otherwise.  
3. Pin/version rules are **Negative Result-local** (no shared Version framework).

### 7.6 AI authorship markers (Negative Result-local)

1. `ai_assisted` **SHALL** be boolean when present.  
2. If `ai_assisted` is `true`, `human_sponsor` **SHALL** be a non-empty Agent identifier string.  
3. An AI Agent **SHALL NOT** be `authority_agent` on any Negative Result Transition Event that sets or confirms `record_state=registered`, or that transitions to `withdrawn` (§9.4).  
4. Epistemic promotion to a conformant `registered` Negative Result **SHALL** require a Human Reviewer Transition Event (§9.4).

---

## 8. Scope — minimum constituents (Negative Result-local)

`scope` **SHALL** be a structured object with **exactly** these mandatory fields (all strings, NFC, trimmed; each length ≥ 1):

| Field | Meaning |
|-------|---------|
| `domain_context` | Scientific context of the search/assay |
| `bounds` | Positive applicability bounds / search space bounds |
| `exclusions` | Explicit exclusions; if none, **SHALL** be the exact string `none` |

**Equivalence (Scope):** Two Scopes are equal iff `(domain_context, bounds, exclusions)` are pairwise string-equal after NFC + trim.

**SHALL NOT:** define reusable Scope profiles or Claim Scope ownership. This Scope is **Negative Result-local**.

---

## 9. Negative Result Record State Machine (object-local)

### 9.0 Naming rule (ADR-0006)

1. **Negative Result Record State** is the only object-local state enum here.  
2. Workflow State **SHALL NOT** appear as Record State.  
3. Claim Standing **SHALL NOT** appear as Record State.  
4. The word **Lifecycle**, if used informatively, **SHALL NOT** name a third Negative Result enum.

### 9.1 Allowed States (SCI-000 import)

| State | Meaning |
|-------|---------|
| `registered` | Negative Result accepted into scientific memory under declared Protocol/Scope |
| `withdrawn` | Negative Result withdrawn; history retained |

**SCI-005 SHALL NOT** introduce additional Record States.

### 9.2 Allowed transitions

| From | To |
|------|-----|
| (new) | `registered` |
| `registered` | `withdrawn` |

If `record_state=withdrawn`, `withdrawal_reason` **SHALL** be a non-empty string after NFC + trim.

### 9.3 Forbidden transitions

| Forbidden | Reason |
|-----------|--------|
| `withdrawn` → `registered` | Terminal for this id; mint new Negative Result if reopening |
| Any → Standing / Workflow / Evidence / Contradiction states | Orthogonality |
| AI-only registration or withdrawal | §9.4 |
| Issuance without Protocol (`protocol_ref` empty) | SCI-000 Out of Scope / ADM |

### 9.4 Negative Result Transition Event — minimum fields (object-local)

Every issuance at `registered` and every change to `withdrawn` **SHALL** append an event with:

| Field | Rule |
|-------|------|
| `event_id` | Match `^nrte:[A-Za-z0-9._~-]{1,128}$`; unique within the Negative Result |
| `at` | UTC `YYYY-MM-DDThh:mm:ssZ` |
| `from_state` | SCI-000 Negative Result Allowed State or exact `null` for first registration |
| `to_state` | SCI-000 Negative Result Allowed State |
| `authority_agent` | **SHALL** match `^human:[A-Za-z0-9._~-]{1,128}$` |
| `reason` | Non-empty string (length ≥ 1 after trim) |
| `decision_ref` | Non-empty string (length ≥ 1 after trim) |

Always mandatory: `event_id`, `at`, `from_state`, `to_state`, `authority_agent`, `reason`, `decision_ref`.

**Human Reviewer pattern (Negative Result-local):** `^human:[A-Za-z0-9._~-]{1,128}$`

**NRR-1:** `record_state=registered` **MAY** hold only if ≥1 Transition Event exists with `to_state=registered` and Human Reviewer `authority_agent`.  
**NRR-2:** Negative Result Transition Events **SHALL NOT** mutate Claim Standing, Evidence Grade, Evidence Record State, Contradiction Record State, or Verification outcomes.

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

## 11. Relationships

### 11.1 Claim references (optional)

If `claim_refs` is present:

1. It **SHALL** be an array of Claim id strings.  
2. Every entry **SHALL** match **SCI-001@0.1.3 §7.3** by reference (not redefined here).  
3. Presence **SHALL NOT** change Claim Standing, proposition, or scope.  
4. Presence **SHALL NOT** mean the Claim is false, refuted, invalid, wrong, unsupported, or withdrawn.

### 11.2 Evidence references (optional)

If `evidence_refs` is present:

1. Every entry **SHALL** match **SCI-002@0.1.0 §7.3** by reference.  
2. Presence **SHALL NOT** invalidate, withdraw, or re-grade Evidence.  
3. Evidence Grade **SHALL NOT** be assigned or modified by SCI-005.

### 11.3 Contradiction references (optional)

If `contradiction_refs` is present:

1. Every entry **SHALL** match **SCI-004@0.1.0 §7.3** by reference.  
2. Presence **SHALL NOT** change Contradiction Record State or Claim Standing.

### 11.4 Verification references (optional; Verification not owned)

If `verification_refs` is present:

1. Each entry **SHALL** be a non-empty string after NFC + trim.  
2. SCI-005 **SHALL NOT** define Verification Identifier grammar.  
3. When SCI-006 is approved, conformant encodings **SHALL** apply SCI-006 Identifier rules by reference for these entries.  
4. Presence **SHALL NOT** set or modify Verification outcomes.

### 11.5 Permitted relationship summary

| Name | To | Cardinality | Rule |
|------|-----|-------------|------|
| `qualifies_or_challenges` | Claim id | 0..* | §11.1 |
| `cites_evidence` | Evidence id | 0..* | §11.2 |
| `related_contradiction` | Contradiction id | 0..* | §11.3 |
| `related_verification` | Verification ref | 0..* | §11.4 |
| `produced_under` | `protocol_ref` | 1..1 | §7.1 |

### 11.6 Forbidden relationship behaviours

**SHALL NEVER:**

1. Change Standing.  
2. Change Evidence Grade.  
3. Change Verification.  
4. Change Claim meaning (proposition/scope).  
5. Invalidate Evidence.  
6. Invalidate Contradiction.

---

## 12. Semantics (normative interpretation)

A Negative Result documents one or more of:

- absence of expected observation  
- absence of expected effect  
- failure to reproduce (as reported absence under Protocol—not Verification ownership)  
- failure to detect  
- null finding  
- non-confirmation  

**IR-1:** Negative Result **SHALL NOT** automatically mean the Claim is `false`.  
**IR-2:** Negative Result **SHALL NOT** automatically mean `refuted`.  
**IR-3:** Negative Result **SHALL NOT** automatically mean `invalid` or `wrong`.  
**IR-4:** Negative Result **SHALL NOT** automatically mean Standing `unsupported` / `draft_unverified` / `retracted` / `contested`.  
**IR-5:** Negative Result **SHALL NOT** mean Workflow failure.  
**IR-6:** Negative Result **SHALL NOT** assign Evidence Grade or override SCI-003.  
**IR-7:** “We did not look” without non-empty `protocol_ref` **SHALL** be non-conformant (ADM-1).  
**IR-8:** Negative Result is not Claim, Evidence, Contradiction, or Verification.

---

## 13. Admissibility Rules (machine-checkable)

**ADM-1:** `protocol_ref` length ≥ 1 after NFC + trim.  
**ADM-2:** `expected_observation` and `observed_absence` each length ≥ 1 after NFC + trim; neither **SHALL** equal exact `none` or `n/a`.  
**ADM-3:** `scope` satisfies §8.  
**ADM-4:** `record_state` ∈ {`registered`,`withdrawn`}.  
**ADM-5:** NRR-1 holds when `registered`.  
**ADM-6:** Evidence Grade **SHALL NOT** be an admissibility input.  
**ADM-7:** Claim Standing **SHALL NOT** be an admissibility input.

---

## 14. Immutability and material change

1. After a Negative Result Version is issued with `record_state=registered`, the tuple  
   `(summary, description, expected_observation, observed_absence, scope, protocol_ref, sensitivity_context, provenance, claim_refs, evidence_refs, contradiction_refs, verification_refs)`  
   for that `negative_result_version` **SHALL** be immutable.  
2. Transition to `withdrawn` **SHALL NOT** alter that tuple; it appends a Transition Event and sets `withdrawal_reason`.  
3. **Material change (deterministic):** NFC+trim inequality on any string field of the immutable tuple, Scope inequality per §8, or change to any referenced id set **SHALL** be material.  
4. On material change, implementation **SHALL** mint a new `negative_result_version` (string **MUST** change) or a new `negative_result_id`.  
5. In-place overwrite of the immutable tuple **SHALL** be non-conformant.

---

## 15. Normative Invariants (summary)

1. `negative_result_id` satisfies §7.3.  
2. Pins / version satisfy §7.5.  
3. ADM-1…ADM-7 hold.  
4. IR-1…IR-8 hold.  
5. NRR-1/NRR-2 hold.  
6. Relationship integrity §11 holds; no ownership leakage.  
7. No Standing / Grade / Verification mutation by this object.  
8. Material immutability §14 holds.  
9. Human Reviewer required for registration and withdrawal.  
10. ADR-0006 orthogonality holds.

---

## 16. Failure Modes

| ID | Failure | Detection |
|----|---------|-----------|
| F1 | Bad `negative_result_id` / pin / version | §7.3, §7.5 |
| F2 | Empty Protocol / expectation / absence | §13 ADM-1/ADM-2 |
| F3 | Scope missing field / empty | §8 |
| F4 | Forbidden / foreign Record State | §7.2, §9.1 |
| F5 | Non-`human:` authority on NRTE | §9.4 |
| F6 | `registered` without NRR-1 event | §9.4 |
| F7 | `withdrawn` without `withdrawal_reason` | §9.2 |
| F8 | Claim/Evidence/Contradiction id pattern fail | §11 |
| F9 | In-place material overwrite | §14 |
| F10 | Standing / Grade / Verification mutation by NR write | §11.6, §12 |
| F11 | `ethics_constraint_marker` ≠ `non_clinical` | §7.4 |

---

## 17. Normative Examples

### Example A — Valid registered null detection

| Field | Value |
|-------|--------|
| `negative_result_id` | `negresult:decoy-null-001` |
| `ontology_ref` | `SCI-000@0.1.0` |
| `spec_ref` | `SCI-005@0.1.0` |
| `negative_result_version` | `1.0.0` |
| `record_state` | `registered` |
| `summary` | No planted mimics recovered above threshold T on decoy set D |
| `description` | Under Protocol P-decoy-1, search recovered zero hits above T |
| `expected_observation` | ≥1 planted mimic above threshold T |
| `observed_absence` | Zero mimics above T on decoy set D |
| `scope.domain_context` | synthetic decoy recovery benchmark |
| `scope.bounds` | decoy set D; threshold T; Protocol P-decoy-1 |
| `scope.exclusions` | none |
| `protocol_ref` | `protocol:P-decoy-1` |
| `sensitivity_context` | threshold T as declared in Protocol P-decoy-1 |
| `ethics_constraint_marker` | `non_clinical` |
| `claim_refs` | [`claim:example-recovery-01`] |
| `evidence_refs` | [`evidence:run-table-09`] |
| NRTE | `authority_agent=human:reviewer-02`, `decision_ref=dec:nr-001`, `to_state=registered` |

### Example B — Valid withdrawal

| Field | Value |
|-------|--------|
| `negative_result_id` | `negresult:assay-null-014` |
| `record_state` | `withdrawn` |
| `withdrawal_reason` | Protocol P-9 mis-specified search space; superseded by negresult:assay-null-015 |
| Transition | `from_state=registered`, `to_state=withdrawn`, `authority_agent=human:reviewer-02` |

### Example C — Edge case: undeclared numeric power

| Field | Value |
|-------|--------|
| `sensitivity_context` | `undeclared_sensitivity` |
| Note | Allowed; does not waive Protocol or expectation/absence fields |

### Invalid examples (non-conformant)

| Case | Why |
|------|-----|
| Empty `protocol_ref` (“we didn’t look”) | ADM-1 / SCI-000 Out of Scope |
| `observed_absence=none` | ADM-2 |
| `record_state=draft_unverified` | Standing leakage / forbidden state |
| AI `authority_agent` on registration NRTE | §9.4 |
| Writing Claim `standing=retracted` from Negative Result | IR-4 / §11.6 |
| Assigning `grade_ref` from Negative Result | IR-6 |
| `unpublished_because_boring` as state | §7.2 |

---

## 18. Acceptance Criteria (0.1.0)

1. SCI-000 Negative Result imported; Allowed States not extended.  
2. SCI-005 owns only Negative Result detail.  
3. Identifier / version / pins Negative Result-local and testable.  
4. Scope + Protocol + expectation/absence mandatory and testable.  
5. Record State ∈ {`registered`,`withdrawn`}; ADR-0006 respected.  
6. Human Reviewer required for registration and withdrawal; AI shall not promote.  
7. Claim/Evidence/Contradiction ids imported by reference; Verification refs non-owning.  
8. IR-1…IR-8: no Standing/Grade/Verification/Evidence invalidation laundering.  
9. Material change deterministic.  
10. Failure modes + examples + conformance checklist present.  
11. No new specs, ADRs, ontology terms, shared frameworks, extraction, or code.  
12. Self-review (§21) completed.

---

## 19. Conformance Checklist

A Negative Result encoding is conformant to **SCI-005@0.1.0** iff:

- [ ] §§7–15 invariants hold  
- [ ] `record_state` ∈ {`registered`,`withdrawn`}  
- [ ] ADM-1…ADM-7 hold  
- [ ] IR-1…IR-8 not violated  
- [ ] NRR-1/NRR-2 hold  
- [ ] Relationship integrity §11 holds  
- [ ] No Standing / Grade / Verification mutation  
- [ ] No Evidence / Contradiction invalidation  
- [ ] Material immutability §14 holds  
- [ ] No API/schema/code required by this text  

---

## 20. Definition of Done

SCI-005 **0.1.0** text is complete when §18 Acceptance Criteria 1–12 hold for this document.

SCI-005 is **program DONE** only when review/approval gates pass under program rules.

**Current status:** Spec text complete → **READY FOR REVIEW**.

---

## 21. Self-review

| Check | Result |
|-------|--------|
| SCI-000 respected | **PASS** |
| SCI-001 respected (Claim id by reference; Standing untouched) | **PASS** |
| SCI-002 respected (Evidence id by reference; no invalidation) | **PASS** |
| SCI-003 respected (Grade non-interference) | **PASS** |
| SCI-004 respected (Contradiction id by reference) | **PASS** |
| ADR-0006 respected | **PASS** |
| KEEP LOCAL respected | **PASS** |
| No ownership theft | **PASS** |
| No ontology / governance / architecture modification | **PASS** |
| No ADR / extraction / shared standards / code | **PASS** |
| Deterministic machine-testable SHALLs | **PASS** |

### Known Limitations

1. Free-text expectation/absence/sensitivity (NFC+trim only).  
2. Does not auto-update Claim `nullified_or_qualified_by` (SCI-001 owns Claim relationships).  
3. Verification Identifier deferred until SCI-006.  
4. No algorithmic null-detection.  
5. Local pattern duplication (`human:`, pins, SemVer) retained pending future AEB after demonstrated reuse.

### Conflicts

**None requiring STOP.**

---

*End of SCI-005 Scientific Negative Result Object Specification v0.1.0*

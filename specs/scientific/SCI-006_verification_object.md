# SCI-006 Scientific Verification Object Specification v0.1.0

| Field | Value |
|-------|--------|
| **Spec ID** | SCI-006 |
| **Artifact ID** | SPEC-OBJ-VERIFICATION-001 |
| **Version** | **0.1.0** |
| **Status** | READY FOR REVIEW |
| **Ontology pin** | SCI-000 Core Scientific Ontology **v0.1.0** (PROVISIONAL APPROVED) |
| **Claim pin** | SCI-001@0.1.3 (Claim Identifier by reference) |
| **Evidence pin** | SCI-002@0.1.0 (Evidence Identifier by reference) |
| **Grade pin** | SCI-003@0.1.0 (terminology non-interference; Grade not assigned here) |
| **Contradiction pin** | SCI-004@0.1.0 (Contradiction Identifier by reference; optional) |
| **Negative Result pin** | SCI-005@0.1.0 (Negative Result Identifier by reference; optional) |
| **Architecture pin** | ADR-0006 (ACCEPTED) — Verification Record State ≠ Workflow ≠ Claim Standing |
| **Normative language** | RFC 2119: SHALL / SHALL NOT / MUST / MUST NOT / SHOULD / MAY |

---

## 0. Normative Changelog (initial)

| ID | Change |
|----|--------|
| N1 | Initial Verification object normative structure |
| N2 | Verification-local Identifier, Version, and pin rules |
| N3 | Record State machine using SCI-000 Verification Allowed States only |
| N4 | Verification Outcome vocabulary (object-local; aligned to SCI-000 states) |
| N5 | Scope, Protocol, Method, Context, Rationale, provenance |
| N6 | Relationships to Claim/Evidence; optional Contradiction/Negative Result; Grade reference-only |
| N7 | Non-interference: no Standing/Evidence/Grade/Contradiction/NR mutation |
| N8 | VTE; Human Reviewer for epistemic promotion; AI shall not promote |
| N9 | Machine-testable invariants, failure modes, examples, conformance checklist |

**Not in this specification:** Claim Standing; Evidence/Grade/Contradiction/Negative Result internals; Validation (SCI-000 distinct); Workflow; shared Identifier/Version frameworks; APIs/schemas/code.

---

## 1. Purpose

This document is the **constitutional normative specification** of the SciROS **Verification** object.

It defines Verification structure, Record State, Outcome, identity, metadata, provenance, rationale, relationships, invariants, transitions, and interpretation—without owning Claim, Standing, Evidence, Evidence Grade, Contradiction, or Negative Result.

Verification answers only:

> Has this Claim (and/or cited Evidence/artifact) been scientifically verified under the stated Scope and Protocol?

Verification records the **outcome of a verification process**. It does **not** declare biological truth, scientific certainty, clinical validity, or Standing.

---

## 2. Scope

1. Normative structure and invariants of Verification (Knowledge Object per SCI-000).  
2. Verification Record State machine (SCI-000 Allowed States only).  
3. Verification Outcome vocabulary (object-local; not Standing/Workflow).  
4. Verification-local Identifier, Version, and pin rules.  
5. Scope, Protocol, Method, Context, Rationale, and provenance constituents.  
6. Relationships to Claim / Evidence / optional Contradiction / optional Negative Result.  
7. Non-interference and interpretation rules.  
8. Conformance requirements for Verification encodings.

---

## 3. Out of Scope

1. Claim object internals or Standing transitions (SCI-001).  
2. Evidence structure or invalidation (SCI-002).  
3. Evidence Grade assignment (SCI-003).  
4. Contradiction / Negative Result internals (SCI-004 / SCI-005).  
5. Validation purpose-fitness (SCI-000 Validation; VAL / MEP P4).  
6. Workflow State (ADR-0006; Program Execution).  
7. Confidence scores; clinical diagnosis / treatment / patient risk; ultimate truth.  
8. Global Identifier / Version / ethics frameworks.  
9. APIs, JSON Schema, databases, classes, UI, storage, source code.

---

## 4. Normative References

| Reference | Role |
|-----------|------|
| **SCI-000 v0.1.0** | Vocabulary authority (Verification / Reproduction terms + Allowed States) |
| **SCI-001 v0.1.3** | Claim Identifier (by reference) |
| **SCI-002 v0.1.0** | Evidence Identifier (by reference) |
| **SCI-003 v0.1.0** | Grade terminology non-interference |
| **SCI-004 v0.1.0** | Contradiction Identifier (by reference; optional) |
| **SCI-005 v0.1.0** | Negative Result Identifier (by reference; optional) |
| **ADR-0006** | Record State ≠ Workflow State |

This specification **SHALL NOT** redefine Canonical Names owned by SCI-000.  
This specification **SHALL NOT** set or modify Claim Standing, Evidence, Evidence Grade, Contradiction, or Negative Result.  
This specification **SHALL NOT** redefine Identifier grammars owned by SCI-001, SCI-002, SCI-004, or SCI-005.

---

## 5. Dependencies

| Dependency | Requirement |
|------------|-------------|
| SCI-000@0.1.0 | MUST be provisionally approved or approved |
| SCI-001@0.1.3 | MUST exist when `claim_refs` used |
| SCI-002@0.1.0 | MUST exist when `evidence_refs` used |
| SCI-004@0.1.0 | MUST exist when `contradiction_refs` used |
| SCI-005@0.1.0 | MUST exist when `negative_result_refs` used |
| SCI-003@0.1.0 | NOT required for Verification issuance; Grade not assigned here |

---

## 6. Concept Ownership

| Concept | Vocabulary | Detail |
|---------|------------|--------|
| Verification | SCI-000 | **SCI-006** |
| Reproduction (mode) | SCI-000 | **SCI-006** (as verification method mode only) |
| Claim / Standing | SCI-000 | **SCI-001** |
| Evidence | SCI-000 | **SCI-002** |
| Evidence Grade | SCI-000 | **SCI-003** |
| Contradiction | SCI-000 | **SCI-004** |
| Negative Result | SCI-000 | **SCI-005** |
| Validation | SCI-000 | VAL / MEP (not SCI-006) |
| Workflow State | — | Program Execution; **not** SCI-006 |

---

## 7. Definition

Per SCI-000:

> **Verification** — An activity and resulting record that checks whether a Claim, Evidence object, or computational artifact conforms to stated methods, envelopes, or reproduction procedures.

**SCI-006 refinement (non-redefining):**  
A Verification is an independent Knowledge Object that records whether a verification process, under declared Scope and Protocol, yielded a Verification Outcome. It is an operational audit of conformance/replay—not a declaration of truth.

### 7.1 Mandatory logical constituents

A Verification **SHALL** include all of:

| Constituent | Normative rule |
|-------------|----------------|
| `verification_id` | §7.3 |
| `ontology_ref` | §7.5 |
| `spec_ref` | §7.5 |
| `verification_version` | §7.5 |
| `record_state` | Exactly one SCI-000 Verification Allowed State (§9.1) |
| `verification_outcome` | §8 |
| `summary` | Non-empty Unicode string after NFC; length ≥ 1 after trim |
| `description` | Non-empty Unicode string after NFC; length ≥ 1 after trim |
| `scope` | §10 |
| `protocol_ref` | Non-empty string after NFC + trim |
| `verification_method` | §7.7 |
| `verification_context` | Non-empty string after NFC + trim |
| `verification_rationale` | Non-empty string after NFC + trim |
| `provenance` | §12 |
| `ethics_constraint_marker` | §7.4 |
| `created_by` | Non-empty Agent identifier string |
| `created_at` | UTC `YYYY-MM-DDThh:mm:ssZ` |

Optional (MAY): `claim_refs[]` (§11.1), `evidence_refs[]` (§11.2), `grade_refs[]` (§11.3), `contradiction_refs[]` (§11.4), `negative_result_refs[]` (§11.5), `artifact_ref` (non-empty string if present), `ai_assisted` (§7.6), `human_sponsor` (§7.6), `record_transition_log[]` (§9.4).

**Target rule (ADM-T1):** At least one of `claim_refs` (length ≥ 1) or `evidence_refs` (length ≥ 1) or `artifact_ref` (present non-empty) **SHALL** hold.

### 7.2 Forbidden Record States and meanings

`record_state` **SHALL NOT** be `truth_confirmed` (SCI-000 Forbidden).  
`record_state` **SHALL NOT** be any Claim Standing value.  
`record_state` **SHALL NOT** be any Workflow State value (ADR-0006).  
`record_state` **SHALL NOT** be any Evidence / Contradiction / Negative Result Record State value.  
`verification_outcome` **SHALL NOT** be any Standing or Workflow value.

### 7.3 Verification Identifier — object-local rules

1. `verification_id` **SHALL** match: `^verification:[A-Za-z0-9._~-]{1,128}$`  
2. Within one implementing system’s Verification store, `verification_id` **SHALL** be unique.  
3. `verification_id` **SHALL NOT** change across Record State transitions.  
4. `verification_id` **SHALL NOT** change across `verification_version` increments on the same identity lineage.  
5. These rules are **Verification-local**. This document **SHALL NOT** define a global SciROS Identifier standard.

**Test:** Reject any Verification whose `verification_id` fails the regex or collides within the store.

### 7.4 Ethics Constraint marker (Verification-local only)

1. `ethics_constraint_marker` **SHALL** be exactly the string `non_clinical`.  
2. This specification **SHALL NOT** define an ethics vocabulary or lexicon.

### 7.5 Pins and Version strings (Verification-local only)

| Field | Pattern | Example |
|-------|---------|---------|
| `ontology_ref` | `^SCI-000@0\.1\.[0-9]+$` | `SCI-000@0.1.0` |
| `spec_ref` | `^SCI-006@0\.1\.[0-9]+$` | `SCI-006@0.1.0` |
| `verification_version` | `^[0-9]+\.[0-9]+\.[0-9]+$` | `1.0.0` |

1. On issuance, `verification_version` **SHALL** be set.  
2. First issued Version **SHALL** use `1.0.0` unless a documented migration Decision states otherwise.  
3. Each verification attempt **SHALL** be a distinct record identity or a new `verification_version` (SCI-000: each attempt is a new record).  
4. Pin/version rules are **Verification-local** (no shared Version framework).

### 7.6 AI authorship markers (Verification-local)

1. `ai_assisted` **SHALL** be boolean when present.  
2. If `ai_assisted` is `true`, `human_sponsor` **SHALL** be a non-empty Agent identifier string.  
3. An AI Agent **SHALL NOT** be `authority_agent` on any VTE that sets `record_state` ∈ {`passed`,`failed`,`inconclusive`} (§9.4).  
4. Epistemic promotion from `planned` to any terminal outcome state **SHALL** require a Human Reviewer VTE (§9.4).

### 7.7 Verification Method (object-local closed set)

`verification_method` **SHALL** be exactly one of:

| Value | Meaning |
|-------|---------|
| `reproduction` | Reproduction mode (SCI-000 child concept; procedure re-execution / congruence) |
| `protocol_conformance` | Check against declared Protocol steps/envelopes |
| `envelope_check` | Computational/analytical envelope congruence check |
| `other` | Other declared method; `verification_context` **SHALL** state the method |

**SHALL NOT:** define Validation methods or clinical validation procedures.

---

## 8. Verification Outcome (object-local closed vocabulary)

`verification_outcome` **SHALL** be exactly one of:

| Outcome | Meaning |
|---------|---------|
| `pending` | Verification not yet concluded (`record_state` MUST be `planned`) |
| `passed` | Verification checks passed under stated Scope/Protocol |
| `failed` | Verification checks failed under stated Scope/Protocol |
| `inconclusive` | Verification completed without determinate pass/fail |

**VO-1:** Outcome vocabulary **SHALL NOT** reuse Claim Standing values.  
**VO-2:** Outcome vocabulary **SHALL NOT** reuse Workflow State values.  
**VO-3:** Outcome **SHALL NOT** mean biological truth, falsehood, or certainty.  
**VO-4:** If `record_state=planned`, `verification_outcome` **SHALL** be `pending`.  
**VO-5:** If `record_state=passed`, `verification_outcome` **SHALL** be `passed`.  
**VO-6:** If `record_state=failed`, `verification_outcome` **SHALL** be `failed`.  
**VO-7:** If `record_state=inconclusive`, `verification_outcome` **SHALL** be `inconclusive`.

---

## 9. Verification Record State Machine (object-local)

### 9.0 Naming rule (ADR-0006)

1. **Verification Record State** is the only object-local state enum here.  
2. Workflow State **SHALL NOT** appear as Record State.  
3. Claim Standing **SHALL NOT** appear as Record State.  
4. The word **Lifecycle**, if used informatively, **SHALL NOT** name a third Verification enum.

### 9.1 Allowed States (SCI-000 import)

| State | Meaning |
|-------|---------|
| `planned` | Verification intended / prepared; not concluded |
| `passed` | Concluded; checks passed |
| `failed` | Concluded; checks failed |
| `inconclusive` | Concluded; indeterminate |

**SCI-006 SHALL NOT** introduce additional Record States.

### 9.2 Allowed transitions

| From | To |
|------|-----|
| (new) | `planned` |
| `planned` | `passed`, `failed`, `inconclusive` |

### 9.3 Forbidden transitions

| Forbidden | Reason |
|-----------|--------|
| `passed`/`failed`/`inconclusive` → `planned` | Terminal for this attempt; mint new Verification record |
| `passed` ↔ `failed` / `inconclusive` in place | New attempt / new version required |
| Any → `truth_confirmed` | SCI-000 Forbidden |
| Any → Standing / Workflow values | Orthogonality |
| AI-only promotion out of `planned` | §9.4 |

### 9.4 Verification Transition Event (VTE) — minimum fields (object-local)

Every change from `planned` to `passed`/`failed`/`inconclusive` **SHALL** append an event with:

| Field | Rule |
|-------|------|
| `event_id` | Match `^vte:[A-Za-z0-9._~-]{1,128}$`; unique within the Verification |
| `at` | UTC `YYYY-MM-DDThh:mm:ssZ` |
| `from_state` | SCI-000 Verification Allowed State or exact `null` for creation edge cases |
| `to_state` | SCI-000 Verification Allowed State |
| `authority_agent` | When leaving `planned`, **SHALL** match `^human:[A-Za-z0-9._~-]{1,128}$` |
| `reason` | Non-empty string (length ≥ 1 after trim) |
| `decision_ref` | Non-empty when `to_state` ∈ {`passed`,`failed`,`inconclusive`} |

Always mandatory: `event_id`, `at`, `from_state`, `to_state`, `authority_agent`, `reason`.

**Human Reviewer pattern (Verification-local):** `^human:[A-Za-z0-9._~-]{1,128}$`

**VRR-1:** `record_state` ∈ {`passed`,`failed`,`inconclusive`} **MAY** hold only if ≥1 VTE exists with matching `to_state` and Human Reviewer `authority_agent`.  
**VRR-2:** VTEs **SHALL NOT** mutate Claim Standing, Evidence, Evidence Grade, Contradiction, Negative Result, Ontology terms, Scope of other objects, or Provenance of other objects.

Initial creation at `planned` **MAY** omit a VTE; if present, `authority_agent` MAY be non-`human:` only while `to_state=planned`.

**SHALL NOT** define a generic platform Event framework.

---

## 10. Verification Scope — minimum constituents (Verification-local)

`scope` **SHALL** be a structured object with **exactly** these mandatory fields (all strings, NFC, trimmed; each length ≥ 1):

| Field | Meaning |
|-------|---------|
| `domain_context` | Scientific context of the verification |
| `bounds` | Positive applicability / envelope bounds |
| `exclusions` | Explicit exclusions; if none, **SHALL** be the exact string `none` |

**Equivalence (Scope):** pairwise string equality after NFC + trim.

**SHALL NOT:** own Claim Scope profiles or redefine Claim Scope.

---

## 11. Relationships

### 11.1 Claim references

If `claim_refs` is present:

1. Every entry **SHALL** match **SCI-001@0.1.3 §7.3** by reference.  
2. Presence **SHALL NOT** modify Claim Standing, proposition, or scope.  
3. Presence **SHALL NOT** mean the Claim is true or false.

### 11.2 Evidence references

If `evidence_refs` is present:

1. Every entry **SHALL** match **SCI-002@0.1.0 §7.3** by reference.  
2. Presence **SHALL NOT** register, withdraw, invalidate, or rewrite Evidence.

### 11.3 Evidence Grade references (reference only)

If `grade_refs` is present:

1. Every entry **SHALL** be a non-empty string after NFC + trim.  
2. If an entry is intended as an EG-0.1 `grade_ref`, it **SHALL** conform to **SCI-003@0.1.0 §9** by reference.  
3. SCI-006 **SHALL NOT** assign, raise, or lower Evidence Grade.

### 11.4 Contradiction references (optional)

If `contradiction_refs` is present:

1. Every entry **SHALL** match **SCI-004@0.1.0 §7.3** by reference.  
2. Presence **SHALL NOT** resolve, archive, or rewrite Contradiction.

### 11.5 Negative Result references (optional)

If `negative_result_refs` is present:

1. Every entry **SHALL** match **SCI-005@0.1.0 §7.3** by reference.  
2. Presence **SHALL NOT** dismiss, withdraw, or rewrite Negative Results.

### 11.6 Permitted relationship summary

| Name | To | Cardinality | Rule |
|------|-----|-------------|------|
| `verifies_claim` | Claim id | 0..* | §11.1; see ADM-T1 |
| `verifies_evidence` | Evidence id | 0..* | §11.2; see ADM-T1 |
| `cites_grade` | Grade ref string | 0..* | §11.3 |
| `related_contradiction` | Contradiction id | 0..* | §11.4 |
| `related_negative_result` | Negative Result id | 0..* | §11.5 |
| `uses_protocol` | `protocol_ref` | 1..1 | §7.1 |
| `verifies_artifact` | `artifact_ref` | 0..1 | ADM-T1 |

### 11.7 Forbidden relationship behaviours

**SHALL NEVER:**

1. Modify Claim or Standing.  
2. Modify Evidence or Evidence Grade.  
3. Modify Contradiction or Negative Result.  
4. Modify Ontology.  
5. Automatically promote/demote Standing.  
6. Automatically register/withdraw Evidence.  
7. Automatically change Grade.  
8. Automatically resolve Contradictions.  
9. Automatically dismiss Negative Results.  
10. Modify another object’s Scope or Provenance.

---

## 12. Provenance — minimum constituents

`provenance` **SHALL** be a structured object with:

| Field | Rule |
|-------|------|
| `completeness` | Exactly one of `complete`, `partial`, `missing` |
| `recorded_at` | UTC `YYYY-MM-DDThh:mm:ssZ` |
| `custody_agent` | Non-empty Agent identifier string |
| `method_summary` | Non-empty string after NFC + trim; if none, exact string `none` |

**SHALL NOT** define a platform-wide ProvenanceEnvelope standard here.

---

## 13. Interpretation Rules

**IR-1:** Verification **SHALL NOT** mean the Claim is true.  
**IR-2:** Verification **SHALL NOT** mean the Claim is false.  
**IR-3:** `passed` **SHALL NOT** alone set Standing `supported`.  
**IR-4:** `failed` **SHALL NOT** alone set Standing `retracted` or `contested`.  
**IR-5:** Verification **SHALL NOT** delete or invalidate Evidence.  
**IR-6:** Verification **SHALL NOT** change Evidence Grade.  
**IR-7:** Verification **SHALL NOT** make Contradictions disappear.  
**IR-8:** Verification **SHALL NOT** dismiss Negative Results.  
**IR-9:** Verification **SHALL NOT** mean Workflow approval or clinical validation.  
**IR-10:** Verification ≠ Validation (SCI-000).  
**IR-11:** Verification is not Claim, Evidence, Contradiction, or Negative Result.

---

## 14. Admissibility Rules (machine-checkable)

**ADM-1:** `protocol_ref` length ≥ 1 after NFC + trim.  
**ADM-2:** `scope` satisfies §10.  
**ADM-3:** `verification_method` ∈ §7.7 closed set.  
**ADM-4:** `record_state` ∈ {`planned`,`passed`,`failed`,`inconclusive`}.  
**ADM-5:** VO-4…VO-7 hold for `verification_outcome`.  
**ADM-6:** ADM-T1 target rule holds.  
**ADM-7:** VRR-1 holds when `record_state` ∈ {`passed`,`failed`,`inconclusive`}.  
**ADM-8:** Evidence Grade **SHALL NOT** be an admissibility input for Outcome.  
**ADM-9:** Claim Standing **SHALL NOT** be an admissibility input for Outcome.

---

## 15. Immutability and material change

1. After a Verification Version is issued, the tuple  
   `(summary, description, scope, protocol_ref, verification_method, verification_context, verification_rationale, provenance, claim_refs, evidence_refs, grade_refs, contradiction_refs, negative_result_refs, artifact_ref)`  
   for that `verification_version` **SHALL** be immutable when `record_state` ∈ {`passed`,`failed`,`inconclusive`}.  
2. While `record_state=planned`, material edits **SHALL** either update only via new `verification_version` or be forbidden in place—implementations **SHALL NOT** silently rewrite concluded records.  
3. Record State transitions from `planned` to a concluded state **SHALL NOT** alter the immutable content tuple; they append VTEs and set `record_state` / `verification_outcome` per VO rules.  
4. **Material change (deterministic):** NFC+trim inequality on any string field of the content tuple, Scope inequality, or change to any referenced id set **SHALL** be material.  
5. On material change after conclusion, implementation **SHALL** mint a new `verification_id` (preferred per SCI-000 “each attempt is a new record”) or a new `verification_version` with `record_state=planned`.  
6. In-place overwrite of a concluded content tuple **SHALL** be non-conformant.

---

## 16. Normative Invariants (summary)

1. `verification_id` satisfies §7.3.  
2. Pins / version satisfy §7.5.  
3. Ownership integrity: SCI-006 owns only Verification.  
4. ADM-1…ADM-9 hold.  
5. IR-1…IR-11 hold.  
6. VRR-1/VRR-2 hold.  
7. Relationship integrity §11; no ownership leakage.  
8. No Standing / Grade / Evidence / Contradiction / NR / Ontology mutation.  
9. Material immutability §15 holds.  
10. Human Reviewer required for promotion out of `planned`.  
11. ADR-0006 orthogonality holds.

---

## 17. Failure Modes

| ID | Failure | Detection |
|----|---------|-----------|
| F1 | Bad `verification_id` / pin / version | §7.3, §7.5 |
| F2 | Empty Protocol / Scope / rationale / context | §7.1, §10, §14 |
| F3 | Bad `verification_method` | §7.7 |
| F4 | Forbidden / foreign Record State or Outcome | §7.2, §8, §9.1 |
| F5 | Outcome/state mismatch (VO-4…VO-7) | §8 |
| F6 | ADM-T1 target missing | §7.1 |
| F7 | Non-`human:` authority leaving `planned` | §9.4 |
| F8 | Concluded state without VRR-1 VTE | §9.4 |
| F9 | Claim/Evidence/Contradiction/NR id pattern fail | §11 |
| F10 | Cross-object mutation by Verification write | §11.7, §13 |
| F11 | In-place material overwrite of concluded record | §15 |
| F12 | `ethics_constraint_marker` ≠ `non_clinical` | §7.4 |
| F13 | `truth_confirmed` used | §7.2 |

---

## 18. Normative Examples

### Example A — Valid Verification (`passed`)

| Field | Value |
|-------|--------|
| `verification_id` | `verification:replay-001` |
| `ontology_ref` | `SCI-000@0.1.0` |
| `spec_ref` | `SCI-006@0.1.0` |
| `verification_version` | `1.0.0` |
| `record_state` | `passed` |
| `verification_outcome` | `passed` |
| `summary` | Pinned envelope replay congruent for claim:alpha-001 |
| `description` | Re-ran Protocol P-v1 envelope; outputs within declared congruence bounds |
| `scope.domain_context` | computational envelope replay |
| `scope.bounds` | Protocol P-v1; artifact hash H1 |
| `scope.exclusions` | none |
| `protocol_ref` | `protocol:P-v1` |
| `verification_method` | `reproduction` |
| `verification_context` | same inputs; pinned toolchain declared in Protocol P-v1 |
| `verification_rationale` | Bitwise/analytic congruence criteria met per Protocol P-v1 §4 |
| `ethics_constraint_marker` | `non_clinical` |
| `claim_refs` | [`claim:alpha-001`] |
| `evidence_refs` | [`evidence:run-table-09`] |
| VTE | `authority_agent=human:reviewer-04`, `decision_ref=dec:ver-001`, `to_state=passed` |

### Example B — Valid Verification (`failed`) with Negative Result citation

| Field | Value |
|-------|--------|
| `verification_id` | `verification:replay-002` |
| `record_state` | `failed` |
| `verification_outcome` | `failed` |
| `claim_refs` | [`claim:beta-002`] |
| `negative_result_refs` | [`negresult:decoy-null-001`] |
| `verification_rationale` | Congruence criteria not met; null recovery cited as context only |
| Note | Negative Result **not** dismissed or modified |

### Example C — Borderline / `inconclusive` with Contradiction context

| Field | Value |
|-------|--------|
| `verification_id` | `verification:env-003` |
| `record_state` | `inconclusive` |
| `verification_outcome` | `inconclusive` |
| `verification_method` | `envelope_check` |
| `contradiction_refs` | [`contradiction:dir-clash-001`] |
| `verification_rationale` | Envelope partially executable; open Contradiction prevents determinate pass/fail under stated Scope |
| Note | Contradiction **not** resolved by this Verification |

### Example D — Valid `planned`

| Field | Value |
|-------|--------|
| `record_state` | `planned` |
| `verification_outcome` | `pending` |
| `claim_refs` | [`claim:gamma-003`] |

### Invalid examples (non-conformant)

| Case | Why |
|------|-----|
| `verification_outcome=supported` | Standing leakage |
| `record_state=truth_confirmed` | Forbidden |
| `passed` without Human VTE | VRR-1 |
| AI `authority_agent` promoting to `failed` | §9.4 |
| Writing Claim Standing from Verification | IR-3/IR-4 |
| Changing `grade_ref` on Evidence from Verification | IR-6 |
| Empty targets (no claim/evidence/artifact) | ADM-T1 |
| `record_state=passed` with `verification_outcome=pending` | VO-5 |

---

## 19. Acceptance Criteria (0.1.0)

1. SCI-000 Verification imported; Allowed States not extended; `truth_confirmed` forbidden.  
2. SCI-006 owns only Verification (and Reproduction as method mode).  
3. Identifier / version / pins Verification-local and testable.  
4. Outcome vocabulary closed; not Standing/Workflow; VO rules hold.  
5. Record State machine ADR-0006 compliant.  
6. Human Reviewer required for promotion; AI shall not promote.  
7. Relationships import ids by reference; Grade reference-only.  
8. Non-interference IR-1…IR-11 hold.  
9. Material change deterministic; attempts as new records/versions.  
10. Failure modes + examples + conformance checklist present.  
11. No new ontology terms, governance, shared standards, extraction, ADRs, or code.  
12. KEEP LOCAL; machine-testable; implementation-independent.  
13. Self-review (§22) completed.  
14. Program DONE **not** claimed.

---

## 20. Conformance Checklist

A Verification encoding is conformant to **SCI-006@0.1.0** iff:

- [ ] §§7–16 invariants hold  
- [ ] `record_state` ∈ {`planned`,`passed`,`failed`,`inconclusive`}  
- [ ] VO-4…VO-7 hold  
- [ ] ADM-1…ADM-9 hold  
- [ ] IR-1…IR-11 not violated  
- [ ] VRR-1/VRR-2 hold  
- [ ] Relationship integrity §11 holds  
- [ ] No Standing / Grade / Evidence / Contradiction / NR / Ontology mutation  
- [ ] Material immutability §15 holds  
- [ ] No API/schema/code required by this text  

---

## 21. Definition of Done

| Layer | Status |
|-------|--------|
| Specification text complete | **Met** when §19 items 1–13 hold |
| Status | **READY FOR REVIEW** |
| Program DONE | **SHALL NOT** be claimed |

---

## 22. Self-review

| Check | Result |
|-------|--------|
| SCI-000 respected | **PASS** |
| SCI-001 respected | **PASS** |
| SCI-002 respected | **PASS** |
| SCI-003 respected | **PASS** |
| SCI-004 respected | **PASS** |
| SCI-005 respected | **PASS** |
| ADR-0006 respected | **PASS** |
| KEEP LOCAL / Execution Contract respected | **PASS** |
| No ownership theft | **PASS** |
| No ontology / governance / architecture modification | **PASS** |
| No implementation leakage | **PASS** |
| No shared standards / ADR / extraction | **PASS** |
| Orthogonal to prior Knowledge Objects | **PASS** |
| Machine-testable SHALLs | **PASS** |

### Known Limitations

1. Free-text rationale/context/method detail (NFC+trim only).  
2. Does not auto-write Claim `verified_via` (SCI-001 owns Claim relationships).  
3. Does not execute verification procedures (no code).  
4. Validation remains out of scope.  
5. Local pattern duplication retained pending future AEB after demonstrated reuse.

### Conflicts

**None requiring STOP.**

---

*End of SCI-006 Scientific Verification Object Specification v0.1.0*

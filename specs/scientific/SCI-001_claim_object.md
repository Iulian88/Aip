# SCI-001 Scientific Claim Object Specification v0.1.4

| Field | Value |
|-------|--------|
| **Spec ID** | SCI-001 |
| **Artifact ID** | SPEC-OBJ-CLAIM-001 |
| **Version** | **0.1.4** |
| **Status** | READY FOR REVIEW |
| **Ontology pin** | SCI-000 Core Scientific Ontology **v0.1.0** (PROVISIONAL APPROVED) |
| **Evidence pin** | SCI-002@0.1.0 (Evidence Identifier pattern by reference only) |
| **Contradiction pin** | SCI-004@0.1.0 (Contradiction Identifier pattern by reference only) |
| **Negative Result pin** | SCI-005@0.1.0 (Negative Result Identifier pattern by reference only) |
| **Verification pin** | SCI-006@0.1.0 (Verification Identifier pattern by reference only) |
| **Architecture pin** | ADR-0006 (ACCEPTED) |
| **Normative language** | RFC 2119: SHALL / SHALL NOT / MUST / MUST NOT / SHOULD / MAY |

---

## 0. Patch Changelog

### 0.1.3 → 0.1.4 (SCCR-001 / SCIP-001 — Scientific Core Final Interoperability Patch)

| ID | Change |
|----|--------|
| C1 | `qualified_by` **SHALL** conform to SCI-005 Negative Result Identifier (§10, §12.5b); pattern imported by reference only |
| C2 | `verified_via` **SHALL** conform to SCI-006 Verification Identifier (§10, §12.5b); pattern imported by reference only |
| C3 | Failure modes F12 / F13; normative refs + dependencies on SCI-005@0.1.0 and SCI-006@0.1.0 |
| C4 | SCCR-001 Claim-side NR/Verification id gaps **closed**; Scientific Core identifier interoperability complete |

**Ownership unchanged.** Grammars imported by reference only. **No** Standing/SSR semantic changes. **No** ontology, governance, architecture, Workflow, ADR-0006, or KEEP LOCAL policy changes. SCI-005 / SCI-006 **not** modified.

**Not in 0.1.4:** any change to SSR-1…SSR-5 substance; Evidence/`bears_on` symmetry; Grade consultation; other Knowledge Object specs.

### 0.1.2 → 0.1.3 (KGIR-001 / Graph Interoperability Patch Set 1 — R2 only)

| ID | Change |
|----|--------|
| G1 | `contested_by` **SHALL** conform to SCI-004 Contradiction Identifier (§12.5, §10); pattern imported by reference only |
| G2 | Normative reference + dependency on SCI-004@0.1.0 for Contradiction id semantics |
| G3 | Failure mode F11 for non-conformant Contradiction ids in `contested_by` |
| G4 | KGIR-001 **R2 closed**; **R1 no patch** (asymmetric `supported_by`/`bears_on` intentionally independent — not an interoperability defect) |

**Not in 0.1.3:** requiring `bears_on` ↔ `supported_by` symmetry (R1); Evidence `record_state` for SSR-1; ethics symmetry; Identifier frameworks; SCI-002/SCI-004 edits.

### 0.1.1 → 0.1.2 (IPR-001 / X1)

| ID | Change |
|----|--------|
| I1 | `supported_by` **SHALL** conform to SCI-002 Evidence Identifier (§12.4, §10); pattern imported by reference only |
| I2 | Normative reference + dependency on SCI-002@0.1.0 for Evidence id semantics |
| I3 | Failure mode F10 for non-conformant Evidence ids in `supported_by` |
| I4 | CSR-001/IPR-001 X1 closed; X2/X3 not revisited |

**Not in 0.1.2:** Evidence `record_state` requirement for SSR-1 (X2); ethics symmetry (X3); Identifier frameworks; SCI-002 edits.

### 0.1.0 → 0.1.1

| ID | Change |
|----|--------|
| P1 | Claim Scope: mandatory minimum constituents (§7.2) |
| P2 | Claim Identifier: Claim-local rules (§7.3) |
| P3 | Material change: deterministic equality rule (§12.8) |
| P4 | Standing Transition Event: minimum fields (§12.7) |
| P5 | Interim `supported` rule: machine-checkable (§12.4) |
| P6 | ADR-0006 alignment: Standing ≠ Workflow; remove Lifecycle ambiguity (§9) |
| P7 | CF-SCI001-0001 **RESOLVED BY ADR-0006**; OQ-004 **CLOSED** |
| P8 | Ethics Constraint marker: Claim-local binary marker only (§7.4) |
| P9 | Pins: Claim-local `ontology_ref` / `spec_ref` / `claim_version` string rules (§7.5) |
| P10 | AI authorship markers: machine-checkable fields (§7.6) |

---

## 1. Purpose

This document is the **constitutional normative specification** of the SciROS **Claim** object.

It defines Claim structure, Standing transitions, relationships, and Claim-local invariants—without Evidence Grades, Confidence models, Verification procedures, APIs, storage, or code.

No SciROS scientific memory path MAY bypass the Claim object for assertional content.

---

## 2. Scope

This specification covers:

1. Normative structure and invariants of Claim (Knowledge Object per SCI-000).  
2. Standing state machine and transitions (Standing vocabulary per SCI-000).  
3. Permitted and forbidden relationships to other SCI-000 concepts.  
4. Claim-local Identifier, Scope minimum, Version, pin, and Standing-transition-event rules.  
5. Conformance requirements for Claim encodings.  
6. Hypothesis marking per SCI-000 (Claim + flag).  
7. Dual-axis rule per ADR-0006: **Scientific Standing** vs **Workflow State**.

---

## 3. Out of Scope

This specification does **not** define:

1. Evidence object internals or Evidence Grade (SCI-002 / SCI-003).  
2. Contradiction internals (SCI-004).  
3. Negative Result internals (SCI-005).  
4. Verification / Reproduction procedures (SCI-006).  
5. Validation frameworks; Uncertainty/Confidence schemes; Benchmarks.  
6. Global Identifier/Namespace standards; reusable Scope profiles; shared Version registries; ethics lexicons/frameworks.  
7. Workflow State vocabularies (Program Execution / Pipeline owns Workflow per ADR-0006).  
8. APIs, JSON Schema, databases, classes, UI, storage.  
9. Agent reasoning algorithms.

---

## 4. Normative References

| Reference | Role |
|-----------|------|
| **SCI-000 v0.1.0** | Vocabulary authority |
| **SCI-002 v0.1.0** | Evidence Identifier pattern (by reference; SCI-002 owns semantics) |
| **SCI-004 v0.1.0** | Contradiction Identifier pattern (by reference; SCI-004 owns semantics) |
| **SCI-005 v0.1.0** | Negative Result Identifier pattern (by reference; SCI-005 owns semantics) |
| **SCI-006 v0.1.0** | Verification Identifier pattern (by reference; SCI-006 owns semantics) |
| **ADR-0006** | Standing ≠ Workflow; Candidate ∉ Standing |

This specification **SHALL NOT** redefine any Canonical Name owned by SCI-000.  
This specification **SHALL NOT** extend the Standing enum.  
This specification **SHALL NOT** redefine the Evidence Identifier grammar owned by SCI-002.  
This specification **SHALL NOT** redefine the Contradiction Identifier grammar owned by SCI-004.  
This specification **SHALL NOT** redefine the Negative Result Identifier grammar owned by SCI-005.  
This specification **SHALL NOT** redefine the Verification Identifier grammar owned by SCI-006.

---

## 5. Dependencies

| Dependency | Requirement |
|------------|-------------|
| SCI-000@0.1.0 | MUST be provisionally approved or approved |
| SCI-002@0.1.0 | MUST exist for `supported_by` Evidence Identifier conformance (IPR-001 X1) |
| SCI-004@0.1.0 | MUST exist for `contested_by` Contradiction Identifier conformance (KGIR-001 R2) |
| SCI-005@0.1.0 | MUST exist for `qualified_by` Negative Result Identifier conformance (SCIP-001 / SCCR-001) |
| SCI-006@0.1.0 | MUST exist for `verified_via` Verification Identifier conformance (SCIP-001 / SCCR-001) |
| ADR-0006 | MUST be ACCEPTED for Standing/Workflow separation |

---

## 6. Concept Ownership

| Concept | Vocabulary | Detail |
|---------|------------|--------|
| Claim | SCI-000 | **SCI-001** |
| Standing enum | SCI-000 | SCI-000 only |
| Hypothesis flag ops | SCI-000 | SCI-001 |
| Workflow State | — | Program Execution (ADR-0006); **not** SCI-001 |
| Evidence Identifier | SCI-000 (term) | **SCI-002** (grammar/semantics); SCI-001 imports by reference only |
| Contradiction Identifier | SCI-000 (term) | **SCI-004** (grammar/semantics); SCI-001 imports by reference only |
| Negative Result Identifier | SCI-000 (term) | **SCI-005** (grammar/semantics); SCI-001 imports by reference only |
| Verification Identifier | SCI-000 (term) | **SCI-006** (grammar/semantics); SCI-001 imports by reference only |
| Evidence object / Contradiction / Verification / Negative Result | SCI-000 | SCI-002…006 |

---

## 7. Definition

Per SCI-000:

> **Claim** — A scoped, versioned scientific proposition with explicit Standing, eligible to be linked to Evidence and subject to Verification, Contradiction, Retraction, or Supersession.

**SCI-001 refinement (non-redefining):**  
A Claim is the sole assertional Knowledge Object for SciROS propositions under explicit Scope. Evidence, Contradiction, Verification, and Negative Result **relate to** Claims; they do not replace them.

### 7.1 Mandatory logical constituents

A Claim **SHALL** include all of:

| Constituent | Normative rule |
|-------------|----------------|
| `claim_id` | §7.3 |
| `ontology_ref` | §7.5 |
| `spec_ref` | §7.5 |
| `claim_version` | §7.5 |
| `proposition` | Non-empty Unicode string after NFC; length ≥ 1 after trim of leading/trailing whitespace |
| `scope` | §7.2 |
| `standing` | Exactly one of SCI-000 Standing values |
| `ethics_constraint_marker` | §7.4 |
| `created_by` | Non-empty Agent identifier string |
| `created_at` | UTC timestamp string `YYYY-MM-DDThh:mm:ssZ` (second resolution) |

Optional (MAY): `entity_bindings[]`, `protocol_ref`, `dataset_refs[]`, `citation_refs[]`, `is_hypothesis` (boolean), `ai_assisted` (§7.6), `human_sponsor` (§7.6), references to Evidence / Contradiction / Verification / Negative Result **by id only**, `standing_transition_log[]` (§12.7).

### 7.2 Claim Scope — minimum constituents (Claim-local only)

`scope` **SHALL** be a structured object with **exactly** these mandatory fields (all strings, NFC, trimmed; each length ≥ 1):

| Field | Meaning |
|-------|---------|
| `domain_context` | What kind of scientific context (free text; non-empty) |
| `bounds` | Positive applicability bounds (free text; non-empty) |
| `exclusions` | Explicit exclusions; if none, **SHALL** be the exact string `none` |

**Equivalence (Scope):** Two Scopes are equal iff the triple `(domain_context, bounds, exclusions)` is pairwise string-equal after NFC + trim.

**SHALL NOT:** define reusable Scope profiles, Scope registries, or non-Claim Scope models in this document.

### 7.3 Claim Identifier — Claim-local rules

1. `claim_id` **SHALL** match: `^claim:[A-Za-z0-9._~-]{1,128}$`  
2. Within one implementing system’s Claim store, `claim_id` **SHALL** be unique.  
3. `claim_id` **SHALL NOT** change across Standing transitions.  
4. `claim_id` **SHALL NOT** change across `claim_version` increments on the same identity lineage.  
5. This section defines **Claim-local** Identifier semantics only. It **SHALL NOT** define a global SciROS namespace standard.

**Test:** Reject any Claim whose `claim_id` fails the regex or collides within the store.

### 7.4 Ethics Constraint marker (Claim-local only)

1. `ethics_constraint_marker` **SHALL** be exactly the string `non_clinical`.  
2. Presence of this marker **SHALL** be interpreted as acknowledgement of SCI-000 Clinical Boundary for this Claim.  
3. This specification **SHALL NOT** define an ethics vocabulary, lexicon, or speech-act catalogue.  
4. Automated clinical-language classification beyond the marker **is out of scope**. Conformance for Proposition clinical content **SHALL** use §12.2 invariant C-ETH (Decision-gated).

### 7.5 Pins and Claim Version strings (Claim-local only)

| Field | Pattern | Example |
|-------|---------|---------|
| `ontology_ref` | `^SCI-000@0\.1\.[0-9]+$` | `SCI-000@0.1.0` |
| `spec_ref` | `^SCI-001@0\.1\.[0-9]+$` | `SCI-001@0.1.4` |
| `claim_version` | `^[0-9]+\.[0-9]+\.[0-9]+$` | `1.0.0` |

1. On issuance of a Claim Version, `claim_version` **SHALL** be set.  
2. First issued Version of a Claim identity **SHALL** use `claim_version` `1.0.0` unless a documented migration Decision states otherwise.  
3. These pin/version rules are **Claim-local**. This document **SHALL NOT** define a shared pinning standard for other objects.

### 7.6 AI authorship markers (Claim-local)

1. `ai_assisted` **SHALL** be boolean.  
2. If `ai_assisted` is `true`, `human_sponsor` **SHALL** be a non-empty Agent identifier string.  
3. If `ai_assisted` is `false` or absent, `human_sponsor` MAY be absent.  
4. If `ai_assisted` is `true`, `standing` **SHALL** be `draft_unverified` until a Human Reviewer enacts a Standing Transition Event (§12.7).

---

## 8. Scientific Motivation

Computational and AI-mediated research emits assertional language faster than institutions can audit it. SciROS requires Claims as immutable-versioned, scope-bounded, Standing-governed propositions—never clinical directives, never self-certifying truths, never containers that own Evidence or Confidence.

---

## 9. Standing State Machine and ADR-0006 Alignment

### 9.0 Dual-axis rule (normative)

Per **ADR-0006**:

1. **Scientific Standing** is the only epistemic state of a Claim in this specification.  
2. **Workflow State** (including terms such as Candidate, In Review, Approved-as-work-item) belongs to Program Execution / Pipeline and **SHALL NOT** appear as Claim Standing.  
3. The word **Lifecycle**, if used informatively, **SHALL NOT** name a third Claim enum.  
4. A Claim **MAY** be associated with Workflow State on a work-item facet **without** changing Standing.

**CF-SCI001-0001:** **RESOLVED BY ADR-0006.** Candidate is Workflow-only. SCI-001 **SHALL NOT** add `candidate` to Standing.

### 9.1 Standing vocabulary (imported)

| Standing | Meaning (SCI-000) |
|----------|-------------------|
| `draft_unverified` | Proposed; not institutional knowledge |
| `supported` | Linked Evidence currently backs the Claim under Scope |
| `contested` | Open Contradiction or unresolved conflict |
| `superseded` | Replaced by a successor Claim |
| `retracted` | Withdrawn |

**SCI-001 SHALL NOT** introduce additional Standing values.

### 9.2 Transition justifications

| Transition | Justification |
|------------|---------------|
| → `draft_unverified` | Creation / AI draft default |
| `draft_unverified` → `supported` | Interim Supported Rule (§12.4) satisfied + Human Reviewer STE (`human:` + `decision_ref`) |
| `draft_unverified` → `contested` | ≥1 Contradiction id referenced |
| `supported` → `contested` | ≥1 Contradiction id referenced |
| `contested` → `supported` | Interim Supported Rule satisfied; Contradiction handling recorded in Transition Event `reason` |
| `*` → `superseded` | Supersession relationship recorded (§16) |
| `*` non-terminal → `retracted` | `retraction_reason` non-empty |

---

## 10. Permitted Relationships

References only; Claim does not own targets.

| Name | To | Cardinality | Rule |
|------|-----|-------------|------|
| `supported_by` | Evidence id | 0..* | Each id **SHALL** conform to SCI-002 Evidence Identifier (§12.4); see §12.4 |
| `qualified_by` | Negative Result id | 0..* | MAY; each id **SHALL** conform to SCI-005 Negative Result Identifier (§12.5b) |
| `contested_by` | Contradiction id | 0..* | If `standing=contested`, count ≥ 1; each id **SHALL** conform to SCI-004 Contradiction Identifier (§12.5) |
| `verified_via` | Verification id | 0..* | MAY; each id **SHALL** conform to SCI-006 Verification Identifier (§12.5b); Claim does not execute Verification |
| `scoped_by` | Scope | 1..1 | §7.2 |
| `constrained_by` | — | — | Satisfied by `ethics_constraint_marker` |
| `assumes` | Assumption text/id | 0..* | MAY |
| `qualified_by_uncertainty` | Uncertainty id | 0..* | MAY |
| `cites` | Citation/Reference | 0..* | MAY |
| `mentions_publication` | Publication ref | 0..* | MAY |
| `uses_dataset` | Dataset ref | 0..* | MAY |
| `governed_under` | Protocol ref | 0..1 | MAY |
| `binds_entity` | Entity Identifier | 0..* | MAY |
| `supersedes` / `superseded_by` | Claim id | 0..1 | §16 |
| `is_hypothesis` | boolean flag | 0..1 | Only if `standing=draft_unverified` |

---

## 11. Forbidden Relationships

**SHALL NOT:**

1. Own Evidence / Evidence Grade / Confidence / Verification.  
2. Self-certify truth/clinical validity.  
3. Be a Diagnosis / TreatmentRecommendation / PatientRiskScore / ClinicalDecision.  
4. Set Standing from model confidence alone.  
5. Mutate `proposition` or `scope` in place after Version issuance.  
6. Use Assertion/Statement types or distinct Hypothesis object type.  
7. Use Standing ∉ SCI-000 enum (including `candidate`).

---

## 12. Normative Invariants

### 12.1 Identity and pins

1. `claim_id` **SHALL** satisfy §7.3.  
2. `ontology_ref` **SHALL** satisfy §7.5.  
3. `spec_ref` **SHALL** satisfy §7.5.  
4. `standing` **SHALL** be exactly one SCI-000 Standing value.

### 12.2 Content and ethics (Decision-gated clinical check)

5. `proposition` **SHALL** satisfy §7.1.  
6. `scope` **SHALL** satisfy §7.2.  
7. `ethics_constraint_marker` **SHALL** equal `non_clinical`.  
8. **C-ETH:** A Claim **SHALL NOT** be issued with Standing other than `draft_unverified` unless a Standing Transition Event exists whose `authority_agent` matches §12.7 Human Reviewer pattern and whose `reason` contains the exact substring `clinical_boundary_ack` **or** Standing remains `draft_unverified`. *(No ethics lexicon is defined here; Human Reviewer acknowledgement is the machine-checkable gate.)*

### 12.3 Separation of concerns

9–15. Claim **SHALL NOT** own Evidence, Evidence Grade, Confidence, Verification, Uncertainty schemes, or encode Confidence as Standing.

### 12.4 Interim Supported Rule (machine-checkable)

**SSR-1:** `standing` **MAY** equal `supported` only if **all** are true:

1. `supported_by` contains ≥ 1 Evidence identifier string;  
2. **Every** `supported_by` entry **SHALL** conform to the normative **Evidence Identifier** defined by **SCI-002@0.1.0 §7.3**. SCI-001 **imports that pattern by reference** and **SHALL NOT** redefine Evidence Identifier grammar or semantics. Conformance tests **SHALL** apply SCI-002@0.1.0 §7.3 verbatim;  
3. A Standing Transition Event exists with:  
   - `to_standing` equal to `supported`;  
   - `authority_agent` matching §12.7 Human Reviewer pattern;  
   - `decision_ref` a non-empty string (length ≥ 1 after trim);  
4. If `ai_assisted` is `true`, at least one Standing Transition Event **SHALL** exist with `from_standing=draft_unverified`, `to_standing=supported`, and `authority_agent` matching §12.7 Human Reviewer pattern.

**SSR-2:** Evidence Grade **SHALL NOT** be consulted by SCI-001 (out of scope).  
**SSR-3:** Verification status **SHALL NOT** be required by SCI-001 for `supported`.  
**SSR-4:** Evidence object Record State (`draft` / `registered` / `withdrawn`) **SHALL NOT** be required by SCI-001@0.1.4 for `supported` (IPR-001 X2 not in scope).  
**SSR-5:** Claim `supported_by` and Evidence `bears_on` are **independent** edges. SCI-001 **SHALL NOT** require `bears_on` symmetry for conformance (KGIR-001 R1 — no patch).

### 12.5 Contested / Retracted / Superseded

16. If `standing=draft_unverified`, `supported_by` MAY be empty.  
17. If `standing=contested`, `contested_by` **SHALL** contain ≥ 1 Contradiction identifier string.  
17a. **Every** `contested_by` entry **SHALL** conform to the normative **Contradiction Identifier** defined by **SCI-004@0.1.0 §7.3**. SCI-001 **imports that pattern by reference** and **SHALL NOT** redefine Contradiction Identifier grammar or semantics. Conformance tests **SHALL** apply SCI-004@0.1.0 §7.3 verbatim.  
18. If `standing=retracted`, `retraction_reason` **SHALL** be a non-empty string.  
19. If `standing=superseded`, `superseded_by` **SHALL** be a non-empty Claim id.

### 12.5b Negative Result and Verification Identifier imports (SCIP-001)

20a. **Every** `qualified_by` entry, when present, **SHALL** conform to the normative **Negative Result Identifier** defined by **SCI-005@0.1.0 §7.3**. SCI-001 **imports that pattern by reference** and **SHALL NOT** redefine Negative Result Identifier grammar or semantics. Conformance tests **SHALL** apply SCI-005@0.1.0 §7.3 verbatim. SCI-005 remains the sole owner.  

20b. **Every** `verified_via` entry, when present, **SHALL** conform to the normative **Verification Identifier** defined by **SCI-006@0.1.0 §7.3**. SCI-001 **imports that pattern by reference** and **SHALL NOT** redefine Verification Identifier grammar or semantics. Conformance tests **SHALL** apply SCI-006@0.1.0 §7.3 verbatim. SCI-006 remains the sole owner.  

20c. These imports **SHALL NOT** change Standing rules, SSR-1…SSR-5 substance, or the semantics of Negative Result or Verification objects.

### 12.6 Agency

20. On any Transition Event whose `to_standing` ∈ {`supported`,`contested`,`superseded`,`retracted`}, `authority_agent` **SHALL** match the Human Reviewer pattern in §12.7.  
21. §7.6 applies.

### 12.7 Standing Transition Event — minimum fields (Claim-local)

Every Standing change except initial creation at `draft_unverified` **SHALL** append an event object with these fields:

| Field | Rule |
|-------|------|
| `event_id` | Match `^ste:[A-Za-z0-9._~-]{1,128}$`; unique within the Claim |
| `at` | UTC `YYYY-MM-DDThh:mm:ssZ` |
| `from_standing` | SCI-000 Standing or the exact string `null` for first non-draft creation path |
| `to_standing` | SCI-000 Standing |
| `authority_agent` | Non-empty Agent id string. When Human Reviewer is required (§12.4, §12.6), **SHALL** match `^human:[A-Za-z0-9._~-]{1,128}$` |
| `reason` | Non-empty string (length ≥ 1 after trim) |
| `decision_ref` | If `to_standing=supported`: **SHALL** be non-empty (length ≥ 1 after trim). Otherwise: MAY be absent |

Always mandatory on the event: `event_id`, `at`, `from_standing`, `to_standing`, `authority_agent`, `reason`.

**Human Reviewer pattern (Claim-local):** `^human:[A-Za-z0-9._~-]{1,128}$`  
Any `authority_agent` not matching this pattern **SHALL NOT** be treated as a Human Reviewer for SCI-001 conformance.

**SHALL NOT** define a generic platform Event framework.

### 12.8 Immutability and material change

22. After a Claim Version is issued, the pair `(proposition, scope)` for that `claim_version` **SHALL** be immutable.  
23. Standing changes **SHALL NOT** alter `(proposition, scope)`.  
24. **Material change (deterministic):** Any change that makes NFC+trim string equality fail for `proposition` **or** makes Scope unequal per §7.2 **SHALL** be a material change.  
25. On material change, an implementation **SHALL** either:  
    - mint a new `claim_version` on the same `claim_id` (increment PATCH or MINOR at implementer discretion, but `claim_version` string **MUST** change), **or**  
    - create a successor Claim via Supersession (§16).  
26. In-place overwrite of `(proposition, scope)` for an existing `claim_version` **SHALL** be non-conformant.

---

## 13. State Machine

### 13.1 Allowed transitions

| From | To |
|------|-----|
| (new) | `draft_unverified` |
| `draft_unverified` | `supported`, `contested`, `superseded`, `retracted` |
| `supported` | `contested`, `superseded`, `retracted` |
| `contested` | `supported`, `superseded`, `retracted` |

### 13.2 Forbidden transitions

| Forbidden | Reason |
|-----------|--------|
| `superseded` → non-admin revive | Terminal |
| `retracted` → `supported`/`contested`/`draft_unverified` | Terminal; use new Claim |
| `supported` → `draft_unverified` | Audit destruction |
| Any → non-enum / `candidate` | SCI-000 + ADR-0006 |
| AI as sole `authority_agent` leaving `draft_unverified` toward listed targets | §12.6 |

---

## 14. Versioning Rules

1. Each issued revision **SHALL** have `claim_version` (§7.5).  
2. Pins **SHALL** be recorded per Version.  
3. Spec document PATCH does not rewrite existing Claim Versions’ `spec_ref` (Claims **SHOULD** keep issuance pin).  
4. Standing change **SHALL** use §12.7 events without changing `claim_version`.  
5. Material change **SHALL** obey §12.8.

---

## 15. Deprecation Rules

1. Deprecation **MAY** use `superseded` or `retracted`, or a governance note.  
2. History **SHALL** remain readable.  
3. Deprecation **SHALL NOT** delete history.

---

## 16. Supersession Rules

1. Successor **SHALL** set `supersedes` = predecessor `claim_id`.  
2. Predecessor `standing` **SHALL** become `superseded` via Transition Event.  
3. Predecessor `superseded_by` **SHALL** equal successor `claim_id`.  
4. A Claim **SHALL** have at most one `superseded_by` value when `standing=superseded`.  
5. Predecessor `claim_id` **SHALL NOT** be erased.

---

## 17. Failure Modes

| ID | Failure | Detection |
|----|---------|-----------|
| F1 | Scope missing field / empty | §7.2 |
| F2 | `ethics_constraint_marker` ≠ `non_clinical` | §7.4 |
| F3 | `supported` without SSR-1 | §12.4 |
| F4 | Non-`human:` `authority_agent` on forbidden transition | §12.6–§12.7 |
| F5 | In-place material overwrite | §12.8 |
| F6 | Bad Standing / bad `claim_id` regex | §7.3, §9.1 |
| F7 | `contested` without Contradiction id | §12.5 |
| F8 | Pin pattern fail | §7.5 |
| F9 | `supported` STE missing `decision_ref` | §12.4, §12.7 |
| F10 | `supported_by` entry fails SCI-002 Evidence Identifier | §12.4 SSR-1.2; SCI-002@0.1.0 §7.3 |
| F11 | `contested_by` entry fails SCI-004 Contradiction Identifier | §12.5 17a; SCI-004@0.1.0 §7.3 |
| F12 | `qualified_by` entry fails SCI-005 Negative Result Identifier | §12.5b 20a; SCI-005@0.1.0 §7.3 |
| F13 | `verified_via` entry fails SCI-006 Verification Identifier | §12.5b 20b; SCI-006@0.1.0 §7.3 |

---

## 18. Known Risks

R1 Proposition vagueness · R2 Scope gaming · R3 `supported` without grades (interim) · R4 Claim duplication · R5 AI draft misuse · R6 Human Reviewer rubber-stamping `clinical_boundary_ack`

---

## 19. Scientific Limitations

1. Does not determine biological truth.  
2. Standing ≠ probability.  
3. Without SCI-002/003, `supported` is not grade-ranked.  
4. No ethics lexicon; clinical content relies on Human Reviewer gate (C-ETH).  
5. Claim-local ID/pin rules are not a platform-wide standard.  
6. Domain semantics absent.

---

## 20. Open Questions

| ID | Status |
|----|--------|
| OQ-001 | OPEN — SCI-004 may strengthen contested rules further |
| OQ-002 | PARTIALLY ADDRESSED — Transition Event min fields defined; richer Decision records remain governance-optional via `decision_ref` |
| OQ-003 | CLOSED — material change deterministic (§12.8); Version vs successor choice remains implementer option |
| OQ-004 | **CLOSED** — Candidate Standing rejected per ADR-0006 |
| OQ-005 | OPEN — multilingual Proposition |

**CF-SCI001-0001:** **RESOLVED BY ADR-0006.**

---

## 21. Conformance Requirements

A Claim encoding is conformant to **SCI-001@0.1.4** iff:

1. §§7, 9–16, 12 invariants hold;  
2. Standing ∈ SCI-000 enum;  
3. ADR-0006 dual-axis respected (no Workflow values as Standing);  
4. No Evidence Grade / Verification requirement injected into SSR-1;  
5. Every `supported_by` entry conforms to SCI-002@0.1.0 §7.3 (by reference);  
6. Every `contested_by` entry conforms to SCI-004@0.1.0 §7.3 (by reference);  
7. Every `qualified_by` entry conforms to SCI-005@0.1.0 §7.3 (by reference);  
8. Every `verified_via` entry conforms to SCI-006@0.1.0 §7.3 (by reference);  
9. No API/schema/code required by this text.

---

## 22. Acceptance Criteria (0.1.4)

1. SCI-000 imported; Standing not extended.  
2. Claim Scope minimum constituents defined and equality-testable.  
3. Claim-local Identifier regex defined.  
4. Material change deterministic.  
5. Standing Transition Event minimum fields defined.  
6. Interim Supported Rule machine-checkable without Grades/Verification.  
7. ADR-0006 aligned; CF-SCI001-0001 and OQ-004 closed.  
8. Ethics marker Claim-local only (`non_clinical`).  
9. **IPR-001 X1:** every `supported_by` id conforms to SCI-002 Evidence Identifier by reference.  
10. **KGIR-001 R2:** every `contested_by` id conforms to SCI-004 Contradiction Identifier by reference.  
11. **KGIR-001 R1:** no symmetry requirement between `supported_by` and `bears_on` (SSR-5).  
12. **SCIP-001 / SCCR-001:** every `qualified_by` id conforms to SCI-005 Negative Result Identifier by reference.  
13. **SCIP-001 / SCCR-001:** every `verified_via` id conforms to SCI-006 Verification Identifier by reference.  
14. SCI-002 / SCI-004 / SCI-005 / SCI-006 remain sole owners of their Identifier semantics; grammars not redefined here.  
15. No semantic changes to Standing/SSR; no ontology/governance/architecture changes; no new specs or extraction.  
16. Self-review confirming SCIP-001 closure (§25).

---

## 23. Validation Checklist

- [x] P1–P10 (0.1.1) present  
- [x] I1–I4 (0.1.2 / X1) present  
- [x] G1–G4 (0.1.3 / R2) present  
- [x] C1–C4 (0.1.4 / SCIP-001) present  
- [x] No Candidate Standing  
- [x] No shared ID/Scope/Version/Ethics specs introduced  
- [x] SSR-1 testable including SCI-002 Evidence id import  
- [x] `contested_by` testable including SCI-004 Contradiction id import  
- [x] `qualified_by` testable including SCI-005 Negative Result id import  
- [x] `verified_via` testable including SCI-006 Verification id import  
- [x] Scope equality testable  
- [x] Material change testable  
- [x] Transition Event fields testable  
- [x] Evidence / Contradiction / NR / Verification Identifiers not redefined in SCI-001  
- [ ] Independent SQR / certification re-run  
- [ ] Approval recorded  

---

## 24. Definition of Done

SCI-001 **0.1.4** patch text is complete when §22 Acceptance Criteria 1–16 hold for this document.

**Scientific Core identifier interoperability:** complete (Evidence, Contradiction, Negative Result, Verification Claim-side imports).

SCI-001 is **program DONE** only when review/approval gates pass under program rules.

**Current status:** SCIP-001 complete → **READY FOR REVIEW**.

---

## 25. Self-review

### SCIP-001 / SCCR-001 closure

| Patch | Status |
|-------|--------|
| **C1** `qualified_by` → SCI-005 §7.3 by reference | **CLOSED** |
| **C2** `verified_via` → SCI-006 §7.3 by reference | **CLOSED** |
| Ownership unchanged (SCI-005 / SCI-006 sole id owners) | **Yes** |
| Grammars redefined in SCI-001? | **No** |
| Semantic changes (Standing/SSR/NR/Verification)? | **No** |
| Ontology / governance / architecture changes? | **No** |
| SCI-005 / SCI-006 modified? | **No** |

### Remaining known limitations

1. No automated clinical lexicon (Human Reviewer gate).  
2. Evidence quality not graded in SSR-1.  
3. SSR-1 does not require Evidence `record_state=registered`.  
4. `supported_by` / `bears_on` need not match (by design under R1).  
5. Proposition remains free text (semantic equivalence undecidable).  
6. Legacy Claim encodings with non-SCI-005 `qualified_by` or non-SCI-006 `verified_via` ids are intentionally non-conformant under 0.1.4.

### Conflicts

**None requiring STOP.**

---

*End of SCI-001 Scientific Claim Object Specification v0.1.4*

# SCI-003 Scientific Evidence Grade Specification v0.1.0

| Field | Value |
|-------|--------|
| **Spec ID** | SCI-003 |
| **Artifact ID** | SPEC-OBJ-EVIDENCE-GRADE-001 |
| **Version** | **0.1.0** |
| **Status** | READY FOR REVIEW |
| **Ontology pin** | SCI-000 Core Scientific Ontology **v0.1.0** (PROVISIONAL APPROVED) |
| **Evidence pin** | SCI-002@0.1.0 (`grade_ref` slot; Evidence object owned by SCI-002) |
| **Claim pin** | SCI-001@0.1.2 (Standing reference only; Grade does not set Standing) |
| **Architecture pin** | ADR-0006 (ACCEPTED) — Grade ≠ Workflow State ≠ Claim Standing |
| **Scheme ID** | **EG-0.1** |
| **Normative language** | RFC 2119: SHALL / SHALL NOT / MUST / MUST NOT / SHOULD / MAY |

---

## 0. Normative Changelog (initial)

| ID | Change |
|----|--------|
| N1 | Initial Evidence Grade scheme **EG-0.1** (four labels) |
| N2 | Normative `grade_ref` string form (Grade-local; not a global Identifier framework) |
| N3 | Grade semantics, ordinal ranks, and forbidden interpretations |
| N4 | Eligibility rules against SCI-002 Source / Provenance fields (by reference) |
| N5 | Assignment rules; Human Reviewer required to raise rank |
| N6 | Provenance `missing` ⇒ maximum = lowest grade (SCI-000) |
| N7 | Migration from SCI-002 interim `deferred_sci003` |
| N8 | Machine-testable invariants, examples, conformance checklist |

**Not in this specification:** Claim Standing rules; Evidence object structure; Verification; Contradiction; Negative Result; Workflow; shared Identifier/Version registries; APIs/schemas/code.

---

## 1. Purpose

This document is the **constitutional normative specification** of SciROS **Evidence Grade**.

It defines the EG-0.1 grade labels, semantics, eligibility, assignment, invariants, and interpretation—without owning Evidence, Claim, Standing, or Verification.

Evidence Grade expresses a **warrant strength class**. It is **not** a probability of truth, clinical validity, or model confidence score.

---

## 2. Scope

1. Controlled Evidence Grade labels for scheme EG-0.1.  
2. Ordinal rank and comparable semantics within EG-0.1.  
3. Eligibility and assignment rules referencing SCI-002 Evidence fields.  
4. Grade-local `grade_ref` encoding for SCI-002’s grade slot.  
5. Forbidden labels and forbidden inferences.  
6. Migration rules from `deferred_sci003`.  
7. Conformance requirements for Grade assignment encodings.

---

## 3. Out of Scope

1. Claim object / Standing (SCI-001).  
2. Evidence structure, Record State, Source/Provenance schemas (SCI-002).  
3. Verification / Reproduction (SCI-006).  
4. Contradiction (SCI-004), Negative Result (SCI-005).  
5. Workflow State (ADR-0006; Program Execution).  
6. Continuous confidence scores; clinical risk scores; medical guideline brand ladders.  
7. Global Identifier, Version, or Grade registries beyond EG-0.1 string form.  
8. APIs, JSON Schema, databases, classes, UI, storage.

---

## 4. Normative References

| Reference | Role |
|-----------|------|
| **SCI-000 v0.1.0** | Vocabulary authority (Evidence Grade term) |
| **SCI-002 v0.1.0** | Evidence `grade_ref` slot; Source / Provenance fields used in eligibility |
| **SCI-001 v0.1.2** | Claim Standing remains independent of Grade |
| **ADR-0006** | Grade is not Workflow State |

This specification **SHALL NOT** redefine Canonical Names owned by SCI-000.  
This specification **SHALL NOT** redefine Evidence Identifier or Evidence Record State (SCI-002).  
This specification **SHALL NOT** set or modify Claim Standing (SCI-001).

---

## 5. Dependencies

| Dependency | Requirement |
|------------|-------------|
| SCI-000@0.1.0 | MUST be provisionally approved or approved |
| SCI-002@0.1.0 | MUST exist (`grade_ref` slot) |
| SCI-001@0.1.2 | MUST exist for Standing non-interference rule |

---

## 6. Concept Ownership

| Concept | Vocabulary | Detail |
|---------|------------|--------|
| Evidence Grade | SCI-000 | **SCI-003** |
| EG-0.1 labels / ranks / eligibility / assignment | — | **SCI-003** |
| Evidence object / `grade_ref` slot storage | SCI-000 | **SCI-002** |
| Claim / Standing | SCI-000 | **SCI-001** |
| Verification / Contradiction / Negative Result | SCI-000 | SCI-006 / SCI-004 / SCI-005 |
| Workflow State | — | Program Execution; **not** SCI-003 |

---

## 7. Definition

Per SCI-000:

> **Evidence Grade** — A controlled ordinal or categorical label expressing the warrant strength class of Evidence relative to a published grading scheme—not a probability of truth.

**SCI-003 refinement (non-redefining):**  
Under scheme **EG-0.1**, an Evidence Grade is exactly one closed-set label with a fixed ordinal rank, assigned to an Evidence object via SCI-002 `grade_ref` under the rules of this document.

---

## 8. Scheme EG-0.1 — Labels, Ranks, Semantics

### 8.1 Closed label set

An EG-0.1 Evidence Grade label **SHALL** be exactly one of:

| Label | Rank | Semantics (normative) |
|-------|------|------------------------|
| `model_output_only` | **1** (lowest) | Warrant is primarily model/AI-generated or otherwise weakly provenance-backed; usable as floor class only |
| `literature_secondary` | **2** | Warrant derived from literature venue citation without primary registered deposit under this Evidence |
| `curated_database_snapshot` | **3** | Warrant from a declared curated deposit or database-of-record snapshot with usable provenance |
| `registered_primary_data` | **4** (highest in EG-0.1) | Warrant from declared primary empirical or registry-backed data with complete provenance |

**No other labels** are conformant under EG-0.1.

### 8.2 Forbidden labels (SCI-000 + Grade-local)

`grade_ref` / Grade label **SHALL NOT** be any of:

| Forbidden | Reason |
|-----------|--------|
| `AI_certified` | SCI-000 Forbidden State |
| `clinically_proven` | SCI-000 Forbidden State |
| `deferred_sci003` | Interim SCI-002 placeholder; not a Grade after migration (§15) |
| Any numeric string used as grade (e.g. `0.87`) | Confidence ≠ Grade |
| Claim Standing values | Standing ≠ Grade |
| Workflow State values | ADR-0006 |

### 8.3 Ordinal comparison (deterministic)

1. Rank(**A**) > Rank(**B**) **SHALL** mean: **A** is a stronger warrant class than **B** under EG-0.1.  
2. Rank comparison **SHALL NOT** mean probability of truth, clinical validity, or statistical confidence.  
3. Two grades are equal iff their labels are string-identical.

---

## 9. `grade_ref` encoding (Grade-local only)

SCI-002 stores Grade in `grade_ref` (string). For EG-0.1 conformance:

1. `grade_ref` **SHALL** match:  
   `^SCI-003@0\.1\.[0-9]+:(model_output_only|literature_secondary|curated_database_snapshot|registered_primary_data)$`  
2. The substring before `:` is the **scheme pin** (Grade-local).  
3. The substring after `:` is the **Grade label** (§8.1).  
4. Example: `SCI-003@0.1.0:curated_database_snapshot`  
5. This encoding is **Grade-local**. This document **SHALL NOT** define a global Identifier or pin framework for other objects.

**Test:** Reject any `grade_ref` that fails the regex.

---

## 10. Interpretation Rules (normative)

**IR-1:** Evidence Grade **SHALL NOT** alone set Claim Standing.  
**IR-2:** Evidence Grade **SHALL NOT** alone certify clinical validity, diagnosis, treatment, or patient risk.  
**IR-3:** Evidence Grade **SHALL NOT** be treated as a probability or continuous confidence score.  
**IR-4:** A higher EG-0.1 rank **SHALL NOT** imply Verification success (SCI-006 out of scope).  
**IR-5:** Confidence objects (SCI-000) **SHALL NOT** override Evidence Grade.  
**IR-6:** Grade **SHALL NOT** be interpreted as Workflow approval (ADR-0006).

**Test:** Any encoding or procedure that maps Grade → Standing without a SCI-001 Standing Transition Event is non-conformant to SCI-003 interpretation (and to SCI-001).

---

## 11. Eligibility Rules (machine-checkable)

Eligibility uses SCI-002 fields **by reference**. SCI-003 does not redefine those fields.

Let:

- `C` = `provenance.completeness` ∈ {`complete`,`partial`,`missing`}  
- `S` = `source.source_class`  
- `SS` = `source.source_state`  
- `L` = proposed Grade label  

### 11.1 Provenance ceiling (SCI-000)

**EL-P1:** If `C=missing`, `L` **SHALL** be `model_output_only`.  
**EL-P2:** If `C=partial`, `L` **SHALL NOT** be `registered_primary_data`.  
**EL-P3:** If `C=complete`, EL-P1/EL-P2 do not further restrict by completeness alone.

### 11.2 Source-class eligibility

A label `L` is **source-eligible** only if:

| Label `L` | Required `S` (exactly one of) | Additional |
|-----------|-------------------------------|------------|
| `model_output_only` | any SCI-002 `source_class` | Always source-eligible |
| `literature_secondary` | `literature_venue` | `SS` **SHALL** be `declared` |
| `curated_database_snapshot` | `database_of_record` **or** `curated_deposit` | `SS` **SHALL** be `declared` |
| `registered_primary_data` | `instrument` **or** `laboratory` **or** `registry` **or** `curated_deposit` **or** `database_of_record` | `SS` **SHALL** be `declared`; `C` **SHALL** be `complete` |

**EL-S1:** `L` **SHALL** be source-eligible per the table.  
**EL-S2:** If `SS=unresolved`, `L` **SHALL** be `model_output_only`.

### 11.3 Combined eligibility

**EL-1:** A proposed Grade assignment is eligible iff EL-P* and EL-S* all hold for `L`.  
**EL-2:** Ineligible assignments **SHALL** be rejected as non-conformant.

---

## 12. Assignment Rules

### 12.1 Grade Assignment Event (Grade-local)

Every change of `grade_ref` on a registered Evidence object **SHALL** be accompanied by a Grade Assignment Event (may be recorded on the Evidence or in an audit log linked by `decision_ref`) with:

| Field | Rule |
|-------|------|
| `event_id` | Match `^gae:[A-Za-z0-9._~-]{1,128}$`; unique within the Evidence |
| `at` | UTC `YYYY-MM-DDThh:mm:ssZ` |
| `evidence_id` | Conforms to SCI-002 Evidence Identifier (by reference) |
| `from_grade_ref` | Prior `grade_ref` string or exact `null` if replacing `deferred_sci003` |
| `to_grade_ref` | Conformant §9 string |
| `authority_agent` | §12.2 |
| `reason` | Non-empty string (length ≥ 1 after trim) |
| `decision_ref` | Non-empty string (length ≥ 1 after trim) |

**SHALL NOT** define a generic platform Event framework.

### 12.2 Authority (SCI-000 AI constraint)

**AR-1:** Let Rank(`to`) and Rank(`from`) be EG-0.1 ranks (treat `deferred_sci003` / `null` as Rank 0).  
**AR-2:** If Rank(`to`) > Rank(`from`), `authority_agent` **SHALL** match `^human:[A-Za-z0-9._~-]{1,128}$`.  
**AR-3:** An Agent whose id does **not** match that Human Reviewer pattern **SHALL NOT** raise Grade rank.  
**AR-4:** Assignment of `model_output_only` (Rank 1) from Rank 0 **MAY** use a non-`human:` `authority_agent` only while Evidence `record_state=draft` (SCI-002); upon `registered`, any Grade other than an already human-confirmed assignment **SHALL** have a Human Reviewer Grade Assignment Event.  
**AR-5:** For `record_state=registered`, every conformant `grade_ref` **SHALL** have at least one Grade Assignment Event with `to_grade_ref` equal to the current `grade_ref` and `authority_agent` matching the Human Reviewer pattern.

### 12.3 Relation to Evidence versioning (SCI-002)

**AR-6:** Changing `grade_ref` is a material change under SCI-002. Implementations **SHALL** obey SCI-002 immutability (new `evidence_version` or new `evidence_id`). SCI-003 does not redefine Evidence versioning.

---

## 13. Grade Transitions

EG-0.1 does **not** define a separate Grade state machine beyond label reassignment.

| Transition type | Rule |
|-----------------|------|
| Reassign label | Allowed iff new label eligible (§11) and assignment (§12) holds |
| Raise rank | Allowed only with Human Reviewer (§12.2 AR-2) |
| Lower rank | Allowed with Human Reviewer event; `authority_agent` **SHALL** match Human Reviewer pattern when Evidence is `registered` |
| To/from forbidden labels | **SHALL** be rejected |

Workflow states **SHALL NOT** appear as Grade transitions (ADR-0006).

---

## 14. Normative Invariants

1. `grade_ref` matches §9 regex.  
2. Label ∈ §8.1 closed set.  
3. EL-1 eligibility holds for current Evidence Source/Provenance.  
4. AR-2…AR-5 assignment authority holds.  
5. IR-1…IR-6 interpretation holds (no Standing/clinical/probability laundering).  
6. Forbidden labels (§8.2) absent.  
7. SCI-002 Evidence Identifier / Record State not redefined.  
8. Claim Standing not set by Grade alone.

---

## 15. Migration from `deferred_sci003`

**MIG-1:** `deferred_sci003` is **not** an EG-0.1 Grade.  
**MIG-2:** Evidence conformant to SCI-003@0.1.0 **SHALL NOT** retain `grade_ref=deferred_sci003`.  
**MIG-3:** Replacement **SHALL** set a §9 `grade_ref` via §12 Grade Assignment Event (`from_grade_ref` MAY be `deferred_sci003` or `null`).  
**MIG-4:** Until migration, SCI-002@0.1.0 encodings using `deferred_sci003` remain SCI-002-interim; they are **not** SCI-003-conformant Graded Evidence.  
**MIG-5:** Migration **SHALL NOT** silently raise rank without Human Reviewer when Rank(to) > 0 and target Rank > 1, or when AR-5 applies.

---

## 16. Failure Modes

| ID | Failure | Detection |
|----|---------|-----------|
| F1 | `grade_ref` fails §9 regex | §9 |
| F2 | Forbidden label | §8.2 |
| F3 | Eligibility violation (provenance ceiling) | §11.1 |
| F4 | Eligibility violation (source class/state) | §11.2 |
| F5 | Rank raise without `human:` authority | §12.2 |
| F6 | Registered Evidence lacking Human Grade Assignment Event | §12.2 AR-5 |
| F7 | Grade used to set Standing without SCI-001 STE | §10 IR-1 |
| F8 | Numeric confidence encoded as Grade | §8.2 |
| F9 | `deferred_sci003` retained under SCI-003 conformance claim | §15 |

---

## 17. Worked Examples

### Example A — Rank 4 `registered_primary_data`

| Field | Value |
|-------|--------|
| Evidence `source_class` | `laboratory` |
| Evidence `source_state` | `declared` |
| Evidence `provenance.completeness` | `complete` |
| `grade_ref` | `SCI-003@0.1.0:registered_primary_data` |
| Authority | `human:reviewer-01` + `decision_ref=dec:grade-001` |

### Example B — Rank 3 `curated_database_snapshot`

| Field | Value |
|-------|--------|
| `source_class` | `database_of_record` |
| `completeness` | `complete` |
| `grade_ref` | `SCI-003@0.1.0:curated_database_snapshot` |

### Example C — Rank 2 `literature_secondary`

| Field | Value |
|-------|--------|
| `source_class` | `literature_venue` |
| `completeness` | `partial` |
| `grade_ref` | `SCI-003@0.1.0:literature_secondary` |

### Example D — Rank 1 `model_output_only` (missing provenance ceiling)

| Field | Value |
|-------|--------|
| `completeness` | `missing` |
| `grade_ref` | `SCI-003@0.1.0:model_output_only` |
| Note | Any higher label **SHALL** be rejected (EL-P1) |

### Non-example (non-conformant)

`grade_ref=clinically_proven` · `grade_ref=0.87` · `grade_ref=SCI-003@0.1.0:registered_primary_data` with `completeness=missing` · AI agent raising Rank 1 → 4 without `human:` authority.

---

## 18. Known Risks

R1 Rubber-stamp Human Reviewer grading · R2 Source-class gaming to unlock higher ranks · R3 Indefinite delay migrating `deferred_sci003` · R4 Misreading rank as probability · R5 Pressure to add medical-guideline brand ladders

---

## 19. Scientific Limitations

1. EG-0.1 is a minimal four-class scheme, not a domain evidence hierarchy.  
2. Does not verify methods or reproduce results (SCI-006).  
3. Does not resolve contradictions (SCI-004).  
4. Does not set Claim Standing (SCI-001).  
5. Eligibility uses coarse SCI-002 Source classes only.  
6. No continuous scores by design.

---

## 20. Open Questions

| ID | Status |
|----|--------|
| OQ-G001 | OPEN — whether future MAJOR adds domain-pack grade profiles |
| OQ-G002 | OPEN — alignment notes to external evidence hierarchies (informative only) |
| OQ-G003 | OPEN — whether `literature_secondary` should split peer-reviewed vs preprint |

---

## 21. Acceptance Criteria (0.1.0)

1. SCI-000 Evidence Grade imported; Canonical Name not redefined.  
2. SCI-003 owns only Evidence Grade (semantics, eligibility, assignment, interpretation).  
3. EG-0.1 closed set of exactly four labels with ranks 1–4.  
4. `grade_ref` encoding deterministic and testable.  
5. Provenance `missing` ceiling enforced (lowest grade only).  
6. Source-class eligibility machine-checkable via SCI-002 fields by reference.  
7. Human Reviewer required to raise rank; AI cannot unilaterally raise Grade.  
8. Interpretation forbids Standing/clinical/probability laundering.  
9. Migration rules from `deferred_sci003` defined.  
10. Four worked examples (one per label) + failure modes present.  
11. No new specs, shared registries, Identifier/Version frameworks, or ontology terms.  
12. KEEP LOCAL respected; Claim/Evidence ownership unchanged.  
13. Self-review completed (§24).

---

## 22. Conformance Checklist

An Evidence Grade assignment is conformant to **SCI-003@0.1.0 / EG-0.1** iff:

- [ ] `grade_ref` matches §9  
- [ ] Label ∈ §8.1  
- [ ] EL-1 eligibility holds  
- [ ] §12 assignment events/authority hold  
- [ ] IR-1…IR-6 not violated  
- [ ] No forbidden labels  
- [ ] No Claim Standing mutation by Grade alone  
- [ ] No Workflow values used as Grade  
- [ ] No API/schema/code required by this text  

---

## 23. Definition of Done

SCI-003 **0.1.0** text is complete when §21 Acceptance Criteria 1–13 hold for this document.

SCI-003 is **program DONE** only when review/approval gates pass under program rules.

**Current status:** Spec text complete → **READY FOR REVIEW**.

---

## 24. Self-review

| Check | Result |
|-------|--------|
| Owns only Evidence Grade | **PASS** |
| Does not own Claim/Standing/Evidence/Verification/Contradiction/NR | **PASS** |
| Imports SCI-000; references SCI-001/SCI-002 without redefinition | **PASS** |
| Forbidden SCI-000 grade states excluded | **PASS** |
| Provenance missing ⇒ lowest grade | **PASS** |
| AI cannot unilaterally raise Grade | **PASS** |
| Machine-testable SHALL/MUST | **PASS** |
| KEEP LOCAL (no extraction / no shared frameworks) | **PASS** |
| ADR-0006 (Grade ≠ Workflow) | **PASS** |
| Four grades with examples (MEP T-011 coverage intent) | **PASS** |

### Remaining known limitations

1. Coarse four-class ladder only.  
2. Eligibility tied to SCI-002 Source classes, not assay-level method quality.  
3. SCI-001 still does not consult Grade for Standing (by design).  
4. SCI-002@0.1.0 text still allows interim `deferred_sci003` until encodings migrate (MIG-4).  
5. Human Reviewer pattern duplicated Grade-locally (`human:`) — Candidate for future AEB review only (not extracted here).

### Conflicts

**None requiring STOP.** Ownership matrix respected; no architectural change; no governance change; no new specifications beyond SCI-003 itself.

---

*End of SCI-003 Scientific Evidence Grade Specification v0.1.0*

# SCI-002 Scientific Evidence Object Specification v0.1.0

| Field | Value |
|-------|--------|
| **Spec ID** | SCI-002 |
| **Artifact ID** | SPEC-OBJ-EVIDENCE-001 |
| **Version** | **0.1.0** |
| **Status** | READY FOR REVIEW |
| **Ontology pin** | SCI-000 Core Scientific Ontology **v0.1.0** (PROVISIONAL APPROVED) |
| **Related object pin** | SCI-001@0.1.1 (Claim identity reference only) |
| **Architecture pin** | ADR-0006 (ACCEPTED) — Workflow ≠ epistemic object state |
| **Normative language** | RFC 2119: SHALL / SHALL NOT / MUST / MUST NOT / SHOULD / MAY |

---

## 0. Normative Changelog (initial)

| ID | Change |
|----|--------|
| N1 | Initial Evidence object normative structure |
| N2 | Evidence-local Identifier, Version, and pin rules |
| N3 | Evidence Source minimum + source classification |
| N4 | Evidence Provenance minimum + completeness |
| N5 | Evidence Item / Collection minimum constituents |
| N6 | Evidence Record State machine (`draft` / `registered` / `withdrawn`) |
| N7 | Immutability and material-change rules |
| N8 | `bears_on` Claim linkage by id only |
| N9 | Grade slot deferred to SCI-003 (`deferred_sci003` interim) |
| N10 | Machine-testable invariants and conformance checklist |

**Not in this specification:** Evidence Grade ladder (SCI-003); Claim Standing; Verification; Contradiction; Negative Result; Workflow; shared Identifier/Version/Ethics frameworks; APIs/schemas/code.

---

## 1. Purpose

This document is the **constitutional normative specification** of the SciROS **Evidence** object.

It defines Evidence structure, Record State transitions, Source, Provenance, Item/Collection constituents, immutability, and Claim linkage—without defining Evidence Grades, Claim Standing, Verification procedures, APIs, storage, or code.

Evidence attaches warrant to Claims. Evidence **SHALL NOT** replace Claims, set Claim Standing, or certify clinical validity.

---

## 2. Scope

This specification covers:

1. Normative structure and invariants of Evidence (Knowledge Object per SCI-000).  
2. Evidence Item and Evidence Collection minimum constituents (SCI-000 child concepts; detail owned here).  
3. Evidence Source and Evidence Provenance minimum constituents.  
4. Evidence Record State machine using SCI-000 Allowed States only.  
5. Evidence-local Identifier, Version, and pin rules.  
6. Relationship `bears_on` → Claim by `claim_id` only.  
7. Conformance requirements for Evidence encodings.

---

## 3. Out of Scope

This specification does **not** define:

1. Claim object internals or Standing (SCI-001 / SCI-000).  
2. Evidence Grade labels, schemes, or assignment algorithms (SCI-003).  
3. Contradiction (SCI-004), Negative Result (SCI-005), Verification (SCI-006).  
4. Workflow State / pipeline review vocabulary (ADR-0006; Program Execution).  
5. Global Identifier, Version, Scope, or Ethics frameworks.  
6. Clinical Boundary lexicons or speech-act catalogues.  
7. APIs, JSON Schema, databases, classes, UI, storage.  
8. Agent reasoning algorithms.

---

## 4. Normative References

| Reference | Role |
|-----------|------|
| **SCI-000 v0.1.0** | Vocabulary authority |
| **SCI-001 v0.1.1** | Claim `claim_id` pattern for `bears_on` targets |
| **ADR-0006** | Workflow State ≠ epistemic object state |

This specification **SHALL NOT** redefine any Canonical Name owned by SCI-000.  
This specification **SHALL NOT** define or extend Evidence Grade.

---

## 5. Dependencies

| Dependency | Requirement |
|------------|-------------|
| SCI-000@0.1.0 | MUST be provisionally approved or approved |
| SCI-001@0.1.1 | MUST exist for `bears_on` target identity pattern |
| SCI-003 | NOT required for SCI-002@0.1.0 issuance; grade semantics deferred |

---

## 6. Concept Ownership

| Concept | Vocabulary | Detail |
|---------|------------|--------|
| Evidence | SCI-000 | **SCI-002** |
| Evidence Item | SCI-000 | **SCI-002** |
| Evidence Collection | SCI-000 | **SCI-002** |
| Evidence Source | SCI-000 | **SCI-002** |
| Evidence Provenance | SCI-000 | **SCI-002** |
| Evidence Grade | SCI-000 | **SCI-003** (slot only here) |
| Claim / Standing | SCI-000 | SCI-001 |
| Verification / Contradiction / Negative Result | SCI-000 | SCI-006 / SCI-004 / SCI-005 |
| Workflow State | — | Program Execution (ADR-0006); **not** SCI-002 |

---

## 7. Definition

Per SCI-000:

> **Evidence** — A citable informational object offered in support, qualification, or refutation of one or more Claims, carrying Source, Provenance, and Grade.

**SCI-002 refinement (non-redefining):**  
Evidence is the sole warrant object that may be referenced by Claim `supported_by`. Evidence **relates to** Claims via `bears_on`; it does not assert propositions as Claims and does not own Standing.

### 7.1 Mandatory logical constituents

An Evidence object **SHALL** include all of:

| Constituent | Normative rule |
|-------------|----------------|
| `evidence_id` | §7.3 |
| `ontology_ref` | §7.5 |
| `spec_ref` | §7.5 |
| `evidence_version` | §7.5 |
| `summary` | Non-empty Unicode string after NFC; length ≥ 1 after trim of leading/trailing whitespace |
| `record_state` | Exactly one of SCI-000 Evidence Allowed States: `draft`, `registered`, `withdrawn` |
| `source` | §8 |
| `provenance` | §9 |
| `grade_ref` | §7.6 |
| `ethics_constraint_marker` | §7.4 |
| `created_by` | Non-empty Agent identifier string |
| `created_at` | UTC timestamp string `YYYY-MM-DDThh:mm:ssZ` (second resolution) |
| `items` | Array of Evidence Item objects; cardinality rules in §10 |

Optional (MAY): `collection` (§11), `bears_on[]` (§12), `protocol_ref`, `dataset_refs[]`, `citation_refs[]`, `ai_assisted` (§7.7), `human_sponsor` (§7.7), `record_transition_log[]` (§13.3).

### 7.2 Forbidden Evidence Record States

`record_state` **SHALL NOT** be `proof` or `certainty` (SCI-000 Forbidden States).  
`record_state` **SHALL NOT** be any Claim Standing value.  
`record_state` **SHALL NOT** be any Workflow State value (ADR-0006).

### 7.3 Evidence Identifier — Evidence-local rules

1. `evidence_id` **SHALL** match: `^evidence:[A-Za-z0-9._~-]{1,128}$`  
2. Within one implementing system’s Evidence store, `evidence_id` **SHALL** be unique.  
3. `evidence_id` **SHALL NOT** change across Record State transitions.  
4. `evidence_id` **SHALL NOT** change across `evidence_version` increments on the same identity lineage.  
5. These rules are **Evidence-local**. This document **SHALL NOT** define a global SciROS Identifier standard.

**Test:** Reject any Evidence whose `evidence_id` fails the regex or collides within the store.

### 7.4 Ethics Constraint marker (Evidence-local only)

1. `ethics_constraint_marker` **SHALL** be exactly the string `non_clinical`.  
2. Presence of this marker **SHALL** be interpreted as acknowledgement of SCI-000 Clinical Boundary for this Evidence.  
3. This specification **SHALL NOT** define an ethics vocabulary, lexicon, or speech-act catalogue.

### 7.5 Pins and Evidence Version strings (Evidence-local only)

| Field | Pattern | Example |
|-------|---------|---------|
| `ontology_ref` | `^SCI-000@0\.1\.[0-9]+$` | `SCI-000@0.1.0` |
| `spec_ref` | `^SCI-002@0\.1\.[0-9]+$` | `SCI-002@0.1.0` |
| `evidence_version` | `^[0-9]+\.[0-9]+\.[0-9]+$` | `1.0.0` |

1. On issuance of an Evidence Version, `evidence_version` **SHALL** be set.  
2. First issued Version of an Evidence identity **SHALL** use `evidence_version` `1.0.0` unless a documented migration Decision states otherwise.  
3. These pin/version rules are **Evidence-local**. This document **SHALL NOT** define a shared pinning standard for other objects.

### 7.6 Grade slot (not Evidence Grade ownership)

1. `grade_ref` **SHALL** be a string.  
2. Until SCI-003 is approved, `grade_ref` **MAY** equal the exact string `deferred_sci003`.  
3. When SCI-003 is approved, conformant Evidence **SHALL** use a `grade_ref` defined by SCI-003; migration rules belong to SCI-003.  
4. SCI-002 **SHALL NOT** interpret grade strength, ordinal rank, or clinical meaning.  
5. SCI-002 **SHALL NOT** invent grade labels.

### 7.7 AI authorship markers (Evidence-local)

1. `ai_assisted` **SHALL** be boolean when present.  
2. If `ai_assisted` is `true`, `human_sponsor` **SHALL** be a non-empty Agent identifier string.  
3. If `ai_assisted` is `false` or absent, `human_sponsor` MAY be absent.  
4. If `ai_assisted` is `true`, `record_state` **SHALL** be `draft` until a Human Reviewer enacts a Record Transition Event to `registered` or `withdrawn` (§13.3).

---

## 8. Evidence Source — minimum constituents

`source` **SHALL** be a structured object with **exactly** these mandatory fields:

| Field | Rule |
|-------|------|
| `source_class` | Exactly one value from §8.1 |
| `source_locator` | Non-empty string after NFC + trim (length ≥ 1) |
| `source_state` | Exactly one of SCI-000 Evidence Source Allowed States: `declared`, `unresolved` |

**SHALL NOT:** define a global Source registry or shared Entity framework in this document.

### 8.1 Source classification (Evidence-local closed set)

`source_class` **SHALL** be exactly one of:

| Value | Meaning |
|-------|---------|
| `database_of_record` | Named database of record |
| `instrument` | Instrument or measurement system |
| `laboratory` | Laboratory or assay facility |
| `registry` | Trial or deposit registry |
| `literature_venue` | Publication or literature venue |
| `curated_deposit` | Curated data deposit / archive |
| `other` | Origin not covered above; `source_locator` **SHALL** still be specific (not the string `unknown`) |

**Test:** Reject `source_class` outside this set. Reject any `source_locator` that is empty after NFC + trim, or equals the exact string `unknown`.

**Equivalence (Source):** Two Sources are equal iff `(source_class, source_locator, source_state)` are pairwise string-equal after NFC + trim on string fields.

---

## 9. Evidence Provenance — minimum constituents

`provenance` **SHALL** be a structured object with **exactly** these mandatory fields:

| Field | Rule |
|-------|------|
| `completeness` | Exactly one of SCI-000 Evidence Provenance Allowed States: `complete`, `partial`, `missing` |
| `obtained_at` | UTC `YYYY-MM-DDThh:mm:ssZ` |
| `transform_summary` | Non-empty string after NFC + trim; if no transform, **SHALL** be the exact string `none` |
| `custody_agent` | Non-empty Agent identifier string |

Optional (MAY): `protocol_ref`, `dataset_ref`, `transform_artifact_ref` (each non-empty string if present).

**SHALL NOT:** define a platform-wide ProvenanceEnvelope engineering standard in this document.  
**SHALL NOT:** use Provenance Allowed State `implied` (SCI-000 Forbidden).

**Equivalence (Provenance content for material change):** pairwise equality of the four mandatory fields after NFC + trim on strings.

**Note (informative):** SCI-000 states that `missing` provenance constrains maximum Evidence Grade under SCI-003. SCI-002 records `completeness` but **SHALL NOT** enforce grade caps.

---

## 10. Evidence Item — minimum constituents

Each element of `items` **SHALL** be an object with:

| Field | Rule |
|-------|------|
| `item_id` | Match `^eitem:[A-Za-z0-9._~-]{1,128}$`; unique within the Evidence |
| `content_summary` | Non-empty string after NFC + trim |
| `item_state` | Exactly one of SCI-000 Evidence Item Allowed States: `active`, `withdrawn` |

Optional (MAY): `observation_ref`, `finding_ref`, `units`, `conditions` (strings).

**Cardinality**

1. If `record_state=draft`, `items` **MAY** be empty or contain ≥ 1 Item.  
2. If `record_state=registered`, `items` **SHALL** contain ≥ 1 Item with `item_state=active`.  
3. An Item **SHALL NOT** be treated as a Claim (`item_state` **SHALL NOT** be `claim`).

---

## 11. Evidence Collection — optional constituent

If `collection` is present, it **SHALL** be an object with:

| Field | Rule |
|-------|------|
| `collection_id` | Match `^ecol:[A-Za-z0-9._~-]{1,128}$` |
| `member_item_ids` | Array of `item_id` strings; each **SHALL** exist in `items` |
| `collection_state` | Exactly one of SCI-000 Evidence Collection Allowed States: `open`, `closed`, `withdrawn` |

1. `member_item_ids` **SHALL** contain ≥ 1 id when `collection_state` ∈ {`open`,`closed`}.  
2. Membership change after `registered` **SHALL** be a material change (§14).

---

## 12. Relationship to Claim

1. `bears_on` **SHALL** be an array of Claim id strings when present.  
2. Each entry **SHALL** match SCI-001 Claim Identifier pattern: `^claim:[A-Za-z0-9._~-]{1,128}$`.  
3. Evidence **SHALL NOT** modify Claim Standing.  
4. Evidence **SHALL NOT** require Verification to exist.  
5. If `record_state=registered` and `bears_on` is non-empty, each referenced Claim id **SHALL** be non-empty and regex-valid (existence in a Claim store is an implementation integration check, not redefined here).  
6. Claim-side `supported_by` rules remain owned by SCI-001.

---

## 13. Evidence Record State Machine (object-local)

### 13.0 Naming rule (ADR-0006)

1. **Evidence Record State** is the only object-local state enum in this specification (`draft`, `registered`, `withdrawn`).  
2. **Workflow State** **SHALL NOT** appear as Evidence Record State.  
3. The word **Lifecycle**, if used informatively, **SHALL NOT** name a third Evidence enum.  
4. Claim Standing **SHALL NOT** appear as Evidence Record State.

### 13.1 Allowed transitions

| From | To |
|------|-----|
| (new) | `draft` |
| `draft` | `registered`, `withdrawn` |
| `registered` | `withdrawn` |

### 13.2 Forbidden transitions

| Forbidden | Reason |
|-----------|--------|
| `withdrawn` → `draft` / `registered` | Terminal for this `evidence_id`; use new Evidence |
| `registered` → `draft` | Audit destruction |
| Any → `proof` / `certainty` / Standing / Workflow values | SCI-000 + ADR-0006 |
| AI-only promotion `draft` → `registered` | §13.4 |

### 13.3 Record Transition Event — minimum fields (Evidence-local)

Every Record State change except initial creation at `draft` **SHALL** append an event object with:

| Field | Rule |
|-------|------|
| `event_id` | Match `^erte:[A-Za-z0-9._~-]{1,128}$`; unique within the Evidence |
| `at` | UTC `YYYY-MM-DDThh:mm:ssZ` |
| `from_state` | SCI-000 Evidence Allowed State or exact string `null` for first creation path edge cases |
| `to_state` | SCI-000 Evidence Allowed State |
| `authority_agent` | Non-empty Agent id. When Human Reviewer is required (§13.4), **SHALL** match `^human:[A-Za-z0-9._~-]{1,128}$` |
| `reason` | Non-empty string (length ≥ 1 after trim) |
| `decision_ref` | If `to_state=registered`: **SHALL** be non-empty. Otherwise: MAY be absent |

Always mandatory: `event_id`, `at`, `from_state`, `to_state`, `authority_agent`, `reason`.

**Human Reviewer pattern (Evidence-local):** `^human:[A-Za-z0-9._~-]{1,128}$`

**SHALL NOT** define a generic platform Event framework.

### 13.4 Registration rule (machine-checkable)

**ERR-1:** `record_state` **MAY** equal `registered` only if **all** are true:

1. `items` contains ≥ 1 Item with `item_state=active`;  
2. `source` satisfies §8;  
3. `provenance` satisfies §9;  
4. A Record Transition Event exists with `to_state=registered`, `authority_agent` matching Human Reviewer pattern, and non-empty `decision_ref`;  
5. `grade_ref` is a non-empty string (including allowed interim `deferred_sci003`);  
6. If `ai_assisted` is `true`, the registering event **SHALL** satisfy (4).

**ERR-2:** Evidence Grade semantics **SHALL NOT** be evaluated by SCI-002.  
**ERR-3:** Claim Standing **SHALL NOT** be changed by Evidence registration.

---

## 14. Immutability and material change

1. After an Evidence Version is issued with `record_state=registered`, the tuple  
   `(summary, source, provenance, items, collection, grade_ref)`  
   for that `evidence_version` **SHALL** be immutable.  
2. Record State changes to `withdrawn` **SHALL NOT** alter that tuple except Item `item_state` values **MAY** become `withdrawn` only via a new `evidence_version` **or** via append-only withdrawal annotation that does not rewrite Item `content_summary` *(implementations SHALL use new `evidence_version` if any Item content field changes)*.  
3. **Material change (deterministic):** Any change that makes NFC+trim string equality fail for `summary`, or makes Source unequal per §8, or Provenance unequal per §9, or changes any Item `content_summary` / set of `item_id`s, or changes `collection.member_item_ids`, or changes `grade_ref`, **SHALL** be a material change.  
4. On material change, an implementation **SHALL** either:  
   - mint a new `evidence_version` on the same `evidence_id` (`evidence_version` string **MUST** change), **or**  
   - create a new Evidence identity (new `evidence_id`).  
5. In-place overwrite of the immutable tuple for an existing registered `evidence_version` **SHALL** be non-conformant.

---

## 15. Permitted Relationships

References only; Evidence does not own targets.

| Name | To | Cardinality | Rule |
|------|-----|-------------|------|
| `has_item` | Evidence Item | 0..* draft; 1..* registered | §10 |
| `has_collection` | Evidence Collection | 0..1 | §11 |
| `has_source` | Evidence Source | 1..1 | §8 |
| `has_provenance` | Evidence Provenance | 1..1 | §9 |
| `has_grade` | Grade ref string | 1..1 | §7.6 slot only |
| `bears_on` | Claim id | 0..* | §12 |
| `cites` | Citation/Reference | 0..* | MAY |
| `uses_dataset` | Dataset ref | 0..* | MAY |
| `governed_under` | Protocol ref | 0..1 | MAY |

---

## 16. Forbidden Relationships / Behaviours

**SHALL NOT:**

1. Own or assign Evidence Grade semantics (SCI-003).  
2. Own Claim Standing or set Standing.  
3. Own Verification, Contradiction, or Negative Result.  
4. Be a Diagnosis / TreatmentRecommendation / PatientRiskScore / ClinicalDecision.  
5. Self-certify truth or clinical validity.  
6. Use `record_state` values outside SCI-000 Evidence Allowed States.  
7. Treat chatbot paraphrase or undocumented screenshot alone as conformant registered Evidence without Source + Provenance satisfying §8–§9.  
8. Merge Workflow State into Record State.

---

## 17. Normative Invariants (summary)

1. `evidence_id` satisfies §7.3.  
2. Pins and `evidence_version` satisfy §7.5.  
3. `record_state` ∈ {`draft`,`registered`,`withdrawn`}.  
4. `ethics_constraint_marker` = `non_clinical`.  
5. `source` and `provenance` satisfy §8–§9.  
6. ERR-1 holds when `record_state=registered`.  
7. `bears_on` entries match Claim id pattern when present.  
8. Material immutability §14 holds.  
9. Human Reviewer pattern required for `draft` → `registered`.  
10. No Evidence Grade interpretation by SCI-002.

---

## 18. Failure Modes

| ID | Failure | Detection |
|----|---------|-----------|
| F1 | Bad `evidence_id` / pin / version pattern | §7.3, §7.5 |
| F2 | `source_class` outside closed set / empty locator | §8 |
| F3 | Provenance missing mandatory field / `implied` | §9 |
| F4 | `registered` without ERR-1 | §13.4 |
| F5 | Non-`human:` authority on registration | §13.3–§13.4 |
| F6 | In-place material overwrite | §14 |
| F7 | `bears_on` entry fails Claim id regex | §12 |
| F8 | `record_state` forbidden value | §7.2 |
| F9 | `grade_ref` empty | §7.6 |
| F10 | `registered` with zero active Items | §10, §13.4 |

---

## 19. Worked Examples

### Example A — Registered curated deposit (ungraded interim)

| Field | Value |
|-------|--------|
| `evidence_id` | `evidence:uniprot-snap-001` |
| `ontology_ref` | `SCI-000@0.1.0` |
| `spec_ref` | `SCI-002@0.1.0` |
| `evidence_version` | `1.0.0` |
| `summary` | Snapshot of curated protein accession P12345 sequence metadata used as warrant substrate |
| `record_state` | `registered` |
| `source.source_class` | `database_of_record` |
| `source.source_locator` | `UniProt:P12345@2026-01-15` |
| `source.source_state` | `declared` |
| `provenance.completeness` | `complete` |
| `provenance.obtained_at` | `2026-01-15T12:00:00Z` |
| `provenance.transform_summary` | `none` |
| `provenance.custody_agent` | `human:curator-01` |
| `grade_ref` | `deferred_sci003` |
| `ethics_constraint_marker` | `non_clinical` |
| `items[0].item_id` | `eitem:seqmeta-1` |
| `items[0].content_summary` | Accession P12345 primary sequence length and organism tag |
| `items[0].item_state` | `active` |
| `bears_on` | [`claim:example-001`] |
| Registration STE | `authority_agent=human:reviewer-01`, `decision_ref=dec:ev-reg-001` |

### Example B — Draft instrument reading (AI-assisted)

| Field | Value |
|-------|--------|
| `evidence_id` | `evidence:assay-draft-77` |
| `record_state` | `draft` |
| `ai_assisted` | `true` |
| `human_sponsor` | `human:sponsor-09` |
| `summary` | Draft capture of spectrophotometer OD600 reading pending human registration |
| `source.source_class` | `instrument` |
| `source.source_locator` | `lab-spectrometer-3` |
| `source.source_state` | `declared` |
| `provenance.completeness` | `partial` |
| `provenance.transform_summary` | `raw_to_od600_v1` |
| `grade_ref` | `deferred_sci003` |
| `ethics_constraint_marker` | `non_clinical` |
| `items` | MAY be empty while draft |

**Non-example (non-conformant):** chatbot paraphrase of a paper with `source_locator=the internet` and `record_state=registered`.

---

## 20. Known Risks

R1 Fake Source locators · R2 `deferred_sci003` used indefinitely · R3 Empty `bears_on` registered Evidence unused · R4 Material-change SemVer component ambiguity · R5 Human Reviewer rubber-stamping registration

---

## 21. Scientific Limitations

1. Does not determine biological truth.  
2. Does not grade warrant strength (SCI-003).  
3. Does not verify methods (SCI-006).  
4. Does not set Claim Standing (SCI-001).  
5. Evidence-local ID/pin rules are not platform-wide standards.  
6. No automated clinical lexicon.

---

## 22. Open Questions

| ID | Status |
|----|--------|
| OQ-E001 | OPEN — SCI-003 will replace `deferred_sci003` |
| OQ-E002 | OPEN — whether Finding long-term collapses into Evidence Item (SCI-000 OQ-3) |
| OQ-E003 | OPEN — multilingual `summary` / Item content |

---

## 23. Acceptance Criteria (0.1.0)

1. SCI-000 Evidence vocabulary imported; no Canonical Name redefined.  
2. Evidence owns only Evidence / Item / Collection / Source / Provenance detail.  
3. Evidence Grade not defined; slot + `deferred_sci003` interim only.  
4. Evidence-local Identifier regex defined.  
5. Source classification closed set + minimum fields testable.  
6. Provenance minimum fields + completeness enum testable.  
7. Record State machine uses only SCI-000 Allowed States; ADR-0006 respected.  
8. ERR-1 registration rule machine-checkable without Verification/Standing.  
9. Material change deterministic.  
10. `bears_on` uses Claim id pattern only; Standing not owned.  
11. No new specifications, ADRs, ontology terms, or shared frameworks introduced.  
12. Two worked examples + conformance checklist present.  
13. Self-review completed (§26).

---

## 24. Validation / Conformance Checklist

A Evidence encoding is conformant to **SCI-002@0.1.0** iff:

- [ ] §§7–16 invariants hold  
- [ ] `record_state` ∈ {`draft`,`registered`,`withdrawn`}  
- [ ] Source `source_class` ∈ closed set  
- [ ] Provenance `completeness` ∈ {`complete`,`partial`,`missing`}  
- [ ] ERR-1 satisfied when registered  
- [ ] No Grade semantics interpreted  
- [ ] No Claim Standing mutation  
- [ ] No Workflow values as Record State  
- [ ] No API/schema/code required by this text  

---

## 25. Definition of Done

SCI-002 **0.1.0** text is complete when §23 Acceptance Criteria 1–13 hold for this document.

SCI-002 is **program DONE** only when review/approval gates pass under program rules.

**Current status:** Spec text complete → **READY FOR REVIEW**.

---

## 26. Self-review

| Check | Result |
|-------|--------|
| Owns only Evidence (+ Item/Collection/Source/Provenance detail per SCI-000) | **PASS** |
| Does not own Claim/Standing/Verification/Grade/Contradiction/Negative Result | **PASS** |
| No new ontology terms | **PASS** |
| No new specs / ADRs / governance | **PASS** |
| KEEP LOCAL for ID/Version/Ethics marker/Human pattern | **PASS** |
| SHALL/MUST machine-testable | **PASS** (Human Reviewer via `human:` regex; ERR-1) |
| ADR-0006 dual-axis | **PASS** (Record State ≠ Workflow ≠ Standing) |
| Aligns with SCI-001 `supported_by` / `bears_on` id linkage | **PASS** |

### Remaining known limitations

1. Grade deferred (`deferred_sci003`).  
2. Claim store existence check for `bears_on` is integration-level.  
3. SemVer component choice on material change left to implementer (string **MUST** change).  
4. `summary` / Item content remain free text (semantic equivalence undecidable beyond NFC+trim).  
5. Source locator quality not semantically validated beyond non-emptiness / not `unknown`.

### Conflicts

**None requiring STOP.** SCI-000 ownership matrix respected; SCI-001 Standing untouched; no architectural change.

---

*End of SCI-002 Scientific Evidence Object Specification v0.1.0*

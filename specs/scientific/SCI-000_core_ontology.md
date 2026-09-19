# SciROS Core Scientific Ontology v0.1

**Spec ID:** SCI-000  
**Artifact ID:** SPEC-ONT-CORE-001  
**Version:** 0.1.0  
**Status:** PROVISIONAL APPROVED  
**Normative dependency:** All future SciROS scientific and engineering specifications MUST import vocabulary from this document and MUST NOT redefine listed canonical terms.  
**Approval record:** `execution/pipeline/reviews/SCI-000_PROVISIONAL_APPROVAL.md`  
**Reopen rule:** Do NOT reopen SCI-000 unless a constitutional defect is discovered. Follow-ups → backlog only.

---

## 1. Philosophy

SciROS treats science as a **claim economy under uncertainty**. The ontology therefore privileges a small set of epistemic objects (Claim, Evidence, Contradiction, Negative Result, Verification) over domain biology vocabularies.

This ontology is:

- **domain-agnostic** (no disease, molecule, or assay types here);
- **minimal** (synonyms are collapsed; fashion terms are reserved or rejected);
- **non-overlapping** (one responsibility per concept);
- **versionable** (this document has SemVer; concepts inherit `ontology_version`).

It does **not** describe APIs, storage, code, or UI.

---

## 2. Naming Rules

1. **Canonical Name** is singular PascalCase in prose headings; in running text, ordinary English capitalization.  
2. One concept → one Canonical Name. Synonyms are listed as **Non-canonical**; they MUST NOT be introduced as parallel types.  
3. Names MUST NOT encode clinical authority (`Diagnosis`, `Prescription`, `PatientRiskScore` are forbidden as SciROS core types).  
4. Process nouns (`Review`, `Decision`) are distinct from epistemic nouns (`Claim`, `Evidence`).  
5. If two candidate terms overlap >80% in meaning, keep one; mark the other Non-canonical or Forbidden.  
6. Extensions add concepts only via §9; they MUST NOT silently overload core names.

---

## 3. Canonical Vocabulary

Each entry uses the mandatory field set. Concepts not listed in §3 are **not** core until admitted by change management.

---

### 3.1 Claim

| Field | Content |
|-------|---------|
| **Canonical Name** | Claim |
| **Definition** | A scoped, versioned scientific proposition with explicit Standing, eligible to be linked to Evidence and subject to Verification, Contradiction, Retraction, or Supersession. |
| **Purpose** | Atomic unit of assertional content in SciROS. |
| **Scope** | Any domain-agnostic scientific proposition representable in SciROS. |
| **Out of Scope** | Clinical directives; bulk data; narrative papers as wholes; model logits as Claims. |
| **Parent Concept** | Knowledge Object |
| **Child Concepts** | *(none in v0.1; subtypes deferred)* |
| **Relationships** | supported_by → Evidence; contested_by → Contradiction; nullified_or_qualified_by → Negative Result; verified_via → Verification; scoped_by → Scope; constrained_by → Constraint; assumes → Assumption |
| **Allowed States (Standing)** | `draft_unverified`, `supported`, `contested`, `superseded`, `retracted` |
| **Forbidden States** | `true`, `proven`, `clinical_grade`, `validated_by_ai` |
| **Ownership** | Detail spec: **SCI-001**; Vocabulary: **SCI-000** |
| **Versioning Rules** | Material change to proposition or scope ⇒ new Claim revision or successor Claim; Standing changes are state transitions, not silent edits |
| **Examples** | “Under protocol P, metric M on dataset D exceeds threshold T.” |
| **Counterexamples** | “Patient should start drug X.” / “The model is 92% sure.” |
| **Future Notes** | Formal logic encoding optional; not required in v0.1 |

**Non-canonical synonyms (MUST NOT be separate types):** Assertion, Statement *(use Claim)*.

---

### 3.2 Evidence

| Field | Content |
|-------|---------|
| **Canonical Name** | Evidence |
| **Definition** | A citable informational object offered in support, qualification, or refutation of one or more Claims, carrying Source, Provenance, and Grade. |
| **Purpose** | Attach empirical or curated warrant to Claims without conflating warrant with the Claim text. |
| **Scope** | Items and collections that can be graded and provenance-tracked. |
| **Out of Scope** | The Claim itself; unverifiable private intuition; clinical orders. |
| **Parent Concept** | Knowledge Object |
| **Child Concepts** | Evidence Item; Evidence Collection |
| **Relationships** | has_item → Evidence Item; has_grade → Evidence Grade; has_source → Evidence Source; has_provenance → Evidence Provenance; bears_on → Claim |
| **Allowed States** | `draft`, `registered`, `withdrawn` |
| **Forbidden States** | `proof`, `certainty` |
| **Ownership** | **SCI-002** (detail); **SCI-000** (term) |
| **Versioning Rules** | Grade or content change ⇒ new Evidence revision; links to Claims updated explicitly |
| **Examples** | A deposited table of measurements with protocol ID; a curated database record snapshot citation |
| **Counterexamples** | A chatbot paraphrase of a paper; an undocumented screenshot |
| **Future Notes** | Domain evidence profiles via packs |

---

### 3.3 Evidence Item

| Field | Content |
|-------|---------|
| **Canonical Name** | Evidence Item |
| **Definition** | A single atomic evidentiary unit (one result row, one observation record, one curated statement instance) within Evidence. |
| **Purpose** | Granularity for audit and partial retraction. |
| **Scope** | Atomic warrant elements. |
| **Out of Scope** | Entire multi-study reviews (use Collection). |
| **Parent Concept** | Evidence |
| **Child Concepts** | *(none)* |
| **Relationships** | member_of → Evidence Collection (optional); instance_of → Observation or derived Finding |
| **Allowed States** | `active`, `withdrawn` |
| **Forbidden States** | `claim` *(Items are not Claims)* |
| **Ownership** | **SCI-002** |
| **Versioning Rules** | Immutable once registered except withdrawal |
| **Examples** | One measured value with units and conditions |
| **Counterexamples** | An entire paper |
| **Future Notes** | — |

---

### 3.4 Evidence Collection

| Field | Content |
|-------|---------|
| **Canonical Name** | Evidence Collection |
| **Definition** | A defined set of Evidence Items grouped for joint grading or joint citation. |
| **Purpose** | Handle multi-item warrant without flattening into one opaque blob. |
| **Scope** | Explicit membership sets. |
| **Out of Scope** | Ad-hoc folders without membership rules |
| **Parent Concept** | Evidence |
| **Child Concepts** | *(none)* |
| **Relationships** | contains → Evidence Item |
| **Allowed States** | `open`, `closed`, `withdrawn` |
| **Forbidden States** | — |
| **Ownership** | **SCI-002** |
| **Versioning Rules** | Membership change ⇒ new Collection revision |
| **Examples** | All primary endpoints of one registered Protocol |
| **Counterexamples** | “Everything we liked in PubMed” |
| **Future Notes** | — |

---

### 3.5 Evidence Grade

| Field | Content |
|-------|---------|
| **Canonical Name** | Evidence Grade |
| **Definition** | A controlled ordinal or categorical label expressing the warrant strength class of Evidence relative to a published grading scheme—not a probability of truth. |
| **Purpose** | Prevent silent inflation of confidence; enable comparable audit. |
| **Scope** | Labels defined in SCI-003 only. |
| **Out of Scope** | Continuous “model confidence”; clinical risk scores |
| **Parent Concept** | Vocabulary term (controlled) |
| **Child Concepts** | *(scheme-specific labels owned by SCI-003)* |
| **Relationships** | grades → Evidence; scheme_defined_in → SCI-003 |
| **Allowed States** | per SCI-003 scheme |
| **Forbidden States** | `AI_certified`, `clinically_proven` |
| **Ownership** | **SCI-003** |
| **Versioning Rules** | Scheme version pinned on each Evidence |
| **Examples** | “registered_primary_data”, “curated_database_snapshot”, “model_output_only” *(illustrative names; normative list in SCI-003)* |
| **Counterexamples** | “0.87 confidence” as a grade |
| **Future Notes** | Align loosely with evidence hierarchies without copying medical guideline brands |

---

### 3.6 Evidence Source

| Field | Content |
|-------|---------|
| **Canonical Name** | Evidence Source |
| **Definition** | The origin system or actor from which Evidence was obtained (database of record, instrument, laboratory, registry, literature venue). |
| **Purpose** | Attribution and trust context. |
| **Scope** | Provenance of origin, not full chain (see Evidence Provenance). |
| **Out of Scope** | Complete transformation graphs |
| **Parent Concept** | Entity *(as source actor/system)* |
| **Child Concepts** | *(none required)* |
| **Relationships** | provides → Evidence |
| **Allowed States** | `declared`, `unresolved` |
| **Forbidden States** | — |
| **Ownership** | **SCI-002** |
| **Versioning Rules** | Source identity stable; descriptors may revise |
| **Examples** | UniProt release tag; trial registry ID |
| **Counterexamples** | “the internet” |
| **Future Notes** | — |

---

### 3.7 Evidence Provenance

| Field | Content |
|-------|---------|
| **Canonical Name** | Evidence Provenance |
| **Definition** | The recorded chain of custody and transformations from Evidence Source to the registered Evidence object. |
| **Purpose** | Auditability and reproduction of warrant. |
| **Scope** | Custody/transform history for Evidence. |
| **Out of Scope** | Full computational Run manifests (may link out); UI logs |
| **Parent Concept** | Knowledge Object |
| **Child Concepts** | *(none)* |
| **Relationships** | documents → Evidence; may_reference → Protocol, Dataset, Agent |
| **Allowed States** | `complete`, `partial`, `missing` *(missing ⇒ Evidence cannot exceed lowest grades per SCI-003)* |
| **Forbidden States** | `implied` |
| **Ownership** | **SCI-002** (content); engineering envelope detail may later reference without renaming |
| **Versioning Rules** | Append-only preferred; corrections via superseding Provenance record |
| **Examples** | Snapshot ID + retrieval time + transform script ID |
| **Counterexamples** | “downloaded sometime last year” |
| **Future Notes** | Align with future ProvenanceEnvelope engineering spec without merging concepts |

---

### 3.8 Hypothesis

| Field | Content |
|-------|---------|
| **Canonical Name** | Hypothesis |
| **Definition** | A Claim intentionally held at Standing `draft_unverified` (or equivalent pre-support posture) and marked as proposed for investigation. |
| **Purpose** | Distinguish exploratory proposals from supported Claims without a second assertional metaphysics. |
| **Scope** | Investigative proposals. |
| **Out of Scope** | A separate parallel truth system |
| **Parent Concept** | Claim *(role/marker, not a rival type)* |
| **Child Concepts** | *(none)* |
| **Relationships** | same as Claim; flag `is_hypothesis=true` |
| **Allowed States** | Only Standing values allowed for Claim; hypothesis flag clear when promoted |
| **Forbidden States** | Treating Hypothesis as higher than Claim |
| **Ownership** | **SCI-001** (flag semantics); **SCI-000** (term) |
| **Versioning Rules** | As Claim |
| **Examples** | Draft Claim flagged hypothesis before Evidence linked |
| **Counterexamples** | Publishing “hypothesis” while Standing=`supported` without Evidence |
| **Future Notes** | Prefer flag over subclass explosion |

---

### 3.9 Observation

| Field | Content |
|-------|---------|
| **Canonical Name** | Observation |
| **Definition** | A recorded empirical report of a measurable or classifiable phenomenon under stated conditions, prior to theoretical interpretation as a Claim. |
| **Purpose** | Separate raw reportage from assertional Claims. |
| **Scope** | Empirical reports. |
| **Out of Scope** | Interpretive conclusions (those are Claims) |
| **Parent Concept** | Knowledge Object |
| **Child Concepts** | *(none)* |
| **Relationships** | may_ground → Evidence Item; may_motivate → Claim |
| **Allowed States** | `recorded`, `withdrawn` |
| **Forbidden States** | `claim_standing_*` |
| **Ownership** | **SCI-002** (as Evidence substrate) |
| **Versioning Rules** | Immutable record preferred |
| **Examples** | “Absorbance reading X under protocol P” |
| **Counterexamples** | “Therefore mechanism M causes disease D” |
| **Future Notes** | — |

---

### 3.10 Finding

| Field | Content |
|-------|---------|
| **Canonical Name** | Finding |
| **Definition** | An Observation or analysis result that has been summarized for reporting but is not yet elevated to a Claim Standing above draft, or that is explicitly bound as Evidence Item content. |
| **Purpose** | Bridge lab/report language without duplicating Claim. |
| **Scope** | Report-level summaries. |
| **Out of Scope** | Institutional Standing management (belongs to Claim) |
| **Parent Concept** | Knowledge Object |
| **Child Concepts** | *(none)* |
| **Relationships** | summarized_from → Observation; may_become → Claim; may_be_cast_as → Evidence Item |
| **Allowed States** | `reported`, `withdrawn` |
| **Forbidden States** | `supported` *(Standing is Claim-only)* |
| **Ownership** | **SCI-002** |
| **Versioning Rules** | Report revisions explicit |
| **Examples** | “Table 2 summary statistic” |
| **Counterexamples** | Using Finding as synonym for supported Claim |
| **Future Notes** | Keep thin; avoid competing with Claim |

---

### 3.11 Verification

| Field | Content |
|-------|---------|
| **Canonical Name** | Verification |
| **Definition** | An activity and resulting record that checks whether a Claim, Evidence object, or computational artifact conforms to stated methods, envelopes, or reproduction procedures. |
| **Purpose** | Operational audit of conformance and replay—not declaration of biological truth. |
| **Scope** | Checks against declared protocols and artifacts. |
| **Out of Scope** | Ultimate scientific truth; clinical validation |
| **Parent Concept** | Knowledge Object |
| **Child Concepts** | Reproduction *(as a verification mode)* |
| **Relationships** | verifies → Claim or Evidence or artifact ref; uses → Protocol; produces → Verification record |
| **Allowed States** | `planned`, `passed`, `failed`, `inconclusive` |
| **Forbidden States** | `truth_confirmed` |
| **Ownership** | **SCI-006** |
| **Versioning Rules** | Each attempt is a new record |
| **Examples** | Re-running a pinned computational envelope and comparing congruence |
| **Counterexamples** | “The community believes it” |
| **Future Notes** | —

---

### 3.12 Validation

| Field | Content |
|-------|---------|
| **Canonical Name** | Validation |
| **Definition** | An assessment that a method, model, or Claim-support relationship is fit for a declared scientific purpose under declared limitations—broader than Verification of a single artifact replay. |
| **Purpose** | Purpose-fitness assessment; distinct from Verification. |
| **Scope** | Methods and purpose-fitness. |
| **Out of Scope** | Single bitwise replay (that is Verification/Reproduction) |
| **Parent Concept** | Knowledge Object |
| **Child Concepts** | *(none in core)* |
| **Relationships** | validates_method → Protocol; may_cite → Benchmark, Metric, Evaluation |
| **Allowed States** | `proposed`, `accepted_for_purpose`, `rejected_for_purpose` |
| **Forbidden States** | `universally_valid` |
| **Ownership** | Validation Framework specs (MEP P4 / VAL-*); term **SCI-000** |
| **Versioning Rules** | Purpose string pinned |
| **Examples** | “Method M accepted for synthetic EB-0 scoring only” |
| **Counterexamples** | Equating Validation with clinical approval |
| **Future Notes** | Keep strictly non-clinical |

---

### 3.13 Reproduction

| Field | Content |
|-------|---------|
| **Canonical Name** | Reproduction |
| **Definition** | A Verification mode that re-executes the same computational or analytical procedure on the same or equivalent inputs under pinned conditions to assess congruence. |
| **Purpose** | Computational/analytical replay discipline. |
| **Scope** | Same method/equivalent environment. |
| **Out of Scope** | New study design (see Replication) |
| **Parent Concept** | Verification |
| **Child Concepts** | *(none)* |
| **Relationships** | instance_of → Verification |
| **Allowed States** | as Verification |
| **Forbidden States** | — |
| **Ownership** | **SCI-006** |
| **Versioning Rules** | as Verification |
| **Examples** | Container-pinned re-run |
| **Counterexamples** | New cohort study |
| **Future Notes** | —

---

### 3.14 Replication

| Field | Content |
|-------|---------|
| **Canonical Name** | Replication |
| **Definition** | An independent study or analysis intended to test whether a Claim holds under newly collected or independently processed data/conditions, not merely replaying the same artifact. |
| **Purpose** | Scientific robustness beyond bit-replay. |
| **Scope** | Independent tests of Claims. |
| **Out of Scope** | Pure computational replay |
| **Parent Concept** | Experiment *(when empirical)* or Protocol-governed study |
| **Child Concepts** | *(none)* |
| **Relationships** | tests → Claim; may_produce → Evidence |
| **Allowed States** | `planned`, `completed`, `abandoned` |
| **Forbidden States** | — |
| **Ownership** | Research process; Evidence/Claim linkage via **SCI-001/002**; term **SCI-000** |
| **Versioning Rules** | Study IDs stable |
| **Examples** | Independent lab repeats assay under shared Protocol |
| **Counterexamples** | Re-opening the same notebook |
| **Future Notes** | —

---

### 3.15 Contradiction

| Field | Content |
|-------|---------|
| **Canonical Name** | Contradiction |
| **Definition** | A first-class object recording that two or more Claims have incompatible propositional content under overlapping Scope. |
| **Purpose** | Make conflict visible and resolvable without deleting history. |
| **Scope** | Claim–Claim incompatibility. |
| **Out of Scope** | Mere preference disputes; editorial disagreements without propositional clash |
| **Parent Concept** | Knowledge Object |
| **Child Concepts** | *(none)* |
| **Relationships** | involves → Claim (≥2); may_trigger Standing `contested` |
| **Allowed States** | `open`, `resolved_by_supersession`, `resolved_by_scope_split`, `resolved_by_retraction`, `unresolved_archived` |
| **Forbidden States** | `ignored` |
| **Ownership** | **SCI-004** |
| **Versioning Rules** | Resolution recorded; object retained |
| **Examples** | Claim A and Claim B assert opposite directions under same Scope |
| **Counterexamples** | Two Claims about different Scopes |
| **Future Notes** | —

**Non-canonical near-term:** Conflict — use Contradiction for propositional clash; reserve Conflict for process disputes (§8).

---

### 3.16 Consensus

| Field | Content |
|-------|---------|
| **Canonical Name** | Consensus |
| **Definition** | A recorded community or committee judgment that a Claim’s Standing and Evidence set are provisionally accepted for a stated Scope—never absolute truth. |
| **Purpose** | Capture institutional agreement without erasing uncertainty. |
| **Scope** | Governance-backed acceptance records. |
| **Out of Scope** | Silent majority vibes; AI majority vote as Consensus |
| **Parent Concept** | Decision |
| **Child Concepts** | *(none)* |
| **Relationships** | about → Claim; recorded_by → Review |
| **Allowed States** | `active`, `withdrawn` |
| **Forbidden States** | `final_truth` |
| **Ownership** | Governance process; term **SCI-000** |
| **Versioning Rules** | New Consensus record on change |
| **Examples** | Standards committee accepts Claim for EB-0 purpose |
| **Counterexamples** | “Everyone on social media agrees” |
| **Future Notes** | —

---

### 3.17 Uncertainty

| Field | Content |
|-------|---------|
| **Canonical Name** | Uncertainty |
| **Definition** | An explicit representation of incomplete knowledge affecting interpretation of a Claim or Evidence, typed (e.g., statistical, measurement, model, sampling, ontological, unknown). |
| **Purpose** | Replace vibes with typed limitation. |
| **Scope** | Declarative uncertainty objects/annotations. |
| **Out of Scope** | Single scalar “confidence = truth” |
| **Parent Concept** | Knowledge Object |
| **Child Concepts** | *(types owned by MATH-STAT / SCI follow-ons)* |
| **Relationships** | qualifies → Claim or Evidence |
| **Allowed States** | `declared`, `unassessed` |
| **Forbidden States** | `none_because_ai_sure` |
| **Ownership** | MATH-STAT specs; term **SCI-000** |
| **Versioning Rules** | Scheme version pinned |
| **Examples** | “sampling uncertainty: convenience cohort” |
| **Counterexamples** | Omitting uncertainty because results are significant |
| **Future Notes** | —

---

### 3.18 Confidence

| Field | Content |
|-------|---------|
| **Canonical Name** | Confidence |
| **Definition** | A **non-authoritative** reported degree of belief or score clearly marked with its estimation method; MUST NOT alone set Claim Standing or Evidence Grade. |
| **Purpose** | Allow reporting of scores without epistemic laundering. |
| **Scope** | Method-tagged scores only. |
| **Out of Scope** | Standing management |
| **Parent Concept** | Metric *(when quantitative)* or annotation |
| **Child Concepts** | *(none)* |
| **Relationships** | estimated_by → Protocol/Method; MUST NOT override → Evidence Grade |
| **Allowed States** | `reported` |
| **Forbidden States** | `authoritative_truth` |
| **Ownership** | Reporting/MATH-STAT; term **SCI-000** |
| **Versioning Rules** | Method ID required |
| **Examples** | Bootstrap interval reported beside Claim |
| **Counterexamples** | “Confidence high ⇒ Standing supported” |
| **Future Notes** | Prefer Uncertainty declarations over Confidence when possible |

---

### 3.19 Negative Result

| Field | Content |
|-------|---------|
| **Canonical Name** | Negative Result |
| **Definition** | A first-class report that a predicted effect, difference, detection, or Claim support was not obtained under a declared Protocol, search space, and power/sensitivity context. |
| **Purpose** | Preserve nulls and failed detections as archival citizens. |
| **Scope** | Well-scoped nulls and non-detections. |
| **Out of Scope** | Absence of evidence without Protocol (“we didn’t look”) |
| **Parent Concept** | Knowledge Object |
| **Child Concepts** | *(none)* |
| **Relationships** | qualifies_or_challenges → Claim; produced_by → Protocol/Experiment; may_be → Evidence |
| **Allowed States** | `registered`, `withdrawn` |
| **Forbidden States** | `unpublished_because_boring` as normative loss |
| **Ownership** | **SCI-005** |
| **Versioning Rules** | Immutable preferred |
| **Examples** | “No planted mimics recovered above threshold T on decoy set D under Protocol P” |
| **Counterexamples** | Silent omission of null analyses |
| **Future Notes** | —

---

### 3.20 Positive Result

| Field | Content |
|-------|---------|
| **Canonical Name** | Positive Result |
| **Definition** | A report that a declared detection, difference, or effect criterion was met under a Protocol; it is **not** automatically a supported Claim. |
| **Purpose** | Name the complement of Negative Result without implying Standing. |
| **Scope** | Criterion-met reports. |
| **Out of Scope** | Automatic promotion to Standing `supported` |
| **Parent Concept** | Finding *(typically)* |
| **Child Concepts** | *(none)* |
| **Relationships** | may_motivate → Claim; may_be → Evidence Item |
| **Allowed States** | `reported`, `withdrawn` |
| **Forbidden States** | `proven` |
| **Ownership** | **SCI-002** / reporting; term **SCI-000** |
| **Versioning Rules** | as Finding |
| **Examples** | “Threshold crossed on primary metric” |
| **Counterexamples** | Equating Positive Result with biological truth |
| **Future Notes** | Thin concept; avoid dual Standing systems |

---

### 3.21 Experiment

| Field | Content |
|-------|---------|
| **Canonical Name** | Experiment |
| **Definition** | A planned empirical intervention or controlled observation episode governed by a Protocol, producing Observations and possibly Evidence. |
| **Purpose** | Anchor empirical generation of Evidence. |
| **Scope** | Empirical episodes. |
| **Out of Scope** | Purely computational re-runs (Reproduction) unless explicitly dual-classed |
| **Parent Concept** | Knowledge Object |
| **Child Concepts** | *(none required)* |
| **Relationships** | governed_by → Protocol; produces → Observation/Evidence |
| **Allowed States** | `planned`, `active`, `completed`, `aborted` |
| **Forbidden States** | — |
| **Ownership** | Research process; term **SCI-000** |
| **Versioning Rules** | Experiment ID stable |
| **Examples** | Wet-lab assay run |
| **Counterexamples** | Untargeted browsing of papers |
| **Future Notes** | —

---

### 3.22 Protocol

| Field | Content |
|-------|---------|
| **Canonical Name** | Protocol |
| **Definition** | A versioned specification of methods, parameters, inclusion/exclusion rules, and analysis plans governing Experiments, computational analyses, or Verifications. |
| **Purpose** | Make methods pin-able and auditable. |
| **Scope** | Method specifications. |
| **Out of Scope** | Informal tips |
| **Parent Concept** | Knowledge Object |
| **Child Concepts** | *(none)* |
| **Relationships** | governs → Experiment/Verification/Evaluation |
| **Allowed States** | `draft`, `registered`, `deprecated` |
| **Forbidden States** | — |
| **Ownership** | Scientific + engineering method docs; term **SCI-000** |
| **Versioning Rules** | SemVer or registered version IDs; analyses MUST pin version |
| **Examples** | Registered analysis protocol with search space |
| **Counterexamples** | “Standard methods” with no pin |
| **Future Notes** | —

---

### 3.23 Dataset

| Field | Content |
|-------|---------|
| **Canonical Name** | Dataset |
| **Definition** | A defined, citable collection of data with identity, version/snapshot, and access/provenance metadata, usable as input to Protocols. |
| **Purpose** | Pin inputs without rebuilding databases of record. |
| **Scope** | Data collections. |
| **Out of Scope** | Owning external systems of record |
| **Parent Concept** | Knowledge Object |
| **Child Concepts** | *(none)* |
| **Relationships** | cited_by → Evidence Provenance; input_to → Protocol |
| **Allowed States** | `available`, `deprecated`, `retracted` |
| **Forbidden States** | — |
| **Ownership** | Data management bindings; term **SCI-000** |
| **Versioning Rules** | Snapshot IDs mandatory for Claims relying on them |
| **Examples** | Snapshot of a public proteome release |
| **Counterexamples** | Floating “latest download” |
| **Future Notes** | —

---

### 3.24 Knowledge Object

| Field | Content |
|-------|---------|
| **Canonical Name** | Knowledge Object |
| **Definition** | Abstract parent for SciROS epistemic and methodological objects that are identified, versioned, and citable inside the scientific memory fabric. |
| **Purpose** | Hierarchy root for Claim, Evidence, etc. |
| **Scope** | SciROS-managed epistemic objects. |
| **Out of Scope** | Arbitrary files without SciROS identity |
| **Parent Concept** | *(root)* |
| **Child Concepts** | Claim, Evidence, Contradiction, Negative Result, Verification, Protocol, Dataset, Uncertainty, … |
| **Relationships** | — |
| **Allowed States** | — |
| **Forbidden States** | — |
| **Ownership** | **SCI-000** |
| **Versioning Rules** | Children define concrete rules |
| **Examples** | — |
| **Counterexamples** | — |
| **Future Notes** | Abstract only |

---

### 3.25 Entity

| Field | Content |
|-------|---------|
| **Canonical Name** | Entity |
| **Definition** | A referent in the world or in a system of record that can be identified (gene, protein, paper, person-role, organization, chemical, …) without SciROS owning its master record. |
| **Purpose** | Binding target for Claims and Evidence. |
| **Scope** | Referents via Identifiers. |
| **Out of Scope** | Re-implementing UniProt/PubMed/etc. |
| **Parent Concept** | *(primitive)* |
| **Child Concepts** | *(domain packs may subtype)* |
| **Relationships** | identified_by → Identifier |
| **Allowed States** | `bound`, `unresolved` |
| **Forbidden States** | — |
| **Ownership** | **SCI-000** (term); bindings in object specs |
| **Versioning Rules** | Prefer stable external IDs |
| **Examples** | UniProt accession |
| **Counterexamples** | Inventing colliding local IDs for external accessions |
| **Future Notes** | —

**Rejected as core types:** Knowledge Graph Node, Knowledge Graph Edge — see §8 Reserved (engineering/graph layer may use Entity/Relationship without renaming ontology).

---

### 3.26 Relationship

| Field | Content |
|-------|---------|
| **Canonical Name** | Relationship |
| **Definition** | A typed association between Entities or Knowledge Objects with declared semantics and Scope. |
| **Purpose** | Express links without collapsing into Claim Standing. |
| **Scope** | Typed associations. |
| **Out of Scope** | Untyped “related” soup as Evidence Grade |
| **Parent Concept** | Knowledge Object *(when reified)* or primitive link |
| **Child Concepts** | *(domain-defined types)* |
| **Relationships** | links → Entity/Knowledge Object |
| **Allowed States** | `asserted`, `withdrawn` |
| **Forbidden States** | — |
| **Ownership** | Domain packs for biological predicates; **SCI-000** for term |
| **Versioning Rules** | Type catalog versioned |
| **Examples** | `evidence_bears_on_claim` |
| **Counterexamples** | Hidden joins in prose |
| **Future Notes** | —

---

### 3.27 Ontology / Taxonomy / Vocabulary

| Field | Content |
|-------|---------|
| **Canonical Name** | Ontology |
| **Definition** | This document’s kind: a controlled set of concepts, definitions, and relations for SciROS. |
| **Purpose** | Shared language. |
| **Scope** | SciROS core. |
| **Out of Scope** | All of biomedical OBO |
| **Parent Concept** | *(meta)* |
| **Child Concepts** | Vocabulary; Taxonomy |
| **Relationships** | defines → concepts in §3 |
| **Ownership** | **SCI-000** |
| **Taxonomy** | Hierarchical classification structure (may be used inside domain packs). |
| **Vocabulary** | Flat controlled term set (e.g., Standing enum). |
| **Examples** | This spec |
| **Counterexamples** | Ad-hoc glossary per paper without import |
| **Future Notes** | External ontologies bound as Entity sources, not forked |

---

### 3.28 Identifier

| Field | Content |
|-------|---------|
| **Canonical Name** | Identifier |
| **Definition** | A token in a named system that denotes an Entity or Knowledge Object. |
| **Purpose** | Stable reference. |
| **Scope** | ID tokens + system names. |
| **Out of Scope** | Display labels as IDs |
| **Parent Concept** | *(primitive)* |
| **Ownership** | **SCI-000** |
| **Allowed States** | `valid`, `deprecated`, `unresolved` |
| **Examples** | `uniprot:P12345` |
| **Counterexamples** | Filename-only identity |
| **Future Notes** | —

---

### 3.29 Reference / Citation / Publication

| Field | Content |
|-------|---------|
| **Canonical Name** | Reference |
| **Definition** | A pointer to an external or internal citable object used to locate Evidence Source or literature. |
| **Citation** | A Reference used for scholarly attribution. |
| **Publication** | A scholarly Communication Entity (paper, preprint, dataset paper) that may be cited; not itself a Claim. |
| **Purpose** | Attribution and locatability. |
| **Out of Scope** | Treating a Publication as automatically supported Claims |
| **Ownership** | **SCI-000** (terms); bibliographic practice external |
| **Examples** | DOI; accession |
| **Counterexamples** | “as everyone knows” |
| **Future Notes** | —

---

### 3.30 Benchmark / Metric / Evaluation

| Field | Content |
|-------|---------|
| **Canonical Name** | Benchmark |
| **Definition** | A versioned suite of tasks and expected scoring rules for evaluating methods or epistemic behaviors. |
| **Metric** | A defined quantitative or categorical measure used in Evaluation. |
| **Evaluation** | An application of Metrics to artifacts or methods against a Benchmark or Protocol. |
| **Purpose** | Disciplined comparison. |
| **Out of Scope** | Marketing leaderboards without leakage controls |
| **Ownership** | BENCH-* / EB-0 specs; terms **SCI-000** |
| **Allowed States** | Benchmark: `active`, `retired` |
| **Examples** | EB-0 task family |
| **Counterexamples** | Changing keys after public release without version bump |
| **Future Notes** | —

---

### 3.31 Agent / Human Reviewer / Review / Decision

| Field | Content |
|-------|---------|
| **Canonical Name** | Agent |
| **Definition** | An acting system or person-role that performs actions recorded in provenance (human seat or software agent). |
| **Human Reviewer** | An Agent with authority to set Standing, Grade, or Approval under governance. |
| **Review** | A recorded assessment process instance against a checklist. |
| **Decision** | A recorded outcome of governance or review with authority scope. |
| **Purpose** | Accountability. |
| **Constraints** | AI Agents MUST NOT unilaterally raise Evidence Grade or Claim Standing. |
| **Ownership** | Governance + AI audit; terms **SCI-000** |
| **Forbidden States** | AI as `Human Reviewer` |
| **Examples** | Science Lead Approval on SCI-001 |
| **Counterexamples** | Model auto-promoting Standing |
| **Future Notes** | —

---

### 3.32 Version / Revision / Supersession / Retraction

| Field | Content |
|-------|---------|
| **Canonical Name** | Version |
| **Definition** | An explicit edition identifier of a Knowledge Object or Ontology document. |
| **Revision** | A recorded change event producing a Version. |
| **Supersession** | Relationship where a successor Claim or object replaces a predecessor for ongoing use while retaining history. |
| **Retraction** | Act and state marking an object withdrawn from supported use due to error, ethics, or invalidity. |
| **Ownership** | **SCI-000** + object specs |
| **Examples** | Claim Standing `retracted`; ontology `0.1.0` |
| **Counterexamples** | Silent overwrite of proposition text |
| **Future Notes** | —

---

### 3.33 Bias / Limitation / Scope / Constraint / Assumption

| Field | Content |
|-------|---------|
| **Canonical Name** | Bias |
| **Definition** | A systematic distortion risk affecting Evidence or interpretation, declared when known. |
| **Limitation** | A declared bound on what an object can support. |
| **Scope** | The applicability envelope of a Claim or Protocol (included/excluded conditions). |
| **Constraint** | A hard rule an object or process must obey (ethical, methodological, technical). |
| **Assumption** | A condition taken as given for interpretation; must be explicit when material. |
| **Ownership** | Object specs + MATH-STAT; terms **SCI-000** |
| **Forbidden States** | Hidden material Assumptions |
| **Examples** | Scope excludes clinical application |
| **Counterexamples** | Implied universal generality |
| **Future Notes** | —

---

### 3.34 Unknown / Open Question / Research Question / Scientific Question

| Field | Content |
|-------|---------|
| **Canonical Name** | Unknown |
| **Definition** | Explicit marker that a required informational element is not available. |
| **Open Question** | A stated unresolved Scientific Question tracked without pretending resolution. |
| **Research Question** / **Scientific Question** | Synonyms in v0.1 — **Canonical: Scientific Question** = a clearly posed interrogative guiding Protocols and Claims; Research Question is Non-canonical synonym. |
| **Ownership** | **SCI-000** |
| **Examples** | “Effect under condition C: Unknown” |
| **Counterexamples** | Filling Unknown with model hallucination |
| **Future Notes** | —

---

### 3.35 Clinical Boundary / Ethical Boundary / Risk

| Field | Content |
|-------|---------|
| **Canonical Name** | Clinical Boundary |
| **Definition** | Hard Constraint: SciROS core objects and outputs MUST NOT constitute diagnosis, prognosis, treatment recommendation, or clinical decision support. |
| **Ethical Boundary** | Hard Constraint set from frozen Ethics (non-maleficence in communication, dual-use refusal, privacy, honesty about uncertainty). |
| **Risk** | A potential harm or failure mode (scientific, ethical, operational) requiring monitoring. |
| **Ownership** | Ethics governance; terms **SCI-000** |
| **Forbidden States** | “Research mode off” clinical outputs |
| **Examples** | ethics_flags including non_clinical on Claims |
| **Counterexamples** | Patient-facing risk scores |
| **Future Notes** | —

---

## 4. Concept Hierarchy (compact)

```text
Knowledge Object
├── Claim  (Hypothesis = Claim + flag)
├── Evidence
│   ├── Evidence Item
│   └── Evidence Collection
├── Evidence Provenance
├── Contradiction
├── Negative Result
├── Verification
│   └── Reproduction
├── Validation
├── Uncertainty
├── Protocol
├── Dataset
├── Observation
├── Finding
└── (reified) Relationship

Primitive / meta: Entity, Identifier, Ontology, Vocabulary, Taxonomy
Process: Experiment, Replication, Review, Decision, Evaluation
Control: Scope, Constraint, Assumption, Limitation, Bias, Clinical Boundary, Ethical Boundary
Reporting: Positive Result, Confidence, Metric, Benchmark, Reference, Citation, Publication
Accountability: Agent, Human Reviewer, Risk, Unknown, Scientific Question, Version, Revision, Supersession, Retraction
```

---

## 5. Ownership Matrix

| Concept | Vocabulary owner | Detail specification owner |
|---------|------------------|----------------------------|
| Ontology (this doc) | SCI-000 | SCI-000 |
| Claim / Hypothesis flag | SCI-000 | SCI-001 |
| Evidence, Item, Collection, Source, Provenance | SCI-000 | SCI-002 |
| Evidence Grade | SCI-000 | SCI-003 |
| Contradiction | SCI-000 | SCI-004 |
| Negative Result | SCI-000 | SCI-005 |
| Verification / Reproduction | SCI-000 | SCI-006 |
| Validation | SCI-000 | VAL / P4 framework |
| Uncertainty / Confidence rules | SCI-000 | MATH-STAT |
| Benchmark / Metric / Evaluation | SCI-000 | BENCH / EB-0 |
| Protocol / Dataset / Experiment / Replication | SCI-000 | method & data bindings |
| Clinical/Ethical Boundary / Risk | SCI-000 | Ethics governance |
| Agent / Review / Decision | SCI-000 | Governance / pipeline |

---

## 6. Dependency Matrix

| If you need… | You must have… |
|--------------|----------------|
| Supported Claim | Evidence + Grade scheme (SCI-002/003) |
| Contested Claim | Contradiction (SCI-004) or equivalent process |
| Verification record | Protocol pin + target object IDs (SCI-006) |
| Negative Result | Protocol + search/space context (SCI-005) |
| Any object | This Ontology version pin |
| Domain predicate | Domain pack AND core Relationship rules |

**SCI-001 MUST import SCI-000.** Where SCI-001 draft preceded SCI-000, alignment revision is required before SCI-001 Approval (tracked as open question OQ-1).

---

## 7. Forbidden Definitions

The following MUST NOT be defined as SciROS core epistemic types:

- Diagnosis, TreatmentRecommendation, PatientRiskScore, ClinicalDecision  
- Proof, AbsoluteTruth, AICertifiedFact  
- Insight, Vibe, NarrativeAsEvidence  
- KnowledgeGraphNode / KnowledgeGraphEdge as *replacements* for Entity/Relationship  
- Separate Standing systems for Finding vs Claim  

---

## 8. Reserved Terms

| Term | Status | Rule |
|------|--------|------|
| Assertion, Statement | Non-canonical | Map to Claim |
| Conflict | Reserved | Process dispute ≠ Contradiction unless propositional |
| Research Question | Non-canonical | Use Scientific Question |
| Knowledge Graph Node/Edge | Reserved engineering | Do not fork Entity/Relationship |
| Confidence | Restricted | Cannot set Standing/Grade alone |
| Consensus | Restricted | Requires Decision/Review record |

---

## 9. Future Extension Rules

1. New core concepts require ADR + SCI-000 minor/major bump.  
2. Domain concepts go to domain packs; they MUST NOT overload core names.  
3. Extensions MUST state Parent Concept and Ownership.  
4. If an extension creates synonym overlap with core, it is rejected.  
5. Prefer flags and profiles over new sibling assertional types.

---

## 10. Versioning Policy

- This document uses SemVer: **MAJOR** incompatible meaning changes; **MINOR** additive concepts/fields; **PATCH** clarifications without meaning change.  
- Downstream specs MUST declare `ontology_ref: SCI-000@x.y.z`.  
- Silent reinterpretation of Standing or Grade via ontology patch is forbidden (requires MINOR/MAJOR).

---

## 11. Change Management Rules

1. Propose change → Scientific Review + Architecture Review (vocabulary impact).  
2. Update Ownership/Dependency matrices.  
3. List downstream specs requiring alignment.  
4. Deprecate with migration notes; do not delete history.  
5. Ethics Review if Clinical/Ethical Boundary language changes.

---

## 12. Glossary (quick)

See Canonical Names in §3. Non-canonical terms redirect there.

---

## 13. Open Questions

| ID | Question | Impact |
|----|----------|--------|
| OQ-1 | Align SCI-001 draft terminology to SCI-000 before SCI-001 Approval | Blocks SCI-001 DONE |
| OQ-2 | Exact Evidence Grade ladder labels | SCI-003 |
| OQ-3 | Whether Finding remains long-term or collapses into Evidence Item | Review at v0.2 |
| OQ-4 | Binding model to external ontologies (OBO) | Future ADR |

---

## 14. ADR Impact

| Impact | Action |
|--------|--------|
| No architecture redesign implied | None |
| New normative dependency | Future ADRs/specs MUST cite SCI-000 |
| Possible ADR | “Ontology preexistence vs object-spec order” documenting SCI-000 before SCI-001 Approval | Optional when closing OQ-1 |

---

## 15. Acceptance Criteria

1. Canonical set is minimal and non-overlapping for assertional path Claim–Evidence–Contradiction–Negative Result–Verification.  
2. Synonyms collapsed with explicit Non-canonical rules.  
3. Ownership matrix complete for core path.  
4. Clinical/Ethical Boundaries present as Constraints.  
5. No APIs/JSON/schemas/code.  
6. Versioning and change rules present.  
7. Hierarchy and dependency matrices present.

---

## 16. Validation Checklist

- [x] No circular definitions in core assertional path  
- [x] Claim ≠ Evidence ≠ Verification  
- [x] Validation ≠ Verification defined  
- [x] Reproduction ≠ Replication defined  
- [x] Confidence cannot set Standing  
- [x] Forbidden clinical types listed  
- [x] Ownership for SCI-001…006 assigned  
- [ ] Independent ontology read-through by Science Lead seat  
- [ ] Architecture Review: no hidden system redesign  

---

## 17. Definition of Done

SCI-000 is DONE iff Acceptance Criteria pass AND review pipeline (Scientific, Engineering-vocabulary, Architecture, Documentation, Validation) is APPROVED.

**Current status of this artifact:** READY FOR REVIEW (not DONE).

---

*End of SciROS Core Scientific Ontology v0.1*

# ADR-0006 — Workflow State vs Scientific Standing

| Field | Value |
|-------|--------|
| **ADR ID** | ADR-0006 |
| **Title** | Separation of Workflow State from Scientific Standing |
| **Status** | **ACCEPTED** |
| **Date** | 2026-07-16 |
| **Deciders** | SciROS Architecture Review Board (ARB) |
| **Related** | SCI-000 v0.1.0 (PROVISIONAL APPROVED); SCI-001 v0.1.0 (READY FOR REVIEW); CF-SCI001-0001 |

---

## 1. Context

SciROS defines scientific memory through epistemic objects. SCI-000 (PROVISIONAL APPROVED) defines **Standing** for Claim as an epistemic posture with the closed enum:

`draft_unverified` | `supported` | `contested` | `superseded` | `retracted`

SCI-001 correctly imports that enum and **stopped** when a task brief proposed a Claim lifecycle including **Candidate**, which is absent from SCI-000 Standing.

That stop behavior is constitutionally correct and **SHALL** be preserved as process discipline.

This ADR resolves the *conceptual* conflict without editing SCI-000 or SCI-001 in this action.

---

## 2. Problem Statement

The program risked conflating **how work moves through execution/review** with **what epistemic posture a Claim holds**.

If Candidate were added to Standing:

- Epistemic vocabulary would absorb process fashion.
- Standing would no longer mean “institutional scientific posture.”
- Future specs would keep colliding (Review, Candidate, Validated, Published, …).

If Standing were removed from Claim:

- SciROS would lose its assertional constitution.

**Root cause classification (ARB finding):**

| Hypothesis | Verdict |
|------------|---------|
| 1. Specification defect (SCI-001) | **Partial only** — SCI-001 correctly refused enum extension |
| 2. Ontology defect (SCI-000) | **No** — Standing enum is intentionally epistemic and closed |
| 3. Lifecycle modeling defect | **Yes** — “Lifecycle” was used as a single axis for two dimensions |
| 4. Terminology defect | **Yes (secondary)** — overloaded word “lifecycle” |
| 5. Misunderstanding: workflow vs epistemic state | **Yes (primary)** |

**Primary root cause:** misunderstanding / modeling collapse between **Workflow State** and **Scientific Standing**, expressed as a lifecycle modeling defect.

---

## 3. Architectural Analysis

### 3.1 First principles — are these the same dimension?

| Concept | Same as Standing? | Nature |
|---------|-------------------|--------|
| Workflow State | **No** | Process position of an *artifact or task* in Program Execution |
| Lifecycle State | **Ambiguous term** | MUST NOT be used as a single axis; prefer explicit Workflow vs Standing |
| Scientific Standing | **Reference epistemic axis** | Institutional posture of a *Claim* |
| Evidence Grade | **No** | Warrant class of *Evidence* (SCI-003) |
| Verification State | **No** | Outcome of a *Verification* attempt (SCI-006) |
| Review State | **No** | Pipeline review progress of a *work item/spec* |
| Publication State | **No** | Scholarly communication status of a *Publication* Entity |

**Conclusion:** These are **orthogonal or near-orthogonal dimensions**. Collapsing them into Standing corrupts the ontology.

### 3.2 Conceptual matrix

| Concept | Purpose | Owner | Scope | State transitions | Dependencies | In SCI-000? | In SCI-001? | Elsewhere? |
|---------|---------|-------|-------|-------------------|--------------|-------------|-------------|------------|
| **Workflow State** | Track execution/review progress of work items & drafts | Program Execution / Pipeline | Tasks, specs, releases, draft Claims *as work* | BACKLOG→…→DONE; Review gates | MEP, Pipeline | **No** (not epistemic) | **No** | **Yes — Program Execution Constitution / Pipeline** |
| **Lifecycle State** | *(Deprecated as sole axis)* | — | — | — | — | **No** as Standing synonym | **No** as enum | Informative narrative only, mapped to axes |
| **Scientific Standing** | Epistemic posture of a Claim | SCI-000 vocabulary; SCI-001 invariants | Claim only | Closed SCI-000 transitions | Evidence/Contradiction rules | **Yes** | **Uses, does not redefine** | — |
| **Evidence Grade** | Warrant strength class | SCI-003 | Evidence | Scheme-defined | Evidence object | Term yes; ladder no | **No** | SCI-003 |
| **Verification Status** | Result of verification attempt | SCI-006 | Verification records | planned/passed/failed/inconclusive | Protocol, target Claim/Evidence | Term yes | **No** (link only) | SCI-006 |
| **Review State** | Spec/task review pipeline | Program Execution | Reviews | PENDING→PASS/FAIL | Pipeline | **No** | **No** | Pipeline / Review Dashboard |
| **Publication Status** | Scholarly venue status | External + bindings | Publication Entity | preprint/published/retracted (external) | Citation/Reference | Term Publication yes | Link only | External systems |

### 3.3 Answers to core questions

**Q1. Is Candidate a Scientific Standing or Workflow/Lifecycle State?**  
**Candidate is a Workflow/Review gate state**, not Scientific Standing. It denotes “under consideration for promotion,” which is process, not epistemic posture. Epistemically, such a Claim remains `draft_unverified` until Standing changes under SCI-001/SCI-000 rules.

**Q2. Can Workflow State = Review while Standing = Supported?**  
**Yes.** Example: a Claim already `supported` undergoes re-verification review after new Contradiction filing; Standing may move to `contested` later, but Workflow can be IN REVIEW while Standing is still `supported` until the Standing transition is enacted.

**Q3. Can Standing change while Workflow does not?**  
**Yes.** Automated or committee Standing updates may occur while the governing task remains IN PROGRESS; or Standing events are recorded without a new Pipeline task. (Governance SHOULD still audit Standing changes.)

**Q4. Can Workflow change while Standing remains constant?**  
**Yes.** Typical: draft Claim remains `draft_unverified` while Workflow moves READY → IN PROGRESS → REVIEW → APPROVED for the *specification* or for a *dossier packaging* task.

**Q5. Should Workflow belong to Program Execution rather than Scientific Ontology?**  
**Yes.** Workflow State is an execution concern. SCI-000 SHALL remain epistemic. Polluting SCI-000 with Candidate/Review/Published Standing values is a constitutional regression.

---

## 4. Alternative Options Considered

### OPTION A — Candidate becomes part of Standing

**Rejected.** Conflates process with epistemology; forces endless Standing growth (InReview, Embargoed, …); breaks SCI-000 closed enum rationale.

### OPTION B — Candidate belongs only to Workflow

**Partially correct, incomplete alone.** True for Candidate, but insufficient without explicitly separating “lifecycle” language from Standing across all future specs.

### OPTION C — Standing removed from SCI-001

**Rejected.** Destroys Claim constitution; contradicts SCI-000 ownership model.

### OPTION D — Lifecycle is separated from Standing

**Accepted.** Treat “lifecycle” as at most an *informative narrative* over **two axes**: Workflow State × Scientific Standing. Candidate ∈ Workflow axis only.

### OPTION E — Different solution

**Not selected as primary.** Dual-axis model is already OPTION D. No third axis required for CF-SCI001-0001.

---

## 5. Decision

# OPTION D — Lifecycle is separated from Standing

**Normative decision:**

1. **Scientific Standing** remains exclusively the SCI-000 Claim Standing enum; SCI-001 SHALL NOT extend it.  
2. **Workflow State** (including any use of “Candidate,” “In Review,” “Approved for release,” etc.) belongs to **Program Execution / Pipeline**, not to SCI-000 Standing.  
3. The word **Lifecycle**, when used in scientific specs, **SHALL** be either:  
   - avoided, or  
   - explicitly defined as an informative mapping onto Standing transitions and/or Workflow States—not as a third competing enum.  
4. A Claim **MAY** simultaneously carry:  
   - Standing (epistemic), and  
   - Workflow State (process), on different objects or facets without identity collision.  
5. **Candidate** **SHALL NOT** be added to Standing. If used at all, it **SHALL** mean Workflow/Review posture over a Claim still at Standing `draft_unverified` (unless a future SCI-000 MAJOR revises Standing—out of scope here).  
6. SCI-001’s refusal to add Candidate (**CF-SCI001-0001 STOP**) is **AFFIRMED** as correct behavior.

---

## 6. Consequences

### Positive

- Permanently separates process from epistemology.  
- Unblocks SCI-001 review without ontology corruption.  
- Prevents analogous conflicts (e.g., “Published” as Standing).  
- Keeps Evidence Grade, Verification Status, Review State distinct.

### Negative / costs

- Authors must maintain two vocabularies carefully.  
- Informative “lifecycle” diagrams must be redrawn as dual-axis.  
- Training burden for contributors.

### Neutral

- SCI-000 Provisional Approval stands.  
- No immediate edit applied by this ADR (change requests only).

---

## 7. Required Normative Changes

**DO NOT APPLY IN THIS ACTION.** Change requests only.

### 7.1 SCI-000 — PATCH 0.1.1 (request)

| Item | Content |
|------|---------|
| **Required change** | Add a short normative note (or subsection): “Standing is epistemic only. Workflow/Review states are out of scope for SCI-000 and MUST NOT be added to Standing. Terms such as Candidate, In Review, Approved (pipeline) are Workflow States owned by Program Execution.” |
| **Reason** | Encode ADR-0006 in the ontology constitution to prevent recurrence |
| **Backward compatibility** | Additive clarification; no enum change ⇒ PATCH |
| **Migration impact** | None for existing Standing values |

### 7.2 SCI-001 — alignment (request)

| Item | Content |
|------|---------|
| **Required alignment** | In §9 Lifecycle: (a) keep Standing machine as sole normative Claim state machine; (b) replace informative “phase labels” table with an explicit **dual-axis** note citing ADR-0006; (c) state that Candidate, if mentioned, is Workflow-only and non-Standing; (d) mark CF-SCI001-0001 **RESOLVED BY ADR-0006** (not by enum extension). |
| **Reason** | Remove residual ambiguity from brief-driven wording |
| **Migration impact** | Editorial/normative clarification; no Standing migration |

### 7.3 Program Execution / Pipeline (request)

| Item | Content |
|------|---------|
| **Required change** | Document Workflow State vocabulary for Claim-*work-items* (e.g., Candidate = awaiting Standing-promotion review) in execution docs—not in SCI-000. |
| **Reason** | Give Candidate a legal home |
| **Migration impact** | Execution docs only |

---

## 8. Backward Compatibility

- SCI-000 Standing enum **unchanged**.  
- Existing SCI-001 refusal of Candidate **remains valid**.  
- No Claim data migration.  
- PATCH 0.1.1 is clarifying, not breaking.

---

## 9. Migration Strategy

1. Accept ADR-0006 (this document).  
2. Apply SCI-000 PATCH 0.1.1 change request via controlled ontology edit task (future).  
3. Apply SCI-001 alignment edit via controlled spec task (future).  
4. Add Workflow vocabulary note to Program Execution docs (future).  
5. Close CF-SCI001-0001 as **resolved by ADR**, not by Standing extension.  
6. No runtime migration.

---

## 10. Impact Assessment

| Area | Impact |
|------|--------|
| SCI-000 | Low (PATCH note) |
| SCI-001 | Low (alignment text) |
| SCI-002…006 | Positive clarity (do not dump process states into epistemic enums) |
| Pipeline | Must own Workflow vocabulary |
| Agents | MUST NOT treat Candidate as Standing |
| EB-0 / Validation | Unaffected epistemically |

---

## 11. Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Contributors keep saying “lifecycle = Standing” | M | ADR citation required in future object specs |
| Workflow vocabulary invents “Supported” as process state | H | Naming rule: Workflow MUST NOT reuse Standing tokens |
| Pressure to add Published/Validated to Standing | M | This ADR as veto precedent |
| Dual-axis ignored in UI later | M | Conformance tests when encodings exist |

---

## 12. Constitutional Compliance

| Principle | Compliance |
|-----------|------------|
| Claim-centric epistemic memory | Preserved |
| SCI-000 vocabulary authority | Preserved |
| No clinical Standing | Preserved |
| AI non-authority over Standing | Preserved |
| Correct STOP on CF-SCI001-0001 | Affirmed |
| No silent ontology edit in this action | Honored |

---

## 13. Follow-up Tasks

| ID | Task | Priority |
|----|------|----------|
| FU-ADR0006-001 | SCI-000 PATCH 0.1.1 clarifying note | P0 |
| FU-ADR0006-002 | SCI-001 dual-axis alignment edit | P0 |
| FU-ADR0006-003 | Pipeline Workflow vocabulary note (Candidate definition) | P1 |
| FU-ADR0006-004 | Close CF-SCI001-0001 as resolved-by-ADR | P0 |
| FU-ADR0006-005 | Add ADR-0006 to Decision Dashboard | P1 |

---

## 14. Acceptance Criteria

1. ADR chooses exactly one option — **D**.  
2. Root cause identified as workflow/epistemic conflation.  
3. Candidate denied as Standing.  
4. Dual-axis model stated.  
5. Change requests defined without applying edits.  
6. SCI-001 STOP behavior affirmed.  
7. Matrix covers Workflow, Standing, Grade, Verification, Review, Publication.

---

## 15. Decision Status

| Field | Value |
|-------|--------|
| **Status** | **ACCEPTED** |
| **Effective** | Immediately for governance interpretation |
| **Spec edits** | Not applied in this action |
| **Supersedes** | Informal assumption that Claim “lifecycle” ⊆ Standing |

---

*End of ADR-0006*

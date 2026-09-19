# Standards Office — Constitutional Compliance Reviews

**Office:** SciROS Standards Editor  
**Constitution:** SCI-000@0.1.0 · ADR-0006 · MEP · Execution Constitution · Architecture · Governance  
**Date:** 2026-07-16  

---

# Review: SCI-001 Scientific Claim Object Specification v0.1.0

## Constitutional Compliance

**PASS** (conditional on required patches before final Approval)

SCI-001 does not redefine SCI-000 Canonical Names, does not extend Standing, does not introduce Candidate as Standing, does not own Evidence/Grade/Confidence/Verification logic, and does not leak implementation. Residual ADR-0006 alignment text is incomplete (patch requests below)—not a dimension merge.

### Checklist answers

| # | Question | Finding |
|---|----------|---------|
| 1 | Redefines SCI-000 terminology? | **No.** Imports Claim/Standing/Hypothesis; §7 “refinement” is detail-owner elaboration, not vocabulary fork. |
| 2 | Introduces concepts owned elsewhere? | **No ownership theft.** References Evidence/Contradiction/Verification by link only; internals deferred. |
| 3 | Violates ADR-0006? | **Partial residual wording.** Does not put Candidate in Standing (compliant). Still titles §9 “Lifecycle,” uses “Standing lifecycle,” and leaves CF-SCI001-0001 as unresolved in-text despite ADR-0006. Requires PATCH (not new ADR). |
| 4 | Hidden workflow states? | **No.** Candidate explicitly rejected as Standing. |
| 5 | Hidden scientific states? | **No.** Standing enum closed to SCI-000. |
| 6 | Duplicate ownership? | **No.** Claim detail = SCI-001; Standing enum = SCI-000. |
| 7 | Circular dependencies? | **No.** Depends on SCI-000 only. |
| 8 | Violates orthogonality? | **Minor residual.** “Lifecycle” language risks confusion; Standing machine itself is epistemic-only. Patch to cite ADR-0006 dual-axis. |
| 9 | Implementation leakage? | **No.** Encoding-agnostic; forbids JSON/API/schema. |
| 10 | Violates constitutional principles? | **No.** Non-clinical; AI cannot raise Standing; Claim-centric. |

## Violations

| Severity | ID | Description |
|----------|-----|-------------|
| Non-blocking | V-001 | §2/§9 use “lifecycle” without ADR-0006 dual-axis citation |
| Non-blocking | V-002 | CF-SCI001-0001 still marked unresolved in §20/§25 though ADR-0006 resolved it |
| Non-blocking | V-003 | OQ-004 still contemplates Candidate-as-Standing; should close pointing to ADR-0006 |

**No STOP-level orthogonality merge. No ownership redefinition. No circular dependency.**

## Ownership Violations

**None.**

## Orthogonality Violations

**None that merge dimensions.**  
Informational risk only: overloaded “lifecycle” label (address by PATCH per ADR-0006 §7.2).

## ADR References

| ADR | Relevance |
|-----|-----------|
| **ADR-0006** | Binding: Standing ≠ Workflow; Candidate ∉ Standing; dual-axis required in SCI-001 alignment |
| SCI-000 | Vocabulary authority |

## Required Patch Requests

| Patch ID | Target | Change | Type |
|----------|--------|--------|------|
| PR-SCI001-001 | SCI-001 | Cite ADR-0006; replace “lifecycle” framing with Standing state machine + optional informative dual-axis note | PATCH 0.1.1 |
| PR-SCI001-002 | SCI-001 | Mark CF-SCI001-0001 **RESOLVED BY ADR-0006** | PATCH 0.1.1 |
| PR-SCI001-003 | SCI-001 | Close OQ-004 as rejected (Candidate not Standing) per ADR-0006 | PATCH 0.1.1 |

*Do not apply in this review action.*

## Backward Compatibility

Patches are clarifying. No Standing enum change. No Claim migration.

## Approval Recommendation

**Recommend Provisional Approval of SCI-001 content after PR-SCI001-001…003 are applied**, or **Conditional Pass now** with patches mandatory before non-provisional DONE.

Standards Editor does **not** rewrite SCI-001 in this action.

---

# Review: SCI-002 Evidence Object

## Constitutional Compliance

**N/A — artifact absent**

## Violations / Ownership / Orthogonality

N/A

## ADR References

ADR-0006; SCI-000 (when drafted)

## Required Patch Requests

None

## Backward Compatibility

N/A

## Approval Recommendation

**Do not approve.** Spec does not exist. No review possible.

---

# Review: SCI-003 Evidence Grade

## Constitutional Compliance

**N/A — artifact absent**

## Approval Recommendation

**Do not approve.** Spec does not exist.

---

# Review: SCI-004 Contradiction Object

## Constitutional Compliance

**N/A — artifact absent**

## Approval Recommendation

**Do not approve.** Spec does not exist.

---

# Review: SCI-005 Negative Result Object

## Constitutional Compliance

**N/A — artifact absent**

## Approval Recommendation

**Do not approve.** Spec does not exist.

---

# Review: SCI-006 Verification Object

## Constitutional Compliance

**N/A — artifact absent**

## Approval Recommendation

**Do not approve.** Spec does not exist.

---

# Engineering specifications

## Constitutional Compliance

**N/A — no engineering normative specs present under active SciROS specs tree**

## Approval Recommendation

**Do not approve.** Nothing to review.

---

**Standards Editor note:** Prefer fewer concepts/states. No new ADR requested (ADR-0006 already covers the only orthogonality tension found).

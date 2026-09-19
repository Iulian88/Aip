# SCI-000 Review Record — Provisional Approval

**Reviewer role:** Chief Review Officer  
**Artifact:** `specs/scientific/SCI-000_core_ontology.md` v0.1.0  
**Date:** 2026-07-16  
**Decision:** **PROVISIONAL APPROVED**

---

## 1. Review Summary

SCI-000 meets the Provisional Approval bar: mandatory sections present, core assertional vocabulary non-overlapping for Claim–Evidence–Contradiction–Negative Result–Verification, ownership and dependencies defined, versioning/change rules present, open questions explicit, no implementation leakage, Clinical/Ethical Boundaries respected.

Remaining issues are non-critical and tracked as backlog. SCI-000 becomes the constitutional vocabulary reference for SCI-001…006. SCI-000 will not be reopened except for a newly discovered constitutional defect.

---

## 2. Critical Issues

**None.**

No critical contradiction, circular dependency, undefined ownership on the core path, missing normative core definitions, conflicting terminology that blocks SCI-001, constitutional violation, or ambiguity that prevents starting Claim specification alignment.

---

## 3. Major Issues (backlog — non-blocking)

| ID | Issue |
|----|-------|
| MAJ-001 | Finding vs Observation boundary remains soft (OQ-3); may confuse Evidence Item casting |
| MAJ-002 | Hypothesis is canonical yet defined as Claim+flag — intentional but easy to misuse as a rival type |
| MAJ-003 | Validation detail ownership cited as “VAL / P4” rather than a single future Spec ID |
| MAJ-004 | Evidence Grade illustrative labels are non-normative until SCI-003 (acceptable; must not be treated as final ladder) |

---

## 4. Minor Issues (backlog)

| ID | Issue |
|----|-------|
| MIN-001 | Parent “Vocabulary term (controlled)” for Evidence Grade is meta-loose |
| MIN-002 | Some Future Notes entries are empty placeholders |
| MIN-003 | Combined Ontology/Taxonomy/Vocabulary section denser than other entries |
| MIN-004 | Positive Result kept thin; risk of under-use vs over-use as pseudo-Claim |

---

## 5. Editorial Issues (backlog)

| ID | Issue |
|----|-------|
| ED-001 | Occasional formatting inconsistency (em-dashes / blank Future Notes) |
| ED-002 | Glossary §12 is a pointer rather than a full flat list |

---

## 6. Approval Decision

# PROVISIONAL APPROVED

**Rationale:** Executable constitutional vocabulary for the Scientific Core exists with explicit limitations. Perfection is not required. Downstream SCI-001 may proceed to READY (alignment work), not auto-start.

---

## 7. Remaining Backlog

| Backlog ID | Source | Title | Priority |
|------------|--------|-------|----------|
| FU-SCI000-001 | OQ-1 / MAJ-002 | Align SCI-001 draft to SCI-000@0.1.0 | P0 (with SCI-001) |
| FU-SCI000-002 | MAJ-001 / OQ-3 | Decide Finding retention or collapse at ontology v0.2 | P2 |
| FU-SCI000-003 | MAJ-003 | Assign stable Spec ID for Validation ownership | P1 |
| FU-SCI000-004 | MAJ-004 | Normative Evidence Grade ladder in SCI-003 | P0 (SCI-003) |
| FU-SCI000-005 | MIN-* / ED-* | Editorial cleanup pack for SCI-000 PATCH | P3 |
| FU-SCI000-006 | Process | Named Science Lead ratification of Provisional Approval | P1 |

---

## Pipeline state after this decision

SCI-000: REVIEW → **PROVISIONAL APPROVED**  
SCI-001: BLOCKED → **READY** (do not start in this cycle)

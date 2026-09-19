# ARCHITECTURE-DECISION-020

| Field | Value |
|-------|--------|
| Decision ID | ARCHITECTURE-DECISION-020 |
| ADR | `specs/architecture/ADR-020_post_persist_revision_model.md` |
| Version | 0.1.0-DRAFT |
| Baseline | `dbbc8c67b8c80feada2c6b29389b2a284a619e87` |
| Inputs | SPEC-020; ARCHITECTURE-AUDIT-020; EXEC-020 BLOCKED; repository contracts |
| Mode | Architecture decision only — no implementation |

---

## Selected model

**SELECTED MODEL: Model C**

Stable scientific identity + immutable revision rows + explicit **Persistence-owned** head pointer.

Revision identity (`revision_id`) is **distinct** from SemVer / ENC `content_version`.  
Canonical `envelope.identity` remains the scientific id.  
Differing CanonicalUnit `replace` for scientific payloads remains rejected.

---

## Why Model C satisfies the hard requirements

| Requirement | How Model C satisfies it |
|-------------|--------------------------|
| R1 Core authority | Transitions still executed only by Core services; head is not scientific meaning |
| R2 Persistence infrastructure | Addressing + head are storage/index concerns |
| R3–R5 History | Prior revision rows stay immutable in the primary store (not archive-dependent overwrite) |
| R6 Determinism | Caller-supplied `revision_id`; head CAS inputs explicit |
| R7–R8 | Lineage is representation metadata; single journal |
| R9 | Explicit Persistence supersession only (addressing + head); Core/ENC identity equality preserved |
| R10–R11 | Revision ≠ SemVer; predecessor_revision_id chain |
| R12 | Head resolves current; Persistence snapshot must include heads once introduced |
| R13 | Linear history; stale head → CONFLICT; no fake distributed locks |
| R14 | Existing units = initial revision + head; payloads untouched |
| R15 | Additive REF-OPS under existing OPS profile preferred |
| R16 | Memory Persistence sufficient after contract extension |

---

## Rejected models

| Model | Rejected because |
|-------|------------------|
| **A** | `content_version` rows conflict with Core SemVer preservation on Standing/Record transitions; current key forbids multi-row; SemVer ≠ revision |
| **B** (standalone) | Breaks certified identity equality; cannot resolve scientific-id lookup/snapshots without a head (incomplete → becomes C at higher cost) |
| **D** | Weakens certified `IMMUTABLE_ENTITY`; replace ≠ coexisting revisions; “state at T” depends on archive strength |
| **E** | Not required |

---

## Storage implications

- Today’s key remains verified: `persist:CanonicalUnit:{unit_kind}:{identity}`.
- Model C **requires** an explicit Persistence addressing extension so rows are keyed by scientific identity **and** `revision_id` (exact formula = RQ-020-001, for normative SPEC/Persistence patch).
- Do **not** reinterpret today’s key as already versioned.

---

## Identity implications

| Layer | Decision |
|-------|----------|
| Scientific id | Stable across revisions |
| Canonical envelope identity | Remains scientific id |
| Revision id | New, caller-supplied, distinct from SemVer |
| OPS membership identity | Remains scientific id; current revision via head |

---

## Lineage implications

- Representation lineage: `predecessor_revision_id` among revisions.
- **Not** Core scientific edges (`bears_on`, `supported_by`, …).
- **Not** an OPS-only parallel graph.
- Scientific `superseded` / `superseded_by` remain Core Standing semantics, distinct from head movement.

---

## Head implications

- Exactly one head per `(unit_kind, scientific_identity)`.
- Owned by Persistence; advanced under CAS after Core+ENC+create revision.
- Not scientific truth; reconstructible from revision rows + lineage.
- Concurrent R1→R2 and R1→R3: **conflict**, no forks.

---

## Immutability implications

- Revision payloads: create-once immutability retained.
- Head index: mutable infrastructure (explicit exception).
- Model D overwrite path: rejected.

---

## Grade implications

- Post-persist Grade assignment ⇒ **new EvidenceUnit revision** (Core already returns new Evidence + bumps `evidence_version`).
- Optional GradeDesignationUnit revision under same scientific evidence id + `unit_kind` discriminator.
- No in-place mutation of a prior Evidence revision row.

---

## Migration implications

- Sprint 015–019 units → initial revision + head.
- No payload rewrite; certificates and events preserved.

---

## Remaining blockers (for EXEC coding, not for model selection)

| ID | Item |
|----|------|
| RQ-020-001 | Exact storage_key formula with revision_id |
| RQ-020-002 | Initial revision_id token for migrated units |
| RQ-020-003 | Where predecessor_revision_id is recorded |
| RQ-020-004 | Head API / entity surface |
| RQ-020-005 | First EXEC OPS transition slice scope |

These do **not** reopen A/B/C/D selection. They **do** block coding until SPEC-020 is patched normatively and Persistence contract details are specified.

**Model-selection blockers from EXEC-020 (B-020-001…005): CLOSED by this ADR.**

---

## Exact SPEC-020 sections that must be patched

To make the decision normative (design patch only; not done in this decision action):

| SPEC-020 section | Required change |
|------------------|-----------------|
| Header / §1 Status | Record ADR-020 selection; move toward normative draft for Model C |
| §9 Revision/version candidates | Declare Model C **selected**; retain A/B/D as rejected alternatives with ADR reasons |
| §8 Identity model | Normative: scientific id stable; revision_id distinct; envelope.identity remains scientific id |
| §7 Immutability model | Normative: immutable revision rows; head mutable; no Model D overwrite |
| §10 Transition semantics | Bind orchestration to create-revision + head CAS |
| §11–§12 Provenance / events | Cite revision/head operational events; keep scientific logs in Core/ENC |
| §13 Relationships | State lineage ≠ scientific graph |
| §14–§19 Unit dependencies | Align with revision+head; Contradiction vocabulary `unresolved_archived` (OBS-020-001) |
| §20 Snapshots | Head resolution; schemas unchanged |
| §21–§22 Determinism / concurrency | Linear head CAS; SemVer ≠ revision |
| §23 Persistence boundary | Authorize addressing + head extension; forbid silent IMMUTABLE_ENTITY weaken |
| §26–§27 Compatibility / migration | Sole-revision convention |
| §30 Open questions | Close OQ-020-001/002/003/005/007/008/010/013/014 as decided by ADR; leave RQ-020-001…005 as implementation-detail opens |
| §31 Future EXEC boundary | Require Model C only |
| §33 Comparison table | Annotate selected vs rejected (no score reintroduction) |
| §35 Final status | Reflect ADR-020 decision pending SPEC patch + re-audit process |

**This ARCHITECTURE-DECISION-020 action does not patch SPEC-020.** Patching is a separate authorized step.

---

## Execution consequence

| Stage | Status |
|-------|--------|
| Model selection | **Decided (Model C)** |
| SPEC-020 normative patch | **Required next** |
| EXEC implementation | **Still disallowed** until normative SPEC + Persistence contract details (RQ-020-001…004) |
| CODE-AUDIT / CERT | Not started |

---

## Final decision status

**ARCHITECTURE-DECISION-020 — COMPLETE**

Selected: **Model C**  
No implementation. No SPEC patch in this action. No commit. No push.

---

*End of ARCHITECTURE-DECISION-020.*

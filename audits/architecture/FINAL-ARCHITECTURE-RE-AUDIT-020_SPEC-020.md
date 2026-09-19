# FINAL-ARCHITECTURE-RE-AUDIT-020

| Field | Value |
|-------|--------|
| Audit ID | FINAL-ARCHITECTURE-RE-AUDIT-020 |
| Subject | SPEC-020 v0.3.0-DRAFT |
| Spec path | `specs/architecture/SPEC-020_post_persist_scientific_transition.md` |
| Mode | READ-ONLY final architecture re-audit before EXEC-020 |
| Prior | ARCHITECTURE-AUDIT-020; ARCHITECTURE-RE-AUDIT-020 APPROVED WITH OBSERVATIONS; IMPLEMENTATION-DECISION-020 IMPLEMENTATION-READY; PATCH-SPEC-020-B |
| Does not authorize | Certification; Git commit/push; CODE-AUDIT; automatic start of coding without separate EXEC command |

---

## 1. Scope

Determine whether SPEC-020 v0.3.0 is architecturally complete, internally consistent, Model C–normative, concrete enough for EXEC-020, and aligned with ADR-020, IMPLEMENTATION-DECISION-020, and repository contracts — with independent verification that RQ-020-001…005 are truly CLOSED.

---

## 2. Baseline

| Item | Value |
|------|--------|
| HEAD | `dbbc8c67b8c80feada2c6b29389b2a284a619e87` |
| origin/main | `dbbc8c67b8c80feada2c6b29389b2a284a619e87` |
| Branch | `main` |
| Certified sprints | 017 / 018 / 019 FORMALLY CERTIFIED AND CLOSED |
| SPEC | `0.3.0-DRAFT` — DRAFT — READY FOR RE-AUDIT |

---

## 3. Documents Inspected

| Document | Role |
|----------|------|
| SPEC-020 v0.3.0-DRAFT | Subject |
| ADR-020 | Model C selection |
| IMPLEMENTATION-DECISION-020 | RQ-001…005 concrete formulas |
| ARCHITECTURE-AUDIT-020 | Prior framing audit |
| ARCHITECTURE-RE-AUDIT-020 | Prior Model C re-audit |
| EXEC-020_REPORT | Prior BLOCKED (pre–implementation decision) |

Repository contracts sampled: `makeStorageKey`, `PersistenceEntity` / `IMMUTABLE_KINDS`, `replace`/`expected_version`, Claim/Evidence transition & OPS register paths, ResearchSnapshot frozen shape.

---

## 4. Model C Normativity

| Check | Result |
|-------|--------|
| Model C ONLY normative revision architecture | **Pass** — §1, §9.1, §35 |
| Model A rejected | **Pass** — §9.2, §33 |
| Model B rejected | **Pass** — §9.3, §33 |
| Model D rejected | **Pass** — §9.4, §33 |
| Residual “undecided / no winner” language | **None** |
| Competing architecture active | **No** |

---

## 5. Storage Key

**Normative formula verified:**

```
persist:CanonicalUnit:{unit_kind}:{scientific_identity}:{revision_id}
```

| Concept | SPEC clarity |
|---------|--------------|
| `scientific_identity` = `PersistenceEntity.identity` = envelope identity | Explicit §4.5, §5, §8 |
| `revision_id` = Persistence metadata | Explicit |
| Why three-segment key insufficient | Explicit D-020-001 §4.5 |
| Migration / dual-read | Explicit §27 — old key ≡ `rev:initial` |

**Independent RQ-020-001 verdict: CLOSED** — matches IMPLEMENTATION-DECISION-020; no invention required at EXEC beyond implementing the stated formula.

---

## 6. Revision Identity

| Rule | Verified |
|------|----------|
| Initial = `rev:initial` | Yes |
| Later = caller `rev:…` ≠ `rev:initial` | Yes |
| Grammar `^rev:[A-Za-z0-9._~-]{1,128}$` | Yes §5 |
| No randomUUID / Date.now / implicit counters | Yes §5, §21 |
| Deterministic / reproducible | Yes |

**Independent RQ-020-002 verdict: CLOSED**

---

## 7. Lineage

| Rule | Verified |
|------|----------|
| Authoritative field `PersistenceEntity.predecessor_revision_id` | Yes §5, §13, §30 |
| Absent on `rev:initial`; required later | Yes |
| Parent/child/traversal/serialization | Yes §13 |
| SER export does not inject lineage into scientific JSON | Yes |
| No second Core/OPS graph; no second journal | Yes §12–13, §29 |
| Cross-section consistency | Yes (entity metadata wins over event citations) |

**Independent RQ-020-003 verdict: CLOSED**

---

## 8. RevisionHead

| Rule | Verified |
|------|----------|
| Kind `RevisionHead` | Yes §22 |
| Key `persist:RevisionHead:{unit_kind}:{identity}` | Yes |
| CAS via `replace` + `expected_version` | Yes |
| `content_version` of head = pointed `revision_id` | Yes |
| Not scientific truth | Yes §5, §22–23 |
| Linear history; stale → CONFLICT | Yes |
| Not in IMMUTABLE_KINDS | Yes |
| Ownership Persistence; OPS orchestrates | Yes |

**Independent RQ-020-004 verdict: CLOSED**

---

## 9. Sprint 020 Scope

| In scope | Out of scope |
|----------|--------------|
| Model C Persistence infrastructure | Evidence post-persist Record State |
| Claim Standing post-persist | Grade / Contradiction / NR / Verification OPS |
| Evidence initial-revision registration only | DB / API / frontend / AI / KG / literature / distributed |

Cross-check §1, §16, §24, §29, §31, §33, §35: **consistent**. No scope contradiction found.

**Independent RQ-020-005 verdict: CLOSED**

---

## 10. Claim Standing

Flow §15 matches Model C:

```
existing immutable Claim revision
  → Core ClaimTransitionService
  → ENC
  → Persistence.create revision
  → RevisionHead CAS
  → optional event / projection
```

- No mutation of prior revision: **Pass**  
- Core authority / OPS orchestration: **Pass**  
- Deterministic caller `revision_id`: **Pass**  

Note: operational `appendEvent` is **optional** in SPEC and IMPLEMENTATION-DECISION-020 (journal non-authoritative). That is consistent; EXEC must not treat event append as scientific commit.

---

## 11. Evidence Boundary

| Check | Result |
|-------|--------|
| Sprint 019 create-once + pre-persist preserved | **Pass** §16, §26 |
| No Evidence post-persist Record State OPS in Sprint 020 | **Pass** §16, §24, §29, §31 |
| Contradictory “implement Evidence post-persist in Sprint 020” | **None found** |
| Initial revision + RevisionHead for Evidence registration | **Pass** (Persistence consistency; not post-persist transition) |

---

## 12. Grade / Contradiction / NR / Verification Boundary

| Unit | Sprint 020 OPS? | Notes |
|------|-----------------|-------|
| Grade | **Excluded** | §14 architecture-compatible; RQ-020-006 soft |
| Contradiction | **Excluded** | §17 “No Contradiction OPS” |
| NR | **Excluded** | §18 |
| Verification | **Excluded** | §19 |

Architectural future Model C applicability for these units is described without pulling them into Sprint 020 EXEC — **Pass**.

---

## 13. Immutability

| Rule | Result |
|------|--------|
| Old revision immutable | Pass |
| New revision = new create | Pass |
| RevisionHead mutable coordination only | Pass |
| No differing replace of scientific revision payloads | Pass |
| `expected_version` ≠ scientific mutation auth | Pass |

---

## 14. Version Semantics

Trichotomy explicit §5 / §8.2:

| Token | Meaning |
|-------|---------|
| `revision_id` | Immutable revision identity |
| `content_version` (CanonicalUnit) | Core SemVer projection |
| `expected_version` / head `content_version` | Persistence CAS only |

No hidden conflation found.

---

## 15. Partial-Write Semantics

§28 distinguishes Core → ENC → create → head CAS → optional event → OPS projection.

- No multi-step transaction claimed: **Pass**  
- Orphan revision on failed head: documented; honest for memory Persistence: **Pass**  
- Implementable without inventing DB transactions: **Pass**  

---

## 16. Snapshots

| Check | Result |
|-------|--------|
| ResearchSnapshot frozen | Pass |
| WorkspaceSnapshot additive | Pass |
| Membership = scientific id; current via RevisionHead | Pass |
| Persistence snapshot must include revisions + RevisionHead | Pass |
| No silent schema redefine | Pass |

---

## 17. Determinism

Caller-supplied ids; forbid Date.now/randomUUID on evidence paths; dual-run; head CAS inputs explicit — **Pass** (§5, §21).

---

## 18. Concurrency

R1→R2 vs R1→R3 → stale head CONFLICT; no forks; no distributed claim — **Pass** (§22).

---

## 19. Errors

Coverage for duplicate revision, stale head, IMMUTABLE_ENTITY, missing predecessor, partial write, fabricated OPS meaning — **Pass** (§28). Ownership Core/ENC/Persistence/OPS preserved.

---

## 20. Migration

Dual-read old three-segment key ≡ `rev:initial`; payloads/certificates untouched; no Model B/D migration — **Pass** (§27). No silent identity reinterpretation of scientific ids.

---

## 21. REF / CONF / CERT

§25 lists additive REF-OPS categories sufficient for Sprint 020 (initial revision, Claim Standing, lineage, RevisionHead, CAS, determinism, snapshots, export, partial-write, Evidence regression). Profiles unchanged. **Pass**.

---

## 22. Architectural Invariants

| Invariant | Result |
|-----------|--------|
| Core = scientific authority | Pass |
| Persistence = infrastructure | Pass |
| OPS = orchestration | Pass |
| No second graph / journal | Pass |
| No authority leakage to head/events | Pass |
| No destructive scientific mutation | Pass |
| No DB/API/UI/AI/KG | Pass |

---

## 23. Internal Consistency

| Check | Result |
|-------|--------|
| RQ-001…005 CLOSED vs “blocking for EXEC coding” leftover | **Pass** — §30.1 CLOSED; §31.2 Satisfied |
| “READY FOR EXEC” vs unresolved RQ | **N/A** — SPEC status is DRAFT awaiting this re-audit; does not claim EXEC already running |
| §10.1 generic orchestration mentions “grade assign” | **Observation** — general Model C shape; Sprint 020 exclusion remains explicit in §24/§31 |
| §17–19 future Model C needs for C/NR/V | **Observation** — architectural future; OPS excluded |
| Event “optional” vs “required projection” | **Consistent** with IMPLEMENTATION-DECISION-020 (optional appendEvent) |

No REQUIRES-PATCH contradiction found.

---

## 24. Findings

### Strengths

1. Model C fully normative with concrete formulas bound from IMPLEMENTATION-DECISION-020.  
2. RQ-020-001…005 independently verified CLOSED.  
3. Sprint 020 slice sharp; Sprint 019 Evidence preserved.  
4. Immutability / head / lineage / version trichotomy / partial-write honest.  
5. Authority boundaries intact.

### Observations (non-blocking)

**OBS-FINAL-020-001 — §10.1 breadth**  
Generic orchestration still lists “grade assign / version service” as possible Core steps. Sprint 020 OPS excludes Grade. EXEC must follow §24 slice, not interpret §10.1 as expanding scope.

**OBS-FINAL-020-002 — Optional operational event**  
`appendEvent` remains optional; scientific commit is revision create + successful RevisionHead CAS. REF should assert journal optionally, not as scientific authority.

**OBS-FINAL-020-003 — Prior EXEC-020_REPORT**  
`audits/execution/EXEC-020_REPORT.md` records an earlier BLOCKED state (pre–implementation decision). This final re-audit **supersedes** that architecture blockage; do not treat the old report as current authority.

### Blockers

**0**

---

## 25. Required Patches

**Required patches: 0**

---

## 26. Final Verdict

**SPEC-020 — APPROVED WITH OBSERVATIONS**

SPEC-020 v0.3.0-DRAFT is architecturally complete for Sprint 020 Model C execution: internally consistent, bound to ADR-020 and IMPLEMENTATION-DECISION-020, compatible with repository constraints, and concrete enough that EXEC does not need to invent architecture.

```
EXEC-020 AUTHORIZED FROM ARCHITECTURE PERSPECTIVE
```

This does **not** certify the sprint, does **not** start coding by itself, does **not** authorize commit/push, and does **not** replace a separate EXEC-020 implementation authorization/command.

---

## Repository integrity

```
Branch: main
HEAD:   dbbc8c67b8c80feada2c6b29389b2a284a619e87
origin: dbbc8c67b8c80feada2c6b29389b2a284a619e87

Untracked (design/audit only):
  audits/
  specs/architecture/ADR-020_post_persist_revision_model.md
  specs/architecture/IMPLEMENTATION-DECISION-020.md
  specs/architecture/SPEC-020_post_persist_scientific_transition.md
```

No runtime modifications. No commit. No push. No EXEC started by this audit.

---

*End of FINAL-ARCHITECTURE-RE-AUDIT-020.*

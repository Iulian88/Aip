# EXEC-020 REPORT

| Field | Value |
|-------|--------|
| Sprint | EXEC-020 |
| Subject | Post-Persist Scientific Transition Contract |
| Mode | Pre-execution gate / STOP on unresolved architecture |
| Verdict | **EXEC-020 — BLOCKED** |
| Certification | Not claimed (not reached) |
| CODE-AUDIT-020 | Not started |

---

## 1. Baseline

| Item | Value |
|------|--------|
| HEAD | `dbbc8c67b8c80feada2c6b29389b2a284a619e87` |
| origin/main | `dbbc8c67b8c80feada2c6b29389b2a284a619e87` |
| Branch | `main` |
| Commit | `cert(sprint-019): certify Evidence Operations` |
| Prior certified | Sprint 017 / 018 / 019 FORMALLY CERTIFIED AND CLOSED |
| SPEC | `specs/architecture/SPEC-020_post_persist_scientific_transition.md` (`0.1.0-DRAFT`) |
| Architecture audit | `audits/architecture/ARCHITECTURE-AUDIT-020_SPEC-020.md` |
| Architecture verdict | SPEC-020 — APPROVED WITH OBSERVATIONS (blockers: 0; required patches: 0) |

Pre-execution inspection confirmed repository contracts at this baseline (Core transition services, Persistence `makeStorageKey` / create / replace / `IMMUTABLE_KINDS` / `expected_version`, ENC assemble, OPS Claim/Evidence create-once paths, frozen ResearchSnapshot / additive WorkspaceSnapshot). No runtime files were modified.

---

## 2. SPEC-020 Contract Implemented

**None.**

SPEC-020 does **not** resolve an implementable post-persist Persistence/OPS contract. It analyzes candidates and leaves the mechanism open.

Explicit SPEC statements:

- §9: **“No winner is declared. All remain candidates for architecture audit.”**
- §29: does not authorize ranking/selection of Models A–D as final architecture
- §31: future EXEC would implement **“one audited model”** *after* audit — audit approved the *problem framing*, not a selected model
- §35: **“No implementation. No model selected. No Persistence change authorized.”**
- Header: does not claim EXEC readiness or Persistence redesign authorization

ARCHITECTURE-AUDIT-020 further states EXEC may proceed only **after model selection resolves** OQ-020-001 / 005 / 013 / 014 (and related model-dependent OQs).

---

## 3. Files Changed

| Path | Change |
|------|--------|
| `audits/execution/EXEC-020_REPORT.md` | **Added** (this report) |

No Core / Persistence / ENC / SER / OPS / REF / CONF / CERT / test / fixture / IMPLEMENTATION.md modifications.

Unrelated prior untracked design artifacts remain:

- `specs/architecture/SPEC-020_post_persist_scientific_transition.md`
- `audits/architecture/ARCHITECTURE-AUDIT-020_SPEC-020.md`

---

## 4. Scientific Transition Semantics

Not implemented. Core transition services remain as certified (in-memory scientific evolution only; OPS create-once + Evidence optional pre-persist transition per Sprint 019).

---

## 5. Identity / Revision Semantics

Not implemented. Blocking open questions include:

| ID | Question |
|----|----------|
| OQ-020-001 | Authoritative identity of a scientific revision |
| OQ-020-002 | Scientific id vs CanonicalUnit.identity after evolution |
| OQ-020-013 | storage_key + content_version (A/C) vs new identity (B) vs audited replace+archive (D) |
| OQ-020-014 | Whether Standing/Record transitions must bump SemVer |

---

## 6. Persistence Semantics

Not modified.

Verified constraint **D-020-001** remains:

```
storage_key = persist:CanonicalUnit:{unit_kind}:{identity}
```

`content_version` is **not** part of the key. Differing `replace` of CanonicalUnit → `IMMUTABLE_ENTITY`. `expected_version` is concurrency only, not scientific mutation authorization.

Implementing any of Models A–D without a further architecture decision would require either:

- Persistence addressing change (A/C), **not authorized** by SPEC-020; or
- Canonical identity split + lineage (B), **not selected**; or
- Weakening / auditing around `IMMUTABLE_ENTITY` with archive (D), **not selected / not authorized** by this SPEC alone.

---

## 7. Event Semantics

Not implemented. Single Persistence journal unchanged. No second journal created.

---

## 8. OPS Integration

Not implemented. Claim/Evidence registration paths unchanged. No `transitionClaimStanding` / `transitionEvidenceRecord` / grade orchestration added.

---

## 9. Snapshot Compatibility

Unchanged. ResearchSnapshot frozen; WorkspaceSnapshot additive. No schema edits.

---

## 10. Serialization

Unchanged. No new artifacts.

---

## 11. Determinism

N/A for new paths (none added). Baseline certified determinism not re-executed as part of a blocked EXEC (no implementation to double-run).

---

## 12. Concurrency

Not implemented. Model-dependent (version CAS / head CAS / replace `expected_version`) — OQ-020-010 unresolved.

---

## 13. Partial-Write Behavior

Not implemented. OBS-020-004 from ARCHITECTURE-AUDIT-020 remains applicable to any future EXEC after model selection.

---

## 14. Error Semantics

Unchanged. No new error types.

---

## 15. Tests

None added. No Sprint 020 test suite created (implementation blocked before code changes).

---

## 16. Reference Tests

None added. Historical REF-OPS / SCI fixtures untouched.

---

## 17. Conformance

Not re-run for Sprint 020 (no code under test). Profiles remain `CONF-001@1.0.0` and `CONF-001@1.1.0-OPS` as certified at Sprint 019.

---

## 18. Regression Results

| Gate | Result |
|------|--------|
| New Sprint 020 implementation tests | **Not applicable** (blocked) |
| SCI / OPS / FULL / typecheck / lint / build / smoke | **Not re-executed** — no runtime delta to validate; baseline remains Sprint 019 certified tree at `dbbc8c67` |

Re-running full gates was not required to establish the architectural STOP; improvising a Persistence/OPS mechanism to “make tests pass” is forbidden by EXEC stop conditions.

---

## 19. Known Limitations

Post-persist scientific evolution remains **unavailable** for differing CanonicalUnit content after `Persistence.create`. Pre-persist Evidence transition + create-once (Sprint 019) remains the only certified OPS transition path.

---

## 20. Non-Goals (honored)

No database, API, UI, AI, KG, second journal, second relationship graph, model selection by convenience, silent Persistence addressing change, or `IMMUTABLE_ENTITY` weakening.

---

## 21. Git State

```
Branch: main
HEAD:   dbbc8c67b8c80feada2c6b29389b2a284a619e87
origin: dbbc8c67b8c80feada2c6b29389b2a284a619e87

Untracked (expected):
  audits/architecture/ARCHITECTURE-AUDIT-020_SPEC-020.md
  audits/execution/EXEC-020_REPORT.md
  specs/architecture/SPEC-020_post_persist_scientific_transition.md
```

No commit. No push.

---

## 22. Final Execution Verdict

# EXEC-020 — BLOCKED

### Exact blockers (stop conditions 1, 2, 3, 4, 5)

| # | Blocker | Affected contract | SPEC / Audit evidence | Required architectural decision |
|---|---------|-------------------|------------------------|----------------------------------|
| B-020-001 | SPEC-020 does not define a single implementable transition mechanism | Post-persist Persistence recording | SPEC §9 “No winner”; §35 “No model selected” | Select and audit **one** of Models A / B / C / D (or a new audited Model E) |
| B-020-002 | Unresolved OQs required for any Persistence write path | Identity, addressing, head, SemVer | OQ-020-001, 002, 003, 004, 005, 013, 014; Audit §20 “Needed before EXEC: Yes” | Resolve those OQs in a follow-on architecture decision / SPEC patch before EXEC |
| B-020-003 | Choosing Model A/B/C/D would violate EXEC absolute rule | Revision strategy | EXEC §2 / §28.3; SPEC AC-020-005 | Do not implement until SPEC (or successor decision record) names the model |
| B-020-004 | Model A/C need storage_key change; SPEC does not authorize it | `makeStorageKey` / D-020-001 | SPEC §4.5 D-020-001; §23 “Not allowed by this SPEC alone”; Audit §4 | Explicit Persistence addressing redesign SPEC **or** choose Model B/D with full rules |
| B-020-005 | Model D requires audited weakening of current immutability | `IMMUTABLE_ENTITY` / replace | SPEC §7 current fact; §9 Model D; Audit OBS-020-003 | Explicit audited replace+archive Persistence contract — not implied by SPEC-020 approval |

### What ARCHITECTURE-AUDIT-020 did *not* authorize

Approval with observations means the **problem framing** is sound for further architecture decision-making. It does **not** select a revision model, authorize Persistence redesign, or close OQ-020-013.

### Required next step (outside this EXEC)

1. Produce an architecture decision (e.g. SPEC-020A / ADR / patched SPEC-020) that **selects one model** and resolves OQ-020-001/005/013/014 (and model-dependent OQs).  
2. Re-audit that decision.  
3. Only then authorize a new EXEC for post-persist transitions.

### Contradiction vocabulary note (OBS-020-001)

If/when Contradiction post-persist is implemented, use Core vocabulary `unresolved_archived` / `resolved_by_*` — not `withdrawn`. Recorded for the future decision; not used as a workaround here.

---

*End of EXEC-020 REPORT — BLOCKED. No CODE-AUDIT. No certification. No commit. No push.*

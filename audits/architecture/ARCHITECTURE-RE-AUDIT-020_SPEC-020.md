# ARCHITECTURE-RE-AUDIT-020

| Field | Value |
|-------|--------|
| Audit ID | ARCHITECTURE-RE-AUDIT-020 |
| Subject | SPEC-020 v0.2.0-DRAFT (Model C normative patch) |
| Spec path | `specs/architecture/SPEC-020_post_persist_scientific_transition.md` |
| Mode | READ-ONLY re-audit |
| Prior | ARCHITECTURE-AUDIT-020 APPROVED WITH OBSERVATIONS; EXEC-020 BLOCKED; ADR-020 / ARCHITECTURE-DECISION-020 Model C selected |
| Does not authorize | Immediate EXEC without RQ-020-001…005 closure; runtime changes; certification |

---

## 1. Scope

Determine whether patched SPEC-020 successfully transforms Model C from an architectural *choice* into a sufficiently precise *normative contract*, and whether RQ-020-001…005 are independently genuine remaining implementation blockers (not hidden architectural ambiguity).

Out of scope: modifying SPEC/ADR/runtime; resolving RQs; starting EXEC; inventing formulas.

---

## 2. Baseline

| Item | Value |
|------|--------|
| HEAD | `dbbc8c67b8c80feada2c6b29389b2a284a619e87` |
| origin/main | `dbbc8c67b8c80feada2c6b29389b2a284a619e87` |
| Branch | `main` |
| Certified sprints | 017 / 018 / 019 FORMALLY CERTIFIED AND CLOSED |
| SPEC under audit | `0.2.0-DRAFT` — DRAFT — READY FOR RE-AUDIT |

---

## 3. Documents Inspected

| Document | Role |
|----------|------|
| `specs/architecture/SPEC-020_post_persist_scientific_transition.md` | Subject |
| `specs/architecture/ADR-020_post_persist_revision_model.md` | Model C authority |
| `audits/architecture/ARCHITECTURE-AUDIT-020_SPEC-020.md` | Prior audit |
| `audits/architecture/ARCHITECTURE-DECISION-020.md` | Decision summary |
| `audits/execution/EXEC-020_REPORT.md` | Prior EXEC blockers |

Repository contracts sampled:

- Persistence: `makeStorageKey`, `entityFromCanonicalUnit`, `IMMUTABLE_KINDS`, `InMemoryRepository.create/replace/appendEvent/snapshot`
- Core: Claim/Evidence/Grade transition & assign services (SemVer preservation vs Grade bump)
- ENC: envelope identity / content_version assemble path
- OPS: ResearchOperations Claim/Evidence create-once; SessionMemberRef; ResearchSnapshot / WorkspaceSnapshot shapes

---

## 4. Model C Normativity

| Check | Result |
|-------|--------|
| Model C explicitly SELECTED / normative | **Pass** — §1, §9.1, §35 |
| Model A rejected with ADR reason | **Pass** — §9.2, §33 |
| Model B rejected with ADR reason | **Pass** — §9.3, §33 |
| Model D rejected with ADR reason | **Pass** — §9.4, §33 |
| Residual “no winner / undecided candidates” language | **None found** (grep clean) |
| Competing revision architecture implicitly active | **No** |

Model C binding matches ADR-020: stable scientific id; immutable revision rows; Persistence-owned head; `revision_id` ≠ SemVer; linear history; no differing CanonicalUnit replace for scientific payloads.

---

## 5. Identity Audit

| Concept | SPEC definition | Conflation risk |
|---------|-----------------|-----------------|
| Scientific identity | Stable Core id | Clear |
| Revision identity | Caller-supplied `revision_id` ≠ SemVer | Clear |
| Canonical identity | `envelope.identity` = scientific id | Clear; aligns ENC |
| Persistence storage key | Must include scientific id + `revision_id` (+ `unit_kind`) after extension | Clear at component level |
| OPS membership identity | Scientific id + `unit_kind` | Clear |
| Session / workspace identity | Operational; unchanged | Clear |

| Implementation question | Status |
|-------------------------|--------|
| Stable scientific identity formula | **CLOSED** — existing Core id patterns |
| Revision identity formula / grammar | **OPEN** as caller-supplied string — no regex mandated (acceptable; EXEC may constrain) |
| Initial revision token | **RQ-020-002** — genuine |
| `revision_id` vs `CanonicalUnit.identity` | **CLOSED** — envelope identity remains scientific; revision is separate |
| `revision_id` vs `storage_key` | Components **CLOSED**; exact string formula **RQ-020-001** |
| `PersistenceEntity.identity` under multi-revision | **Implied** = scientific id (with revision only in addressing) — not restated as a one-line rule (Observation) |

No **new** identity blocker beyond RQ-020-001/002.

---

## 6. Storage Key Audit

**Verified today:**

```
persist:CanonicalUnit:{unit_kind}:{identity}
```

`content_version` / `revision_id` **not** in key. `makeStorageKey(kind, identity, discriminator?)` uses discriminator for `unit_kind` only.

| Question | Finding |
|----------|---------|
| Can revisions coexist under **current** contract? | **No** (D-020-001) — correctly stated |
| Model C coexistence mechanism | New `create` per revision under key that includes `revision_id`; create-once per revision row |
| Exact string formula | **RQ-020-001** — not inventable from repo today |
| Ambiguity of architecture? | **No** — components mandated; formula deferred honestly |

Independently confirmed: RQ-020-001 is a real EXEC coding blocker, not a Model C selection gap.

---

## 7. Head Audit

| Aspect | SPEC / ADR | Sufficient? |
|--------|------------|-------------|
| What head is | `(unit_kind, scientific_identity) → revision_id` | Yes |
| Ownership | Persistence | Yes |
| Scientific truth? | Explicitly **No** | Yes |
| Canonical? | No | Yes |
| Persisted? | Yes (snapshot/restore) | Yes |
| Update | CAS with expected predecessor | Yes |
| Branches / R1→R2 & R1→R3 | Conflict; linear only | Yes |
| Reconstruction | From revision rows + lineage (+ events) | Yes |
| API / entity_kind / method names | **RQ-020-004** | Unspecified — genuine |

Head is **not** a second scientific source of truth in the normative text.

RQ-020-004 independently verified as EXEC blocker (surface/API), not architectural model ambiguity.

---

## 8. Lineage Audit

| Aspect | Status |
|--------|--------|
| Parent / child | Predecessor / successor `revision_id` | Defined |
| derived-from (representation) | `predecessor_revision_id` | Defined |
| supersedes (scientific) | Core Standing only; ≠ head | Defined |
| replaces | Forbidden for scientific payloads | Defined |
| Authority | Representation metadata; not Core graph; not OPS-only | Defined |
| Placement (entity / envelope / event) | **RQ-020-003** | Genuine EXEC blocker |

No second scientific graph introduced.

---

## 9. OPS Slice Audit

| Aspect | Status |
|--------|--------|
| Orchestration shape | Normative §10.1 / §24 | Sufficient |
| Illustrative methods | `transitionClaimStanding`, `transitionEvidenceRecord`, `assignEvidenceGrade` | Illustrative only |
| First EXEC unit slice | **RQ-020-005** | Unchosen — genuine scope blocker |
| Input/output/errors at method signature level | Not frozen (depends on slice) | Expected |

RQ-020-005 is independently a real EXEC slice-selection blocker. Architecture of *how* a transition works is defined; *which* units ship first is not.

---

## 10. SemVer / Content Version Audit

| Concept | Distinction in SPEC |
|---------|---------------------|
| Scientific SemVer | Core fields; Standing/Record may preserve |
| Canonical `content_version` | ENC projection of SemVer |
| `revision_id` | Separate representation id |
| `expected_version` / head CAS | Concurrency only; not scientific mutation auth |

OBS-020-002 (SemVer-preserving transitions vs content_version addressing) is **closed** by Model C.

No remaining SemVer ambiguity that reopens Model A.

---

## 11. Immutability Audit

| Check | Result |
|-------|--------|
| Old revision immutable | Pass |
| Transition = new revision, not mutate | Pass |
| No Model D overwrite | Pass |
| `expected_version` not mutation permission | Pass |
| Head mutable infrastructure exception | Explicit; acceptable |
| `IMMUTABLE_ENTITY` spirit for revision payloads | Preserved |

---

## 12. Grade Audit

| Question | SPEC answer | Soft RQ-020-006 justified? |
|----------|-------------|----------------------------|
| Independent GradeDesignationUnit | May persist | Yes |
| Mutate prior Evidence row | No | — |
| Mutate Claim | No | — |
| Post-persist Grade | New EvidenceUnit revision (+ optional GradeDesignationUnit) | Yes |
| Grade OPS in first EXEC | Out of scope unless authorized | Soft classification **justified** |

RQ-020-006 is **not** an architecture / Model C blocker. It becomes relevant only if Grade OPS is included in RQ-020-005 slice; even then “optional GradeDesignationUnit” remains a product choice, not a Model C contradiction.

---

## 13. Snapshot Audit

| Check | Result |
|-------|--------|
| ResearchSnapshot schema frozen | Pass — no field changes |
| WorkspaceSnapshot additive | Pass |
| Membership = scientific id | Pass |
| Current resolution = head at capture | Pass |
| Persistence snapshot must include heads | Pass |
| Accidental schema change | None |

---

## 14. Concurrency Audit

| Scenario | Normative outcome |
|----------|-------------------|
| R1→R2 and R1→R3 | Head conflict; no forks |
| Duplicate revision_id identical fingerprint | Idempotent |
| Duplicate revision_id different payload | Typed error |
| Distributed serializability | Explicitly not claimed |

Deferral of distributed concurrency is explicit and safe for memory Persistence.

---

## 15. Failure / Partial-Write Audit

| Distinction | Present? |
|-------------|----------|
| Core vs Persistence vs head vs event | Yes §10.1 / §28 |
| False transactionality claim | **None** |
| Create succeeds / head fails | Documented as partial write; not silent scientific commit |
| Head succeeds / event fails | Documented; journal non-authoritative |
| Operator recovery procedure detail | Deferred to EXEC notes (§28 / §31.2 #15) |

Partial-write **architecture** is honest enough for EXEC. Detailed recovery playbooks are implementation documentation, not a SPEC Model C hole. **Not** elevated to REQUIRES PATCH.

---

## 16. REF / CONF / CERT Audit

| Layer | SPEC | Assessment |
|-------|------|------------|
| REF future evidence | Additive REF-OPS list §25 | Sufficient plan |
| Profiles | `CONF-001@1.0.0` / `CONF-001@1.1.0-OPS` unchanged | Matches ADR |
| CERT engines | Unchanged | Pass |
| Fixtures created now | Forbidden / none | Pass |

---

## 17. Migration Audit

| Check | Result |
|-------|--------|
| Existing payloads untouched | Pass |
| Initial revision + head convention | Pass |
| Exact initial token | RQ-020-002 |
| Certificates preserved | Pass |
| Prospective Model C | Pass |
| Model B dual-id / Model D archive | Explicitly not used | Pass |

---

## 18. OQ / RQ Audit

| ID | Classification |
|----|----------------|
| OQ-020-001…014 | **CLOSED** |
| OQ-020-015 | **FUTURE SCOPE** / deferred |
| OQ-020-016 | **FUTURE SCOPE** / deferred |
| RQ-020-001 | **IMPLEMENTATION BLOCKER** (storage_key formula) — independently verified |
| RQ-020-002 | **IMPLEMENTATION BLOCKER** (initial revision token) — independently verified |
| RQ-020-003 | **IMPLEMENTATION BLOCKER** (lineage placement) — independently verified |
| RQ-020-004 | **IMPLEMENTATION BLOCKER** (head API surface) — independently verified |
| RQ-020-005 | **IMPLEMENTATION BLOCKER** (OPS slice scope) — independently verified |
| RQ-020-006 | **NON-BLOCKING** / soft — classification justified |

**Conclusion:** RQ-020-001…005 are genuinely the remaining EXEC coding blockers. No additional architectural Model C blocker was found that the SPEC mislabeled as closed.

---

## 19. Architectural Invariants

| ID | Invariant | Result |
|----|-----------|--------|
| R1 | Core = scientific authority | Preserved |
| R2 | Persistence = infrastructure | Preserved |
| R3 | OPS = orchestration | Preserved |
| R4 | No second scientific graph | Preserved |
| R5 | No second event journal | Preserved |
| R6 | Immutable revisions | Preserved |
| R7 | Deterministic identity | Required (caller-supplied) |
| R8 | Deterministic serialization | Required |
| R9 | Reproducibility | Required |
| R10 | Historical recoverability | Prior rows addressable |
| R11 | Snapshot compatibility | Schemas frozen |
| R12 | REF→CONF→CERT compatibility | Additive plan |

---

## 20. Scope Audit

No introduction of database, API, backend, frontend, auth, AI, KG, literature crawler, Human Digital Twin, or cloud/distributed architecture. Non-goals §29 intact.

---

## 21. Findings

### Strengths

1. Model C is unambiguously normative; A/B/D rejected with ADR reasons.
2. Identity / SemVer / immutability / head / concurrency / migration / authority boundaries align with ADR-020 and repository facts.
3. D-020-001 correctly retained; today’s key not reinterpreted.
4. Partial writes acknowledged without fake atomicity.
5. EXEC-020 model-selection blockers (B-020-001…005) are closed at architecture layer.
6. RQ-020-001…005 correctly classified and independently confirmed as EXEC coding blockers.

### Observations (non-blocking)

**OBS-REAUDIT-020-001 — PersistenceEntity.identity under multi-revision**  
SPEC clearly keeps `envelope.identity` = scientific id and puts `revision_id` in storage addressing, but does not dedicate one normative sentence stating that `PersistenceEntity.identity` remains the scientific id (with revision only in key/metadata). Implied by ADR/ENC continuity; clarify in Persistence contract notes when closing RQ-020-001 — not a Model C contradiction.

**OBS-REAUDIT-020-002 — Partial-write recovery playbook**  
§28 requires EXEC to define operator-visible recovery when create succeeds and head fails. Architecture is honest; detailed recovery steps remain EXEC design notes (precondition §31.2 #15).

**OBS-REAUDIT-020-003 — Event journal parent_identity aggregation**  
With multiple revisions sharing scientific identity, `appendEvent(parent_identity)` aggregation by scientific id remains operationally coherent but should be called out when specifying RQ-020-003/004 so revision-scoped operational events are not confused with scientific logs.

### Blockers (implementation — not SPEC patches)

| ID | Blocks |
|----|--------|
| RQ-020-001 | Exact storage_key formula |
| RQ-020-002 | Initial revision_id token |
| RQ-020-003 | Lineage field placement |
| RQ-020-004 | Head API / entity surface |
| RQ-020-005 | First OPS transition slice |

**Architectural SPEC blockers requiring SPEC rewrite: 0**

---

## 22. Required Patches

**Required patches: 0**

RQ-020-001…005 must be closed in Persistence contract / EXEC design notes **before coding**, as SPEC §31.2 already requires. They do not constitute SPEC-020 REQUIRES PATCH under verdict rules (Model C is not ambiguous; no authority/frozen-contract violation).

---

## 23. Final Verdict

**SPEC-020 — APPROVED WITH OBSERVATIONS**

Patched SPEC-020 v0.2.0-DRAFT successfully makes **Model C** the normative post-persist revision contract, consistent with ADR-020 and repository constraints. Remaining RQ-020-001…005 are independently verified as the EXEC coding blockers. RQ-020-006 soft classification is justified.

EXEC may proceed only after:

1. Closing RQ-020-001…005 in Persistence/OPS design notes (or equivalent contract docs), and  
2. Honoring SPEC §31.2 implementation preconditions.

This re-audit does **not** itself start EXEC, certify, commit, or push.

---

## Repository integrity

```
Branch: main
HEAD:   dbbc8c67b8c80feada2c6b29389b2a284a619e87
origin: dbbc8c67b8c80feada2c6b29389b2a284a619e87

Untracked (design/audit only):
  audits/
  specs/architecture/ADR-020_post_persist_revision_model.md
  specs/architecture/SPEC-020_post_persist_scientific_transition.md
```

No runtime modifications. No commit. No push. No EXEC-020 started.

---

*End of ARCHITECTURE-RE-AUDIT-020.*

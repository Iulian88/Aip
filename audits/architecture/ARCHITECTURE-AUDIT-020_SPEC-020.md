# ARCHITECTURE-AUDIT-020

| Field | Value |
|-------|--------|
| Audit ID | ARCHITECTURE-AUDIT-020 |
| Subject | SPEC-020 — Post-Persist Scientific Transition Contract (`0.1.0-DRAFT`) |
| Spec path | `specs/architecture/SPEC-020_post_persist_scientific_transition.md` |
| Mode | READ-ONLY architecture audit |
| Auditor role | Independent architecture audit against repository contracts |
| Does not authorize | EXEC-020, Persistence redesign, OPS transition implementation, commits, certification |

---

## 1. Scope

This audit evaluates whether SPEC-020 correctly and safely defines the architectural problem of post-persist scientific evolution against **actual** repository contracts at the certified Sprint 019 baseline.

In scope:

- Authority boundaries (Core / Persistence / OPS / ENC / SER / REF / CONF / CERT)
- Immutability and storage addressing (including D-020-001)
- Models A–D completeness and neutrality
- Claim / Evidence / Grade / Contradiction / NR / Verification transition facts
- Provenance vs journal vs timeline separation
- Snapshot, determinism, concurrency, migration, failure-mode, and open-question quality
- Scope control (no DB/UI/API/AI/KG/etc.)

Out of scope:

- Implementing any transition mechanism
- Patching SPEC-020
- Ranking or selecting Models A–D
- Starting EXEC-020
- Modifying runtime, tests, fixtures, CONF, or CERT

---

## 2. Repository Baseline

| Item | Value |
|------|--------|
| HEAD | `dbbc8c67b8c80feada2c6b29389b2a284a619e87` |
| origin/main | `dbbc8c67b8c80feada2c6b29389b2a284a619e87` |
| Branch | `main` |
| Commit subject | `cert(sprint-019): certify Evidence Operations` |
| Sprint 017–019 | FORMALLY CERTIFIED AND CLOSED (per project state; not re-certified by this audit) |
| Working tree at audit start | Untracked: `specs/architecture/SPEC-020_post_persist_scientific_transition.md` only |

This audit adds a second untracked file: this report under `audits/architecture/`.

---

## 3. Contracts Inspected

### Scientific Core

- `packages/core/src/claim/transition-service.ts` — Standing transitions; preserves `claim_version`
- `packages/core/src/claim/version-service.ts` — material bumps of `claim_version`
- `packages/core/src/evidence/transition-service.ts` — Record State; preserves `evidence_version`
- `packages/core/src/evidence/version-service.ts` — material Evidence version bumps
- `packages/core/src/grade/service.ts` — `EvidenceGradeService.assign` returns new Evidence; bumps `evidence_version`
- `packages/core/src/contradiction/transition-service.ts` — open → resolved_* / `unresolved_archived`
- `packages/core/src/negative-result/transition-service.ts` — registered → withdrawn; `register` issuance
- `packages/core/src/verification/transition-service.ts` — planned → passed/failed/inconclusive

### Persistence

- `packages/persistence/src/entity.ts` — `makeStorageKey`, `entityFromCanonicalUnit`, `IMMUTABLE_KINDS`, fingerprint
- `packages/persistence/src/memory/store.ts` — `create` / `get` / `replace` / `appendEvent` / `snapshot`
- `packages/persistence/src/repository.ts` — `ReplaceOptions.expected_version`
- `packages/persistence/src/types.ts` — entity/event/snapshot contracts
- `packages/persistence/README.md` — documented immutability and addressing

### ENC / SER / OPS

- `packages/encoding/src/builder.ts` — Evidence / GradeDesignationUnit assemble; identity = scientific id; `content_version` from Core SemVer
- SER package present (`packages/serialization`) — deterministic JSON path assumed via certified OPS export; not re-audited for behavior change
- `apps/reference-app/src/operations/research-operations.ts` — Claim create-once; Evidence optional pre-persist transition then create-once
- `apps/reference-app/src/session/types.ts` — `SessionMemberRef` = `entity_kind` + optional `unit_kind` + `identity` (no revision pointer)
- `apps/reference-app/src/views/timeline.ts` — frozen `ResearchSnapshot`; additive `WorkspaceSnapshot`

### Specs / prior design

- SPEC-020 (subject)
- SPEC-018 §10.7 (post-persist deferred; replace/version open)
- SPEC-019 (Evidence OPS create-once + pre-persist transition)

### REF / CONF / CERT

- Not modified. Inspected only for pipeline implications via certified Sprint 019 architecture (Reference Tests → ConformanceEngine(profile) → CertificationEngine). No fixtures or profiles opened for rewrite.

---

## 4. D-020-001 Storage Key Verification

### Exact formula (CanonicalUnit)

From `entityFromCanonicalUnit` → `makeStorageKey("CanonicalUnit", identity, unit_kind)`:

```
persist:CanonicalUnit:{unit_kind}:{identity}
```

Examples:

- `persist:CanonicalUnit:ClaimUnit:{claim_id}`
- `persist:CanonicalUnit:EvidenceUnit:{evidence_id}`
- `persist:CanonicalUnit:GradeDesignationUnit:{evidence_id}`

### Does `content_version` participate in storage addressing?

**No.** `content_version` is stored on `PersistenceEntity` / ENC envelope but is **not** part of `storage_key`.

### Can multiple revisions coexist under the same identity?

**No** under current addressing for the same `(entity_kind=CanonicalUnit, unit_kind, identity)`.

EvidenceUnit and GradeDesignationUnit **can** coexist for the same scientific `evidence_id` because `unit_kind` discriminates the key — this is not version coexistence.

### `create` overwrite?

**No.** Existing `storage_key` → `ALREADY_EXISTS`.

### `replace` / update?

`replace` exists. Differing fingerprint on kinds in `IMMUTABLE_KINDS` (includes `CanonicalUnit`) → `IMMUTABLE_ENTITY`. Identical fingerprint → idempotent success.

### `expected_version`

Checked on `replace` before immutability. Mismatch → `CONFLICT`. Matching `expected_version` does **not** authorize differing scientific content mutation: immutable kinds still reject with `IMMUTABLE_ENTITY`.

**Verdict on D-020-001:** SPEC-020’s interpretation is **CORRECT**. Model A as “same identity, multiple stored content_version rows” is **not implementable** without a Persistence addressing change (or a different model that does not require multiple rows under one key).

---

## 5. Model A Audit

| Dimension | Assessment |
|-----------|------------|
| Description | Stable scientific id + advancing `content_version` / SemVer; conceptual E1@v1, E1@v2 |
| Persistence | Correctly flagged as blocked by D-020-001 without key redesign |
| Immutability | Strong **if** versioned rows; overwrite fallback is really Model D (see Observations) |
| Lineage | Implicit via SemVer sequence — incomplete if Standing/Record transitions do not bump SemVer |
| Snapshots | Need version or head resolution |
| Determinism | Requires explicit version selection |
| Concurrency | Version CAS |
| OPS / REF / migration | Adequately sketched |
| Completeness gap | Core Standing / Evidence Record transitions **preserve** SemVer today; Grade assign **does** bump. Model A analysis under-emphasizes that content_version-only keys would still collide for Standing-only evolution unless Core bumps versions or keys gain another discriminator (partially covered by OQ-020-014) |

**Accuracy for decision-making:** Adequate, with Observation on SemVer-preserving transitions.

---

## 6. Model B Audit

| Dimension | Assessment |
|-----------|------------|
| Description | New CanonicalUnit.identity per revision + explicit lineage; scientific id in content/index |
| Persistence | Correctly assessed as create-once compatible |
| Immutability | Strong |
| Identity risk | Correctly notes breakage of today’s `scientific id == Canonical identity` assumption (ENC/OPS) |
| Relationships / snapshots | Per-representation content; membership would need dual fields or mapping |
| Migration | Highest identity-mapping cost — correctly noted |
| REF/CONF | Additive fixtures plausible |

**Accuracy for decision-making:** Adequate. No silent preference.

---

## 7. Model C Audit

| Dimension | Assessment |
|-----------|------------|
| Description | Stable scientific id + immutable revision rows + explicit head |
| Persistence | Correctly notes need for versioned addressing **or** revision ids (overlaps A/B mechanisms) |
| Head | Correctly framed as index, not scientific authority |
| Concurrency | Head CAS correctly identified as distinct concern |
| Risk | Head ownership (Persistence vs OPS) left open — appropriate |

**Accuracy for decision-making:** Adequate. Overlap with A/B mechanics is acknowledged, not hidden as a fifth winner.

---

## 8. Model D Audit

| Dimension | Assessment |
|-----------|------------|
| Description | Audited differing `replace` + mandatory archive of prior bytes; `expected_version` mandatory |
| Persistence | Correctly identifies single-slot reuse vs current `IMMUTABLE_ENTITY` |
| Reproducibility | Correctly flagged as highest risk (“state at T”) |
| Authority risk | Correctly warns Persistence must not gain scientific meaning |
| Concurrency | `expected_version` on replace is the natural fit |

**Accuracy for decision-making:** Adequate. No winner declared.

---

## 9. Scientific Authority Audit

| Check | Result |
|-------|--------|
| Core owns transition legality / resulting scientific object | Preserved (§6, §10, §24) |
| Persistence owns storage only | Preserved (§6, §23) |
| OPS orchestrates; does not define standing/record/grade/relationships | Preserved (§6, §24) |
| Timeline as scientific provenance | Explicitly forbidden (§11) |
| Snapshots as scientific records | Not elevated; frozen schemas (§20) |
| Head / revision pointers as scientific truth | Explicitly warned against (§9 Model C; OQ-020-003) |

**No wording found that accidentally transfers scientific authority to OPS, Persistence, timeline, or snapshots.**

---

## 10. Immutability Audit

SPEC-020 separates evolution from byte mutation (§7). Verified against implementation:

| Concept | Repository meaning | SPEC treatment |
|---------|-------------------|----------------|
| A. Immutable entity record | Differing `replace` → `IMMUTABLE_ENTITY` for `IMMUTABLE_KINDS` | Correct |
| B. Immutable canonical artifact | Frozen payload after create | Correct |
| C. Immutable identity | Scientific ids stable across Core transitions | Correct |
| D. Immutable stored revision | Not yet a Persistence primitive; design candidate | Correctly open |
| E. Repository concurrency/version | `content_version` + optional `expected_version` → `CONFLICT` | Correctly **not** scientific mutation authorization |
| F. Scientific state transition | Core services return new frozen objects | Correct |

**Critical confirmation:** `expected_version` is **not** permission to mutate scientific entities under current rules.

---

## 11. Post-Persist Transition Audit

Factual matrix from code + SPEC treatment:

| Unit / State | Current Core behavior | Current Persistence behavior | SPEC-020 treatment | Gap? |
|--------------|----------------------|------------------------------|--------------------|------|
| Claim Standing | `ClaimTransitionService` returns new Claim; appends STE; **preserves `claim_version`** | Create-once ClaimUnit; differing replace rejected | Post-persist needs new representation under chosen model | No architectural gap; OQ-020-007/014 open |
| Claim material content | `ClaimVersionService` bumps `claim_version` | Same create-once / immutable | Covered as content_version evolution | No |
| Evidence Record State | `EvidenceTransitionService`; draft→registered→withdrawn; Human for register; **preserves `evidence_version`** | OPS: optional **pre-persist** transition then create-once (SPEC-019); no post-persist | Correctly scopes SPEC-020 as post-persist enablement | No |
| Evidence material / items | Version service / material-change rules | Immutable after create | Covered | No |
| Grade assignment | `assign` → new Evidence; bumps `evidence_version`; GAE; does not change Record State/Standing | GradeDesignationUnit separately assemblable; same-id key via `unit_kind` | Explicit dependency (§14); Grade OPS out of scope | No |
| Contradiction | open → resolved_* / **`unresolved_archived`** (not withdrawn) | No OPS; create-once possible; resolution after persist needs contract | Design covered; **vocabulary slip** (says withdrawn) | Observation only |
| Negative Result | `register` → registered; transition → withdrawn | No OPS | Covered | No |
| Verification | `createPlanned`; leave planned → passed/failed/inconclusive; Human gate | No OPS | Covered | No |

---

## 12. Grade Dependency Audit

Verified facts:

| Question | Answer from repository |
|----------|------------------------|
| Independently persistable? | Yes as `GradeDesignationUnit` CanonicalUnit (`buildGradeDesignation`); OPS does not persist it today |
| Embedded? | Grade meaning also on Evidence via `grade_ref` + `grade_assignment_log` |
| Assign requires Evidence mutation? | Returns **new** Evidence object (in-memory); bumps `evidence_version` |
| Own identity? | GradeDesignationUnit uses **evidence_id** as envelope identity; discriminated by `unit_kind` |
| Changes scientific state? | Changes Evidence grade slot / version; not Standing / Record State |
| After Evidence persist? | Would require post-persist Evidence representation evolution (same class as SPEC-020 problem) + optional new GradeDesignationUnit create |

SPEC-020 §14 matches these facts. Unresolved items correctly remain OQ-020-006 (interaction with revision model / GradeDesignationUnit persistence), not invented Grade lifecycle.

---

## 13. Provenance / Journal / Timeline Audit

| Stream | SPEC distinction | Repository alignment |
|--------|------------------|----------------------|
| Scientific provenance | Core STE/ERTE/GAE/… + Core provenance + ENC unit events | Correct |
| Source/provenance metadata | Separated in definitions | Correct |
| Persistence event journal | Single `appendEvent` journal | Correct; OPS `appendResearchEvent` is the sole OPS write path into that journal |
| OPS timeline | Projection of Persistence events | Correct (SPEC-018 Option C continuity) |
| Snapshots | Frozen / additive views | Correct |
| Revision lineage | Design candidate; not second scientific graph | Correct constraint |

**Ambiguity check:** Model A §9 mentions “audited Persistence replace policy” as a Model A escape hatch — this **blurs A into D** terminologically. Comparison table still separates them. Recorded as Observation, not authority conflation.

Illustrative future event type names (§12) are explicitly non-authoritative — acceptable.

---

## 14. Snapshot Audit

| Contract | SPEC-020 | Verified |
|----------|----------|----------|
| `ResearchSnapshot` frozen | Must not change schema | Matches `views/timeline.ts` comment and shape (`research_session_id`, `member_refs`, `persistence_snapshot`) |
| `WorkspaceSnapshot` additive | Must not redefine ResearchSnapshot | Matches |
| Membership | identity + unit_kind today; no revision pointer | Matches `SessionMemberRef` |
| Future options | scientific id / revision id / head resolution / future additive historical type | Design-only; no schema mutation authorized |

No silent redefinition of snapshot contracts.

---

## 15. Determinism Audit

SPEC-021 requirements (§21) align with repository norms:

- Caller-supplied ids / `at` / `event_id`
- Forbid `Date.now` / `randomUUID` on evidence paths
- Deterministic lineage/head/journal ordering
- Double-run identical outputs

No model description introduces hidden nondeterminism as a requirement. Persistence snapshot ids today derive from deterministic body fingerprinting (existing foundation) — not contradicted.

---

## 16. Concurrency Audit

| Concern | SPEC | Repository |
|---------|------|------------|
| Optimistic `expected_version` | Correctly scoped to Persistence replace CONFLICT | Accurate |
| Scientific revision concurrency | Design requirement; ownership TBD | Appropriate open |
| Head movement | Model C concern | Appropriate |
| Duplicate revisions / idempotency | Required policy | Appropriate |
| Distributed locking / multi-user | Deferred | Correct; memory-only first EXEC allowed |

SPEC does **not** invent a database. Concurrency that can be specified at in-memory Persistence level (CAS tokens, idempotent event_id, create races) is distinguished from future distributed work.

---

## 17. REF / CONF / CERT Audit

SPEC-020 does **not** require a new conformance architecture.

| Layer | Implication stated | Assessment |
|-------|-------------------|------------|
| REF | New deterministic fixtures once EXEC exists | Correct |
| CONF | Prefer additive REF-OPS under `CONF-001@1.1.0-OPS` | Consistent with Sprint 018–019 pattern |
| CERT | Same engines; new ConformanceReports as evidence | Correct |
| SCI corpus | Unchanged unless Core semantics change | Correct |

No silent profile redesign. No certification of SPEC-020 itself.

---

## 18. Migration Audit

SPEC distinguishes:

| Kind | Present? |
|------|----------|
| A. Architectural migration (model choice) | Yes — OQ-020-013 and models |
| B. Data migration | Yes — opt-in; no big-bang rewrite (§26–27) |
| C. Compatibility layer | Implied via create-once remaining valid |
| D. New persistence addressing | Explicit for A/C |
| E. Historical lineage introduction | Explicit for B/C |

Certified corpus preservation requirements are stated. Risks for Model B dual identity and Model D archive retrieval are identified without implementing migration.

---

## 19. Failure-Mode Audit

| Failure | SPEC coverage | Assessment |
|---------|---------------|------------|
| Duplicate revision / create | `ALREADY_EXISTS` | Defined |
| Conflicting / stale revision | `CONFLICT` / head conflict TBD | Partially defined; ownership open (OK) |
| Invalid Core transition | Core typed errors | Defined |
| Broken lineage / missing parent | TBD by model | Explicitly unresolved |
| Invalid identity / collision | Design must prevent | Stated |
| Partial persistence | Not fully enumerated as transactional failure | Observation — acceptable at design stage with memory adapter |
| Failed head update | Implied under concurrency | Soft |
| Failed event append | Covered by Persistence errors / architecture violation | Adequate |
| Deterministic replay mismatch | REF / defect | Defined |
| Snapshot / export inconsistency | OPS command-state / projection | Adequate |
| Concurrent transition conflict | Design requirement | Adequate |

No accidental assumption that differing `replace` already works.

---

## 20. Open Questions Audit

| OQ | Genuinely unresolved? | Already answered by repo? | Needed before EXEC? | May remain open? | Separate SPEC? |
|----|----------------------|---------------------------|---------------------|------------------|----------------|
| OQ-020-001 revision identity | Yes | No | **Yes** (model selection) | Until model chosen | No — part of EXEC design gate |
| OQ-020-002 scientific vs Canonical identity | Yes | Today equal; future open | **Yes** if Model B | Until model chosen | Possibly ENC/OPS follow-on if B |
| OQ-020-003 head representation | Yes | No head primitive | **Yes** if Model C | Until model chosen | No |
| OQ-020-004 historical addressability | Yes | Only single current slot | **Yes** | Until model chosen | No |
| OQ-020-005 map Core→persisted under D-020-001 | Yes | Constraint known | **Yes** | Until model chosen | No |
| OQ-020-006 Grade × Evidence revisions | Partially fact-known; model interaction open | Facts known; persistence path open | **Yes** before Grade OPS | Until model + Grade OPS SPEC | Future Grade OPS SPEC may consume |
| OQ-020-007 Claim Standing × ClaimUnit | Yes | Standing preserves claim_version | **Yes** | Until model chosen | No |
| OQ-020-008 provenance vs Persistence events | Largely answered by SPEC rules | Separation already in SPEC-018 | Soft — reinforce in EXEC | Can remain as design constraint | No |
| OQ-020-009 snapshots historical vs current | Yes | Membership lacks revision | **Yes** before snapshot semantics change | Schema freeze allows deferral of additive type | Possibly additive snapshot SPEC |
| OQ-020-010 concurrency | Partially | expected_version exists | **Yes** for chosen model | Details open | No |
| OQ-020-011 REF/CONF/CERT | Preference stated; not final | Pipeline exists | Soft for EXEC planning | Profile bump open | No |
| OQ-020-012 memory-only first EXEC | Yes as policy | Memory adapter exists | Soft | Can remain preferred | No |
| OQ-020-013 addressing vs identity vs replace | Yes — **central** | D-020-001 constrains A | **Yes** — blocks model selection | Until architecture decision | No |
| OQ-020-014 Standing vs SemVer bump | Yes | Core preserves version on Standing/Record transitions | **Yes** if Model A/versioned keys | Until model chosen | Possibly Core if bump required |
| OQ-020-015 PersistenceRelationship history | Yes | Relationships mapped into entity; journal separate | Soft | Can remain | No |
| OQ-020-016 version_hint targeting | Yes | Optional ENC field exists | Soft until references pin revisions | Can remain | ENC follow-on possible |

No OQ was falsely marked open when the repository already closed it (except OQ-020-008 which is already largely constrained — remaining open is harmless).

---

## 21. Scope-Control Audit

SPEC-020 non-goals (§29) and body do **not** introduce:

- database / durable vendor
- API / backend / frontend / auth
- multi-user infrastructure
- AI / knowledge graph / literature / Human Digital Twin
- distributed / cloud architecture

Future durable Persistence is mentioned only as a later trigger (ARCHITECTURE-REVIEW-002 continuity) — not a SPEC-020 requirement.

---

## 22. Findings

### Verified strengths

1. Correct D-020-001 storage_key analysis.
2. Correct interpretation of `IMMUTABLE_ENTITY` and non-authorization role of `expected_version`.
3. Preserved Core scientific authority and Persistence-as-infrastructure.
4. Clear separation of scientific provenance / Persistence journal / OPS timeline.
5. No second journal or second relationship graph.
6. Models A–D analyzed without selecting a winner.
7. Grade / Claim / Evidence / Contradiction / NR / Verification dependencies present.
8. Sprint 019 create-once + pre-persist Evidence path preserved.
9. Snapshot schemas frozen.
10. Determinism and REF/CONF/CERT implications stated without modifying engines.
11. Status remains DRAFT; no EXEC authorization.

### Observations (non-blocking)

**OBS-020-001 — Contradiction vocabulary slip**  
§2 and §17 say Contradiction transitions to `resolved_* / withdrawn`. Repository terminal leave-open states are `resolved_by_supersession` | `resolved_by_scope_split` | `resolved_by_retraction` | `unresolved_archived`. There is **no** Contradiction `withdrawn` state. Evidence/NR withdrawn vocabulary does not apply.

**OBS-020-002 — Model A / SemVer-preserving transitions**  
`ClaimTransitionService` and `EvidenceTransitionService` preserve Core SemVer. Model A’s “content_version rows” story is incomplete unless (a) Core bumps version on Standing/Record transitions, (b) storage keys include a non-SemVer revision discriminator, or (c) Model A is abandoned. OQ-020-014 captures this partially; §9 Model A should cross-link it more explicitly for decision-makers.

**OBS-020-003 — Model A escape hatch blurs into Model D**  
§9 Model A text allows “audited Persistence replace … overwrite the single slot” as an alternative to key redesign. That alternative **is** Model D. The comparison table separates them; wording should avoid folding D into A.

**OBS-020-004 — Partial-write / transactional failure**  
Failure modes list Persistence errors well but do not deeply specify multi-step orchestration failure (Core succeeded / ENC succeeded / create failed / event append failed). Acceptable at design stage; EXEC must define compensation/idempotency.

**OBS-020-005 — SPEC-018 §10.7 continuity**  
SPEC-020 correctly continues the open replace/version question from SPEC-018 §10.7 without silently resolving it via “replace is now allowed.”

### Blockers

**None.**

---

## 23. Required Patches

**Required patches: 0**

Observations above may be corrected by a voluntary wording patch before or during model-selection audit, but they do **not** meet the threshold for `REQUIRES PATCH` (no concrete architectural defect that prevents safe progression to a future EXEC **after** model selection resolves OQ-020-001/005/013/014).

---

## 24. Final Verdict

**SPEC-020 — APPROVED WITH OBSERVATIONS**

SPEC-020 correctly frames the post-persist scientific transition problem against the certified repository: Core evolves scientific meaning; Persistence stores create-once immutable CanonicalUnits addressed by `persist:CanonicalUnit:{unit_kind}:{identity}`; OPS must not become scientific authority; Models A–D remain unranked candidates; D-020-001 is verified; no implementation is authorized.

---

## Repository integrity (audit close)

At audit completion, expected working tree:

```
?? specs/architecture/SPEC-020_post_persist_scientific_transition.md
?? audits/architecture/ARCHITECTURE-AUDIT-020_SPEC-020.md
```

- No runtime / test / fixture / CONF / CERT / Core / ENC / SER / Persistence / OPS modifications
- No commit
- No push
- No EXEC-020

---

*End of ARCHITECTURE-AUDIT-020.*

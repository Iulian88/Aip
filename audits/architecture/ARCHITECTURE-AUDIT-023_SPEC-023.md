# ARCHITECTURE-AUDIT-023
## SPEC-023 — Contradiction OPS Under Model C

| Field | Value |
|-------|-------|
| Audit ID | ARCHITECTURE-AUDIT-023 |
| Subject | `specs/architecture/SPEC-023_contradiction_ops.md` |
| Spec status at audit | DRAFT — READY FOR ARCHITECTURE AUDIT |
| Baseline | `662d7f7881337809c7973a39b683053ae3c45a87` (Sprint 022 certified + closed) |
| Mode | **READ-ONLY** |
| Discovery | `audits/roadmap/DISCOVERY-023_NEXT_RESEARCH_FRONTIER.md` |
| Does not authorize | EXEC, source/test changes, SPEC patches, certification, commit, push |

**Classification legend:** BLOCKER | REQUIRED PATCH | OBSERVATION | DEFERRED | NOT APPLICABLE

---

### 1. Audit Scope

Independent architecture audit of SPEC-023 against:

- the certified Sprint 015–022 architecture (Model C, OPS post-persist pattern, CONF/CERT),
- the **actual** Core / ENC / SER / Persistence / OPS / REF source at the baseline commit,
- DISCOVERY-023.

**Question answered:** Can SPEC-023 safely become the architectural basis for IMPLEMENTATION-DECISION-023?

Every critical claim below was verified by reading source, not by trusting the SPEC or the discovery. This audit implements nothing, patches nothing, and authorizes no EXEC.

---

### 2. Verified Git Baseline

| Check | Result |
|-------|--------|
| HEAD | `662d7f7881337809c7973a39b683053ae3c45a87` |
| origin/main | `662d7f7881337809c7973a39b683053ae3c45a87` |
| HEAD == origin/main | YES |
| Certified commit | `cert(sprint-022): certify Grade OPS` |
| Working tree | Docs-only untracked: `DISCOVERY-023_NEXT_RESEARCH_FRONTIER.md`, `SPEC-023_contradiction_ops.md` (+ this audit) |
| Runtime / tests / fixtures / cert artifacts modified by this audit | **NONE** |

### Certified corpus (repository evidence)

| Corpus | Claimed by SPEC-023 | Repository evidence | Verdict |
|--------|---------------------|---------------------|---------|
| SCI | 44/44 | SCI fixture families; `CERTIFICATION-022` | **Verified** |
| OPS | 76/76 | `REF-OPS-001…076` in `fixtures/ops.ts` (last id `REF-OPS-076` at line 2300) | **Verified** |
| FULL | 120/120 | SCI ∪ OPS; `SPRINT-022_FORMAL_CERTIFICATION.json` | **Verified** |
| Profiles | `CONF-001@1.0.0`, `CONF-001@1.1.0-OPS` | `packages/conformance/src/profiles.ts` | **Verified** |
| Next free OPS id | `REF-OPS-077` | no `REF-OPS-077` in corpus | **Verified** |

---

### 3. Source Documents / Code Audited

| Artifact | Role |
|----------|------|
| `specs/architecture/SPEC-023_contradiction_ops.md` | Subject |
| `audits/roadmap/DISCOVERY-023_NEXT_RESEARCH_FRONTIER.md` | Discovery input |
| `specs/architecture/SPEC-022_grade_ops.md`, `SPEC-021_…`, `SPEC-020_…`, `ADR-020` | Model C + post-persist precedents |
| `audits/certification/CERTIFICATION-020/021/022.md` | Certified baseline chain |
| `packages/core/src/contradiction/{types,identifiers,factory,transition-service,validator,reference-validator,event-builder,version-service,index}.ts` | Contradiction Core authority |
| `packages/core/src/claim/{transition-service,validator,version-service,factory}.ts` | `Claim.contested_by` / Standing |
| `packages/encoding/src/{builder,registry,reference-resolver,types}.ts` | `ContradictionUnit` |
| `packages/serialization/src/**` (grep for `ContradictionUnit`) | SER registration |
| `packages/persistence/src/{types,entity,revision,repository,errors}.ts`, `memory/store.ts` | Model C, RevisionHead, CAS, journal, `Relationship` kind |
| `apps/reference-app/src/operations/{research-operations,claim-from-unit,evidence-from-unit}.ts`, `views/timeline.ts`, `session/types.ts`, `errors/ops-error.ts`, `index.ts` | OPS pattern, decode, snapshots, timeline, membership, errors |
| `packages/reference-tests/src/fixtures/{ops,ops-support,contradiction,canonical,support}.ts` | REF corpus / precedent (`REF-OPS-004`, `REF-OPS-039`, `REF-OPS-062…076`) |
| `packages/conformance/src/{profiles,types}.ts`, `packages/certification/src/types.ts` | CONF / CERT |
| `scripts/smoke-016…022*.mjs` | Marker / direct-constructor regression surface |

---

### 4. Scientific Authority Audit

| Concern | SPEC-023 | Repository | Verdict |
|---------|----------|------------|---------|
| Contradiction meaning | SCI-004, Core-owned (§4, §5) | `packages/core/src/contradiction/*` — sole implementation | **PASS** |
| Creation authority | `ContradictionFactory.createOpen` (§5.3, §7) | `factory.ts` — only creation method; sets `record_state: "open"`, empty CRTE log, validates | **PASS** — correct name (not `createDraft`) |
| Transition authority | `ContradictionTransitionService.transition` (§5.4, §8) | `transition-service.ts` — `ALLOWED` table, `assertTransitionLegal`, `assertHumanReviewerGate`, CRTE append, `resolution_note` handling, validator | **PASS** |
| Vocabulary | Reused: `open`, `resolved_by_supersession`, `resolved_by_scope_split`, `resolved_by_retraction`, `unresolved_archived`; nothing added | `CONTRADICTION_RECORD_STATES` identical; `FORBIDDEN_CONTRADICTION_RECORD_STATES` excludes `draft`/`registered`/`withdrawn` | **PASS** |
| OPS invents legality? | Forbidden (§6.2) | Proposed chain calls Core before any `create`; Core errors propagate | **PASS** |
| Generic lifecycle | Rejected (§6.2, §22, OQ-023-010) | Existing OPS has three explicit per-unit methods; SPEC adds a fourth explicit one | **PASS** |
| Second scientific authority | None | Decode helper is a projection; Core validates transitioned output | **PASS** |
| Processor duplication | OPS calls Core directly (as 020–022) | `transition-engine.ts` `contradiction.record_transition` untouched | **PASS** |

**Normative OPS chain audited (both operations):**

```
registerContradictionUnit
  → ContradictionFactory.createOpen          // sole creation validity
  → CanonicalEncoder.assemble → ContradictionUnit
  → entityFromCanonicalUnit(unit, { revision_id: "rev:initial" })
  → repository.create → repository.ensureInitialHead(id, "ContradictionUnit", "rev:initial")

transitionContradictionRecordState
  → getContradictionUnit (head-resolved)
  → contradictionFromContradictionUnitPayload
  → ContradictionTransitionService.transition  // sole transition validity
  → CanonicalEncoder.assemble
  → entityFromCanonicalUnit(unit, { revision_id, predecessor_revision_id })
  → repository.create → repository.advanceHead (CAS) → optional appendEvent
```

**Scientific authority violations:** **NONE**.

---

### 5. Creation Path Audit (SPEC §7)

| Step (SPEC) | Actual API | Verified behaviour | Verdict |
|-------------|-----------|--------------------|---------|
| `ContradictionFactory.createOpen(input)` | `factory.ts` `createOpen(input: CreateContradictionInput)` | validates refs (`F2`/`F3`/`F4`), NFC-trims, `record_state: "open"`, `record_transition_log: []`, `validator.validate` | **PASS** |
| `CanonicalEncoder.assemble(contradiction)` | registry detects `"contradiction_id" in o && "involved_claims" in o` → `buildContradiction` | envelope `unit_kind: "ContradictionUnit"`, `identity = contradiction_id`, `content_version = contradiction_version` | **PASS** |
| `entityFromCanonicalUnit(unit, { revision_id: "rev:initial" })` | `entity.ts` kind map includes `ContradictionUnit → "CanonicalUnit"`; rejects predecessor on `rev:initial` | storage key `persist:CanonicalUnit:ContradictionUnit:{id}:rev:initial` | **PASS** |
| `repository.create(entity)` | `store.ts` line 294 — `ALREADY_EXISTS` on key collision | duplicate register → `ALREADY_EXISTS` as SPEC §7.4 states | **PASS** |
| `repository.ensureInitialHead(id, "ContradictionUnit", "rev:initial")` | `store.ts` line 572 — idempotent when same revision; `CONFLICT` if different; `NOT_FOUND` if revision row missing | matches `registerClaimUnit` usage | **PASS** |
| No implicit event / membership | SPEC §7.1 | `registerClaimUnit` / `registerEvidenceUnit` emit none; parity | **PASS** |
| `options.revision_id` ≠ `rev:initial` → `OpsError INVALID_COMMAND_STATE` | identical guard exists in `registerClaimUnit` (lines 223–231) | **PASS** |
| No `options.transition` (OQ-023-012) | Core has no issuance edge; only `registerEvidenceUnit` offers pre-persist transition | consistent; documented decision | **PASS** |

**Invented / unavailable APIs:** **NONE**. All new symbols are explicitly marked *(new — Sprint 023)* and mirror existing ones.

---

### 6. Transition Path Audit (SPEC §8)

| Requirement | SPEC-023 | Repository | Verdict |
|-------------|----------|------------|---------|
| Delegates to `ContradictionTransitionService.transition` | §8.1 step 3 | exists; signature `(contradiction, ContradictionRecordTransitionInput)` | **PASS** |
| Head-resolved load | `getContradictionUnit` = `repository.get(identity, "CanonicalUnit", { unit_kind: "ContradictionUnit" })` | same shape as `getEvidenceUnit` (line 559) | **PASS** |
| `predecessor_revision_id === expected_head_revision_id` | §8.1, §8.2 | `entityFromCanonicalUnit` enforces non-initial ⇒ predecessor required, ≠ revision_id | **PASS** |
| Stable scientific identity | `contradiction_id` unchanged by Core `transition` (copied) | `transition-service.ts` line 137 | **PASS** |
| Caller-supplied `revision_id`; ≠ `rev:initial`; ≠ expected | §8.1 guards | identical guards in 020/021/022 methods (lines 272–285, 344–357, 416–429) | **PASS** |
| Stale head → `CONFLICT` | §8.5 | `store.advanceHead` line 635–646 | **PASS** |
| Duplicate revision → `ALREADY_EXISTS` | §8.5 | `store.create` | **PASS** |
| Previous revision immutable | §8.5, T-16 | `IMMUTABLE_KINDS` includes `CanonicalUnit`; `replace` → `IMMUTABLE_ENTITY`; OPS never replaces rows | **PASS** |
| SemVer not misused | §8.3 — `contradiction_version` unchanged by transition; lineage via `predecessor_revision_id` | Core copies `contradiction_version`; only `ContradictionVersionService` bumps | **PASS** |
| Partial write | §8.5 — orphan row possible, head unchanged | `advanceHead` verifies target exists then CAS; matches 020–022 honesty | **PASS** |
| Predecessor existence at `create` | not checked (inherited O-020-01) | `entityFromCanonicalUnit` / `create` do not check | **PASS** (DEFERRED, inherited) |

---

### 7. Record State Semantics Audit (SPEC §5.4)

| Rule | SPEC-023 | Source | Verdict |
|------|----------|--------|---------|
| Edges | `open → {resolved_by_supersession, resolved_by_scope_split, resolved_by_retraction, unresolved_archived}`; terminals have none | `ALLOWED` in `transition-service.ts` lines 16–29 | **PASS** — identical |
| Human gate `F6` | every legal edge leaves `open` ⇒ Human required | `leavesOpen(to)` = resolved ∨ archived; `assertHumanReviewerGate` throws `F6` for non-`human:` agent; `ContradictionEventBuilder` re-checks with `requireHuman` | **PASS** |
| `decision_ref` required | "effectively required" (optional in type, required by gate) | `assertHumanReviewerGate` → `F_TRANSITION` when empty; `event-builder` same; validator `validateCrte` same | **PASS** — SPEC wording precise |
| `resolution_note` for `resolved_*` | required (`F7`); ignored for `unresolved_archived` | gate throws `F7` only `if (isResolvedState(input.to))`; transition sets note only when `isResolvedState`; validator CRR-1 | **PASS** |
| Changing existing non-empty note | `F8` via transition; version service path out of scope | lines 121–134 | **PASS** |
| No reinterpretation | SPEC restates, does not alter | — | **PASS** |

---

### 8. Reference Integrity Audit (SPEC §9)

| Claim in SPEC | Source verification | Verdict |
|---------------|--------------------|---------|
| `involved_claims` → envelope references role `involves`, `target_class: "Claim"` | `builder.ts` lines 290–293 | **PASS** |
| `evidence_refs` → role `cites_evidence`, `target_class: "Evidence"` | lines 294–297 | **PASS** |
| Not in `content` | content block lines 319–331 has no `involved_claims`/`evidence_refs` | **PASS** — decode must use references (SPEC §8.4 does) |
| Grammar-only, no dereference (Core) | `ContradictionReferenceValidator` — regex + distinctness only | **PASS** |
| Grammar-only, no dereference (ENC) | `CanonicalReferenceResolver.assertIdentity` → `matchesGrammar`; error code `BROKEN_REFERENCE` is raised on **grammar** failure only (name notwithstanding) | **PASS** |
| No dereference in Persistence / OPS today | no `exists`/`get` on referenced ids in any OPS method; `REF-OPS-039` cites non-existent Contradiction | **PASS** |
| Repository requires dereferencing? | **No** — nothing in Core/ENC/Persistence requires target existence | **NOT A BLOCKER** |
| SPEC decision: no existence rule (OQ-023-001) | consistent with SSR-5 independence and certified precedent | **PASS** |

---

### 9. Relationship Boundary Audit (SPEC §9.2) — critical gate

| Check | Repository | SPEC-023 | Verdict |
|-------|-----------|----------|---------|
| `Persistence.Relationship` exists | `PERSISTENCE_ENTITY_KINDS` includes `"Relationship"`; `entityFromRelationship` in `entity.ts` | acknowledged | **PASS** |
| Used by OPS / REF today | grep: zero usages of `entityFromRelationship` / `"Relationship"` in `apps/`, `reference-tests/`, `scripts/` | stated | **PASS** |
| SPEC forbids creating `Relationship` entities for Contradiction edges | §9.2 SHALL NOT list; §22 non-goal; T-22 | — | **PASS** |
| Second relationship graph | none required — edges live in `ContradictionUnit` payload | — | **PASS** |
| Relationship projection | none introduced | — | **PASS** |
| Duplicate scientific edges | `entityFromCanonicalUnit.mapReferences` mirrors envelope references into `PersistenceEntity.references` on the **same** row (generic since Sprint 015 for all units) | SPEC §9.1 correctly names this a non-authoritative mirror, not a store | **PASS** — see O-023-01 / O-023-03 |
| Automatic reverse synchronization | none — `Claim.contested_by` only via Core Standing input | §10 | **PASS** |
| `Persistence.Relationship` necessary for correct semantics? | **No** — Core validity is independent of Persistence contents | — | **NOT A BLOCKER** |

**Finding O-023-01 (OBSERVATION):** `InMemoryStore.queryRelationships(filter)` (store.ts line 554) returns any entity with `entity_kind === "Relationship"` **or** `references.length > 0`. A `ContradictionUnit` row with `involves` references will therefore appear in `queryRelationships` output. SPEC §19 T-22 phrases the assertion as "`list`/`queryRelationships` empty for `Relationship` kind"; the Implementation Decision must make the fixture filter explicitly on `entity_kind: "Relationship"` (e.g. `repository.list({ filter: { entity_kind: "Relationship" } })` → `total === 0`) rather than asserting `queryRelationships` is empty. Non-blocking; no SPEC rewrite needed because the intent ("no `Relationship` entity created") is unambiguous.

---

### 10. Claim.contested_by Audit (SPEC §10)

| Check | Source | Verdict |
|-------|--------|---------|
| `contested_by` settable via Standing transition | `StandingTransitionInput.contested_by` (claim `transition-service.ts` line 32); merged at lines 149–151 | **PASS** |
| `contested` requires ≥1 `contested_by` | `ClaimValidator` lines 175–179 (`F7`) | **PASS** |
| Precedent `REF-OPS-039` | lines 1061–1074: `to: "contested"`, `contested_by: ["contradiction:ref-ops-039"]` — id never persisted | **PASS** — SPEC's dangling-edge claim is accurate |
| Claim Standing semantics unchanged by SPEC-023 | no Claim Core change proposed (§22) | **PASS** |
| Contradiction identity becomes persistable | `registerContradictionUnit` | **PASS** |
| No reverse sync | Core `Contradiction` never touches Claim; SCI-004 §8.3(3); SPEC §10 SHALL NOT | **PASS** |
| No new graph | two independent edge sets on two unit kinds (SSR-5 pattern) | **PASS** |
| Coexistence fixture (T-13) | any order works because neither side dereferences | **PASS** |

---

### 11. Model C Audit (SPEC §2, §8)

| Element | Certified contract | SPEC-023 | Source | Verdict |
|---------|--------------------|----------|--------|---------|
| Revision key | `persist:CanonicalUnit:{unit_kind}:{identity}:{revision_id}` | same | `makeCanonicalUnitRevisionStorageKey` | **PASS** |
| Head key | `persist:RevisionHead:{unit_kind}:{identity}` | same | `makeRevisionHeadStorageKey` | **PASS** |
| Initial | `rev:initial` | same | `INITIAL_REVISION_ID` | **PASS** |
| Later ids | caller `rev:[A-Za-z0-9._~-]{1,128}` | same | `REVISION_ID`, `assertRevisionId` → `INVALID_ID` | **PASS** |
| Predecessor | required on non-initial | same | `entityFromCanonicalUnit` lines 218–240 | **PASS** |
| CAS | `advanceHead` → `replace` + `expected_version` | same | store lines 615–649 | **PASS** |
| Stale head | `CONFLICT` | same | line 636 | **PASS** |
| Immutable history | `IMMUTABLE_KINDS` | same | `entity.ts` line 403 | **PASS** |
| Alternative revision model | none | none | — | **PASS** |
| Dual-read legacy key | inherited generic | OQ-023-013 closed as inherited | `resolveKey` in store | **PASS** |

---

### 12. ENC / SER Audit (SPEC §11)

| Check | Source | SPEC-023 | Verdict |
|-------|--------|----------|---------|
| `buildContradiction` unchanged | lines 284–335 | "Unchanged" | **PASS** |
| Content omits `ai_assisted` / `human_sponsor` | content block lines 319–331 (Claim/Evidence blocks include them at 177–178 / 256–257) | stated as FACT; **deferred** via OQ-023-002 | **PASS** |
| ENC change required for Sprint 023? | every legal edge is Human-gated by `leavesOpen` independent of `ai_assisted`; `F_AI` was enforced at creation and content is immutable | SPEC §11 gate analysis matches source | **NOT REQUIRED** — no blocker |
| SPEC silently changes SCI encoding / `REF-CANON`? | `REF-CANON` fixtures assemble Contradiction (canonical.ts lines 56–59) | §11, §22 forbid; OQ-023-002 routes to separate ENC/SCI discovery | **PASS** |
| Second canonical representation | decode helper returns Core-shaped object; re-assemble via same builder | none | **PASS** |
| SER | `ContradictionUnit` present in `serialization/src/registry.ts`, `json/{profile,validator,encoder,decoder}.ts` | "unchanged; existing `JsonEncoder.encode(entity.payload)`" | **PASS** |
| Decode lossiness precedent | SPEC-021 §9.4 | cited correctly | **PASS** |

---

### 13. Persistence Audit (SPEC §12)

| Introduced? | SPEC-023 | Verdict |
|-------------|----------|---------|
| Database / durable workspace / second journal / event sourcing / CQRS / graph DB / scientific Relationship store / distributed infra | none | **PASS** |
| Mechanisms used | `create`, `get`, `getHead`, `ensureInitialHead`, `advanceHead`, `listRevisions`, `appendEvent`, `getEvents`, `snapshot` — all present in `PersistenceRepository` | **PASS** |
| Infrastructure-only | no scientific rule added to Persistence | **PASS** |

---

### 14. Snapshots / Export / Timeline Audit (SPEC §14, §15)

| Check | Source | Verdict |
|-------|--------|---------|
| `ResearchSnapshot` frozen `{ research_session_id, member_refs, persistence_snapshot }` | `timeline.ts` lines 25–29 | **PASS** — no field added |
| `WorkspaceSnapshot` additive `{ …, bound_session_ids, persistence_snapshot }` | lines 35–40 | **PASS** |
| Contradiction representable without redesign | rows + head + journal inside `persistence_snapshot` (generic `PersistenceSnapshot`) | **PASS** |
| Export via existing SER | `exportContradictionUnit*` = `jsonEncoder.encode(entity.payload)` — same as Claim/Evidence (lines 651–679) | **PASS** |
| Timeline operational | `projectTimeline` over `getEvents` for member identities — unchanged | **PASS** |
| Snapshot redesign required | **NO** | **NOT APPLICABLE** |

---

### 15. Membership Audit (SPEC §13)

| Check | Source | Verdict |
|-------|--------|---------|
| `SessionMemberRef { entity_kind, unit_kind?, identity }` supports `ContradictionUnit` without type change | `session/types.ts` | **PASS** |
| Register/transition do not touch membership | mirrors Claim/Evidence methods | **PASS** |
| Distinct from `involved_claims`, `evidence_refs`, `Claim.contested_by`, lineage, provenance | §13 explicit | **PASS** |

---

### 16. Events Audit (SPEC §16)

| Check | SPEC-023 | Precedent (source) | Verdict |
|-------|----------|--------------------|---------|
| Type | `ops.contradiction_record_state_revision` | `ops.claim_standing_revision`, `ops.evidence_record_state_revision`, `ops.evidence_grade_assignment_revision` | **PASS** — consistent naming |
| Event id | `ops:{transition.event_id}` else `ops:contradiction_record_state:{identity}:{revision_id}` | identical scheme lines 310–313 / 381–384 / 450–453 | **PASS** — deterministic both branches |
| Payload | `{ revision_id, predecessor_revision_id, unit_kind, to_record_state }` | same shape as 021 (`to_record_state`) | **PASS** |
| Optional, default off, after head success | yes | yes | **PASS** |
| Create-once emits none | yes | `registerClaimUnit`/`registerEvidenceUnit` emit none | **PASS** |
| Scientific meaning | none; CRTE is scientific history | SPEC-020 §12 rule restated | **PASS** |
| Second journal | none | `appendEvent` sole journal | **PASS** |

---

### 17. Error Semantics Audit (SPEC §17)

| Category | SPEC-023 | Source | Verdict |
|----------|----------|--------|---------|
| Core `F*` | `F1 F2 F3 F4 F5 F6 F7 F8 F9 F_AI F_TRANSITION` | `ContradictionFailureCode` | **PASS** |
| ENC | `CanonicalEncodingError` propagate | `BROKEN_REFERENCE`, `FOREIGN_EMBEDDED_OBJECT`, pin errors | **PASS** |
| Persistence | `INVALID_ID`, `NOT_FOUND`, `ALREADY_EXISTS`, `CONFLICT`, `IMMUTABLE_ENTITY` | `PERSISTENCE_ERROR_CODES` | **PASS** |
| OPS | `INVALID_COMMAND_STATE` only | `OpsErrorCode` union unchanged | **PASS** |
| New categories | none; explicitly no "invalid reference" OPS error | — | **PASS** |
| Ordering guarantee | Core/ENC before `create` | chain order | **PASS** |
| `IMMUTABLE_ENTITY` reachability | listed as existing semantics; no Sprint 023 path invokes `replace` on a row | harmless documentation | **NOT APPLICABLE** to fixture design |

---

### 18. Determinism Audit (SPEC §18)

| Check | Verdict |
|-------|---------|
| All identities / CRTE fields caller-supplied on OPS paths | **PASS** |
| `transition.event_id` REQUIRED on certified paths | **PASS** (SPEC §18 mandate) |
| Inherited `ContradictionEventBuilder` `randomUUID` fallback | present (`event-builder.ts` line 52) — outside deterministic path; SPEC documents, does not change Core | **PASS** — see O-023-04 |
| `Date.now` / `Math.random` in OPS path | none proposed; none in existing OPS | **PASS** |
| Operational event id deterministic | both branches deterministic | **PASS** |
| `listRevisions` ordering | sorted by `revision_id` (store) | **PASS** |

---

### 19. Reference Test Design Audit (SPEC §19)

| Property | Verdict |
|----------|---------|
| Additive from `REF-OPS-077` | **PASS** (next free id verified) |
| Deterministic | **PASS** (all ids caller-supplied) |
| Assertion-based | **PASS** (`check.*` pattern; `expectation.failure_code` for invalid scenarios) |
| Scoped to Contradiction OPS | **PASS** |
| Compatible with OPS profile | **PASS** (`REF-OPS-` prefix; `OPS-001` (+`SCI-004`/`ENC-001` where asserted) mirrors `REF-OPS-004`/`062` authority style) |

Risk-surface coverage (prompt §18 list → SPEC themes): createOpen T-01 · canonicalization T-02 · persistence T-01/T-20 · revision identity T-05/T-15 · lineage T-17 · head init T-01 · CAS T-11 · transitions T-06/T-07/T-10 · Human gates T-08 · `decision_ref` T-06 (and Core gate) · `resolution_note` T-09 · reference representation T-01/T-18 · `Claim.contested_by` coexistence T-13 · membership T-19 · snapshots T-20 · export T-02/T-16 · events T-21 · invalid revision identity T-15 · duplicate revision T-04/T-12 · stale head T-11 · Core validation T-03 · non-use of `Persistence.Relationship` T-22 · regression T-23.

**Coverage:** **COMPLETE** against the required list. See O-023-01 (T-22 assertion precision) and O-023-02 (decode guard vs Core codes).

---

### 20. CONF / CERT Audit (SPEC §20)

| Check | Source | Verdict |
|-------|--------|---------|
| Stays under `CONF-001@1.1.0-OPS` | `REQUIRED_FIXTURE_PREFIXES_OPS` includes `REF-OPS-`; `REQUIRED_AUTHORITIES_OPS` includes `OPS-001`; `SCI-004` already in `REQUIRED_AUTHORITIES` | **PASS** |
| New profile / authority | not required | **PASS** |
| ONE ConformanceEngine / ONE CertificationEngine | `packages/conformance/src/engine.ts`, `packages/certification/src/engine.ts` — single each; SPEC forbids changes | **PASS** |
| `CERTIFICATION_SCOPE_OPS` unchanged | includes `SCI-004`, `OPS-001` | **PASS** |
| New certification architecture | none | **PASS** |

---

### 21. Provenance Audit (SPEC §21)

| Concept | SPEC-023 placement | Verified | Verdict |
|---------|--------------------|----------|---------|
| Scientific provenance | `Contradiction.provenance` + CRTE in ENC content/events | `builder.ts` content includes `provenance`; events = CRTE | **PASS** |
| Operational audit | optional `ops.*` journal + timeline | `appendEvent` / `projectTimeline` | **PASS** |
| Source locator | none on Contradiction; via Evidence | `Contradiction` type has no locator field | **PASS** |
| Persistence history | rows + journal | generic | **PASS** |
| Revision lineage | `predecessor_revision_id` / head ≠ `resolved_by_supersession` | SPEC §21 explicitly separates | **PASS** |
| Second provenance system | none | — | **PASS** |

---

### 22. Open Questions Audit (SPEC §23)

| OQ | SPEC status | Audit assessment | Affects Sprint 023 EXEC? | Separate architecture decision? | Classification |
|----|-------------|------------------|--------------------------|--------------------------------|----------------|
| OQ-023-001 dereference | CLOSED — grammar-only | Correct: Core/ENC grammar-only; no certified path dereferences; inventing a rule would be a Persistence-level scientific constraint | Yes (as closed decision) | No | **OBSERVATION** (closed correctly) |
| OQ-023-002 ENC AI markers | DEFERRED | Correct: not required for Sprint 023 (all edges Human-gated by `leavesOpen`); would alter SCI-frozen `REF-CANON` content; must not be solved here | No (decode lossy per SPEC-021 §9.4) | **Yes** — ENC/SCI discovery | **DEFERRED** |
| OQ-023-003 slice | CLOSED — create + transition | Core transition exists; both patterns certified | Yes | No | **OBSERVATION** (closed correctly) |
| OQ-023-004 event naming | CLOSED | Consistent with three precedents | Yes | No | **OBSERVATION** (closed correctly) |
| OQ-023-005 Claim `qualified_by`/`verified_via` | DEFERRED | Verified: only `supported_by`/`contested_by` in `StandingTransitionInput`; `ClaimVersionService` cannot add relationships. Irrelevant to Contradiction (`contested_by` is settable) | No | **Yes** — SCI-001 / Core authority | **DEFERRED** |
| OQ-023-008 `Persistence.Relationship` | CLOSED — forbidden | Correct | Yes | No | **OBSERVATION** (closed correctly) |
| OQ-023-009 coexistence fixture | CLOSED — T-13 | Correct, no sync | Yes | No | **OBSERVATION** (closed correctly) |
| OQ-023-010 generic engine | CLOSED — rejected | Consistent with RR-002-05 / SPEC-022 | Yes | No | **OBSERVATION** (closed correctly) |
| OQ-023-011 material content OPS | CLOSED — non-goal | `ContradictionVersionService.applyMaterialUpdate` exists in Core; exposing it would widen scope and needs `F8`/version contract; Claim/Evidence material OPS equally deferred (SPEC-021 §32) | No | Yes — future material-content OPS sprint across units | **DEFERRED** |
| OQ-023-012 pre-persist transition option | CLOSED — not offered | Core has no issuance edge; consistent | Yes | No | **OBSERVATION** (closed correctly) |
| OQ-023-013 legacy dual-read | CLOSED — inherited | `resolveKey` generic | No | No | **NOT APPLICABLE** |

No OQ was silently resolved; each closed OQ cites repository evidence. **No OQ blocks the Implementation Decision.**

---

### 23. Scope Audit (SPEC §22)

| IN scope items required by prompt | Present in SPEC §22 | Verdict |
|-----------------------------------|---------------------|---------|
| Contradiction OPS · create · existing Core transitions · Model C · RevisionHead · CAS · canonicalization · Persistence · membership · snapshots/export · operational events · Reference Tests · existing CONF/CERT | all listed | **PASS** |

| OUT of scope items required by prompt | Present in SPEC §22 | Verdict |
|---------------------------------------|---------------------|---------|
| NR OPS · Verification OPS · Grade changes · Evidence changes · Claim Standing redesign · generic lifecycle · second relationship graph · `Persistence.Relationship` scientific storage · provenance subsystem · DocumentArtifact · literature · search · graph DB · database · AI · frontend · API · multi-user · durable workspace · distributed infra · unrelated ENC redesign | all listed (plus material content OPS, pre-persist option, dereference rules, Processor/Core changes) | **PASS** |

Scope creep detected: **NONE**.

---

### 24. Architecture Compatibility

| Boundary | Compatibility | Evidence |
|----------|---------------|----------|
| Scientific Core authority | **COMPATIBLE** | Core-first chain; no Core change |
| Persistence boundary | **COMPATIBLE** | existing primitives only |
| Model C | **COMPATIBLE** | exact contract reuse |
| ENC | **COMPATIBLE** | unchanged; lossiness deferred |
| SER | **COMPATIBLE** | unchanged |
| Reference Tests | **COMPATIBLE** | additive `REF-OPS-077+` |
| Conformance | **COMPATIBLE** | profile unchanged |
| Certification | **COMPATIBLE** | scope unchanged |
| ResearchSession | **COMPATIBLE** | member ref generic |
| ResearchWorkspace | **COMPATIBLE** | same |
| ResearchSnapshot | **COMPATIBLE** | frozen shape held |
| WorkspaceSnapshot | **COMPATIBLE** | additive shape held |

### Regression safety

| Surface | Risk | Assessment |
|---------|------|------------|
| `ResearchOperationsDeps` gains two required fields | TS callers constructing `ResearchOperations` directly | only `createResearchOperations` (TS) and `scripts/smoke-016-reference-app.mjs` (JS, partial deps, never calls Contradiction methods) — same situation as `evidenceGrades` in Sprint 022 | **SAFE** — O-023-05 |
| `referenceAppMarker.sprint: 22 → 23` | smoke/test assertions | all use `>= N` / `< N` guards (smoke-016/019/020/021/022, test-019) | **SAFE** |
| Existing `REF-OPS-001…076` | must be unchanged | SPEC forbids edits/renumbering | **SAFE** |
| SCI 44/44 | must be unchanged | no SCI/ENC edits | **SAFE** |
| `SMOKE_019/020/021/022_PASS` markers | must not be overwritten | SPEC §20 states untouched | **SAFE** |

---

### 25. Audit Matrix

| Requirement | Source evidence (SPEC-023) | Actual repository evidence | Status | Classification |
|-------------|----------------------------|----------------------------|--------|----------------|
| Scientific authority | §4, §5 | `core/src/contradiction/*` sole authority; OPS chain Core-first | PASS | NOT APPLICABLE (no finding) |
| Creation path | §7 | `createOpen` → `assemble` → `entityFromCanonicalUnit` → `create` → `ensureInitialHead` all exist | PASS | NOT APPLICABLE |
| Transition path | §8 | `transition` → `assemble` → `create` → `advanceHead` all exist; guards mirror 020–022 | PASS | NOT APPLICABLE |
| Model C | §2, §8 | keys, `rev:initial`, `REVISION_ID`, predecessor rules verified | PASS | NOT APPLICABLE |
| Identity | §8.3 | `contradiction_id` stable; `contradiction_version` unchanged by transition; `revision_id` separate | PASS | NOT APPLICABLE |
| Lineage | §8.3, §15 | `predecessor_revision_id`; `listRevisions` sorted | PASS | DEFERRED (inherited O-020-01 predecessor existence check) |
| RevisionHead | §7, §8 | `ensureInitialHead` idempotent/`CONFLICT`; `getHead` | PASS | NOT APPLICABLE |
| CAS | §8.5 | `advanceHead` → `replace` + `expected_version`; `CONFLICT` | PASS | NOT APPLICABLE |
| Record State | §5.4 | `ALLOWED` identical; no vocabulary added | PASS | NOT APPLICABLE |
| Human gates | §5.4 | `F6` via `leavesOpen`; `decision_ref` `F_TRANSITION`; `resolution_note` `F7`; `F8` | PASS | NOT APPLICABLE |
| References | §9.1, §9.3 | `involves`/`cites_evidence` roles; grammar-only Core+ENC; no dereference anywhere | PASS | NOT APPLICABLE |
| Claim.contested_by | §10 | `StandingTransitionInput.contested_by`; `F7`; `REF-OPS-039` | PASS | NOT APPLICABLE |
| Relationship boundary | §9.2, T-22 | `Relationship` kind dormant; `queryRelationships` also returns rows with mirrored refs | PASS | **OBSERVATION O-023-01** (fixture filter precision) |
| ENC | §11 | `buildContradiction` unchanged; AI markers absent in content | PASS | DEFERRED (OQ-023-002) |
| SER | §11, §15 | `ContradictionUnit` registered; `JsonEncoder.encode(payload)` | PASS | NOT APPLICABLE |
| Persistence | §12 | infrastructure-only; existing primitives | PASS | NOT APPLICABLE |
| Membership | §13 | generic member ref; explicit registration | PASS | NOT APPLICABLE |
| Snapshots | §14 | frozen/additive shapes unchanged | PASS | NOT APPLICABLE |
| Export | §15 | existing SER path | PASS | NOT APPLICABLE |
| Events | §16 | deterministic id scheme; optional; sole journal | PASS | NOT APPLICABLE |
| Errors | §17 | existing codes only | PASS | NOT APPLICABLE |
| Determinism | §18 | caller-supplied; Core `randomUUID` fallback outside path | PASS | **OBSERVATION O-023-04** (inherited) |
| Reference Tests | §19 | additive from 077; full risk surface | PASS | **OBSERVATION O-023-02** (decode guard vs Core codes) |
| CONF | §20 | profile/prefix/authority already sufficient | PASS | NOT APPLICABLE |
| CERT | §20 | scope unchanged; single engines | PASS | NOT APPLICABLE |
| Provenance | §21 | five concepts separated | PASS | NOT APPLICABLE |
| Scope | §22 | matches prompt IN/OUT lists | PASS | NOT APPLICABLE |
| Regression safety | §6.1, §20 | deps additive; marker `>=` guards; corpora untouched | PASS | **OBSERVATION O-023-05** |
| Decode mirror precision | §9.1 | `PersistenceEntity.references` mirror is generic, non-authoritative | PASS | **OBSERVATION O-023-03** |

---

### 26. Findings

#### Blockers — **0**

No second authority, graph, or journal; Model C intact; Core transitions reused exactly; identity and determinism defined; no unauthorized ENC/SCI change; no undefined migration; `Persistence.Relationship` not required for correctness.

#### Required patches — **0**

No SPEC statement contradicts source. All named APIs exist or are explicitly marked new and mirror certified ones.

#### Observations — **5** (Implementation Decision discipline; no SPEC rewrite required)

| ID | Observation | Direction for IMPLEMENTATION-DECISION-023 |
|----|-------------|-------------------------------------------|
| **O-023-01** | `queryRelationships` returns `CanonicalUnit` rows that carry mirrored envelope references, so a `ContradictionUnit` row will appear in its output; T-22's parenthetical could be misread as "queryRelationships is empty". | Fixture SHALL assert `list({ filter: { entity_kind: "Relationship" } }).total === 0` (and optionally that any `queryRelationships` hit has `entity_kind === "CanonicalUnit"`). |
| **O-023-02** | SPEC §8.4 adds a defensive decode guard for `< 2` reconstructed `involved_claims` (`OpsError`). For intact units this is unreachable (Core enforced `F2` at creation). | Keep decode guards strictly structural; fixtures asserting reference validity SHALL exercise the create path so Core `F2`/`F3`/`F4` codes remain the observed authority (T-03 already does). |
| **O-023-03** | `entityFromCanonicalUnit.mapReferences` mirrors envelope references into `PersistenceEntity.references` (generic since Sprint 015). SPEC §9.1 correctly names this non-authoritative. | Fixtures asserting `involved_claims` / `evidence_refs` SHALL read the ENC payload (`unit.envelope.references` / decoded object), not `entity.references`. |
| **O-023-04** | Inherited `ContradictionEventBuilder` `randomUUID` fallback when `event_id` omitted (Core; unchanged). | Every Sprint 023 fixture and smoke path SHALL supply `crte:` `event_id`; ID SHALL restate RR-002-02 / OBS-022-001 for CRTE. |
| **O-023-05** | `ResearchOperationsDeps` gains two required fields; `referenceAppMarker.sprint` → 23. | Verified safe: only `createResearchOperations` (TS) constructs with full deps; `smoke-016` (JS) passes partial deps and never calls Contradiction methods; all marker checks use `>=`/`<`. ID SHALL list these as the only non-Contradiction source touches. |

#### Deferred — **3**

| ID | Item | Routing |
|----|------|---------|
| D-023-01 | OQ-023-002 — ENC content omits `ai_assisted`/`human_sponsor` for Contradiction/NR/Verification units | Separate ENC/SCI discovery (ENC minor version + `REF-CANON` impact); not Sprint 023 |
| D-023-02 | OQ-023-005 — Claim `qualified_by`/`verified_via` creation-only in Core | NR/Verification discovery; SCI-001 authority |
| D-023-03 | OQ-023-011 — Contradiction (and Claim/Evidence) material content OPS via `*VersionService` | Future material-content OPS sprint |
| (inherited) | O-020-01 predecessor existence check at `create` | unchanged; tracked since Sprint 020 |

#### Not applicable

Snapshot redesign; new CONF profile; new CERT scope; migration; `IMMUTABLE_ENTITY` reachability on Sprint 023 paths; legacy dual-read specifics.

---

### 27. Implementation Readiness

| Gate | State |
|------|-------|
| Architecture coherence | **PASS** |
| Discovery consistency | **PASS** (DISCOVERY-023 READY → SPEC-023 closes OQ-001/003/004/008/009/010/012/013 with source evidence; defers 002/005/011) |
| Core authority / exact transition reuse | **PASS** |
| Model C / Persistence / ENC / SER | **PASS** |
| Relationship boundary | **PASS** (with O-023-01 fixture precision) |
| REF / CONF / CERT | **PASS** |
| Precision for Implementation Decision | **Sufficient** |
| EXEC authorization | **NO** (not this audit's role) |

**Implementation readiness:** **READY FOR IMPLEMENTATION DECISION**

**Next authorized action:** IMPLEMENTATION-DECISION-023 (design-only), then FINAL-ARCHITECTURE-RE-AUDIT-023, then EXEC-023 only if separately authorized.

---

### 28. Final Verdict

SPEC-023 is architecturally coherent with the certified AIP/SciROS stack. It reuses `ContradictionFactory.createOpen` and `ContradictionTransitionService.transition` exactly, keeps Core as sole Contradiction authority, applies the certified Model C contract to `unit_kind = "ContradictionUnit"` without any new primitive, represents `involved_claims`/`evidence_refs` solely through the existing `ContradictionUnit` envelope, forbids `Persistence.Relationship` as scientific storage, leaves Claim Standing untouched while making the identity cited by `Claim.contested_by` persistable, defers the ENC AI-marker question to a separate authorized path, and remains under `CONF-001@1.1.0-OPS` with single Conformance and Certification engines. The proposed `registerContradictionUnit` / `transitionContradictionRecordState` pair is a faithful fourth instance of the certified per-unit Model C orchestration pattern, not a generic engine.

---

ARCHITECTURE-AUDIT-023 FINAL VERDICT
====================================

SPEC-023:
APPROVED WITH OBSERVATIONS

Contradiction authority:
Scientific Core (SCI-004 / `ContradictionFactory.createOpen` + `ContradictionTransitionService.transition`) remains sole semantic authority; OPS orchestrates only.

Record State vocabulary:
UNCHANGED (`open`, `resolved_by_supersession`, `resolved_by_scope_split`, `resolved_by_retraction`, `unresolved_archived`); Human gate `F6`, `decision_ref`, `resolution_note` `F7` preserved.

References:
`involved_claims` / `evidence_refs` carried only in the `ContradictionUnit` envelope (`involves` / `cites_evidence`); grammar-only; not dereferenced; `Persistence.Relationship` NOT used as scientific storage.

Claim.contested_by:
COMPATIBLE — Claim Standing unchanged; Contradiction identity becomes persistable; no reverse synchronization; no second graph.

Model C:
COMPATIBLE — exact reuse.

Persistence:
UNCHANGED

ENC:
UNCHANGED — AI-marker omission correctly DEFERRED (OQ-023-002)

SER:
UNCHANGED

Determinism:
PASS

Events:
PASS

Snapshots:
PASS

Conformance:
UNCHANGED

Certification:
UNCHANGED

Generic lifecycle abstraction:
NOT JUSTIFIED

Scientific authority violations:
NONE

Second scientific graph:
NONE

Second event journal:
NONE

Blockers:
0

Required patches:
0

Observations:
5

Deferred:
3 (+1 inherited)

Implementation readiness:
READY FOR IMPLEMENTATION DECISION

Next authorized action:
IMPLEMENTATION DECISION

Implementation authorization:
NO

*End ARCHITECTURE-AUDIT-023 — read-only. No implementation. No SPEC patch. No commit. No push.*

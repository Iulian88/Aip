# ADR-020 — Post-Persist Revision Model

| Field | Value |
|-------|--------|
| **ADR ID** | ADR-020 |
| **Title** | Post-Persist Revision Model Selection |
| **Version** | **0.1.0-DRAFT** |
| **Status** | **DRAFT — ARCHITECTURE DECISION** |
| **Date** | 2026-09-19 |
| **Baseline** | `dbbc8c67b8c80feada2c6b29389b2a284a619e87` (Sprint 019 certified) |
| **Related** | SPEC-020 v0.1.0-DRAFT; ARCHITECTURE-AUDIT-020; EXEC-020 BLOCKED; SCI-001…006; ENC-001; Persistence Foundation; SPEC-016A/017/018/019 |
| **Mode** | Architecture decision only — **NO IMPLEMENTATION** |
| **Does not authorize** | Immediate EXEC without SPEC-020 normative patch + re-audit of that patch |

---

## 1. Context

SPEC-020 framed the problem of scientific evolution after `Persistence.create` of a CanonicalUnit. ARCHITECTURE-AUDIT-020 approved that framing with observations. EXEC-020 **stopped** because SPEC-020 analyzed Models A–D without selecting one, and open questions required for any Persistence write path remained unresolved (especially OQ-020-001/005/013/014).

This ADR selects the post-persist revision architecture so SPEC-020 can be patched to make one model normative and a future EXEC can proceed without inventing a strategy at implementation time.

---

## 2. Problem Statement

After a CanonicalUnit exists in Persistence:

- Scientific Core can still produce a new scientific object state (Standing, Record State, Grade assignment, Contradiction leave-open, NR withdrawal, Verification leave-planned).
- Persistence rejects differing `replace` of CanonicalUnit with `IMMUTABLE_ENTITY`.
- CanonicalUnit `storage_key` is `persist:CanonicalUnit:{unit_kind}:{identity}` and does **not** include `content_version` (ARCHITECTURE-AUDIT-020 / D-020-001).
- OPS Claim/Evidence paths are create-once (Evidence may transition only **before** first persist).

Without an explicit revision architecture, post-persist evolution cannot be recorded without mutating historical bytes, inventing a second graph/journal, or silently choosing a model.

---

## 3. Existing Repository Constraints

| Constraint | Source |
|------------|--------|
| Scientific transitions return new frozen Core objects; Core does not write Persistence | `ClaimTransitionService`, `EvidenceTransitionService`, `EvidenceGradeService`, Contradiction/NR/Verification transition services |
| Standing / Evidence Record transitions **preserve** Core SemVer (`claim_version` / `evidence_version`) | Claim/Evidence transition services |
| Grade assignment **bumps** `evidence_version` and returns new Evidence | `EvidenceGradeService.assign` |
| ENC `envelope.identity` = scientific id; `content_version` = Core SemVer at assemble | `packages/encoding/src/builder.ts` |
| CanonicalUnit storage_key omits `content_version` | `entityFromCanonicalUnit` → `makeStorageKey("CanonicalUnit", identity, unit_kind)` |
| Differing replace of CanonicalUnit → `IMMUTABLE_ENTITY` | `InMemoryRepository.replace` + `IMMUTABLE_KINDS` |
| `expected_version` → `CONFLICT` only; not scientific mutation authorization | Persistence `replace` options |
| One Persistence event journal | `appendEvent` / `getEvents` |
| OPS membership = `entity_kind` + optional `unit_kind` + `identity` (no revision field) | `SessionMemberRef` |
| ResearchSnapshot frozen; WorkspaceSnapshot additive | Sprint 016 / 018 |
| `bears_on` ≠ `supported_by` (SSR-5); membership ≠ scientific edges | SPEC-019 / SCI-001 |

---

## 4. Verified Storage Contract

```
storage_key = persist:CanonicalUnit:{unit_kind}:{identity}
```

- `content_version` is **not** part of the key.
- Same `(unit_kind, identity)` → one slot.
- Second `create` → `ALREADY_EXISTS`.
- EvidenceUnit and GradeDesignationUnit may share scientific `evidence_id` because `unit_kind` discriminates.

This ADR does **not** reinterpret D-020-001. Any selected model that needs multiple immutable rows for one scientific identity **requires an explicit Persistence addressing extension** (stated as an implementation precondition, not as silent reinterpretation of today’s key).

---

## 5. Architectural Requirements

| ID | Requirement |
|----|-------------|
| R1 | Scientific Core remains the only scientific authority |
| R2 | Persistence remains infrastructure, not scientific authority |
| R3 | Existing scientific entities remain reproducible |
| R4 | Scientific history remains auditable |
| R5 | No destructive loss of prior scientific state |
| R6 | Deterministic identity and serialization |
| R7 | No second scientific relationship graph |
| R8 | No second event journal |
| R9 | Existing certified contracts preserved unless explicitly superseded |
| R10 | Revision semantics are explicit |
| R11 | Lineage semantics are explicit |
| R12 | Snapshot semantics are deterministic |
| R13 | Concurrency semantics are honest |
| R14 | Migration possible without silently rewriting scientific history |
| R15 | REF → CONF → CERT remains structurally compatible |
| R16 | Implementable without premature DB/API/UI/cloud infrastructure |

---

## 6. Model A Analysis

**Definition (SPEC-020):** Stable scientific identity + `content_version` rows.

| Topic | Finding |
|-------|---------|
| Current storage_key | **Does not permit** multiple rows (D-020-001) |
| Addressing change | **Required** to include a version/revision discriminator |
| Coexistence under same scientific identity | Only after addressing change |
| Lineage | Implicit SemVer order is insufficient: Standing/Record transitions **preserve** SemVer (ARCHITECTURE-AUDIT OBS-020-002) |
| Head | Not defined by Model A alone; “latest content_version” fails when SemVer does not advance |
| Snapshots | Ambiguous without head or explicit revision pin |
| Concurrency | Version CAS possible only after multi-row addressing exists |
| Migration | Re-key existing sole units as first row |
| Events | Operational citations only |
| Determinism | Requires explicit revision selection rules |
| Compatibility | **Incompatible as stated** with current Core SemVer semantics for Standing/Record evolution, even if storage_key is extended to include `content_version` alone |

**Hard-requirement failures:** R10 (revision ≠ SemVer under current Core); R12 without additional head/convention; requires Persistence supersession (R9) **and** still fails Standing transitions that keep SemVer.

Model A is **not** selected.

---

## 7. Model B Analysis

**Definition (SPEC-020):** New CanonicalUnit identity per revision + explicit lineage.

| Topic | Finding |
|-------|---------|
| Storage | Compatible with create-once / current immutability (new identity → new `storage_key`) |
| Identity | Forces `CanonicalUnit.identity` ≠ scientific id — breaks certified ENC equality assumption |
| Relationships | Scientific edges remain in Core content; revision lineage must not become `bears_on`/`supported_by` |
| Lineage risk | If stored only as OPS fields → OPS-only graph (forbidden as scientific authority). If stored as Core scientific relationships → second semantic axis / graph pollution (R7). Must be **representation lineage metadata**, not scientific edges |
| Current resolution | OPS `getClaimUnit(scientific_id)` / membership-by-identity **cannot** resolve “current” without an index → Model B alone is **incomplete** for certified OPS lookup patterns |
| Snapshots | Membership points at identity; without revision or head, historical pin is undefined |
| Migration | High: dual identity mapping for every unit |
| Determinism | Requires caller-supplied revision identities |

**Hard-requirement failures:** Incomplete under R12 and existing OPS identity lookup without adding head (which is Model C). Pure B also maximizes identity-split cost (R9 ENC/OPS assumptions).

Model B is **not** selected as a standalone architecture.

---

## 8. Model C Analysis

**Definition (SPEC-020):** Stable scientific identity + immutable revision rows + explicit head pointer.

| Topic | Finding |
|-------|---------|
| Physical addressing | Requires Persistence extension so multiple immutable rows can exist per scientific identity (revision discriminator in `storage_key` **or** equivalent revision-scoped key). This is an **explicit contract supersession**, not silent reinterpretation |
| Stable identity | Remains Core scientific id (`claim_id`, `evidence_id`, …) and remains the primary lookup handle for OPS |
| Head | Operational index: `(unit_kind, scientific_identity) → revision_id`. **Not** scientific standing/record/grade truth |
| Head ownership | **Persistence infrastructure** (durable index with optimistic concurrency). OPS may read/advance head only by orchestrating Persistence APIs after Core+ENC succeed |
| Second truth risk | Mitigated by rule: scientific meaning is **only** the Core object inside the referenced revision’s CanonicalUnit payload; head is a pointer |
| Immutability | Prior revision rows never differing-replaced; aligns with R5 |
| SemVer | `content_version` may stay equal across Standing/Record revisions; revision_id carries representation identity (R10) |
| Snapshots | Frozen schemas unchanged; resolution uses head at snapshot time **or** future additive revision pin (not schema break now) |
| Concurrency | Head compare-and-swap via expected head revision / Persistence CONFLICT — honest for memory adapter |
| Migration | Existing create-once units become sole revision + head; payloads untouched |
| Certification | Additive REF-OPS for revision/head/conflict; profiles preferably unchanged |

**Hard-requirement fit:** Satisfies R1–R8, R10–R16 with explicit Persistence supersession for addressing + mutable head index (R9: **explicitly superseded** Persistence addressing / head primitives only). Does not move scientific authority.

Model C is **selected** (precise binding in §§12–23).

---

## 9. Model D Analysis

**Definition (SPEC-020):** Audited differing `replace` + mandatory archive of prior bytes.

| Topic | Finding |
|-------|---------|
| Immutability change | Requires removing or carving CanonicalUnit out of today’s `IMMUTABLE_ENTITY` behavior |
| Historical recovery | Depends on archive completeness; prior state leaves the primary slot |
| Replay / “state at T” | Harder than immutable rows; archive bugs destroy history (R5 risk) |
| Provenance | Easy to conflate Persistence replace events with scientific provenance |
| Compatibility | Directly changes certified Persistence immutability semantics (R9 stress) |
| Replace ≠ revisioning | Overwrite + archive is not the same as coexisting immutable revisions |

**Hard-requirement failures:** Material risk to R5; supersedes certified immutability more aggressively than Model C’s additive addressing; reproducibility depends on archive correctness rather than primary-store immutability.

Model D is **not** selected.

---

## 10. Successor Model Analysis

Not required. Models A–D were evaluated against repository contracts. Model C satisfies the hard requirements with explicit, bounded Persistence contract extensions. No Model E is introduced.

---

## 11. Compatibility Matrix

| Requirement | Model A | Model B | Model C | Model D |
|-------------|---------|---------|---------|---------|
| R1 Core authority | compatible | compatible | compatible | compatible |
| R2 Persistence infrastructure | requires explicit change | compatible (create-once) | requires explicit change (addressing + head index) | requires explicit change (immutability carve-out) |
| R3 Reproducibility of existing | compatible with migration convention | compatible with mapping | compatible with sole-revision convention | unresolved unless archive proves bit-identity |
| R4 Auditable history | unresolved if SemVer static | compatible if lineage explicit | compatible | unresolved (archive quality) |
| R5 No destructive loss | compatible **if** multi-row (after key change) | compatible | compatible | incompatible under current contract without perfect archive; high risk |
| R6 Determinism | requires rules | requires revision ids | requires revision ids + head CAS inputs | requires archive ids |
| R7 No second scientific graph | compatible | unresolved if lineage mis-placed | compatible if lineage is representation metadata | compatible if careful |
| R8 One journal | compatible | compatible | compatible | compatible |
| R9 Preserve certified contracts | incompatible under current SemVer+key facts without Core and Persistence changes | requires ENC/OPS identity-split supersession | requires Persistence addressing + head supersession only | requires IMMUTABLE_ENTITY supersession |
| R10 Explicit revision semantics | incompatible under current Core SemVer preservation | compatible | compatible | conflates replace with revision |
| R11 Explicit lineage | unresolved (SemVer order) | compatible | compatible | via archive chain |
| R12 Deterministic snapshots | unresolved without head | incompatible with current membership-by-id alone | compatible (head or pin) | single-slot “current” only |
| R13 Honest concurrency | future dependency | create races | head CAS + CONFLICT | expected_version on replace |
| R14 Migration without rewrite | re-key | dual-id mapping | sole revision + head | empty archive initially |
| R15 REF/CONF/CERT | additive possible | additive possible | additive possible | may need Persistence REF for archive |
| R16 No premature DB/API | compatible | compatible | compatible | compatible |

---

## 12. Identity Decision

| Term | Decision |
|------|----------|
| **Scientific identity** | Stable Core id (`claim_id`, `evidence_id`, `contradiction_id`, …). Does **not** change across post-persist transitions |
| **Canonical identity** | Remains equal to scientific identity on the CanonicalUnit envelope (`envelope.identity`), preserving certified ENC assemble semantics |
| **Revision identity** | Distinct string (`revision_id`), caller-supplied, deterministic; **not** equal to SemVer/`content_version`; **not** a new scientific id |
| **Persistence storage key** | Must address `(entity_kind=CanonicalUnit, unit_kind, scientific_identity, revision_id)` after authorized Persistence extension |
| **Lineage identity** | Edge between revision_ids (predecessor → successor), not a Core scientific relationship type |
| **OPS / Session / Workspace identity** | Unchanged operational ids; membership continues to reference scientific identity (+ `unit_kind`); current revision resolved via head unless a future additive pin is introduced |

**DQ-020-001:** Scientific identity is stable across revisions.  
**DQ-020-004:** Canonical/scientific identity does **not** change between revisions; **revision_id** changes.

---

## 13. Revision Decision

**SELECTED MODEL: Model C** — Stable scientific identity + immutable revision rows + explicit head pointer.

Binding:

1. A post-persist transition is: Core produces next scientific object → ENC assembles CanonicalUnit (same scientific `identity`, SemVer/`content_version` as Core dictates) → Persistence **creates** a new immutable revision row under a new `revision_id` → Persistence advances **head** to that revision (CAS) → optional operational `appendEvent`.
2. Prior revision rows remain byte-immutable; no differing CanonicalUnit `replace` for scientific content.
3. First persisted representation (Sprint 015–019 create-once units) is revision `0` / initial revision by migration convention (exact token fixed at EXEC SPEC patch time).

**DQ-020-002:** Yes — multiple revisions coexist under the same scientific identity after Persistence addressing extension.  
**DQ-020-003:** Persistence key includes scientific identity **and** `revision_id` (plus existing `unit_kind` discriminator). Exact string formula is an implementation precondition for the Persistence contract patch — must remain deterministic and must not omit `unit_kind` (GradeDesignationUnit coexistence).  
**DQ-020-010:** Represented as **new immutable scientific artifact (revision)**, not mutation of the prior persisted artifact.

---

## 14. Lineage Decision

| Concept | Meaning in this ADR |
|---------|---------------------|
| **parent / predecessor** | Prior `revision_id` of the same scientific identity + `unit_kind` |
| **child / successor** | New `revision_id` created by a post-persist orchestration |
| **revision** | One immutable persisted CanonicalUnit representation |
| **derived-from (representation)** | Lineage metadata: successor revision records `predecessor_revision_id` |
| **supersedes (scientific)** | Remains Core Claim Standing / `superseded_by` semantics — **not** Persistence head movement |
| **replaces** | Forbidden as silent mutation; not used for CanonicalUnit scientific payloads |

**Lineage ownership:** Persistence/canonical **representation metadata** (and/or operational journal citations). **Not** OPS-only. **Not** Core scientific graph edges (`supported_by`, `bears_on`, `involved_claims`, …).

**DQ-020-005:** Lineage = explicit predecessor_revision_id chain among revision rows.

**R7:** Lineage must not be modeled as a second scientific relationship graph.

---

## 15. Head Decision

| Question | Answer |
|----------|--------|
| 1. What is head? | Durable index entry mapping `(unit_kind, scientific_identity) → revision_id` |
| 2. Who owns it? | **Persistence** (infrastructure API). OPS orchestrates advances; Core never writes head |
| 3. Scientific state? | **No** |
| 4. Operational projection? | It is an operational/infrastructure pointer; OPS may project it; it is not scientific provenance |
| 5. Persisted? | **Yes** (required for snapshot/restore honesty) |
| 6. Canonical? | **No** — not a CanonicalUnit scientific payload |
| 7. Two heads? | **No** — at most one head per `(unit_kind, scientific_identity)` |
| 8. Concurrent transitions? | Head CAS: only one advance from expected predecessor revision succeeds; loser → Persistence `CONFLICT` (or equivalent typed conflict) |
| 9. Reconstructible? | **Yes** — from immutable revision rows + lineage (+ operational events). Head is a cache of the unique tip under linear concurrency policy |
| 10. Second scientific truth? | **Forbidden** — validators/tests must treat payload of headed revision as scientific state |

**DQ-020-006:** Yes, head exists.  
**DQ-020-007:** Persistence owns head.

Branching revisions (two children of one parent) are **not** authorized as scientific forks in this ADR. Concurrent attempts from the same head base conflict (linear history).

---

## 16. SemVer / Content Version Decision

| Concept | Meaning |
|---------|---------|
| Scientific SemVer (`claim_version`, `evidence_version`, …) | Core material/content versioning per SCI specs; Standing/Record transitions may preserve it |
| Canonical `content_version` | ENC projection of Core SemVer at assemble time |
| **Revision identity** | Separate from SemVer; identifies a persisted representation |
| Storage addressing version | `revision_id` in storage_key (after extension) — **not** SemVer |
| Optimistic concurrency version | Head expected revision and/or entity `content_version` tokens as Persistence defines — **not** permission to mutate immutable revision rows |

**DQ-020-008:** SemVer/`content_version` is **not** the revision identity. OBS-020-002 is closed by this separation. Core is **not** required to bump SemVer on Standing/Record transitions for Persistence addressing to work.

---

## 17. Immutability Decision

**DQ-020-009:**

- Each revision row is immutable after create (same `IMMUTABLE_ENTITY` spirit for CanonicalUnit revision payloads).
- Differing `replace` of a stored revision payload remains rejected.
- Head index entries are **mutable infrastructure** (replace/CAS allowed for head only), explicitly outside scientific CanonicalUnit immutability.
- Model D audited overwrite of the scientific slot is **rejected**.

---

## 18. Grade Dependency Decision

| Question | Decision |
|----------|----------|
| Can Grade exist independently? | GradeDesignationUnit may be persisted as its own CanonicalUnit `unit_kind` (ENC already supports assemble); still keyed by evidence scientific id + revision |
| Does Grade mutate Evidence? | Core `assign` returns a **new** Evidence object; does not mutate Standing/Record State |
| Revision-bearing? | Post-persist Grade assignment requires a **new EvidenceUnit revision** (and may create a GradeDesignationUnit revision). Pre-persist Grade before first Evidence create remains possible without revision machinery |
| Immutability | Prior Evidence revision unchanged |
| Previously persisted Evidence receive Grade? | Yes — via new revision + head advance; **not** via mutating the old row |

Grade OPS implementation remains out of scope for the first post-persist EXEC unless separately authorized; the revision model must be Grade-compatible as above.

---

## 19. Snapshot Decision

**DQ-020-011:**

- ResearchSnapshot / WorkspaceSnapshot **schemas unchanged** (Sprint 016 frozen; Sprint 018 additive).
- `member_refs.identity` remains scientific identity.
- Point-in-time scientific representation for a member is: **head revision at snapshot capture** as resolved through Persistence (entities in `persistence_snapshot` already freeze stored rows; head index must be included in Persistence snapshot/restore once introduced).
- Explicit historical revision pins in membership are **not** added in this ADR (would be a future additive field SPEC).
- Snapshots remain memory Persistence-backed as today (R16).

---

## 20. Concurrency Decision

**DQ-020-013 / DQ-020-014:**

Scenario: head at R1; two actors attempt R1→R2 and R1→R3.

| Policy | Decision |
|--------|----------|
| Both valid branches? | **No** — linear history only for Sprint 020 architecture |
| Conflict? | **Yes** — second head advance with stale expected head revision fails |
| Distributed locks? | **No** |
| Duplicate identical revision? | If same `revision_id` and identical fingerprint → idempotent success; if same `revision_id` different payload → typed error; if new revision_id from stale head → CONFLICT |

Honest under in-memory Persistence: single-process CAS semantics; no claim of distributed serializability.

---

## 21. Migration Decision

**DQ-020-014 (migration sense):**

Existing Sprint 015–019 CanonicalUnits:

1. Keep payload bytes, scientific identity, events, certificates untouched.
2. Treat each existing row as the **initial revision** for that `(unit_kind, identity)`.
3. Set head → that initial revision.
4. No silent rewrite of scientific history; no mandatory re-encode.

Dual-identity Model B migration is avoided.

---

## 22. REF / CONF / CERT Decision

**DQ-020-016:**

| Layer | Future evidence (not created now) |
|-------|-----------------------------------|
| REF | Additive REF-OPS: post-persist Standing/Record transition; head CAS conflict; idempotent duplicate revision; lineage predecessor; SemVer unchanged across Standing revision; Grade→Evidence revision; snapshot contains prior+new revision rows |
| CONF | Prefer existing `CONF-001@1.1.0-OPS` additive fixtures; profile bump only if prefixes insufficient |
| CERT | Same CertificationEngine; new ConformanceReports; no second engine |
| SCI | Unchanged unless Core semantics change (not required by this ADR) |

---

## 23. Selected Architecture

**SELECTED MODEL: Model C**

**Selected because:**

1. **R5 / immutability:** Prior scientific representations remain primary-store immutable rows; does not weaken CanonicalUnit `IMMUTABLE_ENTITY` for scientific payloads (unlike Model D).
2. **R10 / OBS-020-002:** Separates revision identity from SemVer, matching actual Core Standing/Record behavior that preserves SemVer.
3. **R1 / ENC compatibility:** Keeps `envelope.identity` = scientific identity (unlike standalone Model B identity split).
4. **R12 / OPS lookup:** Head provides deterministic current resolution for scientific-id membership and `get*Unit` patterns without treating head as scientific truth.
5. **R7 / R8:** Lineage is representation metadata; one Persistence journal retained.
6. **R14:** Migration is sole-revision + head, without rewriting certified payloads.
7. **R16:** Expressible on the memory Persistence adapter after an explicit Persistence contract extension (no DB required).

---

## 24. Rejected Alternatives

| Alternative | Rejected because |
|-------------|------------------|
| **Model A** | `content_version`-keyed rows conflict with Core SemVer preservation on Standing/Record transitions; current storage_key forbids multi-row anyway; SemVer≠revision |
| **Model B (standalone)** | Breaks certified identity equality; cannot resolve current scientific-id lookup/snapshots without a head — incomplete, and with a head it collapses into Model C at higher identity cost |
| **Model D** | Weakens certified CanonicalUnit immutability; “state at T” depends on archive strength; replace is not revision coexistence |
| **Model E** | Not required; Model C meets hard requirements |

---

## 25. Consequences

| Area | Consequence |
|------|-------------|
| SPEC-020 | Must be patched to make Model C **normative** and close blocking OQs per §26–27 |
| Persistence | Future EXEC must extend addressing + head index; must not silently change today’s key before that contract lands |
| Core | No scientific vocabulary change required by this ADR |
| ENC | Keep scientific identity on envelope; may carry revision metadata as Persistence/ops concern or envelope extension defined at EXEC SPEC |
| OPS | Future orchestration: load headed revision → Core transition → ENC → create revision → CAS head → appendEvent |
| Snapshots | Schemas frozen; Persistence snapshot must eventually include head index |
| Grade | Post-persist Grade ⇒ new Evidence revision (+ optional GradeDesignationUnit revision) |

---

## 26. Remaining Open Questions

Non-blocking for architecture selection (do **not** change Model C vs A/B/D). Must be fixed in the SPEC-020 normative patch / Persistence contract before EXEC coding:

| ID | Question | Blocks EXEC coding? | Blocks this ADR selection? |
|----|----------|---------------------|----------------------------|
| RQ-020-001 | Exact `storage_key` string formula including `revision_id` | Yes | No |
| RQ-020-002 | Exact initial `revision_id` token for migrated create-once units | Yes | No |
| RQ-020-003 | Whether `predecessor_revision_id` lives on PersistenceEntity, envelope, and/or event payload | Yes | No |
| RQ-020-004 | Head entity_kind / API surface names | Yes | No |
| RQ-020-005 | Which unit transition OPS methods ship in the first EXEC slice (Claim only vs Claim+Evidence, etc.) | Yes (scope) | No |
| RQ-020-006 | Whether GradeDesignationUnit revisions are mandatory when Evidence is graded post-persist | Soft | No |

**No remaining question reopens Model A/B/D selection.** Contradiction Core vocabulary remains `unresolved_archived` / `resolved_by_*` (OBS-020-001) — wording only.

---

## 27. Implementation Preconditions

Before any EXEC that implements post-persist transitions:

1. Patch SPEC-020 (or successor SPEC-020A) so Model C binding in this ADR is **normative**.
2. Architecture re-audit of that normative patch (or accept this ADR + patched SPEC as the decision record per project process).
3. Persistence contract design covering: revision addressing, head CAS, snapshot/restore inclusion of heads, typed conflicts.
4. No CanonicalUnit differing-replace for scientific payloads.
5. No Core Standing/Record SemVer bump mandated solely for storage.
6. No second journal / second scientific graph.
7. ResearchSnapshot / WorkspaceSnapshot field schemas unchanged.
8. Caller-supplied deterministic `revision_id` / timestamps / event ids.
9. Linear head history only (no fork semantics).

**Execution consequence:** This ADR **closes** EXEC-020 blockers B-020-001…005 at the *model-selection* layer. SPEC-020 **can and should** be patched to make Model C normative. Implementation remains **disallowed** until that normative patch (and Persistence contract specifics RQ-020-001…004) exist.

---

## 28. Final Decision

```
SELECTED MODEL: Model C
(Stable scientific identity + immutable revision rows + explicit Persistence-owned head pointer;
 revision_id distinct from SemVer/content_version;
 Canonical envelope.identity remains scientific identity;
 differing CanonicalUnit replace for scientific payloads remains rejected.)
```

**Status:** DRAFT — ARCHITECTURE DECISION  

**Does not certify. Does not implement. Does not commit.**

---

*End of ADR-020 v0.1.0-DRAFT.*

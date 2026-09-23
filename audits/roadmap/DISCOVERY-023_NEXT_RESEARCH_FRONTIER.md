# DISCOVERY-023 — NEXT RESEARCH SEMANTICS FRONTIER

**Type:** Read-only architecture / roadmap discovery for Sprint 023  
**Mode:** No source, test, SPEC, or certification changes · no SPEC-023 · no commit · no push  
**Classification legend:** FACT | DEPENDENCY | OBSERVATION | OPEN QUESTION | DEFERRED | NOT APPLICABLE

Every status below is derived from the repository at the stated commit (source, fixtures, profiles, certification artifacts), not from documentation alone. Where a document and the code differ, the code is reported.

---

## 1. Baseline

| Item | Value |
|------|-------|
| Sprint 022 | FORMALLY CERTIFIED AND CLOSED — Grade OPS (Option A + Model C) |
| Commit | `662d7f7881337809c7973a39b683053ae3c45a87` — `cert(sprint-022): certify Grade OPS` |
| `git rev-parse HEAD` | `662d7f7881337809c7973a39b683053ae3c45a87` |
| `git rev-parse origin/main` | `662d7f7881337809c7973a39b683053ae3c45a87` |
| HEAD == origin/main | YES |
| Working tree at discovery start | CLEAN |
| Certified corpus | SCI **44/44** · OPS **76/76** · FULL **120/120** |
| Profiles | `CONF-001@1.0.0` (SCI) · `CONF-001@1.1.0-OPS` (OPS, evaluated on FULL) |
| Engines | one `ConformanceEngine` (`packages/conformance/src/engine.ts`) · one `CertificationEngine` (`packages/certification/src/engine.ts`) |
| Highest OPS fixture | `REF-OPS-076` → next free additive id `REF-OPS-077` |
| Certified OPS post-persist paths | `transitionClaimStanding` (020) · `transitionEvidenceRecordState` (021) · `assignEvidenceGrade` (022) |
| OPS decode helpers | `claimFromClaimUnitPayload` · `evidenceFromEvidenceUnitPayload` (no others) |

Documents read: ROADMAP-REVIEW-001/002, DISCOVERY-021/022, SPEC-020/021/022, CERTIFICATION-020/021/022, SCI-000/001/004/005/006, ADR-020.  
Source inspected: `packages/core/src/{claim,evidence,grade,contradiction,negative-result,verification}`, `packages/encoding/src/{builder,registry,types,decoder}.ts`, `packages/persistence/src/{types,entity,revision,repository}.ts`, `packages/processor/src/engines/transition-engine.ts`, `packages/serialization/src/**`, `packages/conformance/src/{profiles,types}.ts`, `packages/certification/src/types.ts`, `packages/reference-tests/src/fixtures/*.ts`, `apps/reference-app/src/**`.

Repository modifications by this discovery: **this file only**.

---

## 2. Current Semantic Coverage (Q1)

### 2.1 Unit matrix

Legend — **Core**: scientific semantics in `@sciros/core`. **OPS create**: `ResearchOperations` create-once path (`rev:initial` + RevisionHead). **OPS post-persist**: Model C successor revision + CAS via `ResearchOperations`. **Model C**: exercised by OPS fixtures/tests for this unit kind. **Certified**: SCI corpus / OPS corpus coverage.

| Unit | Core | OPS create | OPS post-persist | Model C (OPS-exercised) | Certified |
|------|------|------------|------------------|-------------------------|-----------|
| Claim | COMPLETE — `ClaimFactory.createDraft`, `ClaimTransitionService` (Standing), `ClaimVersionService` (material proposition/scope) | YES — `registerClaimUnit` | YES — Standing via `transitionClaimStanding`; **NO** material content OPS | YES (Sprint 020) | SCI (`REF-CLAIM-001…007`) + OPS |
| Evidence | COMPLETE — `EvidenceFactory.createDraft`, `EvidenceTransitionService` (Record State), `EvidenceVersionService` (material) | YES — `registerEvidenceUnit` (+ optional pre-persist transition) | YES — Record State via `transitionEvidenceRecordState`; **NO** material content OPS | YES (Sprints 019–021) | SCI (`REF-EVID-001…005`) + OPS |
| Evidence Grade | COMPLETE — `EvidenceGradeService.assign` (EG-0.1; stored on `Evidence.grade_ref`) | NOT APPLICABLE — designation on Evidence, no own identity | YES — `assignEvidenceGrade` (EvidenceUnit revision; Option A) | YES (Sprint 022) | SCI (`REF-GRADE-001…003`) + OPS (`REF-OPS-062…076`) |
| Contradiction | COMPLETE — `ContradictionFactory.createOpen`; `ContradictionTransitionService` `open → resolved_by_supersession \| resolved_by_scope_split \| resolved_by_retraction \| unresolved_archived`; `ContradictionVersionService` | **NO** | **NO** | **NO** (ENC `ContradictionUnit` + Persistence kind map exist; never revisioned by OPS) | SCI only (`REF-CONTRA-001…002`, `REF-CANON` assemble) |
| Negative Result | COMPLETE — `NegativeResultTransitionService.register` (`(new) → registered`, Human-gated NRTE embedded) and `transition` (`registered → withdrawn`, Human-gated); `NegativeResultVersionService` | **NO** | **NO** | **NO** | SCI only (`REF-NEGRES-001…002`, `REF-CANON`) |
| Verification | COMPLETE — `VerificationTransitionService.createPlanned` (`planned`, `pending`, empty VTE log) and `transition` (`planned → passed \| failed \| inconclusive`, Human-gated; outcome derived); `VerificationVersionService` | **NO** | **NO** | **NO** | SCI only (`REF-VERIF-001…003`, `REF-CANON`) |

### 2.2 Core lifecycle / transition semantics (as implemented)

| Unit | Object-local enum | Issuance | Post-issuance edges | Human gate (Core) |
|------|-------------------|----------|---------------------|-------------------|
| Claim | Standing `draft_unverified \| supported \| contested \| superseded \| retracted` | `createDraft` → `draft_unverified` | per `ClaimTransitionService.ALLOWED` | all Standing transitions; `contested→supported` requires contradiction-handling marker |
| Evidence | Record State `draft \| registered \| withdrawn` | `createDraft` → `draft` | `draft→registered\|withdrawn`, `registered→withdrawn` | `registered`; `withdrawn` when `ai_assisted` |
| Grade | label reassignment only (no state machine) | — | `assign` | AR-2…AR-5 raises |
| Contradiction | Record State `open \| resolved_* (3) \| unresolved_archived` | `createOpen` → `open` (no CRTE) | `open → {resolved_*, unresolved_archived}`; terminal thereafter | any edge leaving `open` (`F6`), `decision_ref` required; `resolved_*` requires `resolution_note` (`F7`) |
| Negative Result | Record State `registered \| withdrawn` | `register` → `registered` (NRTE embedded) | `registered → withdrawn` | registration **and** withdrawal (`F5`), `decision_ref` required; `withdrawal_reason` (`F7`) |
| Verification | Record State `planned \| passed \| failed \| inconclusive`; Outcome `pending \| passed \| failed \| inconclusive` (derived) | `createPlanned` → `planned/pending` | `planned → {passed, failed, inconclusive}`; terminal thereafter | leaving `planned` (`F7`), `decision_ref` required |

**FACT:** None of Contradiction / Negative Result / Verification has a Grade or Standing; all three enforce ADR-0006 orthogonality via forbidden-state lists. None mutates Claim Standing, Evidence, or Grade (SCI-004 §8.3, SCI-005 NRR-2, SCI-006 VRR-2 — enforced by Core objects never touching other aggregates).

### 2.3 Cross-unit reference semantics (as implemented)

| Holder | Field | Target | Validation | Settable after creation (Core)? |
|--------|-------|--------|------------|-------------------------------|
| Claim | `supported_by` | Evidence ids | grammar only | YES — `StandingTransitionInput.supported_by` |
| Claim | `contested_by` | Contradiction ids | grammar only | YES — `StandingTransitionInput.contested_by`; **required ≥1 when Standing = `contested`** (`F7`) |
| Claim | `qualified_by` | Negative Result ids | grammar only | **NO** — `CreateClaimInput` only; `ClaimVersionService` preserves but cannot add |
| Claim | `verified_via` | Verification ids | grammar only | **NO** — `CreateClaimInput` only |
| Evidence | `bears_on` | Claim ids | grammar only | create only (SSR-5 independence) |
| Contradiction | `involved_claims` (≥2) · `evidence_refs` | Claim · Evidence | grammar only, no dereference | create only |
| Negative Result | `claim_refs` · `evidence_refs` · `contradiction_refs` · `verification_refs` | Claim · Evidence · Contradiction · opaque | grammar only (verification refs: non-empty string) | create only |
| Verification | `claim_refs` · `evidence_refs` · `contradiction_refs` · `negative_result_refs` · `grade_refs` · `artifact_ref` | Claim · Evidence · Contradiction · NR · grade_ref tokens (ENC `Extension`) · opaque | grammar only | create only |

**FACT:** No Core or OPS layer dereferences a cross-unit id against Persistence. `REF-OPS-039` already transitions a Claim to `contested` with `contested_by: ["contradiction:ref-ops-039"]` — a Contradiction identity that **cannot be persisted by any OPS path today**.

### 2.4 Supporting layers per unit (all three remaining units)

| Layer | Contradiction | Negative Result | Verification |
|-------|---------------|-----------------|--------------|
| ENC unit kind | `ContradictionUnit` | `NegativeResultUnit` | `VerificationUnit` |
| ENC content carries | id, version, record_state, statements, provenance, ethics marker, created_by/at, `resolution_note?` | id, version, record_state, summary, description, expected/observed, scope, protocol_ref, sensitivity_context, provenance, ethics, created_by/at, `withdrawal_reason?` | id, version, record_state, outcome, summary, description, scope, protocol_ref, method, context, rationale, provenance, ethics, created_by/at, `artifact_ref?` |
| ENC references (roles) | `involves` (Claim) · `cites_evidence` | `qualifies_or_challenges` · `cites_evidence` · `related_contradiction` · `related_verification` | `verifies_claim` · `verifies_evidence` · `related_negative_result` · `related_contradiction` · `grade_ref` (Extension) |
| ENC events | CRTE log | NRTE log | VTE log |
| **ENC content omits** | `ai_assisted`, `human_sponsor` | `ai_assisted`, `human_sponsor` | `ai_assisted`, `human_sponsor` |
| SER-JSON | registered | registered | registered |
| Processor | `contradiction.record_transition` | `negative_result.record_transition` | `verification.record_transition` |
| Persistence | `entityFromCanonicalUnit` kind map; Model C keys by `unit_kind` | same | same |
| OPS decode helper | **none** | **none** | **none** |

**OBSERVATION (repository fact, pre-existing, certified):** `ClaimUnit` and `EvidenceUnit` content include `ai_assisted` / `human_sponsor`; `ContradictionUnit`, `NegativeResultUnit`, `VerificationUnit` content do **not** (`packages/encoding/src/builder.ts` lines 319–331, 380–396, 449–466). Any OPS decode-from-unit for these three kinds therefore cannot reconstruct AI-authorship markers. See OQ-023-002.

### 2.5 Certified vs non-certified behaviour

| Behaviour | Certified? |
|-----------|-----------|
| Claim/Evidence create-once + Model C initial revision | YES (OPS) |
| Claim Standing / Evidence Record State / Evidence Grade post-persist | YES (OPS) |
| Core semantics for all six units | YES (SCI corpus, 44/44) |
| ENC assembly of all six unit kinds | YES (SCI `REF-CANON-*`) |
| Persistence of `ContradictionUnit` / `NegativeResultUnit` / `VerificationUnit` rows or heads | **NOT CERTIFIED** (kind map exists; no fixture creates one) |
| Any OPS path for Contradiction / NR / Verification | **NONE** |
| Claim / Evidence material content OPS | **NONE** |
| Persistence `Relationship` entity kind (`entityFromRelationship`) | exists; **unused** by OPS / REF (dormant) |

---

## 3. Candidate Analysis (Q2, Q4, Q5, Q8)

Candidates are analysed for dependencies, not ranked.

### Candidate A — Contradiction OPS

- **Scientific purpose:** Record disagreement between ≥2 Claims as a first-class, revisable scientific object (`open`) and record how it was resolved or archived — without moving Claim Standing (SCI-004 §8.3).
- **Existing Core support:** `ContradictionFactory.createOpen`; `ContradictionTransitionService.transition` (Human-gated leave-`open`, `resolution_note` for `resolved_*`, `F8` note-change rule); `ContradictionValidator`; `ContradictionVersionService`; ENC `ContradictionUnit`; SER-JSON; Processor stage. Complete.
- **OPS requirements:** (1) create-once `ContradictionUnit` at `rev:initial` + `ensureInitialHead(…, "ContradictionUnit", …)` — mirrors `registerClaimUnit`; (2) post-persist resolution — head get → OPS-local decode → Core `transition` → ENC → `create` → `advanceHead` CAS → optional operational event — mirrors 020/021/022; (3) OPS-local `contradictionFromContradictionUnitPayload` (reconstruct `involved_claims` from `involves` refs, `evidence_refs` from `cites_evidence`, CRTE log from events); (4) per-unit get/lineage/export helpers (precedent: per-unit, no generic engine).
- **Model C compatibility:** Full — stable `contradiction_id`; immutable revisions; `predecessor_revision_id`; RevisionHead keyed `persist:RevisionHead:ContradictionUnit:{id}`; CAS; partial-write honesty unchanged.
- **Persistence impact:** NONE (kind map, keys, head, journal, snapshot already generic by `unit_kind`).
- **ENC impact:** NONE required for create/transition. Decode lossiness of `ai_assisted`/`human_sponsor` exists (OQ-023-002).
- **SER impact:** NONE (`ContradictionUnit` already in SER-JSON registry).
- **CONF impact:** additive `REF-OPS-077+` under `CONF-001@1.1.0-OPS`; `REF-OPS-` prefix and `OPS-001` authority already recognized; no new profile.
- **CERT impact:** additive OPS evidence; single engines; SCI 44/44 unchanged.
- **Prerequisites:** Claim OPS (certified), Evidence OPS (certified), Model C (certified). All referential targets of a Contradiction (Claim, Evidence) are OPS-operable today. Claim-side back-reference already operable (`transitionClaimStanding` with `contested_by`).
- **Dependencies it unlocks:** persisted target for `Claim.contested_by`; referential target for NR `contradiction_refs` and Verification `contradiction_refs`; `contested→supported` Standing path with a real Contradiction record.
- **Scope pressure:** Low structurally (third-time isomorphic pattern), but RR-002-05 (generic lifecycle temptation) intensifies with a fourth per-unit path. Must be refused again.
- **Unlocked research capability:** represent disagreement; make Claim `contested` Standing referentially honest; record resolution reasoning (`resolution_note`) as scientific, not operational, history.
- **Unresolved questions:** OQ-023-001 (dereference policy), OQ-023-002 (AI-marker lossiness), OQ-023-003 (create-only vs create+resolve slice), OQ-023-004 (event type naming).

### Candidate B — Negative Result OPS

- **Scientific purpose:** Preserve non-observation / null results as archival citizens (SCI-005) without implying refutation (IR-4).
- **Existing Core support:** `NegativeResultTransitionService.register` (issuance embeds Human-gated NRTE), `transition` (`registered→withdrawn`, Human-gated), validator, version service, ENC `NegativeResultUnit`, SER, Processor. Complete.
- **OPS requirements:** create-once via `register(content, transitionInput)` — note issuance itself is Human-gated and requires `decision_ref` (differs from Claim/Evidence `createDraft`; precedent for passing a transition at create: `registerEvidenceUnit` options); post-persist withdrawal via Model C; OPS decode (`claim_refs` from `qualifies_or_challenges`, `evidence_refs`, `contradiction_refs`, `verification_refs`, NRTE log); per-unit helpers.
- **Model C compatibility:** Full.
- **Persistence / ENC / SER impact:** NONE required; same AI-marker lossiness (OQ-023-002).
- **CONF / CERT impact:** additive under existing OPS profile.
- **Prerequisites:** Claim/Evidence OPS (certified). Optional refs to Contradiction and Verification ids have **no** OPS-persistable target today.
- **Claim back-reference:** `Claim.qualified_by` is settable **only at Claim creation** in Core; no Core service adds it later. SCI-005 §21 explicitly does not auto-update Claim relationships. Linkage is therefore one-directional (NR → Claim) unless a Core change is separately specified — **not** an OPS matter.
- **Scope pressure:** Medium — invites a Claim relationship-update Core change (out of OPS authority) or a generic engine.
- **Unlocked research capability:** represent absence / non-observation; qualify Claims without asserting refutation.
- **Unresolved questions:** OQ-023-001, OQ-023-002, OQ-023-005 (one-directional NR→Claim linkage acceptable?), OQ-023-006 (register-at-create Human gate shape in OPS).

### Candidate C — Verification OPS

- **Scientific purpose:** Record the outcome of a verification/reproduction process (`passed | failed | inconclusive`) against Claims/Evidence without declaring truth (SCI-006).
- **Existing Core support:** `createPlanned`, `transition` (Human-gated leave-`planned`; outcome derived), validator, version service, ENC `VerificationUnit`, SER, Processor. Complete.
- **OPS requirements:** create-once (`planned`); post-persist outcome via Model C; OPS decode (refs by role incl. `grade_ref` Extension refs; VTE log); per-unit helpers.
- **Model C compatibility:** Full.
- **Persistence / ENC / SER impact:** NONE required; AI-marker lossiness (OQ-023-002).
- **CONF / CERT impact:** additive under existing OPS profile.
- **Prerequisites:** Claim/Evidence/Grade OPS (certified — `grade_refs` tokens are OPS-producible via Sprint 022). Optional refs to Contradiction and NR ids have **no** OPS-persistable target today; `artifact_ref` is an opaque string (no DocumentArtifact required).
- **Claim back-reference:** `Claim.verified_via` creation-only in Core (same gap as `qualified_by`).
- **Scope pressure:** Medium — `artifact_ref` and `verification_method: "reproduction"` invite artifact/pipeline infrastructure speculation (R4/R8), which is not architecturally triggered.
- **Unlocked research capability:** represent verification / replication outcomes; connect outcomes to graded Evidence.
- **Unresolved questions:** OQ-023-001, OQ-023-002, OQ-023-005, OQ-023-007 (`artifact_ref` remains opaque?).

### Candidate D — Provenance boundary / packaging

- **Scientific purpose:** Export/package provenance (run-level reproducibility bundles, PROV / RO-Crate-shaped).
- **Existing Core support:** Object-local provenance is already a mandatory Core constituent on every unit (`Evidence.provenance` {completeness, obtained_at, transform_summary, custody_agent, protocol_ref?, dataset_ref?, transform_artifact_ref?}; Contradiction/NR/Verification `provenance` {completeness, recorded_at, custody_agent, method_summary}); encoded in ENC content; scientific event logs (STE/ERTE/GAE/CRTE/NRTE/VTE) live on the objects.
- **OPS requirements:** none for the three remaining units; packaging would be a new SER/export profile (forbidden by every certified SPEC to date without a dedicated architecture step).
- **Model C compatibility:** consumer only.
- **Persistence / ENC / SER / CONF / CERT impact:** would introduce a new export profile and likely new authority — **new architecture**.
- **Prerequisites:** stable, OPS-revisable set of scientific units (ROADMAP-REVIEW-001 R2 after R1).
- **Scope pressure:** High — packaging half the unit set freezes incomplete run shapes (ROADMAP-REVIEW-002 §8).
- **Unlocked research capability:** trace and export a research run reproducibly.
- **Unresolved questions:** none that block the units; boundary already defined (see §5).

### Candidate E — Literature / DocumentArtifact boundary

- **Scientific purpose:** Reference documents as non-authoritative inputs feeding Evidence/Claims.
- **Existing Core support:** `Evidence.source.source_locator` (string) + `source_class` (`literature_venue` among others) + `citation_refs`; Verification `artifact_ref` string. No `DocumentArtifact` type anywhere in packages.
- **OPS requirements:** none of the three remaining units requires it (all refs are opaque strings or Core ids).
- **Impact:** new Core-adjacent type → **new architecture** (Core/ENC/SER additions).
- **Prerequisites:** R1 units operable; provenance rules (R2).
- **Scope pressure:** High (parsers, crawlers, search).
- **Unlocked research capability:** connect literature.
- **Unresolved questions:** DEFERRED; not a Sprint 023 question.

### Candidate F — Claim / Evidence material content OPS

- **Scientific purpose:** Revise proposition/scope (Claim) or items/source/provenance (Evidence) after persist with SemVer bump.
- **Existing Core support:** `ClaimVersionService.applyMaterialUpdate` (proposition, scope only); `EvidenceVersionService` (`EvidenceContentUpdate`). Complete for those fields.
- **OPS requirements:** Model C successor revision via the existing pattern; decode helpers exist.
- **Impact:** NONE on Persistence/ENC/SER; additive OPS.
- **Prerequisites:** certified.
- **Scope pressure:** Low; but does not extend unit coverage.
- **Unlocked research capability:** correct/refine already-registered Claims/Evidence without identity loss.
- **Unresolved questions:** relationship to Standing/Record State preservation (Core already preserves); DEFERRED since SPEC-021 §32.

### Candidate G — Claim relationship-update (Core) for `qualified_by` / `verified_via`

- **Discovered from repository evidence.** Core exposes no service to add `qualified_by` or `verified_via` to an existing Claim; `contested_by`/`supported_by` can be added via Standing transition. Making NR/Verification back-referenced from Claims after Claim persist would require a **Core change** (SCI-001 owns Claim relationships).
- **Impact:** Core + SCI-001 — outside OPS sprint authority; **new scientific-authority decision**.
- **Prerequisites:** SCI-001 amendment.
- **Scope pressure:** High (Core redesign forbidden in OPS sprints).
- **Unlocked research capability:** bidirectional navigation Claim ↔ NR/Verification.
- **Status:** DEFERRED; recorded so SPEC-023 does not silently attempt it (OQ-023-005).

### Candidate H — ENC AI-marker fidelity for Contradiction / NR / Verification units

- **Discovered from repository evidence.** `ai_assisted` / `human_sponsor` are Core fields validated by `F_AI` rules on all three units, but not encoded in their canonical content (they are on Claim/Evidence units).
- **Impact:** ENC content change → alters canonical content of certified `REF-CANON-*` SCI fixtures for those kinds → touches frozen SCI corpus/profile. **Certified-behaviour change**; requires its own architecture decision (ENC minor version), not an OPS sprint.
- **Consequence for OPS candidates:** decode-from-unit for these kinds is lossy for AI markers (precedent for accepting lossiness: SPEC-021 §9.4). Human gates on all post-persist edges of the three units are enforced by the transition services **independently** of `ai_assisted`, so the scientific gate is not weakened on the transition path; only the marker is absent from reconstructed objects — and it is already absent from the authoritative persisted representation.
- **Status:** OBSERVATION → OQ-023-002 (SPEC decision: accept lossiness per precedent, or open a separate ENC discovery).

---

## 4. Dependency Graph (Q2, Q3)

Referential dependency (what each unit's Core refs may point at), overlaid with OPS operability at HEAD:

```text
Certified & OPS-operable (Sprints 016–022)
  Claim (create, Standing)  ──supported_by──▶ Evidence (create, Record State, Grade)
    │  contested_by ──▶ [Contradiction id]   ← referenced today; NOT persistable
    │  qualified_by ──▶ [NegativeResult id]  ← creation-only on Claim
    │  verified_via ──▶ [Verification id]    ← creation-only on Claim
    ▼
Contradiction  (Core complete; ENC/SER/Processor complete; OPS absent)
    involves ──▶ Claim          (operable target)
    cites_evidence ──▶ Evidence (operable target)
    ▼ referenced by
Negative Result (Core complete; OPS absent)
    claim_refs ──▶ Claim · evidence_refs ──▶ Evidence
    contradiction_refs ──▶ Contradiction (no persistable target today)
    verification_refs ──▶ Verification   (no persistable target today; opaque grammar)
    ▼ referenced by / references
Verification (Core complete; OPS absent)
    claim_refs · evidence_refs · grade_refs(tokens from Sprint 022)
    contradiction_refs ──▶ Contradiction (no persistable target today)
    negative_result_refs ──▶ NegativeResult (no persistable target today)
    ▼
Future capability
    Provenance packaging (R2) → Literature/DocumentArtifact (R3) → Analysis plane (R4) …
```

Reading (dependency, not ranking):

- **Contradiction** is the only remaining unit whose **every referential target** (Claim, Evidence) is already OPS-operable, **and** whose identity is already cited by a certified OPS path (`Claim.contested_by`, `REF-OPS-039`) without a persistable target.
- **Negative Result** and **Verification** each optionally reference Contradiction ids (and each other). Their refs are grammar-only, so they are *not* hard-blocked, but making them OPS-operable first leaves *two* dangling classes (Contradiction, and NR↔Verification) instead of closing one.
- **Provenance packaging** and **DocumentArtifact** consume the unit set; neither is required by any of the three units (all provenance is object-local Core content; all external refs are opaque strings).
- **Material content OPS** is orthogonal (does not change unit coverage) and remains available at any point.

### Scientific completeness (Q3)

What the certified architecture supports today, end to end under Model C:

```text
Evidence (source/provenance/items) → Record State (draft→registered)
  → Grade (EG-0.1 warrant label)
  → Claim (proposition/scope) → Standing (draft_unverified→supported | contested | …)
```

- **Interpretation → Claim:** supported via Claim `supported_by` + Evidence `bears_on` (independent edges, SSR-5).
- **Grading:** supported on the current Evidence head (Sprint 022).
- **Disagreement:** Claim can be marked `contested` (Standing) but the *object* of disagreement (Contradiction: overlap statement, incompatibility statement, resolution) cannot be persisted or revised. Loop is **incomplete** here.
- **Absence / non-observation:** Core NR exists; no persisted representation possible. **Incomplete**.
- **Verification / replication:** Core Verification exists; no persisted representation possible. **Incomplete**.

Core semantics for all three are complete and certified at SCI level; the gap is exclusively OPS orchestration under Model C. No redesign of these semantics is needed or proposed.

---

## 5. Provenance Analysis (Q6)

The five concepts are already distinct in the certified architecture (SPEC-020 §11–§13; enforced in code):

| Concept | Where it lives | Authority | Code evidence |
|---------|----------------|-----------|---------------|
| **Scientific provenance** | Core object fields (`Evidence.provenance`, `Contradiction/NR/Verification.provenance`) + scientific event logs (STE/ERTE/GAE/CRTE/NRTE/VTE) encoded in ENC content/events | Scientific Core | `packages/core/src/*/types.ts`; `builder.ts` content includes `provenance` for every unit kind |
| **Operational audit history** | Persistence event journal (`appendEvent`) + OPS timeline projection; `ops.*` event types cite revision ids | Operational only; non-authoritative vs entity metadata | `research-operations.ts` `appendEvent` blocks; SPEC-020 §12 |
| **Source locator** | `Evidence.source.source_locator` (string) + `source_class` + `source_state`; `citation_refs`; Verification `artifact_ref` | Core field grammar only; no dereference | `evidence/types.ts` lines 56–59 |
| **Persistence history** | Immutable revision rows + snapshot `event_journal` | Infrastructure | `persistence/src/types.ts` |
| **Revision lineage** | `PersistenceEntity.predecessor_revision_id` + RevisionHead | Infrastructure representation metadata; ≠ Core `supersedes` | `entity.ts`, `revision.ts` |

**Is provenance required BEFORE another unit becomes OPS-operational?** **NO**, because:

1. Each remaining unit already carries mandatory Core provenance (`completeness`, `recorded_at`, `custody_agent`, `method_summary`) and it is already canonically encoded — OPS orchestration adds no provenance semantics.
2. Scientific transition history for these units (CRTE/NRTE/VTE) is Core-owned and ENC-encoded, exactly as STE/ERTE/GAE were for Sprints 020–022.
3. The operational journal remains the sole non-scientific history; Sprint 022 re-confirmed non-authoritative citation semantics.
4. Packaging/export provenance (PROV/RO-Crate) is a **consumer** of the unit set; specifying it over 3 of 6 operable units would freeze incomplete shapes (ROADMAP-REVIEW-002 §8 verdict still holds).

No concept merge is required or proposed. OPS for any remaining unit must keep the five separations exactly as Sprints 020–022 did.

---

## 6. Infrastructure Analysis (Q7)

| Technology | Required for any Sprint 023 candidate A–C/F? | Status | Why unjustified now |
|------------|----------------------------------------------|--------|---------------------|
| PostgreSQL / durable adapter | NO | NOT JUSTIFIED | In-memory Model C is certified and sufficient; durable schema before unit coverage completes freezes incomplete surfaces (RR-002-06) |
| Object storage | NO | NOT JUSTIFIED | No artifact bytes are stored; `artifact_ref`/`source_locator` are opaque strings |
| OpenSearch | NO | NOT JUSTIFIED | No retrieval requirement; ranking ≠ Standing |
| Neo4j / RDF | NO | NOT JUSTIFIED | Would be a second relationship graph; Core refs + ENC references + dormant Persistence `Relationship` kind already exceed what OPS uses |
| Python | NO | NOT JUSTIFIED | No analysis plane; Core is TypeScript |
| Nextflow / workflow engine | NO | NOT JUSTIFIED | Verification `method: "reproduction"` records an outcome; it does not execute pipelines |
| Docker | NO | NOT JUSTIFIED | No deployable service |
| API / backend | NO | NOT JUSTIFIED | No product surface; OPS façade is in-process |
| Frontend | NO | NOT JUSTIFIED | No API |
| Multi-user infra / auth | NO | NOT JUSTIFIED | Single-process, session-scoped Persistence; Human Reviewer is an agent-id grammar, not an auth system |

**Result:** no architecturally triggered infrastructure for Sprint 023. All A–C/F candidates fit TypeScript/Node on the certified kernel.

---

## 7. Open Questions

Not resolved here; listed for SPEC-023 (or a separate discovery where noted).

| ID | Question | Repository evidence | Class |
|----|----------|---------------------|-------|
| **OQ-023-001** | Should OPS dereference cross-unit ids (e.g. verify `involved_claims` exist as persisted ClaimUnits) before creating a Contradiction, or keep grammar-only refs as Core/OPS do for `bears_on`/`supported_by`/`contested_by`? | No dereference anywhere today; `REF-OPS-039` cites a non-existent Contradiction id | REQUIRED FOR SPEC (decision; precedent = no dereference) |
| **OQ-023-002** | Decode-from-unit for Contradiction/NR/Verification cannot reconstruct `ai_assisted`/`human_sponsor` (not in ENC content). Accept lossiness per SPEC-021 §9.4 precedent, or open a separate ENC discovery? | `builder.ts` content blocks for the three kinds | REQUIRED FOR SPEC (decision); ENC change itself is **out of OPS sprint authority** |
| **OQ-023-003** | Sprint 023 slice: create-once `open` only, or create-once + post-persist resolution (`open → resolved_* / unresolved_archived`) in one sprint? | Sprint 019 did create-once; 020–022 did post-persist; both patterns certified | REQUIRED FOR SPEC |
| **OQ-023-004** | Operational event type(s) for Contradiction OPS (e.g. `ops.contradiction_record_state_revision`) and whether create-once emits any operational event (Claim/Evidence create-once do not). | `ops.claim_standing_revision`, `ops.evidence_record_state_revision`, `ops.evidence_grade_assignment_revision` | REQUIRED FOR SPEC (naming) |
| **OQ-023-005** | `Claim.qualified_by` / `verified_via` are creation-only in Core. Is one-directional NR→Claim / Verification→Claim linkage acceptable for future NR/Verification OPS, or is a SCI-001 Core amendment required first? | `ClaimTransitionService` exposes only `supported_by`/`contested_by`; `ClaimVersionService` cannot add relationships | DEFERRED (Core/SCI-001 authority; not Sprint 023 if Candidate A) |
| **OQ-023-006** | NR issuance is Human-gated at create (`register(content, transitionInput)`); how would an NR create-once OPS accept the issuance transition input? | `negative-result/transition-service.ts` | DEFERRED (only if NR OPS is specified) |
| **OQ-023-007** | Verification `artifact_ref` remains an opaque string in OPS (no DocumentArtifact)? | `verification/types.ts` | DEFERRED (only if Verification OPS is specified) |
| **OQ-023-008** | Persistence `Relationship` entity kind is dormant. Must SPEC-023 explicitly forbid its use for Contradiction edges to prevent a second relationship graph? | `entity.ts` `entityFromRelationship`; zero OPS/REF usage | REQUIRED FOR SPEC (explicit non-goal recommended) |
| **OQ-023-009** | Should Sprint 023 fixtures also exercise `Claim contested_by → persisted Contradiction` end-to-end (Standing OPS + Contradiction OPS in one fixture) to close the `REF-OPS-039` dangling edge as evidence? | `REF-OPS-039` | REQUIRED FOR SPEC (fixture theme) |
| **OQ-023-010** | With a fourth isomorphic per-unit path, SPEC-023 must again explicitly reject a generic lifecycle engine (RR-002-05 / FO-022-06). | Three certified per-unit methods | REQUIRED FOR SPEC (restate non-goal) |

No OQ requires implementation to resolve; none reopens Model C, Option A, or scientific authority placement.

---

## 8. Discovery Verdict

**READY FOR SPEC-023**

### Justified candidate

**Contradiction OPS under Model C** — OPS orchestration of Core `ContradictionFactory.createOpen` (create-once `ContradictionUnit`, `rev:initial` + RevisionHead) and, subject to OQ-023-003, Core `ContradictionTransitionService.transition` onto a headed `ContradictionUnit` (immutable successor revision + CAS + optional operational event), without inventing Contradiction vocabulary, dereference rules, or a generic engine.

### Why it is dependency-justified (not "next in the list")

1. **Referential closure:** Contradiction's Core references (`involved_claims` → Claim, `evidence_refs` → Evidence) point only at units that are already OPS-operable and revisable. NR and Verification each optionally reference Contradiction (and each other), so their targets are not yet all persistable.
2. **Existing dangling edge in certified OPS:** `transitionClaimStanding` already sets `Claim.contested_by` to Contradiction ids, and Standing `contested` **requires** ≥1 such id (`ClaimValidator` `F7`). `REF-OPS-039` certifies this with an id that no OPS path can persist. Contradiction OPS makes an already-certified scientific reference resolvable.
3. **Zero Core / ENC / SER / Persistence / CONF / CERT change required:** factory, transition service, validator, ENC unit, SER registration, Processor stage, Persistence kind map, Model C keys/head/CAS, OPS profile prefix, and single engines all exist.
4. **Provenance boundary not a prerequisite:** Contradiction provenance and CRTE history are Core-owned and ENC-encoded; operational journal stays non-authoritative (§5).
5. **No infrastructure trigger** (§6).

### Not selected as Sprint 023 (dependency reasons, not ranking)

- **Negative Result OPS / Verification OPS:** Core-complete; would leave optional `contradiction_refs` / mutual NR↔Verification refs without persistable targets; also surface the Claim `qualified_by`/`verified_via` creation-only gap (OQ-023-005), which is a Core/SCI-001 matter.
- **Provenance packaging / DocumentArtifact:** consumers of the unit set; would introduce new export profile / Core-adjacent types (new architecture) over an incomplete operable set.
- **Material content OPS:** orthogonal; remains available later.
- **ENC AI-marker fidelity (Candidate H):** certified-behaviour change to SCI-frozen canonical content; requires its own ENC discovery, not an OPS sprint.

### What SPEC-023 must specify (design-only; no implementation)

1. Problem statement: persisted, revisable Contradiction under certified Model C; Claim `contested_by` target resolvability.
2. Authority boundaries: Core (SCI-004) sole owner of Contradiction meaning/gates; OPS orchestrates; Persistence/ENC/SER unchanged.
3. OPS operation contracts: create-once (`registerContradictionUnit` or equivalent naming — SPEC decides) and, per OQ-023-003, post-persist transition (`transitionContradictionRecordState` or equivalent) with caller-supplied `revision_id`, `expected_head_revision_id`, CRTE `event_id`, `at`, `decision_ref`, `resolution_note`.
4. OPS-local decode contract `contradictionFromContradictionUnitPayload` (field classes as SPEC-021 §9.2; refs by role `involves` / `cites_evidence`; CRTE from events), with explicit lossiness decision (OQ-023-002).
5. Dereference policy (OQ-023-001) — precedent is grammar-only.
6. Error semantics: Core `ContradictionValidationError` (`F2`, `F3`, `F6`, `F7`, `F8`, `F_TRANSITION`) propagate; Persistence `NOT_FOUND` / `CONFLICT` / `ALREADY_EXISTS`; `OpsError` for misuse.
7. Determinism: caller-supplied ids everywhere; no `randomUUID` on certified paths (Core CRTE builder fallback documented as inherited).
8. Operational event type(s) (OQ-023-004); membership non-mutation; snapshot shapes frozen; SER-JSON export via existing helpers; per-unit get/lineage/export helpers.
9. Non-goals: NR/Verification OPS; Claim relationship Core changes; ENC content changes; Persistence `Relationship` kind usage (OQ-023-008); generic lifecycle engine (OQ-023-010); auto-sync of `Claim.contested_by`; Standing changes via Contradiction (SCI-004 §8.3); DocumentArtifact / KG / AI / DB / API / UI.
10. Evidence plan: additive `REF-OPS-077+` (themes: create-once, head/lineage, resolution with Human gate, AI leave-open rejected `F6`, missing `resolution_note` `F7`, CAS `CONFLICT`, duplicate `ALREADY_EXISTS`, immutability, export, snapshot, optional event, membership unchanged, Claim `contested_by` → persisted Contradiction coexistence per OQ-023-009); SCI 44/44 frozen; OPS/FULL additive under `CONF-001@1.1.0-OPS`; single engines.
11. Regression: Sprints 016–022 all green; `SMOKE_019/020/021/022_PASS` untouched.

**Implementation authorization:** **NO**. Next authorized action (when separately commanded): author SPEC-023 (design-only).

---

DISCOVERY-023 FINAL VERDICT
===========================

Baseline:
Sprint 022 FORMALLY CERTIFIED AND CLOSED at `662d7f7881337809c7973a39b683053ae3c45a87`; HEAD == origin/main; clean tree; SCI 44/44 · OPS 76/76 · FULL 120/120.

Semantic coverage:
Claim (create + Standing), Evidence (create + Record State + Grade) OPS-operable under Model C. Contradiction, Negative Result, Verification: Core/ENC/SER/Processor complete; OPS absent; never persisted or revisioned; SCI-certified only.

Next dependency-justified frontier:
Contradiction OPS under Model C — the only remaining unit whose referential targets are all OPS-operable and whose identity is already cited by a certified OPS Standing path without a persistable target.

Provenance boundary:
Already separated (scientific provenance · operational audit · source locator · Persistence history · revision lineage); not a prerequisite; packaging deferred (R2).

Model C:
Sufficient; no new Persistence primitive required.

Conformance / Certification:
Additive under `CONF-001@1.1.0-OPS`; single engines; no new profile or authority.

Infrastructure:
None justified.

New scientific authority / graph / journal:
NONE required; Persistence `Relationship` kind must remain unused (OQ-023-008).

Blockers:
NONE.

Open questions:
OQ-023-001 … OQ-023-010 (SPEC decisions / deferred Core questions; none require implementation to resolve).

Status:
READY FOR SPEC-023

Implementation authorization:
NO

Repository modifications besides this report:
NONE

*End DISCOVERY-023 — discovery only. No implementation. No SPEC-023. No commit. No push.*

# MASTER EXECUTION PLAN (MEP)

**Project:** SciROS — Scientific Research Operating System  
**Document:** Master Execution Plan  
**Version:** 1.0  
**Status:** Binding execution constitution (strategic phase frozen)  
**Audience:** International program teams (science, engineering, governance, community)  
**Authority:** Executive Program Director  

---

## 0. Document control

| Field | Value |
|-------|-------|
| Precedence | MEP governs *how* work is executed. Prior strategic docs govern *what* and *why*. On operational conflict, MEP wins. On scientific/ethical conflict, Ethics + Manifesto + SDR win. |
| Change control | MEP amendments require Architecture Review + Scientific Review + Governance vote (see §10). |
| Out of scope of this document | Code, APIs, schemas, folders, packages, speculative product features |

**Frozen strategic inputs (assumed complete; not rewritten here):** Governance, Vision, Mission, Architecture, ADRs, Risk Analysis, Ethics, Scientific Reviews, Existence Review, Scientific Design Review, Scientific Manifesto (SciROS).

---

# PART A — RECOMMENDATION INTAKE

## A1. Extraction method

All prior strategic outputs were treated as a requirement reservoir. Recommendations were merged, conflicts resolved by the frozen SciROS identity (claim/evidence/verification fabric; domain-agnostic core; federation-first; AI as critique/coordination; no disease/mimicry center).

## A2. Conflict resolutions (binding)

| Conflict | Resolution |
|----------|------------|
| AIP / mimicry / autoimmunity-centered product vs SciROS | **SciROS wins.** Former identity is historical only. |
| Build competing platform vs merge/federate | **Federate-first.** Independent software only where standards cannot live upstream. |
| Large monorepo platform vs minimal core | **Minimal core + domain packs later.** |
| Hypothesis generation as center vs verification center | **Verification + scientific memory center.** Generation is optional plugin capability. |
| Start coding vs specs/benchmarks first | **Specs → math → benchmarks → validation → reference implementation.** |
| Clinical utility vs research infrastructure | **Research infrastructure only.** Clinical decision outputs rejected. |

## A3. Categorized recommendations

### Mandatory (program cannot proceed without)

| ID | Recommendation | Why |
|----|----------------|-----|
| M01 | Adopt SciROS identity: claim–evidence–contradiction–null–provenance fabric | Strategic consensus; only fundable unique gap |
| M02 | Domain-agnostic core; domains as packs/plugins | Prevents fashion capture |
| M03 | Do not rebuild systems of record (UniProt, PDB, IEDB, etc.) | Anti-goal; sustainability |
| M04 | Federation-first with mature ecosystems (ELIXIR/EOSC-class, workflow ecosystems, open infra foundations) | Existence/SDR decision |
| M05 | Normative scientific object model before any reference implementation | Audit blocker |
| M06 | Mathematical/statistical protocols for uncertainty, nulls, contradictions | Audit blocker |
| M07 | Benchmark suites with leakage controls before method claims | SDR/audit |
| M08 | Validation framework with graded reproducibility | Manifesto |
| M09 | Ethics boundary: no diagnosis/treatment/CDS outputs | Ethics frozen |
| M10 | Human authority over evidence grade and clinical-adjacent interpretation | Manifesto |
| M11 | AI audit logs mandatory for agent actions | AI principles |
| M12 | License + third-party compatibility matrix before wrapping tools | Legal blocker |
| M13 | Named Scientific Standards Committee + governance constitution for defaults | Governance gap |
| M14 | Kill criteria monitored quarterly | Manifesto |
| M15 | Reporting standard for computational claims (journal-facing) | Open science value |
| M16 | Merge duplicates into single backlog IDs; no parallel shadow roadmaps | Execution discipline |

### Strongly recommended

| ID | Recommendation | Why |
|----|----------------|-----|
| SR01 | Host under neutral foundation / consortium model (LF-class or scientific foundation) | Sustainability |
| SR02 | Pilot ≤2 domain packs after core epistemic benchmarks | Capacity control |
| SR03 | Host–pathogen relatedness as early optional pack (not identity) | High research utility without recentering disease fashion |
| SR04 | nf-core/Galaxy-class delivery for reference workflows | Do not own runners |
| SR05 | External independent reviews at Phase 6–7 | Credibility |
| SR06 | Credit system for verification and negative results | Community incentives |
| SR07 | 18-month kill review if federation signals absent | Funding integrity |

### Recommended

| ID | Recommendation | Why |
|----|----------------|-----|
| R01 | Open Targets–aligned evidence semantics where applicable | Interoperability |
| R02 | Multilingual docs after English stability | Inclusion |
| R03 | Community challenge (modest, not vendor leaderboard) | Method discipline |
| R04 | Succession/sunset plan | Infrastructure maturity |

### Optional

| ID | Recommendation | Why |
|----|----------------|-----|
| O01 | Service multi-tenancy | Not needed for MLRP or early federation |
| O02 | LLM narrative generation | High risk; defer |
| O03 | Broad cancer/aging/neuroscience packs | Later federation only |
| O04 | Drug-discovery decision support | Ethics/IP heavy; external only |
| O05 | GNN/ML rankers in core | Only after explainability/verification gates |

### Rejected

| ID | Recommendation | Why |
|----|----------------|-----|
| X01 | AIP / Autoimmune Insight Platform as identity | Existence + SDR rejection |
| X02 | Molecular mimicry as organizing principle | Scientifically contested center; redundancy |
| X03 | Scientific mega-OS owning all biomedical data | Unsustainable; rebuilds gravity wells |
| X04 | Clinical decision support mode | Ethics veto |
| X05 | Competing with IEDB/UniProt/PDB as primary store | Anti-goal |
| X06 | Startup product roadmap / growth metrics as success | Wrong institution type |
| X07 | Implementation before specs/benchmarks | Prior audits failed Gate 2 |
| X08 | Autonomic AI publication without human institutional responsibility | Manifesto veto |

---

# PART B — MINIMUM LOVABLE RESEARCH PRODUCT (MLRP)

## B1. Definition

**MLRP** = the smallest artifact set that:

1. is completable by **2 researchers** in **≤ 6 months** (full-time equivalent effort shared across science + methods engineering),
2. advances biomedical computational research **without** shipping a platform,
3. is citable, reusable, and falsifiable,
4. unlocks Phase progression without trapping the program in product debt.

## B2. MLRP contents (justified inclusions)

| Component | Inclusion justification |
|-----------|-------------------------|
| **SciROS Claim–Evidence Object Spec v0.1** (normative prose + examples) | Without shared objects, nothing federates |
| **Uncertainty & Contradiction Protocol v0.1** | Core differentiator vs wrapper tools |
| **Negative Result Deposit Protocol v0.1** | Addresses literature bias; high scientific value |
| **Computational Claim Reporting Standard v0.1** (journal checklist) | Immediate community utility |
| **Epistemic Benchmark Suite EB-0** (synthetic + controlled tasks for claim grading, contradiction detection, null handling, provenance completeness)—**spec + miniature public cases** | Makes progress measurable |
| **Verification Rubric VR-0** (human-scorable; optional semi-automated checks later) | Validation without heavy engineering |
| **One worked exemplar dossier** in a neutral methods domain (e.g., computational antigen-relatedness *as example*, not program identity)—full claim graph + nulls + contradictions | Proves the stack works end-to-end on paper |
| **Alliance brief + compatibility matrix draft** | Federation-first prerequisite |

## B3. Explicit exclusions (justified)

| Excluded | Why |
|----------|-----|
| Production software platform / SDK / service | Exceeds 2-person/6-month; violates specs-first |
| Domain mega-packs (cancer, autoimmunity platform, etc.) | Identity regression risk |
| Mimicry engine | Rejected organizing principle |
| Agent swarm / LLM product | Premature; ethics/audit incomplete |
| Full mathematical formalization of all future stats | MLRP needs protocol v0.1, not forever-math |
| Rebuilding databases | Rejected |
| Community voting infrastructure | Governance lite memo suffices for MLRP |
| Performance/scalability engineering | No runtime product yet |

## B4. MLRP acceptance (program-level)

**Done when:**

- External reviewer (not authors) can apply VR-0 to the exemplar and reproduce scores within agreed tolerance.
- EB-0 tasks have locked answers for synthetic items and published anti-leakage rules.
- Reporting Standard is usable on a third-party paper without SciROS software.
- All MLRP artifacts versioned, licensed, and citable (DOI or equivalent plan).

**Scientific value:** Creates the missing epistemic unit of exchange.  
**Engineering value:** Constrains all future implementation.  
**Risk if skipped:** Program collapses into another tool wrapper.

---

# PART C — DEPENDENCY GRAPH

## C1. Critical path (nothing downstream starts early)

```text
REC-INTAKE (done in MEP)
 → GOV-CONSTITUTION-LITE
 → OBJECT-MODEL-SPEC
 → UNCERTAINTY-CONTRADICTION-NULL-PROTOCOLS
 → MATH-STATS-PROTOCOL-V0
 → REPORTING-STANDARD
 → BENCHMARK-EB0-DESIGN
 → BENCHMARK-EB0-CASES
 → VALIDATION-RUBRIC-VR0
 → EXEMPLAR-DOSSIER
 → MLRP-EXTERNAL-REVIEW
 → [GATE: MLRP PASS]
 → REFERENCE-IMPL-PLAN (still no feature sprawl)
 → REFERENCE-IMPL-MIN (executable verification of envelopes only)
 → INTERNAL-REVIEW
 → EXTERNAL-SCI-REVIEW
 → PUBLIC-ALPHA-STANDARDS+REF
 → FEDERATION-PILOTS
 → GOVERNANCE-HARDENING
 → LONG-TERM-STEWARDSHIP
```

## C2. Parallel paths (safe only after stated unlock)

| Path | Unlocks after | May run parallel with |
|------|---------------|------------------------|
| **Engineering Path** | OBJECT-MODEL-SPEC drafted | Math protocol (tight sync), not benchmarks finalization |
| **Research Path** (exemplar science) | Reporting Standard draft | Benchmark case authoring |
| **Community Path** | MLRP PASS | Alliance outreach can start earlier as non-blocking *talks* |
| **Optional Path** (domain pack pilots) | External sci review pass + governance capacity | Not on critical path |
| **Future Path** (agents, many packs) | Public alpha + audit protocol | Blocked until AI governance artifact exists |

## C3. Path definitions

- **Critical Path:** MLRP → verification-minimal reference → reviews → public standards alpha.  
- **Optional Path:** Domain packs, challenges, multilingual docs.  
- **Future Path:** Multi-agent coordination fabric, large reproduction networks.  
- **Research Path:** Exemplars, domain pilots, statistical methodology papers.  
- **Engineering Path:** Reference verification tooling, workflow hooks, CI for specs/tests of fixtures.  
- **Community Path:** Alliances, editor/funder pilots, contributor credit.

---

# PART D — PHASE STRUCTURE

## Phase map (dependency-ordered)

| Phase | Name | Primary unlock |
|-------|------|----------------|
| P0 | Program Foundation | Execution authority |
| P1 | Scientific Object & Protocol Specs | Shared language |
| P2 | Mathematical & Statistical Specs | Calibrated meaning |
| P3 | Benchmark Suite EB-0 | Measurability |
| P4 | Validation Framework VR-0 | Acceptance machinery |
| P5 | MLRP Consolidation & Exemplar | Research-complete minimum |
| P6 | Internal Review | Self-consistency |
| P7 | External Scientific Review | Independence |
| P8 | Reference Implementation (Minimal) | Executable envelopes |
| P9 | Public Alpha (Standards + Ref) | External use |
| P10 | Federation Pilots | Ecosystem insertion |
| P11 | Community Adoption Mechanisms | Incentives |
| P12 | Long-term Governance & Stewardship | Survival |

---

## D1. Phase specifications

### P0 — Program Foundation

| Field | Content |
|-------|---------|
| **Goals** | Freeze identity as SciROS; install execution roles; MEP in force; reject X01–X08 operationally |
| **Inputs** | Frozen strategic corpus; MEP v1.0 |
| **Outputs** | Role charter; decision log template; license posture decision record; alliance contact list |
| **Exit criteria** | Named owners for Science Lead, Engineering Lead, Ethics Lead; LICENSE direction chosen; weekly execution cadence set |
| **Quality gates** | Governance Review; Ethics confirmation of non-clinical boundary |
| **Acceptance** | No work tagged “platform product” without ADR exception |
| **Review requirements** | Governance Review |
| **Deliverables** | Role charter; decision registry boot; risk register link |
| **Required documents** | MEP; Ethics; Manifesto |
| **Blocking risks** | Identity relapse to AIP/mimicry |
| **Validation** | Spot-check backlog IDs map only to SciROS |

### P1 — Scientific Object & Protocol Specs

| Field | Content |
|-------|---------|
| **Goals** | Normative definitions: Claim, Evidence, Contradiction, NegativeResult, ProvenanceEnvelope, VerificationReport |
| **Inputs** | Manifesto principles; SDR identity |
| **Outputs** | Object Model Spec v0.1; protocol drafts for contradiction & nulls |
| **Exit criteria** | Specs internally consistent; examples for each object; open issues logged |
| **Quality gates** | Scientific Review; Architecture Review (systems consistency) |
| **Acceptance** | Independent scientist can encode a paper result into objects without author help |
| **Review requirements** | Scientific + Methodologist |
| **Deliverables** | SPEC-OBJ-001; SPEC-PROT-001 |
| **Required documents** | Manifesto §§5–10 |
| **Blocking risks** | Over-modeling; disease-specific leakage into core |
| **Validation** | Dual encoding of same paper by two people; concordance checklist |

### P2 — Mathematical & Statistical Specs

| Field | Content |
|-------|---------|
| **Goals** | Define uncertainty types, allowed confidence update rules, null-model classes, multiple-testing reporting requirements |
| **Inputs** | SPEC-OBJ-001 |
| **Outputs** | MATH-STAT-001 v0.1 |
| **Exit criteria** | Every score/grade used in MLRP has a definition; forbidden inferences listed |
| **Quality gates** | Statistical Review; Scientific Review |
| **Acceptance** | Biostatistician sign-off |
| **Review requirements** | Statistical Review mandatory |
| **Deliverables** | MATH-STAT-001 |
| **Blocking risks** | Pseudo-probabilities without calibration |
| **Validation** | Worked numerical examples |

### P3 — Benchmark Suite EB-0

| Field | Content |
|-------|---------|
| **Goals** | Design + release miniature public benchmark cases for epistemic tasks |
| **Inputs** | SPEC-OBJ-001; MATH-STAT-001 |
| **Outputs** | EB-0 design doc; case pack; anti-leakage rules; expected scoring notes |
| **Exit criteria** | ≥1 task family each: provenance completeness, contradiction detection, null handling, evidence-grade assignment (synthetic) |
| **Quality gates** | Scientific + Statistical + Open Science Review |
| **Acceptance** | Third party can score a submission with VR-0 |
| **Deliverables** | BENCH-EB0 |
| **Blocking risks** | Leakage; circular “literature truth” |
| **Validation** | Holdout synthetic items; documented construction |

### P4 — Validation Framework VR-0

| Field | Content |
|-------|---------|
| **Goals** | Human-first validation rubric aligned to EB-0 and specs |
| **Inputs** | BENCH-EB0; MATH-STAT-001 |
| **Outputs** | VR-0 rubric; scorer guide; tolerance policy |
| **Exit criteria** | Inter-rater agreement protocol defined |
| **Quality gates** | Scientific + Statistical |
| **Acceptance** | Two raters achieve agreement target on pilot set |
| **Deliverables** | VAL-VR0 |
| **Blocking risks** | Subjective grading without anchors |
| **Validation** | Piloted on exemplar draft |

### P5 — MLRP Consolidation & Exemplar

| Field | Content |
|-------|---------|
| **Goals** | Complete MLRP package + one exemplar dossier |
| **Inputs** | All P1–P4 outputs |
| **Outputs** | MLRP release candidate; exemplar; reporting standard v0.1 |
| **Exit criteria** | MLRP acceptance (§B4) met internally |
| **Quality gates** | Full internal panel (sci, stats, ethics, open science) |
| **Acceptance** | Package citable; exclusions respected |
| **Deliverables** | MLRP-RC1 |
| **Blocking risks** | Scope creep into software |
| **Validation** | Checklist against §B2/B3 |

### P6 — Internal Review

| Field | Content |
|-------|---------|
| **Goals** | Adversarial internal consistency review |
| **Inputs** | MLRP-RC1 |
| **Outputs** | Internal review report; required fixes list |
| **Exit criteria** | No open Critical defects |
| **Quality gates** | Architecture, Scientific, Ethics, Statistical |
| **Acceptance** | Fix verification complete |
| **Deliverables** | REV-INT-001 |
| **Blocking risks** | Rubber-stamp culture |
| **Validation** | Independent internal reviewer not author of exemplar |

### P7 — External Scientific Review

| Field | Content |
|-------|---------|
| **Goals** | External pass/fail on scientific defensibility |
| **Inputs** | MLRP after P6 fixes |
| **Outputs** | External review dossier; go/no-go for reference impl |
| **Exit criteria** | ≥2 external reviewers; written assessments |
| **Quality gates** | External Scientific Review; Ethics |
| **Acceptance** | Net recommendation: proceed / revise / stop |
| **Deliverables** | REV-EXT-001 |
| **Blocking risks** | Capture by friends; ignore kill criteria |
| **Validation** | Reviewer independence attestation |

### P8 — Reference Implementation (Minimal)

| Field | Content |
|-------|---------|
| **Goals** | Minimal executable support for envelopes + EB-0 scoring aids—**not** a discovery platform |
| **Inputs** | P7 proceed; SPEC/MATH/BENCH/VAL |
| **Outputs** | Reference impl plan + minimal reference artifacts meeting DoD |
| **Exit criteria** | Can validate exemplar envelopes programmatically against SPEC; EB-0 scoring assisted |
| **Quality gates** | Engineering, Security, Architecture, Scientific |
| **Acceptance** | Reproducible demo on clean machine profile |
| **Deliverables** | REFIMPL-0 |
| **Blocking risks** | Feature creep; UI productization |
| **Validation** | External repro attempt of demo |

### P9 — Public Alpha (Standards + Ref)

| Field | Content |
|-------|---------|
| **Goals** | Public release of standards + minimal reference under clear license |
| **Inputs** | REFIMPL-0; reviews |
| **Outputs** | Public alpha tag; announcement; contribution guide |
| **Exit criteria** | Security Review; Release Review; citation metadata |
| **Quality gates** | Release Review; Ethics; Open Science |
| **Acceptance** | Outsiders can use Reporting Standard without contacting authors |
| **Deliverables** | ALPHA-1 |
| **Blocking risks** | Overclaim marketing |
| **Validation** | Cold-start user test (scripted) |

### P10 — Federation Pilots

| Field | Content |
|-------|---------|
| **Goals** | Insert protocols into ≥1 external ecosystem pathway (workflow community and/or infrastructure partner pilot) |
| **Inputs** | ALPHA-1 |
| **Outputs** | Pilot reports; upstream contribution PRs/docs as applicable |
| **Exit criteria** | Written pilot retrospective; adoption signals logged |
| **Quality gates** | Community Review; Architecture |
| **Acceptance** | Non-zero external reuse artifact |
| **Deliverables** | FED-PILOT-1 |
| **Blocking risks** | Ecosystem indifference → trigger SR07 kill review |
| **Validation** | Third-party attestation of use |

### P11 — Community Adoption Mechanisms

| Field | Content |
|-------|---------|
| **Goals** | Credit, contribution paths, editor/funder pilot checklist uptake |
| **Inputs** | FED-PILOT-1 |
| **Outputs** | Contribution covenant; credit policy; editor briefing pack |
| **Exit criteria** | ≥1 external contribution merged or formally reviewed |
| **Quality gates** | Community + Governance |
| **Acceptance** | Documented inbound contribution |
| **Deliverables** | COM-ADOPT-1 |
| **Blocking risks** | No incentive for nulls/verification |
| **Validation** | Contribution metrics (qualitative OK) |

### P12 — Long-term Governance & Stewardship

| Field | Content |
|-------|---------|
| **Goals** | Hardened governance, succession, kill-criteria operations, foundation posture |
| **Inputs** | Stable alpha + pilots |
| **Outputs** | Stewardship charter; succession plan; annual review template |
| **Exit criteria** | Governance Review pass; funding model note |
| **Quality gates** | Governance; Ethics; Open Science |
| **Acceptance** | Program can survive founder departure plan |
| **Deliverables** | STEWARD-1 |
| **Blocking risks** | Capture; burnout |
| **Validation** | Tabletop succession exercise |

---

# PART E — BACKLOG (EXECUTABLE WORK ITEMS)

**Legend — Priority:** P0 Critical path · P1 High · P2 Normal · P3 Optional  
**Complexity:** XS \<1w · S 1–2w · M 2–4w · L 1–2mo · XL \>2mo (2-person team weeks)

### E1. Foundation & governance

| ID | Title | Priority | Parent | Deps | Cx | Dur | Sci | Eng | Risk | Owner | DoD | Acceptance | Review |
|----|-------|----------|--------|------|----|-----|-----|-----|------|-------|-----|------------|--------|
| T-000 | Enforce MEP as SoT; archive non-SciROS roadmaps | P0 | P0 | — | XS | 0.5w | M | M | L | Program Dir | MEP cited in all new tasks | No competing roadmap docs active | Gov |
| T-001 | Role charter (Science/Eng/Ethics/Community) | P0 | P0 | T-000 | S | 1w | M | L | M | Program Dir | Named people/roles | RACI published | Gov |
| T-002 | Decision registry boot (classes §15) | P0 | P0 | T-000 | S | 1w | L | M | L | Eng Lead | Template + first 5 entries | Classifiable decisions | Arch |
| T-003 | License direction decision record | P0 | P0 | T-000 | S | 1w | L | M | H | Program Dir | License candidate chosen | Legal note attached | Gov+Legal |
| T-004 | Third-party compatibility matrix draft | P0 | P0 | T-003 | M | 2w | M | H | H | Eng Lead | Matrix covers planned bindings | Blockers listed | Sec+Legal |
| T-005 | Kill-criteria monitoring checklist | P0 | P0 | T-001 | XS | 0.5w | H | L | M | Ethics Lead | Quarterly calendar set | First review dated | Ethics+Gov |

### E2. Specifications (P1–P2)

| ID | Title | Priority | Parent | Deps | Cx | Dur | Sci | Eng | Risk | Owner | DoD | Acceptance | Review |
|----|-------|----------|--------|------|----|-----|-----|-----|------|-------|-----|------------|--------|
| T-010 | Claim object normative spec | P0 | P1 | T-001 | M | 3w | H | M | H | Science Lead | SPEC-OBJ Claim section complete | Dual encoding pilot | Sci |
| T-011 | Evidence object normative spec | P0 | P1 | T-010 | M | 2w | H | M | H | Science Lead | Evidence grades defined | Examples cover 4 grades | Sci+Stats |
| T-012 | Contradiction object spec | P0 | P1 | T-010 | M | 2w | H | M | H | Science Lead | Conflict types enumerated | Worked contradiction | Sci |
| T-013 | NegativeResult object spec | P0 | P1 | T-010 | S | 1.5w | H | M | M | Science Lead | Null deposit rules | Exemplar null encoded | Sci |
| T-014 | ProvenanceEnvelope spec | P0 | P1 | T-010 | M | 2w | M | H | M | Eng Lead | Required fields frozen | Completeness checklist | Arch+Sci |
| T-015 | VerificationReport spec | P0 | P1 | T-014 | S | 1.5w | H | M | M | Science Lead | Report tiers defined | Matches Manifesto tiers | Sci |
| T-016 | Uncertainty type catalog | P0 | P2 | T-011 | M | 2w | H | L | H | Stats Lead | MATH-STAT uncertainty section | No vibes scores | Stats |
| T-017 | Confidence update rules v0 | P0 | P2 | T-016 | M | 2w | H | L | H | Stats Lead | Allowed/forbidden updates | Numerical examples | Stats+Sci |
| T-018 | Null-model classes v0 | P0 | P2 | T-016 | M | 2w | H | M | H | Stats Lead | ≥3 classes specified | Applicability matrix | Stats |
| T-019 | Multiple-testing reporting rules | P0 | P2 | T-017 | S | 1w | H | L | H | Stats Lead | Mandatory disclosures listed | Checklist itemized | Stats |
| T-020 | Reporting Standard v0.1 (journal checklist) | P0 | P5 | T-010..T-019 | M | 2w | H | L | M | Science Lead | Checklist publishable | Cold apply to 1 paper | Sci+OpenSci |

### E3. Benchmarks & validation (P3–P4)

| ID | Title | Priority | Parent | Deps | Cx | Dur | Sci | Eng | Risk | Owner | DoD | Acceptance | Review |
|----|-------|----------|--------|------|----|-----|-----|-----|------|-------|-----|------------|--------|
| T-030 | EB-0 design & task families | P0 | P3 | T-015,T-017 | M | 3w | H | M | H | Science Lead | Design doc approved | 4 families defined | Sci+Stats |
| T-031 | EB-0 synthetic case authoring | P0 | P3 | T-030 | M | 3w | H | M | H | Research Path | Cases + keys locked | Anti-leakage doc | Sci+OpenSci |
| T-032 | EB-0 scoring notes | P0 | P3 | T-031 | S | 1w | H | L | M | Stats Lead | Scoring unambiguous | Dual scorer pilot | Stats |
| T-033 | VR-0 rubric | P0 | P4 | T-032 | M | 2w | H | L | M | Science Lead | Rubric+guide | Agreement target set | Sci+Stats |
| T-034 | Inter-rater pilot | P0 | P4 | T-033 | S | 1w | H | L | M | Science Lead | Pilot report | Target met or rubric revised | Stats |

### E4. MLRP & reviews (P5–P7)

| ID | Title | Priority | Parent | Deps | Cx | Dur | Sci | Eng | Risk | Owner | DoD | Acceptance | Review |
|----|-------|----------|--------|------|----|-----|-----|-----|------|-------|-----|------------|--------|
| T-040 | Exemplar dossier end-to-end | P0 | P5 | T-020,T-033 | L | 4w | H | M | M | Research Path | Full object graph | VR-0 applied | Sci |
| T-041 | MLRP package assembly | P0 | P5 | T-040,T-031 | S | 1w | H | M | M | Program Dir | RC1 bundle | §B4 internal | OpenSci |
| T-042 | Internal adversarial review | P0 | P6 | T-041 | M | 2w | H | M | M | Independent internal | REV-INT-001 | No Critical open | Multi |
| T-043 | Fix Critical/High from T-042 | P0 | P6 | T-042 | M | var | H | M | M | Owners | Fix log closed | Re-check | Multi |
| T-044 | External reviewer recruitment | P0 | P7 | T-043 | S | 2w | M | L | H | Program Dir | ≥2 confirmed | Independence attest | Gov |
| T-045 | External review cycle | P0 | P7 | T-044 | M | 3w | H | L | H | External | REV-EXT-001 | Go/revise/stop | Sci+Ethics |

### E5. Reference impl & release (P8–P9)

| ID | Title | Priority | Parent | Deps | Cx | Dur | Sci | Eng | Risk | Owner | DoD | Acceptance | Review |
|----|-------|----------|--------|------|----|-----|-----|-----|------|-------|-----|------------|--------|
| T-050 | Reference impl plan (minimal scope lock) | P0 | P8 | T-045=go | S | 1w | M | H | H | Eng Lead | Scope exclusions explicit | No platform features | Arch+Sci |
| T-051 | Envelope validation reference | P0 | P8 | T-050 | L | 4–6w | M | H | H | Eng Lead | Validates SPEC envelopes | Clean-machine demo | Eng+Sec |
| T-052 | EB-0 scoring aid (minimal) | P1 | P8 | T-051 | M | 2–3w | M | H | M | Eng Lead | Assists VR-0/EB-0 | Matches scoring notes | Eng+Stats |
| T-053 | Security baseline for refimpl | P0 | P8 | T-051 | S | 1w | L | H | H | Sec Reviewer | Checklist pass | No secrets; supply chain note | Sec |
| T-054 | Public alpha release | P0 | P9 | T-052,T-053 | M | 2w | H | H | H | Program Dir | ALPHA-1 tagged | Cold-start test | Release+Ethics |

### E6. Federation & stewardship (P10–P12)

| ID | Title | Priority | Parent | Deps | Cx | Dur | Sci | Eng | Risk | Owner | DoD | Acceptance | Review |
|----|-------|----------|--------|------|----|-----|-----|-----|------|-------|-----|------------|--------|
| T-060 | Alliance outreach (non-binding talks) | P1 | P10 | T-001 | S | ongoing | M | L | M | Community Lead | Contact log | ≥3 serious conversations | Comm |
| T-061 | Federation pilot execution | P0 | P10 | T-054,T-060 | L | 2mo | H | H | H | Eng+Comm | FED-PILOT-1 | External attestation | Comm+Arch |
| T-062 | 18-month federation kill review | P0 | P10 | T-061 or timeout | S | 1w | H | L | H | Program Dir | Proceed/stop memo | SR07 applied | Gov+Ethics |
| T-063 | Contribution covenant + credit policy | P1 | P11 | T-054 | M | 2w | M | L | M | Community Lead | Policy published | First external contrib path | Comm |
| T-064 | Editor/funder briefing pack | P1 | P11 | T-020,T-054 | S | 1.5w | H | L | M | Science Lead | Pack reviewed | ≥1 external brief given | OpenSci |
| T-065 | Stewardship charter + succession | P1 | P12 | T-061 | M | 3w | M | M | H | Program Dir | STEWARD-1 | Tabletop exercise | Gov |
| T-066 | Domain pack admission policy | P2 | Future | T-065 | S | 1w | H | L | H | Science Lead | Policy forbids core capture | Written tests | Sci+Gov |

### E7. Explicitly deferred backlog (not started before unlock)

| ID | Title | Unlock | Priority |
|----|-------|--------|----------|
| T-100 | Agent coordination protocol | After ALPHA-1 + AI governance note | P2 |
| T-101 | First domain pack (host–pathogen relatedness) | After T-066 + P7 pass | P2 |
| T-102 | Community challenge v1 | After FED-PILOT-1 | P3 |
| T-103 | Multilingual documentation | After ALPHA-1 stable | P3 |
| T-104 | LLM narrative plugin policy | After T-100 | P3 |

**Rejected backlog (do not create tasks):** mimicry platform, autoimmune OS, CDS mode, database rebuilds, hypothesis-throughput KPIs.

---

# PART F — WORKFLOWS

## F1. Scientific workflow (traceability)

```text
Idea
 → Literature mapping (evidence candidates)
 → Evidence objects (graded)
 → Claim draft (unverified)
 → Method registration (protocol + search space)
 → Execution / analysis
 → Validation (VR / reproduction tier)
 → Contradiction & null update
 → Publication deposit (Reporting Standard)
 → Maintenance (supersession, retractions, reproductions)
```

**Trace rule:** Every publication claim ID must link Evidence IDs, Method ID, Validation IDs, and ProvenanceEnvelope ID.

## F2. Engineering workflow

```text
Architecture constraint (frozen)
 → Specification update
 → ADR (if constitutional)
 → Implementation (only post-P7 go for runtime)
 → Review (Eng + required others)
 → Testing (spec conformance + fixtures)
 → Validation (scientific acceptance where relevant)
 → Release Review
 → Maintenance / deprecation
```

**No shortcuts:** No impl without spec ID; no release without review matrix (§G).

## F3. AI workflow (authority map)

| Activity | AI allowed? | Human authority |
|----------|-------------|-----------------|
| Literature retrieval/structuring | Yes | Human accepts evidence grade |
| Draft claims | Yes (unverified) | Human promotes standing |
| Critique / contradiction suggestions | Yes | Human resolves |
| Statistics red-flag suggestions | Yes | Stats Lead confirms |
| Evidence grade assignment | Draft only | Human final |
| Kill-criteria evaluation | No | Governance |
| Clinical interpretation | **Never** | N/A (excluded) |
| Release approval | No | Release Review board |
| Benchmark key creation | Assist | Human locks keys |
| Marketing claims | No | Ethics+Program Dir |

**Mandatory:** Agent action audit log for any AI-assisted artifact entering the claim fabric.

## F4. Governance workflow

| Decision type | Process |
|---------------|---------|
| Architectural | ADR + Arch Review + Eng Lead |
| Scientific defaults | Sci Standards Committee + Sci Review |
| Breaking changes | ADR + migration note + major version + dual review |
| Benchmarks | Sci+Stats+OpenSci; keys sealed |
| Standards | Public comment window + committee ratification |
| Releases | Release Review checklist |
| Deprecations | Announce → wait policy → remove |
| Conflict resolution | Escalate Ethics → Governance vote |
| Community voting | Only on non-constitutional contrib process after P11; constitutional changes require committee |

---

# PART G — REVIEW SYSTEM

## G1. Review types

Scientific · Engineering · Security · Ethics · Statistical · Architecture · Performance · Publication · Release · Community

## G2. Mandatory reviews by artifact class

| Artifact | Mandatory reviews |
|----------|-------------------|
| Object/protocol specs | Scientific, Architecture; Statistical if scoring |
| MATH-STAT | Statistical, Scientific |
| Benchmarks | Scientific, Statistical, Open Science |
| Validation rubric | Scientific, Statistical |
| Exemplar dossier | Scientific, Ethics |
| Reference impl | Engineering, Security, Architecture, Scientific |
| Public release | Release, Ethics, Security, Open Science |
| Federation pilot | Community, Architecture |
| Domain pack admission | Scientific, Ethics, Governance |
| AI agent protocol | Ethics, Scientific, Security, Architecture |
| Marketing/announcement | Ethics, Program Dir |

---

# PART H — QUALITY SYSTEM

## H1. Quality gates (blocking)

| Gate | Threshold |
|------|-----------|
| Spec consistency | Dual-encoding concordance checklist pass |
| Stats credibility | Stats Lead sign-off on any numeric grade |
| Benchmark integrity | Anti-leakage doc present; keys sealed |
| Ethics | No clinical language in outputs/templates |
| Reproducibility | Stated tier met for released claims |
| Security | Baseline checklist for any executable |
| Release | All mandatory reviews recorded |

## H2. Coverage minima (program)

| Coverage | Minimum |
|----------|---------|
| Documentation | Every Mandatory backlog item maps to a deliverable ID |
| Scientific | Each core object has ≥1 worked example |
| Benchmark | EB-0 four families present before REFIMPL claims |
| Validation | VR-0 inter-rater pilot done before external review |
| Reproducibility | Exemplar states reproduction tier explicitly |
| Engineering (post-P8) | Spec-conformance tests for envelopes; no coverage vanity targets substituting science |

## H3. Acceptance thresholds (initial)

- Inter-rater agreement target: define in T-033; default **Cohen’s κ ≥ 0.6** on pilot or revise rubric.  
- External review: **proceed** requires no unresolved Critical scientific defects.  
- Federation kill: if no serious external reuse path by T-062 timeout → **stop or hard scope cut**.

---

# PART I — EXECUTION ROADMAP (DEPENDENCY UNLOCKS)

```text
Unlock 0: MEP active + roles (P0)
Unlock 1: Object specs (P1) 
Unlock 2: Math/stat protocols (P2) [needs Unlock 1]
Unlock 3: EB-0 + VR-0 (P3–P4) [needs Unlock 2]
Unlock 4: MLRP RC (P5) [needs Unlock 3]
Unlock 5: Internal clean (P6)
Unlock 6: External go (P7)  ★ software runtime may begin
Unlock 7: REFIMPL-0 (P8)
Unlock 8: Public Alpha (P9)
Unlock 9: Federation evidence (P10)
Unlock 10: Adoption mechanisms (P11)
Unlock 11: Stewardship hardened (P12)
```

**Calendar is forbidden as primary plan.** Duration estimates in backlog are capacity hints for a 2-person MLRP team through Unlock 4 (~6 months if focused). Post-MLRP staffing may expand; dependencies do not relax.

---

# PART J — BLOCKERS & MITIGATIONS

| ID | Class | Blocker | Mitigation |
|----|-------|---------|------------|
| B01 | Scientific | Relapse to mimicry/disease identity | T-000 enforcement; Ethics veto |
| B02 | Scientific | Pseudo-confidence scores | Stats mandatory on numeric grades |
| B03 | Engineering | Feature creep into platform | T-050 scope lock; Arch veto |
| B04 | Community | Ecosystem indifference | T-060 early; T-062 kill |
| B05 | Legal | License/tool conflicts | T-003/T-004 before wrapping |
| B06 | Operational | Bus factor (2 people) | Written specs; succession T-065 |
| B07 | Financial | Unfunded stewardship | Foundation posture; minimal core |
| B08 | Open Source | Capture / trademark misuse | Contribution covenant; ethics on branding |
| B09 | Research | Circular literature benchmarks | Synthetic-first EB-0; quarantine LIT sets |
| B10 | Governance | Unclear authority | T-001 RACI; committee for defaults |

---

# PART K — DECISION CLASSIFICATION REPOSITORY

Every future decision must be labeled as exactly one primary class:

| Class | Examples | Default process |
|-------|----------|-----------------|
| Architectural | Layer boundaries, federation interfaces | ADR + Arch Review |
| Scientific | Object semantics, domain pack admission | Sci Committee |
| Operational | Cadence, tooling choices for writing | Program Dir |
| Community | Credit, contribution rules | Community Lead + Gov |
| Governance | Votes, kill criteria application | Governance Review |
| Documentation | Editorial structure of specs | Science/Eng Lead |

Store in Decision Registry (T-002). No unlabeled constitutional change.

---

# PART L — MLRP TEAM OPERATING PLAN (2 RESEARCHERS / 6 MONTHS)

**Assumed roles split:** Researcher A (Science/Stats lead), Researcher B (Methods engineering/spec engineering lead). Program Director duties shared.

**Month-by-dependency targets (indicative capacity, not calendar authority):**

1. P0 + Claim/Evidence drafts  
2. Contradiction/Null/Provenance + Uncertainty catalog  
3. MATH-STAT v0 + Reporting Standard draft  
4. EB-0 design + cases  
5. VR-0 + exemplar  
6. MLRP assembly + internal review + external reviewer scheduling  

If slippage: **cut exemplar breadth, not specs/benchmarks.**

---

# PART M — DEFINITION OF PROGRAM SUCCESS (NEAR TERM)

**Success at MLRP:** External scientists can use SciROS Reporting Standard + EB-0/VR-0 without proprietary software, and rate the exemplar coherently.

**Success at Alpha:** Minimal reference validates envelopes; outsiders deposit a claim dossier.

**Success at Federation:** At least one external ecosystem pathway reuses the standard.

**Failure:** Beautiful docs with no external protocol uptake by kill review → terminate per T-062.

---

# PART N — CONSTITUTIONAL CLOSING STATEMENTS

1. This MEP is the **single source of truth for execution**.  
2. Strategic debate is closed; execution traces to task IDs.  
3. No implementation before **Unlock 6** except non-runtime spec/benchmark authoring.  
4. Anything not in Mandatory/Strongly Recommended/MLRP critical path is deferred or rejected.  
5. Scientific humility is an acceptance criterion, not a slogan.

---

**Document status:** MEP v1.0 — Approved for execution planning authority.  
**Next action:** Execute T-000 → T-001 immediately.

---

*End of Master Execution Plan.*

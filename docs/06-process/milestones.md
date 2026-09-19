# Milestones

**Status:** Process baseline  
**Objective mapping:** 31 — Milestones  

---

## Milestone register

### M0 — Documentation foundation gate

**Exit criteria:**

- All objective-mapped docs present and cross-linked.  
- Assumptions register initialized.  
- ADRs 0001–0005 accepted or explicitly deferred with owners.  
- Medical disclaimer finalized for product surfaces.  

**Deliverable:** Foundation docs tag `docs-v0.1`.

---

### M1 — Engineering bootstrap

**Exit criteria:**

- Monorepo builds empty packages.  
- CI lint/test harness runs.  
- Config schema validation works.  
- Disclaimer unit tests pass.  

---

### M2 — Data mirrors MVP

**Exit criteria:**

- ≥3 connectors with hashed snapshots.  
- Offline resolve works.  
- Context pack loader validates examples.  

---

### M3 — Scientific MVP

**Exit criteria:**

- `mimicry_mvp` pipeline succeeds on fixtures + demo dataset.  
- Hypotheses always explained.  
- Bundle export + congruence self-check.  
- Ethics lexicon tests pass on generated narratives.  

---

### M4 — Validation alpha

**Exit criteria:**

- Decoy calibration report published.  
- Independent re-run by a person not authoring the pipeline.  
- Performance baselines documented.  

---

### M5 — Public beta

**Exit criteria:**

- Tagged release with SBOM, LICENSE, CITATION.  
- Contributing guide exercised by external PR.  
- Security disclosure path live.  

---

### M6 — Stable v1

**Exit criteria:**

- SemVer `v1.0.0` with compatibility matrix.  
- Plugin contract stable.  
- Governance docs updated post-beta lessons.  

---

## Milestone tracking

Each milestone has a checklist issue template and a quality gate reference in [quality-gates.md](quality-gates.md).

# Scientific Reproducibility Strategy

**Status:** Science–engineering baseline  
**Objective mapping:** 23 — Scientific Reproducibility Strategy  

---

## Definition used by AIP

A result is **reproducible** if an independent operator, using the reproducibility bundle on a supported profile, obtains outputs that satisfy the **congruence policy** for that method.

Bit-identical reproducibility is a stricter mode, not always achievable with third-party binaries.

---

## Reproducibility bundle contents (minimum)

1. Software version / git SHA / image digest  
2. Environment lockfile hash  
3. Config files + hash  
4. Data snapshot IDs + content hashes  
5. Plugin versions  
6. Seeds  
7. Primary result artifacts + QC  
8. Manifest schema version  
9. Disclaimer + limitations refs  
10. Machine profile notes  

---

## Modes

| Mode | Guarantee |
|------|-----------|
| `strict` | Exact hashes for deterministic stages; fail on nondeterministic tools |
| `congruent` | Tolerances on scores/ranks |
| `best_effort` | Re-run allowed with warnings; for exploration only |

Default publication mode: `congruent` or `strict` when possible.

---

## Provenance graph

Capture stage-level edges: inputs → tool → outputs with hashes.  
See [provenance.md](provenance.md).

---

## Environment strategy

- Reference OCI images with digests.
- Document host kernel/arch limitations.
- Record CPU flags only if they affect numeric paths.

---

## Data immutability

Snapshots are append-only. Updates create new snapshot IDs.  
Re-runs must not silently float to “latest.”

---

## Independent reproduction protocol

1. Fetch bundle.  
2. Verify checksums.  
3. Pull image digest.  
4. Execute `aip reproduce bundle/`.  
5. Generate congruence report.  

---

## Publication guidance

Authors should deposit bundles alongside papers. AIP will provide a methods boilerplate citing versions and limitations.

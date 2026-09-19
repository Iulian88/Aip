# Configuration Management

**Status:** Engineering baseline  
**Objective mapping:** 26 — Configuration Management  

---

## Principles

1. **Schema-validated configs** — invalid configs never start runs.
2. **Immutable per run** — edits create new runs.
3. **Layered configuration** — defaults < profile < user config < CLI overrides.
4. **No secrets in config files** — references to env vars only.
5. **Conservative defaults** — research honesty over flashy recall.

---

## Config document types

| Type | Examples |
|------|----------|
| Pipeline config | stages enabled, resources |
| Rank config | weights, thresholds |
| Tool params | e-value, threads |
| Context pack ref | `ms@1.2.0` |
| Snapshot pins | source → snapshot id |
| Runtime profile | `standard`, `offline_rerun` |

---

## Example logical structure (illustrative)

```yaml
aip_config_version: 1
project:
  name: example
  context_pack: "t1d@0.3.0"
snapshots:
  uniprot: "2026.07.01"
  iedb: "2026.06.15"
pipeline:
  name: mimicry_mvp
  profile: standard
layers:
  sequence: { enabled: true, method: mmseqs, params: { sensitivity: 7.5 } }
  epitope: { enabled: true, include_predicted: false }
  hla: { enabled: false, alleles: [] }
rank:
  model: weighted_v1
  weights: { sequence: 0.5, epitope: 0.5 }
ethics:
  disclaimer_version: "1.0"
  high_sensitivity_warnings: true
```

---

## Override rules

CLI overrides MUST be recorded in manifest.  
Hidden overrides forbidden.

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `AIP_HOME` | Base dir |
| `AIP_DATA` | Mirror root |
| `AIP_ARTIFACTS` | Artifact root |
| `AIP_DATABASE_URL` | Service mode |
| `AIP_LOG_LEVEL` | Logging |

Secrets: `AIP_*_TOKEN` pattern; never logged.

---

## Config governance

Changes to **stable** keys follow SemVer.  
Experimental keys prefixed `experimental.`.

Default weight changes require scientific note in CHANGELOG and may require MAJOR if they materially alter interpretations without opt-in.

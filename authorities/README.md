# SciROS Authority Pin Tree

**Status:** FROZEN corpus — consume only · Sprint 1 pin index  

This tree **SHALL NOT** redefine SCI / ENC / SER / CONF / CERT / RPR / OPS meaning.

| Folder | Role |
|--------|------|
| `SCI/` | Pins to Scientific Core (SCI-000…006) |
| `ADR/` | Pins to ADR-0006 |
| `RA/` | Pins to RA-001 (filing as approved) |
| `DM/` | Pins to DM-001 |
| `ENC/` | Pins to ENC-001 |
| `SER/` | Pins to SER-001 / SER-JSON-001 |
| `RPR/` | Pins to RPR-001 |
| `OPS/` | Pins to OPS-001 |
| `CONF/` | Pins to CONF-001 |
| `CERT/` | Pins to CERT-001 / CERT-002 |
| `EXEC/` | Pins to EXEC-001…003 · IMP-001 |

Canonical on-disk Core texts currently live under `specs/scientific/` and `specs/architecture/` where filed. Chat-approved authorities remain binding as approved; filing copies must not alter normative text (EXEC-003).

See `pins.json` for the machine-readable pin manifest template.

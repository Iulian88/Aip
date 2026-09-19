# Backup and Recovery

**Status:** Operations baseline  

---

## What to back up (lab server)

- PostgreSQL metadata  
- Artifact object store  
- Config & secret references (not secret values in plaintext backups without encryption)  
- Mirror READY manifests (payloads optional if re-fetchable)  

---

## Objectives (defaults; deployers may adjust)

| System | RPO | RTO |
|--------|-----|-----|
| Metadata DB | ≤ 24h | ≤ 8h |
| Artifacts | ≤ 24h | ≤ 24h |

---

## Local CLI mode

Users responsible for their own artifact directories; document recommended backup practices.

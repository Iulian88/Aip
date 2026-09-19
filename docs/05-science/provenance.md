# Provenance Strategy

**Status:** Science–engineering baseline  

---

## Goals

Make it possible to answer: *What software, data, parameters, and steps produced this hypothesis?*

---

## Provenance model

W3C PROV-inspired concepts mapped to AIP:

| PROV idea | AIP object |
|-----------|------------|
| Entity | Artifact, snapshot, hypothesis |
| Activity | Pipeline stage execution |
| Agent | User, plugin, tool version |

Exports SHOULD be transformable to PROV-JSON or RO-Crate in later phases.

---

## Manifest minimum fields

- run_id, timestamps, status  
- software versions & image digest  
- config hash & inline config  
- snapshot map + hashes  
- stage graph with artifact hashes  
- seeds & nondeterminism flags  
- disclaimer stamp  

---

## Hashing

- SHA-256 for artifact bytes.  
- Canonical JSON hashing for configs (sorted keys).  

---

## User attribution

Record operator identity in server mode; local mode may use OS user or `anonymous` with warning for shared machines.

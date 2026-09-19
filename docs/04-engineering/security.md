# Security Strategy

**Status:** Engineering baseline  
**Objective mapping:** 24 — Security Strategy  
**Related:** [ethics.md](../00-governance/ethics.md), [SECURITY.md](../../SECURITY.md)

---

## Security posture

AIP is a **research software platform** handling primarily public biological data. Security priorities:

1. Protect users’ environments from supply-chain and code execution risks.
2. Prevent accidental introduction of PHI pathways.
3. Secure multi-user lab deployments.
4. Reduce dual-use facilitation through feature policy.

---

## Threat model (summary)

| Threat | Mitigation |
|--------|------------|
| Malicious dependency | Lockfiles, hashing, vulnerability scans, minimal deps |
| Compromised plugin | Plugin signing/review; sandboxed execution where feasible |
| Path traversal on artifact paths | Canonicalization & allowlists |
| SSRF via connectors | Allowlisted endpoints; offline mode |
| Secret leakage | `.env` hygiene; secret scanning; no secrets in manifests |
| Auth bypass in service mode | Mandatory authz tests |
| Model prompt injection in narrative gen | Grounded explanations only; lexicon gates |
| User uploads malware (future) | Not in v1; later virus scanning + type allowlists |

---

## v1 data classification

| Class | Examples | Controls |
|-------|----------|----------|
| Public scientific | UniProt, IEDB | License attribution |
| Operational | Run configs | Access control in T2 |
| Secrets | API tokens | Secret manager / env |
| PHI | Clinical records | **Out of scope / refuse** |

---

## Secure development practices

- PR reviews for security-sensitive paths (`connectors`, `service`, `plugins`).
- SAST + dependency scanning in CI.
- Container images scanned; run as non-root.
- Subprocess hardening for scientific tools.
- SBOM on releases.

---

## Authentication & authorization (T2)

- OIDC preferred for institutions.
- RBAC roles: `viewer`, `analyst`, `admin`.
- Admins cannot silently disable disclaimer stamping.

---

## Vulnerability disclosure

Public `SECURITY.md` with contact and disclosure timeline.  
Critical CI supply-chain issues may trigger emergency releases.

---

## Dual-use policy

Refuse features whose primary purpose is designing pathogens for harm.  
General similarity search remains (dual-use inherent to bioinformatics); project will not provide offensive playbooks.

---

## Assumptions

| ID | Assumption |
|----|------------|
| SEC-A1 | Institutional deployers handle network perimeter controls |
| SEC-A2 | Users do not paste identifiable patient sequences into public issues |

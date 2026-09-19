# Documentation Strategy

**Status:** Engineering baseline  
**Objective mapping:** 19 — Documentation Strategy  

---

## Documentation tiers

| Tier | Location | Audience | Update rule |
|------|----------|----------|-------------|
| T0 Vision/Ethics | `docs/00-governance` | All | ADR for material changes |
| T1 Architecture | `docs/03-architecture` | Implementers | Same PR as structural changes |
| T2 How-to | `docs/` tutorials (future) | Users | Updated with UX changes |
| T3 Package READMEs | `packages/*/README.md` | Developers | Per package |
| T4 API refs | Generated from schemas | Developers | CI-generated when code exists |
| T5 ADRs | `docs/adr` | Maintainers | Append-only decisions |

---

## Single source of truth

Conflicts resolve in favor of:

1. Ethics/disclaimer docs for claim language  
2. ADRs for architecture decisions  
3. Requirements docs for MUST behavior  
4. Package READMEs for local details  

---

## Writing standards

- Prefer precise SHALL/SHOULD language in requirements.
- Explicitly label assumptions.
- No fabricated citations; verify in [references.md](../08-reference/references.md).
- Keep diagrams as text/mermaid in markdown for diffability.

---

## Doc testing (when code exists)

- Link checkers in CI.
- Disclaimer presence tests.
- Tutorial smoke tests on sample data.

---

## Translation

English-first. Translation PRs welcome after v1 stabilization; ethics wording requires dual review.

---

## AI-generated documentation policy

AI may draft docs; humans must verify scientific and ethical claims. Unverified references are rejected.

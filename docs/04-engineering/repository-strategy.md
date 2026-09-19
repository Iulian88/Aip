# Repository Strategy

**Status:** Engineering baseline  
**Objective mapping:** 17 — Repository Strategy  
**Related:** [folder-structure.md](../03-architecture/folder-structure.md), [versioning.md](versioning.md)

---

## Decision

**Monorepo-first** for core platform packages, docs, fixtures, and workflows.  
Optional satellite repos later for heavyweight plugins or language-specific clients.

Justification: ADR 0001.

---

## Hosting & access

| Item | Policy |
|------|--------|
| Primary hosting | Public GitHub/GitLab (TBD by maintainers) |
| Default branch | `main` |
| Protection | Required reviews + CI green |
| Secrets | Never in git; scanning enabled |

---

## Branch model

- `main` — stable / releasable
- `release/x.y` — optional release maintenance
- `feat/*`, `fix/*`, `docs/*`, `chore/*` — short-lived
- `spike/*` — disposable experiments; not merged without cleanup

No long-lived personal branches as de facto mainlines.

---

## Commit conventions

Conventional Commits:

```text
feat(similarity): add mmseqs adapter contract tests
fix(explain): require contribution grounding
docs(ethics): clarify dual-use refusal
```

---

## Code ownership (planned)

`CODEOWNERS` maps:

- `/docs/00-governance/` → architects + ethics reviewers
- `/packages/aip-explain/` → explainability maintainers
- `/packages/aip-connectors/` → data eng maintainers

---

## Split criteria (when to leave monorepo)

Split a component if ALL true:

1. Independent release cadence required.
2. Different trust/security boundary.
3. Build cost harms core CI unreasonably.
4. External plugin community benefits from separate packaging.

---

## Binary & data policy

- Git LFS only for small essential binaries if unavoidable.
- Large mirrors never in git.
- Fixtures kept tiny and synthetic/public-domain where possible.

---

## Mirror repositories

If institutional mirrors are required, they MUST remain read-only mirrors with clear source-of-truth designation.

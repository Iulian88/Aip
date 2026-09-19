# Development Workflow

**Status:** Process baseline  
**Objective mapping:** 34 — Development Workflow  

---

## Workflow overview

```text
issue → design note/ADR (if needed) → branch → implement → tests → docs → PR → review → CI → merge → release train
```

---

## Issue triage labels (planned)

`science`, `engineering`, `ethics`, `data`, `docs`, `security`, `good-first-issue`, `wontfix-nongoal`

Issues requesting diagnosis features close with pointer to non-goals.

---

## Local development loop (planned)

1. Bootstrap via documented container/dev script.  
2. Run unit tests for touched packages.  
3. Run ethics checkers.  
4. Run e2e smoke if pipeline touched.  

---

## Pull request requirements

- Description: motivation, scientific impact, risk.  
- Checklist: tests, docs, disclaimer surfaces, assumptions updated.  
- No unrelated refactors.  

---

## Review rules

- 1 approving review minimum; 2 for ethics/science defaults.  
- Architecture changes need ADR link.  

---

## AI-assisted development rules

- Disclose significant AI authorship in PR if project policy requires.  
- Humans verify citations and numerical methods.  
- Agents follow [agents.md](agents.md).  

---

## Release workflow

See [release-management.md](release-management.md).

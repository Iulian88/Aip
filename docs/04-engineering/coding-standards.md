# Coding Standards

**Status:** Engineering baseline  
**Objective mapping:** 20 — Coding Standards  

---

## Languages

| Language | Role |
|----------|------|
| Python 3.11+ | Primary implementation |
| TypeScript/React | Optional web UI later |
| Nextflow/Snakemake DSL | Workflows |
| SQL | Metadata migrations |
| Markdown | Documentation |

---

## Python standards

- Formatter: Ruff format or Black (pick one in bootstrap; do not mix).
- Lint: Ruff.
- Types: `mypy`/`pyright` on public packages; `py.typed` markers.
- Docstrings: Google or NumPy style—consistent per package.
- Public APIs explicitly exported via `__all__` or `api.py`.
- No wildcard imports in library code.
- Prefer pure functions for scoring transforms; isolate I/O at edges.

---

## Scientific coding rules

1. Never hardcode thresholds without config + provenance.
2. Separate curated vs predicted data in types—not only in comments.
3. Floating comparisons use explicit tolerances.
4. Random seeds threaded through call stacks.
5. Tool wrappers capture stdout/stderr paths in manifests.
6. Forbidden: silent exception swallowing in pipeline stages.

---

## Ethics-in-code rules

- Ban diagnostic resource naming.
- Generated user text passes ethics lexicon checker.
- Disclaimer stamp utility used centrally—no bespoke “forgot to add disclaimer” paths.

---

## Testing expectations in code

- New scorer ⇒ unit + contract tests.
- New connector ⇒ schema validation tests + hash stability tests on fixtures.
- Bugfix ⇒ regression test required.

---

## Comments & complexity

- Comment *why*, especially statistical choices.
- Cyclomatic complexity soft gate; justify exceptions.
- No commented-out dead code in `main`.

---

## Security coding

- Parameterize subprocess calls safely; never `shell=True` with user strings.
- Validate paths to prevent traversal when reading run dirs.
- See [security.md](security.md).

---

## UI standards (future)

Follow institutional design system if any; otherwise accessible, calm research UI—not clinical alarm aesthetics.

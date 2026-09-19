# Dependency Management

**Status:** Engineering baseline  
**Objective mapping:** 25 — Dependency Management  

---

## Goals

- Reproducible environments.
- Minimal trustworthy dependency surface.
- Clear separation between Python libs and external scientific binaries.

---

## Python dependency tooling

**Assumption DEP-A1:** Prefer `uv` or `poetry` for lockfiles; final choice at bootstrap ADR. Requirements:

- Lockfile committed.
- Optional dependency groups: `dev`, `docs`, `bench`, `structure`.
- Hash-checked installs in CI release jobs.

---

## External scientific tools

Managed as:

1. Pinned versions in container images, and/or
2. Conda/micromamba env specs, and/or
3. Explicit download-with-checksum scripts.

Each tool wrapper declares version detection and fails if mismatch in strict mode.

---

## Dependency approval principles

| Allow | Avoid |
|-------|-------|
| Well-maintained scientific libs | Abandoned packages with broad permissions |
| Thin wrappers | Mega-frameworks unused |
| OSS licenses compatible with project license | Contradictory proprietary terms in core path |

New dependencies require justification in PR template.

---

## Vulnerability SLAs

| Severity | Response target |
|----------|-----------------|
| Critical | 7 days or document risk acceptance |
| High | 14 days |
| Medium | Next minor release |

---

## Vendoring policy

Vendor only when upstream unavailable; document reason and update plan.

---

## License compatibility review

Third-party tools called as binaries may have distinct licenses; document in [license-and-attribution.md](../08-reference/license-and-attribution.md) and user-facing `about`.

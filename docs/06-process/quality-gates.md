# Quality Gates

**Status:** Process baseline  

---

## PR gates

| Gate | Blocking? |
|------|-----------|
| Lint/format | Yes |
| Unit/contract tests | Yes |
| Ethics lexicon on changed narrative templates | Yes |
| Docs link for architecture changes | Yes |
| Heavy tool integration | No (unless labeled) |

---

## Release gates

| Gate | Blocking? |
|------|-----------|
| E2E MVP smoke | Yes |
| Disclaimer coverage tests | Yes |
| Repro congruence on reference bundle | Yes (from M3) |
| Vulnerability SLA exceptions documented | Yes |
| Scientific default change note | Yes if defaults changed |

---

## Override policy

Only project leads may override a gate with written justification in the release notes. Ethics disclaimer gates are **non-overridable**.

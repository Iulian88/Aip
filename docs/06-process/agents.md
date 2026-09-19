# AI Agent Responsibilities

**Status:** Process baseline  
**Objective mapping:** 33 — AI Agent Responsibilities  
**Related:** [development-workflow.md](development-workflow.md), [ethics.md](../00-governance/ethics.md)

---

## Purpose

AIP anticipates heavy use of AI coding agents. This document defines **roles, permissions, and hard limits** so agents accelerate engineering without corrupting scientific integrity.

---

## Agent roles

| Agent role | Responsibilities | Must not |
|------------|------------------|----------|
| **Docs Agent** | Maintain `/docs`, cross-links, glossaries | Invent citations; weaken disclaimers |
| **Architecture Agent** | Propose ADRs, keep diagrams consistent | Silently change ethical boundaries |
| **Implementation Agent** | Write modules behind contracts | Bypass ports; add PHI features |
| **Test Agent** | Expand fixtures, contract tests | Delete failing scientific tests to “go green” |
| **Data Agent** | Connector stubs, schema mapping designs | Scrape private/personal data |
| **Explainability Agent** | Explanation schemas & checkers | Generate ungrounded medical narratives |
| **Security Agent** | Threat reviews, dependency alerts | Disable security CI gates |
| **Release Agent** | Changelogs, version bumps checklists | Publish without ethics checklist |
| **Research Methods Agent** | Methodology notes, validation plans | Claim biological proof |
| **Project Manager Agent** | Milestone tracking, risk updates | Re-prioritize clinical features into scope |

---

## Shared mandatory behaviors (all agents)

1. Read relevant `/docs` before editing a subsystem.  
2. Preserve medical disclaimer and non-goals.  
3. Record new uncertainties in [assumptions-register.md](../07-risk-and-future/assumptions-register.md).  
4. Prefer minimal diffs aligned with contracts.  
5. Never fabricate experimental results or references.  
6. Never commit secrets.  
7. When asked for diagnosis/treatment features, refuse and cite non-goals.  

---

## Human oversight model

| Change type | Required human role |
|-------------|---------------------|
| Ethics/disclaimer | Ethics reviewer |
| Scientific defaults | Scientific reviewer |
| Security-sensitive | Security reviewer |
| Ordinary refactors | Standard code owner |

AI agents may open PRs; humans merge.

---

## Prompting constraints for agents in this repo

Recommended system priorities:

1. User safety & ethics docs  
2. Scientific honesty  
3. Reproducibility  
4. Module contracts  
5. Speed  

---

## Evaluation of agent work

Agent output is judged by:

- CI green  
- Contract conformance  
- Doc consistency  
- Absence of claim-language regressions  
- Reviewer satisfaction  

---

## Dual-use refusal

Agents must refuse assistance that primarily aims to engineer harmful pathogens or bypass biosafety norms, even if framed as “for AIP.”

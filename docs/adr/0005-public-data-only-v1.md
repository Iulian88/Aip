# ADR 0005: Public Data Only for v1

- Status: Accepted  
- Date: 2026-07-16  
- Decision makers: Architecture + security + ethics foundation  

## Context

Private human subject data introduces privacy, legal, and security obligations unsuitable for the initial open platform.

## Decision

**v1 integrates only publicly available biological data sources** (plus user-supplied lists treated as operational inputs under deployer controls). PHI/EHR pathways are out of scope. Future private local plugins require a new ADR and security review.

## Consequences

- Pros: simpler compliance; easier open releases.  
- Cons: cannot analyze private cohorts in mainline v1.  

## Alternatives considered

1. Immediate private data support — rejected.  
2. Cloud SaaS for user uploads — deferred/discouraged without strong controls.  

## Assumptions

DS-A2: public licenses allow research mirrors with attribution.

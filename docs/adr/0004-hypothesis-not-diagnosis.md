# ADR 0004: Hypothesis Not Diagnosis

- Status: Accepted  
- Date: 2026-07-16  
- Decision makers: Architecture + ethics foundation  

## Context

Molecular mimicry analyses are easily misread as medical conclusions. Product language and API shapes can accidentally imply diagnosis.

## Decision

AIP outputs are exclusively **computational hypotheses**. The system MUST:

- Use non-clinical resource naming.  
- Stamp disclaimers on results.  
- Reject features whose primary purpose is diagnosis/treatment.  

This is a permanent product boundary unless the organization re-charters under medical-device governance (not planned).

## Consequences

- Pros: ethical clarity; scientific honesty; lower legal risk.  
- Cons: reduced appeal to clinical/DTC markets (acceptable).  

## Alternatives considered

1. Dual “research vs clinical” modes — rejected (mode confusion risk).  
2. Clinical certification track — out of mission.  

## Assumptions

E-A1: primary users are researchers.

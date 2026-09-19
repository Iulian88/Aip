# T-001 — Role Charter (RACI)

**Task ID:** T-001  
**Status:** DONE  
**Owner Role:** Program Director  
**Depends on:** T-000  

---

## Purpose

Establish sole authorities for Science, Engineering, Ethics, Community, and Program direction so P0/P1 work can proceed without ambiguous ownership.

---

## Roles (seat = accountability; names TBD until filled)

Until a named human is assigned, the **seat remains accountable**. Unfilled seats block tasks that require that owner (see Status).

| Seat | Accountable for | MEP owner mapping |
|------|-----------------|-------------------|
| **Program Director** | MEP enforcement, unlocks, kill reviews, release authority coordination | Program Dir |
| **Science Lead** | Object/protocol specs, exemplar science, scientific review sign-off | Science Lead |
| **Engineering Lead** | Decision registry ops, compatibility matrix, later REFIMPL scope lock | Eng Lead |
| **Ethics Lead** | Non-clinical boundary, kill-criteria checklist ops, ethics review | Ethics Lead |
| **Statistics Lead** | MATH-STAT, numeric grades, EB-0/VR-0 stats sign-off | Stats Lead |
| **Community Lead** | Alliance contact log, contribution path (post-alpha) | Community Lead |
| **Security Reviewer** | Security baseline on any executable (P8+) | Sec Reviewer |

**Named assignees:** _UNASSIGNED — assign before T-010 starts if Science Lead empty; assign Engineering Lead before T-002._

---

## RACI (Responsible / Accountable / Consulted / Informed)

| Activity | Program Dir | Science | Eng | Ethics | Stats | Community |
|----------|:-----------:|:-------:|:---:|:------:|:-----:|:---------:|
| MEP amendments | A | C | C | C | I | I |
| Object specs (T-010+) | I | A/R | C | C | C | I |
| MATH-STAT | I | C | I | I | A/R | I |
| Benchmarks EB-0 | I | A | C | C | R | I |
| License decision (T-003) | A/R | I | C | C | I | I |
| Kill-criteria monitor (T-005) | C | I | I | A/R | I | I |
| REFIMPL scope (T-050) | A | C | R | C | I | I |
| Public announcements | A | C | I | R | I | C |
| Federation outreach | C | I | C | I | I | A/R |
| Clinical/CDS feature requests | A | C | I | **Veto** | I | I |

**Veto:** Ethics Lead may halt any artifact that implies diagnosis, treatment, or clinical decision support.

---

## Scientific Standards Committee (interim)

Until formalized at P12:

- Standing members: Science Lead, Statistics Lead, Ethics Lead  
- Program Director convenes  
- Defaults/changes to scientific objects require committee agreement recorded in Decision Registry  

---

## Staffing gate

| Condition | Effect |
|-----------|--------|
| Science Lead unassigned | **T-010 BLOCKED** |
| Engineering Lead unassigned | **T-002 BLOCKED** |
| Ethics Lead unassigned | **T-005 BLOCKED** (Program Director may temporarily act with recorded dual-control) |
| Statistics Lead unassigned | **T-016+ BLOCKED** |

---

## Assignment record

| Seat | Name | Date | Signature/ack |
|------|------|------|----------------|
| Program Director | _TBD_ | | |
| Science Lead | _TBD_ | | |
| Engineering Lead | _TBD_ | | |
| Ethics Lead | _TBD_ | | |
| Statistics Lead | _TBD_ | | |
| Community Lead | _TBD_ | | |
| Security Reviewer | _TBD_ | | |

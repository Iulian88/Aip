# Deployment Architecture

**Status:** Architectural baseline  
**Related:** [system-architecture.md](system-architecture.md), [security.md](../04-engineering/security.md)

---

## Deployment principles

1. Container-first reference deployment.
2. Same scientific images across laptop/lab/HPC where possible.
3. Configuration by environment + sealed secrets.
4. Research-only posture in all deployments.

---

## Topology T1 — Local researcher

```text
Developer/Researcher machine
  └─ OCI container (aip-runtime)
       ├─ CLI/SDK
       ├─ SQLite metadata
       ├─ ./data mirrors
       └─ ./artifacts
```

**Requirements:** Docker/Podman; disk for mirrors; CPU resources per profile.

---

## Topology T2 — Lab server

```text
               ┌────────────┐
               │ Reverse    │
               │ proxy/TLS  │
               └─────┬──────┘
                     │
               ┌─────▼──────┐
               │ aip-service│
               └─────┬──────┘
         ┌───────────┼───────────┐
         │           │           │
   ┌─────▼────┐ ┌────▼────┐ ┌────▼─────┐
   │ Postgres │ │ Queue   │ │ Workers  │
   └──────────┘ └─────────┘ │ (workflow│
                            │  engine) │
                            └────┬─────┘
                                 │
                         ┌───────▼────────┐
                         │ Shared storage │
                         └────────────────┘
```

**Auth:** OIDC or token auth mandatory.  
**Multi-tenancy:** soft tenancy by lab/group IDs; not a public SaaS multi-tenant marketplace in v1.

---

## Topology T3 — HPC / cloud batch

- Submit orchestrator jobs to Slurm/K8s.
- Use shared filesystem or object store for artifacts.
- Metadata DB optional (batch can be manifest-only with CLI).

---

## Environments

| Env | Purpose |
|-----|---------|
| `dev` | Contributors |
| `ci` | Automated tests |
| `staging` | Pre-release scientific validation |
| `prod-lab` | Institutional research deployment |

No “prod-clinical” environment is defined on purpose.

---

## Release artifacts

- Versioned OCI images (`aip-runtime:<semver>` + digest).
- SBOM attached to releases.
- Signed tags (project policy once tooling ready).

---

## Configuration injection

- Env vars for secrets.
- Mounted config maps for non-secret configs.
- See [configuration-management.md](../04-engineering/configuration-management.md).

---

## Observability in deployments

- Structured logs to stdout.
- Metrics endpoint in service mode.
- Retain run manifests even if UI purged.

---

## Deployment non-goals

- HIPAA-regulated clinical hosting as a product offering.
- Global public multi-tenant cloud that stores user biological uploads without institutional controls (future evaluation only with security ADR).

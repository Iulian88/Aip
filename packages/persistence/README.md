# @sciros/persistence

Infrastructure persistence boundary for SciROS (EXEC-SPRINT-015).

## Boundary

Persistence **stores and retrieves** already-authoritative artifacts. It does **not**:

- redefine Scientific Core semantics
- execute processor stages (S05/S06/S17)
- encode/decode (ENC-001) or serialize profiles (SER-001)
- run Reference Tests
- evaluate Conformance or issue Certification decisions

## Backend

Reference adapter: **deterministic in-memory store** (`MemoryPersistenceRepository`).

This proves the repository contract. It is **not** the production durable backend.
A future durable adapter MUST obey the same repository semantics.

## Identity

- Scientific `identity` is preserved exactly from the artifact.
- `storage_key` is storage metadata only and never replaces scientific identity.
- For Canonical Units, `storage_key` = `persist:CanonicalUnit:{unit_kind}:{identity}` so EvidenceUnit and GradeDesignationUnit (which share evidence identity) coexist without collision.
- Lookups that would be ambiguous without `unit_kind` return `INVALID_ID`.
- No `Date.now` / `Math.random` / `randomUUID` / wall-clock identity generation.

## Version / Authority

Versions and authority pins (`ontology_ref`, `spec_ref`, `encoding_authority`, `encoding_version`) are stored and returned exactly. Unsupported encoding versions → `UNSUPPORTED_VERSION`. Authority mismatch → `INVALID_AUTHORITY`.

## Immutability

All supported entity kinds are treated as immutable after `create`. `replace` of differing content → `IMMUTABLE_ENTITY`. Idempotent identical replace succeeds. Destructive `delete` → `DELETE_NOT_PERMITTED`.

## Events

Append-only journal via `appendEvent` / `getEvents`. Ordering is deterministic (`parent_identity`, `ordinal`, `event_id`).

## Transactions

`beginTransaction` uses a copy-on-write buffer. `commit` applies atomically to the store; `rollback` discards. Guarantees are those of the in-memory adapter (single-process atomicity), not distributed ACID.

## Snapshots

`snapshot` / `restore` use a deterministic representation (sorted entities + event journal, schema `1.0.0`). No wall-clock fields.

## Concurrency

Optimistic: `replace(..., { expected_version })` → `CONFLICT` on stale version.

## Shared port

`RepositoryPersistencePort` implements `@sciros/shared` `PersistencePort` for RPR hand-off without modifying the processor package in this sprint.

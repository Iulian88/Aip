# Data directory (planned)

This directory will hold **local** data mirrors and operational inputs.

**Do not commit large biological mirrors to git.**

See:

- [Data management](../docs/05-science/data-management.md)
- [Data sources](../docs/08-reference/data-sources.md)
- [Folder structure](../docs/03-architecture/folder-structure.md)

Planned layout:

```text
data/
  mirrors/<source>/<snapshot_id>/READY.json
  inputs/   # optional user lists (local)
```

# Security Policy

## Supported versions

During the documentation foundation phase, there is no shipped software runtime. Security issues in documentation that could cause unsafe implementation (e.g., advising `shell=True` with user input, disabling disclaimer gates) should still be reported.

## Reporting a vulnerability

Please report suspected security issues privately to the maintainers (contact TBD at first public release). Do not open public issues for unpatched vulnerabilities.

Include:

- Description and impact  
- Reproduction steps  
- Affected docs/components  

## Project security design

See **[docs/04-engineering/security.md](docs/04-engineering/security.md)**.

## Ethics-related incidents

Disclaimer bypasses or diagnostic-feature attempts may be treated with incident severity per [docs/09-operations/incident-response.md](docs/09-operations/incident-response.md).

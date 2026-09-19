# Observability

**Status:** Operations baseline  

---

## Goals

Diagnose failed runs, measure stage performance, and audit ethics-critical paths without collecting unnecessary personal data.

---

## Logs

Structured JSON logs with fields: `timestamp`, `level`, `run_id`, `stage_id`, `code`, `message`.  
Never log secrets or full raw credentials.

---

## Metrics

- runs_started/succeeded/failed  
- stage_duration_seconds  
- records_in/out  
- explanation_missing_count (should be 0)  

---

## Tracing

Optional OpenTelemetry in service mode.

---

## Privacy

Prefer run IDs over user emails in logs when possible; if user IDs required, restrict access.

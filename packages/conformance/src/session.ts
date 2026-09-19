/**
 * CONF-001 — ConformanceSession.
 * Holds ingested evidence for a single evaluation pass.
 */
import type { ReferenceReport } from "@sciros/reference-tests";
import { ingestReferenceReport, type ConformanceEvidence } from "./evidence.js";

/**
 * Session binding evidence to an evaluation.
 * SHALL NOT run Reference fixtures; only hold already-generated evidence.
 */
export class ConformanceSession {
  private evidence: ConformanceEvidence | null = null;

  /** Ingest a frozen ReferenceReport as the sole evidence source. */
  ingest(report: ReferenceReport): ConformanceEvidence {
    this.evidence = ingestReferenceReport(report);
    return this.evidence;
  }

  /** Current evidence, or null if not yet ingested. */
  getEvidence(): ConformanceEvidence | null {
    return this.evidence;
  }

  /** Require evidence; throws if session empty. */
  requireEvidence(): ConformanceEvidence {
    if (!this.evidence) {
      throw new Error("CONF-001: ConformanceSession has no ingested evidence");
    }
    return this.evidence;
  }

  clear(): void {
    this.evidence = null;
  }
}

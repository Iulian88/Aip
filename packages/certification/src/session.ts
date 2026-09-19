/**
 * CERT-002 — CertificationSession.
 * Holds ingested Conformance evidence for a single certification pass.
 */
import type { ConformanceReport } from "@sciros/conformance";
import {
  ingestConformanceReport,
  type CertificationEvidence,
} from "./evidence.js";

/**
 * Session binding Conformance evidence to a certification decision.
 * SHALL NOT run Reference fixtures or Conformance evaluation.
 */
export class CertificationSession {
  private evidence: CertificationEvidence | null = null;
  private sessionId: string | null = null;

  /**
   * Open a session with a deterministic session_id.
   * session_id must be non-empty; no wall-clock / random generation.
   */
  open(sessionId: string): void {
    const id = sessionId.trim();
    if (id.length < 1) {
      throw new Error("CERT-002: session_id must be non-empty");
    }
    this.sessionId = id;
    this.evidence = null;
  }

  /** Ingest a frozen ConformanceReport as the sole evidence source. */
  ingest(report: ConformanceReport): CertificationEvidence {
    if (!this.sessionId) {
      throw new Error("CERT-002: session not open");
    }
    this.evidence = ingestConformanceReport(report);
    return this.evidence;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getEvidence(): CertificationEvidence | null {
    return this.evidence;
  }

  requireSessionId(): string {
    if (!this.sessionId) {
      throw new Error("CERT-002: session not open");
    }
    return this.sessionId;
  }

  requireEvidence(): CertificationEvidence {
    if (!this.evidence) {
      throw new Error("CERT-002: CertificationSession has no ingested evidence");
    }
    return this.evidence;
  }

  clear(): void {
    this.evidence = null;
    this.sessionId = null;
  }
}

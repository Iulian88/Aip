import { evidenceNfcTrim } from "./identifiers.js";
import { EvidenceValidationError } from "./errors.js";
import {
  SOURCE_CLASSES,
  SOURCE_STATES,
  type EvidenceSource,
  type SourceClass,
  type SourceState,
} from "./types.js";

export class EvidenceSourceValidator {
  validate(source: unknown): EvidenceSource {
    if (!source || typeof source !== "object") {
      throw new EvidenceValidationError("F2", "source missing or not an object");
    }
    const s = source as Record<string, unknown>;
    if (typeof s.source_class !== "string") {
      throw new EvidenceValidationError("F2", "source.source_class missing");
    }
    if (!(SOURCE_CLASSES as readonly string[]).includes(s.source_class)) {
      throw new EvidenceValidationError(
        "F2",
        `source_class outside closed set: ${s.source_class}`,
      );
    }
    if (typeof s.source_locator !== "string") {
      throw new EvidenceValidationError("F2", "source.source_locator missing");
    }
    const locator = evidenceNfcTrim(s.source_locator);
    if (locator.length < 1 || locator === "unknown") {
      throw new EvidenceValidationError(
        "F2",
        "source_locator empty or equals unknown",
      );
    }
    if (typeof s.source_state !== "string") {
      throw new EvidenceValidationError("F2", "source.source_state missing");
    }
    if (!(SOURCE_STATES as readonly string[]).includes(s.source_state)) {
      throw new EvidenceValidationError(
        "F2",
        `source_state invalid: ${s.source_state}`,
      );
    }
    return Object.freeze({
      source_class: s.source_class as SourceClass,
      source_locator: locator,
      source_state: s.source_state as SourceState,
    });
  }

  equal(a: EvidenceSource, b: EvidenceSource): boolean {
    return (
      a.source_class === b.source_class &&
      evidenceNfcTrim(a.source_locator) === evidenceNfcTrim(b.source_locator) &&
      a.source_state === b.source_state
    );
  }
}

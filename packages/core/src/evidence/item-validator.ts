import { ITEM_ID, evidenceNfcTrim } from "./identifiers.js";
import { EvidenceValidationError } from "./errors.js";
import { ITEM_STATES, type EvidenceItem, type ItemState } from "./types.js";

export class EvidenceItemValidator {
  validateAll(items: unknown, recordState: string): readonly EvidenceItem[] {
    if (!Array.isArray(items)) {
      throw new EvidenceValidationError("F10", "items must be an array");
    }
    const seen = new Set<string>();
    const out: EvidenceItem[] = [];
    for (const raw of items) {
      out.push(this.validateOne(raw, seen));
    }
    if (recordState === "registered") {
      const active = out.filter((i) => i.item_state === "active");
      if (active.length < 1) {
        throw new EvidenceValidationError(
          "F10",
          "registered Evidence requires ≥1 Item with item_state=active",
        );
      }
    }
    return Object.freeze(out);
  }

  private validateOne(raw: unknown, seen: Set<string>): EvidenceItem {
    if (!raw || typeof raw !== "object") {
      throw new EvidenceValidationError("F10", "Evidence Item not an object");
    }
    const i = raw as Record<string, unknown>;
    if (typeof i.item_id !== "string" || !ITEM_ID.test(i.item_id)) {
      throw new EvidenceValidationError("F1", `Bad item_id: ${String(i.item_id)}`);
    }
    if (seen.has(i.item_id)) {
      throw new EvidenceValidationError("F1", `Duplicate item_id: ${i.item_id}`);
    }
    seen.add(i.item_id);
    if (typeof i.content_summary !== "string" || evidenceNfcTrim(i.content_summary).length < 1) {
      throw new EvidenceValidationError("F10", "item content_summary empty");
    }
    if (typeof i.item_state !== "string") {
      throw new EvidenceValidationError("F10", "item_state missing");
    }
    if (i.item_state === "claim") {
      throw new EvidenceValidationError("F10", "item_state must not be claim");
    }
    if (!(ITEM_STATES as readonly string[]).includes(i.item_state)) {
      throw new EvidenceValidationError("F10", `item_state invalid: ${i.item_state}`);
    }
    return Object.freeze({
      item_id: i.item_id,
      content_summary: evidenceNfcTrim(i.content_summary),
      item_state: i.item_state as ItemState,
      ...(typeof i.observation_ref === "string" ? { observation_ref: i.observation_ref } : {}),
      ...(typeof i.finding_ref === "string" ? { finding_ref: i.finding_ref } : {}),
      ...(typeof i.units === "string" ? { units: i.units } : {}),
      ...(typeof i.conditions === "string" ? { conditions: i.conditions } : {}),
    });
  }
}

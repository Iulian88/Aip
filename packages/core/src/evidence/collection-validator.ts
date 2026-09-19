import { COLLECTION_ID } from "./identifiers.js";
import { EvidenceValidationError } from "./errors.js";
import {
  COLLECTION_STATES,
  type CollectionState,
  type EvidenceCollection,
  type EvidenceItem,
} from "./types.js";

export class EvidenceCollectionValidator {
  validate(
    collection: unknown,
    items: readonly EvidenceItem[],
  ): EvidenceCollection | undefined {
    if (collection === undefined || collection === null) {
      return undefined;
    }
    if (typeof collection !== "object") {
      throw new EvidenceValidationError("F1", "collection not an object");
    }
    const c = collection as Record<string, unknown>;
    if (typeof c.collection_id !== "string" || !COLLECTION_ID.test(c.collection_id)) {
      throw new EvidenceValidationError(
        "F1",
        `Bad collection_id: ${String(c.collection_id)}`,
      );
    }
    if (!Array.isArray(c.member_item_ids)) {
      throw new EvidenceValidationError("F1", "member_item_ids must be an array");
    }
    const itemIds = new Set(items.map((i) => i.item_id));
    const members: string[] = [];
    for (const id of c.member_item_ids) {
      if (typeof id !== "string" || !itemIds.has(id)) {
        throw new EvidenceValidationError(
          "F1",
          `collection member_item_id not in items: ${String(id)}`,
        );
      }
      members.push(id);
    }
    if (typeof c.collection_state !== "string") {
      throw new EvidenceValidationError("F1", "collection_state missing");
    }
    if (!(COLLECTION_STATES as readonly string[]).includes(c.collection_state)) {
      throw new EvidenceValidationError(
        "F1",
        `collection_state invalid: ${c.collection_state}`,
      );
    }
    const state = c.collection_state as CollectionState;
    if ((state === "open" || state === "closed") && members.length < 1) {
      throw new EvidenceValidationError(
        "F1",
        "open/closed collection requires ≥1 member_item_ids",
      );
    }
    return Object.freeze({
      collection_id: c.collection_id,
      member_item_ids: Object.freeze(members),
      collection_state: state,
    });
  }
}

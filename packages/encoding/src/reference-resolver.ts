import {
  CLAIM_ID,
  CONTRADICTION_OBJECT_ID,
  EVIDENCE_ID,
  NEGATIVE_RESULT_OBJECT_ID,
  VERIFICATION_OBJECT_ID,
} from "@sciros/core";
import { CanonicalEncodingError } from "./errors.js";
import type { CanonicalReference, CanonicalTargetClass } from "./types.js";

const ONTOLOGY_PIN = /^SCI-000@0\.1\.[0-9]+$/;
const SPEC_PINS: Readonly<Record<CanonicalTargetClass | string, RegExp>> = {
  Claim: /^SCI-001@0\.1\.[0-9]+$/,
  Evidence: /^SCI-002@0\.1\.[0-9]+$/,
  Contradiction: /^SCI-004@0\.1\.[0-9]+$/,
  NegativeResult: /^SCI-005@0\.1\.[0-9]+$/,
  Verification: /^SCI-006@0\.1\.[0-9]+$/,
  Grade: /^SCI-003@0\.1\.[0-9]+$/,
};

/**
 * Grammar-only reference resolution — no store dereference (ENC-001 CE-3).
 */
export class CanonicalReferenceResolver {
  assertOntologyPin(pin: string): void {
    if (!ONTOLOGY_PIN.test(pin)) {
      throw new CanonicalEncodingError(
        "UNKNOWN_ONTOLOGY_PIN",
        `Unknown or invalid ontology pin: ${pin}`,
        { pin },
      );
    }
  }

  assertSpecPin(owner: string, pin: string): void {
    const re = SPEC_PINS[owner];
    if (!re || !re.test(pin)) {
      throw new CanonicalEncodingError(
        "UNKNOWN_SPEC_PIN",
        `Unknown or invalid spec pin for ${owner}: ${pin}`,
        { owner, pin },
      );
    }
  }

  assertIdentity(targetClass: CanonicalTargetClass, identity: string): void {
    const ok = this.matchesGrammar(targetClass, identity);
    if (!ok) {
      throw new CanonicalEncodingError(
        "BROKEN_REFERENCE",
        `Reference identity fails ${targetClass} grammar: ${identity}`,
        { targetClass, identity },
      );
    }
  }

  validateReference(ref: CanonicalReference): void {
    if (ref.target_class === "Extension") {
      if (typeof ref.identity !== "string" || ref.identity.trim().length < 1) {
        throw new CanonicalEncodingError(
          "BROKEN_REFERENCE",
          "Extension reference identity empty",
        );
      }
      return;
    }
    this.assertIdentity(ref.target_class, ref.identity);
  }

  matchesGrammar(targetClass: CanonicalTargetClass, identity: string): boolean {
    switch (targetClass) {
      case "Claim":
        return CLAIM_ID.test(identity);
      case "Evidence":
        return EVIDENCE_ID.test(identity);
      case "Contradiction":
        return CONTRADICTION_OBJECT_ID.test(identity);
      case "NegativeResult":
        return NEGATIVE_RESULT_OBJECT_ID.test(identity);
      case "Verification":
        return VERIFICATION_OBJECT_ID.test(identity);
      case "Extension":
        return typeof identity === "string" && identity.trim().length >= 1;
      default:
        return false;
    }
  }
}

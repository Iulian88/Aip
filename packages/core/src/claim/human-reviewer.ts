import { HUMAN_REVIEWER } from "./identifiers.js";
import { ClaimValidationError } from "./errors.js";

/** SCI-001 §12.7 — Human Reviewer recognition (Claim-local). */
export function isHumanReviewerAgent(authorityAgent: string): boolean {
  return HUMAN_REVIEWER.test(authorityAgent);
}

/**
 * Gate for promotions requiring Human Reviewer.
 * AI / non-human agents SHALL NEVER satisfy this gate.
 */
export function requireHumanReviewer(
  authorityAgent: string,
  context: string,
): void {
  if (!isHumanReviewerAgent(authorityAgent)) {
    throw new ClaimValidationError(
      "F4",
      `Human Reviewer required (${context}); authority_agent must match human: pattern`,
      { authority_agent: authorityAgent },
    );
  }
}

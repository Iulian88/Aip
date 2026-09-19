import {
  CLAIM_ID,
  CLAIM_VERSION,
  ONTOLOGY_REF,
  SPEC_REF,
  UTC_SECOND,
  nfcTrim,
} from "./identifiers.js";
import { ClaimValidationError } from "./errors.js";
import { isHumanReviewerAgent } from "./human-reviewer.js";
import { ClaimReferenceValidator } from "./reference-validator.js";
import {
  CLAIM_STANDINGS,
  FORBIDDEN_STANDING_VALUES,
  type Claim,
  type ClaimScope,
  type ClaimStanding,
  type StandingTransitionEvent,
} from "./types.js";

function isStanding(value: string): value is ClaimStanding {
  return (CLAIM_STANDINGS as readonly string[]).includes(value);
}

function validateScope(scope: unknown): ClaimScope {
  if (!scope || typeof scope !== "object") {
    throw new ClaimValidationError("F1", "scope missing or not an object");
  }
  const s = scope as Record<string, unknown>;
  for (const key of ["domain_context", "bounds", "exclusions"] as const) {
    if (typeof s[key] !== "string") {
      throw new ClaimValidationError("F1", `scope.${key} missing or not a string`);
    }
    const v = nfcTrim(s[key]);
    if (v.length < 1) {
      throw new ClaimValidationError("F1", `scope.${key} empty after NFC+trim`);
    }
  }
  const exclusions = nfcTrim(s.exclusions as string);
  // exclusions may be "none" or any non-empty string; empty forbidden above
  return Object.freeze({
    domain_context: nfcTrim(s.domain_context as string),
    bounds: nfcTrim(s.bounds as string),
    exclusions,
  });
}

function validateSte(event: StandingTransitionEvent, claimId: string): void {
  if (!event.event_id || !/^ste:[A-Za-z0-9._~-]{1,128}$/.test(event.event_id)) {
    throw new ClaimValidationError("F_TRANSITION", "Invalid STE event_id", { claimId });
  }
  if (!UTC_SECOND.test(event.at)) {
    throw new ClaimValidationError("F_TRANSITION", "STE.at must be YYYY-MM-DDThh:mm:ssZ", {
      claimId,
    });
  }
  if (
    event.from_standing !== "null" &&
    !isStanding(event.from_standing)
  ) {
    throw new ClaimValidationError("F6", "STE.from_standing invalid", { claimId });
  }
  if (!isStanding(event.to_standing)) {
    throw new ClaimValidationError("F6", "STE.to_standing invalid", { claimId });
  }
  if (nfcTrim(event.authority_agent).length < 1) {
    throw new ClaimValidationError("F_TRANSITION", "STE.authority_agent empty", { claimId });
  }
  if (nfcTrim(event.reason).length < 1) {
    throw new ClaimValidationError("F_TRANSITION", "STE.reason empty", { claimId });
  }
  if (event.to_standing === "supported") {
    if (!event.decision_ref || nfcTrim(event.decision_ref).length < 1) {
      throw new ClaimValidationError("F9", "STE to supported missing decision_ref", { claimId });
    }
  }
}

/**
 * Claim validator — every SCI-001 structural / Standing / SSR SHALL (machine-checkable).
 */
export class ClaimValidator {
  private readonly refs = new ClaimReferenceValidator();

  validate(claim: Claim): void {
    if (!CLAIM_ID.test(claim.claim_id)) {
      throw new ClaimValidationError("F6", `Bad claim_id: ${claim.claim_id}`);
    }
    if (!ONTOLOGY_REF.test(claim.ontology_ref)) {
      throw new ClaimValidationError("F8", `Bad ontology_ref: ${claim.ontology_ref}`);
    }
    if (!SPEC_REF.test(claim.spec_ref)) {
      throw new ClaimValidationError("F8", `Bad spec_ref: ${claim.spec_ref}`);
    }
    if (!CLAIM_VERSION.test(claim.claim_version)) {
      throw new ClaimValidationError("F8", `Bad claim_version: ${claim.claim_version}`);
    }

    const proposition = nfcTrim(claim.proposition);
    if (proposition.length < 1) {
      throw new ClaimValidationError("F1", "proposition empty after NFC+trim");
    }

    validateScope(claim.scope);

    if ((FORBIDDEN_STANDING_VALUES as readonly string[]).includes(claim.standing)) {
      throw new ClaimValidationError(
        "F6",
        `Standing must not be Workflow/RecordState/Grade/Outcome value: ${claim.standing}`,
      );
    }
    if (!isStanding(claim.standing)) {
      throw new ClaimValidationError("F6", `Standing not in SCI-000 enum: ${claim.standing}`);
    }

    if (claim.ethics_constraint_marker !== "non_clinical") {
      throw new ClaimValidationError("F2", "ethics_constraint_marker must be non_clinical");
    }

    if (nfcTrim(claim.created_by).length < 1) {
      throw new ClaimValidationError("F_TRANSITION", "created_by empty");
    }
    if (!UTC_SECOND.test(claim.created_at)) {
      throw new ClaimValidationError("F_TRANSITION", "created_at must be YYYY-MM-DDThh:mm:ssZ");
    }

    if (claim.ai_assisted === true) {
      if (!claim.human_sponsor || nfcTrim(claim.human_sponsor).length < 1) {
        throw new ClaimValidationError("F_AI", "ai_assisted requires non-empty human_sponsor");
      }
      if (claim.standing === "supported") {
        const log = claim.standing_transition_log ?? [];
        const ok = log.some(
          (e) =>
            e.from_standing === "draft_unverified" &&
            e.to_standing === "supported" &&
            isHumanReviewerAgent(e.authority_agent),
        );
        if (!ok) {
          throw new ClaimValidationError(
            "F_AI",
            "ai_assisted Claim at supported requires Human STE draft_unverified→supported",
          );
        }
      } else if (claim.standing !== "draft_unverified") {
        const log = claim.standing_transition_log ?? [];
        const anyHuman = log.some(
          (e) =>
            e.to_standing === claim.standing && isHumanReviewerAgent(e.authority_agent),
        );
        if (!anyHuman) {
          throw new ClaimValidationError(
            "F4",
            "ai_assisted non-draft Claim requires Human Reviewer STE",
          );
        }
      }
    }

    if (claim.is_hypothesis === true && claim.standing !== "draft_unverified") {
      throw new ClaimValidationError(
        "F_HYPOTHESIS",
        "is_hypothesis only allowed when standing=draft_unverified",
      );
    }

    this.refs.validateSupportedBy(claim.supported_by);
    this.refs.validateContestedBy(claim.contested_by);
    this.refs.validateQualifiedBy(claim.qualified_by);
    this.refs.validateVerifiedVia(claim.verified_via);

    if (claim.standing === "supported") {
      this.assertSsr1(claim);
    }
    if (claim.standing === "contested") {
      if (!claim.contested_by || claim.contested_by.length < 1) {
        throw new ClaimValidationError("F7", "contested requires ≥1 contested_by id");
      }
    }
    if (claim.standing === "retracted") {
      if (!claim.retraction_reason || nfcTrim(claim.retraction_reason).length < 1) {
        throw new ClaimValidationError("F_TRANSITION", "retracted requires retraction_reason");
      }
    }
    if (claim.standing === "superseded") {
      if (!claim.superseded_by || nfcTrim(claim.superseded_by).length < 1) {
        throw new ClaimValidationError("F_TRANSITION", "superseded requires superseded_by");
      }
      this.refs.validateClaimIdRef(claim.superseded_by, "superseded_by");
    }
    if (claim.supersedes) {
      this.refs.validateClaimIdRef(claim.supersedes, "supersedes");
    }

    // C-ETH
    if (claim.standing !== "draft_unverified") {
      const log = claim.standing_transition_log ?? [];
      const ack = log.some(
        (e) =>
          isHumanReviewerAgent(e.authority_agent) &&
          e.reason.includes("clinical_boundary_ack"),
      );
      if (!ack) {
        throw new ClaimValidationError(
          "F_C_ETH",
          "C-ETH: non-draft Standing requires STE with clinical_boundary_ack in reason",
        );
      }
    }

    const log = claim.standing_transition_log ?? [];
    const seenSte = new Set<string>();
    for (const ste of log) {
      validateSte(ste, claim.claim_id);
      if (seenSte.has(ste.event_id)) {
        throw new ClaimValidationError("F_TRANSITION", `Duplicate STE event_id ${ste.event_id}`);
      }
      seenSte.add(ste.event_id);
      if (
        ste.to_standing === "supported" ||
        ste.to_standing === "contested" ||
        ste.to_standing === "superseded" ||
        ste.to_standing === "retracted"
      ) {
        if (!isHumanReviewerAgent(ste.authority_agent)) {
          throw new ClaimValidationError(
            "F4",
            "Non-human authority_agent on gated Standing transition",
            { event_id: ste.event_id },
          );
        }
      }
    }

    if (claim.standing !== "draft_unverified") {
      const hasTo = log.some((e) => e.to_standing === claim.standing);
      if (!hasTo) {
        throw new ClaimValidationError(
          "F_TRANSITION",
          `Standing ${claim.standing} requires matching STE in standing_transition_log`,
        );
      }
    }
  }

  private assertSsr1(claim: Claim): void {
    if (!claim.supported_by || claim.supported_by.length < 1) {
      throw new ClaimValidationError("F3", "supported requires ≥1 supported_by Evidence id");
    }
    this.refs.validateSupportedBy(claim.supported_by);
    const log = claim.standing_transition_log ?? [];
    const ste = log.find(
      (e) =>
        e.to_standing === "supported" &&
        isHumanReviewerAgent(e.authority_agent) &&
        e.decision_ref !== undefined &&
        nfcTrim(e.decision_ref).length >= 1,
    );
    if (!ste) {
      throw new ClaimValidationError(
        "F3",
        "SSR-1 requires Human STE to supported with decision_ref",
      );
    }
  }
}

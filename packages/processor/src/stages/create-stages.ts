import type { AuthorityEngine } from "../authority/authority-engine.js";
import type { AuthorityGate } from "../authority/authority-gate.js";
import type { PinEngine } from "../authority/pin-engine.js";
import type { ProcessorContext } from "../context.js";
import { withAuthoritySet } from "../context.js";
import type { EventEngine } from "../engines/event-engine.js";
import type { TransitionEngine } from "../engines/transition-engine.js";
import {
  isClaimLike,
  isContradictionLike,
  isEvidenceLike,
  isNegativeResultContentLike,
  isNegativeResultLike,
  isVerificationLike,
  type ValidationEngine,
} from "../engines/validation-engine.js";
import type { VersionEngine } from "../engines/version-engine.js";
import { ProcessorError, isProcessorError } from "../errors.js";
import type { EncodingHook } from "../hooks/encoding-hook.js";
import type { PersistenceHook } from "../hooks/persistence-hook.js";
import type { SerializationHook } from "../hooks/serialization-hook.js";
import {
  ClaimReferenceValidator,
  ContradictionReferenceValidator,
  EvidenceReferenceValidator,
  NegativeResultReferenceValidator,
  VerificationReferenceValidator,
  type Claim,
  type Contradiction,
  type ContradictionRecordTransitionInput,
  type CreateNegativeResultInput,
  type Evidence,
  type EvidenceRecordTransitionInput,
  type GradeAssignmentInput,
  type NegativeResult,
  type NegativeResultRecordTransitionInput,
  type StandingTransitionInput,
  type Verification,
  type VerificationRecordTransitionInput,
} from "@sciros/core";
import {
  failedResult,
  okResult,
  skippedResult,
  type StageHandler,
  type StageId,
  type StageInput,
  type StageResult,
} from "./types.js";

export interface StageDependencies {
  authorityEngine: AuthorityEngine;
  pinEngine: PinEngine;
  authorityGate: AuthorityGate;
  validationEngine: ValidationEngine;
  versionEngine: VersionEngine;
  transitionEngine: TransitionEngine;
  eventEngine: EventEngine;
  encodingHook: EncodingHook;
  serializationHook: SerializationHook;
  persistenceHook: PersistenceHook;
  /** Updates the pipeline context box when S01 freezes authorities. */
  bindAuthorityContext: (ctx: ProcessorContext) => void;
}

function timed(
  stageId: StageId,
  name: string,
  fn: (ctx: ProcessorContext, input: StageInput) => Promise<StageResult>,
): StageHandler {
  return {
    stageId,
    name,
    async run(ctx, input) {
      const start = Date.now();
      const span = ctx.tracer.startSpan(`stage.${stageId}`);
      span.setAttribute("stage", stageId);
      ctx.logger.debug("stage.start", {
        stageId,
        executionId: ctx.executionId,
        correlationId: ctx.correlationId,
      });
      try {
        const result = await fn(ctx, input);
        const durationMs = Date.now() - start;
        ctx.metrics.timing("processor.stage.duration_ms", durationMs, { stage: stageId });
        ctx.metrics.increment("processor.stage.complete", {
          stage: stageId,
          status: result.status,
        });
        ctx.logger.info("stage.end", {
          stageId,
          status: result.status,
          durationMs,
        });
        span.end();
        return { ...result, durationMs };
      } catch (err) {
        const durationMs = Date.now() - start;
        const error = isProcessorError(err)
          ? err
          : new ProcessorError("StageFailure", `Stage ${stageId} failed`, {
              stageId,
              cause: err,
            });
        ctx.metrics.increment("processor.stage.failed", { stage: stageId, code: error.code });
        ctx.logger.error("stage.failed", {
          stageId,
          code: error.code,
          message: error.message,
        });
        span.end();
        return failedResult(stageId, { payload: input.payload }, error, durationMs);
      }
    },
  };
}

export function createStageHandlers(deps: StageDependencies): readonly StageHandler[] {
  const claimRefs = new ClaimReferenceValidator();
  const evidenceRefs = new EvidenceReferenceValidator();
  const contradictionRefs = new ContradictionReferenceValidator();
  const negativeResultRefs = new NegativeResultReferenceValidator();
  const verificationRefs = new VerificationReferenceValidator();

  const s01 = timed("S01", "LoadAuthorities", async (ctx, input) => {
    const catalog = await deps.authorityEngine.loadAndFreeze(input.requestedPins);
    deps.bindAuthorityContext(withAuthoritySet(ctx, catalog));
    return okResult(
      "S01",
      {
        payload: input.payload,
        notes: [`frozen:${catalog.pinManifestId}`, `pins:${catalog.pins.length}`],
      },
      0,
    );
  });

  const s02 = timed("S02", "VerifyPins", async (ctx, input) => {
    const catalog = deps.authorityGate.verifyFrozen(ctx.authoritySet);
    deps.pinEngine.verifyRequestedVersions(catalog, input.requestedPins);
    deps.pinEngine.verifyOntologyAndSpecPins(catalog);
    return okResult("S02", { payload: input.payload, notes: ["pins:verified"] }, 0);
  });

  const s03 = timed("S03", "SpecCompatibility", async (ctx, input) => {
    const catalog = deps.authorityGate.verifyFrozen(ctx.authoritySet);
    deps.authorityGate.verifyCompatibility(catalog, [
      "SCI-000",
      "SCI-001",
      "SCI-002",
      "SCI-003",
      "SCI-004",
      "SCI-005",
      "SCI-006",
      "RPR-001",
      "EXEC-003",
    ]);
    return okResult("S03", { payload: input.payload, notes: ["compat:ok"] }, 0);
  });

  const s04 = timed("S04", "EncodingBinding", async (ctx, input) => {
    if (!deps.encodingHook.available) {
      if (ctx.configuration.requireEncoding) {
        throw new ProcessorError("EncodingUnavailable", "Encoding required but not bound", {
          stageId: "S04",
        });
      }
      return skippedResult("S04", { payload: input.payload, notes: ["encoding:unbound"] }, 0);
    }
    deps.authorityGate.rejectIfMissing(ctx.authoritySet, "ENC-001");
    return okResult("S04", { payload: input.payload, notes: ["encoding:bound"] }, 0);
  });

  const s05 = timed("S05", "SerializationBinding", async (ctx, input) => {
    if (!deps.serializationHook.available) {
      if (ctx.configuration.requireSerialization) {
        throw new ProcessorError(
          "SerializationUnavailable",
          "Serialization required but not bound",
          { stageId: "S05" },
        );
      }
      return skippedResult("S05", { payload: input.payload, notes: ["serialization:unbound"] }, 0);
    }
    // RPR-001 S05: bind declared serialization framework only — no decode / no project.
    deps.authorityGate.rejectIfMissing(ctx.authoritySet, "SER-001");
    deps.authorityGate.rejectIfMissing(ctx.authoritySet, "SER-JSON-001");
    return okResult("S05", {
      payload: input.payload,
      notes: [
        "serialization:bound",
        "authority:SER-001",
        "authority:SER-JSON-001",
        "binding:ready",
      ],
    }, 0);
  });

  const s06 = timed("S06", "Decode", async (ctx, input) => {
    if (!deps.serializationHook.available) {
      return skippedResult("S06", { payload: input.payload, notes: ["decode:skipped"] }, 0);
    }
    // RPR-001 S06: decode inbound profile instance → candidate (no export projection).
    const decoded = await deps.serializationHook.decode(input.payload);
    return okResult("S06", { payload: decoded, notes: ["decode:ok"] }, 0);
  });

  const s07 = timed("S07", "CanonicalEncoding", async (ctx, input) => {
    if (!deps.encodingHook.available) {
      return skippedResult("S07", { payload: input.payload, notes: ["canonical:skipped"] }, 0);
    }
    const unit = await deps.encodingHook.assemble(input.payload);
    const intact = await deps.encodingHook.verify(unit);
    if (!intact) {
      throw new ProcessorError("StageFailure", "Canonical unit not intact", { stageId: "S07" });
    }
    return okResult("S07", { payload: unit, notes: ["canonical:ok"] }, 0);
  });

  const s08 = timed("S08", "ObjectValidation", async (ctx, input) => {
    if (!deps.validationEngine.isAvailable()) {
      return skippedResult(
        "S08",
        { payload: input.payload, notes: ["validation:unavailable"] },
        0,
      );
    }
    const unit = resolveKnowledgeObject(input.payload);
    if (!unit) {
      return skippedResult(
        "S08",
        { payload: input.payload, notes: ["validation:skipped-non-ko"] },
        0,
      );
    }
    await deps.validationEngine.validate(unit);
    const kind = isClaimLike(unit)
      ? "claim"
      : isEvidenceLike(unit)
        ? "evidence"
        : isContradictionLike(unit)
          ? "contradiction"
          : isNegativeResultLike(unit)
            ? "negative_result"
            : "verification";
    return okResult("S08", { payload: input.payload, notes: [`validation:${kind}-ok`] }, 0);
  });

  const s09 = timed("S09", "ReferenceIntegrity", async (_ctx, input) => {
    // SCI-001 / SCI-002 / SCI-004 / SCI-005 / SCI-006 own grammars independently — no symmetry.
    const claim = resolveClaim(input.payload);
    const evidence = resolveEvidence(input.payload);
    const contradiction = resolveContradiction(input.payload);
    const negativeResult = resolveNegativeResult(input.payload);
    const negativeResultContent = resolveNegativeResultContent(input.payload);
    const verification = resolveVerification(input.payload);
    if (claim) {
      claimRefs.validateSupportedBy(claim.supported_by);
      return okResult("S09", { payload: input.payload, notes: ["refs:claim-supported_by"] }, 0);
    }
    if (evidence) {
      evidenceRefs.validateBearsOn(evidence.bears_on);
      return okResult("S09", { payload: input.payload, notes: ["refs:evidence-bears_on"] }, 0);
    }
    if (contradiction) {
      contradictionRefs.validateInvolvedClaims(contradiction.involved_claims);
      contradictionRefs.validateEvidenceRefs(contradiction.evidence_refs);
      return okResult(
        "S09",
        { payload: input.payload, notes: ["refs:contradiction-claims-evidence"] },
        0,
      );
    }
    if (negativeResult || negativeResultContent) {
      const subject = negativeResult ?? negativeResultContent!;
      negativeResultRefs.validateClaimRefs(subject.claim_refs);
      negativeResultRefs.validateEvidenceRefs(subject.evidence_refs);
      negativeResultRefs.validateContradictionRefs(subject.contradiction_refs);
      negativeResultRefs.validateVerificationRefs(subject.verification_refs);
      return okResult(
        "S09",
        { payload: input.payload, notes: ["refs:negative-result-claims-evidence"] },
        0,
      );
    }
    if (verification) {
      verificationRefs.validateClaimRefs(verification.claim_refs);
      verificationRefs.validateEvidenceRefs(verification.evidence_refs);
      verificationRefs.validateContradictionRefs(verification.contradiction_refs);
      verificationRefs.validateNegativeResultRefs(verification.negative_result_refs);
      verificationRefs.validateGradeRefs(verification.grade_refs);
      return okResult(
        "S09",
        { payload: input.payload, notes: ["refs:verification-claims-evidence-nr"] },
        0,
      );
    }
    return skippedResult(
      "S09",
      { payload: input.payload, notes: ["refs:skipped-non-ko"] },
      0,
    );
  });

  const s10 = timed("S10", "MaterialVersionEval", async (_ctx, input) => {
    if (isVersionPairPayload(input.payload)) {
      const plan = deps.versionEngine.plan(input.payload.prior, input.payload.proposed);
      if (
        plan.action === "bump" &&
        isEvidenceLike(input.payload.prior) &&
        isEvidenceLike(input.payload.proposed)
      ) {
        const next = deps.versionEngine.applyEvidenceMaterialUpdate(input.payload.prior, {
          summary: input.payload.proposed.summary,
          source: input.payload.proposed.source,
          provenance: input.payload.proposed.provenance,
          items: input.payload.proposed.items,
          grade_ref: input.payload.proposed.grade_ref,
          ...(input.payload.proposed.collection
            ? { collection: input.payload.proposed.collection }
            : {}),
        });
        return okResult(
          "S10",
          { payload: next, notes: [`version:${plan.action}`, "evidence:bumped"] },
          0,
        );
      }
      if (
        plan.action === "bump" &&
        isClaimLike(input.payload.prior) &&
        isClaimLike(input.payload.proposed)
      ) {
        const next = deps.versionEngine.applyClaimMaterialUpdate(
          input.payload.prior,
          input.payload.proposed,
        );
        return okResult(
          "S10",
          { payload: next, notes: [`version:${plan.action}`, "claim:bumped"] },
          0,
        );
      }
      if (
        plan.action === "bump" &&
        isContradictionLike(input.payload.prior) &&
        isContradictionLike(input.payload.proposed)
      ) {
        const next = deps.versionEngine.applyContradictionMaterialUpdate(
          input.payload.prior,
          {
            summary: input.payload.proposed.summary,
            involved_claims: input.payload.proposed.involved_claims,
            overlap_statement: input.payload.proposed.overlap_statement,
            incompatibility_statement: input.payload.proposed.incompatibility_statement,
            provenance: input.payload.proposed.provenance,
            ...(input.payload.proposed.evidence_refs
              ? { evidence_refs: input.payload.proposed.evidence_refs }
              : {}),
            ...(input.payload.proposed.resolution_note
              ? { resolution_note: input.payload.proposed.resolution_note }
              : {}),
          },
        );
        return okResult(
          "S10",
          { payload: next, notes: [`version:${plan.action}`, "contradiction:bumped"] },
          0,
        );
      }
      if (
        plan.action === "bump" &&
        isNegativeResultLike(input.payload.prior) &&
        isNegativeResultLike(input.payload.proposed)
      ) {
        const next = deps.versionEngine.applyNegativeResultMaterialUpdate(
          input.payload.prior,
          {
            summary: input.payload.proposed.summary,
            description: input.payload.proposed.description,
            expected_observation: input.payload.proposed.expected_observation,
            observed_absence: input.payload.proposed.observed_absence,
            scope: input.payload.proposed.scope,
            protocol_ref: input.payload.proposed.protocol_ref,
            sensitivity_context: input.payload.proposed.sensitivity_context,
            provenance: input.payload.proposed.provenance,
            ...(input.payload.proposed.claim_refs
              ? { claim_refs: input.payload.proposed.claim_refs }
              : {}),
            ...(input.payload.proposed.evidence_refs
              ? { evidence_refs: input.payload.proposed.evidence_refs }
              : {}),
            ...(input.payload.proposed.contradiction_refs
              ? { contradiction_refs: input.payload.proposed.contradiction_refs }
              : {}),
            ...(input.payload.proposed.verification_refs
              ? { verification_refs: input.payload.proposed.verification_refs }
              : {}),
          },
        );
        return okResult(
          "S10",
          { payload: next, notes: [`version:${plan.action}`, "negative-result:bumped"] },
          0,
        );
      }
      if (
        plan.action === "bump" &&
        isVerificationLike(input.payload.prior) &&
        isVerificationLike(input.payload.proposed)
      ) {
        const next = deps.versionEngine.applyVerificationMaterialUpdate(
          input.payload.prior,
          {
            summary: input.payload.proposed.summary,
            description: input.payload.proposed.description,
            scope: input.payload.proposed.scope,
            protocol_ref: input.payload.proposed.protocol_ref,
            verification_method: input.payload.proposed.verification_method,
            verification_context: input.payload.proposed.verification_context,
            verification_rationale: input.payload.proposed.verification_rationale,
            provenance: input.payload.proposed.provenance,
            ...(input.payload.proposed.claim_refs
              ? { claim_refs: input.payload.proposed.claim_refs }
              : {}),
            ...(input.payload.proposed.evidence_refs
              ? { evidence_refs: input.payload.proposed.evidence_refs }
              : {}),
            ...(input.payload.proposed.grade_refs
              ? { grade_refs: input.payload.proposed.grade_refs }
              : {}),
            ...(input.payload.proposed.contradiction_refs
              ? { contradiction_refs: input.payload.proposed.contradiction_refs }
              : {}),
            ...(input.payload.proposed.negative_result_refs
              ? { negative_result_refs: input.payload.proposed.negative_result_refs }
              : {}),
            ...(input.payload.proposed.artifact_ref
              ? { artifact_ref: input.payload.proposed.artifact_ref }
              : {}),
          },
        );
        return okResult(
          "S10",
          { payload: next, notes: [`version:${plan.action}`, "verification:bumped"] },
          0,
        );
      }
      return okResult(
        "S10",
        { payload: input.payload.proposed ?? input.payload, notes: [`version:${plan.action}`] },
        0,
      );
    }
    const plan = deps.versionEngine.plan(null, input.payload);
    return okResult(
      "S10",
      { payload: input.payload, notes: [`version:${plan.action}`] },
      0,
    );
  });

  const s11 = timed("S11", "TransitionLegality", async (_ctx, input) => {
    if (!deps.transitionEngine.isAvailable()) {
      return skippedResult(
        "S11",
        { payload: input.payload, notes: ["transition:unavailable"] },
        0,
      );
    }
    if (isClaimStandingTransitionRequest(input.payload)) {
      const body = input.payload;
      if (!isClaimLike(body.claim)) {
        throw new ProcessorError("StageFailure", "S11 requires Claim payload", {
          stageId: "S11",
        });
      }
      deps.transitionEngine.assertLegality(body.claim, body.standingTransition.to);
      return okResult("S11", { payload: input.payload, notes: ["transition:claim-legal"] }, 0);
    }
    if (isEvidenceRecordTransitionRequest(input.payload)) {
      const body = input.payload;
      if (!isEvidenceLike(body.evidence)) {
        throw new ProcessorError("StageFailure", "S11 requires Evidence payload", {
          stageId: "S11",
        });
      }
      deps.transitionEngine.assertEvidenceLegality(body.evidence, body.recordTransition.to);
      return okResult(
        "S11",
        { payload: input.payload, notes: ["transition:evidence-legal"] },
        0,
      );
    }
    if (isEvidenceGradeAssignmentRequest(input.payload)) {
      const body = input.payload;
      if (!isEvidenceLike(body.evidence)) {
        throw new ProcessorError("StageFailure", "S11 requires Evidence payload", {
          stageId: "S11",
        });
      }
      deps.transitionEngine.assertGradeAssignmentLegal(
        body.evidence,
        body.gradeAssignment,
      );
      return okResult(
        "S11",
        { payload: input.payload, notes: ["transition:grade-legal"] },
        0,
      );
    }
    if (isContradictionRecordTransitionRequest(input.payload)) {
      const body = input.payload;
      if (!isContradictionLike(body.contradiction)) {
        throw new ProcessorError("StageFailure", "S11 requires Contradiction payload", {
          stageId: "S11",
        });
      }
      deps.transitionEngine.assertContradictionLegality(
        body.contradiction,
        body.contradictionTransition.to,
      );
      return okResult(
        "S11",
        { payload: input.payload, notes: ["transition:contradiction-legal"] },
        0,
      );
    }
    if (isNegativeResultRecordTransitionRequest(input.payload)) {
      const body = input.payload;
      deps.transitionEngine.assertNegativeResultLegality(
        body.negativeResult,
        body.negativeResultTransition.to,
      );
      return okResult(
        "S11",
        { payload: input.payload, notes: ["transition:negative-result-legal"] },
        0,
      );
    }
    if (isVerificationRecordTransitionRequest(input.payload)) {
      const body = input.payload;
      if (!isVerificationLike(body.verification)) {
        throw new ProcessorError("StageFailure", "S11 requires Verification payload", {
          stageId: "S11",
        });
      }
      deps.transitionEngine.assertVerificationLegality(
        body.verification,
        body.verificationTransition.to,
      );
      return okResult(
        "S11",
        { payload: input.payload, notes: ["transition:verification-legal"] },
        0,
      );
    }
    return skippedResult(
      "S11",
      { payload: input.payload, notes: ["transition:skipped-no-request"] },
      0,
    );
  });

  const s12 = timed("S12", "AuthorityGates", async (ctx, input) => {
    deps.authorityGate.verifyFrozen(ctx.authoritySet);
    if (isClaimStandingTransitionRequest(input.payload)) {
      const body = input.payload;
      if (!isClaimLike(body.claim)) {
        throw new ProcessorError("StageFailure", "S12 requires Claim payload", {
          stageId: "S12",
        });
      }
      deps.transitionEngine.assertHumanGate(body.claim, body.standingTransition);
      return okResult(
        "S12",
        { payload: input.payload, notes: ["authority-gate:pin-ok", "human-reviewer:claim-ok"] },
        0,
      );
    }
    if (isEvidenceRecordTransitionRequest(input.payload)) {
      const body = input.payload;
      if (!isEvidenceLike(body.evidence)) {
        throw new ProcessorError("StageFailure", "S12 requires Evidence payload", {
          stageId: "S12",
        });
      }
      deps.transitionEngine.assertEvidenceHumanGate(
        body.evidence,
        body.recordTransition,
      );
      return okResult(
        "S12",
        {
          payload: input.payload,
          notes: ["authority-gate:pin-ok", "human-reviewer:evidence-ok"],
        },
        0,
      );
    }
    if (isEvidenceGradeAssignmentRequest(input.payload)) {
      const body = input.payload;
      if (!isEvidenceLike(body.evidence)) {
        throw new ProcessorError("StageFailure", "S12 requires Evidence payload", {
          stageId: "S12",
        });
      }
      deps.transitionEngine.assertGradeHumanGate(
        body.evidence,
        body.gradeAssignment,
      );
      return okResult(
        "S12",
        {
          payload: input.payload,
          notes: ["authority-gate:pin-ok", "human-reviewer:grade-ok"],
        },
        0,
      );
    }
    if (isContradictionRecordTransitionRequest(input.payload)) {
      const body = input.payload;
      if (!isContradictionLike(body.contradiction)) {
        throw new ProcessorError("StageFailure", "S12 requires Contradiction payload", {
          stageId: "S12",
        });
      }
      deps.transitionEngine.assertContradictionHumanGate(
        body.contradiction,
        body.contradictionTransition,
      );
      return okResult(
        "S12",
        {
          payload: input.payload,
          notes: ["authority-gate:pin-ok", "human-reviewer:contradiction-ok"],
        },
        0,
      );
    }
    if (isNegativeResultRecordTransitionRequest(input.payload)) {
      const body = input.payload;
      deps.transitionEngine.assertNegativeResultHumanGate(body.negativeResultTransition);
      return okResult(
        "S12",
        {
          payload: input.payload,
          notes: ["authority-gate:pin-ok", "human-reviewer:negative-result-ok"],
        },
        0,
      );
    }
    if (isVerificationRecordTransitionRequest(input.payload)) {
      const body = input.payload;
      deps.transitionEngine.assertVerificationHumanGate(body.verificationTransition);
      return okResult(
        "S12",
        {
          payload: input.payload,
          notes: ["authority-gate:pin-ok", "human-reviewer:verification-ok"],
        },
        0,
      );
    }
    return okResult(
      "S12",
      { payload: input.payload, notes: ["authority-gate:pin-ok"] },
      0,
    );
  });

  const s13 = timed("S13", "TransitionExecution", async (_ctx, input) => {
    if (!deps.transitionEngine.isAvailable()) {
      return skippedResult(
        "S13",
        { payload: input.payload, notes: ["commit:unavailable"] },
        0,
      );
    }
    if (isClaimStandingTransitionRequest(input.payload)) {
      const body = input.payload;
      const result = await deps.transitionEngine.execute({
        kind: "claim.standing_transition",
        payload: body.claim,
        standingTransition: body.standingTransition,
      });
      return okResult(
        "S13",
        { payload: result.claim ?? input.payload, notes: ["commit:claim-standing"] },
        0,
      );
    }
    if (isEvidenceRecordTransitionRequest(input.payload)) {
      const body = input.payload;
      const result = await deps.transitionEngine.execute({
        kind: "evidence.record_transition",
        payload: body.evidence,
        recordTransition: body.recordTransition,
      });
      return okResult(
        "S13",
        { payload: result.evidence ?? input.payload, notes: ["commit:evidence-record"] },
        0,
      );
    }
    if (isEvidenceGradeAssignmentRequest(input.payload)) {
      const body = input.payload;
      const result = await deps.transitionEngine.execute({
        kind: "evidence.grade_assignment",
        payload: body.evidence,
        gradeAssignment: body.gradeAssignment,
      });
      return okResult(
        "S13",
        { payload: result.evidence ?? input.payload, notes: ["commit:evidence-grade"] },
        0,
      );
    }
    if (isContradictionRecordTransitionRequest(input.payload)) {
      const body = input.payload;
      const result = await deps.transitionEngine.execute({
        kind: "contradiction.record_transition",
        payload: body.contradiction,
        contradictionTransition: body.contradictionTransition,
      });
      return okResult(
        "S13",
        {
          payload: result.contradiction ?? input.payload,
          notes: ["commit:contradiction-record"],
        },
        0,
      );
    }
    if (isNegativeResultRecordTransitionRequest(input.payload)) {
      const body = input.payload;
      const result = await deps.transitionEngine.execute({
        kind: "negative_result.record_transition",
        payload: body.negativeResult,
        negativeResultTransition: body.negativeResultTransition,
      });
      return okResult(
        "S13",
        {
          payload: result.negativeResult ?? input.payload,
          notes: ["commit:negative-result-record"],
        },
        0,
      );
    }
    if (isVerificationRecordTransitionRequest(input.payload)) {
      const body = input.payload;
      const result = await deps.transitionEngine.execute({
        kind: "verification.record_transition",
        payload: body.verification,
        verificationTransition: body.verificationTransition,
      });
      return okResult(
        "S13",
        {
          payload: result.verification ?? input.payload,
          notes: ["commit:verification-record"],
        },
        0,
      );
    }
    return skippedResult(
      "S13",
      { payload: input.payload, notes: ["commit:skipped-no-request"] },
      0,
    );
  });

  const s14 = timed("S14", "EventRecording", async (ctx, input) => {
    const at = ctx.clock.nowIso();
    if (isVerificationLike(input.payload)) {
      const log = input.payload.record_transition_log ?? [];
      const last = log[log.length - 1];
      if (last) {
        await deps.eventEngine.append(
          input.payload.verification_id,
          { kind: "verification.vte", vte: last },
          at,
        );
        return okResult(
          "S14",
          { payload: input.payload, notes: ["event:vte-appended"] },
          0,
        );
      }
    }
    if (isNegativeResultLike(input.payload)) {
      const log = input.payload.record_transition_log ?? [];
      const last = log[log.length - 1];
      if (last) {
        await deps.eventEngine.append(
          input.payload.negative_result_id,
          { kind: "negative_result.nrte", nrte: last },
          at,
        );
        return okResult(
          "S14",
          { payload: input.payload, notes: ["event:nrte-appended"] },
          0,
        );
      }
    }
    if (isContradictionLike(input.payload)) {
      const log = input.payload.record_transition_log ?? [];
      const last = log[log.length - 1];
      if (last) {
        await deps.eventEngine.append(
          input.payload.contradiction_id,
          { kind: "contradiction.crte", crte: last },
          at,
        );
        return okResult(
          "S14",
          { payload: input.payload, notes: ["event:crte-appended"] },
          0,
        );
      }
    }
    if (isEvidenceLike(input.payload)) {
      const gradeLog = input.payload.grade_assignment_log ?? [];
      const recordLog = input.payload.record_transition_log ?? [];
      const lastGae = gradeLog[gradeLog.length - 1];
      const lastErte = recordLog[recordLog.length - 1];
      if (lastGae && lastErte) {
        const preferGae = lastGae.at >= lastErte.at;
        if (preferGae) {
          await deps.eventEngine.append(
            input.payload.evidence_id,
            { kind: "evidence.gae", gae: lastGae },
            at,
          );
          return okResult(
            "S14",
            { payload: input.payload, notes: ["event:gae-appended"] },
            0,
          );
        }
        await deps.eventEngine.append(
          input.payload.evidence_id,
          { kind: "evidence.erte", erte: lastErte },
          at,
        );
        return okResult(
          "S14",
          { payload: input.payload, notes: ["event:erte-appended"] },
          0,
        );
      }
      if (lastGae) {
        await deps.eventEngine.append(
          input.payload.evidence_id,
          { kind: "evidence.gae", gae: lastGae },
          at,
        );
        return okResult(
          "S14",
          { payload: input.payload, notes: ["event:gae-appended"] },
          0,
        );
      }
      if (lastErte) {
        await deps.eventEngine.append(
          input.payload.evidence_id,
          { kind: "evidence.erte", erte: lastErte },
          at,
        );
        return okResult(
          "S14",
          { payload: input.payload, notes: ["event:erte-appended"] },
          0,
        );
      }
    }
    if (isClaimLike(input.payload)) {
      const log = input.payload.standing_transition_log ?? [];
      const last = log[log.length - 1];
      if (last) {
        await deps.eventEngine.append(
          input.payload.claim_id,
          { kind: "claim.ste", ste: last },
          at,
        );
        return okResult(
          "S14",
          { payload: input.payload, notes: ["event:ste-appended"] },
          0,
        );
      }
    }
    await deps.eventEngine.append(
      `exec:${ctx.executionId}`,
      { kind: "pipeline.stage.marker", stageId: "S14" },
      at,
    );
    return okResult("S14", { payload: input.payload, notes: ["event:appended-opaque"] }, 0);
  });

  const s15 = timed("S15", "VersionTokenAssignment", async (_ctx, input) => {
    if (isClaimLike(input.payload)) {
      return okResult(
        "S15",
        {
          payload: input.payload,
          notes: [`version-token:claim:${input.payload.claim_version}`],
        },
        0,
      );
    }
    if (isEvidenceLike(input.payload)) {
      return okResult(
        "S15",
        {
          payload: input.payload,
          notes: [`version-token:evidence:${input.payload.evidence_version}`],
        },
        0,
      );
    }
    if (isContradictionLike(input.payload)) {
      return okResult(
        "S15",
        {
          payload: input.payload,
          notes: [
            `version-token:contradiction:${input.payload.contradiction_version}`,
          ],
        },
        0,
      );
    }
    if (isNegativeResultLike(input.payload)) {
      return okResult(
        "S15",
        {
          payload: input.payload,
          notes: [
            `version-token:negative-result:${input.payload.negative_result_version}`,
          ],
        },
        0,
      );
    }
    if (isVerificationLike(input.payload)) {
      return okResult(
        "S15",
        {
          payload: input.payload,
          notes: [
            `version-token:verification:${input.payload.verification_version}`,
          ],
        },
        0,
      );
    }
    return skippedResult(
      "S15",
      { payload: input.payload, notes: ["version-token:skipped"] },
      0,
    );
  });

  const s16 = timed("S16", "PersistenceBoundary", async (ctx, input) => {
    if (!deps.persistenceHook.available) {
      if (ctx.configuration.requirePersistence) {
        throw new ProcessorError(
          "PersistenceUnavailable",
          "Persistence required but not bound",
          { stageId: "S16" },
        );
      }
      return skippedResult("S16", { payload: input.payload, notes: ["persist:unbound"] }, 0);
    }
    await deps.persistenceHook.persist(input.payload);
    return okResult("S16", { payload: input.payload, notes: ["persist:ok"] }, 0);
  });

  const s17 = timed("S17", "ProfileProjection", async (_ctx, input) => {
    if (!deps.serializationHook.available) {
      return skippedResult("S17", { payload: input.payload, notes: ["project:skipped"] }, 0);
    }
    // RPR-001 S17: sole export projection stage (SER-JSON-001).
    const projected = await deps.serializationHook.project(input.payload, "SER-JSON-001");
    return okResult("S17", { payload: projected, notes: ["project:ok", "profile:SER-JSON-001"] }, 0);
  });

  const s18 = timed("S18", "ExportEmission", async (_ctx, input) => {
    if (!deps.serializationHook.available) {
      return skippedResult("S18", { payload: input.payload, notes: ["export:skipped"] }, 0);
    }
    return okResult("S18", { payload: input.payload, notes: ["export:ready"] }, 0);
  });

  return [
    s01,
    s02,
    s03,
    s04,
    s05,
    s06,
    s07,
    s08,
    s09,
    s10,
    s11,
    s12,
    s13,
    s14,
    s15,
    s16,
    s17,
    s18,
  ];
}

function resolveKnowledgeObject(
  payload: unknown,
): Claim | Evidence | Contradiction | NegativeResult | Verification | null {
  return (
    resolveClaim(payload) ??
    resolveEvidence(payload) ??
    resolveContradiction(payload) ??
    resolveNegativeResult(payload) ??
    resolveVerification(payload)
  );
}

function resolveClaim(payload: unknown): Claim | null {
  if (isClaimLike(payload)) return payload;
  if (isClaimStandingTransitionRequest(payload) && isClaimLike(payload.claim)) {
    return payload.claim;
  }
  if (isVersionPairPayload(payload) && isClaimLike(payload.proposed)) {
    return payload.proposed;
  }
  return null;
}

function resolveEvidence(payload: unknown): Evidence | null {
  if (isEvidenceLike(payload)) return payload;
  if (isEvidenceRecordTransitionRequest(payload) && isEvidenceLike(payload.evidence)) {
    return payload.evidence;
  }
  if (isEvidenceGradeAssignmentRequest(payload) && isEvidenceLike(payload.evidence)) {
    return payload.evidence;
  }
  if (isVersionPairPayload(payload) && isEvidenceLike(payload.proposed)) {
    return payload.proposed;
  }
  return null;
}

function resolveContradiction(payload: unknown): Contradiction | null {
  if (isContradictionLike(payload)) return payload;
  if (
    isContradictionRecordTransitionRequest(payload) &&
    isContradictionLike(payload.contradiction)
  ) {
    return payload.contradiction;
  }
  if (isVersionPairPayload(payload) && isContradictionLike(payload.proposed)) {
    return payload.proposed;
  }
  return null;
}

function resolveNegativeResult(payload: unknown): NegativeResult | null {
  if (isNegativeResultLike(payload)) return payload;
  if (
    isNegativeResultRecordTransitionRequest(payload) &&
    isNegativeResultLike(payload.negativeResult)
  ) {
    return payload.negativeResult;
  }
  if (isVersionPairPayload(payload) && isNegativeResultLike(payload.proposed)) {
    return payload.proposed;
  }
  return null;
}

function resolveNegativeResultContent(payload: unknown): CreateNegativeResultInput | null {
  if (isNegativeResultContentLike(payload)) return payload;
  if (
    isNegativeResultRecordTransitionRequest(payload) &&
    isNegativeResultContentLike(payload.negativeResult)
  ) {
    return payload.negativeResult;
  }
  return null;
}

function resolveVerification(payload: unknown): Verification | null {
  if (isVerificationLike(payload)) return payload;
  if (
    isVerificationRecordTransitionRequest(payload) &&
    isVerificationLike(payload.verification)
  ) {
    return payload.verification;
  }
  if (isVersionPairPayload(payload) && isVerificationLike(payload.proposed)) {
    return payload.proposed;
  }
  return null;
}

interface ClaimStandingTransitionPayload {
  readonly claim: Claim;
  readonly standingTransition: StandingTransitionInput;
}

interface EvidenceRecordTransitionPayload {
  readonly evidence: Evidence;
  readonly recordTransition: EvidenceRecordTransitionInput;
}

interface EvidenceGradeAssignmentPayload {
  readonly evidence: Evidence;
  readonly gradeAssignment: GradeAssignmentInput;
}

interface ContradictionRecordTransitionPayload {
  readonly contradiction: Contradiction;
  readonly contradictionTransition: ContradictionRecordTransitionInput;
}

interface NegativeResultRecordTransitionPayload {
  readonly negativeResult: NegativeResult | CreateNegativeResultInput;
  readonly negativeResultTransition: NegativeResultRecordTransitionInput;
}

interface VerificationRecordTransitionPayload {
  readonly verification: Verification;
  readonly verificationTransition: VerificationRecordTransitionInput;
}

interface VersionPairPayload {
  readonly prior: unknown;
  readonly proposed: unknown;
}

function isClaimStandingTransitionRequest(
  payload: unknown,
): payload is ClaimStandingTransitionPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "claim" in payload &&
    "standingTransition" in payload
  );
}

function isEvidenceRecordTransitionRequest(
  payload: unknown,
): payload is EvidenceRecordTransitionPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "evidence" in payload &&
    "recordTransition" in payload
  );
}

function isEvidenceGradeAssignmentRequest(
  payload: unknown,
): payload is EvidenceGradeAssignmentPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "evidence" in payload &&
    "gradeAssignment" in payload
  );
}

function isContradictionRecordTransitionRequest(
  payload: unknown,
): payload is ContradictionRecordTransitionPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "contradiction" in payload &&
    "contradictionTransition" in payload
  );
}

function isNegativeResultRecordTransitionRequest(
  payload: unknown,
): payload is NegativeResultRecordTransitionPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "negativeResult" in payload &&
    "negativeResultTransition" in payload
  );
}

function isVerificationRecordTransitionRequest(
  payload: unknown,
): payload is VerificationRecordTransitionPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "verification" in payload &&
    "verificationTransition" in payload
  );
}

function isVersionPairPayload(payload: unknown): payload is VersionPairPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "prior" in payload &&
    "proposed" in payload
  );
}

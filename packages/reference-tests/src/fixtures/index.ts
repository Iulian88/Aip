/**
 * REF-TEST-002 — official Reference Fixture corpus.
 * Covers Claim, Evidence, GradeDesignation, Contradiction, NegativeResult,
 * Verification, Canonical Units, JSON serialization, round-trip,
 * processor stages, and (additive) Research Operations.
 */
import type { ReferenceFixture } from "../types.js";
import { canonicalFixtures } from "./canonical.js";
import { claimFixtures } from "./claim.js";
import { contradictionFixtures } from "./contradiction.js";
import { evidenceFixtures } from "./evidence.js";
import { gradeFixtures } from "./grade.js";
import { negativeResultFixtures } from "./negative-result.js";
import { opsFixtures } from "./ops.js";
import { processorFixtures } from "./processor.js";
import { serializationFixtures } from "./serialization.js";
import { verificationFixtures } from "./verification.js";

export { canonicalFixtures } from "./canonical.js";
export { claimFixtures } from "./claim.js";
export { contradictionFixtures } from "./contradiction.js";
export { evidenceFixtures } from "./evidence.js";
export { gradeFixtures } from "./grade.js";
export { negativeResultFixtures } from "./negative-result.js";
export { opsFixtures } from "./ops.js";
export { processorFixtures } from "./processor.js";
export { serializationFixtures } from "./serialization.js";
export { verificationFixtures } from "./verification.js";

/**
 * REF-CORPUS-SCI — existing scientific fixtures (frozen count = 44).
 * Sole target for CONF-001@1.0.0. Unchanged semantics.
 */
export const referenceFixtures: readonly ReferenceFixture[] = Object.freeze([
  ...claimFixtures,
  ...evidenceFixtures,
  ...gradeFixtures,
  ...contradictionFixtures,
  ...negativeResultFixtures,
  ...verificationFixtures,
  ...canonicalFixtures,
  ...serializationFixtures,
  ...processorFixtures,
]);

/** Alias: REF-CORPUS-SCI */
export const REF_CORPUS_SCI: readonly ReferenceFixture[] = referenceFixtures;

/**
 * REF-CORPUS-OPS — OPS fixtures only (authoring / subset).
 * MUST NOT be submitted alone to CONF/CERT for OPS certification.
 */
export const REF_CORPUS_OPS: readonly ReferenceFixture[] = opsFixtures;

/**
 * REF-CORPUS-FULL — SCI followed by OPS (deterministic construction).
 * Sole valid target for CONF-001@1.1.0-OPS.
 */
export const REF_CORPUS_FULL: readonly ReferenceFixture[] = Object.freeze([
  ...REF_CORPUS_SCI,
  ...REF_CORPUS_OPS,
]);

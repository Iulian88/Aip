/**
 * REF-TEST-002 — RPR-001 processor stage fixtures (processor / authority).
 * Consumes stage handlers only; no processor logic re-implemented here.
 */
import type { AuthorityCatalog, AuthorityLoader } from "@sciros/shared";
import { CanonicalEncoder, type CanonicalUnit } from "@sciros/encoding";
import { JsonEncoder } from "@sciros/serialization";
import {
  AuthorityEngine,
  AuthorityGate,
  EventEngine,
  InMemoryEventStore,
  PinEngine,
  StaticIdentityProvider,
  SystemClock,
  TransitionEngine,
  ValidationEngine,
  VersionEngine,
  bindSerializationFrameworkHook,
  createStageHandlers,
  defaultProcessorConfiguration,
  noopLogger,
  noopMetrics,
  noopTracer,
  unavailableEncodingHook,
  unavailablePersistenceHook,
  withAuthoritySet,
  type ProcessorContext,
  type StageHandler,
  type StageId,
  type StageResult,
} from "@sciros/processor";
import type { ReferenceFixture } from "../types.js";
import { AT, sampleClaim } from "./support.js";

const CATALOG: AuthorityCatalog = Object.freeze({
  sealed: true,
  pinManifestId: "ref-test-012",
  frozenAtIso: AT,
  pins: Object.freeze([
    { id: "SER-001", version: "1.0.0", status: "FROZEN_APPROVED" },
    { id: "SER-JSON-001", version: "1.0.0", status: "FROZEN_APPROVED" },
    { id: "ENC-001", version: "1.0.0", status: "FROZEN_APPROVED" },
  ]),
});

/** Deterministic in-memory loader over the pinned reference catalog. */
const catalogLoader: AuthorityLoader = {
  async loadAuthorities() {
    return [...CATALOG.pins];
  },
  async pinAndFreeze() {
    return CATALOG;
  },
};

function stageHandlers(): Readonly<Record<string, StageHandler>> {
  const handlers = createStageHandlers({
    authorityEngine: new AuthorityEngine(catalogLoader),
    pinEngine: new PinEngine(),
    authorityGate: new AuthorityGate(),
    validationEngine: new ValidationEngine(),
    versionEngine: new VersionEngine(),
    transitionEngine: new TransitionEngine(),
    eventEngine: new EventEngine(new InMemoryEventStore()),
    encodingHook: unavailableEncodingHook(),
    serializationHook: bindSerializationFrameworkHook(),
    persistenceHook: unavailablePersistenceHook(),
    bindAuthorityContext: () => {},
  });
  const byId: Record<string, StageHandler> = {};
  for (const h of handlers) byId[h.stageId] = h;
  return byId;
}

function baseContext(): ProcessorContext {
  return {
    executionId: "ref-test-012",
    correlationId: "ref-test-012",
    configuration: { ...defaultProcessorConfiguration, requireSerialization: true },
    clock: new SystemClock(),
    identity: new StaticIdentityProvider(),
    logger: noopLogger,
    metrics: noopMetrics,
    tracer: noopTracer,
    authoritySet: null,
  };
}

function frozenContext(): ProcessorContext {
  return withAuthoritySet(baseContext(), CATALOG);
}

async function runStage(
  stageId: StageId,
  ctx: ProcessorContext,
  payload: unknown,
): Promise<StageResult> {
  const handler = stageHandlers()[stageId];
  if (!handler) throw new Error(`Stage ${stageId} missing`);
  return handler.run(ctx, { payload });
}

async function claimUnit(): Promise<CanonicalUnit> {
  return new CanonicalEncoder().assemble(sampleClaim());
}

export const processorFixtures: readonly ReferenceFixture[] = [
  {
    fixture_id: "REF-PROC-001",
    title: "S05 binds serialization framework under frozen authorities",
    scenario: "processor",
    authorities: ["RPR-001", "SER-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const result = await runStage("S05", frozenContext(), await claimUnit());
      check.equal("status", result.status, "ok");
      check.ok(
        "binding note",
        result.output.notes?.includes("binding:ready") === true,
        `notes: ${JSON.stringify(result.output.notes)}`,
      );
    },
  },
  {
    fixture_id: "REF-PROC-002",
    title: "S06 decodes inbound SER-JSON-001 instance",
    scenario: "processor",
    authorities: ["RPR-001", "SER-JSON-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const json = new JsonEncoder().encode(await claimUnit());
      const result = await runStage("S06", frozenContext(), json);
      check.equal("status", result.status, "ok");
      const decoded = result.output.payload as CanonicalUnit;
      check.equal("decoded identity", decoded.envelope.identity, "claim:ref012");
      check.equal("decoded kind", decoded.envelope.unit_kind, "ClaimUnit");
    },
  },
  {
    fixture_id: "REF-PROC-003",
    title: "S17 projects Canonical Unit via SER-JSON-001",
    scenario: "processor",
    authorities: ["RPR-001", "SER-JSON-001"],
    expectation: { outcome: "success" },
    async execute(check) {
      const result = await runStage("S17", frozenContext(), await claimUnit());
      check.equal("status", result.status, "ok");
      const payload = result.output.payload;
      const projected = (
        typeof payload === "string" ? JSON.parse(payload) : payload
      ) as Record<string, unknown>;
      check.equal("projected enc pin", projected.sciros_enc, "ENC-001@1.0");
      check.ok("no intact in projection", !("intact" in projected));
      check.ok(
        "projection note",
        result.output.notes?.includes("profile:SER-JSON-001") === true,
      );
    },
  },
  {
    fixture_id: "REF-AUTH-001",
    title: "S05 fails without frozen authority set",
    scenario: "authority",
    authorities: ["RPR-001", "EXEC-003"],
    expectation: { outcome: "success" },
    async execute(check) {
      const result = await runStage("S05", baseContext(), await claimUnit());
      check.equal("status", result.status, "failed");
      check.equal("error code", result.error?.code, "AuthorityNotFrozen");
    },
  },
  {
    fixture_id: "REF-AUTH-002",
    title: "Authority gate enforces pinned catalog membership",
    scenario: "authority",
    authorities: ["RPR-001", "EXEC-003"],
    expectation: { outcome: "success" },
    execute(check) {
      const gate = new AuthorityGate();
      gate.rejectIfMissing(CATALOG, "SER-JSON-001");
      check.ok("pinned authority accepted", true);
      check.throws("null catalog rejected", () => gate.rejectIfMissing(null, "SER-001"));
      check.throws("unpinned authority rejected", () =>
        gate.rejectIfMissing(CATALOG, "CERT-999"),
      );
    },
  },
];

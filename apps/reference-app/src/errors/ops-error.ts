/**
 * OPS-layer errors only (SPEC-016A §21).
 * Lower-layer typed errors MUST propagate unchanged — do not wrap them here.
 */

export type OpsErrorCode =
  | "INVALID_SESSION"
  | "INVALID_MEMBERSHIP"
  | "INVALID_COMMAND_STATE"
  | "INVALID_WORKSPACE";

export class OpsError extends Error {
  readonly code: OpsErrorCode;

  constructor(code: OpsErrorCode, message: string) {
    super(message);
    this.name = "OpsError";
    this.code = code;
  }
}

export function isOpsError(value: unknown): value is OpsError {
  return value instanceof OpsError;
}

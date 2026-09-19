import type { JsonFailureCode } from "./types.js";

export class JsonError extends Error {
  readonly code: JsonFailureCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: JsonFailureCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "JsonError";
    this.code = code;
    this.details = details;
  }
}

export function isJsonError(value: unknown): value is JsonError {
  return value instanceof JsonError;
}

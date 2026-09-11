import type { ActiveAIProvider } from "./types";

/**
 * Details about an AI configuration failure — which provider, model, and which env vars are
 * missing or invalid. Used to produce actionable error messages for operators.
 */
export interface AIConfigurationErrorDetails {
  provider?: ActiveAIProvider | null;
  model?: string | null;
  missingFields?: string[];
  invalidFields?: string[];
}

/**
 * Thrown when the AI subsystem cannot initialise because of incomplete or invalid
 * environment configuration. Carries a structured `code` and `details` so callers can
 * surface precise diagnostics without parsing a message string.
 */
export class AIConfigurationError extends Error {
  code: "providerMissing" | "invalidProvider" | "providerNotConfigured";
  details: AIConfigurationErrorDetails;

  /**
   * @param code — A machine-readable error category the caller can switch on
   * @param message — Human-readable explanation for logs / error boundaries
   * @param details — Structured metadata about which fields caused the failure
   */
  constructor(
    code: "providerMissing" | "invalidProvider" | "providerNotConfigured",
    message: string,
    details: AIConfigurationErrorDetails = {}
  ) {
    super(message);
    this.name = "AIConfigurationError";
    this.code = code;
    this.details = details;
  }
}

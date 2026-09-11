import { createHash } from "node:crypto";
import { type AIEnvironment, AI_PROVIDERS, type ActiveAIProvider } from "./types";

/**
 * Strips whitespace and returns `undefined` for blank strings so downstream
 * checks can use a simple truthy test instead of trimming repeatedly.
 */
export const normalizeValue = (value?: string | null): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/**
 * Produces a SHA-256 fingerprint of a credential value so the cache key can
 * detect credential rotation without storing the secret itself.
 */
export const getCredentialFingerprint = (value?: string | null): string | null => {
  const normalizedValue = normalizeValue(value);

  if (!normalizedValue) {
    return null;
  }

  return createHash("sha256").update(normalizedValue).digest("hex");
};

/**
 * Validates that a string is a well-formed http or https URL — used to reject
 * obviously invalid base URLs before they reach the AI SDK.
 */
export const isValidHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Type guard: checks that the value is a plain object where every value is a string.
 */
const isStringRecord = (value: unknown): value is Record<string, string> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((entry) => typeof entry === "string");

/**
 * Parses a JSON string into a `Record<string, string>` — validates both
 * structure and element types so callers get a strongly typed result.
 *
 * @throws — If the JSON is invalid or not a flat string-typed object
 */
export const parseStringRecordJson = (value: string): Record<string, string> => {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(value);
  } catch {
    throw new Error("Value must be valid JSON");
  }

  if (!isStringRecord(parsedValue)) {
    throw new Error("Value must be a JSON object of string values");
  }

  return parsedValue;
};

/**
 * Safely reads a boolean-like env var ("true" / "1") returning `false` for
 * any other value so feature flags degrade safely.
 */
export const parseBooleanFlag = (value?: string | null): boolean => {
  const normalizedValue = normalizeValue(value)?.toLowerCase();
  return normalizedValue === "true" || normalizedValue === "1";
};

/**
 * Returns the environment object to read config from — defaults to `process.env`
 * so callers can omit the parameter in server contexts.
 */
export const getAIEnvironment = (environment?: AIEnvironment): AIEnvironment => environment ?? process.env;

/**
 * Type guard that narrows a string to a known ActiveAIProvider.
 */
export const isAIProvider = (value: string): value is ActiveAIProvider =>
  AI_PROVIDERS.includes(value as ActiveAIProvider);

/**
 * Resolves and normalises the AI_PROVIDER env var into an ActiveAIProvider,
 * returning `null` when the value is missing or unrecognised.
 */
export const resolveActiveAIProvider = (value?: string | null): ActiveAIProvider | null => {
  const normalizedValue = normalizeValue(value);

  if (!normalizedValue || !isAIProvider(normalizedValue)) {
    return null;
  }

  return normalizedValue;
};

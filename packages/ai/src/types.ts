import type { FlexibleSchema, LanguageModel, generateText } from "ai";

/**
 * Supported AI provider identifiers. Add new providers here and in the registry.
 */
export const AI_PROVIDERS = ["aws", "google", "azure", "openai-compatible"] as const;

/**
 * Active AI provider determined by the AI_PROVIDER environment variable.
 */
export type ActiveAIProvider = (typeof AI_PROVIDERS)[number];

/**
 * All environment variables the AI subsystem reads. Every optional field is
 * provider-specific and validated only when that provider is selected.
 */
export interface AIEnvironment {
  AI_PROVIDER?: string;
  AI_MODEL?: string;
  AI_GOOGLE_CLOUD_PROJECT?: string;
  AI_GOOGLE_CLOUD_LOCATION?: string;
  AI_GOOGLE_CLOUD_CREDENTIALS_JSON?: string;
  AI_GOOGLE_CLOUD_APPLICATION_CREDENTIALS?: string;
  AI_AWS_REGION?: string;
  AI_AWS_ACCESS_KEY_ID?: string;
  AI_AWS_SECRET_ACCESS_KEY?: string;
  AI_AWS_SESSION_TOKEN?: string;
  AI_AZURE_BASE_URL?: string;
  AI_AZURE_RESOURCE_NAME?: string;
  AI_AZURE_API_KEY?: string;
  AI_AZURE_API_VERSION?: string;
  AI_OPENAI_COMPATIBLE_BASE_URL?: string;
  AI_OPENAI_COMPATIBLE_API_KEY?: string;
  AI_OPENAI_COMPATIBLE_PROVIDER_NAME?: string;
  AI_OPENAI_COMPATIBLE_SUPPORTS_STRUCTURED_OUTPUTS?: string;
  AI_OPENAI_COMPATIBLE_HEADERS_JSON?: string;
  AI_OPENAI_COMPATIBLE_QUERY_PARAMS_JSON?: string;
}

/**
 * Error codes for per-provider status checks.
 */
export type AIProviderStatusErrorCode = "missingCredentials" | "invalidCredentials" | "missingModel";

/**
 * Health/configuration status for a single AI provider — used to tell operators
 * exactly which env vars are missing or malformed.
 */
export interface AIProviderStatus {
  provider: ActiveAIProvider;
  isConfigured: boolean;
  model: string | null;
  missingFields: string[];
  invalidFields: string[];
  errorCode?: AIProviderStatusErrorCode;
}

/**
 * Error codes for the top-level AI configuration check.
 */
export type AIConfigurationErrorCode = "providerMissing" | "invalidProvider" | "providerNotConfigured";

/**
 * Aggregate configuration status across all providers — tells callers whether
 * AI is usable and what would need to be fixed if not.
 */
export interface AIConfigurationStatus {
  provider: ActiveAIProvider | null;
  model: string | null;
  isConfigured: boolean;
  missingFields: string[];
  invalidFields: string[];
  errorCode?: AIConfigurationErrorCode;
  providerStatus?: AIProviderStatus;
}

/**
 * The concrete language model type used throughout the AI package.
 */
export type AILanguageModel = LanguageModel;
type GenerateTextResult = Awaited<ReturnType<typeof generateText>>;

/**
 * Options for structured object generation — extends the underlying `generateText` options
 * with a Zod schema so the caller gets type-safe, validated output.
 */
export type TGenerateObjectOptions<T = unknown> = Omit<
  Parameters<typeof generateText>[0],
  "model" | "output" | "experimental_output"
> & {
  schema: FlexibleSchema<T>;
  schemaName?: string;
  schemaDescription?: string;
  output?: "object";
};
/**
 * Result of a structured object generation call — wraps the raw AI output into
 * a typed object plus metadata (usage, finish reason, etc.).
 */
export interface TGenerateObjectResult<T = unknown> {
  readonly object: T;
  readonly reasoning: GenerateTextResult["reasoningText"];
  readonly finishReason: GenerateTextResult["finishReason"];
  readonly usage: GenerateTextResult["usage"];
  readonly warnings: GenerateTextResult["warnings"];
  readonly request: GenerateTextResult["request"];
  readonly response: GenerateTextResult["response"];
  readonly providerMetadata: GenerateTextResult["providerMetadata"];
  toJsonResponse: (init?: ResponseInit) => Response;
}
/**
 * Options for free-text generation — everything the underlying AI SDK accepts
 * except `model`, which is resolved automatically from the active provider.
 */
export type TGenerateTextOptions = Omit<Parameters<typeof generateText>[0], "model">;
/**
 * Result of a free-text generation call — the raw text plus performance metadata.
 */
export type TGenerateTextResult = GenerateTextResult;

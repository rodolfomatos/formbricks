import { awsProviderAdapter } from "./providers/aws";
import { azureProviderAdapter } from "./providers/azure";
import { googleProviderAdapter } from "./providers/google";
import { openaiCompatibleProviderAdapter } from "./providers/openai-compatible";
import type { AIEnvironment, AILanguageModel, ActiveAIProvider } from "./types";

/**
 * Result of validating an AI provider's mandatory environment fields.
 */
export interface AIProviderValidationResult {
  missingFields: string[];
  invalidFields: string[];
}

/**
 * Interface each provider adapter must implement so the rest of the AI
 * package can treat every provider uniformly:
 * - `validate` — check that mandatory env vars are present and well-formed
 * - `buildCacheKey` — produce a deterministic cache key that incorporates
 *   provider-specific config so credentials rotation invalidates the cache
 * - `createModel` — instantiate the SDK LanguageModel from env vars
 */
export interface AIProviderAdapter {
  validate: (environment: AIEnvironment) => AIProviderValidationResult;
  buildCacheKey: (model: string, environment: AIEnvironment) => string;
  createModel: (model: string, environment: AIEnvironment) => AILanguageModel;
}

/**
 * Maps provider name → adapter. Add new provider adapters here.
 */
const AI_PROVIDER_REGISTRY: Record<ActiveAIProvider, AIProviderAdapter> = {
  aws: awsProviderAdapter,
  google: googleProviderAdapter,
  azure: azureProviderAdapter,
  "openai-compatible": openaiCompatibleProviderAdapter,
};

/**
 * Returns the registered adapter for the given provider. Throws a runtime
 * error if the provider is unknown (should never happen given the type system).
 */
export const getAIProviderAdapter = (provider: ActiveAIProvider): AIProviderAdapter =>
  AI_PROVIDER_REGISTRY[provider];

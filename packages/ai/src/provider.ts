import type { LanguageModel } from "ai";
import { AIConfigurationError } from "./errors";
import { getAIProviderAdapter } from "./registry";
import { getAIEnvironment, isAIProvider, normalizeValue, resolveActiveAIProvider } from "./shared";
import type {
  AIConfigurationStatus,
  AIEnvironment,
  AILanguageModel,
  AIProviderStatus,
  ActiveAIProvider,
} from "./types";
import { AI_PROVIDERS } from "./types";

/**
 * Maximum entries in the LRU language model cache before eviction.
 */
const MAX_LANGUAGE_MODEL_CACHE_ENTRIES = 50;
/**
 * Simple LRU cache keyed by provider+model+config fingerprint so that
 * repeated calls with the same environment reuse the same LanguageModel instance.
 */
const languageModelCache = new Map<string, LanguageModel>();

export { AIConfigurationError };

/**
 * Checks which required fields are missing or invalid for a given provider +
 * environment, and extracts the resolved model name.
 */
const getProviderMissingAndInvalidFields = (
  provider: ActiveAIProvider,
  environment: AIEnvironment
): { missingFields: string[]; invalidFields: string[]; model: string | null } => {
  const adapter = getAIProviderAdapter(provider);
  const { missingFields: adapterMissingFields, invalidFields: adapterInvalidFields } =
    adapter.validate(environment);
  const missingFields = [...adapterMissingFields];
  const invalidFields = [...adapterInvalidFields];
  const model = normalizeValue(environment.AI_MODEL) ?? null;

  if (!model && !missingFields.includes("AI_MODEL")) {
    missingFields.push("AI_MODEL");
  }

  return {
    model,
    missingFields,
    invalidFields,
  };
};

/**
 * Builds a per-provider health status by collecting missing/invalid fields and
 * deriving a suitable error code.
 */
const getProviderStatus = (provider: ActiveAIProvider, environment?: AIEnvironment): AIProviderStatus => {
  const resolvedEnvironment = getAIEnvironment(environment);
  const { missingFields, invalidFields, model } = getProviderMissingAndInvalidFields(
    provider,
    resolvedEnvironment
  );

  let errorCode: AIProviderStatus["errorCode"];

  if (invalidFields.length > 0) {
    errorCode = "invalidCredentials";
  } else if (missingFields.includes("AI_MODEL")) {
    errorCode = "missingModel";
  } else if (missingFields.length > 0) {
    errorCode = "missingCredentials";
  }

  return {
    provider,
    isConfigured: missingFields.length === 0 && invalidFields.length === 0,
    model,
    missingFields,
    invalidFields,
    ...(errorCode ? { errorCode } : {}),
  };
};

/**
 * Produces a human-readable error message from an AIConfigurationStatus,
 * listing missing and invalid fields so operators know exactly what to fix.
 */
const getAIConfigurationErrorMessage = (status: AIConfigurationStatus): string => {
  switch (status.errorCode) {
    case "providerMissing":
      return "AI_PROVIDER is required";
    case "invalidProvider":
      return `AI_PROVIDER must be one of: ${AI_PROVIDERS.join(", ")}`;
    case "providerNotConfigured": {
      const parts = ["Active AI provider is not configured correctly."];

      if (status.missingFields.length > 0) {
        parts.push(`Missing: ${status.missingFields.join(", ")}`);
      }

      if (status.invalidFields.length > 0) {
        parts.push(`Invalid: ${status.invalidFields.join(", ")}`);
      }

      return parts.join(" ");
    }
    default:
      return "AI is not configured";
  }
};

/**
 * Retrieves a cached LanguageModel and bumps it to the front of the LRU list
 * (most-recently-used position). Returns undefined on cache miss.
 */
const getCachedLanguageModel = (cacheKey: string): LanguageModel | undefined => {
  const cachedLanguageModel = languageModelCache.get(cacheKey);

  if (!cachedLanguageModel) {
    return undefined;
  }

  languageModelCache.delete(cacheKey);
  languageModelCache.set(cacheKey, cachedLanguageModel);

  return cachedLanguageModel;
};

/**
 * Inserts a LanguageModel into the LRU cache, evicting the oldest entry when
 * the cache exceeds MAX_LANGUAGE_MODEL_CACHE_ENTRIES.
 */
const setCachedLanguageModel = (cacheKey: string, languageModel: LanguageModel): void => {
  if (languageModelCache.has(cacheKey)) {
    languageModelCache.delete(cacheKey);
  } else if (languageModelCache.size >= MAX_LANGUAGE_MODEL_CACHE_ENTRIES) {
    const oldestCacheKey = languageModelCache.keys().next().value;

    if (oldestCacheKey !== undefined) {
      languageModelCache.delete(oldestCacheKey);
    }
  }

  languageModelCache.set(cacheKey, languageModel);
};

/**
 * Returns the active AI provider name from the environment, or null when
 * AI_PROVIDER is not set or is invalid.
 */
export const getActiveAiProvider = (environment?: AIEnvironment): ActiveAIProvider | null => {
  return resolveActiveAIProvider(getAIEnvironment(environment).AI_PROVIDER);
};

/**
 * Returns the AI model name from the environment, or null when AI_MODEL is not set.
 */
export const getActiveAiModel = (environment?: AIEnvironment): string | null =>
  normalizeValue(getAIEnvironment(environment).AI_MODEL) ?? null;

/**
 * Performs a full AI configuration health-check: validates AI_PROVIDER,
 * delegates per-provider validation, and returns a structured status that
 * callers (UI, health endpoints) can inspect without parsing error messages.
 */
export const getAiConfigurationStatus = (environment?: AIEnvironment): AIConfigurationStatus => {
  const resolvedEnvironment = getAIEnvironment(environment);
  const rawProvider = normalizeValue(resolvedEnvironment.AI_PROVIDER);
  const model = getActiveAiModel(resolvedEnvironment);

  if (!rawProvider) {
    return {
      provider: null,
      model,
      isConfigured: false,
      missingFields: ["AI_PROVIDER"],
      invalidFields: [],
      errorCode: "providerMissing",
    };
  }

  if (!isAIProvider(rawProvider)) {
    return {
      provider: null,
      model,
      isConfigured: false,
      missingFields: [],
      invalidFields: ["AI_PROVIDER"],
      errorCode: "invalidProvider",
    };
  }

  const providerStatus = getProviderStatus(rawProvider, resolvedEnvironment);

  if (!providerStatus.isConfigured) {
    return {
      provider: rawProvider,
      model: providerStatus.model,
      isConfigured: false,
      missingFields: providerStatus.missingFields,
      invalidFields: providerStatus.invalidFields,
      providerStatus,
      errorCode: "providerNotConfigured",
    };
  }

  return {
    provider: rawProvider,
    model: providerStatus.model,
    isConfigured: true,
    missingFields: [],
    invalidFields: [],
    providerStatus,
  };
};

/**
 * Convenience check: is the AI subsystem fully configured and ready to use?
 */
export const isAiConfigured = (environment?: AIEnvironment): boolean =>
  getAiConfigurationStatus(environment).isConfigured;

/**
 * Resolves the active AI provider, validates configuration, and returns a
 * cached (or freshly created) LanguageModel. Throws AIConfigurationError when
 * configuration is missing or invalid so callers don't silently receive a
 * broken model.
 */
export const getAiModel = (environment?: AIEnvironment): AILanguageModel => {
  const resolvedEnvironment = getAIEnvironment(environment);
  const configurationStatus = getAiConfigurationStatus(resolvedEnvironment);
  const normalizedModelName = configurationStatus.model;

  if (!configurationStatus.isConfigured || !configurationStatus.provider) {
    throw new AIConfigurationError(
      configurationStatus.errorCode ?? "providerNotConfigured",
      getAIConfigurationErrorMessage(configurationStatus),
      {
        provider: configurationStatus.provider,
        model: configurationStatus.model,
        missingFields: configurationStatus.missingFields,
        invalidFields: configurationStatus.invalidFields,
      }
    );
  }

  if (!normalizedModelName) {
    throw new AIConfigurationError(
      "providerNotConfigured",
      getAIConfigurationErrorMessage(configurationStatus),
      {
        provider: configurationStatus.provider,
        model: null,
        missingFields: configurationStatus.missingFields,
        invalidFields: configurationStatus.invalidFields,
      }
    );
  }

  const providerAdapter = getAIProviderAdapter(configurationStatus.provider);
  const cacheKey = providerAdapter.buildCacheKey(normalizedModelName, resolvedEnvironment);
  const cachedLanguageModel = getCachedLanguageModel(cacheKey);

  if (cachedLanguageModel) {
    return cachedLanguageModel;
  }

  const languageModel = providerAdapter.createModel(normalizedModelName, resolvedEnvironment);

  setCachedLanguageModel(cacheKey, languageModel);

  return languageModel;
};

/**
 * Clears the in-memory LRU cache so the next getAiModel() call creates a fresh
 * LanguageModel. Useful during credential rotation or provider re-configuration.
 */
export const resetLanguageModelCache = (): void => {
  languageModelCache.clear();
};

/**
 * AI module — unified interface for text and structured-object generation
 * across multiple LLM providers (AWS Bedrock, Google Vertex, Azure OpenAI,
 * OpenAI-compatible). Handles provider discovery, credential validation, and
 * LanguageModel caching.
 *
 * @example
 * ```typescript
 * import { generateText, isAiConfigured } from "@formbricks/ai";
 *
 * if (isAiConfigured()) {
 *   const result = await generateText({ prompt: "Summarise:" });
 * }
 * ```
 */
export {
  AIConfigurationError,
  getActiveAiProvider,
  getActiveAiModel,
  getAiConfigurationStatus,
  getAiModel,
  isAiConfigured,
  resetLanguageModelCache,
} from "./provider";
export { generateText } from "./text";
export { generateObject } from "./object";
export type { TAIProvider } from "@formbricks/types/ai";
export type {
  AIConfigurationStatus,
  AILanguageModel,
  AIEnvironment,
  AIProviderStatus,
  ActiveAIProvider,
  TGenerateObjectOptions,
  TGenerateObjectResult,
  TGenerateTextOptions,
  TGenerateTextResult,
} from "./types";

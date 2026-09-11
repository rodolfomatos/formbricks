import { generateText as generateTextWithConfiguredModel } from "ai";
import { getAiModel } from "./provider";
import type { AIEnvironment, TGenerateTextOptions, TGenerateTextResult } from "./types";

/**
 * Generates free-form text via the configured AI provider. Injects the resolved
 * LanguageModel so callers only supply the prompt / system instructions.
 *
 * @param options — AI SDK generation options (prompt, system, temperature, etc.) — `model` is injected
 * @param environment — Optional env overrides (defaults to process.env)
 * @returns — Raw generation result with text, finish reason, usage, and metadata
 */
export const generateText = async (
  options: TGenerateTextOptions,
  environment?: AIEnvironment
): Promise<TGenerateTextResult> => {
  const request = {
    ...options,
    model: getAiModel(environment),
  } as Parameters<typeof generateTextWithConfiguredModel>[0];

  return generateTextWithConfiguredModel(request);
};

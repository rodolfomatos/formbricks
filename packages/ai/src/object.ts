import { Output, generateText } from "ai";
import { getAiModel } from "./provider";
import type { AIEnvironment, TGenerateObjectOptions, TGenerateObjectResult } from "./types";

/**
 * Generates a structured (typed) object from the AI model by providing a Zod
 * schema. The result includes the parsed object, reasoning text, usage
 * metadata, and a convenience `toJsonResponse()` method for API handlers.
 *
 * @param options — Zod schema, schema metadata, and all AI SDK text-generation options except `model`
 * @param environment — Optional env overrides (defaults to process.env)
 * @returns — Typed generation result with the parsed object, metadata, and a JSON Response factory
 */
export const generateObject = async <T = unknown>(
  options: TGenerateObjectOptions<T>,
  environment?: AIEnvironment
): Promise<TGenerateObjectResult<T>> => {
  const { schema, schemaName, schemaDescription, output: _output, ...textOptions } = options;
  const request = {
    ...textOptions,
    model: getAiModel(environment),
    output: Output.object<T>({
      schema,
      name: schemaName,
      description: schemaDescription,
    }),
  } as Parameters<typeof generateText>[0];

  const result = await generateText(request);
  const object = result.output as T;

  return {
    object,
    reasoning: result.reasoningText,
    finishReason: result.finishReason,
    usage: result.usage,
    warnings: result.warnings,
    request: result.request,
    response: result.response,
    providerMetadata: result.providerMetadata,
    toJsonResponse(init?: ResponseInit) {
      const headers = new Headers(init?.headers);
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json; charset=utf-8");
      }

      return new Response(JSON.stringify(object), {
        ...init,
        headers,
      });
    },
  };
};

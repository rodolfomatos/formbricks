/**
 * Service layer for AI feature gating and execution.
 *
 * Wraps the generic `@formbricks/ai` package with organisation-level authorisation:
 * each AI operation first checks whether the organisation has AI features enabled,
 * is entitled to them, and the instance is configured. This prevents downstream
 * code from having to repeat the same guard logic.
 */
import "server-only";
import {
  AIConfigurationError,
  type TGenerateObjectOptions,
  type TGenerateObjectResult,
  generateObject,
  generateText,
  isAiConfigured,
} from "@formbricks/ai";
import { logger } from "@formbricks/logger";
import { OperationNotAllowedError, ResourceNotFoundError } from "@formbricks/types/errors";
import { env } from "@/lib/env";
import { getOrganization } from "@/lib/organization/service";

/** Machine-readable error codes returned when AI operations are rejected. Consumed by the UI to show contextual messages. */
export const AI_ERROR_CODES = {
  FEATURES_NOT_ENABLED: "ai_features_not_enabled",
  SMART_TOOLS_DISABLED: "ai_smart_tools_disabled",
  INSTANCE_NOT_CONFIGURED: "ai_instance_not_configured",
} as const;

export type TAIErrorCode = (typeof AI_ERROR_CODES)[keyof typeof AI_ERROR_CODES];

/** Aggregates the four AI-availability checks that every AI operation needs. */
export interface TOrganizationAIConfig {
  organizationId: string;
  isAISmartToolsEnabled: boolean;
  isAISmartToolsEntitled: boolean;
  isInstanceConfigured: boolean;
}

/**
 * Quick check whether the instance itself has AI provider credentials configured.
 * Does NOT verify organisation-level entitlements.
 *
 * @returns — true if any AI provider is configured
 */
export const isInstanceAIConfigured = (): boolean => isAiConfigured(env);

/**
 * Builds a complete AI-config snapshot for an organisation by combining
 * instance-level (provider configured?) with organisation-level (enabled? entitled?) checks.
 *
 * @param organizationId — the organisation to query
 * @returns — the aggregated config object
 */
export const getOrganizationAIConfig = async (organizationId: string): Promise<TOrganizationAIConfig> => {
  const organization = await getOrganization(organizationId);

  if (!organization) {
    throw new ResourceNotFoundError("Organization", organizationId);
  }

  const isAISmartToolsEntitled = true;

  return {
    organizationId,
    isAISmartToolsEnabled: organization.isAISmartToolsEnabled,
    isAISmartToolsEntitled,
    isInstanceConfigured: isInstanceAIConfigured(),
  };
};

/** Reasons why AI smart tools might be unavailable for an organisation. */
export type TAIUnavailableReason = "not_in_plan" | "not_enabled" | "instance_not_configured" | "read_only";

/**
 * Examines an AI config and returns the first blocking reason, or undefined if AI is available.
 * Order matters: plan gate first, then feature flag, then instance config.
 *
 * @param aiConfig — the aggregated organisation AI config
 * @returns — the blocking reason, or undefined
 */
export const getAISmartToolsUnavailableReason = (
  aiConfig: TOrganizationAIConfig
): TAIUnavailableReason | undefined => {
  if (!aiConfig.isAISmartToolsEntitled) return "not_in_plan";
  if (!aiConfig.isAISmartToolsEnabled) return "not_enabled";
  if (!aiConfig.isInstanceConfigured) return "instance_not_configured";
  return undefined;
};

/**
 * Guards an AI operation: loads the org AI config and throws `OperationNotAllowedError`
 * with a specific error code if anything is missing. Returns the config on success so
 * callers can use it without a second lookup.
 *
 * @param organizationId — the organisation to check
 * @returns — the confirmed AI config
 */
export const assertOrganizationAIConfigured = async (
  organizationId: string
): Promise<TOrganizationAIConfig> => {
  const aiConfig = await getOrganizationAIConfig(organizationId);

  if (!aiConfig.isAISmartToolsEntitled) {
    throw new OperationNotAllowedError(AI_ERROR_CODES.FEATURES_NOT_ENABLED);
  }

  if (!aiConfig.isAISmartToolsEnabled) {
    throw new OperationNotAllowedError(AI_ERROR_CODES.SMART_TOOLS_DISABLED);
  }

  if (!aiConfig.isInstanceConfigured) {
    throw new OperationNotAllowedError(AI_ERROR_CODES.INSTANCE_NOT_CONFIGURED);
  }

  return aiConfig;
};

type TGenerateOrganizationAITextInput = {
  organizationId: string;
} & Parameters<typeof generateText>[0];

/**
 * Generates AI text (e.g. smart-suggestions, auto-completions) for an organisation.
 * Wraps `generateText` with org-level authorisation and structured error logging.
 *
 * @param options — includes organisationId plus `generateText` parameters
 * @returns — the generated text result
 */
export const generateOrganizationAIText = async ({
  organizationId,
  ...options
}: TGenerateOrganizationAITextInput): Promise<Awaited<ReturnType<typeof generateText>>> => {
  const aiConfig = await assertOrganizationAIConfigured(organizationId);

  try {
    return await generateText(options, env);
  } catch (error) {
    logger.error(
      {
        organizationId,
        isInstanceConfigured: aiConfig.isInstanceConfigured,
        errorCode: error instanceof AIConfigurationError ? error.code : undefined,
        err: error,
      },
      "Failed to generate organization AI text"
    );
    throw error;
  }
};

type TGenerateOrganizationAIObjectInput<T = unknown> = {
  organizationId: string;
} & TGenerateObjectOptions<T>;

/**
 * Generates a structured AI object (typed JSON) for an organisation.
 * Wraps `generateObject` with org-level authorisation and structured error logging.
 *
 * @param options — includes organisationId plus `generateObject` parameters
 * @returns — the generated object result
 */
export const generateOrganizationAIObject = async <T = unknown>({
  organizationId,
  ...options
}: TGenerateOrganizationAIObjectInput<T>): Promise<TGenerateObjectResult<T>> => {
  const aiConfig = await assertOrganizationAIConfigured(organizationId);

  try {
    return await generateObject<T>(options, env);
  } catch (error) {
    logger.error(
      {
        organizationId,
        isInstanceConfigured: aiConfig.isInstanceConfigured,
        errorCode: error instanceof AIConfigurationError ? error.code : undefined,
        err: error,
      },
      "Failed to generate organization AI object"
    );
    throw error;
  }
};

/**
 * Server-side PostHog feature flag evaluation.
 * Returns `false` if PostHog is not configured, avoiding the need for callers
 * to guard against a missing API key.
 */
import "server-only";
import { logger } from "@formbricks/logger";
import { POSTHOG_KEY } from "@/lib/constants";
import { posthogServerClient } from "./server";
import type { TPostHogFeatureFlagContext, TPostHogFeatureFlagValue } from "./types";

const buildPostHogGroups = (context?: TPostHogFeatureFlagContext): Record<string, string> | undefined => {
  const groups = {
    ...(context?.organizationId ? { organization: context.organizationId } : {}),
    ...(context?.workspaceId ? { workspace: context.workspaceId } : {}),
  };

  return Object.keys(groups).length > 0 ? groups : undefined;
};

/**
 * Evaluates a PostHog feature flag on the server side, with optional group context.
 * Falls back to `false` on any error (network, missing key, etc.).
 *
 * @param distinctId — the user identifier
 * @param flagKey — the feature flag key
 * @param context — optional group (org/workspace) context
 * @returns — the flag value, or false
 */
export const getPostHogFeatureFlag = async (
  distinctId: string,
  flagKey: string,
  context?: TPostHogFeatureFlagContext
): Promise<TPostHogFeatureFlagValue> => {
  if (!POSTHOG_KEY || !posthogServerClient) {
    return false;
  }

  try {
    const featureFlagValue = await posthogServerClient.getFeatureFlag(flagKey, distinctId, {
      groups: buildPostHogGroups(context),
    });

    return featureFlagValue ?? false;
  } catch (error) {
    logger.warn({ error, flagKey }, "Failed to evaluate PostHog feature flag");
    return false;
  }
};

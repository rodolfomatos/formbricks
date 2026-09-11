/** PostHog feature flag values — booleans for simple toggles, strings for multivariate experiments. */
export type TPostHogFeatureFlagValue = boolean | string;

/** Group context for feature flag evaluation: scopes flags to an organisation or workspace. */
export type TPostHogFeatureFlagContext = {
  organizationId?: string;
  workspaceId?: string;
};

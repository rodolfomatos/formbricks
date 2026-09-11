/**
 * Resolves the settings path for billing or enterprise based on whether the
 * instance is Formbricks Cloud. Centralises a routing decision made in multiple
 * places so any change only touches one file.
 *
 * @param workspaceId — the active workspace
 * @param isFormbricksCloud — whether this is the cloud instance
 * @returns — the relative URL path
 */
export const getBillingFallbackPath = (workspaceId: string, isFormbricksCloud: boolean): string => {
  const settingsPath = isFormbricksCloud ? "billing" : "enterprise";
  return `/workspaces/${workspaceId}/settings/organization/${settingsPath}`;
};

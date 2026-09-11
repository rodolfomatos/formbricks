import { logger } from "@formbricks/logger";

/**
 * Initiates Slack OAuth by requesting an authorization URL from the backend API.
 * Returns the URL the user should be redirected to for Slack consent.
 */
export const authorize = async (workspaceId: string, apiHost: string): Promise<string> => {
  const res = await fetch(`${apiHost}/api/v1/integrations/slack`, {
    method: "GET",
    headers: { workspaceId },
  });

  if (!res.ok) {
    const errorText = await res.text();
    logger.error({ errorText }, "authorize: Could not fetch slack config");
    throw new Error("Could not create response");
  }
  const resJSON = await res.json();
  const authUrl = resJSON.data.authUrl;
  return authUrl;
};

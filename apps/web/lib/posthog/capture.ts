/**
 * PostHog server-side event capture functions.
 *
 * Wraps the PostHog Node client so callers can fire events and group-identify
 * without importing or checking for the client themselves. Events include source
 * metadata and optional group context (organisation + workspace).
 */
import "server-only";
import { logger } from "@formbricks/logger";
import { posthogServerClient } from "./server";

type PostHogEventProperties = Record<string, string | number | boolean | null | undefined>;

export type PostHogGroupContext = {
  organizationId?: string;
  workspaceId?: string;
};

const buildGroups = (context?: PostHogGroupContext): Record<string, string> | undefined => {
  if (!context) return undefined;
  const groups: Record<string, string> = {};
  if (context.organizationId) groups.organization = context.organizationId;
  if (context.workspaceId) groups.workspace = context.workspaceId;
  return Object.keys(groups).length > 0 ? groups : undefined;
};

/**
 * Captures a custom event in PostHog with optional group association.
 * Silently no-ops if the PostHog client is not initialised (no key configured).
 *
 * @param distinctId — the user identifier
 * @param eventName — the event name (e.g. "survey_created")
 * @param properties — event properties
 * @param groupContext — organisation/workspace group association
 */
export function capturePostHogEvent(
  distinctId: string,
  eventName: string,
  properties?: PostHogEventProperties,
  groupContext?: PostHogGroupContext
): void {
  if (!posthogServerClient) return;

  try {
    posthogServerClient.capture({
      distinctId,
      event: eventName,
      properties: {
        ...properties,
        $lib: "posthog-node",
        source: "server",
      },
      groups: buildGroups(groupContext),
    });
  } catch (error) {
    logger.warn({ error, eventName }, "Failed to capture PostHog event");
  }
}

type PostHogGroupType = "organization" | "workspace";

/**
 * Associates a group (organisation or workspace) with properties in PostHog.
 * Used for group-level analytics (e.g. "how many responses per workspace").
 *
 * @param groupType — "organization" or "workspace"
 * @param groupKey — the group identifier
 * @param properties — group properties
 */
export function groupIdentifyPostHog(
  groupType: PostHogGroupType,
  groupKey: string,
  properties?: Record<string, string | number | boolean | null | undefined>
): void {
  if (!posthogServerClient) return;

  try {
    posthogServerClient.groupIdentify({
      groupType,
      groupKey,
      properties,
    });
  } catch (error) {
    logger.warn({ error, groupType, groupKey }, "Failed to identify PostHog group");
  }
}

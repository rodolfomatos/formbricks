import type { TAIUnavailableReason } from "@/lib/ai/service";

/** Describes the kind of action a user can take to resolve an AI unavailability reason. */
export type TAIUnavailableActionType = "enable_ai" | "upgrade_plan";

/** Links the user to the settings page where they can fix the AI unavailability. */
export type TAIUnavailableAction = {
  href: string;
  type: TAIUnavailableActionType;
};

/**
 * Resolves an AI-unavailability reason into a remedial action with a link.
 * Saves UI code from having to map reasons to routes.
 *
 * @param reason — why AI is unavailable (or undefined if available)
 * @param workspaceId — used to build the settings URL
 * @returns — the action to take, or undefined if AI is already available
 */
export const getAIUnavailableAction = (
  reason: TAIUnavailableReason | undefined,
  workspaceId: string
): TAIUnavailableAction | undefined => {
  if (reason === "not_enabled") {
    return {
      href: `/workspaces/${workspaceId}/settings/organization/general`,
      type: "enable_ai",
    };
  }

  if (reason === "not_in_plan") {
    return {
      href: `/workspaces/${workspaceId}/settings/organization/billing`,
      type: "upgrade_plan",
    };
  }

  return undefined;
};

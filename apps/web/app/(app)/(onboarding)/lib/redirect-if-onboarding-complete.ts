import "server-only";
import { redirect } from "next/navigation";
import { TWorkspace } from "@formbricks/types/workspace";
import { IS_FORMBRICKS_CLOUD } from "@/lib/constants";
import { getSurveyCount } from "@/lib/survey/service";

/**
 * Redirects the user away from the onboarding flow if they already have surveys.
 * Prevents re-showing onboarding to users who have completed it.
 */
export const redirectIfOnboardingComplete = async (workspaceId: string): Promise<void> => {
  const surveyCount = await getSurveyCount(workspaceId);

  if (surveyCount > 0) {
    redirect(`/workspaces/${workspaceId}/`);
  }
};

/**
 * Determines where a user should be redirected during onboarding:
 * - No surveys yet: cloud users go to plan selection, self-hosted to survey creation
 * - Has surveys: returns null (stay on current page)
 */
export const getOnboardingRedirectPath = async ({
  organizationId,
  workspace,
}: {
  organizationId: string;
  workspace: TWorkspace | undefined;
}): Promise<string | null> => {
  if (!workspace) {
    return null;
  }

  const surveyCount = await getSurveyCount(workspace.id);

  if (surveyCount === 0) {
    if (IS_FORMBRICKS_CLOUD) {
      return `/organizations/${organizationId}/workspaces/new/plan`;
    }

    return `/organizations/${organizationId}/workspaces/new/survey`;
  }

  return null;
};

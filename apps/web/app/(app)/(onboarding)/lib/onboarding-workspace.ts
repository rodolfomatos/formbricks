import "server-only";
import { AuthorizationError, ResourceNotFoundError } from "@formbricks/types/errors";
import { TOrganization } from "@formbricks/types/organizations";
import { TWorkspace } from "@formbricks/types/workspace";
import { getMembershipByUserIdOrganizationId } from "@/lib/membership/service";
import { getAccessFlags } from "@/lib/membership/utils";
import { getOrganization, updateOrganization } from "@/lib/organization/service";
import { getUserWorkspaces, getWorkspaces } from "@/lib/workspace/service";

/**
 * Picks the oldest workspace (by createdAt) from a list.
 * Used during onboarding to select the workspace to create the first survey in.
 */
export const selectOldestWorkspace = (workspaces: TWorkspace[]): TWorkspace | undefined => {
  if (workspaces.length === 0) {
    return undefined;
  }

  return [...workspaces].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())[0];
};

const assertCanManageOnboardingWorkspace = async (userId: string, organizationId: string): Promise<void> => {
  const membership = await getMembershipByUserIdOrganizationId(userId, organizationId);
  const { isOwner, isManager } = getAccessFlags(membership?.role);

  if (!isOwner && !isManager) {
    throw new AuthorizationError("User is not authorized to create a workspace in this organization");
  }
};

const ensureOrganizationAISmartTools = async (
  organizationId: string
): Promise<{ organization: TOrganization; isEntitled: boolean }> => {
  let organization = await getOrganization(organizationId);

  if (!organization) {
    throw new ResourceNotFoundError("Organization", organizationId);
  }

  const isEntitled = true;

  if (isEntitled && !organization.isAISmartToolsEnabled) {
    organization = await updateOrganization(organizationId, { isAISmartToolsEnabled: true });
  }

  return { organization, isEntitled };
};

/**
 * Resolves the workspace to use during onboarding.
 * Prefers the user's oldest workspace; falls back to the organization's oldest workspace.
 */
export const getOnboardingWorkspace = async (
  userId: string,
  organizationId: string
): Promise<TWorkspace | undefined> => {
  const userWorkspaces = await getUserWorkspaces(userId, organizationId);
  const userWorkspace = selectOldestWorkspace(userWorkspaces);

  if (userWorkspace) {
    return userWorkspace;
  }

  const organizationWorkspaces = await getWorkspaces(organizationId);
  return selectOldestWorkspace(organizationWorkspaces);
};

export type TOnboardingWorkspaceContext = {
  workspace: TWorkspace;
  isAISmartToolsEnabled: boolean;
  isAISmartToolsEntitled: boolean;
};

/**
 * Assembles the onboarding workspace context: validates the user can manage workspaces,
 * ensures AI smart tools are enabled if entitled, and resolves the target workspace.
 */
export const getOnboardingWorkspaceContext = async ({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string;
}): Promise<TOnboardingWorkspaceContext> => {
  await assertCanManageOnboardingWorkspace(userId, organizationId);

  const { organization, isEntitled } = await ensureOrganizationAISmartTools(organizationId);
  const workspace = await getOnboardingWorkspace(userId, organizationId);

  if (!workspace) {
    throw new ResourceNotFoundError("Onboarding workspace for organization", organizationId);
  }

  return {
    workspace,
    isAISmartToolsEnabled: organization.isAISmartToolsEnabled,
    isAISmartToolsEntitled: isEntitled,
  };
};

"use server";

import "server-only";
import { AuthorizationError, ResourceNotFoundError } from "@formbricks/types/errors";
import { getOrganizationByWorkspaceId } from "../../organization/service";
import { getMembershipByUserIdOrganizationId } from "../service";

/**
 * Server action that resolves the current user's membership role for a workspace.
 * Bridges the gap between React components (which have the workspace ID) and the
 * membership service (which uses organisation ID).
 *
 * @param workspaceId — the workspace to check membership for
 * @param userId — the user to look up
 * @returns — the user's organisation role
 */
export const getMembershipByUserIdOrganizationIdAction = async (workspaceId: string, userId: string) => {
  const organization = await getOrganizationByWorkspaceId(workspaceId);

  if (!organization) {
    throw new ResourceNotFoundError("Organization", null);
  }

  const currentUserMembership = await getMembershipRole(userId, organization.id);

  return currentUserMembership;
};

export const getMembershipRole = async (userId: string, organizationId: string) => {
  const membership = await getMembershipByUserIdOrganizationId(userId, organizationId);
  if (!membership) {
    throw new AuthorizationError("Not authorized");
  }

  return membership.role;
};

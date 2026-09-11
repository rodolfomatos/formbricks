import "server-only";
import { ZId } from "@formbricks/types/common";
import { getMembershipByUserIdOrganizationId } from "../membership/service";
import { getAccessFlags } from "../membership/utils";
import { validateInputs } from "../utils/validate";
import { getOrganizationsByUserId } from "./service";

/**
 * Checks whether a user belongs to the given organisation through any membership.
 * Used as the first gate in route-level authorisation.
 *
 * @param userId — the user to check
 * @param organizationId — the target organisation
 * @returns — true if the user is a member
 */
export const canUserAccessOrganization = async (userId: string, organizationId: string): Promise<boolean> => {
  validateInputs([userId, ZId], [organizationId, ZId]);

  try {
    const userOrganizations = await getOrganizationsByUserId(userId);
    return userOrganizations.some((organization) => organization.id === organizationId);
  } catch (error) {
    throw error;
  }
};

/**
 * Returns a fine-grained access bitmap for a user within an organisation.
 * Owners get full access; managers get member-management + billing but not
 * create/delete; members get read-only.
 *
 * @param organizationId — the organisation
 * @param userId — the user to evaluate
 * @returns — access flags for each capability
 */
export const verifyUserRoleAccess = async (
  organizationId: string,
  userId: string
): Promise<{
  hasCreateOrUpdateAccess: boolean;
  hasDeleteAccess: boolean;
  hasCreateOrUpdateMembersAccess: boolean;
  hasDeleteMembersAccess: boolean;
  hasBillingAccess: boolean;
}> => {
  const accessObject = {
    hasCreateOrUpdateAccess: true,
    hasDeleteAccess: true,
    hasCreateOrUpdateMembersAccess: true,
    hasDeleteMembersAccess: true,
    hasBillingAccess: true,
  };

  const currentUserMembership = await getMembershipByUserIdOrganizationId(userId, organizationId);
  const { isOwner, isManager } = getAccessFlags(currentUserMembership?.role);

  if (!isOwner) {
    accessObject.hasCreateOrUpdateAccess = false;
    accessObject.hasDeleteAccess = false;
    accessObject.hasCreateOrUpdateMembersAccess = false;
    accessObject.hasDeleteMembersAccess = false;
    accessObject.hasBillingAccess = false;
  }

  if (isManager) {
    accessObject.hasCreateOrUpdateMembersAccess = true;
    accessObject.hasDeleteMembersAccess = true;
    accessObject.hasBillingAccess = true;
  }

  return accessObject;
};

import { logger } from "@formbricks/logger";
import { OrganizationAccessType } from "@formbricks/types/api-key";
import { TAuthenticationApiKey } from "@formbricks/types/auth";
import { hasOrganizationAccess } from "@/modules/organization/settings/api-keys/lib/utils";

/**
 * Validates that the param organizationId matches the authenticated org and that the API key has the required access level.
 *
 * @param paramOrganizationId — The organization ID from the route params
 * @param authentication — The authenticated API key data
 * @param accessType — Required access level (Read/Write)
 * @returns — True if both org matches and access level is sufficient
 */
export const hasOrganizationIdAndAccess = (
  paramOrganizationId: string,
  authentication: TAuthenticationApiKey,
  accessType: OrganizationAccessType
): boolean => {
  if (paramOrganizationId !== authentication.organizationId) {
    logger.error("Organization ID from params does not match the authenticated organization ID");

    return false;
  }

  return hasOrganizationAccess(authentication, accessType);
};

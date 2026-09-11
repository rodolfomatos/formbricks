"use server";

import { z } from "zod";
import { ZId } from "@formbricks/types/common";
import { getOrganization } from "@/lib/organization/service";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client/action-client-middleware";

const ZGetOrganizationBillingInfoAction = z.object({
  organizationId: ZId,
});

/**
 * Server action that fetches billing info for an organization. Authorises
 * that the caller holds a billing-role in that org before returning data.
 *
 * @param organizationId — the org whose billing record to retrieve
 * @returns — the org's billing details or null
 */
export const getOrganizationBillingInfoAction = authenticatedActionClient
  .inputSchema(ZGetOrganizationBillingInfoAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: parsedInput.organizationId,
      access: [
        {
          type: "organization",
          roles: ["owner", "manager", "billing"],
        },
      ],
    });

    const organization = await getOrganization(parsedInput.organizationId);
    return organization?.billing;
  });

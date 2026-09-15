"use server";

import { z } from "zod";
import { ZId } from "@formbricks/types/common";
import { ZOrganizationWhitelabel } from "@formbricks/types/organizations";
import { updateOrganization } from "@/lib/organization/service";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client/action-client-middleware";

const ZUpdateOrganizationWhitelabelAction = z.object({
  organizationId: ZId,
  whitelabel: ZOrganizationWhitelabel,
});

export const updateOrganizationWhitelabelAction = authenticatedActionClient
  .inputSchema(ZUpdateOrganizationWhitelabelAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: parsedInput.organizationId,
      access: [{ type: "organization", roles: ["owner", "manager"] }],
    });

    return await updateOrganization(parsedInput.organizationId, {
      whitelabel: parsedInput.whitelabel,
    });
  });

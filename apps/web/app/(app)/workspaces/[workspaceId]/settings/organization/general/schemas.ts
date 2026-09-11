import { z } from "zod";
import { ZId } from "@formbricks/types/common";
import { ZOrganizationUpdateInput } from "@formbricks/types/organizations";

/**
 * Schema for updating AI smart tools settings for an organization.
 */
export const ZOrganizationAISettingsInput = ZOrganizationUpdateInput.pick({
  isAISmartToolsEnabled: true,
});

/**
 * Action input schema for the updateOrganizationAISettingsAction server action.
 */
export const ZUpdateOrganizationAISettingsAction = z.object({
  organizationId: ZId,
  data: ZOrganizationAISettingsInput,
});

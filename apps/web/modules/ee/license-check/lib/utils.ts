import { cache } from "react";

export const getRemoveBrandingPermission = cache(async (_organizationId: string): Promise<boolean> => true);
export const getWhiteLabelPermission = cache(async (_organizationId: string): Promise<boolean> => true);
export const getIsMultiOrgEnabled = cache(async (): Promise<boolean> => true);
export const getIsContactsEnabled = cache(async (_organizationId: string): Promise<boolean> => true);
export const getIsTwoFactorAuthEnabled = cache(async (): Promise<boolean> => true);
export const getIsSsoEnabled = cache(async (): Promise<boolean> => true);
export const getIsQuotasEnabled = cache(async (_organizationId: string): Promise<boolean> => true);
export const getIsAISmartToolsEnabled = cache(async (_organizationId: string): Promise<boolean> => true);
export const getIsAuditLogsEnabled = cache(async (): Promise<boolean> => true);
export const getIsSpamProtectionEnabled = cache(async (_organizationId: string): Promise<boolean> => true);
export const getAccessControlPermission = cache(async (_organizationId: string): Promise<boolean> => true);
export const getIsFeedbackDirectoriesEnabled = cache(async (_organizationId: string): Promise<boolean> => true);
export const getIsDashboardsEnabled = cache(async (_organizationId: string): Promise<boolean> => true);
export const getBulkInvitePermission = cache(async (_organizationId: string): Promise<boolean> => true);
export const getIsSamlSsoEnabled = cache(async (): Promise<boolean> => true);
export const getBiggerUploadFileSizePermission = cache(async (_organizationId: string): Promise<boolean> => true);
export const getOrganizationWorkspacesLimit = cache(async (_organizationId: string): Promise<number> => Infinity);

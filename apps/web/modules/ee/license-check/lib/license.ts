import { cache } from "react";
import type { TEnterpriseLicenseResult } from "../types/enterprise-license";

export const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export const getEnterpriseLicense = cache(async (): Promise<TEnterpriseLicenseResult> => ({
  active: true,
  features: {
    isMultiOrgEnabled: true,
    twoFactorAuth: true,
    sso: true,
    whitelabel: true,
    removeBranding: true,
    contacts: true,
    aiSmartTools: true,
    saml: true,
    spamProtection: true,
    auditLogs: true,
    accessControl: true,
    quotas: true,
    feedbackDirectories: true,
    dashboards: true,
    workspaces: Infinity,
  },
  workspaces: null,
  lastChecked: new Date(),
  isPendingDowngrade: false,
  fallbackLevel: "live",
  status: "active",
}));

export interface TEnterpriseLicenseFeatures {
  isMultiOrgEnabled: boolean;
  twoFactorAuth: boolean;
  sso: boolean;
  whitelabel: boolean;
  removeBranding: boolean;
  contacts: boolean;
  aiSmartTools: boolean;
  saml: boolean;
  spamProtection: boolean;
  auditLogs: boolean;
  accessControl: boolean;
  quotas: boolean;
  feedbackDirectories: boolean;
  dashboards: boolean;
  workspaces: number;
}

export type TLicenseStatus =
  | "active"
  | "expired"
  | "inactive"
  | "instance_mismatch"
  | "invalid_license"
  | "no-license"
  | "pending"
  | "unreachable";

export interface TEnterpriseLicenseResult {
  active: boolean;
  features: TEnterpriseLicenseFeatures;
  workspaces: number | null;
  lastChecked: Date;
  isPendingDowngrade: boolean;
  fallbackLevel: string;
  status: TLicenseStatus;
}

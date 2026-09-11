import "server-only";
import { IS_FORMBRICKS_CLOUD } from "@/lib/constants";
import {
  hasOrganizationEntitlement,
  hasOrganizationEntitlementWithLicenseGuard,
} from "@/modules/entitlements/lib/checks";

/**
 * Gate a feature check behind the cloud-only guard so self-hosted instances
 * always return false without needing entitlement infrastructure.
 *
 * @param organizationId — the org whose entitlements to inspect
 * @param featureLookupKey — Stripe lookup key identifying the feature
 * @returns — true only on Formbricks Cloud when the feature is entitled
 */
export const hasCloudEntitlement = async (
  organizationId: string,
  featureLookupKey: string
): Promise<boolean> => {
  if (!IS_FORMBRICKS_CLOUD) return false;
  return hasOrganizationEntitlement(organizationId, featureLookupKey);
};

/**
 * Like hasCloudEntitlement but also rejects when the org's license is
 * invalid, providing a second layer of gating for sensitive features.
 *
 * @param organizationId — the org whose entitlements to inspect
 * @param featureLookupKey — Stripe lookup key identifying the feature
 * @returns — true only on Formbricks Cloud when the feature is entitled AND the license passes
 */
export const hasCloudEntitlementWithLicenseGuard = async (
  organizationId: string,
  featureLookupKey: string
): Promise<boolean> => {
  if (!IS_FORMBRICKS_CLOUD) return false;
  return hasOrganizationEntitlementWithLicenseGuard(organizationId, featureLookupKey);
};

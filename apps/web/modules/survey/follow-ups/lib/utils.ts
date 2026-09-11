import { IS_FORMBRICKS_CLOUD } from "@/lib/constants";
import { hasCloudEntitlementWithLicenseGuard } from "@/modules/billing/lib/feature-access";
import { CLOUD_STRIPE_FEATURE_LOOKUP_KEYS } from "@/modules/billing/lib/stripe-catalog";

/** Checks whether the organisation has permission to use survey follow-ups. On Formbricks Cloud this checks Stripe entitlement; self-hosted always returns true. */
export const getSurveyFollowUpsPermission = async (organizationId: string): Promise<boolean> => {
  if (IS_FORMBRICKS_CLOUD) {
    return hasCloudEntitlementWithLicenseGuard(organizationId, CLOUD_STRIPE_FEATURE_LOOKUP_KEYS.FOLLOW_UPS);
  }
  return true;
};

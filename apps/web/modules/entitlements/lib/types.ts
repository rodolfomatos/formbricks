import type { TOrganizationStripeSubscriptionStatus } from "@formbricks/types/organizations";
import { CLOUD_STRIPE_FEATURE_LOOKUP_KEYS } from "@/modules/billing/lib/stripe-catalog";
import type {
  TEnterpriseLicenseFeatures,
  TLicenseStatus,
} from "@/modules/ee/license-check/types/enterprise-license";

/**
 * Identifies where an organisation's entitlement information was sourced.
 * Cloud organisations use Stripe; self-hosted organisations use the EE license.
 */
export type TEntitlementSource = "cloud_stripe" | "self_hosted_license";
/**
 * Union of all feature keys known at build time (derived from the Stripe
 * catalogue). Runtime usage-triggered keys (e.g. "responses-50000") are
 * represented by TUsageLimitEntitlementFeature.
 */
export type TKnownEntitlementFeature =
  (typeof CLOUD_STRIPE_FEATURE_LOOKUP_KEYS)[keyof typeof CLOUD_STRIPE_FEATURE_LOOKUP_KEYS];
/**
 * Pattern for usage-based entitlement keys that are generated at runtime
 * (e.g. "responses-50000") rather than defined in the static catalogue.
 */
export type TUsageLimitEntitlementFeature = `responses-${number}`;
/** Any entitlement feature key — known (from catalogue) or usage-based. */
export type TEntitlementFeature = TKnownEntitlementFeature | TUsageLimitEntitlementFeature;

const KNOWN_ENTITLEMENT_FEATURES: readonly TKnownEntitlementFeature[] = Object.values(
  CLOUD_STRIPE_FEATURE_LOOKUP_KEYS
) as TKnownEntitlementFeature[];

/**
 * Type guard that narrows an arbitrary string to a TEntitlementFeature.
 * Accepts known catalogue features and the "responses-{N}" pattern.
 *
 * @param feature — the string to test
 * @returns — true if the string is a recognised entitlement feature key
 */
export const isEntitlementFeature = (feature: string): feature is TEntitlementFeature => {
  if ((KNOWN_ENTITLEMENT_FEATURES as readonly string[]).includes(feature)) {
    return true;
  }

  return /^responses-\d+$/.test(feature);
};

/** Numeric limits associated with an organisation's entitlement. */
export type TEntitlementLimits = {
  workspaces: number | null;
  monthlyResponses: number | null;
};

/**
 * Complete entitlement snapshot for an organisation — which features are
 * enabled, what the numeric limits are, the license state, and the Stripe
 * subscription details (if applicable).
 */
export type TOrganizationEntitlementsContext = {
  organizationId: string;
  source: TEntitlementSource;
  features: TEntitlementFeature[];
  limits: TEntitlementLimits;
  licenseStatus: TLicenseStatus;
  licenseFeatures: TEnterpriseLicenseFeatures | null;
  stripeCustomerId: string | null;
  subscriptionStatus: TOrganizationStripeSubscriptionStatus | null;
  usageCycleAnchor: Date | null;
};

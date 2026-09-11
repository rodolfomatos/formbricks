"use server";

import { TCloudBillingPlan } from "@formbricks/types/organizations";
import { getOrganizationsByUserId } from "@/lib/organization/service";
import { authenticatedActionClient } from "@/lib/utils/action-client";

/**
 * Checks whether the current user is an active paying customer (has a paid,
 * active/trialing subscription in any organization).
 */
export const getIsActiveCustomerAction = authenticatedActionClient.action(async ({ ctx }) => {
  const paidBillingPlans = new Set<TCloudBillingPlan>(["pro", "scale", "custom"]);

  const organizations = await getOrganizationsByUserId(ctx.user.id);
  return organizations.some((organization) => {
    const stripe = organization.billing.stripe;
    const isPaidPlan = stripe?.plan ? paidBillingPlans.has(stripe.plan) : false;
    const isActiveSubscription =
      stripe?.subscriptionStatus === "active" || stripe?.subscriptionStatus === "trialing";
    return isPaidPlan && isActiveSubscription;
  });
});

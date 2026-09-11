import { prisma } from "@formbricks/database";
import { logger } from "@formbricks/logger";

export const getDefaultOrganizationBilling = () => ({
  limits: {
    workspaces: 1,
    monthly: { responses: 250 },
  },
});

export const getOrganizationBillingWithReadThroughSync = async (organizationId: string) => {
  const billing = await prisma.organizationBilling.findUnique({
    where: { organizationId },
  });

  return billing;
};

export const invalidateOrganizationBillingCache = async (organizationId: string) => {
  logger.debug({ organizationId }, "Invalidating organization billing cache");
};

export const ensureCloudStripeSetupForOrganization = async (organizationId: string) => {
  logger.debug({ organizationId }, "Ensuring Stripe setup for organization");
};

export const cleanupStripeCustomer = async (organizationId: string) => {
  logger.debug({ organizationId }, "Cleaning up Stripe customer");
};

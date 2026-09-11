import "server-only";
import { cache as reactCache } from "react";
import { IS_FORMBRICKS_CLOUD } from "@/lib/constants";
import { getCloudOrganizationEntitlementsContext } from "./cloud-provider";
import { getSelfHostedOrganizationEntitlementsContext } from "./self-hosted-provider";
import type { TOrganizationEntitlementsContext } from "./types";

/**
 * React-cached dispatch that returns the entitlement context for an
 * organisation. On Formbricks Cloud it delegates to Stripe-based lookups;
 * on self-hosted instances it derives from the enterprise license.
 *
 * The reactCache wrapper deduplicates concurrent requests for the same
 * org within a single render pass.
 *
 * @param organizationId — the organisation to look up
 * @returns — the merged entitlement context
 */
export const getOrganizationEntitlementsContext = reactCache(
  async (organizationId: string): Promise<TOrganizationEntitlementsContext> => {
    if (IS_FORMBRICKS_CLOUD) {
      return getCloudOrganizationEntitlementsContext(organizationId);
    }

    return getSelfHostedOrganizationEntitlementsContext(organizationId);
  }
);

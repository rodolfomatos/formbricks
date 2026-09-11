import { redirect } from "next/navigation";
import { IS_FORMBRICKS_CLOUD } from "@/lib/constants";
import { getBillingFallbackPath } from "@/lib/membership/navigation";
import { getWorkspaceAuth } from "@/modules/workspaces/lib/utils";

/**
 * Redirects billing-role users away from settings pages to their billing fallback.
 */
export const redirectBillingRoleFromRestrictedSettings = async (workspaceId: string): Promise<void> => {
  const { isBilling } = await getWorkspaceAuth(workspaceId);

  if (isBilling) {
    redirect(getBillingFallbackPath(workspaceId, IS_FORMBRICKS_CLOUD));
  }
};

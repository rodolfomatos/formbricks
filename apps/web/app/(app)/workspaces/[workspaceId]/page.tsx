import { redirect } from "next/navigation";
import { IS_FORMBRICKS_CLOUD } from "@/lib/constants";
import { getBillingFallbackPath } from "@/lib/membership/navigation";
import { getMembershipByUserIdOrganizationId } from "@/lib/membership/service";
import { getAccessFlags } from "@/lib/membership/utils";
import { getWorkspaceAuth } from "@/modules/workspaces/lib/utils";

/**
 * Route: `/workspaces/[workspaceId]` (authenticated).
 * Redirects billing-only members to their billing fallback page and all other members
 * to the surveys list for this workspace.
 */
const WorkspacePage = async (props: { params: Promise<{ workspaceId: string }> }) => {
  const params = await props.params;
  const { session, organization } = await getWorkspaceAuth(params.workspaceId);

  const currentUserMembership = await getMembershipByUserIdOrganizationId(session?.user.id, organization.id);
  const { isBilling } = getAccessFlags(currentUserMembership?.role);

  if (isBilling) {
    return redirect(getBillingFallbackPath(params.workspaceId, IS_FORMBRICKS_CLOUD));
  }

  return redirect(`/workspaces/${params.workspaceId}/surveys`);
};

export default WorkspacePage;

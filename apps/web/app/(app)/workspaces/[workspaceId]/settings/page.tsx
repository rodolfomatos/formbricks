import { redirect } from "next/navigation";
import { redirectBillingRoleFromRestrictedSettings } from "@/app/(app)/workspaces/[workspaceId]/settings/lib/redirect-billing-role";

/**
 * Route: `/workspaces/[workspaceId]/settings` (authenticated).
 * Redirects billing-only users to their fallback and all others to workspace general settings.
 */
const Page = async (props: Readonly<{ params: Promise<{ workspaceId: string }> }>) => {
  const params = await props.params;
  await redirectBillingRoleFromRestrictedSettings(params.workspaceId);
  return redirect(`/workspaces/${params.workspaceId}/settings/workspace/general`);
};

export default Page;

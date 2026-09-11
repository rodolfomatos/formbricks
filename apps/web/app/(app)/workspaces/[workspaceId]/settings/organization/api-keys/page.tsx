import { redirectBillingRoleFromRestrictedSettings } from "@/app/(app)/workspaces/[workspaceId]/settings/lib/redirect-billing-role";
import { APIKeysPage } from "@/modules/organization/settings/api-keys/page";

/**
 * Route: `/workspaces/[workspaceId]/settings/organization/api-keys` (authenticated).
 * Shows API key management page. Redirects billing-only users away.
 */
const Page = async (props: Readonly<{ params: Promise<{ workspaceId: string }> }>) => {
  const params = await props.params;
  await redirectBillingRoleFromRestrictedSettings(params.workspaceId);

  return APIKeysPage(props);
};

export default Page;

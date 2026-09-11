import { redirectBillingRoleFromRestrictedSettings } from "@/app/(app)/workspaces/[workspaceId]/settings/lib/redirect-billing-role";
import { FeedbackDirectoriesPage } from "@/modules/ee/feedback-directory/page";

/**
 * Route: `/workspaces/[workspaceId]/settings/organization/feedback-directories` (authenticated).
 * Shows the feedback directories management page. Redirects billing-only users away.
 */
const Page = async (props: Readonly<{ params: Promise<{ workspaceId: string }> }>) => {
  const params = await props.params;
  await redirectBillingRoleFromRestrictedSettings(params.workspaceId);

  return <FeedbackDirectoriesPage />;
};

export default Page;

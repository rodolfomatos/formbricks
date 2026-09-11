import { redirect } from "next/navigation";

/**
 * Route: `/workspaces/[workspaceId]/feedback-sources` (authenticated).
 * Redirects to the feedback sources settings page under workspace settings.
 */
export default async function FeedbackSourcesRedirect(
  props: Readonly<{ params: Promise<{ workspaceId: string }> }>
) {
  const { workspaceId } = await props.params;
  redirect(`/workspaces/${workspaceId}/settings/workspace/feedback-sources`);
}

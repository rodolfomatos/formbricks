import { DashboardsListPage } from "@/modules/ee/analysis/dashboards/pages/dashboards-list-page";

/**
 * Route: `/workspaces/[workspaceId]/dashboards` (authenticated, analysis).
 * Lists all dashboards for the workspace.
 */
const DashboardsPage = async (props: Readonly<{ params: Promise<{ workspaceId: string }> }>) => {
  const { workspaceId } = await props.params;
  return <DashboardsListPage workspaceId={workspaceId} />;
};

export default DashboardsPage;

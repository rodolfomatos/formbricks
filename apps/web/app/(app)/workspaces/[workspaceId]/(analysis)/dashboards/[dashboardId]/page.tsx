import { DashboardDetailPage } from "@/modules/ee/analysis/dashboards/pages/dashboard-detail-page";

/**
 * Route: `/workspaces/[workspaceId]/dashboards/[dashboardId]` (authenticated, analysis).
 * Shows detail view for a single dashboard.
 */
const Page = (props: { params: Promise<{ workspaceId: string; dashboardId: string }> }) => {
  return <DashboardDetailPage params={props.params} />;
};

export default Page;

import { ChartsListPage } from "@/modules/ee/analysis/charts/components/charts-list-page";

/**
 * Route: `/workspaces/[workspaceId]/charts` (authenticated, analysis).
 * Lists all charts available for the workspace.
 */
const ChartsPage = async (props: Readonly<{ params: Promise<{ workspaceId: string }> }>) => {
  const { workspaceId } = await props.params;
  return <ChartsListPage workspaceId={workspaceId} />;
};

export default ChartsPage;

import { prisma } from "@formbricks/database";
import { ResourceNotFoundError } from "@formbricks/types/errors";
import { getTranslate } from "@/lingodotdev/server";
import { getWorkspaceAuth } from "@/modules/workspaces/lib/utils";

export const DashboardDetailPage = async ({
  params,
}: {
  params: Promise<{ workspaceId: string; dashboardId: string }>;
}) => {
  const { workspaceId, dashboardId } = await params;
  const t = await getTranslate();
  const { workspace } = await getWorkspaceAuth(workspaceId);

  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, workspaceId: workspace.id },
    select: { id: true, name: true, createdAt: true },
  });

  if (!dashboard) {
    throw new ResourceNotFoundError("Dashboard", dashboardId);
  }

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold">{dashboard.name}</h1>
        <p className="text-sm text-slate-500">{t("dashboard")}</p>
      </div>
      <div className="rounded-lg border p-8 text-center text-sm text-slate-400">
        {t("common.no_results")}
      </div>
    </div>
  );
};

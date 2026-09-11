import { prisma } from "@formbricks/database";
import { getTranslate } from "@/lingodotdev/server";
import { getWorkspaceAuth } from "@/modules/workspaces/lib/utils";

export const DashboardsListPage = async ({ workspaceId }: { workspaceId: string }) => {
  const t = await getTranslate();
  const { workspace } = await getWorkspaceAuth(workspaceId);

  const dashboards = await prisma.dashboard.findMany({
    where: { workspaceId: workspace.id },
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboards")}</h1>
        <p className="text-sm text-slate-500">
          {dashboards.length} {t("dashboards")}
        </p>
      </div>
      {dashboards.length === 0 ? (
        <p className="text-sm text-slate-400">{t("common.no_results")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((d) => (
            <a
              key={d.id}
              href={`/workspaces/${workspaceId}/dashboards/${d.id}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-slate-50">
              <h3 className="font-medium">{d.name}</h3>
              <p className="mt-1 text-xs text-slate-400">
                {d.createdAt.toLocaleDateString()}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

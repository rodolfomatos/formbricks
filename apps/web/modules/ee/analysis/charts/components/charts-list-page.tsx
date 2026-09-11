import { prisma } from "@formbricks/database";
import { getTranslate } from "@/lingodotdev/server";
import { getWorkspaceAuth } from "@/modules/workspaces/lib/utils";

export const ChartsListPage = async ({ workspaceId }: { workspaceId: string }) => {
  const t = await getTranslate();
  const { workspace } = await getWorkspaceAuth(workspaceId);

  const charts = await prisma.chart.findMany({
    where: { workspaceId: workspace.id },
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("charts")}</h1>
        <p className="text-sm text-slate-500">
          {charts.length} {t("charts")}
        </p>
      </div>
      {charts.length === 0 ? (
        <p className="text-sm text-slate-400">{t("common.no_results")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {charts.map((c) => (
            <div key={c.id} className="rounded-lg border p-4">
              <h3 className="font-medium">{c.name}</h3>
              <p className="mt-1 text-xs text-slate-400">
                {c.createdAt.toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

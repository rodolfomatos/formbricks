import { prisma } from "@formbricks/database";
import { getTranslate } from "@/lingodotdev/server";
import { getHubClient } from "@/modules/hub/hub-client";
import { getWorkspaceAuth } from "@/modules/workspaces/lib/utils";

export const FeedbackRecordsPage = async ({
  params,
}: {
  params: { workspaceId: string };
}) => {
  const t = await getTranslate();
  const { workspace, organization } = await getWorkspaceAuth(params.workspaceId);

  const directories = await prisma.feedbackDirectory.findMany({
    where: {
      organizationId: organization.id,
      workspaces: { some: { workspaceId: workspace.id } },
    },
    include: { feedbackSources: true },
    orderBy: { createdAt: "desc" },
  });

  const hubClient = getHubClient();
  const isHubConfigured = hubClient !== null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t("feedback_records")}</h1>
        <p className="text-sm text-slate-500">
          {directories.length} {t("feedback_records")}
        </p>
      </div>

      {!isHubConfigured && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Hub API key not configured — feedback records from external sources require
          a Hub integration. Directories and sources are shown below.
        </div>
      )}

      {directories.length === 0 ? (
        <p className="text-sm text-slate-400">{t("common.no_results")}</p>
      ) : (
        <div className="space-y-4">
          {directories.map((dir) => (
            <div key={dir.id} className="rounded-lg border p-4">
              <h3 className="font-medium">{dir.name}</h3>
              {dir.feedbackSources.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {dir.feedbackSources.map((src) => (
                    <li key={src.id} className="text-sm text-slate-500">
                      {src.name} ({src.type})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import { prisma } from "@formbricks/database";
import { getTranslate } from "@/lingodotdev/server";
import { getWorkspaceAuth } from "@/modules/workspaces/lib/utils";

interface SegmentsPageProps {
  params: Promise<{ workspaceId: string }>;
}

export const SegmentsPage = async (props: SegmentsPageProps) => {
  const params = await props.params;
  const t = await getTranslate();
  const { workspace } = await getWorkspaceAuth(params.workspaceId);

  const segments = await prisma.segment.findMany({
    where: { workspaceId: workspace.id },
    include: {
      surveys: { select: { name: true, status: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("common.segments")}</h1>
      <p className="text-muted-foreground text-sm">{segments.length} segments</p>
      <ul className="mt-4 space-y-2">
        {segments.map((segment) => (
          <li key={segment.id} className="rounded-md border p-3">
            <p className="font-medium">{segment.title}</p>
            <p className="text-muted-foreground text-xs">
              {segment.surveys.length} survey{segment.surveys.length !== 1 ? "s" : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SegmentsPage;

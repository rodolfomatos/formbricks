import { prisma } from "@formbricks/database";
import { getTranslate } from "@/lingodotdev/server";
import { getWorkspaceAuth } from "@/modules/workspaces/lib/utils";

interface AttributesPageProps {
  params: Promise<{ workspaceId: string }>;
}

export const AttributesPage = async (props: AttributesPageProps) => {
  const params = await props.params;
  const t = await getTranslate();
  const { workspace } = await getWorkspaceAuth(params.workspaceId);

  const keys = await prisma.contactAttributeKey.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("common.attributes")}</h1>
      <p className="text-muted-foreground text-sm">{keys.length} keys</p>
      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 pr-4 font-medium">Key</th>
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Type</th>
            <th className="py-2 pr-4 font-medium">Data Type</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => (
            <tr key={key.id} className="border-b">
              <td className="py-2 pr-4 font-mono text-xs">{key.key}</td>
              <td className="py-2 pr-4">{key.name}</td>
              <td className="py-2 pr-4">{key.type}</td>
              <td className="py-2 pr-4">{key.dataType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttributesPage;

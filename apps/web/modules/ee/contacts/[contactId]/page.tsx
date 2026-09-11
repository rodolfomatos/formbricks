import { prisma } from "@formbricks/database";
import { ResourceNotFoundError } from "@formbricks/types/errors";
import { getTranslate } from "@/lingodotdev/server";
import { getWorkspaceAuth } from "@/modules/workspaces/lib/utils";

interface SingleContactPageProps {
  params: Promise<{ workspaceId: string; contactId: string }>;
}

export const SingleContactPage = async (props: SingleContactPageProps) => {
  const params = await props.params;
  const t = await getTranslate();
  await getWorkspaceAuth(params.workspaceId);

  const contact = await prisma.contact.findUnique({
    where: { id: params.contactId },
    include: {
      attributes: {
        include: { attributeKey: { select: { key: true, name: true } } },
      },
      responses: {
        select: { id: true, surveyId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!contact) {
    throw new ResourceNotFoundError("Contact", params.contactId);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("common.contact")}</h1>
      <p className="font-mono text-xs text-slate-500">{contact.id}</p>
      <section className="mt-6">
        <h2 className="text-lg font-medium">Attributes</h2>
        <dl className="mt-2 space-y-1">
          {contact.attributes.map((attr) => (
            <div key={attr.id} className="flex gap-2 text-sm">
              <dt className="font-medium">{attr.attributeKey.name ?? attr.attributeKey.key}:</dt>
              <dd>{attr.value}</dd>
            </div>
          ))}
          {contact.attributes.length === 0 && (
            <p className="text-muted-foreground text-sm">No attributes</p>
          )}
        </dl>
      </section>
      <section className="mt-6">
        <h2 className="text-lg font-medium">Recent Responses</h2>
        <ul className="mt-2 space-y-1">
          {contact.responses.map((r) => (
            <li key={r.id} className="text-sm">
              {r.surveyId} — {r.createdAt.toISOString()}
            </li>
          ))}
          {contact.responses.length === 0 && (
            <p className="text-muted-foreground text-sm">No responses</p>
          )}
        </ul>
      </section>
    </div>
  );
};

export default SingleContactPage;

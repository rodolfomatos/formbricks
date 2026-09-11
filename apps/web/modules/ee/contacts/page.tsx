import { prisma } from "@formbricks/database";
import { getTranslate } from "@/lingodotdev/server";
import { getWorkspaceAuth } from "@/modules/workspaces/lib/utils";

interface ContactsPageProps {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export const ContactsPage = async (props: ContactsPageProps) => {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const t = await getTranslate();
  const { workspace } = await getWorkspaceAuth(params.workspaceId);
  const page = Number(searchParams.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, createdAt: true },
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
    }),
    prisma.contact.count({ where: { workspaceId: workspace.id } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("common.contacts")}</h1>
      <p className="text-muted-foreground text-sm">
        {total} {t("common.contacts")}
      </p>
      <ul className="mt-4 space-y-2">
        {contacts.map((contact) => (
          <li key={contact.id} className="rounded-md border p-3">
            <span className="font-mono text-xs">{contact.id}</span>
            <span className="text-muted-foreground ml-2 text-xs">
              {contact.createdAt.toISOString()}
            </span>
          </li>
        ))}
      </ul>
      {total > limit && (
        <div className="mt-4 flex gap-2">
          {page > 1 && (
            <a href={`?page=${page - 1}`} className="text-sm underline">
              Previous
            </a>
          )}
          {skip + limit < total && (
            <a href={`?page=${page + 1}`} className="text-sm underline">
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactsPage;

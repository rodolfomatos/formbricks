import { prisma } from "@formbricks/database";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const contactId = url.searchParams.get("contactId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const where: Record<string, unknown> = {
    contact: { workspaceId },
  };

  if (contactId) {
    where.contactId = contactId;
  }

  const attributes = await prisma.contactAttribute.findMany({
    where,
    include: {
      attributeKey: { select: { key: true, name: true } },
      contact: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: attributes });
};

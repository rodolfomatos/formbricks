import { prisma } from "@formbricks/database";
import { NextResponse } from "next/server";

export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

export const POST = async (request: Request, props: { params: Promise<{ workspaceId: string }> }) => {
  const { workspaceId } = await props.params;
  const body = await request.json();
  const { userId, attributes } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const contact = await prisma.contact.upsert({
    where: {
      id: userId,
    },
    create: {
      id: userId,
      workspaceId,
    },
    update: {},
  });

  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      if (typeof value === "string") {
        const keyRecord = await prisma.contactAttributeKey.findUnique({
          where: { key_workspaceId: { key, workspaceId } },
        });
        if (keyRecord) {
          await prisma.contactAttribute.upsert({
            where: { contactId_attributeKeyId: { contactId: contact.id, attributeKeyId: keyRecord.id } },
            create: { contactId: contact.id, attributeKeyId: keyRecord.id, value },
            update: { value },
          });
        }
      }
    }
  }

  return NextResponse.json({
    data: { id: contact.id, workspaceId: contact.workspaceId },
  });
};

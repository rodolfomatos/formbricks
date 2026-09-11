import { prisma } from "@formbricks/database";
import { NextResponse } from "next/server";

export const PUT = async (request: Request) => {
  const body = await request.json();
  const { workspaceId, contacts } = body;

  if (!workspaceId || !Array.isArray(contacts)) {
    return NextResponse.json({ error: "workspaceId and contacts array are required" }, { status: 400 });
  }

  const results: Array<{ id: string; externalId?: string }> = [];

  for (const item of contacts) {
    const { externalId, attributes } = item;

    const contact = await prisma.contact.upsert({
      where: { id: externalId ?? crypto.randomUUID() },
      create: { id: externalId ?? crypto.randomUUID(), workspaceId },
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
              where: {
                contactId_attributeKeyId: { contactId: contact.id, attributeKeyId: keyRecord.id },
              },
              create: { contactId: contact.id, attributeKeyId: keyRecord.id, value },
              update: { value },
            });
          }
        }
      }
    }

    results.push({ id: contact.id, externalId });
  }

  return NextResponse.json({ data: results });
};

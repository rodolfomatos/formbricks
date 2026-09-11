import { prisma } from "@formbricks/database";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  const body = await request.json();
  const { workspaceId, attributes } = body;

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: { workspaceId },
  });

  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      if (typeof value === "string") {
        const keyRecord = await prisma.contactAttributeKey.findUnique({
          where: { key_workspaceId: { key, workspaceId } },
        });
        if (keyRecord) {
          await prisma.contactAttribute.create({
            data: {
              contactId: contact.id,
              attributeKeyId: keyRecord.id,
              value,
            },
          });
        }
      }
    }
  }

  return NextResponse.json({ data: contact }, { status: 201 });
};

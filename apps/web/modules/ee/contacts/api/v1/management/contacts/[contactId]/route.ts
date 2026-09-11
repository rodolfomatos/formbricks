import { prisma } from "@formbricks/database";
import { NextResponse } from "next/server";

export const GET = async (_request: Request, props: { params: Promise<{ contactId: string }> }) => {
  const { contactId } = await props.params;
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      attributes: {
        include: { attributeKey: { select: { key: true, name: true } } },
      },
    },
  });

  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({ data: contact });
};

export const DELETE = async (_request: Request, props: { params: Promise<{ contactId: string }> }) => {
  const { contactId } = await props.params;
  await prisma.contact.delete({ where: { id: contactId } });
  return NextResponse.json({ data: {} });
};

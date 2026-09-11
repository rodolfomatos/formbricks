import { prisma } from "@formbricks/database";
import { NextResponse } from "next/server";

export const GET = async (
  _request: Request,
  props: { params: Promise<{ contactAttributeKeyId: string }> }
) => {
  const { contactAttributeKeyId } = await props.params;
  const key = await prisma.contactAttributeKey.findUnique({
    where: { id: contactAttributeKeyId },
  });

  if (!key) {
    return NextResponse.json({ error: "Contact attribute key not found" }, { status: 404 });
  }

  return NextResponse.json({ data: key });
};

export const PUT = async (
  request: Request,
  props: { params: Promise<{ contactAttributeKeyId: string }> }
) => {
  const { contactAttributeKeyId } = await props.params;
  const body = await request.json();
  const { name, description } = body;

  const updated = await prisma.contactAttributeKey.update({
    where: { id: contactAttributeKeyId },
    data: { ...(name !== undefined && { name }), ...(description !== undefined && { description }) },
  });

  return NextResponse.json({ data: updated });
};

export const DELETE = async (
  _request: Request,
  props: { params: Promise<{ contactAttributeKeyId: string }> }
) => {
  const { contactAttributeKeyId } = await props.params;
  await prisma.contactAttributeKey.delete({ where: { id: contactAttributeKeyId } });
  return NextResponse.json({ data: {} });
};

import { prisma } from "@formbricks/database";
import { Prisma } from "@formbricks/database/prisma";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const keys = await prisma.contactAttributeKey.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: keys });
};

export const POST = async (request: Request) => {
  const body = await request.json();
  const { key, name, description, workspaceId, dataType } = body;

  if (!key || !workspaceId) {
    return NextResponse.json({ error: "key and workspaceId are required" }, { status: 400 });
  }

  try {
    const created = await prisma.contactAttributeKey.create({
      data: {
        key,
        name,
        description,
        dataType,
        workspace: { connect: { id: workspaceId } },
      },
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Key already exists in this workspace" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create attribute key" }, { status: 500 });
  }
};

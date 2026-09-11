import { prisma } from "@formbricks/database";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 50;
  const skip = (page - 1) * limit;

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where: { workspaceId },
      select: { id: true, createdAt: true, updatedAt: true },
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
    }),
    prisma.contact.count({ where: { workspaceId } }),
  ]);

  return NextResponse.json({ data: contacts, meta: { total, page, limit } });
};

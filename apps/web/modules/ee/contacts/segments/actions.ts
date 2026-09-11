"use server";

import { prisma } from "@formbricks/database";
import { ZSegmentCreateInput } from "@formbricks/types/segment";
import { ResourceNotFoundError } from "@formbricks/types/errors";

export const createSegmentAction = async (
  input: unknown
): Promise<{ data: { id: string; title: string } }> => {
  const parsed = ZSegmentCreateInput.parse(input);

  const workspace = await prisma.workspace.findUnique({
    where: { id: parsed.workspaceId },
    select: { id: true },
  });

  if (!workspace) {
    throw new ResourceNotFoundError("Workspace", parsed.workspaceId);
  }

  const segment = await prisma.segment.create({
    data: {
      title: parsed.title,
      isPrivate: parsed.isPrivate,
      filters: parsed.filters,
      workspaceId: parsed.workspaceId,
    },
    select: { id: true, title: true },
  });

  await prisma.survey.update({
    where: { id: parsed.surveyId },
    data: { segmentId: segment.id },
  });

  return { data: segment };
};

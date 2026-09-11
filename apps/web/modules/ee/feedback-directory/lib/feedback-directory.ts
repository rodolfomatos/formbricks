import { prisma } from "@formbricks/database";

export const getFeedbackDirectoriesByWorkspaceId = async (workspaceId: string) => {
  return prisma.feedbackDirectory.findMany({
    where: { workspaceId },
    include: { workspace: true },
  });
};

export const getFeedbackDirectoryAuthContext = async (directoryId: string) => {
  const directory = await prisma.feedbackDirectory.findUnique({
    where: { id: directoryId },
    select: {
      id: true,
      workspaceId: true,
      workspace: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  if (!directory) {
    return null;
  }

  return {
    directoryId: directory.id,
    workspaceId: directory.workspaceId,
    organizationId: directory.workspace.organizationId,
  };
};

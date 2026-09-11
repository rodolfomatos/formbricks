import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";

/**
 * Checks whether a contact exists and belongs to the given workspace.
 */
export const doesContactExistInWorkspace = reactCache(
  async (id: string, workspaceId: string): Promise<boolean> => {
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        workspaceId,
      },
      select: {
        id: true,
      },
    });

    return !!contact;
  }
);

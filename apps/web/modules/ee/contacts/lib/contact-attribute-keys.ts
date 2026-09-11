import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import type { TContactAttributeKey } from "@formbricks/types/contact-attribute-key";

export const getContactAttributeKeys = reactCache(
  async (workspaceId: string): Promise<TContactAttributeKey[]> => {
    const keys = await prisma.contactAttributeKey.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    });
    return keys as unknown as TContactAttributeKey[];
  }
);

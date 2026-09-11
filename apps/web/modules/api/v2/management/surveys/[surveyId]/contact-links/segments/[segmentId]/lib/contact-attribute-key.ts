import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { err, ok } from "@formbricks/types/error-handlers";

/**
 * Lists contact attribute keys for the given workspaces, with optional filtering.
 *
 * @param workspaceIds — The workspaces to scope the query to
 * @param params — Pagination and filter parameters
 * @returns — Paginated list of contact attribute keys
 */
export const getContactAttributeKeys = reactCache(async (workspaceId: string) => {
  try {
    const contactAttributeKeys = await prisma.contactAttributeKey.findMany({
      where: { workspaceId },
      select: {
        key: true,
      },
    });

    const keys = contactAttributeKeys.map((key) => key.key);
    return ok(keys);
  } catch (error) {
    return err({
      type: "internal_server_error",
      details: [
        {
          field: "contact attribute keys",
          issue: error instanceof Error ? error.message : "Unknown error occurred",
        },
      ],
    });
  }
});

import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { err, ok } from "@formbricks/types/error-handlers";

/**
 * Cached retrieval of a contact by ID within a specific workspace.
 *
 * @param contactId — The contact ID
 * @param workspaceId — The workspace to scope the lookup to
 * @returns — The contact if found
 */
export const getContact = reactCache(async (contactId: string, workspaceId: string) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: {
        id: contactId,
        workspaceId,
      },
      select: {
        id: true,
      },
    });

    if (!contact) {
      return err({ type: "not_found", details: [{ field: "contact", issue: "not found" }] });
    }

    return ok(contact);
  } catch (error) {
    return err({
      type: "internal_server_error",
      details: [
        { field: "contact", issue: error instanceof Error ? error.message : "Unknown error occurred" },
      ],
    });
  }
});

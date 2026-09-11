import "server-only";
import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { TContactAttributes } from "@formbricks/types/contact-attribute";

/**
 * Looks up a contact by workspace ID and user-ID attribute value. Cached
 * per request via react cache.
 */
export const getContactByUserId = reactCache(
  async (
    workspaceId: string,
    userId: string
  ): Promise<{
    id: string;
    attributes: TContactAttributes;
  } | null> => {
    const contact = await prisma.contact.findFirst({
      where: {
        attributes: {
          some: {
            attributeKey: {
              key: "userId",
              workspaceId,
            },
            value: userId,
          },
        },
      },
      select: {
        id: true,
        attributes: {
          select: {
            attributeKey: { select: { key: true } },
            value: true,
          },
        },
      },
    });

    if (!contact) {
      return null;
    }

    const contactAttributes = contact.attributes.reduce<TContactAttributes>((acc, attr) => {
      acc[attr.attributeKey.key] = attr.value;
      return acc;
    }, {});

    return {
      id: contact.id,
      attributes: contactAttributes,
    };
  }
);

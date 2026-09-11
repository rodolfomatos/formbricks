import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { WEBAPP_URL } from "@/lib/constants";

export const generatePersonalLinks = reactCache(
  async (
    surveyId: string,
    segmentId: string,
    expirationDays?: number
  ): Promise<
    Array<{
      contactId: string;
      attributes: Record<string, string>;
      surveyUrl: string;
    } | null>
  > => {
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
      select: { workspaceId: true, filters: true },
    });

    if (!segment) {
      return [];
    }

    const contacts = await prisma.contact.findMany({
      where: { workspaceId: segment.workspaceId },
      select: {
        id: true,
        attributes: {
          select: {
            value: true,
            attributeKey: { select: { key: true } },
          },
        },
      },
    });

    return contacts.map((contact) => {
      const attributes: Record<string, string> = {};
      for (const attr of contact.attributes) {
        attributes[attr.attributeKey.key] = attr.value;
      }
      return {
        contactId: contact.id,
        attributes,
        surveyUrl: `${WEBAPP_URL}/s/contact/${Buffer.from(JSON.stringify({ surveyId, contactId: contact.id })).toString("base64url")}`,
      };
    });
  }
);

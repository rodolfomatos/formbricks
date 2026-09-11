import { prisma } from "@formbricks/database";
import { WEBAPP_URL } from "@/lib/constants";

export const getOrganizationLogoUrl = async (organizationId: string): Promise<string | null> => {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { logoUrl: true },
  });

  return organization?.logoUrl ?? null;
};

import { prisma } from "@formbricks/database";

interface QuotaFullObject {
  id: string;
  surveyId: string;
  name: string | null;
  limit: number;
  current: number;
}

export async function createQuotaFullObject(surveyId: string): Promise<QuotaFullObject[]> {
  const quotas = await prisma.surveyQuota.findMany({
    where: { surveyId },
    include: {
      _count: {
        select: { quotaLinks: true },
      },
    },
  });

  return quotas.map((q) => ({
    id: q.id,
    surveyId: q.surveyId,
    name: q.name,
    limit: q.limit,
    current: q._count.quotaLinks,
  }));
}

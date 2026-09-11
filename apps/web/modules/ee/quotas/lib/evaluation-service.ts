import { prisma } from "@formbricks/database";

export async function evaluateResponseQuotas(surveyId: string): Promise<boolean> {
  const quotas = await prisma.surveyQuota.findMany({
    where: { surveyId },
    include: {
      _count: {
        select: { quotaLinks: true },
      },
    },
  });

  for (const quota of quotas) {
    if (quota._count.quotaLinks >= quota.limit) {
      return true;
    }
  }

  return false;
}

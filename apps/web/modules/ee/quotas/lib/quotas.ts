import { prisma } from "@formbricks/database";
import { cache } from "react";

interface Quota {
  id: string;
  surveyId: string;
  name: string;
  limit: number;
  current: number;
}

export const getQuotas = cache(async (surveyId: string): Promise<Quota[]> => {
  const surveyQuotas = await prisma.surveyQuota.findMany({
    where: { surveyId },
    include: {
      _count: {
        select: { quotaLinks: true },
      },
    },
  });

  return surveyQuotas.map((q) => ({
    id: q.id,
    surveyId: q.surveyId,
    name: q.name ?? "Unnamed quota",
    limit: q.limit,
    current: q._count.quotaLinks,
  }));
});

export const getQuota = cache(async (quotaId: string): Promise<Quota | null> => {
  const quota = await prisma.surveyQuota.findUnique({
    where: { id: quotaId },
    include: {
      _count: {
        select: { quotaLinks: true },
      },
    },
  });

  if (!quota) return null;

  return {
    id: quota.id,
    surveyId: quota.surveyId,
    name: quota.name ?? "Unnamed quota",
    limit: quota.limit,
    current: quota._count.quotaLinks,
  };
});

export async function reduceQuotaLimits(surveyId: string, responseId: string): Promise<void> {
  const quotas = await prisma.surveyQuota.findMany({
    where: { surveyId },
  });

  await prisma.responseQuotaLink.createMany({
    data: quotas.map((q) => ({
      quotaId: q.id,
      responseId,
    })),
  });
}

import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import type { TSegmentWithSurveyRefs } from "@formbricks/types/segment";

export const getSegments = reactCache(
  async (workspaceId: string): Promise<TSegmentWithSurveyRefs[]> => {
    const segments = await prisma.segment.findMany({
      where: { workspaceId },
      include: {
        surveys: {
          select: { id: true, name: true, status: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return segments.map((segment) => ({
      id: segment.id,
      title: segment.title,
      description: segment.description,
      isPrivate: segment.isPrivate,
      filters: segment.filters as TSegmentWithSurveyRefs["filters"],
      workspaceId: segment.workspaceId,
      createdAt: segment.createdAt,
      updatedAt: segment.updatedAt,
      surveys: segment.surveys.map((s) => s.id),
      activeSurveys: segment.surveys
        .filter((s) => s.status === "inProgress")
        .map((s) => ({ id: s.id, name: s.name })),
      inactiveSurveys: segment.surveys
        .filter((s) => s.status !== "inProgress")
        .map((s) => ({ id: s.id, name: s.name })),
    }));
  }
);

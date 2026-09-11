import { prisma } from "@formbricks/database";
import { Prisma } from "@formbricks/database/prisma";
import type { TSurvey } from "@/modules/survey/list/types/surveys";

export const surveySelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  name: true,
  type: true,
  creator: {
    select: {
      name: true,
    },
  },
  status: true,
  publishOn: true,
  singleUse: true,
  workspaceId: true,
  _count: {
    select: { responses: true },
  },
} satisfies Prisma.SurveySelect;

export type TSurveyRow = Prisma.SurveyGetPayload<{ select: typeof surveySelect }>;

/** Returns a map of survey ID to response count for all given survey IDs. */
export async function getResponseCountsBySurveyIds(surveyIds: string[]): Promise<Map<string, number>> {
  if (surveyIds.length === 0) {
    return new Map();
  }

  const responseCounts = await prisma.response.groupBy({
    by: ["surveyId"],
    where: {
      surveyId: {
        in: surveyIds,
      },
    },
    _count: {
      _all: true,
    },
  });

  return new Map(responseCounts.map(({ surveyId, _count }) => [surveyId, _count._all]));
}

/** Converts a raw Prisma survey row to the application-level TSurvey shape, injecting the response count. */
export function mapSurveyRowToSurvey(row: TSurveyRow, responseCount = 0): TSurvey {
  const { _count: _ignored, ...rest } = row;
  return {
    ...rest,
    responseCount,
  };
}

/** Converts an array of Prisma survey rows to application-level TSurvey objects with response counts. */
export function mapSurveyRowsToSurveys(
  rows: TSurveyRow[],
  responseCountsBySurveyId: Map<string, number> = new Map()
): TSurvey[] {
  return rows.map((row) => mapSurveyRowToSurvey(row, responseCountsBySurveyId.get(row.id) ?? 0));
}

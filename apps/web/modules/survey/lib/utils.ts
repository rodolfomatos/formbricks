import "server-only";
import { Prisma } from "@formbricks/database/prisma";
import { TJsWorkspaceStateSurvey } from "@formbricks/types/js";
import { TSegment } from "@formbricks/types/segment";
import { TSurvey, TSurveyFilterCriteria } from "@formbricks/types/surveys/types";

/** Converts a raw Prisma survey object into the application-level TSurvey shape, handling displayPercentage decimal conversion and segment data flattening. */
export const transformPrismaSurvey = <T extends TSurvey | TJsWorkspaceStateSurvey>(surveyPrisma: any): T => {
  let segment: TSegment | null = null;

  if (surveyPrisma.segment) {
    segment = {
      ...surveyPrisma.segment,
      surveys: surveyPrisma.segment.surveys.map((survey: { id: string }) => survey.id),
    };
  }

  const transformedSurvey = {
    ...surveyPrisma,
    displayPercentage: Number(surveyPrisma.displayPercentage) || null,
    segment,
    customHeadScriptsMode: surveyPrisma.customHeadScriptsMode,
  } as T;

  return transformedSurvey;
};

/** Builds a Prisma WHERE clause from filter criteria (name, status, type, creator). */
export const buildWhereClause = (filterCriteria?: TSurveyFilterCriteria) => {
  const whereClause: Prisma.SurveyWhereInput["AND"] = [];

  // for name
  if (filterCriteria?.name) {
    whereClause.push({ name: { contains: filterCriteria.name, mode: "insensitive" } });
  }

  // for status
  if (filterCriteria?.status && filterCriteria?.status?.length) {
    whereClause.push({ status: { in: filterCriteria.status } });
  }

  // for type
  if (filterCriteria?.type && filterCriteria?.type?.length) {
    whereClause.push({ type: { in: filterCriteria.type } });
  }

  // for createdBy
  if (filterCriteria?.createdBy?.value && filterCriteria?.createdBy?.value?.length) {
    if (filterCriteria.createdBy.value.length === 1) {
      if (filterCriteria.createdBy.value[0] === "you") {
        whereClause.push({ createdBy: filterCriteria.createdBy.userId });
      }
      if (filterCriteria.createdBy.value[0] === "others") {
        whereClause.push({
          OR: [
            {
              createdBy: {
                not: filterCriteria.createdBy.userId,
              },
            },
            {
              createdBy: null,
            },
          ],
        });
      }
    }
  }

  return { AND: whereClause };
};

/** Builds a Prisma ORDER BY clause from a sort-by key (name, createdAt, updatedAt). */
export const buildOrderByClause = (
  sortBy?: TSurveyFilterCriteria["sortBy"]
): Prisma.SurveyOrderByWithRelationInput[] | undefined => {
  const orderMapping: { [key: string]: Prisma.SurveyOrderByWithRelationInput } = {
    name: { name: "asc" },
    createdAt: { createdAt: "desc" },
    updatedAt: { updatedAt: "desc" },
  };

  return sortBy ? [orderMapping[sortBy] || { updatedAt: "desc" }] : undefined;
};

/** Returns true if at least one survey in the list has active segment filters. */
export const anySurveyHasFilters = (surveys: TSurvey[]): boolean => {
  return surveys.some((survey) => {
    if ("segment" in survey && survey.segment) {
      return survey.segment.filters && survey.segment.filters.length > 0;
    }
    return false;
  });
};

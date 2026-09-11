import { Prisma } from "@formbricks/database/prisma";
import { buildCommonFilterQuery, pickCommonFilter } from "@/modules/api/v2/management/lib/utils";
import { TGetResponsesFilter } from "@/modules/api/v2/management/responses/types/responses";

/**
 * Builds a Prisma query filter for listing responses.
 *
 * @param workspaceIds — The workspaces to scope the query to
 * @param params — Optional filter parameters
 * @returns — Prisma find-many arguments
 */
export const getResponsesQuery = (workspaceIds: string[], params?: TGetResponsesFilter) => {
  let query: Prisma.ResponseFindManyArgs = {
    where: {
      survey: {
        workspaceId: { in: workspaceIds },
      },
    },
  };

  if (!params) return query;

  const { surveyId, contactId } = params || {};

  if (surveyId) {
    query = {
      ...query,
      where: {
        ...query.where,
        surveyId,
      },
    };
  }

  if (contactId) {
    query = {
      ...query,
      where: {
        ...query.where,
        contactId,
      },
    };
  }

  const baseFilter = pickCommonFilter(params);

  if (baseFilter) {
    query = buildCommonFilterQuery<Prisma.ResponseFindManyArgs>(query, baseFilter);
  }

  return query;
};

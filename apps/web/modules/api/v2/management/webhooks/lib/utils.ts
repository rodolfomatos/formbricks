import { Prisma } from "@formbricks/database/prisma";
import { buildCommonFilterQuery, pickCommonFilter } from "@/modules/api/v2/management/lib/utils";
import { TGetWebhooksFilter } from "@/modules/api/v2/management/webhooks/types/webhooks";

/**
 * Builds a Prisma query filter for listing webhooks.
 *
 * @param workspaceIds — The workspaces to scope the query to
 * @param params — Optional filter/surveyIds parameters
 * @returns — Prisma find-many arguments
 */
export const getWebhooksQuery = (workspaceIds: string[], params?: TGetWebhooksFilter) => {
  let query: Prisma.WebhookFindManyArgs = {
    where: {
      workspaceId: { in: workspaceIds },
    },
  };

  if (!params) return query;

  const { surveyIds } = params || {};

  if (surveyIds) {
    query = {
      ...query,
      where: {
        ...query.where,
        surveyIds: {
          hasSome: surveyIds,
        },
      },
    };
  }

  const baseFilter = pickCommonFilter(params);

  if (baseFilter) {
    query = buildCommonFilterQuery<Prisma.WebhookFindManyArgs>(query, baseFilter);
  }

  return query;
};

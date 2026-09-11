import { Prisma } from "@formbricks/database/prisma";
import { buildCommonFilterQuery, pickCommonFilter } from "@/modules/api/v2/management/lib/utils";
import { TGetTeamsFilter } from "@/modules/api/v2/organizations/[organizationId]/teams/types/teams";

/**
 * Builds a Prisma query filter for listing teams.
 *
 * @param organizationId — The organization to scope the query to
 * @param params — Optional filter parameters
 * @returns — Prisma find-many arguments
 */
export const getTeamsQuery = (organizationId: string, params?: TGetTeamsFilter) => {
  let query: Prisma.TeamFindManyArgs = {
    where: {
      organizationId,
    },
  };

  if (!params) return query;

  const baseFilter = pickCommonFilter(params);

  if (baseFilter) {
    query = buildCommonFilterQuery<Prisma.TeamFindManyArgs>(query, baseFilter);
  }

  return query;
};

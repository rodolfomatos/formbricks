import { Prisma } from "@formbricks/database/prisma";
import { buildCommonFilterQuery, pickCommonFilter } from "@/modules/api/v2/management/lib/utils";
import { TGetUsersFilter } from "@/modules/api/v2/organizations/[organizationId]/users/types/users";

/**
 * Builds a Prisma query filter for listing users in an organization.
 *
 * @param organizationId — The organization to scope the query to
 * @param params — Optional filter parameters including email and id
 * @returns — Prisma find-many arguments
 */
export const getUsersQuery = (organizationId: string, params?: TGetUsersFilter) => {
  let query: Prisma.UserFindManyArgs = {
    where: {
      memberships: {
        some: {
          organizationId,
        },
      },
    },
  };

  if (!params) return query;

  if (params.email) {
    query.where = {
      ...query.where,
      email: {
        contains: params.email,
        mode: "insensitive",
      },
    };
  }

  if (params.id) {
    query.where = {
      ...query.where,
      id: params.id,
    };
  }

  const baseFilter = pickCommonFilter(params);

  if (baseFilter) {
    query = buildCommonFilterQuery<Prisma.UserFindManyArgs>(query, baseFilter);
  }

  return query;
};

import { Prisma } from "@formbricks/database/prisma";
import { TGetFilter } from "@/modules/api/v2/types/api-filter";

/**
 * Extracts only the common pagination/filter fields from a TGetFilter object.
 * Useful for spreading into API calls that accept a unified filter parameter set.
 *
 * @param params — The full filter object
 * @returns — Subset with only limit, skip, sortBy, order, startDate, endDate, filterDateField
 */
export function pickCommonFilter<T extends TGetFilter>(params: T) {
  const { limit, skip, sortBy, order, startDate, endDate, filterDateField } = params;
  return { limit, skip, sortBy, order, startDate, endDate, filterDateField };
}

type HasFindMany =
  | Prisma.WebhookFindManyArgs
  | Prisma.ResponseFindManyArgs
  | Prisma.TeamFindManyArgs
  | Prisma.WorkspaceTeamFindManyArgs
  | Prisma.UserFindManyArgs
  | Prisma.ContactAttributeKeyFindManyArgs
  | Prisma.ChartFindManyArgs
  | Prisma.DashboardFindManyArgs;

/**
 * Applies common pagination, sorting, and date-range filters to a Prisma find-many query.
 * Merges the filter params into the query's where clause and adds take/skip/orderBy as needed.
 *
 * @param query — The base Prisma query object
 * @param params — The unified filter parameters
 * @returns — The augmented query with applied filters
 */
export function buildCommonFilterQuery<T extends HasFindMany>(query: T, params: TGetFilter): T {
  const { limit, skip, sortBy, order, startDate, endDate, filterDateField = "createdAt" } = params || {};

  let filteredQuery = {
    ...query,
  };

  const dateField = filterDateField;

  if (startDate) {
    filteredQuery = {
      ...filteredQuery,
      where: {
        ...filteredQuery.where,
        [dateField]: {
          ...(filteredQuery.where?.[dateField] as Prisma.DateTimeFilter),
          gte: startDate,
        },
      },
    };
  }

  if (endDate) {
    filteredQuery = {
      ...filteredQuery,
      where: {
        ...filteredQuery.where,
        [dateField]: {
          ...(filteredQuery.where?.[dateField] as Prisma.DateTimeFilter),
          lte: endDate,
        },
      },
    };
  }

  if (sortBy) {
    filteredQuery = {
      ...filteredQuery,
      orderBy: {
        [sortBy]: order,
      },
    };
  }

  if (limit) {
    filteredQuery = { ...filteredQuery, take: limit };
  }

  if (skip) {
    filteredQuery = { ...filteredQuery, skip };
  }

  return filteredQuery;
}

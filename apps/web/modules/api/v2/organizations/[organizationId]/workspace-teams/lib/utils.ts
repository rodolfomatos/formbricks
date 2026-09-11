import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { Prisma } from "@formbricks/database/prisma";
import { TAuthenticationApiKey } from "@formbricks/types/auth";
import { Result, err, ok } from "@formbricks/types/error-handlers";
import { buildCommonFilterQuery, pickCommonFilter } from "@/modules/api/v2/management/lib/utils";
import { TGetWorkspaceTeamsFilter } from "@/modules/api/v2/organizations/[organizationId]/workspace-teams/types/workspace-teams";
import { ApiErrorResponseV2 } from "@/modules/api/v2/types/api-error";

/**
 * Builds a Prisma query filter for listing workspace-team associations.
 *
 * @param organizationId — The organization to scope the query to
 * @param params — Filter parameters
 * @returns — Prisma find-many arguments
 */
export const getWorkspaceTeamsQuery = (organizationId: string, params: TGetWorkspaceTeamsFilter) => {
  const { teamId, workspaceId } = params || {};

  let query: Prisma.WorkspaceTeamFindManyArgs = {
    where: {
      team: {
        organizationId,
      },
    },
  };

  if (teamId) {
    query = {
      ...query,
      where: {
        ...query.where,
        teamId,
      },
    };
  }

  if (workspaceId) {
    query = {
      ...query,
      where: {
        ...query.where,
        workspaceId,
        workspace: {
          organizationId,
        },
      },
    };
  }

  const baseFilter = pickCommonFilter(params);

  if (baseFilter) {
    query = buildCommonFilterQuery<Prisma.WorkspaceTeamFindManyArgs>(query, baseFilter);
  }

  return query;
};

/**
 * Cached validation that a team and workspace both belong to the same organization.
 *
 * @param organizationId — The organization
 * @param teamId — The team to validate
 * @param workspaceId — The workspace to validate
 * @returns — True if both belong to the organization
 */
export const validateTeamIdAndWorkspaceId = reactCache(
  async (organizationId: string, teamId: string, workspaceId: string) => {
    try {
      const hasAccess = await prisma.organization.findFirst({
        where: {
          id: organizationId,
          teams: {
            some: {
              id: teamId,
            },
          },
          workspaces: {
            some: {
              id: workspaceId,
            },
          },
        },
      });

      if (!hasAccess) {
        return err({ type: "not_found", details: [{ field: "teamId/workspaceId", issue: "not_found" }] });
      }

      return ok(true);
    } catch (error) {
      return err({
        type: "internal_server_error",
        details: [
          {
            field: "teamId/workspaceId",
            issue: error instanceof Error ? error.message : "Unknown error occurred",
          },
        ],
      });
    }
  }
);

/**
 * Verifies that a team and workspace are valid within the authenticated user's organization.
 *
 * @param teamId — The team to verify
 * @param workspaceId — The workspace to verify
 * @param authentication — The authenticated API key data
 * @returns — True if access is granted
 */
export const checkAuthenticationAndAccess = async (
  teamId: string,
  workspaceId: string,
  authentication: TAuthenticationApiKey
): Promise<Result<boolean, ApiErrorResponseV2>> => {
  const hasAccess = await validateTeamIdAndWorkspaceId(authentication.organizationId, teamId, workspaceId);

  if (!hasAccess.ok) {
    return err(hasAccess.error as ApiErrorResponseV2);
  }

  return ok(true);
};

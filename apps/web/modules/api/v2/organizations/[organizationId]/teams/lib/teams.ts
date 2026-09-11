import "server-only";
import { prisma } from "@formbricks/database";
import { Team } from "@formbricks/database/prisma";
import { Result, err, ok } from "@formbricks/types/error-handlers";
import { getTeamsQuery } from "@/modules/api/v2/organizations/[organizationId]/teams/lib/utils";
import {
  TGetTeamsFilter,
  TTeamInput,
} from "@/modules/api/v2/organizations/[organizationId]/teams/types/teams";
import { ApiErrorResponseV2 } from "@/modules/api/v2/types/api-error";
import { ApiResponseWithMeta } from "@/modules/api/v2/types/api-success";

/**
 * Creates a new team within an organization.
 *
 * @param teamInput — The team data (name)
 * @param organizationId — The organization to create the team under
 * @returns — The created team
 */
export const createTeam = async (
  teamInput: TTeamInput,
  organizationId: string
): Promise<Result<Team, ApiErrorResponseV2>> => {
  const { name } = teamInput;

  try {
    const team = await prisma.team.create({
      data: {
        name,
        organizationId,
      },
    });

    return ok(team);
  } catch (error) {
    return err({
      type: "internal_server_error",
      details: [{ field: "team", issue: error instanceof Error ? error.message : "Unknown error occurred" }],
    });
  }
};

/**
 * Lists teams within an organization with filtering and pagination.
 *
 * @param organizationId — The organization to list teams for
 * @param params — Filter and pagination parameters
 * @returns — Paginated list of teams
 */
export const getTeams = async (
  organizationId: string,
  params: TGetTeamsFilter
): Promise<Result<ApiResponseWithMeta<Team[]>, ApiErrorResponseV2>> => {
  try {
    const query = getTeamsQuery(organizationId, params);

    const [teams, count] = await prisma.$transaction([
      prisma.team.findMany({
        ...query,
      }),
      prisma.team.count({
        where: query.where,
      }),
    ]);

    return ok({
      data: teams,
      meta: {
        total: count,
        limit: params.limit,
        offset: params.skip,
      },
    });
  } catch (error) {
    return err({
      type: "internal_server_error",
      details: [{ field: "teams", issue: error instanceof Error ? error.message : "Unknown error occurred" }],
    });
  }
};

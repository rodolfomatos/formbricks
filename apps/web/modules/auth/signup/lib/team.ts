import "server-only";
import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { Prisma, PrismaClient, Team } from "@formbricks/database/prisma";
import { logger } from "@formbricks/logger";
import { DatabaseError } from "@formbricks/types/errors";
import { getAccessFlags } from "@/lib/membership/utils";
import { CreateMembershipInvite } from "@/modules/auth/signup/types/invites";

type TTeamDbClient = PrismaClient | Prisma.TransactionClient;
type TTeamMembershipTarget = Pick<Team, "id">;

const getDbClient = (tx?: Prisma.TransactionClient): TTeamDbClient => tx ?? prisma;

/**
 * Uncached team lookup scoped to an organisation. Uses the organisation ID
 * in the WHERE clause to prevent cross-organisation team access (a user
 * invited to team "X" in org "A" should not match team "X" in org "B").
 */
const getTeamForOrganizationUncached = async (
  teamId: string,
  organizationId: string,
  tx?: Prisma.TransactionClient
): Promise<TTeamMembershipTarget | null> => {
  const team = await getDbClient(tx).team.findUnique({
    where: {
      id: teamId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!team) {
    return null;
  }

  return team;
};

const getTeamForOrganizationCached = reactCache(async (teamId: string, organizationId: string) =>
  getTeamForOrganizationUncached(teamId, organizationId)
);

/**
 * Creates team memberships during invite acceptance. For each team ID in the
 * invite, verifies the team exists under the target organisation, then upserts
 * a TeamUser row with admin role for owner/manager invites or contributor for
 * others. If a team has been deleted since the invite was sent, it is silently
 * skipped (logged as a warning).
 *
 * @param invite - Invite data with organisation ID, role, and team IDs
 * @param userId - User ID to create memberships for
 * @param tx     - Optional Prisma transaction client
 */
export const createTeamMembership = async (
  invite: CreateMembershipInvite,
  userId: string,
  tx?: Prisma.TransactionClient
): Promise<void> => {
  const teamIds = invite.teamIds || [];

  const userMembershipRole = invite.role;
  const { isOwner, isManager } = getAccessFlags(userMembershipRole);

  const isOwnerOrManager = isOwner || isManager;
  try {
    const prismaClient = getDbClient(tx);
    for (const teamId of teamIds) {
      const team = await getTeamForOrganization(teamId, invite.organizationId, tx);

      if (!team) {
        logger.warn({ teamId, userId }, "Team no longer exists during invite acceptance");
        continue;
      }

      await prismaClient.teamUser.upsert({
        create: {
          teamId,
          userId,
          role: isOwnerOrManager ? "admin" : "contributor",
        },
        update: {
          role: isOwnerOrManager ? "admin" : "contributor",
        },
        where: {
          teamId_userId: {
            teamId,
            userId,
          },
        },
      });
    }
  } catch (error) {
    logger.error(error, `Error creating team membership ${invite.organizationId} ${userId}`);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

/**
 * Looks up a team scoped to an organisation. Uses React cache for non-transaction
 * lookups (cached per request) and the uncached path when inside an existing
 * transaction to respect the transaction boundary.
 *
 * @param teamId         - Team ID to look up
 * @param organizationId - Organisation ID for scoping
 * @param tx             - Optional Prisma transaction client
 * @returns Team id, or null
 */
export const getTeamForOrganization = async (
  teamId: string,
  organizationId: string,
  tx?: Prisma.TransactionClient
): Promise<TTeamMembershipTarget | null> => {
  if (tx) {
    return getTeamForOrganizationUncached(teamId, organizationId, tx);
  }

  return getTeamForOrganizationCached(teamId, organizationId);
};

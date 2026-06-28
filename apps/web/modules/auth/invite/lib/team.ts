import "server-only";
import { prisma } from "@formbricks/database";
import { Prisma } from "@formbricks/database/prisma";
import { DatabaseError } from "@formbricks/types/errors";
import { getAccessFlags } from "@/lib/membership/utils";
import { CreateMembershipInvite } from "@/modules/auth/invite/types/invites";

/**
 * Creates team memberships during invite acceptance using the invite page
 * flow (separate from the sign-up flow version in signup/lib/team.ts).
 * The key difference is that this version also collects workspace IDs for
 * potential post-processing, whereas the sign-up version only creates
 * TeamUser rows.
 *
 * @param invite - Invite data with organisation ID, role, and team IDs
 * @param userId - User ID to create memberships for
 */
export const createTeamMembership = async (invite: CreateMembershipInvite, userId: string): Promise<void> => {
  const teamIds = invite.teamIds || [];
  const userMembershipRole = invite.role;
  const { isOwner, isManager } = getAccessFlags(userMembershipRole);

  const validTeamIds: string[] = [];
  const validWorkspaceIds: string[] = [];

  const isOwnerOrManager = isOwner || isManager;
  try {
    for (const teamId of teamIds) {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
        },
        select: {
          workspaceTeams: {
            select: {
              workspaceId: true,
            },
          },
        },
      });

      if (team) {
        await prisma.teamUser.create({
          data: {
            teamId,
            userId,
            role: isOwnerOrManager ? "admin" : "contributor",
          },
        });

        validTeamIds.push(teamId);
        validWorkspaceIds.push(...team.workspaceTeams.map((pt) => pt.workspaceId));
      }
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

"use server";

import { prisma } from "@formbricks/database";
import { cache } from "react";
import type { TTeamRole } from "../team-list/types/team";
import type { TTeamPermission } from "../workspace-teams/types/team";

export const getTeamRoleByTeamIdUserId = cache(
  async (userId: string, teamId: string): Promise<TTeamRole | null> => {
    const teamUser = await prisma.teamUser.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      select: {
        role: true,
      },
    });

    return (teamUser?.role as TTeamRole) ?? null;
  }
);

export const getWorkspacePermissionByUserId = cache(
  async (userId: string, workspaceId: string): Promise<TTeamPermission | null> => {
    if (!userId || !workspaceId) return null;
    const teamUser = await prisma.teamUser.findFirst({
      where: {
        userId,
        team: {
          workspaceTeams: {
            some: {
              workspaceId,
            },
          },
        },
      },
      select: {
        team: {
          select: {
            workspaceTeams: {
              where: {
                workspaceId,
              },
              select: {
                permission: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    return (teamUser?.team.workspaceTeams[0]?.permission as TTeamPermission) ?? null;
  }
);

export const getTeamsWhereUserIsAdmin = cache(
  async (userId: string): Promise<string[]> => {
    const teamUsers = await prisma.teamUser.findMany({
      where: {
        userId,
        role: "admin",
      },
      select: {
        teamId: true,
      },
    });

    return teamUsers.map((tu) => tu.teamId);
  }
);

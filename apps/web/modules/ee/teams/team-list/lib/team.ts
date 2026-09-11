import { prisma } from "@formbricks/database";
import { cache } from "react";
import type { TOrganizationTeam } from "../types/team";

export const getTeamsByOrganizationId = cache(
  async (organizationId: string): Promise<TOrganizationTeam[]> => {
    const teams = await prisma.team.findMany({
      where: {
        organizationId,
      },
      include: {
        _count: {
          select: {
            teamUsers: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return teams.map((team) => ({
      id: team.id,
      name: team.name,
      organizationId: team.organizationId,
      memberCount: team._count.teamUsers,
      createdAt: team.createdAt,
    }));
  }
);

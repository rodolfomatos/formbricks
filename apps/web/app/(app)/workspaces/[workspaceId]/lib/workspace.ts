import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { Prisma } from "@formbricks/database/prisma";
import { ZId } from "@formbricks/types/common";
import { DatabaseError } from "@formbricks/types/errors";
import { TMembership, ZMembership } from "@formbricks/types/memberships";
import { validateInputs } from "@/lib/utils/validate";

const findWorkspacesForMembership = async (
  userId: string,
  orgMembership: TMembership,
  { writableOnly }: { writableOnly: boolean }
): Promise<{ id: string; name: string }[]> => {
  validateInputs([userId, ZId], [orgMembership, ZMembership]);

  let workspaceWhereClause: Prisma.WorkspaceWhereInput = {};

  if (orgMembership.role === "member") {
    workspaceWhereClause = {
      workspaceTeams: {
        some: {
          ...(writableOnly && { permission: { in: ["readWrite", "manage"] } }),
          team: {
            teamUsers: {
              some: {
                userId,
              },
            },
          },
        },
      },
    };
  }

  try {
    const workspaces = await prisma.workspace.findMany({
      where: {
        organizationId: orgMembership.organizationId,
        ...workspaceWhereClause,
      },
      select: {
        id: true,
        name: true,
      },
    });
    return workspaces;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

/**
 * Returns all workspaces a user belongs to within an organization.
 * Cached per request via React cache().
 */
export const getWorkspacesByUserId = reactCache(
  async (userId: string, orgMembership: TMembership): Promise<{ id: string; name: string }[]> =>
    findWorkspacesForMembership(userId, orgMembership, { writableOnly: false })
);

/**
 * Returns workspaces the user can write to within an organization (readWrite/manage permission).
 * Used for targeting write operations like copying surveys.
 */
export const getWritableWorkspacesByUserId = reactCache(
  async (userId: string, orgMembership: TMembership): Promise<{ id: string; name: string }[]> =>
    findWorkspacesForMembership(userId, orgMembership, { writableOnly: true })
);

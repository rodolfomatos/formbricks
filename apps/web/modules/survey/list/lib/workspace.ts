import "server-only";
import { cache as reactCache } from "react";
import { z } from "zod";
import { prisma } from "@formbricks/database";
import { Prisma } from "@formbricks/database/prisma";
import { logger } from "@formbricks/logger";
import { DatabaseError, ResourceNotFoundError, ValidationError } from "@formbricks/types/errors";
import { validateInputs } from "@/lib/utils/validate";
import { TWorkspaceWithLanguages } from "@/modules/survey/list/types/surveys";
import { TUserWorkspace } from "@/modules/survey/list/types/workspaces";

/** Checks if a workspace exists. Returns its ID or throws ResourceNotFoundError. */
export const doesWorkspaceExist = reactCache(async (workspaceId: string): Promise<string | null> => {
  const workspace = await prisma.workspace.findUnique({
    where: {
      id: workspaceId,
    },
    select: {
      id: true,
    },
  });

  if (!workspace) {
    throw new ResourceNotFoundError("Workspace", workspaceId);
  }

  return workspace.id;
});

/** Fetches a minimal workspace object by ID (just the ID). Returns null if not found. */
export const getWorkspace = reactCache(async (workspaceId: string): Promise<{ id: string } | null> => {
  validateInputs([workspaceId, z.cuid2()]);

  try {
    const workspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
      select: {
        id: true,
      },
    });
    return workspace;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error(error, "Error fetching workspace");
      throw new DatabaseError(error.message);
    }

    throw error;
  }
});

/** Loads a workspace with its associated languages. Returns null if not found. */
export const getWorkspaceWithLanguages = reactCache(
  async (workspaceId: string): Promise<TWorkspaceWithLanguages | null> => {
    try {
      const workspacePrisma = await prisma.workspace.findUnique({
        where: {
          id: workspaceId,
        },
        select: {
          id: true,
          languages: true,
        },
      });

      return workspacePrisma;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        logger.error(error, "Error getting workspace with languages");
        throw new DatabaseError(error.message);
      }
      throw error;
    }
  }
);

/** Returns the list of workspaces a user belongs to within an organisation. Members are scoped to their teams. */
export const getUserWorkspaces = reactCache(
  async (userId: string, organizationId: string): Promise<TUserWorkspace[]> => {
    try {
      const orgMembership = await prisma.membership.findFirst({
        where: {
          userId,
          organizationId,
        },
      });

      if (!orgMembership) {
        throw new ValidationError("User is not a member of this organization");
      }

      let workspaceWhereClause: Prisma.WorkspaceWhereInput = {};

      if (orgMembership.role === "member") {
        workspaceWhereClause = {
          workspaceTeams: {
            some: {
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

      const workspaces = await prisma.workspace.findMany({
        where: {
          organizationId,
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
  }
);

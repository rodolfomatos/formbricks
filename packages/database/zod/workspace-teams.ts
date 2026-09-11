/**
 * Zod schema for workspace-team associations — validates the many-to-many
 * relationship between workspaces and teams with permission level.
 */
import { z } from "zod";
import { type WorkspaceTeam, WorkspaceTeamPermission } from "../src/prisma";

export const ZWorkspaceTeam = z.object({
  createdAt: z.coerce
    .date()
    .meta({
      example: "2021-01-01T00:00:00.000Z",
    })
    .describe("The date and time the workspace tem was created"),
  updatedAt: z.coerce
    .date()
    .meta({
      example: "2021-01-01T00:00:00.000Z",
    })
    .describe("The date and time the workspace team was last updated"),
  workspaceId: z.cuid2().describe("The ID of the workspace"),
  teamId: z.cuid2().describe("The ID of the team"),
  permission: z.enum(WorkspaceTeamPermission).describe("Level of access granted to the workspace"),
}) satisfies z.ZodType<WorkspaceTeam>;

ZWorkspaceTeam.meta({
  id: "workspaceTeam",
}).describe("A relationship between a workspace and a team with associated permissions");

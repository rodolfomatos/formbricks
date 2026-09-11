"use server";

import { cache } from "react";
import { getWorkspacePermissionByUserId } from "../lib/roles";

interface TeamPermissionFlags {
  hasReadAccess: boolean;
  hasWriteAccess: boolean;
  hasAdminAccess: boolean;
}

export const getTeamPermissionFlags = cache(
  async (userId: string, workspaceId: string): Promise<TeamPermissionFlags> => {
    const permission = await getWorkspacePermissionByUserId(userId, workspaceId);

    return {
      hasReadAccess: permission === "read" || permission === "readWrite" || permission === "manage",
      hasWriteAccess: permission === "readWrite" || permission === "manage",
      hasAdminAccess: permission === "manage",
    };
  }
);

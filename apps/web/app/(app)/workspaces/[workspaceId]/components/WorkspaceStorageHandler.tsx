"use client";

import { useEffect } from "react";
import { FORMBRICKS_ENVIRONMENT_ID_LS, FORMBRICKS_WORKSPACE_ID_LS } from "@/lib/localStorage";

interface WorkspaceStorageHandlerProps {
  workspaceId: string;
}

/**
 * Syncs the current workspace ID to localStorage on mount and on workspace change.
 * Writes both the workspace ID and the legacy environment ID for backward compatibility.
 */
const WorkspaceStorageHandler = ({ workspaceId }: WorkspaceStorageHandlerProps) => {
  useEffect(() => {
    localStorage.setItem(FORMBRICKS_WORKSPACE_ID_LS, workspaceId);
    // Keep legacy environment ID in sync for backward compatibility with old SDK clients
    localStorage.setItem(FORMBRICKS_ENVIRONMENT_ID_LS, workspaceId);
  }, [workspaceId]);

  return null;
};

export default WorkspaceStorageHandler;

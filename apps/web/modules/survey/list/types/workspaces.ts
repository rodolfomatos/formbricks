import { Workspace } from "@formbricks/database/prisma";

/** Minimal workspace info returned when listing workspaces a user has access to. */
export interface TUserWorkspace extends Pick<Workspace, "id" | "name"> {}

import { z } from "zod";

export const ZTeamPermission = z.enum(["read", "readWrite", "manage"]);
export type TTeamPermission = z.infer<typeof ZTeamPermission>;

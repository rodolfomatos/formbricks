import { z } from "zod";

export const ZTeamRole = z.enum(["admin", "contributor"]);
export type TTeamRole = z.infer<typeof ZTeamRole>;

export interface TOrganizationMember {
  userId: string;
  name: string;
  email: string;
  role: TTeamRole;
  teamId: string;
  teamName: string;
}

export interface TOrganizationTeam {
  id: string;
  name: string;
  organizationId: string;
  memberCount: number;
  createdAt: Date;
}

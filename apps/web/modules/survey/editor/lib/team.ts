import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { TFollowUpEmailToUser } from "@/modules/survey/editor/types/survey-follow-up";

/** Fetches unique team member email+name details for all given team IDs. Used for follow-up email recipient selection. */
export const getTeamMemberDetails = reactCache(async (teamIds: string[]): Promise<TFollowUpEmailToUser[]> => {
  if (teamIds.length === 0) {
    return [];
  }

  const memberDetails: TFollowUpEmailToUser[] = [];

  for (const teamId of teamIds) {
    const teamMembers = await prisma.teamUser.findMany({
      where: {
        teamId,
      },
    });

    const userEmailAndNames = await prisma.user.findMany({
      where: {
        id: {
          in: teamMembers.map((member) => member.userId),
        },
      },
      select: {
        email: true,
        name: true,
      },
    });

    memberDetails.push(...userEmailAndNames);
  }

  const uniqueMemberDetailsMap = new Map(memberDetails.map((member) => [member.email, member]));
  const uniqueMemberDetails = Array.from(uniqueMemberDetailsMap.values()).map((member) => ({
    email: member.email,
    name: member.name,
  }));

  return uniqueMemberDetails;
});

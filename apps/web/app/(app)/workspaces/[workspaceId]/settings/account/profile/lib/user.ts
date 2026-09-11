import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";

/**
 * Checks if an email address is not already taken by another user.
 * Returns true if the email is unique (available). Cached per request.
 */
export const getIsEmailUnique = reactCache(async (email: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
    select: {
      id: true,
    },
  });

  return !user;
});

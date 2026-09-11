import { logger } from "@formbricks/logger";

export const subscribeUserToMailingList = async (
  userId: string,
  email: string
): Promise<{ success: boolean }> => {
  logger.debug({ userId, email }, "Mailing list subscription");
  return { success: true };
};

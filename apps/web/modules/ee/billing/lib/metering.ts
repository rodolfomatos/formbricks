import { logger } from "@formbricks/logger";

export const recordResponseCreatedMeterEvent = async (
  organizationId: string,
  responseId: string
) => {
  logger.debug({ organizationId, responseId }, "Recording response meter event");
};

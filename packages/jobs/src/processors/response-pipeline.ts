import { logger } from "@formbricks/logger";
import type { JobHandler } from "@/src/contracts";
import type { TResponsePipelineJobData } from "@/src/types";

/**
 * Default response-pipeline processor — throws to signal that the web app
 * layer must register a handler override. This ensures pipeline logic (e.g.
 * follow-up emails, webhooks) is always handled by the application, not the
 * shared jobs package.
 */
export const processResponsePipelineJob: JobHandler<TResponsePipelineJobData> = (data, context) => {
  // TODO(#1548): Keep this fallback until every runtime that starts BullMQ registers the app override.
  logger.error(
    {
      attempt: context.attempt,
      workspaceId: data.workspaceId,
      surveyId: data.surveyId,
      event: data.event,
      jobId: context.jobId,
      jobName: context.jobName,
      queueName: context.queueName,
    },
    "BullMQ response pipeline processor override is not registered"
  );

  throw new Error(
    `BullMQ response pipeline processor override missing for job ${context.jobId} (${data.workspaceId}/${data.surveyId})`
  );
};

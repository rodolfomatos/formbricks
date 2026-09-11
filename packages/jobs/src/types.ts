import { z } from "zod";
import { ZResponse } from "@formbricks/types/responses";
import { ZTag } from "@formbricks/types/tags";
import { ZUserLocale } from "@formbricks/types/user";

/**
 * Test/health-check job payload — a message to log, an optional failure flag,
 * and arbitrary context for debugging.
 */
export const ZTestLogJobData = z.object({
  message: z.string().min(1),
  shouldFail: z.boolean().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export type TTestLogJobData = z.infer<typeof ZTestLogJobData>;

/**
 * Events that trigger a response-pipeline job.
 */
export const ZResponsePipelineEvent = z.enum(["responseFinished", "responseCreated", "responseUpdated"]);

export type TResponsePipelineEvent = z.infer<typeof ZResponsePipelineEvent>;

const ZResponsePipelineJobTag = ZTag.extend({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const ZResponsePipelineJobResponse = ZResponse.extend({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  tags: z.array(ZResponsePipelineJobTag),
});

/**
 * Response-pipeline job payload — includes the event type, full response data,
 * workspace/survey IDs, and the respondent's locale for localised follow-up.
 */
export const ZResponsePipelineJobData = z.object({
  event: ZResponsePipelineEvent,
  response: ZResponsePipelineJobResponse,
  workspaceId: z.cuid2(),
  surveyId: z.cuid2(),
  // Respondent's resolved locale, captured in request scope (headers() is unavailable in the worker).
  // Used to localize follow-up email chrome; falls back to DEFAULT_LOCALE when absent.
  locale: ZUserLocale.optional(),
});

export type TResponsePipelineJobData = z.infer<typeof ZResponsePipelineJobData>;

/**
 * Survey-scheduling job payload — currently only carries a "global" scope
 * marker, but structured as a Zod object for future extensibility.
 */
export const ZSurveySchedulingJobData = z.object({
  scope: z.literal("global"),
});

export type TSurveySchedulingJobData = z.infer<typeof ZSurveySchedulingJobData>;

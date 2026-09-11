import type { JobSchedulerTemplateOptions, JobsOptions } from "bullmq";

/**
 * BullMQ queue name for all background jobs.
 */
export const JOBS_QUEUE_NAME = "background-jobs";
/**
 * Redis key prefix for BullMQ — wrapped in `{}` for Redis Cluster hash-tag support.
 */
export const JOBS_PREFIX = "{formbricks:jobs}";

/**
 * Well-known job names used to register and dispatch background jobs.
 */
export const JOB_NAMES = {
  testLog: "system.test-log",
  responsePipeline: "response-pipeline.process",
  surveyScheduling: "survey-scheduling.reconcile",
} as const;

/**
 * Exponential backoff starting at 5 seconds.
 */
const JOBS_DEFAULT_BACKOFF = Object.freeze({
  type: "exponential",
  delay: 5_000,
} as const);

/**
 * Keep completed jobs for 24 hours, max 1000 entries.
 */
const JOBS_DEFAULT_REMOVE_ON_COMPLETE = Object.freeze({
  age: 24 * 60 * 60,
  count: 1000,
} as const);

/**
 * Keep failed jobs for 7 days, max 5000 entries.
 */
const JOBS_DEFAULT_REMOVE_ON_FAIL = Object.freeze({
  age: 7 * 24 * 60 * 60,
  count: 5000,
} as const);

/**
 * Default BullMQ job options applied to all enqueued jobs.
 */
export const JOBS_DEFAULT_JOB_OPTIONS = Object.freeze({
  attempts: 3,
  backoff: JOBS_DEFAULT_BACKOFF,
  removeOnComplete: JOBS_DEFAULT_REMOVE_ON_COMPLETE,
  removeOnFail: JOBS_DEFAULT_REMOVE_ON_FAIL,
}) satisfies JobsOptions;

/**
 * Template options for recurring job schedulers — ensures repeat jobs inherit
 * the same retry/cleanup settings as one-shot jobs.
 */
export const JOBS_DEFAULT_JOB_SCHEDULER_TEMPLATE_OPTIONS = Object.freeze({
  attempts: JOBS_DEFAULT_JOB_OPTIONS.attempts,
  backoff: JOBS_DEFAULT_JOB_OPTIONS.backoff,
  removeOnComplete: JOBS_DEFAULT_JOB_OPTIONS.removeOnComplete,
  removeOnFail: JOBS_DEFAULT_JOB_OPTIONS.removeOnFail,
}) satisfies JobSchedulerTemplateOptions;

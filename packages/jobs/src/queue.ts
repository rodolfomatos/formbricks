/**
 * Queue module — manages the BullMQ queue singleton, provides typed
 * helpers for enqueuing, scheduling, and managing recurring jobs.
 */
import { type Job, type JobsOptions, Queue } from "bullmq";
import type IORedis from "ioredis";
import { logger } from "@formbricks/logger";
import { closeRedisConnection, createProducerConnection, getRedisUrlFromEnv } from "@/src/connection";
import {
  JOBS_DEFAULT_JOB_OPTIONS,
  JOBS_DEFAULT_JOB_SCHEDULER_TEMPLATE_OPTIONS,
  JOBS_PREFIX,
  JOBS_QUEUE_NAME,
  JOB_NAMES,
} from "@/src/constants";
import type { BackgroundJobProducer, EnqueuedJob, UpsertedRecurringJobSchedule } from "@/src/contracts";
import { getBackgroundJobDefinition } from "@/src/definitions";
import {
  type TBackgroundJobScheduleIdentity,
  type TRecurringBackgroundJobSchedule,
  type TRunAtBackgroundJobSchedule,
  getDelayForRunAtSchedule,
  getRecurringJobSchedulerId,
  toBullMQRepeatOptions,
} from "@/src/schedules";
import {
  type TResponsePipelineJobData,
  type TSurveySchedulingJobData,
  type TTestLogJobData,
} from "@/src/types";

/**
 * Handle returned by getJobsQueue — provides access to the underlying BullMQ
 * Queue and its Redis connection.
 */
export interface JobsQueueHandle {
  connection: IORedis;
  queue: Queue;
}

/**
 * Global state for the queue singleton — stored on globalThis for cross-module
 * sharing and hot-reload resilience.
 */
interface TGlobalJobsQueueState {
  formbricksJobsQueue: Queue | undefined;
  formbricksJobsProducerConnection: IORedis | undefined;
  formbricksJobsQueueInitializing: Promise<JobsQueueHandle> | undefined;
}

const globalForJobsQueue = globalThis as unknown as TGlobalJobsQueueState;

let queueSingleton = globalForJobsQueue.formbricksJobsQueue;
let connectionSingleton = globalForJobsQueue.formbricksJobsProducerConnection;

const hasActiveConnection = (connection?: IORedis): connection is IORedis =>
  connection !== undefined && connection.status !== "end";

/**
 * Factory for a BullMQ Queue instance with default job options and prefix.
 */
export const createJobsQueue = ({
  connection,
  prefix = JOBS_PREFIX,
}: {
  connection: IORedis;
  prefix?: string;
}): Queue =>
  new Queue(JOBS_QUEUE_NAME, {
    connection,
    defaultJobOptions: JOBS_DEFAULT_JOB_OPTIONS,
    prefix,
  });

/**
 * Returns the singleton BullMQ Queue. Creates a new producer connection and
 * queue on first call; concurrent calls are serialised via a module-level
 * initialisation promise.
 */
export const getJobsQueue = async (): Promise<JobsQueueHandle> => {
  if (queueSingleton && hasActiveConnection(connectionSingleton)) {
    return {
      queue: queueSingleton,
      connection: connectionSingleton,
    };
  }

  if (
    globalForJobsQueue.formbricksJobsQueue &&
    hasActiveConnection(globalForJobsQueue.formbricksJobsProducerConnection)
  ) {
    queueSingleton = globalForJobsQueue.formbricksJobsQueue;
    connectionSingleton = globalForJobsQueue.formbricksJobsProducerConnection;

    return {
      queue: globalForJobsQueue.formbricksJobsQueue,
      connection: globalForJobsQueue.formbricksJobsProducerConnection,
    };
  }

  if (globalForJobsQueue.formbricksJobsQueueInitializing) {
    return await globalForJobsQueue.formbricksJobsQueueInitializing;
  }

  globalForJobsQueue.formbricksJobsQueueInitializing = (async (): Promise<JobsQueueHandle> => {
    const connection = createProducerConnection({ redisUrl: getRedisUrlFromEnv() });
    const queue = createJobsQueue({ connection });

    try {
      await queue.waitUntilReady();
    } catch (error) {
      try {
        await queue.close();
      } finally {
        await closeRedisConnection(connection);
      }

      throw error;
    }

    queueSingleton = queue;
    connectionSingleton = connection;
    globalForJobsQueue.formbricksJobsQueue = queue;
    globalForJobsQueue.formbricksJobsProducerConnection = connection;

    return {
      queue,
      connection,
    };
  })();

  try {
    return await globalForJobsQueue.formbricksJobsQueueInitializing;
  } finally {
    globalForJobsQueue.formbricksJobsQueueInitializing = undefined;
  }
};

/**
 * Converts a BullMQ Job into the lightweight EnqueuedJob result.
 *
 * @throws — When job.id is undefined (should never happen for a successfully enqueued job)
 */
const toEnqueuedJob = (
  job: Pick<Job, "name" | "queueName"> & {
    id?: Job["id"];
  }
): EnqueuedJob => {
  if (job.id === undefined) {
    throw new Error(`Missing BullMQ job.id in toEnqueuedJob for jobName=${job.name}`);
  }

  return {
    jobId: String(job.id),
    jobName: job.name,
    queueName: job.queueName,
  };
};

/**
 * Converts a BullMQ Job + identity into an UpsertedRecurringJobSchedule result.
 */
const toUpsertedRecurringJobSchedule = (
  job: Pick<Job, "id" | "name" | "queueName">,
  identity: TBackgroundJobScheduleIdentity
): UpsertedRecurringJobSchedule => ({
  ...toEnqueuedJob(job),
  scheduleId: identity.scheduleId,
  scope: identity.scope,
});

/**
 * Internal helper — validates job data against the definition's Zod schema
 * and adds the job to the BullMQ queue.
 *
 * @throws — When the job name is not registered or Zod validation fails
 */
const enqueueBackgroundJob = async <TData>(
  jobName: string,
  data: TData,
  options?: JobsOptions
): Promise<Job> => {
  const definition = getBackgroundJobDefinition(jobName);

  if (!definition) {
    throw new Error(`No background job definition registered for job: ${jobName}`);
  }

  const parsedData = definition.schema.parse(data);
  const { queue } = await getJobsQueue();
  return await queue.add(definition.name, parsedData, options);
};

/**
 * Internal helper — schedules a job to run at a specific time by computing
 * the delay and enqueuing with a `delay` option.
 */
const scheduleBackgroundJobAt = async <TData>(
  jobName: string,
  schedule: TRunAtBackgroundJobSchedule,
  data: TData
): Promise<Job> => {
  const delay = getDelayForRunAtSchedule(schedule);

  return await enqueueBackgroundJob(jobName, data, { delay });
};

/**
 * Internal helper — creates or updates a recurring job schedule (cron or
 * every-N-ms) via BullMQ's upsertJobScheduler API.
 */
const upsertRecurringBackgroundJobSchedule = async <TData>(
  jobName: string,
  identity: TBackgroundJobScheduleIdentity,
  schedule: TRecurringBackgroundJobSchedule,
  data: TData
): Promise<Job> => {
  const definition = getBackgroundJobDefinition(jobName);

  if (!definition) {
    throw new Error(`No background job definition registered for job: ${jobName}`);
  }

  const parsedData = definition.schema.parse(data);
  const { queue } = await getJobsQueue();

  return await queue.upsertJobScheduler(
    getRecurringJobSchedulerId(definition.name, identity),
    toBullMQRepeatOptions(schedule),
    {
      data: parsedData,
      name: definition.name,
      opts: JOBS_DEFAULT_JOB_SCHEDULER_TEMPLATE_OPTIONS,
    }
  );
};

/**
 * Internal helper — removes a recurring job schedule by identity.
 *
 * @returns — true if the schedule was removed, false if it didn't exist
 */
const removeRecurringBackgroundJobSchedule = async (
  jobName: string,
  identity: TBackgroundJobScheduleIdentity
): Promise<boolean> => {
  const definition = getBackgroundJobDefinition(jobName);

  if (!definition) {
    throw new Error(`No background job definition registered for job: ${jobName}`);
  }

  const { queue } = await getJobsQueue();

  return await queue.removeJobScheduler(getRecurringJobSchedulerId(definition.name, identity));
};

/**
 * Enqueues a one-shot test-log job. Errors are logged and re-thrown.
 */
export const enqueueTestLogJob = async (data: TTestLogJobData): Promise<Job> => {
  try {
    return await enqueueBackgroundJob(JOB_NAMES.testLog, data);
  } catch (error) {
    logger.error({ err: error, jobName: JOB_NAMES.testLog }, "Failed to enqueue BullMQ test log job");
    throw error;
  }
};

/**
 * Enqueues a one-shot response-pipeline job. Errors are logged and re-thrown.
 */
export const enqueueResponsePipelineJob = async (data: TResponsePipelineJobData): Promise<Job> => {
  try {
    return await enqueueBackgroundJob(JOB_NAMES.responsePipeline, data);
  } catch (error) {
    logger.error(
      { err: error, jobName: JOB_NAMES.responsePipeline },
      "Failed to enqueue BullMQ response pipeline job"
    );
    throw error;
  }
};

/**
 * Enqueues a one-shot survey-scheduling job. Errors are logged and re-thrown.
 */
export const enqueueSurveySchedulingJob = async (data: TSurveySchedulingJobData): Promise<Job> => {
  try {
    return await enqueueBackgroundJob(JOB_NAMES.surveyScheduling, data);
  } catch (error) {
    logger.error(
      { err: error, jobName: JOB_NAMES.surveyScheduling },
      "Failed to enqueue BullMQ survey scheduling job"
    );
    throw error;
  }
};

/**
 * Schedules a test-log job to run at a specific time. Errors are logged and re-thrown.
 */
export const scheduleTestLogJobAt = async (
  schedule: TRunAtBackgroundJobSchedule,
  data: TTestLogJobData
): Promise<Job> => {
  try {
    return await scheduleBackgroundJobAt(JOB_NAMES.testLog, schedule, data);
  } catch (error) {
    logger.error(
      { err: error, jobName: JOB_NAMES.testLog, schedule },
      "Failed to schedule BullMQ test log job"
    );
    throw error;
  }
};

/**
 * Schedules a response-pipeline job to run at a specific time. Errors are logged and re-thrown.
 */
export const scheduleResponsePipelineJobAt = async (
  schedule: TRunAtBackgroundJobSchedule,
  data: TResponsePipelineJobData
): Promise<Job> => {
  try {
    return await scheduleBackgroundJobAt(JOB_NAMES.responsePipeline, schedule, data);
  } catch (error) {
    logger.error(
      { err: error, jobName: JOB_NAMES.responsePipeline, schedule },
      "Failed to schedule BullMQ response pipeline job"
    );
    throw error;
  }
};

/**
 * Schedules a survey-scheduling job to run at a specific time. Errors are logged and re-thrown.
 */
export const scheduleSurveySchedulingJobAt = async (
  schedule: TRunAtBackgroundJobSchedule,
  data: TSurveySchedulingJobData
): Promise<Job> => {
  try {
    return await scheduleBackgroundJobAt(JOB_NAMES.surveyScheduling, schedule, data);
  } catch (error) {
    logger.error(
      { err: error, jobName: JOB_NAMES.surveyScheduling, schedule },
      "Failed to schedule BullMQ survey scheduling job"
    );
    throw error;
  }
};

/**
 * Creates or updates a recurring test-log job schedule. Errors are logged and re-thrown.
 */
export const upsertRecurringTestLogJobSchedule = async (
  identity: TBackgroundJobScheduleIdentity,
  schedule: TRecurringBackgroundJobSchedule,
  data: TTestLogJobData
): Promise<Job> => {
  try {
    return await upsertRecurringBackgroundJobSchedule(JOB_NAMES.testLog, identity, schedule, data);
  } catch (error) {
    logger.error(
      {
        err: error,
        jobName: JOB_NAMES.testLog,
        schedule,
        scheduleId: identity.scheduleId,
        scope: identity.scope,
      },
      "Failed to upsert BullMQ test log schedule"
    );
    throw error;
  }
};

/**
 * Creates or updates a recurring response-pipeline job schedule. Errors are logged and re-thrown.
 */
export const upsertRecurringResponsePipelineJobSchedule = async (
  identity: TBackgroundJobScheduleIdentity,
  schedule: TRecurringBackgroundJobSchedule,
  data: TResponsePipelineJobData
): Promise<Job> => {
  try {
    return await upsertRecurringBackgroundJobSchedule(JOB_NAMES.responsePipeline, identity, schedule, data);
  } catch (error) {
    logger.error(
      {
        err: error,
        jobName: JOB_NAMES.responsePipeline,
        schedule,
        scheduleId: identity.scheduleId,
        scope: identity.scope,
      },
      "Failed to upsert BullMQ response pipeline schedule"
    );
    throw error;
  }
};

/**
 * Creates or updates a recurring survey-scheduling job schedule. Errors are logged and re-thrown.
 */
export const upsertRecurringSurveySchedulingJobSchedule = async (
  identity: TBackgroundJobScheduleIdentity,
  schedule: TRecurringBackgroundJobSchedule,
  data: TSurveySchedulingJobData
): Promise<Job> => {
  try {
    return await upsertRecurringBackgroundJobSchedule(JOB_NAMES.surveyScheduling, identity, schedule, data);
  } catch (error) {
    logger.error(
      {
        err: error,
        jobName: JOB_NAMES.surveyScheduling,
        schedule,
        scheduleId: identity.scheduleId,
        scope: identity.scope,
      },
      "Failed to upsert BullMQ survey scheduling schedule"
    );
    throw error;
  }
};

/**
 * Removes a recurring survey-scheduling job schedule by identity. Errors are logged and re-thrown.
 *
 * @returns — true if the schedule was removed
 */
export const removeRecurringSurveySchedulingJobSchedule = async (
  identity: TBackgroundJobScheduleIdentity
): Promise<boolean> => {
  try {
    return await removeRecurringBackgroundJobSchedule(JOB_NAMES.surveyScheduling, identity);
  } catch (error) {
    logger.error(
      {
        err: error,
        jobName: JOB_NAMES.surveyScheduling,
        scheduleId: identity.scheduleId,
        scope: identity.scope,
      },
      "Failed to remove BullMQ survey scheduling schedule"
    );
    throw error;
  }
};

/**
 * Returns a BackgroundJobProducer interface wrapping all enqueue/schedule
 * helpers. This is the primary API consumers should use.
 */
export const getBackgroundJobProducer = (): BackgroundJobProducer => ({
  enqueueResponsePipeline: async (data) => toEnqueuedJob(await enqueueResponsePipelineJob(data)),
  enqueueSurveyScheduling: async (data) => toEnqueuedJob(await enqueueSurveySchedulingJob(data)),
  enqueueTestLog: async (data) => toEnqueuedJob(await enqueueTestLogJob(data)),
  scheduleResponsePipelineAt: async (schedule, data) =>
    toEnqueuedJob(await scheduleResponsePipelineJobAt(schedule, data)),
  scheduleSurveySchedulingAt: async (schedule, data) =>
    toEnqueuedJob(await scheduleSurveySchedulingJobAt(schedule, data)),
  scheduleTestLogAt: async (schedule, data) => toEnqueuedJob(await scheduleTestLogJobAt(schedule, data)),
  upsertRecurringResponsePipelineSchedule: async (identity, schedule, data) =>
    toUpsertedRecurringJobSchedule(
      await upsertRecurringResponsePipelineJobSchedule(identity, schedule, data),
      identity
    ),
  upsertRecurringSurveySchedulingSchedule: async (identity, schedule, data) =>
    toUpsertedRecurringJobSchedule(
      await upsertRecurringSurveySchedulingJobSchedule(identity, schedule, data),
      identity
    ),
  upsertRecurringTestLogSchedule: async (identity, schedule, data) =>
    toUpsertedRecurringJobSchedule(
      await upsertRecurringTestLogJobSchedule(identity, schedule, data),
      identity
    ),
});

/**
 * Resets the queue singleton — closes the queue and connection, clears global
 * state. Used during integration tests.
 */
export const resetJobsQueueFactory = async (): Promise<void> => {
  try {
    if (queueSingleton) {
      await queueSingleton.close();
    }
  } catch (error) {
    logger.error({ err: error }, "Failed to close BullMQ producer queue during reset");
  }

  try {
    if (connectionSingleton) {
      await closeRedisConnection(connectionSingleton);
    }
  } catch (error) {
    logger.error({ err: error }, "Failed to close BullMQ producer connection during reset");
  }

  queueSingleton = undefined;
  connectionSingleton = undefined;
  globalForJobsQueue.formbricksJobsQueue = undefined;
  globalForJobsQueue.formbricksJobsProducerConnection = undefined;
  globalForJobsQueue.formbricksJobsQueueInitializing = undefined;
};

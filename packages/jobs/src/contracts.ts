import type { ZodType } from "zod";
import type {
  TBackgroundJobScheduleIdentity,
  TRecurringBackgroundJobSchedule,
  TRunAtBackgroundJobSchedule,
} from "@/src/schedules";
import type { TResponsePipelineJobData, TSurveySchedulingJobData, TTestLogJobData } from "@/src/types";

/**
 * Context passed to every job handler — includes attempt number, job
 * metadata, and queue information for logging and retry logic.
 */
export interface JobExecutionContext {
  attempt: number;
  jobId: string;
  jobName: string;
  maxAttempts: number;
  queueName: string;
}

/**
 * Result returned by one-shot enqueue operations.
 */
export interface EnqueuedJob {
  jobId: string;
  jobName: string;
  queueName: string;
}

/**
 * Result returned by recurring schedule upsert operations — includes the
 * identity used to create or update the schedule.
 */
export interface UpsertedRecurringJobSchedule extends EnqueuedJob {
  scheduleId: string;
  scope: string;
}

/**
 * Function signature for processing a background job. Returns a Promise that
 * resolves when processing is complete.
 */
export type JobHandler<TData> = (data: TData, context: JobExecutionContext) => Promise<void>;

/**
 * Override map keyed by job name — used by the runtime to inject custom
 * handlers (e.g. from the web app layer) instead of the default fallback.
 */
export type JobHandlerOverrides = Partial<Record<string, JobHandler<unknown>>>;

/**
 * Strongly-typed definition of a background job — combines a Zod schema for
 * runtime input validation with the handler function.
 */
export interface BackgroundJobDefinition<TData> {
  handle: JobHandler<TData>;
  name: string;
  schema: ZodType<TData>;
}

/**
 * Type-erased version of BackgroundJobDefinition used at runtime where the
 * generic type parameter is not known.
 */
export interface AnyBackgroundJobDefinition {
  handle: JobHandler<unknown>;
  name: string;
  schema: ZodType;
}

/**
 * Erases the generic type parameter from a BackgroundJobDefinition so it can
 * be stored in a homogeneous registry.
 */
export const toAnyBackgroundJobDefinition = <TData>(
  definition: BackgroundJobDefinition<TData>
): AnyBackgroundJobDefinition => ({
  handle: async (data, context) => {
    await definition.handle(data as TData, context);
  },
  name: definition.name,
  schema: definition.schema as ZodType,
});

/**
 * Unified interface for enqueuing, scheduling, and managing recurring
 * background jobs. Consumers (e.g. server actions) should depend on this
 * interface rather than calling queue helpers directly.
 */
export interface BackgroundJobProducer {
  enqueueResponsePipeline: (data: TResponsePipelineJobData) => Promise<EnqueuedJob>;
  enqueueSurveyScheduling: (data: TSurveySchedulingJobData) => Promise<EnqueuedJob>;
  enqueueTestLog: (data: TTestLogJobData) => Promise<EnqueuedJob>;
  scheduleResponsePipelineAt: (
    schedule: TRunAtBackgroundJobSchedule,
    data: TResponsePipelineJobData
  ) => Promise<EnqueuedJob>;
  scheduleSurveySchedulingAt: (
    schedule: TRunAtBackgroundJobSchedule,
    data: TSurveySchedulingJobData
  ) => Promise<EnqueuedJob>;
  scheduleTestLogAt: (schedule: TRunAtBackgroundJobSchedule, data: TTestLogJobData) => Promise<EnqueuedJob>;
  upsertRecurringResponsePipelineSchedule: (
    identity: TBackgroundJobScheduleIdentity,
    schedule: TRecurringBackgroundJobSchedule,
    data: TResponsePipelineJobData
  ) => Promise<UpsertedRecurringJobSchedule>;
  upsertRecurringSurveySchedulingSchedule: (
    identity: TBackgroundJobScheduleIdentity,
    schedule: TRecurringBackgroundJobSchedule,
    data: TSurveySchedulingJobData
  ) => Promise<UpsertedRecurringJobSchedule>;
  upsertRecurringTestLogSchedule: (
    identity: TBackgroundJobScheduleIdentity,
    schedule: TRecurringBackgroundJobSchedule,
    data: TTestLogJobData
  ) => Promise<UpsertedRecurringJobSchedule>;
}

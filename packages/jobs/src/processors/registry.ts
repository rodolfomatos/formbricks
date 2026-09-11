import type { Job } from "bullmq";
import { logger } from "@formbricks/logger";
import type { AnyBackgroundJobDefinition, JobHandlerOverrides } from "@/src/contracts";
import { backgroundJobDefinitions, getBackgroundJobDefinition } from "@/src/definitions";

/**
 * Runtime processor map — mirrors the definitions registry but is kept as a
 * separate reference so it can be patched for testing.
 */
export const jobProcessors: Record<string, AnyBackgroundJobDefinition> = backgroundJobDefinitions;

/**
 * Returns the processor definition for a given job name.
 */
export const getJobProcessor = (jobName: string): AnyBackgroundJobDefinition | undefined =>
  getBackgroundJobDefinition(jobName);

/**
 * Dispatches a BullMQ Job to the registered handler. Validates input data
 * against the job's Zod schema, applies any handler overrides, and executes
 * the handler within the job's execution context.
 *
 * @param job — The BullMQ job to process
 * @param handlerOverrides — Optional map of overrides (keyed by job name)
 */
export const processJob = async (job: Job, handlerOverrides?: JobHandlerOverrides): Promise<void> => {
  const definition = getJobProcessor(job.name);

  if (!definition) {
    const error = new Error(`No BullMQ processor registered for job: ${job.name}`);
    logger.error({ jobId: job.id, jobName: job.name, queueName: job.queueName }, error.message);
    throw error;
  }

  const data = definition.schema.parse(job.data);
  const handler = handlerOverrides?.[job.name] ?? definition.handle;
  const maxAttempts = typeof job.opts.attempts === "number" && job.opts.attempts > 0 ? job.opts.attempts : 1;

  await handler(data, {
    attempt: job.attemptsMade + 1,
    jobId: String(job.id),
    jobName: job.name,
    maxAttempts,
    queueName: job.queueName,
  });
};

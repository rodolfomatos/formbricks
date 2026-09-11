import { type Job, type Queue, Worker } from "bullmq";
import type IORedis from "ioredis";
import { logger } from "@formbricks/logger";
import { closeRedisConnection, createProducerConnection, createWorkerConnection } from "@/src/connection";
import { JOBS_PREFIX, JOBS_QUEUE_NAME } from "@/src/constants";
import type { JobHandlerOverrides } from "@/src/contracts";
import { processJob } from "@/src/processors/registry";
import { createJobsQueue } from "@/src/queue";

/**
 * Default concurrency per worker (1 = sequential processing).
 */
const DEFAULT_WORKER_CONCURRENCY = 1;
/**
 * Default number of worker processes to spawn.
 */
const DEFAULT_WORKER_COUNT = 1;

/**
 * Options for starting the BullMQ jobs runtime.
 */
export interface JobsRuntimeOptions {
  redisUrl: string;
  prefix?: string;
  concurrency?: number;
  workerCount?: number;
  jobHandlerOverrides?: JobHandlerOverrides;
}

/**
 * Handle returned by startJobsRuntime — provides access to the queue,
 * workers, and a close function for graceful shutdown.
 */
export interface JobsRuntimeHandle {
  queue: Queue;
  workers: Worker[];
  close: () => Promise<void>;
}

type TSignalHandler = () => void;

/**
 * Removes a previously registered signal handler to prevent duplicate
 * registrations on repeated start/stop cycles.
 */
const removeProcessListener = (event: "SIGTERM" | "SIGINT", handler: TSignalHandler): void => {
  process.removeListener(event, handler);
};

/**
 * Validates that a number is a positive integer, throwing a descriptive
 * error otherwise.
 */
const getPositiveInteger = (value: number, label: string): number => {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer`);
  }

  return value;
};

/**
 * Attaches error/failed/completed event listeners to a worker for logging.
 */
const registerWorkerLogging = (worker: Worker, workerNumber: number): void => {
  worker.on("error", (error) => {
    logger.error({ err: error, queueName: JOBS_QUEUE_NAME, workerNumber }, "BullMQ worker error");
  });

  worker.on("failed", (job, error) => {
    logger.error(
      {
        err: error,
        attemptsMade: job?.attemptsMade,
        jobId: job?.id,
        jobName: job?.name,
        queueName: job?.queueName,
        workerNumber,
      },
      "BullMQ job failed"
    );
  });

  worker.on("completed", (job) => {
    logger.debug(
      {
        attemptsMade: job.attemptsMade,
        jobId: job.id,
        jobName: job.name,
        queueName: job.queueName,
        workerNumber,
      },
      "BullMQ job completed"
    );
  });
};

/**
 * Starts the BullMQ jobs runtime — creates a producer connection, a queue,
 * and N worker processes that listen for jobs. Registers SIGTERM/SIGINT
 * handlers for graceful shutdown.
 *
 * @param options — Runtime options including Redis URL, worker count, concurrency, and handler overrides
 * @returns — A handle with the queue, workers array, and a close() function
 */
export const startJobsRuntime = async ({
  redisUrl,
  prefix = JOBS_PREFIX,
  concurrency = DEFAULT_WORKER_CONCURRENCY,
  workerCount = DEFAULT_WORKER_COUNT,
  jobHandlerOverrides,
}: JobsRuntimeOptions): Promise<JobsRuntimeHandle> => {
  const resolvedConcurrency = getPositiveInteger(concurrency, "BullMQ worker concurrency");
  const resolvedWorkerCount = getPositiveInteger(workerCount, "BullMQ worker count");
  const producerConnection = createProducerConnection({
    redisUrl,
    connectionName: "formbricks-jobs-runtime-producer",
  });

  let queue: Queue | undefined;
  const workerConnections: IORedis[] = [];
  const workers: Worker[] = [];
  let closeRuntimePromise: Promise<void> | undefined;

  const closeRuntime = async (): Promise<void> => {
    if (!closeRuntimePromise) {
      closeRuntimePromise = (async () => {
        removeProcessListener("SIGTERM", handleSigterm);
        removeProcessListener("SIGINT", handleSigint);

        const closeConnectionSafely = async (connection: IORedis, connectionName: string): Promise<void> => {
          try {
            await closeRedisConnection(connection);
          } catch (error) {
            logger.error({ err: error, connectionName }, "Failed to close BullMQ Redis connection cleanly");
          }
        };

        await Promise.all(
          workers.map(async (worker, index) => {
            try {
              await worker.close();
            } catch (error) {
              logger.error({ err: error, workerNumber: index + 1 }, "Failed to close BullMQ worker cleanly");
            }
          })
        );

        if (queue) {
          try {
            await queue.close();
          } catch (error) {
            logger.error({ err: error }, "Failed to close BullMQ queue cleanly");
          }
        }

        await Promise.all([
          closeConnectionSafely(producerConnection, "producer"),
          ...workerConnections.map((workerConnection, index) =>
            closeConnectionSafely(workerConnection, `worker-${(index + 1).toString()}`)
          ),
        ]);
      })();
    }

    await closeRuntimePromise;
  };

  const handleSigterm = (): void => {
    void closeRuntime()
      .catch((error: unknown) => {
        logger.error({ err: error }, "BullMQ shutdown failed in closeRuntime after SIGTERM");
      })
      .finally(() => {
        process.exit(0);
      });
  };

  const handleSigint = (): void => {
    void closeRuntime()
      .catch((error: unknown) => {
        logger.error({ err: error }, "BullMQ shutdown failed in closeRuntime after SIGINT");
      })
      .finally(() => {
        process.exit(0);
      });
  };

  try {
    queue = createJobsQueue({ connection: producerConnection, prefix });

    for (let workerIndex = 0; workerIndex < resolvedWorkerCount; workerIndex++) {
      const workerConnection = createWorkerConnection({
        redisUrl,
        connectionName: `formbricks-jobs-runtime-worker-${(workerIndex + 1).toString()}`,
      });
      workerConnections.push(workerConnection);
      const worker = new Worker(
        JOBS_QUEUE_NAME,
        async (job: Job) => {
          await processJob(job, jobHandlerOverrides);
        },
        {
          connection: workerConnection,
          concurrency: resolvedConcurrency,
          prefix,
        }
      );

      workers.push(worker);
      registerWorkerLogging(worker, workerIndex + 1);
    }

    await Promise.all([queue.waitUntilReady(), ...workers.map((worker) => worker.waitUntilReady())]);

    process.once("SIGTERM", handleSigterm);
    process.once("SIGINT", handleSigint);

    logger.info(
      {
        queueName: JOBS_QUEUE_NAME,
        prefix,
        workerConcurrency: resolvedConcurrency,
        workerCount: resolvedWorkerCount,
      },
      "BullMQ runtime started"
    );

    return {
      queue,
      workers,
      close: closeRuntime,
    };
  } catch (error) {
    logger.error({ err: error, queueName: JOBS_QUEUE_NAME, prefix }, "Failed to start BullMQ runtime");
    await closeRuntime();
    throw error;
  }
};

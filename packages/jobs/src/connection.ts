import IORedis, { type RedisOptions } from "ioredis";
import { logger } from "@formbricks/logger";

/**
 * Configuration for a BullMQ Redis connection.
 */
export interface JobsConnectionConfig {
  redisUrl: string;
  connectionName?: string;
}

/**
 * Base Redis connection options shared by producers and workers.
 */
const getCommonConnectionOptions = (
  connectionName?: string
): Pick<RedisOptions, "connectionName" | "lazyConnect" | "enableReadyCheck" | "connectTimeout"> => ({
  connectionName,
  lazyConnect: false,
  enableReadyCheck: true,
  connectTimeout: 3000,
});

/**
 * Attaches an error listener to the Redis connection for observability.
 */
const addConnectionErrorLogging = (connection: IORedis, label: string): IORedis => {
  connection.on("error", (error) => {
    logger.error({ err: error, label }, "BullMQ Redis connection error");
  });

  return connection;
};

/**
 * Creates a Redis connection suited for job producers (fast failure, no offline queue).
 */
export const createProducerConnection = ({
  redisUrl,
  connectionName = "formbricks-jobs-producer",
}: JobsConnectionConfig): IORedis =>
  addConnectionErrorLogging(
    new IORedis(redisUrl, {
      ...getCommonConnectionOptions(connectionName),
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    }),
    "producer"
  );

/**
 * Creates a Redis connection suited for job workers (infinite retries, offline queue enabled).
 */
export const createWorkerConnection = ({
  redisUrl,
  connectionName = "formbricks-jobs-worker",
}: JobsConnectionConfig): IORedis =>
  addConnectionErrorLogging(
    new IORedis(redisUrl, {
      ...getCommonConnectionOptions(connectionName),
      maxRetriesPerRequest: null,
    }),
    "worker"
  );

/**
 * Reads REDIS_URL from the environment with validation.
 *
 * @throws — If REDIS_URL is missing or not a valid URL
 */
export const getRedisUrlFromEnv = (): string => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL is required for BullMQ");
  }

  if (!URL.canParse(redisUrl)) {
    throw new Error("REDIS_URL must be a valid URL for BullMQ");
  }

  return redisUrl;
};

/**
 * Gracefully closes a Redis connection — calls `.quit()` when ready,
 * otherwise calls `.disconnect()` to avoid hanging.
 */
export const closeRedisConnection = async (connection: IORedis): Promise<void> => {
  if (connection.status === "end") {
    return;
  }

  if (connection.status !== "ready") {
    connection.disconnect();
    return;
  }

  try {
    await connection.quit();
  } catch {
    connection.disconnect();
  }
};

import { createClient } from "redis";
import { logger } from "@formbricks/logger";
import type { RedisClient } from "@/types/client";
import { type CacheError, ErrorCode, type Result, err, ok } from "@/types/error";
import { CacheService } from "./service";

/**
 * Creates a Redis client from the REDIS_URL environment variable. Registers
 * error/connect/ready/end handlers for observability.
 *
 * @returns — Connected RedisClient on success, or a CacheError if REDIS_URL is not set or connection fails
 */
export async function createRedisClientFromEnv(): Promise<Result<RedisClient, CacheError>> {
  const url = process.env.REDIS_URL;
  if (!url) {
    logger.error("REDIS_URL is required to create the Redis client");
    return err({
      code: ErrorCode.RedisConfigurationError,
    });
  }

  const client = createClient({
    url,
    socket: {
      connectTimeout: 3000,
    },
  });

  client.on("error", (error) => {
    logger.error(error, "Redis client error");
    try {
      resetCacheFactory();
      client.destroy();
    } catch (e) {
      logger.error(e, "Error destroying Redis client");
    }
  });

  client.on("connect", () => {
    logger.info("Redis client connected");
  });

  client.on("ready", () => {
    logger.info("Redis client ready");
  });

  client.on("end", () => {
    logger.info("Redis client disconnected");
  });

  try {
    await client.connect();
    return ok(client as RedisClient);
  } catch (error) {
    logger.error(error, "Redis client connection failed");
    return err({ code: ErrorCode.RedisConnectionError });
  }
}

// Global singleton with globalThis for cross-module sharing
const globalForCache = globalThis as unknown as {
  formbricksCache: CacheService | undefined;
  formbricksCacheInitializing: Promise<Result<CacheService, CacheError>> | undefined;
};

// Module-level singleton for performance
let singleton: CacheService | null = globalForCache.formbricksCache ?? null;

/**
 * Returns the singleton CacheService. On first call, creates the Redis client
 * and wraps it in a CacheService. Concurrent initialisation is serialised via
 * a module-level promise so multiple fast callers don't create duplicate
 * connections.
 *
 * @returns — Existing or freshly created CacheService, or a CacheError if Redis is unavailable
 */
export async function getCacheService(): Promise<Result<CacheService, CacheError>> {
  // Return existing instance immediately
  if (singleton) {
    const rc = singleton.getRedisClient();
    if (rc?.isReady && rc.isOpen) return ok(singleton);
  }

  // Return existing instance from globalForCache if available
  if (globalForCache.formbricksCache) {
    const rc = globalForCache.formbricksCache.getRedisClient();
    if (rc?.isReady && rc.isOpen) {
      singleton = globalForCache.formbricksCache;
      return ok(globalForCache.formbricksCache);
    }
  }

  // Prevent concurrent initialization
  if (globalForCache.formbricksCacheInitializing) {
    const result = await globalForCache.formbricksCacheInitializing;
    if (result.ok) {
      singleton = result.data;
    }
    return result;
  }

  // Start initialization - fail fast approach
  globalForCache.formbricksCacheInitializing = (async (): Promise<Result<CacheService, CacheError>> => {
    const clientResult = await createRedisClientFromEnv();
    if (!clientResult.ok) {
      logger.error({ error: clientResult.error }, "Redis client creation failed");
      return err({ code: clientResult.error.code });
    }

    const client = clientResult.data;
    logger.debug("Redis connection established");
    const svc = new CacheService(client);
    singleton = svc;
    globalForCache.formbricksCache = svc;
    logger.debug("Cache service created");
    return ok(svc);
  })();

  const result = await globalForCache.formbricksCacheInitializing;
  if (!result.ok) {
    globalForCache.formbricksCacheInitializing = undefined; // Allow retry
    logger.error({ error: result.error }, "Cache service creation failed");
  }
  return result;
}

/**
 * Resets the cache singleton so the next getCacheService() call creates a
 * fresh connection. Useful during integration tests or credential rotation.
 */
export function resetCacheFactory(): void {
  singleton = null;
  globalForCache.formbricksCache = undefined;
  globalForCache.formbricksCacheInitializing = undefined;
}

import type { RedisClientType } from "redis";

/**
 * Re-export of the ioredis RedisClientType so consumers don't need to
 * depend on the underlying Redis library types directly.
 */
export type RedisClient = RedisClientType;

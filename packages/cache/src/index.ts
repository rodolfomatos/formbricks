/**
 * Cache module — Redis-backed distributed cache with LRU semantics, TTL
 * support, distributed locking, and cache-aside helper patterns.
 *
 * @example
 * ```typescript
 * import { getCacheService, createCacheKey } from "@formbricks/cache";
 *
 * const cache = await getCacheService();
 * const key = createCacheKey.workspace.state("ws_123");
 * ```
 */
export { getCacheService } from "./client";
export type { CacheService } from "./service";
export { createCacheKey } from "./cache-keys";
export type { CacheKey } from "../types/keys";
export type { CacheError, Result } from "../types/error";
export { ErrorCode } from "../types/error";

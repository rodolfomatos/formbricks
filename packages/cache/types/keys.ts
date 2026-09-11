import { z } from "zod";

/**
 * Zod schema for branded cache keys — ensures every key passes minimum length
 * and non-whitespace validation at runtime, not just at the type level.
 */
export const ZCacheKey = z
  .string()
  .min(1, "Cache key cannot be empty")
  .refine((key) => key.trim().length > 0, "Cache key cannot be empty or whitespace only")
  .brand("CacheKey");

/**
 * Branded string type — values can only be created via makeCacheKey() or the
 * createCacheKey factory. This prevents accidentally passing raw user input
 * as a cache key.
 */
export type CacheKey = z.infer<typeof ZCacheKey>;

/**
 * Allowed namespaces for custom cache keys. Add new entries here as new
 * caching domains are introduced — every namespace maps to a top-level
 * segment in the Redis key hierarchy.
 */
export type CustomCacheNamespace = "account_deletion" | "analytics" | "billing" | "oauth";

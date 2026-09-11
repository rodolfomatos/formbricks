import { z } from "zod";

/**
 * Zod schema and type for a rate-limit window definition.
 * Consumers provide interval + allowedPerInterval + namespace.
 */
export const ZRateLimitConfig = z.object({
  /** Rate limit window in seconds */
  interval: z.int().positive().describe("Rate limit window in seconds"),
  /** Maximum allowed requests per interval */
  allowedPerInterval: z.int().positive().describe("Maximum allowed requests per interval"),
  /** Namespace for grouping rate limit per feature */
  namespace: z.string().min(1).describe("Namespace for grouping rate limit per feature"),
});

/** Inferred type for a rate-limit configuration object. */
export type TRateLimitConfig = z.infer<typeof ZRateLimitConfig>;

const ZRateLimitResponse = z.object({
  allowed: z.boolean().describe("Whether the request is allowed"),
  retryAfter: z.int().positive().optional().describe("Seconds until the current rate-limit window resets"),
});

/** Inferred type for a rate-limit check result. */
export type TRateLimitResponse = z.infer<typeof ZRateLimitResponse>;

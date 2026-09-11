import { z } from "zod";

/**
 * Available log levels in order of severity — "audit" is the highest and is
 * reserved for security-relevant events.
 */
export const LOG_LEVELS = ["debug", "info", "warn", "error", "fatal", "audit"] as const;

/**
 * Zod schema for runtime log-level validation so invalid env values degrade
 * silently to the default.
 */
export const ZLogLevel = z.enum(LOG_LEVELS);

/**
 * Union type of valid log-level strings.
 */
export type TLogLevel = z.infer<typeof ZLogLevel>;

import { z } from "zod";

/**
 * Zod schema for required TTL values — enforces integer, minimum 1 second,
 * and finite number guard (no Infinity/NaN).
 */
export const ZTtlMs = z
  .int()
  .min(1000, "TTL must be at least 1000ms (1 second)")
  .finite("TTL must be finite");

/**
 * Zod schema for optional TTL values — same validation as ZTtlMs but accepts
 * `undefined` for keys that should persist indefinitely.
 */
export const ZTtlMsOptional = z
  .int()
  .min(1000, "TTL must be at least 1000ms (1 second)")
  .finite("TTL must be finite")
  .optional();

/**
 * Discriminated union Result type — lets callers handle success/failure
 * without try/catch by checking `result.ok`.
 */
export type Result<T, E = Error> = { ok: true; data: T } | { ok: false; error: E };

/**
 * Wraps a value in a successful Result.
 */
export const ok = <T, E>(data: T): Result<T, E> => ({ ok: true, data });

/**
 * Wraps an error in a failed Result.
 */
export const err = <E = Error>(error: E): Result<never, E> => ({ ok: false, error });

/**
 * Machine-readable error codes for every failure mode the cache service can
 * encounter — callers should switch on these instead of parsing messages.
 */
export enum ErrorCode {
  Unknown = "unknown",
  CacheValidationError = "cache_validation_error",
  RedisConnectionError = "redis_connection_error",
  RedisOperationError = "redis_operation_error",
  CacheCorruptionError = "cache_corruption_error",
  RedisConfigurationError = "redis_configuration_error",
}

/**
 * Lightweight error payload for Result-based error paths — carries only an
 * ErrorCode so it can be serialised easily.
 */
export interface CacheError {
  code: ErrorCode;
}

/**
 * Error subclass used internally by CacheService when an actual Error instance
 * is required (e.g. Promise.race timeout, logging). Includes the same `code`
 * field as CacheError for unified handling.
 */
export class CacheErrorClass extends Error implements CacheError {
  constructor(
    public code: ErrorCode,
    message?: string
  ) {
    super(message ?? `Cache error: ${code}`);
    this.name = "CacheError";

    // Maintains proper prototype chain in older environments
    Object.setPrototypeOf(this, CacheErrorClass.prototype);
  }

  /**
   * Creates a CacheErrorClass from a plain CacheError object
   * Useful for converting existing error objects to proper Error instances
   */
  static fromCacheError(error: CacheError, message?: string): CacheErrorClass {
    return new CacheErrorClass(error.code, message);
  }
}

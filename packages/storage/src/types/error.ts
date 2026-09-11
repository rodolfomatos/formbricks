/**
 * Discriminated union Result type — lets callers handle success/failure
 * without try/catch by checking `result.ok`.
 */
export type Result<T, E = Error> = { ok: true; data: T } | { ok: false; error: E };

/**
 * Narrowed type for a failed Result — provides autocomplete on `.error`.
 */
export interface ResultError<T> {
  ok: false;
  error: T;
}

/**
 * Narrowed type for a successful Result — provides autocomplete on `.data`.
 */
export interface ResultOk<T> {
  ok: true;
  data: T;
}

/**
 * Wraps a value in a successful Result.
 */
export const ok = <T, E>(data: T): Result<T, E> => ({ ok: true, data });

/**
 * Wraps `undefined` in a successful Result (for void-returning operations).
 */
export const okVoid = <E>(): Result<void, E> => ({ ok: true, data: undefined });

/**
 * Wraps an error in a failed Result.
 */
export const err = <E = Error>(error: E): ResultError<E> => ({
  ok: false,
  error,
});

/**
 * Machine-readable error codes for all S3/storage failure modes.
 */
export enum StorageErrorCode {
  Unknown = "unknown",
  S3CredentialsError = "s3_credentials_error",
  S3ClientError = "s3_client_error",
  FileNotFoundError = "file_not_found_error",
  InvalidInput = "invalid_input",
}

/**
 * Lightweight error payload for Result-based error paths.
 */
export interface StorageError {
  code: StorageErrorCode;
}

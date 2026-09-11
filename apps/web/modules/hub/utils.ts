/**
 * Standard error shape returned by Hub service functions.
 * `status` 0 means the Hub client was not configured (no HUB_API_KEY).
 */
export type HubError = { status: number; message: string; detail: string };

/** Generic result wrapper for Hub API calls — either data or error, never both. */
export type HubResult<T> = {
  data: T | null;
  error: HubError | null;
};

/**
 * Sentinel error returned when HUB_API_KEY env var is not set and the
 * Hub client cannot be instantiated.
 */
export const NO_CONFIG_ERROR = {
  status: 0,
  message: "HUB_API_KEY is not set; Hub integration is disabled.",
  detail: "HUB_API_KEY is not set; Hub integration is disabled.",
} as const;

/**
 * Extract a human-readable error message from an unknown value.
 */
export const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
};

// Duck-typed: `instanceof` against the SDK error class breaks under Next dev/Turbopack
// when @formbricks/hub is loaded into more than one module scope.
/**
 * Duck-typed HTTP status extraction. Uses a duck-type check instead of
 * instanceof because the Hub SDK error class may be loaded in a different
 * module scope under Turbopack.
 *
 * @param err — the error to inspect
 * @returns — the numeric status, or 0 if not found
 */
export const getErrorStatus = (err: unknown): number =>
  err && typeof err === "object" && typeof (err as { status?: unknown }).status === "number"
    ? (err as { status: number }).status
    : 0;

/**
 * Convert an unknown error into a standard HubResult with the error
 * populated and data set to null.
 */
export const createHubResultFromError = <T>(err: unknown): HubResult<T> => {
  const status = getErrorStatus(err);
  const message = getErrorMessage(err);
  return { data: null, error: { status, message, detail: message } };
};

/**
 * Serialise an object to a URL query string (`?key=value&...`).
 * `undefined` values are omitted (not provided); empty strings are
 * preserved (they represent the "no source" taxonomy bucket).
 *
 * @param params — key-value pairs (values can be strings, numbers, or undefined)
 * @returns — the serialised query string including leading `?`, or empty string
 */
export const toQueryString = (params: Record<string, string | number | undefined>): string => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    // Only `undefined` is omitted ("not provided"). Empty strings are preserved: a taxonomy
    // scope with source_id="" is the "no source" bucket — a real, comparable scope value, not
    // the absence of a filter. Dropping it would make active-tree/run reads behave like
    // "no source filter" instead of "the unattributed bucket". See Hub PR #88.
    if (value !== undefined) {
      query.set(key, String(value));
    }
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
};

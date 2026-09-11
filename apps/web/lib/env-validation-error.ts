/** Represents a segment of an environment-variable validation issue path. Can be a plain key or an object with a `key` property for structured path segments. */
type TEnvValidationIssuePathSegment = PropertyKey | { readonly key: PropertyKey };

/** Describes a single validation problem encountered during environment-variable parsing. Used by `throwEnvValidationError` to surface detailed startup errors. */
export type TEnvValidationIssue = {
  readonly message: string;
  readonly path?: ReadonlyArray<TEnvValidationIssuePathSegment>;
};

type TEnvValidationIssueLogEntry = {
  readonly path: string;
  readonly message: string;
};

const formatPathSegment = (segment: TEnvValidationIssuePathSegment): string => {
  if (typeof segment === "object" && segment !== null && "key" in segment) {
    return String(segment.key);
  }

  return String(segment);
};

const getEnvValidationIssuePath = (issue: TEnvValidationIssue): string =>
  issue.path?.length ? issue.path.map(formatPathSegment).join(".") : "unknown";

const sanitizeEnvValidationIssuesForLogging = (
  issues: readonly TEnvValidationIssue[]
): TEnvValidationIssueLogEntry[] =>
  issues.map((issue) => ({
    path: getEnvValidationIssuePath(issue),
    message: issue.message,
  }));

/**
 * Formats a single validation issue into a human-readable line.
 *
 * @param issue — the validation issue to format
 * @returns — "path: message"
 */
export const formatEnvValidationIssue = (issue: TEnvValidationIssue): string => {
  return `${getEnvValidationIssuePath(issue)}: ${issue.message}`;
};

/**
 * Builds a complete error message string from a list of validation issues.
 *
 * @param issues — every problem found during env validation
 * @returns — a multi-line string prefixed with "Invalid environment variables:"
 */
export const formatEnvValidationErrorMessage = (issues: readonly TEnvValidationIssue[]): string => {
  const formattedIssues = issues.map((issue) => `  - ${formatEnvValidationIssue(issue)}`).join("\n");

  return `Invalid environment variables:\n${formattedIssues}`;
};

/**
 * Called by `@t3-oss/env-nextjs` on validation failure.
 * Logs a structured error to the console then throws so the process never
 * starts with a misconfigured environment.
 *
 * @param issues — every validation issue from the env schema
 */
export const throwEnvValidationError = (issues: readonly TEnvValidationIssue[]): never => {
  const message = formatEnvValidationErrorMessage(issues);

  console.error(message, { issues: sanitizeEnvValidationIssuesForLogging(issues) });
  throw new Error(message);
};

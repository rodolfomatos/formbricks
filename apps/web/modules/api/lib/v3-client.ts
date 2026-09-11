export type TV3InvalidParam = {
  name: string;
  reason: string;
};

type TV3ProblemBody = {
  status?: number;
  detail?: string;
  code?: string;
  requestId?: string;
  invalid_params?: TV3InvalidParam[];
};

/**
 * Structured API error representing a failed V3 API request with problem-detail fields.
 * Carries the HTTP status, optional error code, request ID for tracing, and invalid parameter details.
 */
export class V3ApiError extends Error {
  status: number;
  code?: string;
  requestId?: string;
  invalid_params?: TV3InvalidParam[];

  constructor({
    status,
    detail,
    code,
    requestId,
    invalid_params,
  }: {
    status: number;
    detail: string;
    code?: string;
    requestId?: string;
    invalid_params?: TV3InvalidParam[];
  }) {
    super(detail);
    this.name = "V3ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.invalid_params = invalid_params;
  }

  get detail(): string {
    return this.message;
  }
}

/**
 * Extracts a user-facing error message from an unknown error, with a fallback.
 *
 * @param error — The caught error value
 * @param fallbackMessage — Default message if the error can't be parsed
 * @returns — The extracted or fallback message
 */
export function getV3ApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof V3ApiError) {
    return error.detail;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

/**
 * Parses a Fetch API Response into a structured V3ApiError.
 * Attempts to extract problem-detail body fields from the response JSON.
 *
 * @param response — The fetch Response object to parse
 * @returns — A parsed V3ApiError with status, detail, and optional metadata
 */
export async function parseV3ApiError(response: Response): Promise<V3ApiError> {
  let problemBody: TV3ProblemBody | undefined;

  try {
    problemBody = (await response.json()) as TV3ProblemBody;
  } catch {
    problemBody = undefined;
  }

  return new V3ApiError({
    status: problemBody?.status ?? response.status,
    detail: problemBody?.detail ?? response.statusText ?? "An unexpected error occurred.",
    code: problemBody?.code,
    requestId: problemBody?.requestId ?? response.headers.get("X-Request-Id") ?? undefined,
    invalid_params: problemBody?.invalid_params,
  });
}

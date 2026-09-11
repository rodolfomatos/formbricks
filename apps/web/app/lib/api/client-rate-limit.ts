import { TooManyRequestsError } from "@formbricks/types/errors";
import { reportApiError } from "@/app/lib/api/api-error-reporter";
import { responses } from "@/app/lib/api/response";

const rateLimitMessage = "Maximum number of requests reached. Please try again later.";
const unexpectedErrorMessage = "Something went wrong. Please try again.";

/**
 * Type guard that checks whether an unknown error represents a
 * TooManyRequestsError (from @formbricks/types/errors or the error name).
 */
export const isTooManyRequestsError = (error: unknown): boolean => {
  return (
    error instanceof TooManyRequestsError || (error instanceof Error && error.name === "TooManyRequestsError")
  );
};

/**
 * Returns a 429 too-many-requests response if the error is a rate-limit error,
 * otherwise logs it and returns a 500 internal server error.
 */
export const getRateLimitErrorResponse = ({
  request,
  error,
  cors = true,
}: {
  request: Request;
  error: unknown;
  cors?: boolean;
}): Response => {
  if (isTooManyRequestsError(error)) {
    return responses.tooManyRequestsResponse(rateLimitMessage, cors);
  }

  const response = responses.internalServerErrorResponse(unexpectedErrorMessage, cors);
  reportApiError({
    request,
    status: response.status,
    error,
  });
  return response;
};

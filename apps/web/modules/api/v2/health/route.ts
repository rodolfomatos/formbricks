import { responses } from "@/modules/api/v2/lib/response";
import { performHealthChecks } from "./lib/health-checks";

/**
 * Handles GET requests for `/api/v2/health`. Requires API key authentication. Returns the requested resource(s).
 *
 * @param request — The incoming Next.js Request object
 * @param props — Route parameters including dynamic segments
 * @returns — A Next.js Response with the operation result
 */
export const GET = async () => {
  const healthStatusResult = await performHealthChecks();
  if (!healthStatusResult.ok) {
    return responses.serviceUnavailableResponse({
      details: healthStatusResult.error.details,
    });
  }

  return responses.successResponse({
    data: healthStatusResult.data,
  });
};

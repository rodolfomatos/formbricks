import { responses } from "@/app/lib/api/response";
import { withV1ApiWrapper } from "@/app/lib/api/with-api-logging";
import { putResponseHandler } from "./lib/put-response-handler";

export const OPTIONS = async (): Promise<Response> => {
  return responses.successResponse({}, true);
};

/**
 * PUT /api/v1/client/[workspaceId]/responses/[responseId]
 * Updates an existing response. Delegates to putResponseHandler which handles
 * quota evaluation and pipeline events.
 */
export const PUT = withV1ApiWrapper({
  handler: putResponseHandler,
});

import { TAuthenticationApiKey } from "@formbricks/types/auth";
import { Result, err, ok } from "@formbricks/types/error-handlers";
import {
  type AuthenticateApiKeyOptions,
  authenticateApiKeyFromHeaders,
} from "@/modules/api/lib/api-key-auth";
import { ApiErrorResponseV2 } from "@/modules/api/v2/types/api-error";

/**
 * Authenticates an incoming API request by extracting and validating the API key from headers.
 *
 * @param request — The incoming request with authorization headers
 * @param options — Optional configuration (e.g., allowOrganizationOnlyApiKey)
 * @returns — The authentication result with key permissions or an error
 */
export const authenticateRequest = async (
  request: Request,
  options: AuthenticateApiKeyOptions = {}
): Promise<Result<TAuthenticationApiKey, ApiErrorResponseV2>> => {
  const authentication = await authenticateApiKeyFromHeaders(request.headers, options);
  if (!authentication) return err({ type: "unauthorized" });
  return ok(authentication);
};

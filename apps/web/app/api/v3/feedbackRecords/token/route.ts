import { withV3ApiWrapper } from "@/app/api/v3/lib/api-wrapper";
import { createGatewayServiceTokenResponse } from "@/modules/gateway-auth/lib/token";

/**
 * POST /api/v3/feedbackRecords/token
 * Creates a gateway service token for the feedbackRecords service. Session auth only.
 */
export const POST = withV3ApiWrapper({
  auth: "session",
  handler: async ({ authentication }) => {
    return createGatewayServiceTokenResponse(authentication, "feedbackRecords");
  },
});

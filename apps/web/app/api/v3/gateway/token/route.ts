import { z } from "zod";
import { withV3ApiWrapper } from "@/app/api/v3/lib/api-wrapper";
import { ZGatewayAuthService } from "@/modules/gateway-auth/lib/service";
import { createGatewayServiceTokenResponse } from "@/modules/gateway-auth/lib/token";

/**
 * POST /api/v3/gateway/token
 * Creates a gateway service token for a specified service. Session auth only.
 */
export const POST = withV3ApiWrapper({
  auth: "session",
  schemas: {
    body: z.object({
      service: ZGatewayAuthService,
    }),
  },
  handler: async ({ authentication, parsedInput }) => {
    return createGatewayServiceTokenResponse(authentication, parsedInput.body.service);
  },
});

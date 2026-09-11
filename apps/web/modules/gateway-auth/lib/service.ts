import { z } from "zod";

/**
 * Registry of gateway-auth services and the JWT purpose each uses for
 * its service tokens. Add new services here rather than duplicating the
 * purpose string.
 */
export const gatewayAuthServices = {
  feedbackRecords: {
    tokenPurpose: "feedback_records_gateway",
  },
} as const;

const gatewayAuthServiceKeys = Object.keys(gatewayAuthServices) as [
  keyof typeof gatewayAuthServices,
  ...(keyof typeof gatewayAuthServices)[],
];

export const ZGatewayAuthService = z.enum(gatewayAuthServiceKeys);

export type TGatewayAuthService = z.infer<typeof ZGatewayAuthService>;

/**
 * Look up the JWT token purpose for a given gateway auth service.
 *
 * @param service — the service key
 * @returns — the JWT purpose string
 */
export const getGatewayAuthServiceTokenPurpose = (service: TGatewayAuthService): string => {
  return gatewayAuthServices[service].tokenPurpose;
};

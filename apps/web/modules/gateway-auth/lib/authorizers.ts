import "server-only";
import { feedbackRecordsGatewayAuthorizer } from "@/modules/hub/feedback-records-gateway";
import { TGatewayRequestAuthorizer } from "./request";

/**
 * The registered set of gateway request authorizers. Each authorizer
 * declares which routes it matches and how to authorise them.
 */
export const gatewayRequestAuthorizers: TGatewayRequestAuthorizer[] = [feedbackRecordsGatewayAuthorizer];

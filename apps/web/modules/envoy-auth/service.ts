import "server-only";
import { NextRequest } from "next/server";
import { gatewayRequestAuthorizers } from "@/modules/gateway-auth/lib/authorizers";
import { authorizeGatewayRequest } from "@/modules/gateway-auth/lib/request";
import { buildEnvoyAllowResponse, parseEnvoyRequestMetadata } from "./shared";

/**
 * Entry-point for the Envoy ext-authz filter. Parses the original upstream
 * request from the Envoy metadata headers and delegates to the shared
 * gateway authorisation pipeline.
 *
 * @param request — the incoming ext-authz check request from Envoy
 * @returns — 200 with headers-to-remove on allow, or 403/302 on deny
 */
export const authorizeEnvoyRequest = async (request: NextRequest): Promise<Response> => {
  const requestMetadata = parseEnvoyRequestMetadata(request);
  if ("errorResponse" in requestMetadata) {
    return requestMetadata.errorResponse;
  }

  return await authorizeGatewayRequest({
    request,
    originalRequest: requestMetadata.originalRequest,
    authorizers: gatewayRequestAuthorizers,
    requestId: request.headers.get("x-request-id") ?? "unknown",
    buildAllowResponse: buildEnvoyAllowResponse,
    unsupportedRouteMessage: "Unsupported Envoy auth route",
  });
};

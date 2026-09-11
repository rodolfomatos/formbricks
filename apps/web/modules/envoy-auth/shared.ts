import "server-only";
import { NextRequest } from "next/server";
import { TGatewayOriginalRequest, buildGatewayStatusResponse } from "@/modules/gateway-auth/lib/request";

const ENVOY_AUTH_PREFIX = "/api/envoy-auth";
const HEADERS_TO_REMOVE_ON_ALLOW = "x-api-key,authorization,cookie";

/**
 * Build a 200 response that tells Envoy which upstream headers to strip
 * before forwarding the request (API key, auth cookie, etc.).
 *
 * @returns — an empty 200 with the x-envoy-auth-headers-to-remove header
 */
export const buildEnvoyAllowResponse = (): Response =>
  new Response(null, {
    status: 200,
    headers: {
      "x-envoy-auth-headers-to-remove": HEADERS_TO_REMOVE_ON_ALLOW,
    },
  });

/**
 * Extract the original upstream request path/method from the Envoy ext-authz
 * URL. Envoy prefixes the real path under /api/envoy-auth/ so we strip it.
 *
 * @param request — the raw ext-authz check request
 * @returns — the reconstructed original request or an error response
 */
export const parseEnvoyRequestMetadata = (
  request: NextRequest
): { originalRequest: TGatewayOriginalRequest } | { errorResponse: Response } => {
  if (!request.nextUrl.pathname.startsWith(`${ENVOY_AUTH_PREFIX}/`)) {
    return {
      errorResponse: buildGatewayStatusResponse(400, "Invalid Envoy auth request path"),
    };
  }

  const originalPathSegments = request.nextUrl.pathname
    .slice(ENVOY_AUTH_PREFIX.length)
    .split("/")
    .filter(Boolean);

  if (originalPathSegments.length === 0) {
    return {
      errorResponse: buildGatewayStatusResponse(400, "Missing original request path"),
    };
  }

  try {
    const originalPathname = originalPathSegments.length > 0 ? `/${originalPathSegments.join("/")}` : "/";
    const originalPath = `${originalPathname}${request.nextUrl.search}`;

    return {
      originalRequest: {
        method: request.method.toUpperCase(),
        url: new URL(originalPath, "https://envoy-auth.local"),
      },
    };
  } catch {
    return {
      errorResponse: buildGatewayStatusResponse(400, "Invalid original request path"),
    };
  }
};

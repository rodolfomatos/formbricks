import "server-only";
import { NextRequest } from "next/server";
import { TGatewayOriginalRequest, buildGatewayStatusResponse } from "@/modules/gateway-auth/lib/request";

const TRAEFIK_AUTH_PREFIX = "/api/traefik-auth";

/**
 * Guard that the pathname starts with the Traefik auth prefix to reject
 * requests hitting this handler from the wrong route.
 */
const isTraefikAuthPath = (pathname: string): boolean =>
  pathname === TRAEFIK_AUTH_PREFIX || pathname.startsWith(`${TRAEFIK_AUTH_PREFIX}/`);

/**
 * Reconstruct the full upstream URL from Traefik's forwarded headers,
 * falling back to the x-forwarded-proto/host when the URI is relative.
 */
const buildForwardedRequestUrl = (request: NextRequest, forwardedUri: string): URL => {
  if (forwardedUri.startsWith("http://") || forwardedUri.startsWith("https://")) {
    return new URL(forwardedUri);
  }

  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "traefik-auth.local";
  const normalizedUri = forwardedUri.startsWith("/") ? forwardedUri : `/${forwardedUri}`;

  return new URL(normalizedUri, `${proto}://${host}`);
};

/**
 * Build a simple 200 response that signals Traefik to forward the request.
 *
 * @returns — an empty 200 response
 */
export const buildTraefikAllowResponse = (): Response => new Response(null, { status: 200 });

/**
 * Extract the original request method and URI from Traefik's
 * x-forwarded-method and x-forwarded-uri headers.
 *
 * @param request — the forward-auth check request
 * @returns — the reconstructed original request or an error response
 */
export const parseTraefikRequestMetadata = (
  request: NextRequest
): { originalRequest: TGatewayOriginalRequest } | { errorResponse: Response } => {
  if (!isTraefikAuthPath(request.nextUrl.pathname)) {
    return {
      errorResponse: buildGatewayStatusResponse(400, "Invalid Traefik auth request path"),
    };
  }

  const forwardedMethod = request.headers.get("x-forwarded-method")?.trim();
  const forwardedUri = request.headers.get("x-forwarded-uri")?.trim();

  if (!forwardedMethod || !forwardedUri) {
    return {
      errorResponse: buildGatewayStatusResponse(400, "Missing original request metadata"),
    };
  }

  try {
    return {
      originalRequest: {
        method: forwardedMethod.toUpperCase(),
        url: buildForwardedRequestUrl(request, forwardedUri),
      },
    };
  } catch {
    return {
      errorResponse: buildGatewayStatusResponse(400, "Invalid original request URI"),
    };
  }
};

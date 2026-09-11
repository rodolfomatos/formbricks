import { NextRequest } from "next/server";
import { authorizeTraefikRequest } from "@/modules/traefik-auth/service";

/**
 * Internal middleware for Traefik reverse proxy authentication.
 * Authorizes incoming requests before they reach the application.
 * All HTTP methods are handled identically.
 */
const handler = async (request: NextRequest): Promise<Response> => {
  return await authorizeTraefikRequest(request);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;

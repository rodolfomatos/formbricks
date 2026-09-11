import { GET, OPTIONS } from "@/app/api/v1/client/[workspaceId]/environment/route";

/**
 * GET  /api/v2/client/[workspaceId]/environment — Re-exports v1 handler.
 * OPTIONS — CORS preflight handler.
 */
export { OPTIONS, GET };

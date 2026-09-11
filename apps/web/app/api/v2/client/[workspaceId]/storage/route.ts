import { OPTIONS, POST } from "@/app/api/v1/client/[workspaceId]/storage/route";

/**
 * POST   /api/v2/client/[workspaceId]/storage — Re-exports v1 handler. Returns signed upload URL.
 * OPTIONS — CORS preflight handler.
 */
export { OPTIONS, POST };

/**
 * GET /health — Simple health check returning `{ status: "ok" }`.
 */
export async function GET() {
  return Response.json({ status: "ok" });
}

import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { err, ok } from "@formbricks/types/error-handlers";

/**
 * Cached retrieval of a segment by ID.
 *
 * @param segmentId — The segment ID
 * @returns — The segment with filters and workspaceId
 */
export const getSegment = reactCache(async (segmentId: string) => {
  try {
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
      select: {
        id: true,
        workspaceId: true,
        filters: true,
      },
    });

    if (!segment) {
      return err({ type: "not_found", details: [{ field: "segment", issue: "not found" }] });
    }

    return ok(segment);
  } catch (error) {
    return err({
      type: "internal_server_error",
      details: [
        { field: "segment", issue: error instanceof Error ? error.message : "Unknown error occurred" },
      ],
    });
  }
});

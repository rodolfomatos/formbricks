import { prisma } from "@formbricks/database";
import type { TBaseFilters, TSegmentFilter } from "@formbricks/types/segment";

export const segmentFilterToPrismaQuery = async (
  _segmentId: string,
  filters: TBaseFilters,
  _workspaceId: string
): Promise<{
  ok: true;
  data: { whereClause: Record<string, unknown> };
} | { ok: false; error: { type: string } }> => {
  const whereClause: Record<string, unknown> = {
    workspaceId: _workspaceId,
  };

  return { ok: true, data: { whereClause } };
};

import { NextRequest } from "next/server";
import { z } from "zod";
import { OrganizationAccessType } from "@formbricks/types/api-key";
import { authenticatedApiClient } from "@/modules/api/v2/auth/authenticated-api-client";
import { responses } from "@/modules/api/v2/lib/response";
import { handleApiError } from "@/modules/api/v2/lib/utils";
import { hasOrganizationIdAndAccess } from "@/modules/api/v2/organizations/[organizationId]/lib/utils";
import { createTeam, getTeams } from "@/modules/api/v2/organizations/[organizationId]/teams/lib/teams";
import {
  ZGetTeamsFilter,
  ZTeamInput,
} from "@/modules/api/v2/organizations/[organizationId]/teams/types/teams";
import { ZOrganizationIdSchema } from "@/modules/api/v2/organizations/[organizationId]/types/organizations";

/**
 * Handles GET requests for `/api/v2/organizations/[organizationId]/teams`. Requires API key authentication. Returns the requested resource(s).
 *
 * @param request — The incoming Next.js Request object
 * @param props — Route parameters including dynamic segments
 * @returns — A Next.js Response with the operation result
 */
export const GET = async (request: NextRequest, props: { params: Promise<{ organizationId: string }> }) =>
  authenticatedApiClient({
    request,
    schemas: {
      query: ZGetTeamsFilter,
      params: z.object({ organizationId: ZOrganizationIdSchema }),
    },
    externalParams: props.params,
    handler: async ({ authentication, parsedInput: { query, params } }) => {
      if (!hasOrganizationIdAndAccess(params!.organizationId, authentication, OrganizationAccessType.Read)) {
        return handleApiError(request, {
          type: "unauthorized",
          details: [{ field: "organizationId", issue: "unauthorized" }],
        });
      }

      const res = await getTeams(authentication.organizationId, query!);

      if (!res.ok) {
        return handleApiError(request, res.error);
      }

      return responses.successResponse(res.data);
    },
  });

/**
 * Handles POST requests for `/api/v2/organizations/[organizationId]/teams`. Requires API key authentication. Creates a new resource.
 *
 * @param request — The incoming Next.js Request object
 * @param request — The incoming Next.js Request object with parsed body
 * @returns — A Next.js Response with the operation result
 */
export const POST = async (request: Request, props: { params: Promise<{ organizationId: string }> }) =>
  authenticatedApiClient({
    request,
    schemas: {
      body: ZTeamInput,
      params: z.object({ organizationId: ZOrganizationIdSchema }),
    },
    externalParams: props.params,
    handler: async ({ authentication, parsedInput: { body, params }, auditLog }) => {
      if (!hasOrganizationIdAndAccess(params!.organizationId, authentication, OrganizationAccessType.Write)) {
        return handleApiError(
          request,
          {
            type: "unauthorized",
            details: [{ field: "organizationId", issue: "unauthorized" }],
          },
          auditLog
        );
      }

      const createTeamResult = await createTeam(body!, authentication.organizationId);
      if (!createTeamResult.ok) {
        return handleApiError(request, createTeamResult.error, auditLog);
      }

      if (auditLog) {
        auditLog.targetId = createTeamResult.data.id;
        auditLog.newObject = createTeamResult.data;
      }

      return responses.createdResponse({ data: createTeamResult.data });
    },
    action: "created",
    targetType: "team",
  });

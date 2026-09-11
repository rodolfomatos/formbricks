"use server";

import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { err, ok } from "@formbricks/types/error-handlers";

/**
 * Cached lookup of workspace ID from a survey or response ID.
 *
 * @param id — The survey or response ID
 * @param isResponseId — Whether the ID belongs to a response
 * @returns — The associated workspace ID
 */
export const fetchWorkspaceId = reactCache(async (id: string, isResponseId: boolean) => {
  try {
    const result = await prisma.survey.findFirst({
      where: isResponseId ? { responses: { some: { id } } } : { id },
      select: {
        workspaceId: true,
      },
    });

    if (!result) {
      return err({
        type: "not_found",
        details: [{ field: isResponseId ? "response" : "survey", issue: "not found" }],
      });
    }

    return ok({ workspaceId: result.workspaceId });
  } catch (error) {
    return err({
      type: "internal_server_error",
      details: [
        {
          field: isResponseId ? "response" : "survey",
          issue: error instanceof Error ? error.message : "Unknown error occurred",
        },
      ],
    });
  }
});

/**
 * Cached lookup of workspace IDs from an array of survey IDs.
 *
 * @param surveyIds — The survey IDs to look up
 * @returns — Array of workspace IDs
 */
export const fetchWorkspaceIdFromSurveyIds = reactCache(async (surveyIds: string[]) => {
  try {
    const results = await prisma.survey.findMany({
      where: { id: { in: surveyIds } },
      select: {
        workspaceId: true,
      },
    });

    if (results.length !== surveyIds.length) {
      return err({
        type: "not_found",
        details: [{ field: "survey", issue: "not found" }],
      });
    }

    return ok(results.map((result) => result.workspaceId));
  } catch (error) {
    return err({
      type: "internal_server_error",
      details: [
        { field: "survey", issue: error instanceof Error ? error.message : "Unknown error occurred" },
      ],
    });
  }
});

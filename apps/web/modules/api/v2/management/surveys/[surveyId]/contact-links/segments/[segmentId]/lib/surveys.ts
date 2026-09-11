import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { err, ok } from "@formbricks/types/error-handlers";

/**
 * Cached retrieval of a survey by ID.
 *
 * @param surveyId — The survey ID
 * @returns — The survey's id, type, workspaceId, and status
 */
export const getSurvey = reactCache(async (surveyId: string) => {
  try {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      select: {
        id: true,
        workspaceId: true,
        type: true,
        status: true,
      },
    });

    if (!survey) {
      return err({ type: "not_found", details: [{ field: "survey", issue: "not found" }] });
    }

    return ok(survey);
  } catch (error) {
    return err({
      type: "internal_server_error",
      details: [
        { field: "survey", issue: error instanceof Error ? error.message : "Unknown error occurred" },
      ],
    });
  }
});

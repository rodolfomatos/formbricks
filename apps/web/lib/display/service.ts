/**
 * Service layer for Displays — records of a survey being shown to a contact.
 *
 * Each display represents a single "impression" event. The service exposes read
 * operations (count, list by survey/contact) plus ownership validation used by
 * the response pipeline to ensure a display hasn't already been responded to
 * or doesn't belong to a different workspace.
 */
import "server-only";
import { cache as reactCache } from "react";
import { z } from "zod";
import { prisma } from "@formbricks/database";
import { Prisma } from "@formbricks/database/prisma";
import { ZId } from "@formbricks/types/common";
import { TDisplay, TDisplayFilters, TDisplayWithContact, ZDisplayFilters } from "@formbricks/types/displays";
import { DatabaseError, InvalidInputError } from "@formbricks/types/errors";
import { validateInputs } from "../utils/validate";

export const selectDisplay = {
  id: true,
  createdAt: true,
  updatedAt: true,
  surveyId: true,
  contactId: true,
} satisfies Prisma.DisplaySelect;

/**
 * Counts displays for a survey, optionally filtered by creation date and response IDs.
 * Used in the survey summary UI to show impression counts.
 *
 * @param surveyId — the survey to count displays for
 * @param filters — optional date range and response-ID inclusion filter
 * @returns — the display count
 */
export const getDisplayCountBySurveyId = reactCache(
  async (surveyId: string, filters?: TDisplayFilters): Promise<number> => {
    validateInputs([surveyId, ZId], [filters, ZDisplayFilters.optional()]);

    if (filters?.responseIds?.length === 0) {
      return 0;
    }

    try {
      const displayCount = await prisma.display.count({
        where: {
          surveyId,
          ...(filters?.createdAt && {
            createdAt: {
              gte: filters.createdAt.min,
              lte: filters.createdAt.max,
            },
          }),
          ...(filters?.responseIds && {
            response: {
              is: {
                id: {
                  in: filters.responseIds,
                },
              },
            },
          }),
        },
      });
      return displayCount;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError(error.message);
      }
      throw error;
    }
  }
);

/**
 * Lists displays for a single contact across all surveys they've interacted with.
 * Used on the contact detail page to show survey interaction history.
 *
 * @param contactId — the contact to fetch displays for
 * @returns — displays sorted newest-first
 */
export const getDisplaysByContactId = reactCache(
  async (contactId: string): Promise<Pick<TDisplay, "id" | "createdAt" | "surveyId">[]> => {
    validateInputs([contactId, ZId]);

    try {
      const displays = await prisma.display.findMany({
        where: { contactId },
        select: {
          id: true,
          createdAt: true,
          surveyId: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return displays;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError(error.message);
      }
      throw error;
    }
  }
);

/**
 * Lists displays for a survey, enriched with contact identity attributes (email, userId).
 * Used in the survey responses view to show who saw the survey.
 *
 * @param surveyId — the survey to fetch displays for
 * @param limit — max records to return (pagination)
 * @param offset — record offset (pagination)
 * @returns — displays with contact attributes
 */
export const getDisplaysBySurveyIdWithContact = reactCache(
  async (surveyId: string, limit?: number, offset?: number): Promise<TDisplayWithContact[]> => {
    validateInputs(
      [surveyId, ZId],
      [limit, z.int().min(1).optional()],
      [offset, z.int().nonnegative().optional()]
    );

    try {
      const displays = await prisma.display.findMany({
        where: {
          surveyId,
          contactId: { not: null },
        },
        select: {
          id: true,
          createdAt: true,
          surveyId: true,
          contact: {
            select: {
              id: true,
              attributes: {
                where: {
                  attributeKey: {
                    key: { in: ["email", "userId"] },
                  },
                },
                select: {
                  attributeKey: { select: { key: true } },
                  value: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });

      return displays.map((display) => ({
        id: display.id,
        createdAt: display.createdAt,
        surveyId: display.surveyId,
        contact: display.contact
          ? {
              id: display.contact.id,
              attributes: display.contact.attributes.reduce(
                (acc, attr) => {
                  acc[attr.attributeKey.key] = attr.value;
                  return acc;
                },
                {} as Record<string, string>
              ),
            }
          : null,
      }));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError(error.message);
      }
      throw error;
    }
  }
);

/**
 * Fetches display + survey data needed to validate whether a new response can be linked.
 * Checks performed by the caller: workspace ownership, survey match, response already exists,
 * and contact match.
 *
 * @param displayId — the display to validate
 * @param tx — optional transaction for atomicity
 * @returns — relevant display fields, or null if not found
 */
export const getDisplayForResponseValidation = async (
  displayId: string,
  tx?: Prisma.TransactionClient
): Promise<{
  surveyId: string;
  workspaceId: string;
  responseId: string | null;
  contactId: string | null;
} | null> => {
  validateInputs([displayId, ZId]);
  const client = tx ?? prisma;
  try {
    const display = await client.display.findUnique({
      where: { id: displayId },
      select: {
        surveyId: true,
        contactId: true,
        response: { select: { id: true } },
        survey: { select: { workspaceId: true } },
      },
    });
    if (!display) return null;
    return {
      surveyId: display.surveyId,
      workspaceId: display.survey.workspaceId,
      responseId: display.response?.id ?? null,
      contactId: display.contactId,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) throw new DatabaseError(error.message);
    throw error;
  }
};

/**
 * Comprehensive guard that validates a display belongs to the expected workspace,
 * survey, contact, and hasn't already been linked to a response. Throws
 * `InvalidInputError` with a specific message on every mismatch.
 *
 * @param displayId — the display to validate
 * @param workspaceId — expected workspace
 * @param surveyId — expected survey
 * @param contactId — expected contact (null for anonymous)
 * @param tx — optional transaction
 */
export const assertDisplayOwnership = async (
  displayId: string,
  workspaceId: string,
  surveyId: string,
  contactId: string | null,
  tx?: Prisma.TransactionClient
): Promise<void> => {
  const display = await getDisplayForResponseValidation(displayId, tx);
  if (!display) throw new InvalidInputError(`Display ${displayId} not found`);
  if (display.workspaceId !== workspaceId)
    throw new InvalidInputError(`Display ${displayId} belongs to a different workspace`);
  if (display.surveyId !== surveyId)
    throw new InvalidInputError(`Display ${displayId} is associated with a different survey`);
  if (display.responseId) throw new InvalidInputError(`Display ${displayId} is already linked to a response`);
  if (display.contactId !== null && display.contactId !== contactId)
    throw new InvalidInputError(`Display ${displayId} belongs to a different contact`);
};

/**
 * Deletes a display record. Exposed for internal cleanup (e.g. deleting responses
 * also removes the linked display) but not through user-facing APIs.
 *
 * @param displayId — the display to delete
 * @param tx — optional transaction
 * @returns — the deleted display
 */
export const deleteDisplay = async (displayId: string, tx?: Prisma.TransactionClient): Promise<TDisplay> => {
  validateInputs([displayId, ZId]);
  try {
    const prismaClient = tx ?? prisma;
    const display = await prismaClient.display.delete({
      where: {
        id: displayId,
      },
      select: selectDisplay,
    });

    return display;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

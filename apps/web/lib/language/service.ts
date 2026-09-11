/**
 * Service layer for Language management within a workspace.
 *
 * Languages are workspace-scoped and can be attached to surveys via
 * SurveyLanguage join records. Deleting or updating a language cascades
 * to clean up stale SurveyLanguage entries.
 */
import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { Prisma } from "@formbricks/database/prisma";
import { logger } from "@formbricks/logger";
import { ZId } from "@formbricks/types/common";
import { DatabaseError, ResourceNotFoundError, ValidationError } from "@formbricks/types/errors";
import {
  TLanguage,
  TLanguageInput,
  TLanguageUpdate,
  ZLanguageInput,
  ZLanguageUpdate,
} from "@formbricks/types/workspace";
import { validateInputs } from "../utils/validate";
import { getWorkspace } from "../workspace/service";

const languageSelect = {
  id: true,
  code: true,
  alias: true,
  workspaceId: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Retrieves a single language by ID.
 *
 * @param languageId — the language to fetch
 * @returns — the language including its workspace ID
 */
export const getLanguage = async (languageId: string): Promise<TLanguage & { workspaceId: string }> => {
  try {
    validateInputs([languageId, ZId]);

    const language = await prisma.language.findFirst({
      where: { id: languageId },
      select: { ...languageSelect, workspaceId: true },
    });

    if (!language) {
      throw new ResourceNotFoundError("Language", languageId);
    }

    return language;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error(error, "Error getting language");
      throw new DatabaseError(error.message);
    }
    throw error;
  }
};

/**
 * Creates a new language in a workspace after validating the workspace exists.
 *
 * @param workspaceId — the workspace to add the language to
 * @param languageInput — language code and optional alias
 * @returns — the created language
 */
export const createLanguage = async (
  workspaceId: string,
  languageInput: TLanguageInput
): Promise<TLanguage> => {
  try {
    validateInputs([workspaceId, ZId], [languageInput, ZLanguageInput]);
    const workspace = await getWorkspace(workspaceId);
    if (!workspace) throw new ResourceNotFoundError("Workspace not found", workspaceId);
    if (!languageInput.code) {
      throw new ValidationError("Language code is required");
    }

    const language = await prisma.language.create({
      data: {
        ...languageInput,
        workspace: {
          connect: { id: workspaceId },
        },
      },
      select: languageSelect,
    });

    return language;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error(error, "Error creating language");
      throw new DatabaseError(error.message);
    }
    throw error;
  }
};

/**
 * Finds all surveys that use a given language. Used to warn before deleting a language.
 *
 * @param languageId — the language to check
 * @returns — names of surveys using this language
 */
export const getSurveysUsingGivenLanguage = reactCache(async (languageId: string): Promise<string[]> => {
  try {
    // Check if the language is used in any survey
    const surveys = await prisma.surveyLanguage.findMany({
      where: {
        languageId: languageId,
      },
      select: {
        survey: {
          select: {
            name: true,
          },
        },
      },
    });

    // Extracting survey names
    const surveyNames = surveys.map((s) => s.survey.name);
    return surveyNames;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error(error, "Error getting surveys using given language");
      throw new DatabaseError(error.message);
    }
    throw error;
  }
});

/**
 * Deletes a language and its associated SurveyLanguage join records.
 *
 * @param languageId — the language to delete
 * @param workspaceId — the owning workspace for validation
 * @returns — the deleted language
 */
export const deleteLanguage = async (languageId: string, workspaceId: string): Promise<TLanguage> => {
  try {
    validateInputs([languageId, ZId], [workspaceId, ZId]);
    const workspace = await getWorkspace(workspaceId);
    if (!workspace) throw new ResourceNotFoundError("Workspace not found", workspaceId);
    const prismaLanguage = await prisma.language.delete({
      where: { id: languageId },
      select: { ...languageSelect, surveyLanguages: { select: { surveyId: true } } },
    });

    // delete unused surveyLanguages
    const language = { ...prismaLanguage, surveyLanguages: undefined };

    return language;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error(error, "Error deleting language");
      throw new DatabaseError(error.message);
    }
    throw error;
  }
};

/**
 * Updates a language's code or alias.
 *
 * @param workspaceId — the owning workspace for validation
 * @param languageId — the language to update
 * @param languageInput — new values
 * @returns — the updated language
 */
export const updateLanguage = async (
  workspaceId: string,
  languageId: string,
  languageInput: TLanguageUpdate
): Promise<TLanguage> => {
  try {
    validateInputs([languageId, ZId], [languageInput, ZLanguageUpdate], [workspaceId, ZId]);
    const workspace = await getWorkspace(workspaceId);
    if (!workspace) throw new ResourceNotFoundError("Workspace not found", workspaceId);
    const prismaLanguage = await prisma.language.update({
      where: { id: languageId },
      data: { ...languageInput, updatedAt: new Date() },
      select: { ...languageSelect, surveyLanguages: { select: { surveyId: true } } },
    });

    // delete unused surveyLanguages
    const language = { ...prismaLanguage, surveyLanguages: undefined };

    return language;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error(error, "Error updating language");
      throw new DatabaseError(error.message);
    }
    throw error;
  }
};

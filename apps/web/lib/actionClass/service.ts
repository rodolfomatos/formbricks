"use server";

import "server-only";
/**
 * Service layer for Action Classes — the taxonomy of user behaviours that can trigger surveys.
 *
 * Action classes define "what a user did" (clicked a button, visited a page, performed a code
 * event). This service provides CRUD operations scoped to a workspace and uses React's `cache()`
 * for request-level deduplication, since action classes are read frequently during survey
 * targeting but change rarely.
 */
import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { ActionClass, Prisma } from "@formbricks/database/prisma";
import { PrismaErrorType } from "@formbricks/database/types/error";
import { TActionClass, TActionClassInput, ZActionClassInput } from "@formbricks/types/action-classes";
import { ZId, ZOptionalNumber, ZString } from "@formbricks/types/common";
import { DatabaseError, ResourceNotFoundError, UniqueConstraintError } from "@formbricks/types/errors";
import { ITEMS_PER_PAGE } from "../constants";
import { validateInputs } from "../utils/validate";

const selectActionClass = {
  id: true,
  createdAt: true,
  updatedAt: true,
  name: true,
  description: true,
  type: true,
  key: true,
  noCodeConfig: true,
  workspaceId: true,
} satisfies Prisma.ActionClassSelect;

/**
 * Lists action classes for a workspace with optional pagination.
 *
 * @param workspaceId — scopes the query to a single workspace
 * @param page — page number (1-based); omit for all results
 * @returns — paginated array of action classes
 */
export const getActionClasses = reactCache(
  async (workspaceId: string, page?: number): Promise<TActionClass[]> => {
    validateInputs([workspaceId, ZId], [page, ZOptionalNumber]);

    try {
      return await prisma.actionClass.findMany({
        where: {
          workspaceId,
        },
        select: selectActionClass,
        take: page ? ITEMS_PER_PAGE : undefined,
        skip: page ? ITEMS_PER_PAGE * (page - 1) : undefined,
        orderBy: {
          createdAt: "asc",
        },
      });
    } catch (error) {
      throw new DatabaseError(`Database error when fetching actions for workspace ${workspaceId}`);
    }
  }
);

/**
 * Looks up an action class by its human-readable name within a workspace.
 * Returns private actions too, which is necessary for survey targeting logic.
 *
 * @param workspaceId — the workspace scope
 * @param name — the action class name (e.g. "Clicked Sign Up")
 * @returns — the matching action class, or null
 */
export const getActionClassByWorkspaceIdAndName = reactCache(
  async (workspaceId: string, name: string): Promise<TActionClass | null> => {
    validateInputs([workspaceId, ZId], [name, ZString]);

    try {
      const actionClass = await prisma.actionClass.findFirst({
        where: {
          name,
          workspaceId,
        },
        select: selectActionClass,
      });

      return actionClass;
    } catch (error) {
      throw new DatabaseError(`Database error when fetching action`);
    }
  }
);

/**
 * Retrieves a single action class by its ID.
 *
 * @param actionClassId — the action class to fetch
 * @returns — the action class, or null if it doesn't exist
 */
export const getActionClass = reactCache(async (actionClassId: string): Promise<TActionClass | null> => {
  validateInputs([actionClassId, ZId]);

  try {
    const actionClass = await prisma.actionClass.findUnique({
      where: {
        id: actionClassId,
      },
      select: selectActionClass,
    });

    return actionClass;
  } catch (error) {
    throw new DatabaseError(`Database error when fetching action`);
  }
});

/**
 * Deletes an action class by ID. Throws `ResourceNotFoundError` if it doesn't exist.
 *
 * @param actionClassId — the action class to delete
 * @returns — the deleted action class
 */
export const deleteActionClass = async (actionClassId: string): Promise<TActionClass> => {
  validateInputs([actionClassId, ZId]);

  try {
    const actionClass = await prisma.actionClass.delete({
      where: {
        id: actionClassId,
      },
      select: selectActionClass,
    });
    if (actionClass === null) throw new ResourceNotFoundError("Action", actionClassId);

    return actionClass;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }
    throw error;
  }
};

/**
 * Creates a new action class within a workspace.
 * Handles code-type (custom key) and noCode-type (UI interaction) actions differently.
 *
 * @param actionClass — the action class input data
 * @returns — the created ActionClass record
 */
export const createActionClass = async (actionClass: TActionClassInput): Promise<ActionClass> => {
  validateInputs([actionClass, ZActionClassInput]);

  const { workspaceId, ...actionClassInput } = actionClass;

  try {
    const actionClassPrisma = await prisma.actionClass.create({
      data: {
        ...actionClassInput,
        workspace: { connect: { id: workspaceId } },
        key: actionClassInput.type === "code" ? actionClassInput.key : undefined,
        noCodeConfig:
          actionClassInput.type === "noCode"
            ? actionClassInput.noCodeConfig === null
              ? undefined
              : actionClassInput.noCodeConfig
            : undefined,
      },
      select: selectActionClass,
    });

    return actionClassPrisma;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === PrismaErrorType.UniqueConstraintViolation
    ) {
      const targetField = (error.meta?.target as string[] | undefined)?.[0];
      throw new UniqueConstraintError(
        `Action with ${targetField} ${targetField ? (actionClass as Record<string, unknown>)[targetField] : ""} already exists`
      );
    }

    throw new DatabaseError(`Database error when creating an action for workspace ${workspaceId}`);
  }
};

/**
 * Updates an existing action class. Only mutable fields are sent; the workspace
 * identity fields in the input are stripped to avoid accidental re-parenting.
 *
 * @param workspaceId — used for authorisation scope
 * @param actionClassId — the action class to update
 * @param inputActionClass — the new values
 * @returns — the updated action class
 */
export const updateActionClass = async (
  workspaceId: string,
  actionClassId: string,
  inputActionClass: TActionClassInput
): Promise<TActionClass> => {
  validateInputs([workspaceId, ZId], [actionClassId, ZId], [inputActionClass, ZActionClassInput]);

  const { workspaceId: __, ...actionClassInput } = inputActionClass;
  try {
    const result = await prisma.actionClass.update({
      where: {
        id: actionClassId,
      },
      data: {
        ...actionClassInput,
        key: actionClassInput.type === "code" ? actionClassInput.key : undefined,
        noCodeConfig:
          actionClassInput.type === "noCode"
            ? actionClassInput.noCodeConfig === null
              ? undefined
              : actionClassInput.noCodeConfig
            : undefined,
      },
      select: {
        ...selectActionClass,
        surveyTriggers: {
          select: {
            surveyId: true,
          },
        },
      },
    });

    return result;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === PrismaErrorType.UniqueConstraintViolation
    ) {
      const targetField = (error.meta?.target as string[] | undefined)?.[0];
      throw new UniqueConstraintError(
        `Action with ${targetField} ${targetField ? (inputActionClass as Record<string, unknown>)[targetField] : ""} already exists`
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }
    throw error;
  }
};

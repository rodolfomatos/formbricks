/**
 * Tag service — simple workspace-scoped tags that can be applied to responses.
 *
 * Tags are identified by name within a workspace (unique constraint) and are
 * linked to responses through a many-to-many relation (TagsOnResponses).
 */
import "server-only";
import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { Prisma } from "@formbricks/database/prisma";
import { PrismaErrorType } from "@formbricks/database/types/error";
import { ZId, ZOptionalNumber, ZString } from "@formbricks/types/common";
import { Result, err, ok } from "@formbricks/types/error-handlers";
import { TTag } from "@formbricks/types/tags";
import { TagError } from "@/modules/workspaces/settings/types/tag";
import { ITEMS_PER_PAGE } from "../constants";
import { validateInputs } from "../utils/validate";

/**
 * Lists all tags in a workspace, paginated.
 *
 * @param workspaceId — the owning workspace
 * @param page — page number (1-based)
 */
export const getTagsByWorkspaceId = reactCache(
  async (workspaceId: string, page?: number): Promise<TTag[]> => {
    validateInputs([workspaceId, ZId], [page, ZOptionalNumber]);

    try {
      const tags = await prisma.tag.findMany({
        where: {
          workspaceId,
        },
        take: page ? ITEMS_PER_PAGE : undefined,
        skip: page ? ITEMS_PER_PAGE * (page - 1) : undefined,
      });

      return tags;
    } catch (error) {
      throw error;
    }
  }
);

/** Retrieves a single tag by ID. */
export const getTag = reactCache(async (id: string): Promise<TTag | null> => {
  validateInputs([id, ZId]);

  try {
    const tag = await prisma.tag.findUnique({
      where: {
        id,
      },
    });

    return tag;
  } catch (error) {
    throw error;
  }
});

/**
 * Creates a tag within a workspace.
 * Returns an error result with TagError.TAG_NAME_ALREADY_EXISTS on name collision.
 *
 * @param workspaceId — the workspace
 * @param name — the tag name
 */
export const createTag = async (
  workspaceId: string,
  name: string
): Promise<Result<TTag, { code: TagError; message: string; meta?: Record<string, string> }>> => {
  validateInputs([workspaceId, ZId], [name, ZString]);

  try {
    const tag = await prisma.tag.create({
      data: {
        name,
        workspaceId,
      },
    });

    return ok(tag);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === PrismaErrorType.UniqueConstraintViolation) {
        return err({
          code: TagError.TAG_NAME_ALREADY_EXISTS,
          message: "Tag with this name already exists",
        });
      }
    }
    return err({
      code: TagError.UNEXPECTED_ERROR,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

/**
 * User service — CRUD for the core User entity.
 *
 * Handles: fetching users by ID/email, updating profile data, cascading user
 * deletion (removing owned organizations, invitations, and notifying Brevo),
 * listing users in an organization, and reading locale preferences.
 */
import "server-only";
import { cache as reactCache } from "react";
import { z } from "zod";
import { prisma } from "@formbricks/database";
import { Prisma } from "@formbricks/database/prisma";
import { PrismaErrorType } from "@formbricks/database/types/error";
import { ZId } from "@formbricks/types/common";
import { DatabaseError, ResourceNotFoundError } from "@formbricks/types/errors";
import { TUser, TUserLocale, TUserUpdateInput, ZUserUpdateInput } from "@formbricks/types/user";
import { deleteOrganization, getOrganizationsWhereUserIsSingleOwner } from "@/lib/organization/service";
import { deleteBrevoCustomerByEmail } from "@/modules/auth/lib/brevo";
import { validateInputs } from "../utils/validate";
import { publicUserSelect } from "./public-user";

/**
 * Retrieves a user's public profile by ID.
 *
 * @param id — the user ID
 * @returns — the user, or null
 */
export const getUser = reactCache(async (id: string): Promise<TUser | null> => {
  validateInputs([id, ZId]);

  try {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: publicUserSelect,
    });

    if (!user) {
      return null;
    }
    return user;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
});

/**
 * Finds a user by their email address.
 *
 * @param email — the email
 * @returns — the matching user, or null
 */
export const getUserByEmail = reactCache(async (email: string): Promise<TUser | null> => {
  validateInputs([email, z.email()]);

  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
      },
      select: publicUserSelect,
    });

    return user;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
});

/**
 * Updates a user's profile fields.
 *
 * @param personId — the user ID
 * @param data — the fields to update
 * @returns — the updated user
 */
export const updateUser = async (personId: string, data: TUserUpdateInput): Promise<TUser> => {
  validateInputs([personId, ZId], [data, ZUserUpdateInput.partial()]);

  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: personId,
      },
      data: data,
      select: publicUserSelect,
    });

    return updatedUser;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === PrismaErrorType.RecordDoesNotExist
    ) {
      throw new ResourceNotFoundError("User", personId);
    }
    throw error; // Re-throw any other errors
  }
};

const deleteUserById = async (id: string): Promise<TUser> => {
  validateInputs([id, ZId]);

  try {
    const user = await prisma.user.delete({
      where: {
        id,
      },
      select: publicUserSelect,
    });
    return user;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

/**
 * Deletes a user and all owned organizations.
 * Also removes invitations they created and notifies Brevo.
 *
 * @param id — the user ID
 * @returns — the deleted user
 */
export const deleteUser = async (id: string): Promise<TUser> => {
  validateInputs([id, ZId]);

  try {
    const organizationsWithSingleOwner = await getOrganizationsWhereUserIsSingleOwner(id);

    for (const organization of organizationsWithSingleOwner) {
      await deleteOrganization(organization.id);
    }

    await prisma.invite.deleteMany({ where: { creatorId: id } });

    const deletedUser = await deleteUserById(id);
    await deleteBrevoCustomerByEmail({ email: deletedUser.email });

    return deletedUser;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

/**
 * Lists all users who belong to a given organization (via membership).
 *
 * @param organizationId — the organization
 * @returns — array of users
 */
export const getUsersWithOrganization = async (organizationId: string): Promise<TUser[]> => {
  validateInputs([organizationId, ZId]);

  try {
    const users = await prisma.user.findMany({
      where: {
        memberships: {
          some: {
            organizationId,
          },
        },
      },
      select: publicUserSelect,
    });

    return users;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

/**
 * Returns the user's locale preference for i18n formatting.
 *
 * @param id — the user ID
 * @returns — locale string, or undefined
 */
export const getUserLocale = reactCache(async (id: string): Promise<TUserLocale | undefined> => {
  validateInputs([id, ZId]);

  try {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: publicUserSelect,
    });

    if (!user) {
      return undefined;
    }
    return user.locale;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
});

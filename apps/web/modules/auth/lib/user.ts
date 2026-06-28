import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { Prisma, PrismaClient } from "@formbricks/database/prisma";
import { PrismaErrorType } from "@formbricks/database/types/error";
import { ZId } from "@formbricks/types/common";
import { DatabaseError, InvalidInputError, ResourceNotFoundError } from "@formbricks/types/errors";
import { TUserCreateInput, TUserUpdateInput, ZUserEmail, ZUserUpdateInput } from "@formbricks/types/user";
import { validateInputs } from "@/lib/utils/validate";

type TUserDbClient = PrismaClient | Prisma.TransactionClient;

const getDbClient = (tx?: Prisma.TransactionClient): TUserDbClient => tx ?? prisma;

/**
 * Updates selected user fields. Returns id, email, locale, and emailVerified.
 * Supports an optional transaction client so callers can bundle this update
 * with other operations (e.g. user creation + SSO identity sync).
 *
 * @param id   - User ID to update
 * @param data - Partial user fields (validated by ZUserUpdateInput)
 * @param tx   - Optional Prisma transaction client
 * @returns Updated user with selected fields
 * @throws ResourceNotFoundError if the user ID does not exist
 */
export const updateUser = async (id: string, data: TUserUpdateInput, tx?: Prisma.TransactionClient) => {
  validateInputs([id, ZId], [data, ZUserUpdateInput.partial()]);

  try {
    const updatedUser = await getDbClient(tx).user.update({
      where: {
        id,
      },
      data: data,
      select: {
        id: true,
        email: true,
        locale: true,
        emailVerified: true,
      },
    });

    return updatedUser;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === PrismaErrorType.RecordDoesNotExist
    ) {
      throw new ResourceNotFoundError("User", id);
    }
    throw error;
  }
};

/**
 * Updates lastLoginAt for the user with the given email, using SELECT FOR UPDATE
 * to prevent concurrent sign-ins from racing on the same row. Returns the previous
 * lastLoginAt value so callers can check if this is the user's first login.
 *
 * @param email - User email (validated by ZUserEmail)
 * @returns Previous lastLoginAt value, or null if this is the first recorded login
 * @throws ResourceNotFoundError if no user with that email exists
 */
export const updateUserLastLoginAt = async (email: string) => {
  validateInputs([email, ZUserEmail]);

  try {
    return await prisma.$transaction(async (tx) => {
      const lockedUsers = await tx.$queryRaw<Array<{ id: string; lastLoginAt: Date | null }>>`
        SELECT "id", "lastLoginAt"
        FROM "User"
        WHERE "email" = ${email}
        FOR UPDATE
      `;
      const lockedUser = lockedUsers[0];

      if (!lockedUser) {
        throw new ResourceNotFoundError("email", email);
      }

      await tx.user.update({
        where: {
          id: lockedUser.id,
        },
        data: {
          lastLoginAt: new Date(),
        },
      });

      return lockedUser.lastLoginAt;
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      throw error;
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === PrismaErrorType.RecordDoesNotExist
    ) {
      throw new ResourceNotFoundError("email", email);
    }
    throw error;
  }
};

/**
 * Looks up a user by email. Cached with React's cache() so multiple lookups
 * within the same request hit the in-memory cache instead of the database.
 * Returns selected fields only — not the full user row.
 *
 * @param email - User email
 * @returns User with selected lookup fields, or null
 * @throws DatabaseError on Prisma client errors
 */
export const getUserByEmail = reactCache(async (email: string) => {
  validateInputs([email, ZUserEmail]);

  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
      },
      select: {
        id: true,
        locale: true,
        email: true,
        emailVerified: true,
        isActive: true,
        identityProvider: true,
      },
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
 * Looks up a user by ID. Cached with React's cache(). Only returns the id
 * field — this is used for existence checks, not for reading user profiles.
 *
 * @param id - User ID
 * @returns User with id field, or null
 * @throws DatabaseError on Prisma client errors
 */
export const getUser = reactCache(async (id: string) => {
  validateInputs([id, ZId]);

  try {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
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
 * Creates a new user record. Supports an optional transaction client so
 * callers (e.g. provisionNewSsoUser) can bundle user creation with SSO
 * identity linking in a single atomic transaction.
 *
 * @param data - User creation input (validated by ZUserUpdateInput)
 * @param tx   - Optional Prisma transaction client
 * @returns Created user with selected fields
 * @throws InvalidInputError if a user with this email already exists
 * @throws DatabaseError on other Prisma client errors
 */
export const createUser = async (data: TUserCreateInput, tx?: Prisma.TransactionClient) => {
  validateInputs([data, ZUserUpdateInput]);
  try {
    const user = await getDbClient(tx).user.create({
      data: data,
      select: {
        name: true,
        notificationSettings: true,
        id: true,
        email: true,
        locale: true,
      },
    });

    return user;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === PrismaErrorType.UniqueConstraintViolation
    ) {
      throw new InvalidInputError("User with this email already exists");
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

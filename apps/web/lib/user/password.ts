/**
 * User password verification — retrieves authentication data and verifies
 * passwords for the profile / settings flow. Not used during sign-in (that
 * path goes through NextAuth credentials provider directly).
 */
import "server-only";
import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { User } from "@formbricks/database/prisma";
import { InvalidInputError, ResourceNotFoundError } from "@formbricks/types/errors";
import { verifyPassword } from "@/modules/auth/lib/utils";

/**
 * Retrieves user authentication credentials needed for password verification.
 * Only exposes email, password hash, and identity provider info.
 *
 * @param userId — the user
 */
export const getUserAuthenticationData = reactCache(
  async (
    userId: string
  ): Promise<Pick<User, "email" | "password" | "identityProvider" | "identityProviderAccountId">> => {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        email: true,
        password: true,
        identityProvider: true,
        identityProviderAccountId: true,
      },
    });

    if (!user) {
      throw new ResourceNotFoundError("user", userId);
    }

    return user;
  }
);

/**
 * Verifies a user's password against the stored hash.
 * Throws InvalidInputError if the user has no password set (SSO-only account).
 *
 * @param userId — the user
 * @param password — the plaintext password to verify
 * @returns — whether the password matches
 */
export const verifyUserPassword = async (userId: string, password: string): Promise<boolean> => {
  const user = await getUserAuthenticationData(userId);

  if (!user.password) {
    throw new InvalidInputError("Password is not set for this user");
  }

  return await verifyPassword(password, user.password);
};

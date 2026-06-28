import "server-only";
import { z } from "zod";
import { prisma } from "@formbricks/database";
import { Prisma, PrismaClient } from "@formbricks/database/prisma";
import { ZId } from "@formbricks/types/common";
import { DatabaseError } from "@formbricks/types/errors";
import { validateInputs } from "@/lib/utils/validate";

type TAuthSessionDbClient = PrismaClient | Prisma.TransactionClient;

const getDbClient = (tx?: Prisma.TransactionClient): TAuthSessionDbClient => tx ?? prisma;

const handleDatabaseError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    throw new DatabaseError(error.message);
  }

  throw error;
};

/**
 * Deletes all database sessions for a user. Used when the user changes their
 * password, enables/disables 2FA, or when an admin deactivates the account.
 * Returns the count of deleted sessions so callers can log it.
 *
 * @param userId - User whose sessions to delete
 * @param tx     - Optional Prisma transaction client
 * @returns Number of deleted session rows
 */
export const deleteSessionsByUserId = async (
  userId: string,
  tx?: Prisma.TransactionClient
): Promise<number> => {
  validateInputs([userId, ZId]);

  try {
    const result = await getDbClient(tx).session.deleteMany({
      where: {
        userId,
      },
    });

    return result.count;
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Deletes a single session by its session token. Used on explicit sign-out
 * to invalidate the current session immediately rather than waiting for
 * the session to expire naturally.
 *
 * @param sessionToken - The NextAuth session token to delete
 * @param tx           - Optional Prisma transaction client
 * @returns Number of deleted session rows (0 or 1)
 */
export const deleteSessionBySessionToken = async (
  sessionToken: string,
  tx?: Prisma.TransactionClient
): Promise<number> => {
  validateInputs([sessionToken, z.string().min(1)]);

  try {
    const result = await getDbClient(tx).session.deleteMany({
      where: {
        sessionToken,
      },
    });

    return result.count;
  } catch (error) {
    return handleDatabaseError(error);
  }
};

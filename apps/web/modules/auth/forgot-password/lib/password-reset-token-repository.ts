import "server-only";
import { z } from "zod";
import { prisma } from "@formbricks/database";
import { Prisma, PrismaClient } from "@formbricks/database/prisma";
import { ZId } from "@formbricks/types/common";
import { DatabaseError } from "@formbricks/types/errors";
import { validateInputs } from "@/lib/utils/validate";

const passwordResetTokenSelection = {
  id: true,
  userId: true,
  tokenHash: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PasswordResetTokenSelect;

const ZTokenHash = z.string().min(1);

type TPasswordResetTokenDbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Selection type for password-reset token records returned by this
 * repository — includes id, userId, tokenHash, expiresAt, createdAt,
 * updatedAt.
 */
export type TPasswordResetTokenRecord = Prisma.PasswordResetTokenGetPayload<{
  select: typeof passwordResetTokenSelection;
}>;

/**
 * Returns the appropriate Prisma client: the transaction client if one
 * is provided, otherwise the default prisma instance.  Allows this
 * repository's functions to participate in transactions when called
 * from a service that passes tx.
 */
const getDbClient = (tx?: Prisma.TransactionClient): TPasswordResetTokenDbClient => tx ?? prisma;

/**
 * Wraps Prisma known-request errors in a typed DatabaseError.
 * Re-throws unknown errors as-is so they propagate up to the
 * caller without being swallowed.
 */
const handleDatabaseError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    throw new DatabaseError(error.message);
  }

  throw error;
};

/**
 * Creates or replaces an active password-reset token for a user (one
 * token per user — upsert on userId).  Any previous token is silently
 * invalidated because the hash is overwritten.  Used at step 1 of the
 * password-reset flow (request phase).
 *
 * @param userId    - The user requesting the reset
 * @param tokenHash - SHA-256 hash of the raw token (never store raw)
 * @param expiresAt - When the token should be considered expired
 * @param tx        - Optional Prisma transaction client
 * @returns The upserted token record
 */
export const upsertActiveToken = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  tx?: Prisma.TransactionClient
): Promise<TPasswordResetTokenRecord> => {
  validateInputs([userId, ZId], [tokenHash, ZTokenHash], [expiresAt, z.date()]);

  try {
    return await getDbClient(tx).passwordResetToken.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        tokenHash,
        expiresAt,
      },
      update: {
        tokenHash,
        expiresAt,
      },
      select: passwordResetTokenSelection,
    });
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Looks up a password-reset token by its hash.  Returns null if no
 * token with this hash exists (expired or never issued).  Used at
 * step 2 of the password-reset flow (validation phase) to confirm
 * the token exists before consumption.
 *
 * @param tokenHash - SHA-256 hash to search for
 * @param tx        - Optional Prisma transaction client
 * @returns The token record or null
 */
export const findByTokenHash = async (
  tokenHash: string,
  tx?: Prisma.TransactionClient
): Promise<TPasswordResetTokenRecord | null> => {
  validateInputs([tokenHash, ZTokenHash]);

  try {
    return await getDbClient(tx).passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
      select: passwordResetTokenSelection,
    });
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Deletes all tokens matching the given hash.  Used during cleanup
 * after password-reset is completed or when reissuing a token for
 * the same user (the old hash is deleted before the new one is
 * upserted).
 *
 * @param tokenHash - SHA-256 hash to delete
 * @param tx        - Optional Prisma transaction client
 * @returns The number of deleted records (0 or 1)
 */
export const deleteByTokenHash = async (
  tokenHash: string,
  tx?: Prisma.TransactionClient
): Promise<number> => {
  validateInputs([tokenHash, ZTokenHash]);

  try {
    const result = await getDbClient(tx).passwordResetToken.deleteMany({
      where: {
        tokenHash,
      },
    });

    return result.count;
  } catch (error) {
    return handleDatabaseError(error);
  }
};

/**
 * Atomically consumes an active password-reset token: deletes it only
 * if the hash matches AND expiresAt > now.  This single-operation
 * deleteMany prevents replay attacks — the same raw token cannot be
 * used twice.  MUST run inside a transaction (tx is required, not
 * optional) because the caller wraps it with the password update.
 *
 * @param tokenHash - SHA-256 hash of the token to consume
 * @param now       - Current timestamp (passed in to keep the service
 *                    layer in control of time)
 * @param tx        - Prisma transaction client (required)
 * @returns The number of deleted records (0 = expired or already used)
 */
export const consumeActiveToken = async (
  tokenHash: string,
  now: Date,
  tx: Prisma.TransactionClient
): Promise<number> => {
  validateInputs([tokenHash, ZTokenHash], [now, z.date()]);

  try {
    const result = await tx.passwordResetToken.deleteMany({
      where: {
        tokenHash,
        expiresAt: {
          gt: now,
        },
      },
    });

    return result.count;
  } catch (error) {
    return handleDatabaseError(error);
  }
};

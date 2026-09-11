/**
 * Service layer for Provider Account records (OAuth / SSO accounts).
 *
 * Manages the lifecycle of third-party accounts linked to a Formbricks user —
 * creating new ones and upserting tokens when they are refreshed — so the auth
 * system can maintain valid access tokens without interrupting the user.
 */
import { prisma } from "@formbricks/database";
import { Prisma, PrismaClient } from "@formbricks/database/prisma";
import { TAccount, TAccountInput, ZAccountInput } from "@formbricks/types/account";
import { DatabaseError } from "@formbricks/types/errors";
import { validateInputs } from "../utils/validate";

type TAccountDbClient = PrismaClient | Prisma.TransactionClient;

const getDbClient = (tx?: Prisma.TransactionClient): TAccountDbClient => tx ?? prisma;

/**
 * Creates a new provider account record linking a third-party identity to a Formbricks user.
 *
 * @param accountData — the provider account details (provider, providerAccountId, tokens, etc.)
 * @returns — the newly created Account record
 */
export const createAccount = async (accountData: TAccountInput): Promise<TAccount> => {
  validateInputs([accountData, ZAccountInput]);

  try {
    const account = await prisma.account.create({
      data: accountData,
    });
    return account;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

/**
 * Creates or updates a provider account record (keyed on provider + providerAccountId).
 * Used during OAuth callbacks to persist refreshed tokens without creating duplicates.
 *
 * @param accountData — the full account input including immutable identity fields
 * @param tx — optional Prisma transaction for atomicity
 * @returns — the upserted Account record
 */
export const upsertAccount = async (
  accountData: TAccountInput,
  tx?: Prisma.TransactionClient
): Promise<TAccount> => {
  const [validatedAccountData] = validateInputs([accountData, ZAccountInput]);
  const updateAccountData: Omit<TAccountInput, "userId" | "type" | "provider" | "providerAccountId"> = {
    access_token: validatedAccountData.access_token,
    refresh_token: validatedAccountData.refresh_token,
    expires_at: validatedAccountData.expires_at,
    scope: validatedAccountData.scope,
    token_type: validatedAccountData.token_type,
    id_token: validatedAccountData.id_token,
  };

  try {
    const account = await getDbClient(tx).account.upsert({
      where: {
        provider_providerAccountId: {
          provider: validatedAccountData.provider,
          providerAccountId: validatedAccountData.providerAccountId,
        },
      },
      create: validatedAccountData,
      update: updateAccountData,
    });

    return account;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Awaitable } from "next-auth";
import type { Adapter, AdapterAccount } from "next-auth/adapters";
import type { PrismaClient } from "@formbricks/database/prisma";
import { logger } from "@formbricks/logger";
import { resolveAccountProvider } from "@/modules/auth/sso/lib/provider-normalization";

type TProviderAccountKey = Pick<AdapterAccount, "provider" | "providerAccountId">;

/**
 * Normalises the provider field on an adapter key object so the Prisma adapter
 * looks up Account rows with the canonical IdentityProvider value (e.g.
 * "azuread") instead of the raw NextAuth driver name (e.g. "azure-ad").
 */
const normalizeProviderKey = <T extends { provider: string }>(value: T): T => ({
  ...value,
  provider: resolveAccountProvider(value.provider),
});

/**
 * Wraps an adapter method so failures are logged with context before re-throwing.
 * NextAuth converts thrown errors to auth error pages, so this preserves the
 * default behaviour while making adapter-level failures observable in logs.
 *
 * @param method  - Name of the adapter method (for log context)
 * @param handler - The original adapter method to wrap
 * @returns A wrapped function with the same signature
 */
const withAdapterErrorLogging =
  <TArgs extends unknown[], TResult>(method: string, handler: (...args: TArgs) => Awaitable<TResult>) =>
  async (...args: TArgs): Promise<TResult> => {
    try {
      return await handler(...args);
    } catch (error) {
      logger.error(error, `NextAuth Prisma adapter "${method}" failed`);
      throw error;
    }
  };

/**
 * Builds a NextAuth PrismaAdapter that normalises provider names at the boundary.
 * Without normalisation, the adapter's native linkAccount stores "azure-ad" while the
 * SSO handler stores "azuread" — subsequent lookups via getUserByAccount miss the row
 * and NextAuth falls back to matching by email, triggering OAuthAccountNotLinked.
 *
 * The adapter wraps three account methods (getUserByAccount, linkAccount, unlinkAccount)
 * with provider-name normalisation and error logging, and delegates everything else
 * to the stock PrismaAdapter.
 *
 * @param prismaClient - The Prisma client instance
 * @returns A NextAuth Adapter with normalised account methods
 * @throws If PrismaAdapter is missing account methods required for SSO sign-in
 */
export const getNextAuthAdapter = (prismaClient: PrismaClient): Adapter => {
  const baseAdapter = PrismaAdapter(prismaClient as unknown as Parameters<typeof PrismaAdapter>[0]);
  const { getUserByAccount, linkAccount, unlinkAccount } = baseAdapter;

  if (!getUserByAccount || !linkAccount || !unlinkAccount) {
    throw new Error("PrismaAdapter is missing the account methods required for SSO sign-in");
  }

  return {
    ...baseAdapter,
    getUserByAccount: withAdapterErrorLogging("getUserByAccount", (providerAccount: TProviderAccountKey) =>
      getUserByAccount(normalizeProviderKey(providerAccount))
    ),
    linkAccount: withAdapterErrorLogging("linkAccount", (account: AdapterAccount) =>
      linkAccount(normalizeProviderKey(account))
    ),
    unlinkAccount: withAdapterErrorLogging("unlinkAccount", (providerAccount: TProviderAccountKey) =>
      unlinkAccount(normalizeProviderKey(providerAccount))
    ),
  };
};

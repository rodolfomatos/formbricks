import type { Account } from "next-auth";
import { prisma } from "@formbricks/database";
import type { IdentityProvider, Prisma } from "@formbricks/database/prisma";
import { OAUTH_ACCOUNT_NOT_LINKED_ERROR } from "./constants";

/**
 * Prisma `select` shape shared between SSO callback handler and recovery flow.
 * Defined once to guarantee both paths request the same user fields — if one
 * path needed an extra field later, updating this const propagates everywhere.
 */
export const LINKED_SSO_LOOKUP_SELECT = {
  id: true,
  email: true,
  locale: true,
  emailVerified: true,
  isActive: true,
  identityProvider: true,
  identityProviderAccountId: true,
} as const;

/**
 * User shape returned by any lookup that uses LINKED_SSO_LOOKUP_SELECT.
 * Using Prisma's GetPayload keeps the type in sync with the select — if fields
 * are added/removed from the const, TypeScript flags every usage site.
 */
export type TSsoLookupUser = Prisma.UserGetPayload<{
  select: typeof LINKED_SSO_LOOKUP_SELECT;
}>;

/**
 * Minimum data needed to create or find an Account row during SSO sign-in.
 * Token fields are optional because not every OIDC provider returns them —
 * some (e.g. certain IdP setups) only issue an id_token with no access_token.
 * We store what we get; refresh will work if refresh_token is present.
 */
export type TSsoAccountLinkInput = Pick<Account, "type" | "provider" | "providerAccountId"> &
  Partial<
    Pick<Account, "access_token" | "refresh_token" | "expires_at" | "scope" | "token_type" | "id_token">
  >;

/**
 * Token fields storable on an Account row for session continuation.
 * Keeping this as a const array means adding a new token field (e.g. `session_state`)
 * requires changing only this one list — the upsert logic iterates it automatically.
 */
const ACCOUNT_TOKEN_FIELDS = [
  "access_token",
  "refresh_token",
  "expires_at",
  "scope",
  "token_type",
  "id_token",
] as const;

type TAccountTokenField = (typeof ACCOUNT_TOKEN_FIELDS)[number];
type TAccountTokenUpdate = Partial<Pick<TSsoAccountLinkInput, TAccountTokenField>>;

/**
 * Copies one token field from the incoming account into the update object,
 * but only if the field is present — avoids overwriting stored tokens with undefined
 * when the IdP chooses not to re-issue a particular token on every sign-in.
 */
const setAccountTokenField = <TField extends TAccountTokenField>(
  accountTokenUpdate: TAccountTokenUpdate,
  account: TSsoAccountLinkInput,
  field: TField
) => {
  const value = account[field];

  if (value !== undefined) {
    accountTokenUpdate[field] = value;
  }
};

/**
 * Builds an update payload that only includes token fields the incoming account
 * actually carries. Iterating ACCOUNT_TOKEN_FIELDS guarantees we never miss a
 * field if the list is extended later.
 */
const getAccountTokenUpdate = (account: TSsoAccountLinkInput): TAccountTokenUpdate => {
  const accountTokenUpdate: TAccountTokenUpdate = {};

  for (const field of ACCOUNT_TOKEN_FIELDS) {
    setAccountTokenField(accountTokenUpdate, account, field);
  }

  return accountTokenUpdate;
};

/**
 * Upserts an Account row and syncs identityProvider on the User row.
 * Must be atomic: if the upsert succeeds but the user update fails, the
 * orphaned Account row would collide on `provider_providerAccountId` next
 * sign-in and throw OAuthAccountNotLinked. The optional `tx` param lets
 * callers (like provisionNewSsoUser) bundle this with user creation in
 * a single transaction.
 *
 * @param userId      - Target user to link the SSO identity to
 * @param provider    - Canonical IdentityProvider value
 * @param account     - OAuth account data (tokens, providerAccountId)
 * @param tx          - Optional external transaction; if absent, wraps in its own
 * @throws Error(OAUTH_ACCOUNT_NOT_LINKED_ERROR) if the account is already linked to a different user
 */
export const syncSsoIdentityForUser = async ({
  userId,
  provider,
  account,
  tx,
}: {
  userId: string;
  provider: IdentityProvider;
  account: TSsoAccountLinkInput;
  tx?: Prisma.TransactionClient;
}) => {
  const execute = async (transactionTx: Prisma.TransactionClient) => {
    const existingCanonicalAccount = await transactionTx.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: account.providerAccountId,
        },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    // Guard: if the Account row exists but belongs to someone else, refuse
    if (existingCanonicalAccount && existingCanonicalAccount.userId !== userId) {
      throw new Error(OAUTH_ACCOUNT_NOT_LINKED_ERROR);
    }

    if (existingCanonicalAccount) {
      // Refresh tokens in place (common on repeated sign-ins)
      await transactionTx.account.update({
        where: {
          id: existingCanonicalAccount.id,
        },
        data: getAccountTokenUpdate(account),
      });
    } else {
      // First-time link: create the Account row
      await transactionTx.account.create({
        data: {
          userId,
          type: account.type,
          provider,
          providerAccountId: account.providerAccountId,
          ...getAccountTokenUpdate(account),
        },
      });
    }

    // Mirror the identityProvider on User so legacy lookups still work
    await transactionTx.user.update({
      where: {
        id: userId,
      },
      data: {
        identityProvider: provider,
        identityProviderAccountId: account.providerAccountId,
      },
    });
  };

  if (tx) {
    await execute(tx);
  } else {
    await prisma.$transaction(execute);
  }
};

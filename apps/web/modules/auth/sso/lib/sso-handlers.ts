import type { Account } from "next-auth";
import { prisma } from "@formbricks/database";
import type { IdentityProvider } from "@formbricks/database/prisma";
import { logger } from "@formbricks/logger";
import type { TUser } from "@formbricks/types/user";
import { WEBAPP_URL } from "@/lib/constants";
import { getIsFreshInstance } from "@/lib/instance/service";
import { verifyInviteToken } from "@/lib/jwt";
import { createMembership } from "@/lib/membership/service";
import { findMatchingLocale } from "@/lib/utils/locale";
import { redactPII } from "@/lib/utils/logger-helpers";
import { createBrevoCustomer } from "@/modules/auth/lib/brevo";
import { createUser, getUserByEmail, updateUser } from "@/modules/auth/lib/user";
import { getIsValidInviteToken } from "@/modules/auth/signup/lib/invite";
import { LINKED_SSO_LOOKUP_SELECT, syncSsoIdentityForUser } from "./account-linking";
import { getSsoProviderLookupCandidates, normalizeSsoProvider } from "./provider-normalization";
import { startSsoRecovery } from "./sso-recovery";

/**
 * Searches for a user via the Account table using provider + providerAccountId.
 * Iterates through all lookup candidates (canonical + legacy aliases) so that
 * accounts created before provider-name normalisation (e.g. "azure-ad" vs "azuread")
 * are still discoverable and don't block sign-in.
 *
 * @param provider           - Canonical IdentityProvider value
 * @param providerAccountId  - The provider's stable user ID
 * @returns Linked user info + log source tag, or null if not found
 */
const findLinkedSsoUser = async ({
  provider,
  providerAccountId,
}: {
  provider: IdentityProvider;
  providerAccountId: string;
}): Promise<{
  linkedUser: Pick<TUser, "id" | "email">;
  logSource: "account_row";
} | null> => {
  const lookupCandidates = getSsoProviderLookupCandidates(provider);

  for (const lookupProvider of lookupCandidates) {
    const existingLinkedAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: lookupProvider,
          providerAccountId,
        },
      },
      select: {
        id: true,
        user: {
          select: LINKED_SSO_LOOKUP_SELECT,
        },
      },
    });

    if (existingLinkedAccount?.user) {
      return {
        linkedUser: existingLinkedAccount.user,
        logSource: "account_row",
      };
    }
  }

  return null;
};

/**
 * Fallback lookup against the User row directly (legacy format).
 * Before Account rows became canonical, identityProvider + identityProviderAccountId
 * were stored on the User table. This handles users created by older versions
 * of the Formbricks auth system that pre-date the Account-table approach.
 *
 * @param provider           - Canonical IdentityProvider value
 * @param providerAccountId  - The provider's stable user ID
 * @returns User record with lookup fields, or null
 */
const findLegacyExactMatch = async ({
  provider,
  providerAccountId,
}: {
  provider: IdentityProvider;
  providerAccountId: string;
}) =>
  prisma.user.findFirst({
    where: {
      identityProvider: provider,
      identityProviderAccountId: providerAccountId,
    },
    select: LINKED_SSO_LOOKUP_SELECT,
  });

/**
 * Creates a new user + Account row from an SSO sign-in, inside a single
 * transaction to avoid orphaned rows. For non-first-user instances, a valid
 * invite token in the callback URL is required — this prevents unauthenticated
 * sign-ups on existing deployments.
 *
 * Display name resolves through a priority chain of OIDC profile claims:
 * 1. `name` (standard OIDC claim)
 * 2. `given_name` + `family_name` concatenated
 * 3. `preferred_username`
 * 4. Email local-part (sanitised)
 *
 * @param user        - User profile returned by the OIDC provider's profile callback
 * @param account     - NextAuth Account object from the OIDC callback
 * @param provider    - Canonical IdentityProvider value
 * @param callbackUrl - Post-auth redirect URL (may contain invite token)
 * @returns true on success, false if invite validation fails, or a redirect URL string
 */
const provisionNewSsoUser = async ({
  user,
  account,
  provider,
  callbackUrl,
}: {
  user: TUser;
  account: Account;
  provider: IdentityProvider;
  callbackUrl: string;
}): Promise<boolean | string> => {
  let userName = user.name;

  if (provider === "openid") {
    const profile = user as TUser & { given_name?: string; family_name?: string; preferred_username?: string };
    if (profile.name) {
      userName = profile.name;
    } else if (profile.given_name || profile.family_name) {
      userName = [profile.given_name, profile.family_name].filter(Boolean).join(" ");
    } else if (profile.preferred_username) {
      userName = profile.preferred_username;
    }
  }

  const isFirstUser = await getIsFreshInstance();

  if (!isFirstUser) {
    if (callbackUrl) {
      try {
        const parsedUrl = new URL(callbackUrl);
        const inviteToken = parsedUrl.searchParams.get("token");

        if (inviteToken) {
          const { email, inviteId } = verifyInviteToken(inviteToken);
          if (email !== user.email) {
            logger.debug({ reason: "invite_email_mismatch" }, "SSO callback rejected: invite email mismatch");
            return false;
          }

          const isValidInvite = await getIsValidInviteToken(inviteId);
          if (!isValidInvite) {
            logger.debug({ reason: "invalid_invite" }, "SSO callback rejected: invalid invite");
            return false;
          }
        } else {
          logger.debug({ reason: "no_invite_token" }, "SSO callback rejected: no invite token");
          return false;
        }
      } catch {
        logger.debug({ reason: "invite_validation_error" }, "SSO callback rejected: invite validation error");
        return false;
      }
    } else {
      logger.debug({ reason: "no_callback_url" }, "SSO callback rejected: no callback URL");
      return false;
    }
  }

  const matchedLocale = await findMatchingLocale();

  const userProfile = await prisma.$transaction(async (tx) => {
    const createdUser = await createUser(
      {
        name:
          userName ||
          user.email
            .split("@")[0]
            .replace(/[^'\p{L}\p{M}\s\d-]+/gu, " ")
            .trim(),
        email: user.email,
        emailVerified: new Date(Date.now()),
        identityProvider: provider,
        identityProviderAccountId: account.providerAccountId,
        locale: matchedLocale,
      },
      tx
    );

    await syncSsoIdentityForUser({
      userId: createdUser.id,
      provider,
      account: {
        type: account.type,
        provider,
        providerAccountId: account.providerAccountId,
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at,
        scope: account.scope,
        token_type: account.token_type,
        id_token: account.id_token,
      },
      tx,
    });

    return createdUser;
  });

  logger.debug({ newUserId: userProfile.id, identityProvider: provider }, "New SSO user created");

  createBrevoCustomer({ id: userProfile.id, email: userProfile.email });

  return true;
};

/**
 * Top-level entry point called by NextAuth's signIn callback for OAuth/OIDC.
 * Routes the sign-in attempt into one of four branches:
 *
 * 1. **Linked account exists** — refresh tokens, allow sign-in immediately
 * 2. **Legacy User-level identity** — link via Account row, allow sign-in
 * 3. **Existing email user** — initiate SSO recovery (email verification before link)
 * 4. **New user** — create account (requires invite for non-first instances)
 *
 * This function must never throw — NextAuth treats thrown errors as generic
 * failures. Return `false` to deny sign-in, or a redirect URL string to route
 * the user to a specific page (e.g. verification requested).
 *
 * @param user        - User profile from the OIDC provider (may be partial)
 * @param account     - NextAuth Account object from the callback
 * @param callbackUrl - Original post-auth redirect URL
 * @returns `true` to allow sign-in, `false` to deny, or a string URL to redirect
 */
export const handleSsoCallback = async ({
  user,
  account,
  callbackUrl,
}: {
  user: TUser;
  account: Account;
  callbackUrl: string;
}): Promise<boolean | string> => {
  logger.debug(
    {
      ...redactPII({ user, account, callbackUrl }),
      hasEmail: !!user.email,
      hasName: !!user.name,
    },
    "SSO callback initiated"
  );

  if (!user.email || account.type !== "oauth") {
    logger.debug({
      hasEmail: !!user.email,
      accountType: account.type,
      reason: !user.email ? "missing_email" : "invalid_account_type",
    });
    return false;
  }

  const provider = normalizeSsoProvider(account.provider);
  if (!provider) {
    logger.debug({ provider: account.provider }, "SSO callback rejected: unsupported provider");
    return false;
  }

  const existingLinkedUser = await findLinkedSsoUser({
    provider,
    providerAccountId: account.providerAccountId,
  });

  if (existingLinkedUser) {
    await syncSsoIdentityForUser({
      userId: existingLinkedUser.linkedUser.id,
      provider,
      account: {
        type: account.type,
        provider,
        providerAccountId: account.providerAccountId,
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at,
        scope: account.scope,
        token_type: account.token_type,
        id_token: account.id_token,
      },
    });

    logger.debug({ linkedUserId: existingLinkedUser.linkedUser.id }, "SSO callback successful: linked user");
    return true;
  }

  const legacyExactMatch = await findLegacyExactMatch({
    provider,
    providerAccountId: account.providerAccountId,
  });

  if (legacyExactMatch) {
    await syncSsoIdentityForUser({
      userId: legacyExactMatch.id,
      provider,
      account: {
        type: account.type,
        provider,
        providerAccountId: account.providerAccountId,
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at,
        scope: account.scope,
        token_type: account.token_type,
        id_token: account.id_token,
      },
    });

    logger.debug({ linkedUserId: legacyExactMatch.id }, "SSO callback successful: legacy user linked");
    return true;
  }

  const existingUserWithEmail = await getUserByEmail(user.email);

  if (existingUserWithEmail) {
    logger.debug(
      { existingUserId: existingUserWithEmail.id },
      "SSO callback requires inbox verification before linking"
    );

    return startSsoRecovery({
      existingUser: existingUserWithEmail,
      provider,
      account,
      callbackUrl,
    });
  }

  logger.debug({ action: "new_user_creation" }, "No existing user found, proceeding with new user creation");

  return provisionNewSsoUser({
    user,
    account,
    provider,
    callbackUrl,
  });
};

import type { Account } from "next-auth";
import { prisma } from "@formbricks/database";
import type { IdentityProvider, Prisma } from "@formbricks/database/prisma";
import { logger } from "@formbricks/logger";
import { WEBAPP_URL } from "@/lib/constants";
import { createEmailToken, createSsoRelinkIntent, verifySsoRelinkIntent } from "@/lib/jwt";
import { getValidatedCallbackUrl } from "@/lib/utils/url";
import { finalizeSuccessfulSignIn } from "@/modules/auth/lib/sign-in-tracking";
import { buildVerificationRequestedPath } from "@/modules/auth/lib/verification-links";
import { sendVerificationEmail } from "@/modules/email";
import {
  LINKED_SSO_LOOKUP_SELECT,
  TSsoAccountLinkInput,
  TSsoLookupUser,
  syncSsoIdentityForUser,
} from "./account-linking";
import { OAUTH_ACCOUNT_NOT_LINKED_ERROR, SSO_RECOVERY_COMPLETION_PATH } from "./constants";
import { normalizeSsoProvider } from "./provider-normalization";

/**
 * Extended Prisma select for SSO recovery: includes LINKED_SSO_LOOKUP_SELECT fields
 * plus security-sensitive fields (password hash, 2FA secret, backup codes) that the
 * recovery flow may need to clear when reclaiming an unverified email/password account.
 */
const SSO_RECOVERY_USER_SELECT = {
  ...LINKED_SSO_LOOKUP_SELECT,
  backupCodes: true,
  password: true,
  twoFactorEnabled: true,
  twoFactorSecret: true,
} as const;

/**
 * User payload returned when querying with SSO_RECOVERY_USER_SELECT.
 * Includes sensitive auth fields needed by reclaimUnverifiedLocalAuthIfNeeded.
 * Should never be exposed outside this module or logged.
 */
type TSsoRecoveryUser = Prisma.UserGetPayload<{
  select: typeof SSO_RECOVERY_USER_SELECT;
}>;

/**
 * If the user signed up via email/password but never verified their inbox,
 * reclaim the account by clearing local auth credentials. Without this, the
 * user would have two valid auth paths for the same identity — email/password
 * (unverified) and SSO — making account recovery ambiguous.
 */
const reclaimUnverifiedLocalAuthIfNeeded = async ({
  tx,
  user,
}: {
  tx: Prisma.TransactionClient;
  user: TSsoRecoveryUser;
}) => {
  if (user.identityProvider !== "email" || user.emailVerified) {
    return;
  }

  await tx.user.update({
    where: {
      id: user.id,
    },
    data: {
      backupCodes: null,
      emailVerified: new Date(),
      password: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });
};

/**
 * Builds the absolute URL for the SSO recovery completion endpoint with the
 * one-time intent token embedded. This URL goes into the verification email —
 * the user clicks it to prove inbox ownership.
 */
const createSsoRecoveryCompletionUrl = (intentToken: string): string => {
  const completionUrl = new URL(SSO_RECOVERY_COMPLETION_PATH, WEBAPP_URL);
  completionUrl.searchParams.set("intent", intentToken);

  return completionUrl.toString();
};

/**
 * Builds a redirect URL to /auth/login with OAuthAccountNotLinked error
 * and the original callbackUrl preserved. Used when SSO recovery cannot
 * proceed (e.g. invalid intent, session mismatch) so the user sees a
 * meaningful error and can retry rather than hitting a blank error page.
 *
 * @param callbackUrl - Original post-auth redirect destination (preserved in query)
 * @returns Full login URL with error and callbackUrl params
 */
export const getSsoRecoveryFailureRedirectUrl = (callbackUrl?: string): string => {
  const loginUrl = new URL("/auth/login", WEBAPP_URL);
  loginUrl.searchParams.set("error", OAUTH_ACCOUNT_NOT_LINKED_ERROR);

  const validatedCallbackUrl = getValidatedCallbackUrl(callbackUrl, WEBAPP_URL);
  if (validatedCallbackUrl) {
    loginUrl.searchParams.set("callbackUrl", validatedCallbackUrl);
  }

  return loginUrl.toString();
};

/**
 * Sends a verification email to confirm inbox ownership before linking an OIDC
 * account to an existing email/password user. Without this step, a malicious
 * OIDC provider could claim any email address and take over accounts on sign-in.
 *
 * The verification email contains a JWT intent token (created by createSsoRelinkIntent)
 * that encodes the userId, provider, providerAccountId, and callbackUrl. The user
 * must click the link before the SSO identity is linked.
 *
 * @param existingUser - The user found by email who needs to prove inbox control
 * @param provider     - The OIDC provider being linked
 * @param account      - The NextAuth Account object from the OIDC callback
 * @param callbackUrl  - Original post-auth redirect URL
 * @returns Redirect URL to the "verification requested" page the user sees immediately
 * @throws Re-throws any error from email sending or JWT creation with structured logging
 */
export const startSsoRecovery = async ({
  existingUser,
  provider,
  account,
  callbackUrl,
}: {
  existingUser: TSsoLookupUser;
  provider: IdentityProvider;
  account: Account;
  callbackUrl: string;
}): Promise<string> => {
  const originalCallbackUrl = getValidatedCallbackUrl(callbackUrl, WEBAPP_URL) ?? WEBAPP_URL;

  try {
    const recoveryIntent = createSsoRelinkIntent({
      userId: existingUser.id,
      email: existingUser.email,
      provider,
      providerAccountId: account.providerAccountId,
      callbackUrl: originalCallbackUrl,
    });
    const completionUrl = createSsoRecoveryCompletionUrl(recoveryIntent);

    await sendVerificationEmail({
      id: existingUser.id,
      email: existingUser.email,
      locale: existingUser.locale,
      callbackUrl: completionUrl,
      purpose: "sso_recovery",
    });

    logger.info(
      { userId: existingUser.id, provider, callbackUrl: originalCallbackUrl },
      "SSO recovery started"
    );

    return buildVerificationRequestedPath({
      token: createEmailToken(existingUser.email),
      callbackUrl: completionUrl,
      purpose: "sso_recovery",
    });
  } catch (error) {
    logger.error({ error, userId: existingUser.id, provider }, "Failed to start SSO recovery");
    throw error;
  }
};

/**
 * Completes the SSO recovery after the user clicks the verification link.
 * Validates the JWT intent, checks that the signed-in session matches the
 * intent's userId (prevents a different user from completing someone else's
 * recovery), then atomically links the OIDC account and reclaims unverified
 * local auth in a single Prisma transaction.
 *
 * @param intentToken  - JWT from the verification email's link
 * @param sessionUserId - Current session user ID (must match the intent's userId)
 * @returns Validated callback URL to redirect the user to after completion
 * @throws Error(OAUTH_ACCOUNT_NOT_LINKED_ERROR) on any validation or DB failure
 */
export const completeSsoRecovery = async ({
  intentToken,
  sessionUserId,
}: {
  intentToken: string;
  sessionUserId?: string;
}): Promise<string> => {
  let intent: ReturnType<typeof verifySsoRelinkIntent>;

  try {
    intent = verifySsoRelinkIntent(intentToken);
  } catch (error) {
    logger.error({ error }, "Invalid or expired SSO recovery intent");
    throw new Error(OAUTH_ACCOUNT_NOT_LINKED_ERROR);
  }

  const provider = normalizeSsoProvider(intent.provider);

  if (!provider) {
    logger.error({ provider: intent.provider }, "SSO recovery failed due to an invalid provider");
    throw new Error(OAUTH_ACCOUNT_NOT_LINKED_ERROR);
  }

  if (!sessionUserId) {
    logger.error({ userId: intent.userId, provider }, "SSO recovery failed: no signed-in session");
    throw new Error(OAUTH_ACCOUNT_NOT_LINKED_ERROR);
  }

  if (sessionUserId !== intent.userId) {
    logger.error(
      { userId: intent.userId, provider, sessionUserId },
      "SSO recovery failed: session user mismatch"
    );
    throw new Error(OAUTH_ACCOUNT_NOT_LINKED_ERROR);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: intent.userId,
    },
    select: SSO_RECOVERY_USER_SELECT,
  });

  if (user?.email !== intent.email) {
    logger.error({ userId: intent.userId, provider: intent.provider }, "SSO recovery failed: user mismatch");
    throw new Error(OAUTH_ACCOUNT_NOT_LINKED_ERROR);
  }

  await prisma.$transaction(async (tx) => {
    await reclaimUnverifiedLocalAuthIfNeeded({
      tx,
      user,
    });

    const recoveryAccount: TSsoAccountLinkInput = {
      type: "oauth",
      provider,
      providerAccountId: intent.providerAccountId,
    };

    await syncSsoIdentityForUser({
      userId: user.id,
      provider,
      account: recoveryAccount,
      tx,
    });
  });

  try {
    await finalizeSuccessfulSignIn({
      userId: user.id,
      email: user.email,
      provider,
    });
  } catch (error) {
    logger.error(error, "Failed to finalize sign-in after SSO recovery");
  }

  logger.info({ userId: user.id, provider, callbackUrl: intent.callbackUrl }, "SSO recovery completed");

  return getValidatedCallbackUrl(intent.callbackUrl, WEBAPP_URL) ?? WEBAPP_URL;
};

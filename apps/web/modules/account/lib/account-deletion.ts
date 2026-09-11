import "server-only";
import type { IdentityProvider } from "@formbricks/database/prisma";
import { logger } from "@formbricks/logger";
import { AuthorizationError, InvalidInputError, OperationNotAllowedError } from "@formbricks/types/errors";
import { DISABLE_ACCOUNT_DELETION_SSO_CONFIRMATION } from "@/lib/constants";
import { getOrganizationsWhereUserIsSingleOwner } from "@/lib/organization/service";
import { getUserAuthenticationData, verifyUserPassword } from "@/lib/user/password";
import { deleteUser, getUser } from "@/lib/user/service";
import {
  ACCOUNT_DELETION_CONFIRMATION_REQUIRED_ERROR_CODE,
  ACCOUNT_DELETION_EMAIL_MISMATCH_ERROR_CODE,
  DELETE_ACCOUNT_WRONG_PASSWORD_ERROR,
} from "@/modules/account/constants";
import { requiresPasswordConfirmationForAccountDeletion } from "@/modules/account/lib/account-deletion-auth";
import { consumeAccountDeletionSsoReauthentication } from "@/modules/account/lib/account-deletion-sso-reauth";
const getPasswordOrThrow = (password?: string) => {
  if (!password) {
    throw new InvalidInputError(ACCOUNT_DELETION_CONFIRMATION_REQUIRED_ERROR_CODE);
  }

  return password;
};

const assertConfirmationEmailMatches = (confirmationEmail: string, expectedEmail: string) => {
  if (confirmationEmail.toLowerCase() !== expectedEmail.toLowerCase()) {
    throw new AuthorizationError(ACCOUNT_DELETION_EMAIL_MISMATCH_ERROR_CODE);
  }
};

const canBypassSsoIdentityConfirmation = (identityProvider: IdentityProvider) =>
  DISABLE_ACCOUNT_DELETION_SSO_CONFIRMATION && identityProvider !== "email";

const assertAccountDeletionSsoIdentityConfirmation = async ({
  identityProvider,
  providerAccountId,
  userId,
}: {
  identityProvider: IdentityProvider;
  providerAccountId: string | null;
  userId: string;
}) => {
  if (canBypassSsoIdentityConfirmation(identityProvider)) {
    logger.warn(
      { identityProvider, userId },
      "Account deletion SSO identity confirmation bypassed by environment configuration"
    );
    return;
  }

  await consumeAccountDeletionSsoReauthentication({
    identityProvider,
    providerAccountId,
    userId,
  });
};

/**
 * Core account-deletion logic: validates email confirmation, checks
 * password (email/password accounts) or SSO re-authentication marker
 * (social accounts), verifies the user is not the sole owner of an org
 * (when multi-org is disabled), and finally deletes the user record.
 *
 * @param confirmationEmail — the user's email typed for confirmation
 * @param password — required for email/password accounts
 * @param userEmail — the user's current email (from session)
 * @param userId — the user to delete
 * @returns — the old user snapshot (for audit)
 */
export const deleteUserWithAccountDeletionAuthorization = async ({
  confirmationEmail,
  password,
  userEmail,
  userId,
}: {
  confirmationEmail: string;
  password?: string;
  userEmail: string;
  userId: string;
}) => {
  assertConfirmationEmailMatches(confirmationEmail, userEmail);

  const userAuthenticationData = await getUserAuthenticationData(userId);
  assertConfirmationEmailMatches(confirmationEmail, userAuthenticationData.email);

  if (requiresPasswordConfirmationForAccountDeletion(userAuthenticationData)) {
    const isCorrectPassword = await verifyUserPassword(userId, getPasswordOrThrow(password));
    if (!isCorrectPassword) {
      throw new AuthorizationError(DELETE_ACCOUNT_WRONG_PASSWORD_ERROR);
    }
  }

  const oldUser = await getUser(userId);
  if (!oldUser) {
    throw new AuthorizationError("User not found");
  }

  if (!requiresPasswordConfirmationForAccountDeletion(userAuthenticationData)) {
    await assertAccountDeletionSsoIdentityConfirmation({
      identityProvider: userAuthenticationData.identityProvider,
      providerAccountId: userAuthenticationData.identityProviderAccountId,
      userId,
    });
  }

  await deleteUser(userId);

  return { oldUser };
};

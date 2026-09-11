import "server-only";
import type { User } from "@formbricks/database/prisma";

type TAccountDeletionPasswordAuthData = Pick<User, "identityProvider">;

/**
 * Whether the user must supply their password to confirm account deletion.
 * Only email/password accounts require this; SSO accounts use the
 * re-authentication flow instead.
 *
 * @param identityProvider — the user's identity provider
 * @returns — true if password confirmation is required
 */
export const requiresPasswordConfirmationForAccountDeletion = ({
  identityProvider,
}: TAccountDeletionPasswordAuthData): boolean => identityProvider === "email";

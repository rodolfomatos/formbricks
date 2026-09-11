import { type NextRequest, NextResponse } from "next/server";
import { completeAccountDeletionSsoIdentityConfirmationAndGetRedirectPath } from "./lib/account-deletion-sso-complete";

const getIntentSearchParam = (request: NextRequest): string | string[] | undefined => {
  const intentValues = request.nextUrl.searchParams.getAll("intent");

  if (intentValues.length === 0) {
    return undefined;
  }

  return intentValues.length === 1 ? intentValues[0] : intentValues;
};

/**
 * GET /auth/account-deletion/sso/complete
 * Completes account deletion after SSO re-authentication. Verifies the intent
 * token, deletes the user, and redirects to the post-deletion page.
 */
export const GET = async (request: NextRequest) => {
  const redirectPath = await completeAccountDeletionSsoIdentityConfirmationAndGetRedirectPath({
    intent: getIntentSearchParam(request),
  });

  return NextResponse.redirect(new URL(redirectPath, request.url));
};

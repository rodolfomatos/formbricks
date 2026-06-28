import { getValidatedCallbackUrl } from "@/lib/utils/url";

/**
 * Dummy base URL used only to construct relative paths via the URL API.
 * The hostname is irrelevant because we only use pathname + search from
 * the result — never the full URL with origin.
 */
const RELATIVE_URL_BASE = "http://localhost";

/**
 * Supported purposes for email verification links.
 * `email_verification` — standard email verification after sign-up.
 * `sso_recovery` — inbox verification before linking an OIDC account.
 */
export const VERIFICATION_REQUEST_PURPOSES = ["email_verification", "sso_recovery"] as const;
export type TVerificationRequestPurpose = (typeof VERIFICATION_REQUEST_PURPOSES)[number];
const DEFAULT_VERIFICATION_REQUEST_PURPOSE: TVerificationRequestPurpose = "email_verification";

/**
 * Builds a relative path to the verification-requested page with the
 * email token, optional callback URL, and non-default purpose encoded
 * as query params. Returns only pathname + search (never a full URL)
 * so it can be used server-side for redirects regardless of the origin.
 *
 * @param token      - Email verification token
 * @param callbackUrl - Post-verification redirect URL (optional)
 * @param purpose     - Verification purpose (defaults to email_verification)
 * @returns Relative URL path (e.g. "/auth/verification-requested?token=xxx")
 */
export const buildVerificationRequestedPath = ({
  token,
  callbackUrl,
  purpose = DEFAULT_VERIFICATION_REQUEST_PURPOSE,
}: {
  token: string;
  callbackUrl?: string | null;
  purpose?: TVerificationRequestPurpose;
}): string => {
  const verificationRequestedUrl = new URL("/auth/verification-requested", RELATIVE_URL_BASE);
  verificationRequestedUrl.searchParams.set("token", token);

  if (callbackUrl) {
    verificationRequestedUrl.searchParams.set("callbackUrl", callbackUrl);
  }

  if (purpose !== DEFAULT_VERIFICATION_REQUEST_PURPOSE) {
    verificationRequestedUrl.searchParams.set("purpose", purpose);
  }

  return `${verificationRequestedUrl.pathname}${verificationRequestedUrl.search}`;
};

/**
 * Builds both the verification link (for email content) and the
 * verification-requested link (for redirect after sending the email).
 * Accepts separate tokens for each so the email link can use a short-lived
 * token while the redirect uses a different one.
 *
 * @param token                   - Token for the /auth/verify link (goes in email)
 * @param webAppUrl               - Base URL for constructing full URLs
 * @param callbackUrl             - Post-verification redirect (validated to prevent open redirects)
 * @param purpose                 - Verification purpose (optional)
 * @param verificationRequestToken - Token for the redirect page (defaults to same as token)
 * @returns Object with verificationRequestLink (for redirect) and verifyLink (for email)
 */
export const buildVerificationLinks = ({
  token,
  webAppUrl,
  callbackUrl,
  purpose = DEFAULT_VERIFICATION_REQUEST_PURPOSE,
  verificationRequestToken = token,
}: {
  token: string;
  webAppUrl: string;
  callbackUrl?: string | null;
  purpose?: TVerificationRequestPurpose;
  verificationRequestToken?: string;
}): { verificationRequestLink: string; verifyLink: string } => {
  const validatedCallbackUrl = getValidatedCallbackUrl(callbackUrl, webAppUrl);
  const verifyLink = new URL("/auth/verify", webAppUrl);
  verifyLink.searchParams.set("token", token);

  const verificationRequestLink = new URL("/auth/verification-requested", webAppUrl);
  verificationRequestLink.searchParams.set("token", verificationRequestToken);

  if (validatedCallbackUrl) {
    verifyLink.searchParams.set("callbackUrl", validatedCallbackUrl);
    verificationRequestLink.searchParams.set("callbackUrl", validatedCallbackUrl);
  }

  if (purpose !== DEFAULT_VERIFICATION_REQUEST_PURPOSE) {
    verificationRequestLink.searchParams.set("purpose", purpose);
  }

  return {
    verificationRequestLink: verificationRequestLink.toString(),
    verifyLink: verifyLink.toString(),
  };
};

/**
 * NextAuth built-in error name signalled when the OAuth account being used for sign-in
 * is already linked to a different user identity. We reuse this exact string so that
 * NextAuth's built-in error handling surfaces it natively — custom error names would
 * require patching the NextAuth error page.
 */
export const OAUTH_ACCOUNT_NOT_LINKED_ERROR = "OAuthAccountNotLinked";

/**
 * Internal API route that completes SSO recovery after inbox verification.
 * The handler at this endpoint validates the JWT intent token and atomically
 * links the OIDC account. Must be internal (not user-navigable) because the
 * one-time intent token is embedded as a query param.
 */
export const SSO_RECOVERY_COMPLETION_PATH = "/api/auth/sso/recovery/complete";

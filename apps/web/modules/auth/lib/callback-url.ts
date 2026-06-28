import { getValidatedCallbackUrl } from "@/lib/utils/url";

/**
 * NextAuth sets the callback URL in one of two cookie names depending on
 * whether the connection uses HTTPS (__Secure- prefix) or not. Trying both
 * ensures the callback URL is found regardless of the deployment scheme.
 */
export const AUTH_CALLBACK_URL_COOKIE_NAMES = [
  "__Secure-next-auth.callback-url",
  "next-auth.callback-url",
] as const;

type TCookieStore = {
  get: (name: string) => { value: string } | undefined;
};

/**
 * Extracts a single string value from a URL query parameter that may be
 * string, string[], or undefined. This normalises the different formats
 * that Next.js searchParams can arrive in.
 */
const getSearchParamValue = (value?: string | string[]): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

/**
 * Reads the NextAuth callback URL from cookies. Tries the secure cookie
 * first (__Secure- prefix) then falls back to the unsecured name.
 *
 * @param cookieStore - Cookie store object (e.g. from next/headers)
 * @returns The raw callback URL string, or null if not found
 */
export const getAuthCallbackUrlFromCookies = (cookieStore: TCookieStore): string | null => {
  for (const cookieName of AUTH_CALLBACK_URL_COOKIE_NAMES) {
    const callbackUrl = cookieStore.get(cookieName)?.value;

    if (callbackUrl) {
      return callbackUrl;
    }
  }

  return null;
};

/**
 * Resolves the callback URL for post-auth redirect, prioritising the
 * search-param value over the cookie. The cookie fallback is opt-in
 * (allowCookieFallback) because the search param is user-visible and
 * can be validated immediately, while the cookie may have been set by
 * a previous request step.
 *
 * @param searchParamCallbackUrl - callbackUrl from URL search params
 * @param cookieCallbackUrl      - callbackUrl from cookies (nullable)
 * @param allowCookieFallback    - Whether to fall back to the cookie
 * @param webAppUrl              - Base URL for validation
 * @returns Validated callback URL string, or null if none are valid
 */
export const resolveAuthCallbackUrl = ({
  searchParamCallbackUrl,
  cookieCallbackUrl,
  allowCookieFallback = false,
  webAppUrl,
}: {
  searchParamCallbackUrl?: string | string[];
  cookieCallbackUrl?: string | null;
  allowCookieFallback?: boolean;
  webAppUrl: string;
}): string | null => {
  const callbackUrlFromSearchParams = getSearchParamValue(searchParamCallbackUrl);
  const validatedSearchParamCallbackUrl = getValidatedCallbackUrl(callbackUrlFromSearchParams, webAppUrl);

  if (validatedSearchParamCallbackUrl) {
    return validatedSearchParamCallbackUrl;
  }

  if (!allowCookieFallback) {
    return null;
  }

  return getValidatedCallbackUrl(cookieCallbackUrl, webAppUrl);
};

/**
 * Converts a validated callback URL into a relative path (pathname + search + hash).
 * Returns "/" if the input is null/undefined/invalid.
 *
 * @param callbackUrl - Full callback URL to convert
 * @param webAppUrl   - Base URL for validation
 * @returns Relative URL path (e.g. "/surveys?filter=active")
 */
export const getRelativeCallbackUrl = (callbackUrl: string | null | undefined, webAppUrl: string): string => {
  const validatedCallbackUrl = getValidatedCallbackUrl(callbackUrl, webAppUrl);

  if (!validatedCallbackUrl) {
    return "/";
  }

  const parsedCallbackUrl = new URL(validatedCallbackUrl);
  const relativeCallbackUrl = `${parsedCallbackUrl.pathname}${parsedCallbackUrl.search}${parsedCallbackUrl.hash}`;

  return relativeCallbackUrl || "/";
};

/**
 * Extracts the invite token from a callback URL's query params.
 * Returns null if the callback URL is missing, invalid, or has no token param.
 *
 * @param callbackUrl - Full callback URL to extract token from
 * @param webAppUrl   - Base URL for validation
 * @returns Invite token string, or null
 */
export const getInviteTokenFromCallbackUrl = (
  callbackUrl: string | null | undefined,
  webAppUrl: string
): string | null => {
  const validatedCallbackUrl = getValidatedCallbackUrl(callbackUrl, webAppUrl);

  if (!validatedCallbackUrl) {
    return null;
  }

  return new URL(validatedCallbackUrl).searchParams.get("token");
};

/**
 * Wraps getSearchParamValue to always return a string (empty string fallback).
 * Useful for cases where the caller expects a string, not null.
 *
 * @param value - Search param value (string, string[], or undefined)
 * @returns The string value, or "" if not present
 */
export const getSearchParamString = (value?: string | string[]): string => getSearchParamValue(value) ?? "";

/**
 * NextAuth sets the session token in one of two cookie names depending on
 * HTTPS: the __Secure- prefix for secure connections, or the plain name.
 * Trying both ensures the token is found regardless of deployment scheme.
 */
export const NEXT_AUTH_SESSION_COOKIE_NAMES = [
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
] as const;

type TCookieStore = {
  get: (name: string) => { value: string } | undefined;
};

/**
 * Parses a raw Cookie header string for a specific cookie name.
 * Uses manual string splitting rather than a cookie parser library to
 * avoid an extra dependency for this simple extraction pattern.
 *
 * @param cookieHeader - The full Cookie header string
 * @param cookieName   - The cookie name to search for
 * @returns Decoded cookie value, or null if not found
 */
const getCookieValueFromHeader = (cookieHeader: string, cookieName: string): string | null => {
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());

  for (const cookie of cookies) {
    if (!cookie.startsWith(`${cookieName}=`)) {
      continue;
    }

    const cookieValue = cookie.slice(cookieName.length + 1);
    return cookieValue.length > 0 ? decodeURIComponent(cookieValue) : null;
  }

  return null;
};

/**
 * Reads the NextAuth session token from the cookie store (e.g. from
 * next/headers cookies() API). Tries the secure cookie first.
 *
 * @param cookieStore - Cookie store object
 * @returns Session token value, or null
 */
export const getSessionTokenFromCookieStore = (cookieStore: TCookieStore): string | null => {
  for (const cookieName of NEXT_AUTH_SESSION_COOKIE_NAMES) {
    const cookie = cookieStore.get(cookieName);
    if (cookie?.value) {
      return cookie.value;
    }
  }

  return null;
};

/**
 * Reads the NextAuth session token from a raw Cookie header string.
 * Used in contexts where the cookie header is available but the cookie
 * store API is not (e.g. WebSocket upgrade requests).
 *
 * @param cookieHeader - Raw Cookie header string
 * @returns Session token value, or null
 */
export const getSessionTokenFromCookieHeader = (cookieHeader: string | null): string | null => {
  if (!cookieHeader) {
    return null;
  }

  for (const cookieName of NEXT_AUTH_SESSION_COOKIE_NAMES) {
    const cookieValue = getCookieValueFromHeader(cookieHeader, cookieName);
    if (cookieValue) {
      return cookieValue;
    }
  }

  return null;
};

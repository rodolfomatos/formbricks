import { prisma } from "@formbricks/database";
import { getSessionTokenFromCookieStore } from "./session-cookie";

type TCookieStore = {
  get: (name: string) => { value: string } | undefined;
};

type TRequestWithCookies = {
  cookies: TCookieStore;
};

/**
 * Extracts the NextAuth session token from an incoming request's cookies.
 * Delegates to getSessionTokenFromCookieStore which handles both secure
 * (__Secure-) and plain cookie names.
 *
 * @param request - Incoming request with a cookies store
 * @returns Session token string, or null if no valid session cookie exists
 */
export const getSessionTokenFromRequest = (request: TRequestWithCookies): string | null => {
  return getSessionTokenFromCookieStore(request.cookies);
};

/**
 * Looks up a database session from the request cookies without invoking
 * the full NextAuth session API. Used in middleware and API routes where
 * calling getServerSession would be expensive or unavailable.
 *
 * Returns null if the session token is missing, expired, or the user has
 * been deactivated — the caller should treat this as "not authenticated".
 *
 * @param request - Incoming request with cookies
 * @returns Session object (userId, expires, isActive) or null
 */
export const getProxySession = async (request: TRequestWithCookies) => {
  const sessionToken = getSessionTokenFromRequest(request);

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      sessionToken,
    },
    select: {
      userId: true,
      expires: true,
      user: {
        select: {
          isActive: true,
        },
      },
    },
  });

  if (!session || session.expires <= new Date() || session.user.isActive === false) {
    return null;
  }

  return session;
};

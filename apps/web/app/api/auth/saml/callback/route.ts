/**
 * POST /api/auth/saml/callback
 *
 * Receives the SAML Response from the IdP via HTTP-POST binding, validates
 * the assertion, provisions or links the user, creates a NextAuth database
 * session, and redirects the browser to the app.
 *
 * This route bypasses NextAuth's built-in OAuth callback handler because
 * SAML 2.0 uses HTTP POST bindings rather than the OAuth redirect + code
 * exchange flow. After session creation, the user is authenticated and the
 * session cookie is set on the redirect response.
 */
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@formbricks/database";
import { logger } from "@formbricks/logger";
import { SAML_ACS_URL, SAML_AUDIENCE, SAML_IDP_CERT, WEBAPP_URL } from "@/lib/constants";
import { createMembership } from "@/lib/membership/service";
import { createOrganization } from "@/lib/organization/service";
import { findMatchingLocale } from "@/lib/utils/locale";
import { getValidatedCallbackUrl } from "@/lib/utils/url";
import { DEFAULT_WORKSPACE_NAME } from "@/lib/workspace/constants";
import { createUser, getUserByEmail } from "@/modules/auth/lib/user";
import { LINKED_SSO_LOOKUP_SELECT, syncSsoIdentityForUser } from "@/modules/auth/sso/lib/account-linking";
import {
  getSsoProviderLookupCandidates,
  normalizeSsoProvider,
} from "@/modules/auth/sso/lib/provider-normalization";
import { parseSamlResponse } from "@/modules/ee/saml-sso/lib/saml-core";
import { createWorkspace } from "@/modules/workspaces/settings/lib/workspace";

/**
 * Generates a session token using crypto.randomUUID, consistent with
 * NextAuth v4's default generateSessionToken implementation.
 */
const generateSessionToken = (): string => randomUUID();

/**
 * Creates a NextAuth session in the database and returns the session token.
 * NextAuth v4 with database strategy stores sessions as Session rows keyed
 * by a unique sessionToken string.
 */
const createNextAuthSession = async (userId: string): Promise<string> => {
  const sessionToken = generateSessionToken();

  const maxAge = 30 * 24 * 60 * 60; // 30 days (matches NextAuth default)
  const expires = new Date(Date.now() + maxAge * 1000);

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });

  return sessionToken;
};

/**
 * Looks up a user by the SAML Account row (provider + providerAccountId).
 * Iterates through canonical and legacy provider name candidates.
 */
const findLinkedUser = async (provider: string, providerAccountId: string) => {
  const lookupCandidates = getSsoProviderLookupCandidates(provider);

  for (const lookupProvider of lookupCandidates) {
    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: lookupProvider,
          providerAccountId,
        },
      },
      select: {
        userId: true,
        user: {
          select: LINKED_SSO_LOOKUP_SELECT,
        },
      },
    });

    if (account?.user) {
      return account.user;
    }
  }

  return null;
};

/**
 * Attempts to find a user via legacy User-level identity provider fields.
 * The Account model's `provider` field is a free string; the User model's
 * `identityProvider` is the Prisma enum — cast is safe because we pass the
 * canonical IdentityProvider value from normalizeSsoProvider.
 */
const findLegacyUser = async (provider: string, providerAccountId: string) =>
  prisma.user.findFirst({
    where: {
      identityProvider: provider,
      identityProviderAccountId: providerAccountId,
    },
    select: LINKED_SSO_LOOKUP_SELECT,
  });

/**
 * Provisions a new user from SAML attributes inside a transaction.
 */
const provisionUser = async (
  email: string,
  name: string | undefined,
  provider: string,
  providerAccountId: string
) => {
  const matchedLocale = await findMatchingLocale();

  const userProfile = await prisma.$transaction(async (tx) => {
    const createdUser = await createUser(
      {
        name:
          name ||
          email
            .split("@")[0]
            .replace(/[^'\p{L}\p{M}\s\d-]+/gu, " ")
            .trim(),
        email,
        emailVerified: new Date(),
        identityProvider: provider,
        identityProviderAccountId: providerAccountId,
        locale: matchedLocale,
      },
      tx
    );

    await syncSsoIdentityForUser({
      userId: createdUser.id,
      provider,
      account: {
        type: "oauth",
        provider,
        providerAccountId,
      },
      tx,
    });

    return createdUser;
  });

  const organization = await createOrganization({ name: `${userProfile.name}'s Organization` });
  await createMembership(organization.id, userProfile.id, { role: "owner", accepted: true });
  await createWorkspace(organization.id, { name: DEFAULT_WORKSPACE_NAME });

  return userProfile;
};

/**
 * Sets the NextAuth session cookie on the response and clears any stale
 * session cookies from a previous sign-in.
 */
const setSessionCookie = (response: NextResponse, sessionToken: string) => {
  const isSecure = WEBAPP_URL.startsWith("https://");
  const cookiePrefix = isSecure ? "__Secure-" : "";
  const cookieName = `${cookiePrefix}next-auth.session-token`;

  const maxAge = 30 * 24 * 60 * 60;

  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isSecure,
    maxAge,
  });
};

/**
 * POST handler — receives the SAML Response from the IdP.
 */
export const POST = async (request: Request): Promise<Response> => {
  try {
    const formData = await request.formData();
    const samlResponse = formData.get("SAMLResponse") as string | null;
    const relayState = formData.get("RelayState") as string | null;

    if (!samlResponse) {
      logger.error("SAML callback received without SAMLResponse");
      return new Response("Missing SAML Response", { status: 400 });
    }

    // Parse and validate the SAML Response
    const profile = await parseSamlResponse(samlResponse, SAML_AUDIENCE, SAML_IDP_CERT ?? "");

    const canonicalProvider = normalizeSsoProvider("saml");
    if (!canonicalProvider) {
      throw new Error("SAML provider is not registered in the provider map");
    }

    const providerAccountId = profile.email;

    // 1. Check if there is an existing Account link
    const linkedUser = await findLinkedUser(canonicalProvider, providerAccountId);
    if (linkedUser) {
      await syncSsoIdentityForUser({
        userId: linkedUser.id,
        provider: canonicalProvider,
        account: {
          type: "oauth",
          provider: canonicalProvider,
          providerAccountId,
        },
      });

      const sessionToken = await createNextAuthSession(linkedUser.id);
      const callbackUrl = getValidatedCallbackUrl(relayState ?? SAML_ACS_URL, WEBAPP_URL) ?? WEBAPP_URL;
      const response = NextResponse.redirect(callbackUrl);
      setSessionCookie(response, sessionToken);

      logger.debug({ userId: linkedUser.id }, "SAML sign-in: linked user session created");
      return response;
    }

    // 2. Check for a legacy User-level identity record
    const legacyUser = await findLegacyUser(canonicalProvider, providerAccountId);
    if (legacyUser) {
      await syncSsoIdentityForUser({
        userId: legacyUser.id,
        provider: canonicalProvider,
        account: {
          type: "oauth",
          provider: canonicalProvider,
          providerAccountId,
        },
      });

      const sessionToken = await createNextAuthSession(legacyUser.id);
      const callbackUrl = getValidatedCallbackUrl(relayState ?? SAML_ACS_URL, WEBAPP_URL) ?? WEBAPP_URL;
      const response = NextResponse.redirect(callbackUrl);
      setSessionCookie(response, sessionToken);

      logger.debug({ userId: legacyUser.id }, "SAML sign-in: legacy user session created");
      return response;
    }

    // 3. Check if a user with the same email exists
    const existingUser = await getUserByEmail(profile.email);
    if (existingUser) {
      await syncSsoIdentityForUser({
        userId: existingUser.id,
        provider: canonicalProvider,
        account: {
          type: "oauth",
          provider: canonicalProvider,
          providerAccountId,
        },
      });

      const sessionToken = await createNextAuthSession(existingUser.id);
      const callbackUrl = getValidatedCallbackUrl(relayState ?? SAML_ACS_URL, WEBAPP_URL) ?? WEBAPP_URL;
      const response = NextResponse.redirect(callbackUrl);
      setSessionCookie(response, sessionToken);

      logger.debug({ userId: existingUser.id }, "SAML sign-in: email-matched user session created");
      return response;
    }

    // 4. No existing user — create a new one
    const newUser = await provisionUser(profile.email, profile.name, canonicalProvider, providerAccountId);

    const sessionToken = await createNextAuthSession(newUser.id);
    const callbackUrl = getValidatedCallbackUrl(relayState ?? SAML_ACS_URL, WEBAPP_URL) ?? WEBAPP_URL;
    const response = NextResponse.redirect(callbackUrl);
    setSessionCookie(response, sessionToken);

    logger.debug({ userId: newUser.id }, "SAML sign-in: new user created and session issued");
    return response;
  } catch (error) {
    logger.error({ error }, "SAML callback failed");
    const loginUrl = new URL("/auth/login", WEBAPP_URL);
    loginUrl.searchParams.set("error", "OAuthSignin");
    return NextResponse.redirect(loginUrl);
  }
};

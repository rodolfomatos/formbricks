import AzureAD from "next-auth/providers/azure-ad";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import {
  AZUREAD_CLIENT_ID,
  AZUREAD_CLIENT_SECRET,
  AZUREAD_TENANT_ID,
  AZURE_OAUTH_ENABLED,
  GITHUB_ID,
  GITHUB_OAUTH_ENABLED,
  GITHUB_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_OAUTH_ENABLED,
  OIDC_CLIENT_ID,
  OIDC_CLIENT_SECRET,
  OIDC_DISPLAY_NAME,
  OIDC_ISSUER,
  OIDC_OAUTH_ENABLED,
  OIDC_SIGNING_ALGORITHM,
} from "@/lib/constants";

/**
 * Builds the array of OAuth/OIDC provider configurations for NextAuth based on
 * environment variable flags. Each provider is conditionally included only when
 * its corresponding `*_OAUTH_ENABLED` flag is true and credentials are set.
 *
 * The generic OIDC provider is constructed manually (not from a library) so it
 * can work with any OpenID Connect issuer — including self-hosted Keycloak,
 * Authentik, or cloud providers like Okta — unlike the hardcoded provider libs
 * for Google/GitHub/Azure.
 *
 * @returns An array of NextAuth provider configurations (empty if none enabled).
 */
export const getSSOProviders = () => {
  const providers: ReturnType<typeof getSSOProviders> = [];

  if (GOOGLE_OAUTH_ENABLED) {
    providers.push(
      GoogleProvider({
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        checks: ["pkce", "state", "nonce"],
      })
    );
  }

  if (GITHUB_OAUTH_ENABLED) {
    providers.push(
      GitHubProvider({
        clientId: GITHUB_ID,
        clientSecret: GITHUB_SECRET,
      })
    );
  }

  if (AZURE_OAUTH_ENABLED) {
    providers.push(
      AzureAD({
        clientId: AZUREAD_CLIENT_ID,
        clientSecret: AZUREAD_CLIENT_SECRET,
        tenantId: AZUREAD_TENANT_ID,
      })
    );
  }

  if (OIDC_OAUTH_ENABLED) {
    providers.push({
      id: "openid",
      name: OIDC_DISPLAY_NAME || "OpenId",
      type: "oauth" as const,
      clientId: OIDC_CLIENT_ID,
      clientSecret: OIDC_CLIENT_SECRET,
      wellKnown: `${OIDC_ISSUER}/.well-known/openid-configuration`,
      authorization: { params: { scope: "openid email profile" } },
      idToken: true,
      client: {
        id_token_signed_response_alg: OIDC_SIGNING_ALGORITHM || "RS256",
      },
      checks: ["pkce" as const, "state" as const],
      profile: (profile: {
        sub: string;
        name?: string;
        email: string;
        given_name?: string;
        family_name?: string;
        preferred_username?: string;
      }) => {
        let name = profile.name;
        if (!name) {
          if (profile.given_name || profile.family_name) {
            name = [profile.given_name, profile.family_name].filter(Boolean).join(" ");
          } else if (profile.preferred_username) {
            name = profile.preferred_username;
          }
        }

        return {
          id: profile.sub,
          name: name || "",
          email: profile.email,
          given_name: profile.given_name,
          family_name: profile.family_name,
          preferred_username: profile.preferred_username,
        };
      },
    });
  }

  return providers;
};

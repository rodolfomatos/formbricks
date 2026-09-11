/**
 * GET /api/auth/saml/login
 *
 * Initiation endpoint for SAML SSO. When NextAuth's `signIn("saml")` is
 * called, the user-agent is redirected here. This handler generates a
 * SAML AuthnRequest and redirects the browser to the IdP's SSO endpoint
 * using the HTTP-Redirect binding.
 *
 * The AuthnRequest XML is DEFLATE-compressed, base64-encoded, and appended
 * as the `SAMLRequest` query parameter per the SAML 2.0 binding spec.
 *
 * RelayState carries either the user's intended callback URL (from the
 * query param) or falls back to the ACS URL.
 */
import { redirect } from "next/navigation";
import { logger } from "@formbricks/logger";
import { SAML_IDP_SSO_URL } from "@/lib/constants";
import { createSamlAuthnRequestRedirect } from "@/modules/ee/saml-sso/lib/authn-request";

export const GET = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get("callbackUrl") ?? undefined;

  if (!SAML_IDP_SSO_URL) {
    logger.error("SAML SSO login attempted but SAML_IDP_SSO_URL is not configured");
    return new Response("SAML SSO is not configured", { status: 503 });
  }

  const idpRedirectUrl = createSamlAuthnRequestRedirect(callbackUrl);

  logger.debug({ idpRedirectUrl: idpRedirectUrl.replace(/\?.*$/, "?…") }, "Redirecting to SAML IdP");
  redirect(idpRedirectUrl);
};

import "server-only";
import { deflateRawSync } from "node:zlib";
import { logger } from "@formbricks/logger";
import { SAML_ACS_URL, SAML_IDP_SSO_URL } from "@/modules/ee/saml-sso/lib/constants";
import { generateAuthnRequest } from "./saml-core";

export const createSamlAuthnRequestRedirect = (callbackUrl?: string): string => {
  const { samlRequest, relayState } = generateAuthnRequest(callbackUrl ?? SAML_ACS_URL);

  const compressed = deflateRawSync(Buffer.from(samlRequest, "utf-8"));
  const samlRequestBase64 = compressed.toString("base64");

  const params = new URLSearchParams({
    SAMLRequest: samlRequestBase64,
    RelayState: relayState,
  });

  const idpSsoUrl = SAML_IDP_SSO_URL ?? SAML_ACS_URL;
  const redirectUrl = `${idpSsoUrl}?${params.toString()}`;

  logger.debug({ relayState }, "SAML AuthnRequest redirect URL generated");
  return redirectUrl;
};

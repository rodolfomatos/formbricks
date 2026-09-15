import "server-only";
import { SAML_PATH, WEBAPP_URL } from "@/lib/constants";
import { env } from "@/lib/env";

export { SAML_AUDIENCE } from "@/lib/constants";

export const SAML_IDP_SSO_URL = env.SAML_IDP_SSO_URL;

export const SAML_IDP_ENTITY_ID = env.SAML_IDP_ENTITY_ID ?? SAML_IDP_SSO_URL;

export const SAML_IDP_CERT = env.SAML_IDP_CERT;

export const SAML_IDP_METADATA_URL = env.SAML_IDP_METADATA_URL;

export const SAML_ACS_URL = `${WEBAPP_URL}${SAML_PATH}`;

export const SAML_SSO_ENABLED = !!(SAML_IDP_SSO_URL && SAML_IDP_CERT);

export const SAML_PROTOCOL_BINDING = "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" as const;

export const SAML_NAME_ID_FORMAT = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" as const;

export const SAML_ATTRIBUTE_MAPPING = {
  name: ["urn:oid:2.5.4.42", "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name", "displayName", "cn"],
  email: [
    "urn:oid:0.9.2342.19200300.100.1.3",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    "mail",
    "email",
  ],
} as const;
